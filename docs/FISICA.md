# Modelos físicos de Cielo Cerrado

Este documento explica **qué calcula el motor y cómo**, con las fórmulas y las simplificaciones a la vista. El código en `src/physics/` remite a estas secciones (por ejemplo, `ver docs/FISICA.md §6`). Cada modelo tiene pruebas en `tests/` que verifican sus propiedades.

La idea de diseño es la de un **CMO liviano**: modelos simples pero con la forma física correcta (las proporciones y las tendencias importan más que la precisión absoluta), con datos públicos y la incertidumbre explícita.

---

## §1 Convenciones

| Magnitud | Unidad | Nota |
|---|---|---|
| Posición en el mapa (x, y) | km | Desde la esquina noroeste. x crece hacia el este, y hacia el **sur** (como la pantalla) |
| Altura z | m sobre el nivel del mar | AGL = z − terreno |
| Azimut | ° | 0 = norte, sentido horario (`azOf` en `util/math.js`) |
| Velocidades | m/s | La interfaz muestra km/h y Mach (340 m/s) |
| Costos | millones de US$ | |
| Tiempo | s simulados | Paso fijo de 0,25 s (`ui/loop.js`), sea cual sea la velocidad elegida |

**Azar:** todo pasa por `util/rng.js#rnd()`. Con una semilla (`setRandom(seeded(n))`) una corrida es 100% reproducible: así funcionan las pruebas "golden".

---

## §2 Detección radar

### Ecuación del radar

La potencia del eco es `Pr = Pt·G²·λ²·σ / ((4π)³·R⁴)`. Con el resto fijo, el alcance máximo escala como **R ∝ σ^¼**. Cada radar del catálogo trae `R1`, su alcance contra un blanco de 1 m², así que:

```
detR = R1 · σ(banda, aspecto)^¼ · (1 / (1 + J))^¼        (physics/radar.js#detR)
```

`σ(banda, aspecto)` es la RCS del blanco en la banda del radar y vista desde donde está el radar (§3), y `J` la relación interferencia/ruido (§4). Antes de calcular la interferencia, el motor descarta los blancos que están más lejos que el alcance sin interferencia (es una cota exacta: con interferencia el alcance solo baja). Los sensores acústicos y ópticos usan `R1` fijo.

### Barridos y probabilidad de detección

Cada radar barre cada `radar.scan` segundos. Si el blanco está dentro del alcance, del sector y con línea de vista (§8), la probabilidad de detectarlo en ese barrido es:

```
Pd = 0,95                                   si r < 0,8·R
Pd = 0,95 − (r − 0,8·R)/(0,2·R) · 0,65       entre 0,8·R y R  (cae a 0,30 en el límite)
```

Es una aproximación a la curva de Swerling: lejos del límite casi siempre detecta; cerca del borde, a veces sí y a veces no.

### Sectores

`radar.sector` < 360 limita la búsqueda a ±sector/2 alrededor de la orientación `u.az`. Los radares de antena lateral (`radar.side`, como el Erieye) ven dos sectores a ±90° del rumbo. Ver `inSector()`.

### Clima

El clima es fijo durante el escenario (`S.weather`, ver `data/weather.js`): despejado, nublado con techo bajo, lluvia moderada, tormenta o niebla.

**Lluvia sobre el radar** (`physics/weather.js`). La atenuación específica de ida sale de la **Rec. ITU-R P.838-3** (polarización horizontal), con la frecuencia representativa de cada banda (`BANDS[b].ghz`):

```
γ = k(f) · R^α(f)                  [dB/km; R = lluvia en mm/h]
R⁴ · 10^(2γ·min(R, L)/10) = R0⁴    →   R = R0 · 10^(−γ·min(R, L)/20)
```

L (`rainKm`) es el largo máximo del camino dentro de la lluvia: las celdas de lluvia no cubren todo el mapa. Con 4 mm/h, γ ≈ 0,0008 dB/km en S, 0,004 en C, 0,058 en X y 0,21 en Ku. Debajo de 1 GHz (VHF) se toma 0.

**Ópticos, IR y acústicos.** Los sensores `OPT` multiplican su alcance por `wx.opt` y no ven blancos por encima del techo de nubes o niebla (`wx.ceiling`, m sobre el terreno). Los acústicos multiplican por `wx.acu`. Son estimaciones de juego apoyadas en el manual de CMO (la lluvia deja lo visual en 1–5% y degrada mucho el IR; las nubes cortan la línea de vista).

**No se modela:** día y noche, el clutter de lluvia (eco de las gotas), el viento sobre los drones, ni el efecto del clima sobre los buscadores IR de los misiles.

### Sensores no radar

- **Acústico:** detecta solo drones, dentro de `R1` km horizontales y por debajo de `radar.altMax`.
- **Óptico:** usa un alcance fijo con línea de vista.

---

## §3 RCS por banda

`th.rcs` es la RCS **frontal estimada en bandas X/S**. `rcsAt(th, banda)` la ajusta con las reglas de `BANDS[banda].rcs` (en `data/bands.js`, la única fuente de datos de bandas):

| Banda | Regla | Razón física |
|---|---|---|
| VHF | `rcsVHF` propio si existe; si no, ×12 (baja firma), ×4 (σ < 0,05 m²), ×2 (resto) | Resonancia: λ ≈ 1–2 m es del tamaño del blanco; el conformado furtivo pierde efecto |
| L | ×3 (baja firma), ×1,4 (resto) | Todavía cerca de la resonancia para misiles chicos |
| S, C, X | sin cambio | Régimen óptico: manda la forma |
| Ku/Ka | ×1,6 para drones | Las ondas milimétricas "ven" hélices y motores |

### Aspecto (frente, costado, cola)

Cada amenaza tiene `rcs` (frente), `rcsSide` (costado) y `rcsRear` (cola) en bandas X/S. En cada barrido, `aspectCos()` calcula el coseno del ángulo θ entre la velocidad 3D del arma (`th.vel`, que la simulación guarda en cada paso) y la línea arma → radar: 1 de frente, 0 de costado, −1 de cola. `aspectFactor()` interpola **en decibeles**:

```
ln σ(θ) = cos²θ · ln σ_frente + sin²θ · ln σ_costado          (0° ≤ θ ≤ 90°)
ln σ(θ) = cos²θ · ln σ_cola   + sin²θ · ln σ_costado          (90° < θ ≤ 180°)
```

Las reglas de la tabla de arriba se aplican sobre el frente y después se multiplica por σ(θ)/σ_frente. En las **bandas bajas** (`BANDS[b].low`: VHF y L, el rango "A–D" de CMO) el contraste se reduce a la mitad en dB, porque cerca de la resonancia la forma pesa menos.

Ejemplo con el catálogo: un Pantsir (S, 30 km contra 1 m²) ve un Shahed a ≈ 11 km de frente y a ≈ 18 km de costado. En una prueba con el Pantsir a 9 km de una ruta recta, la primera detección llega ≈ 75 s antes que con la RCS frontal sola (`tests/rcs-aspect.test.js`).

La **cobertura** del mapa y las tablas de las fichas usan el frente: es el peor caso para el defensor. Las fichas suman una columna "De costado".

**De dónde salen los números:** OSINT (modelados y mediciones publicados) y la base de datos de *Command: Modern Operations* como segunda opinión. Cuando difieren, el probable es la **media geométrica** y el rango cubre a las dos (ver [DATOS-Y-FUENTES.md](DATOS-Y-FUENTES.md) y [investigacion/mejoras-fisica.md](investigacion/mejoras-fisica.md), anexo J).

**Simplificaciones:** tres aspectos en el plano del arma (sin "arriba/abajo" separado: el ángulo es 3D, así que un balístico en picada hacia el radar cuenta como frente); sin polarización ni frecuencia exacta dentro de cada banda.

---

## §4 Guerra electrónica

### Ruido contra radares

```
J = Σ_jammers  P · G(Δaz) / d²   · 10^(−ECCM/10)        (physics/radar.js#jamJ)

G = 1        si |Δaz| ≤ bw          (lóbulo principal; bw = BANDS[b].bw)
G = 0,05     si |Δaz| ≤ 3·bw        (primeros lóbulos laterales, −13 dB)
G = 0,003    más afuera             (−25 dB)
G ×= 0,1     si el jammer está fuera del sector del radar
```

Solo suman los jammers activos de la **misma banda** con **línea de vista** radar–jammer. `d` es la distancia 3D en km (+1 para evitar la división por cero). `P` es una **potencia relativa de juego**: las potencias reales no son públicas.

El alcance queda en `R' = R·(1/(1+J))^¼`. La Pk de los guiados que dependen del radar se multiplica por `1/(1 + 0,08·J)`, con un piso de 0,5 (§7).

### GNSS

Las armas con `T.gnss` < 1 (dependencia del satélite: 1 = inmune) que entran en el radio de un anti-GNSS acumulan un error de navegación que se suma a la dispersión de la caída (§10):

```
interferencia:  navErr = (1 − gnss) · (300 + U·1500)  m
engaño:         navErr = (1 − gnss) · spoofKm · (0,5 + U)  km     (Pokrova, Lima)
```

Dos correcciones (`physics/navigation.js`):
- **Corrección por terreno** (`T.navFix`: Kh-101, Kalibr, Storm Shadow): el arma compara el terreno con su mapa, nota que el GNSS falso no coincide y lo descarta. Contra un engaño queda como con interferencia (error de cientos de metros, no de kilómetros).
- **Buscador terminal** (`T.seekerKm`): si `navErr` ≤ `seekerKm`, el buscador reconoce el blanco con probabilidad `SEEKER_ACQ` = 0,9 y el error queda en 0. Si no cabe, el error se mantiene.

Cada arma que entra en la zona consume un número al azar, y uno más solo si el buscador entra en juego. Con `navErr` > 2 km, el debrief cuenta el arma como "perdida localmente".

### Rol

El efecto depende del **rol** y no de la bandera: los jammers de radar siempre degradan los radares de la defensa, y los anti-GNSS siempre desvían armas del atacante.

---

## §5 Cinemática de las amenazas

Es un modelo **cinemático guiado por datos**: la amenaza recorre una ruta poligonal a velocidad constante por fase, y su altura sale del perfil de vuelo. No se integran fuerzas, porque alcanza para los tiempos de vuelo, la geometría de intercepción y el horizonte.

| Perfil | Altura |
|---|---|
| `drone` | Terreno + `agl`, mirando 0,4–0,9 km adelante. Picada lineal en los últimos 2 km |
| `cruise` | Terreno + `agl`, mirando hasta 1,5 km adelante. Baja al blanco en los últimos 0,5 km |
| `bunt` | Como `cruise`, más un ascenso de 1.500 m entre 8 y 3 km del blanco y picada final (Storm Shadow) |
| `ballistic` | Parábola `z = 4·apogeo·f·(1−f)`, con `f` la fracción del recorrido. Lanzado a `launchDist` km |
| `highdive` | Crucero a `cruiseAlt` a velocidad `v` y picada lineal en los últimos `diveDist` km a `vDive` |
| `hilo` | Crucero alto, transición entre 60 y 40 km del blanco, y tramo final rasante a `vLow` |
| `glide` | Bomba planeadora soltada fuera del mapa a `cruiseAlt` y `launchDist` km del blanco; baja sin motor a velocidad `v`: z = suelo + (cruiseAlt − suelo)·(rem/L)^0,7 (suave al principio, más empinada al final). `T.cold`: sin motor, ×0,3 de Pk para buscadores IR |

- **Maniobra terminal:** desplazamiento lateral senoidal (amplitud 0,4 km para balísticos y 0,15 km para el resto) dentro de `termZone` (25 km balísticos, 15 km supersónicos, 10 km el resto).
- **Salvas:** dispersión lateral de 0,25 km entre misiles, para que no se apilen.
- **Señuelos:** se liberan a 40 km del blanco; se abren hasta 1–3,5 km del misil padre y suben hasta 300 m.
- **Velocidad instantánea:** diferencia centrada de ±0,5 s (`speedAt`).

---

## §6 Seguimiento y solución de tiro

**Pista** (`trackOK`):
- **Propia:** el radar de la batería vio el blanco en los últimos 2 barridos (+0,6 s).
- **De red:** cualquier sensor lo vio en los últimos 12 s y el nivel de mando y control lo permite (ver abajo).

| Guiado | Necesita |
|---|---|
| TVM, SARH, mando, cañón | Pista propia (el radar de la batería guía hasta el final) |
| Activo, IR | Propia o de red |
| Operador (drones interceptores) | De red |

**Tiempo de reacción:** desde que hay pista hasta el primer disparo pasan `sam.react` segundos.

**Solución** (`solve`): recorre la trayectoria futura del blanco con pasos de 0,5 s hasta 30 s y de 2 s hasta 400 s. Toma el primer instante τ en que:

```
minR ≤ r ≤ maxR (o maxRtbm si es balístico/hipersónico)
altMin ≤ AGL   y   z − z_lanzador ≤ altMax
r / vInt ≤ τ   (el interceptor llega a tiempo, con ≤ 3 s de holgura)
```

**Filtros de** `engage()`: el blanco no puede ir más rápido que `vmaxT`; los guiados por radar necesitan línea de vista al punto de encuentro; hay que tener canales (`sam.ch`) y munición libres. Con red, no se dispara a un blanco que ya tiene interceptores en vuelo. La prioridad es para el blanco que llega primero (`rem / v`).

**Mando y control** (`S.c2`, niveles en `data/c2.js`):

| Nivel | Pista de red | Quién tira con pista ajena | Reacción | No repetir blancos |
|---|---|---|---|---|
| Desconectada | no | nadie | desde la pista propia | no |
| Descoordinada | solo alerta, 45 s de demora | nadie | desde la alerta | no |
| Coordinada | sí, vale 12 s | activos/IR e interceptores | desde la pista | sí |
| Integrada | sí, 2 s de demora, vale 12 s | también guiados por radar, si su radar cubre el punto de encuentro (sector, alcance y línea de vista); los cañones siempre necesitan su propio sensor | desde la alerta | sí |

"Coordinada" y "desconectada" son el viejo interruptor "red integrada" encendido y apagado.

**Error de posición de la pista de red:** un disparo hecho sin pista propia multiplica su Pk por `remotePk` del nivel (0,97 en coordinada: el buscador tiene que encontrar el blanco donde la red dice que está; 1 en integrada, pista compuesta de calidad de tiro. Estimación de juego: los escenarios son muy sensibles a este valor).

**Enlace de datos por unidad** (`u.link`, casilla en el panel de selección): una unidad sin enlace no alimenta la red (sus detecciones no cuentan para `th.lastNet` ni `th.netFirst`) y no recibe pistas ni alertas de otros sensores. Pelea sola con su radar.

**Mejor tirador y defensa por capas** (`best`, solo en integrada): antes de disparar, una batería con enlace cede el blanco si (1) otra batería con enlace también puede tirarle ahora y es mejor (contra drones, menor costo esperado por derribo = costo/Pk; contra el resto, mayor Pk), o (2) es un dron y su ruta pasa más adelante por la envolvente de una capa con munición al menos 2 veces más barata por derribo. Así un NASAMS le deja los Shahed al Gepard que los espera junto al objetivo.

**Nodos de C2** (`effectiveC2`, `data/c2.js#C2_NODES`): si un objetivo **puesto de mando** de la defensa es destruido, el C2 efectivo cae a desconectada; cada **sitio de comunicaciones** destruido lo baja un nivel. El registro avisa cuando pasa.

**Enlace de datos del atacante** (`sv.link`, armas con `T.datalink`: Shahed, Geran-3 y Gerbera con módem 4G/mesh o Starlink): el operador ve la posición real, así que el arma descarta el engaño GNSS como si tuviera corrección por terreno (§4). Dentro del radio de un antidrón que corta enlaces (`J.linkJam`, Bukovel-AD) pierde esa ventaja.

**Doctrina:** con "salva" se disparan `u.salvo` interceptores por blanco (cada 0,6 s); con "disparar-observar-disparar", uno.

---

## §7 Probabilidad de derribo

```
Pk = sam.pk[clase] × modificadores, acotada a [0; 0,98]           (physics/engagement.js#calcPk)
```

| Condición | Factor |
|---|---|
| Maniobra terminal dentro de `termZone` | `T.manPk` (o 0,7); 0,85 contra cañones |
| Bengalas (`T.ir`) contra guiado IR | 0,85 |
| Baja firma (`T.lo`) contra buscador activo | 0,85 |
| Baja firma contra mando, TVM o semiactivo | 0,75 |
| Interferencia sobre el radar de la batería (J > 1) | 1/(1 + 0,08·J), mínimo 0,5 |
| Blanco a más del 80% de `vmaxT` | 0,8 |

Las Pk base están **calibradas** contra episodios reales dentro de la cobertura de sistemas capaces (ver `CAL` en `data/calibration.js` y la ventana "Calibración de Pk"). Con `n` interceptores independientes: `P(derribo) = 1 − (1 − Pk)ⁿ`.

---

## §8 Terreno, horizonte, línea de vista y cobertura

**Grilla:** celdas de 200 m (int16, m). `elev()` interpola bilinealmente entre centros de celda y `surf()` = max(0, elev).

**Tierra 4/3:** la refracción estándar curva el haz hacia abajo; se modela con un radio efectivo `KR = 8.500 km`.

```
horizonte:         d ≈ 4,12 · (√h_radar + √h_blanco)     [km; h en m]
bulto terrestre:   b = d₁·d₂ / (2·KR)
```

**Altura de antena y de vuelo:** el horizonte crece con la raíz de las dos alturas, por eso subir la antena o bajar el arma pesa tanto. Ambas están acotadas a lo real: cada radar tiene `mastRange` (mín = máx si la antena va fija sobre su vehículo; S-300/S-400 llegan a ≈39 m con la torre 40V6MD) y cada arma `aglRange` con perfiles típicos (`aglModes`). La simulación usa la altura elegida durante todo el vuelo; no modela el cambio de perfil a mitad de ruta (por ejemplo, crucero alto y descenso final).

**Línea de vista** (`los`): muestrea el segmento una vez por celda (máximo 700 muestras). La vista queda tapada si en algún punto `terreno + 4 m + b` supera la altura del rayo.

**Cobertura** (`physics/coverage.js`): es un *viewshed* radial. Para cada sensor se lanzan N ≥ 360 rayos y en cada uno se guarda el máximo ángulo de elevación del relieve visto hasta ahí. Una celda es visible si el ángulo hacia el blanco de referencia (a `agl` m sobre el terreno) lo supera y está dentro de `detR` con la interferencia en ese azimut.

---

## §9 Lectura del relieve (solo visual)

`physics/terrain-analysis.js` usa la misma grilla que `surf()` pero **no la modifica** (hay una prueba que lo verifica).

- **Relieve relativo:** elevación − promedio del terreno en 5 km a la redonda. Se calcula con una imagen integral, en O(1) por consulta.
- **Puntos altos:** máximos locales que dominan ~1 km y sobresalen al menos max(25 m; 4% del máximo del mapa) sobre lo más bajo de ~3 km. Se ordenan por dominancia y se ralean a ≥ 1,5 km entre sí; en pantalla, además, ≥ 74 px.
- **Curvas de nivel:** *marching squares* sobre los centros de celda, con equidistancia de 20, 50 o 100 m según el desnivel. Cada 5ª curva es maestra; la costa es la curva de 0,5 m.
- **Sombreado:** iluminación de Lambert (normal del terreno · sol), con el sol al NO a 45° y exageración vertical ×2. El modo "Sombreado" combina tres soles a 40° (×3).
- **Calidad visual:** el raster se genera a k× la grilla (k ≤ 4) con la misma interpolación bilineal, y se dibuja con suavizado. Costa, curvas, marcadores, anillos, rutas y textos son vectores en coordenadas de pantalla × `devicePixelRatio`.

---

## §10 Impacto y daño

**Caída:** dispersión circular normal alrededor del punto apuntado:

```
σ = CEP / 1,1774          r = σ·√(−2·ln(1 − U)) + navErr          ángulo uniforme
```

Cuenta como **impacto en el blanco** si r ≤ 20 m (drones) o 50 m (misiles). Los señuelos caen sin efecto.

**Daño** (`physics/damage.js`, parámetros en `data/targets.js`), aplicado a cada objetivo cercano:

```
W = ojiva en kg (catálogo: info.warheadKg)
daño directo = 12 · W^0,6 · vulnerabilidad del objetivo
R50 = 4 · W^⅓  m                         (escala de Hopkinson-Cranz)
factor = 1 / (1 + (d / R50)²)             d = distancia fuera de la huella del objetivo
```

Por debajo de un factor de 0,02 no hay daño. Ejemplos de impacto directo con vulnerabilidad 1: Shahed (50 kg) ≈ 126 HP; Kh-101 (450 kg) ≈ 470 HP; Flamingo (1.000 kg) ≈ 756 HP.

**Estados:** *operativo* → *dañado* (≥ 20% de vida perdida) → *destruido* (0 HP).

Es un modelo de juego: no representa estructuras, incendios, penetración ni submuniciones.

---

## §11 Simplificaciones conocidas y mejoras posibles

| Simplificación | Efecto | Mejora posible |
|---|---|---|
| RCS con tres aspectos | Sin aspecto arriba/abajo ni detalle angular fino | Tabla por ángulo (como el "3D radar splat" de CMO PE) |
| Sin clutter ni Doppler | Los blancos rasantes sobre tierra son más fáciles de lo real (solo los esconde el relieve) | Factor de clutter según el AGL y el tipo de radar |
| Clima simple | Lluvia (ITU-R P.838-3), techo de nubes y factores ópticos/acústicos fijos por escenario | Día y noche, clutter de lluvia, viento, clima que cambia durante el escenario |
| Sin recarga | Las baterías quedan vacías | Recarga con tiempo y depósito de munición como objetivo |
| Pd por barrido simplificada | Sin fluctuación de RCS (Swerling) | Modelo Swerling 1/3 |
| Interceptor en línea recta a velocidad media | Sin energía ni geometría de persecución | Perfil de velocidad y límite de g |
| Discriminación de señuelos | El radar nunca distingue señuelos | Probabilidad de discriminación por banda y tiempo de seguimiento |
| GNSS sin CRPA explícita | `gnss` resume toda la resistencia | Número de elementos de la CRPA frente al número de fuentes (ver `docs/investigacion/`) |
| Daño simple | Sin efectos funcionales (un radar dañado sigue funcionando) | Degradación de capacidades según el estado |

La propuesta detallada de cada mejora (qué cambia, dificultad, datos, pruebas y cómo lo resuelven *Command: Modern Operations* y *Fleet Command*) está en [investigacion/mejoras-fisica.md](investigacion/mejoras-fisica.md).

Cada mejora cambia resultados. Antes de mergearla: correr las pruebas, revisar los cambios de los golden y anotarla en el CHANGELOG (ver [CONTRIBUIR.md](../CONTRIBUIR.md)).
