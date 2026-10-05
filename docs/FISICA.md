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

Cada radar barre cada `radar.scan` segundos. Si el blanco está dentro del sector y con línea de vista (§8), la probabilidad de detectarlo en ese barrido sale de la **relación señal/ruido** con fluctuación **Swerling 1** (la RCS "titila" de barrido a barrido; `physics/radar.js#pdScan`):

```
R   = detR(...)                    alcance del catálogo = el de Pd 50% con PFA = 10⁻⁶
SNR = SNR50 · (R/r)⁴  (y el clutter se suma al ruido, ver abajo)        SNR50 = ln(PFA)/ln(0,5) − 1 ≈ 18,9 (12,8 dB)
Pd  = PFA^(1/(1+SNR))                          (Swerling 1, un pulso)
Pd  = (1 + 2·SNR·T/(2+SNR)²) · exp(−2T/(2+SNR))   (Swerling 3, un pulso; T = −ln PFA ≈ 13,8, SNR50 ≈ 15,7)
```

Cada amenaza tiene su modelo de fluctuación (`T.swerling`, por defecto 1):
- **Swerling 1:** muchos reflectores parecidos; la RCS titila mucho de barrido a barrido. Drones, misiles de crucero, planeadoras.
- **Swerling 3:** un reflector dominante más otros chicos (χ² de 4 grados de libertad). Le asignamos este modelo a los balísticos y al Tsirkon (Iskander-M, Kinzhal, ATACMS): cuerpos de revolución con un eco principal. Es una elección de modelado de confianza baja; los libros lo proponen para blancos con un reflector dominante.

| r / R | 0,3 | 0,5 | 0,8 | 1,0 | 1,2 |
|---|---|---|---|---|---|
| Pd Swerling 1 | 0,99 | 0,96 | 0,75 | 0,50 | 0,26 |
| Pd Swerling 3 | 1,00 | 0,99 | 0,83 | 0,50 | 0,18 |

Las dos fórmulas están **verificadas** contra una integración numérica independiente (Marcum Q₁ de un blanco fijo promediada sobre la distribución de la RCS) en `tests/swerling.test.js`: coinciden a 10⁻⁴.

**Integración de pulsos opcional** (`radar.integrationPulses`, `physics/pulse-integration.js`): combina las potencias de N pulsos de un mismo barrido, con ruido independiente y RCS constante dentro del barrido (Swerling lento 1/3). No es la confirmación entre barridos de la sección siguiente. El umbral se recalcula para conservar PFA=10⁻⁶ por decisión: con ruido solo, la potencia sumada sigue una Gamma(N,1). Se obtiene la SNR por pulso que da Pd=50% y se usa como ancla de la curva `SNR(r) = SNR50_N · (R/r)⁴ / 10^(clutter/10)`. **El alcance publicado R1 no recibe otra ganancia**, porque ya incluye procesamiento; cambia la forma de la curva alrededor de ese alcance.

N debe ser entero entre 1 y 128 (dominio numérico verificado, no límite de un radar real). **El catálogo no asigna N por falta de fuentes**: ausencia del campo conserva exactamente el modelo anterior de un pulso y no significa que el radar real use uno. No se deduce N de `scan`, agilidad de frecuencia, nacionalidad ni alcance. Antes de asignarlo se necesita la cantidad de muestras independientes integradas para ese modo, fuente y rango en `UNC`. Sensores ópticos y acústicos conservan su modelo. Hay 96 comparaciones independientes con SciPy y una simulación de señal/ruido I/Q en `tests/pulse-integration.test.js`; ver [derivación, fuentes y límites](investigacion/integracion-pulsos.md). No se implementan integración coherente, ruido correlacionado ni Swerling 2/4.

**Confirmación de pistas "2 de 3"** (`TRACK_M`, `TRACK_N`, `sim/engine.js`): un eco suelto no alcanza para abrir una pista. El radar guarda, para cada blanco, si lo vio o no en cada uno de sus últimos 3 barridos (`th.mn`), y abre la pista cuando lo vio en 2. Una pista ya abierta (vista en los últimos 2 barridos) se mantiene con un eco por barrido. Los sensores ópticos y acústicos confirman con un solo contacto. Así la detección lejana es gradual: a 1,2·R la confirmación es poco probable (16% por tanda de tres barridos) pero un blanco lento que pasa muchos barridos ahí puede terminar detectado.

| r / R | 1,0 | 1,1 | 1,2 | 1,3 | 1,4 | 1,5 |
|---|---|---|---|---|---|---|
| Confirmar "2 de 3", Swerling 1 | 0,50 | 0,31 | 0,16 | 0,07 | 0,03 | 0,01 |

Más allá de **2,5·R** no se calcula nada: es un corte de **rendimiento**, no físico (la Pd ya es menor que 10⁻⁴). Antes había un corte a 1,2·R que compensaba a lo bruto que se abría pista con un solo eco; la regla 2 de 3 lo reemplaza (ver `docs/investigacion/valores-estimados.md`).

**Clutter** (`physics/clutter.js`, parámetros en `data/clutter.js` con rango y fuentes en `UNC.clu`): el eco del suelo, del mar y de la lluvia que cae en la misma celda de resolución que el blanco. Como blanco y clutter salen de la misma ecuación del radar, el cociente no depende de la potencia:

```
SINR = 1 / (1/SNR + C/σ)        C = clutter que sobrevive al filtro (m²), σ = RCS del blanco
superficie  C = σ° · A · g²(Δ) / I      A = 0,75 · ΔR · R · θaz / cos ψ
lluvia      C = η · V / I               V = 0,567 · ΔR · R² · θaz · θel   (π/(8·ln2), haz gaussiano)
```

- **Cuándo hay clutter de superficie.** El haz apunta al blanco; el suelo que está debajo queda Δ = agl/R radianes más abajo y entra con la ganancia de ida y vuelta g²(Δ) = exp(−8·ln2·(Δ/θel)²). Más allá de 1,5 anchos de haz entra por lóbulos laterales a −50 dB o menos y se desprecia. Además el radar tiene que ver la superficie: en tierra, línea de vista a ese punto (cacheada por celda); en el mar, ángulo rasante positivo sobre la Tierra 4/3 (más allá del horizonte de la superficie no hay eco de mar). Por eso el clutter pesa cerca y con antenas altas; un blanco rasante lejos de un mástil bajo queda fuera del horizonte del suelo y compite solo con el ruido.
- **Suelo:** σ°F⁴ = −30 dB (mediana de Billingsley en 37 sitios rurales a menos de 8°, de VHF a X; ya incluye la propagación), ±5 dB según la rugosidad local (pendiente). 
- **Mar:** modelo NRL 2012 (Gregers-Hansen y Mital) según banda, ángulo rasante y estado del mar (polarización H por defecto; `radar.pol`). Ajustado de 0,1° a 60° y de 0,5 a 35 GHz (desvío ≈2,2–2,6 dB); por debajo de 0,1° se extrapola. Coincide con la tabla de Barton (estado 4, X, 1°: −42,5 dB) dentro de 4 dB (prueba). El estado del mar sale del clima (`WEATHER[].sea`: despejado 2, nublado y lluvia 3, tormenta 5, niebla 1; estimado).
- **Lluvia:** η = 6·10⁻¹⁴·r^1,6/λ⁴ m⁻¹ (Barton; Rayleigh con Z = 200·r^1,6 de Marshall–Palmer). Llena el haz hasta 3.000 m (`RAIN_TOP`, la nieve de arriba casi no refleja) y solo cuenta si el blanco vuela debajo. Se supone que el blanco está dentro de la lluvia (mismo supuesto que la atenuación).
- **Factor de mejora I** (`radar.mti`): sin filtro 1. MTI: cancelador doble contra un espectro gaussiano, I = 2·(PRF/(2π·σf))⁴ con σf = 2σv/λ (Radar Handbook, ec. 15.10), con techo de 35 dB; la dispersión σv es 0,1 m/s en tierra, 0,9 en el mar y 2 en la lluvia (tabla 15.1). La PRF, sin dato, es la de alcance sin ambigüedad hasta 2·R1. Pulso-Doppler: 55 dB. Con eso un MTI rinde 35 dB contra el suelo pero solo 26–28 dB contra el mar y 12–14 dB contra la lluvia en S y X (el 36D6 y el Buk); un pulso-Doppler mantiene 55 dB.
- **Resolución ΔR:** 150 m por defecto (`radar.res` la pisa); ancho de haz en elevación = el de la banda (`radar.bwEl`).

Todos son valores **por clase**, con rango en `UNC.clu` (Monte Carlo los sortea) y confianza baja o media: faltan la mejora sub-clutter, la PRF y la resolución publicadas de cada radar ([handoff de datos](investigacion/clutter-y-pulsos-datos.md)). El S-125 tiene MTI desde la integración de los datos de Codex (dos fuentes técnicas secundarias; falta un manual primario de la variante) con PRF 2.600 Hz, y el Buk usa el haz de seguimiento del 9S35 (1,3° en elevación). El modelo NRL se evalúa dentro de su dominio (0,5–35 GHz): para el P-18 en VHF se usa el borde, porque extrapolar la curva no está respaldado.

**Notch Doppler:** los radares con filtro Doppler (`'mti'`, `'pd'`) borran lo que no se acerca ni se aleja: si la velocidad radial del blanco (|v|·cos del aspecto) es menor que 15 m/s (MTI) u 8 m/s (pulso-Doppler), ese barrido no lo ve. Choca de lleno con el aspecto (§3): de costado la RCS es máxima, pero un radar Doppler lo puede perder. Los sensores ópticos y acústicos no tienen clutter ni notch.

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

**Día y noche** (`S.tod`, pestaña Defensa → Clima, `rules.tod`; por defecto noche): los alcances del catálogo de los sensores ópticos (grupos móviles, MANPADS) están estimados para la noche, con visor térmico y reflectores. De día se suma la vista y llegan ×`ENV.modelo.optDay` = 1,3 más lejos (estimado, rango 1–2 en UNC: no hay alcances públicos por hora). Los radares no cambian.

**Niebla** (`lwc` = 0,05 g/m³ en 10 km): atenuación ITU-R P.840 (`physics/weather.js#cloudKl`, verificada contra la tabla calculada de Codex): ≈0,005 dB/km en X, casi nada. Lo que la niebla sí tapa es lo óptico.

**Nieve** (estado "Nevada moderada", `snow` = 2 mm/h de agua equivalente): la nieve seca casi no atenúa microondas, así que no suma atenuación (estimado: Codex no encontró un coeficiente primario por banda para nieve); sí devuelve eco de volumen, que se suma al clutter de lluvia (§2, "Clutter") con la reflectividad de Sekhon y Srivastava (1970), la que usa el servicio meteorológico de Canadá: `Zes = 1780·s^2,23` (hielo), `Ze = Zes − 6,5 dB` (convención del agua), `η = π⁵·0,93·Ze·10⁻¹⁸/λ⁴`. Lo óptico cae a 0,2 y las nubes cortan arriba de 600 m (estimados).

**Cambios de tiempo durante la noche** (`S.wxPlan`, "Después cambia a…" en Defensa → Clima, `rules.wxPlan` = hasta 10 cambios `{ t (s), weather }`): a la hora indicada el clima vigente pasa al nuevo estado y el registro lo anota (`sim/weather-now.js`). El clima elegido del escenario no se pisa.

**No se modela:** el efecto del clima sobre los buscadores IR de los misiles, ni nieve húmeda (que sí atenúa).

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
J = Σ_jammers  P · G(Δaz) · modo / d²   · 10^(−ECCM/10)        (physics/radar.js#jamJ)

G = 1        si |Δaz| ≤ bw          (lóbulo principal; bw = BANDS[b].bw)
G = 0,05     si |Δaz| ≤ 3·bw        (primeros lóbulos laterales, −13 dB; 0,01 = −20 dB con lóbulos bajos)
G = 0,003    más afuera             (−25 dB; 0,001 = −30 dB con lóbulos bajos)
G ×= 0,1     si el jammer está fuera del sector del radar
```

**ECM: barrera o puntual** (`j.mode`, panel de selección del jammer; `data/jammers.js#JAM_MODES`):
- **Barrera** (por defecto): reparte la potencia en toda la banda y afecta a todos los radares de sus bandas (modo ×1).
- **Puntual**: concentra la potencia en la frecuencia de **un** radar elegido (`j.target`): ×10 contra ese radar, nada contra los demás. Si el radar tiene **agilidad de frecuencia** (`radar.agile`), salta de frecuencia pulso a pulso y el ruido puntual le deja solo ×0,1: contra él hay que usar barrera, que rinde mucho menos por radar. El ×10 es un valor de juego (la ganancia real es el cociente entre los anchos de banda y puede ser mucho mayor).

**ECCM** (campos del radar en `data/defenses.js`):
- **Agilidad de frecuencia** (`agile`): anula el ruido puntual (arriba).
- **Lóbulos laterales bajos** (`lowSL`): la antena recibe menos por los costados (−20/−30 dB en vez de −13/−25 dB). No ayuda contra un jammer en el lóbulo principal.
- **Canceladores de lóbulos laterales** (`slc` = N): anulan los N jammers más fuertes que entran por los lóbulos laterales (quedan ×0,03, −15 dB). **No pueden** con uno en el lóbulo principal, porque cancelarlo borraría también el eco del blanco. Por eso el avión de interferencia stand-off se pone detrás de los atacantes. Es la misma lógica que la CRPA de las armas (§4 GNSS), del otro lado.
- **`eccm` (dB)**: lo demás (procesamiento, compresión de pulso, CFAR, operador), como antes.

| Radar | Agilidad | Lóbulos bajos | SLC | Fuente |
|---|---|---|---|---|
| AN/MPQ-65 (Patriot) | sí | — | 1 | Radartutorial, MDAA ("al menos un SLC") |
| 30N6 (S-300) | sí | sí | — | Air Power Australia (lóbulos muy bajos, ECCM extensas) |
| 92N6 (S-400) | sí | sí | 1 | estimación (misma familia que el 30N6) |
| TRML-4D (IRIS-T), Arabel (SAMP/T) | sí | sí | 2 / 1 | estimación (AESA/PESA modernos) |
| Sentinel (NASAMS), Erieye | sí | sí | — | estimación |
| 36D6 Tin Shield | — | — | 2 | estimación (el fabricante declara marcar el rumbo de los jammers) |
| Tor, Pantsir | sí | — | — | estimación |
| P-18, S-125, S-200, HPIR (Hawk), Gepard, Buk | — | — | — | radares de los 60–70 o sin dato |

**Distancia de quemado:** con la interferencia J, el radar ve hasta `R' = R1·(1/(1+J))^¼` contra 1 m². Más cerca, el eco del blanco le gana al ruido. La ficha de cada jammer de radar muestra esa distancia para cada radar de sus bandas, con el jammer a 100 km de frente o de costado, en barrera o puntual (`physics/radar.js#singleJam`, `burnThrough`).

Solo suman los jammers activos de la **misma banda**, de un **bando distinto**, con **línea de vista** radar–jammer. Un equipo con `side: 'both'` es la excepción. `d` es la distancia 3D en km (+1 para evitar la división por cero). `P` es una **potencia relativa de juego**: las potencias reales no son públicas.

El alcance queda en `R' = R·(1/(1+J))^¼`. La Pk de los guiados que dependen del radar se multiplica por `1/(1 + 0,08·J)`, con un piso de 0,5 (§7).

### Engaño DRFM y capacidad de seguimiento

Un jammer con memoria digital de RF (**DRFM**, modo `drfm`) no mete ruido: graba el pulso del radar y lo devuelve con demoras y corrimientos Doppler. Como la copia es coherente, recibe toda la ganancia de procesamiento del radar (el `eccm` no la achica) y el radar la toma por un blanco (`physics/radar.js#falseTracks`):

```
J = P · G / d²            (sin el descuento de eccm)
falso blanco si J ≥ SNR50 (12,8 dB)
  lóbulo principal (G = 1): cuando el haz pasa por el jammer, si está en el sector del radar
  lóbulos laterales cercanos (G = 0,05 o 0,01): solo si el radar NO tiene blanqueo (radar.slb)
cada jammer que pasa el umbral suma JAM_MODES.drfm.falseTargets = 20 falsos blancos por barrido
```

El **blanqueo de lóbulos laterales** (SLB) compara cada pulso con una antena auxiliar y borra los que llegan más fuertes por ella: sirve contra pulsos sueltos (falsos blancos), no contra ruido continuo. El cancelador (`slc`) es al revés. Se asigna `slb` a los radares que tienen cancelador (Patriot, Arabel, TRML-4D, 92N6, 36D6), porque los dos usan los mismos canales auxiliares; es una estimación. La agilidad de frecuencia no alcanza: el DRFM responde al pulso que acaba de recibir, así que puede poner falsos blancos detrás de su posición.

**Capacidad de seguimiento** (`radar.tracks`, con rango y fuente en `UNC.def`): blancos que el radar puede seguir a la vez. Patriot 100, Arabel 100, TRML-4D 1.500, Sentinel más de 50, 30N6 24, 9S18M 50, Tor 48, 92N6 100; el resto es estimación. En cada barrido, las pistas abiertas más los falsos blancos ocupan esa capacidad. Si está llena, el radar **no abre pistas nuevas** (las abiertas se mantienen) y el registro lo avisa. También pasa sin engaño: en el puente de Monterey, un Pantsir con capacidad 20 se llena con el enjambre.

**Disparos contra falsos blancos:** una fracción `JAM_MODES.drfm.fooled` = 0,3 de los falsos blancos (valor de juego: no hay dato público de cuántos pasan la clasificación) compite con las pistas reales por los disparos de cada evaluación de la batería: con probabilidad `falsos / (falsos + pistas reales)` dispara una salva hacia su sector, que no encuentra nada y ocupa canales y munición. Un DRFM no mete ruido, pero emite cuando el haz lo ilumina: también se lo puede **ubicar por triangulación** (abajo) por su copia en el lóbulo principal.

No se modela todavía: arrastre de la ventana de distancia o velocidad contra un seguimiento (RGPO/VGPO, hace falta un jammer a bordo del blanco) ni chequeos de coherencia distancia-Doppler de cada radar.

### Triangulación y home-on-jam

Un radar interferido ve la **dirección** del jammer (el strobe), no la distancia. Con J/N ≥ 0 dB marca esa dirección con el error angular de un monopulso, y dos radares que comparten marcaciones por la red (cualquier nivel de C2 salvo "desconectada") lo ubican donde se cruzan (`physics/jamloc.js`, `sim/ew.js`, cada 5 s):

```
σθ = θ3 / (1,6 · √(2·J/N))      (piso 0,05°)
error = √((d1·σ1)² + (d2·σ2)²) / sin Δ     Δ = ángulo entre las marcaciones (mínimo 10°)
ubicado si error ≤ 5 km
```

Con el jammer ubicado, una batería con modo **home-on-jam** (`sam.hoj`: por ahora solo el AIM-120 del NASAMS. El manual del Patriot describe un misil contra jammers stand-off, el MIM-104B/SOJC, y la triangulación de jammers de la batería (FM 3-01.85 §5-31), pero eso no se generaliza al PAC-2 GEM-T; del I-Hawk solo hay un modo "potencial". Ver docs/investigacion/datos-fisica-guerra-electronica.md), cuyo radar oye ese ruido y que lo tiene dentro de su alcance y techo, le dispara un misil que se guía a la emisión. Pk `sam.pkHoj` (0,5; estimada, con rango en UNC: el guiado solo angular no sabe la distancia y la espoleta trabaja peor). Un jammer derribado deja de interferir. Solo contra jammers aéreos: los terrestres quedan para cuando haya artillería o misiles antirradiación. El mapa muestra el círculo de error del jammer ubicado y una cruz si cae.

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

**Antena CRPA** (`sv.crpa`, elegible por salva en la pestaña Ataque: 0, 4, 8, 12 o 16 elementos; `physics/navigation.js`): una antena de recepción con diagrama controlado apunta un "nulo" hacia cada interferidor. Con N elementos anula hasta **N − 1 fuentes** que lleguen desde direcciones distintas:

```
fuentes = anti-GNSS encendidos cuyo radio cubre al arma
direcciones = fuentes agrupadas por acimut visto desde el arma (dos a menos de 10° caen en el mismo nulo)
pierde el GNSS  ⇔  direcciones > N − 1
```

Mientras la CRPA alcanza, el arma conserva el satélite y no suma error; se vuelve a revisar en cada paso, así que al entrar en el radio de más estaciones puede perderlo más adelante. Cuando lo pierde, el efecto es el de arriba (con la primera estación de la lista, como antes). Por defecto las salvas van sin CRPA: los escenarios no cambian.

Referencias de tamaño (confianza baja, `docs/investigacion/guerra-electronica-ucraniana.md` D3): Shahed 2022–23 sin CRPA o de 4; Kometa de 8 y 12 en Shahed y UMPK desde 2025; CRPA chinas de 16 en Shahed desde mar-2025 y Kometa-M de 16 en Iskander-K desde mediados de 2025 (secciones G y H de la investigación). Ingenieros ucranianos: contra 8 elementos hicieron falta 19 estaciones Lima; contra 16, ni 104. La regla N − 1 es la cota clásica de un arreglo adaptativo; los 10° de separación son una estimación de juego (en la realidad depende de la geometría del arreglo y de la potencia de cada fuente).

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
- **Viento** (`S.wind = { v, from }`, pestaña Defensa → Clima, `rules.wind` en los archivos; por defecto calma): uniforme en todo el mapa y fijo toda la noche. Es el viento **en superficie** (a 10 m, el de los partes) y crece con la altura según la ley de potencia `v(h) = v10·(h/10)^α` con α = 1/7 (atmósfera neutra) hasta el tope de la capa límite (1.000 m); más arriba sigue creciendo con la forma del perfil de radiosondeos de Kiev (NOAA IGRA 1991–2020: 3 km ×1,9, 5 km ×2,6 y 10 km ×4,3 respecto de 1 km; es la forma, no el valor) y desde 10 km queda constante: a 1.000 m sopla ≈1,9 veces más (`physics/weather.js#windAt`, parámetros con rango en `UNC.env`). Cada arma usa el viento de su altura de vuelo. Las armas con ruta en el mapa (drones y crucero) vuelan a su velocidad del catálogo **respecto del aire**: en cada tramo de la ruta, con rumbo `u` y viento `W` (hacia dónde sopla), corrigen la deriva y avanzan sobre el suelo a
  ```
  Vg = W·u + √(v² − (W×u)²)          (triángulo de velocidades; si el viento cruzado supera v, se acota a 0,1·v)
  ```
  Un Shahed (≈51 m/s) con 10 m/s de frente tarda un 24% más; un Kalibr (240 m/s), un 4%. Las salvas sincronizadas (`sync`) calculan el lanzamiento con el viento, como haría el planificador. No se aplica a lo lanzado desde fuera del mapa (balísticos, picada, `hilo`, planeadoras). Simplificaciones: sin cambio de viento con la altura, sin ráfagas y sin efecto sobre la altura de vuelo ni el consumo. Los escenarios de referencia no traen viento: no hay dato del viento de esas noches.

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

**Control de emisiones** (`u.emcon`, `sim/contacts.js#emitting`; selector "Emisión del radar" en el panel): un radar que emite puede ser ubicado por el enemigo; uno apagado no ve. Tres modos, elegidos por el jugador (no hay números nuevos): **siempre** (por defecto, como antes), **alerta** (apagado hasta que su puesto de mando recibe la primera alerta de la red; si ningún sensor avisa, no se enciende) y **silencio** (nunca emite: la unidad solo dispara con pistas de la red, así que un guiado por radar propio no tira). Los sensores acústicos y ópticos son pasivos y no se apagan. Simplificaciones: encenderse es instantáneo (no se modela el tiempo de calentamiento) y un radar apagado sigue escuchando jammers para la triangulación.

**Tiempo de reacción:** desde que hay pista hasta el primer disparo pasan `sam.react` segundos.

**Qué trayectoria predice la defensa** (`physics/track.js`): la defensa no conoce la ruta del arma, solo su pista. Para drones, crucero y supersónicos extrapola en **línea recta** con la velocidad medida entre las dos últimas detecciones de una pista que **le llega a esa batería** (`th.obs`: la de su propio radar y la de cada red compatible de su puesto de mando, con las mismas reglas que `trackOK`, en `trackKeys`; se usa la más reciente; las dos detecciones separadas a lo sumo `VEL_GAP` = 12 s, la misma ventana de la pista de red). La regla de "defensa por capas" (dejarle un dron a una capa más barata) también decide con esa línea prevista, con las pistas de la batería que decide, no con la ruta real. Y el orden en que una batería elige blancos es el del contacto que antes llega hasta ella (distancia a la última posición vista / velocidad medida), no el del arma a la que le falta menos para su blanco, que la defensa no conoce. La altura se extrapola **sobre el terreno** (un crucero que sigue el relieve mantiene su AGL; uno en picada la pierde), nunca por debajo de 5 m. Con una sola detección no hay velocidad y no hay disparo. Los **balísticos e hipersónicos** siguen con la trayectoria verdadera: después del motor la fija la física y un radar de tiro la predice bien; su fin de vuelo también. La velocidad que se compara con `vmaxT` es la medida (la verdadera solo en balísticos).

**Llegada** (`arrivalReach`): el interceptor sale hacia el punto previsto y al llegar el buscador o la guía corrigen hacia la posición real, pero solo si le alcanza: se aplica el mismo criterio de la solución con la posición verdadera (r ≤ alcance efectivo, alcance mínimo, piso, techo y velocidad ≤ `vmaxT`). El alcance efectivo es **el del plan** (`r / f` de la solución): el aspecto ya se usó para planear el vuelo y no se recalcula con la velocidad real después de lanzar (recalcularlo hacía fallar por milésimas tiros al borde, auditoría de Codex, PR #67: docs/investigacion/caida-64.md). Los **cañones** no pasan esa cuenta de energía: la ráfaga no corrige en vuelo, llega en un par de segundos y su acierto ya está en la Pk (sí el piso, el techo y la velocidad). Si el blanco giró, bajó a su picada final o aceleró más de lo que cubre el misil, no lo alcanza (el registro dice "el blanco no estaba donde se lo esperaba"); si llega, la Pk usa la fracción del alcance real en ese momento. Es una **aproximación**, no una corrección terminal verificada: no se modela la trayectoria del interceptor, su tiempo extra para corregir ni el ángulo que el buscador puede cubrir (no son públicos por misil; Codex no los encontró, PR #65: docs/investigacion/datos-fisica-correccion.md); cuenta solo la distancia desde el lanzador.

**Solución** (`solve`): recorre la trayectoria prevista del blanco con pasos de 0,5 s hasta 30 s y de 2 s hasta 400 s. Toma el primer instante τ en que:

```
minR ≤ r ≤ R_ef = maxR × rangeFactor(ca) × fireRange   (maxRtbm si es balístico/hipersónico)
altMin ≤ AGL   y   z − z_lanzador ≤ altMax
t_vuelo(r) ≤ τ   (el interceptor llega a tiempo, con ≤ 3 s de holgura)
```

**Perfil de velocidad del interceptor** (`physics/interceptor.js`): el misil acelera parejo hasta su velocidad máxima y después planea frenado por el arrastre.

```
motor  (t ≤ tb):  v(t) = vmax·t/tb                  s(t) = vmax·t²/(2·tb)
planeo (t > tb):  v(t) = vmax / (1 + (t − tb)/τd)    s(t) = vmax·tb/2 + vmax·τd·ln(1 + (t − tb)/τd)
t_vuelo(r) = √(2·r·tb/vmax)                          si r ≤ vmax·tb/2
           = tb + τd·(exp((r − vmax·tb/2)/(vmax·τd)) − 1)   si no
```

Unidades: `t`, `tb` y `τd` en s; `v`, `vmax` y `vInt` en m/s; `s` y `r` en **m** (el catálogo guarda los alcances en km: el código multiplica por 1.000).

- `vmax` (`sam.vmax`): velocidad máxima del interceptor.
- `tb` (`sam.tb`): segundos desde el lanzamiento hasta llegar a `vmax`, con aceleración pareja (la velocidad media en ese tramo es `vmax/2`). No es necesariamente la combustión total: con booster y sostenedor, si el booster hace casi toda la aceleración y el sostenedor solo compensa el arrastre, va la duración del booster y el sostenedor queda dentro del planeo (S-125, Pantsir); con motor de una etapa o de dos regímenes que acelera hasta el final, la combustión total (Buk: unos 15 s).
- `τd` (frenado) no es un dato: se despeja (bisección) para que el tiempo de vuelo hasta `maxR` sea `T = 1.000·maxR / vInt`, el de la velocidad media de antes. Así, en el borde de la envolvente el misil llega cuando llegaba y la calibración casi no se mueve; adentro llega antes (acelera al salir) y el tiempo de vuelo crece más rápido que lineal con la distancia.
- Hay solución solo si `vmax·(T − tb/2) > 1.000·maxR` (con `T > tb`): sin frenar, el misil tiene que poder pasar el alcance máximo en `T`. Si no (puede pasar en un sorteo de Monte Carlo con valores extremos), `τd` queda infinito: el misil no frena y tarda un poco más que `T`.
- Sin `vmax` y `tb` (cañones, drones interceptores, Hawk, S-200, MANPADS) el perfil es la velocidad constante `vInt` de siempre (`tb = 0`, `τd` infinito). El MANPADS **conserva el modelo legado** (velocidad media constante) **por falta de datos**, no porque esté validado: tira a menos de 1–2 km, donde el resultado depende casi solo de cuánto tarda en acelerar, y ese dato no es público (con un `tb` estimado de 2 s, la defensa de la refinería de Hisingen caía de 65% a 28%, lo que muestra cuánto pesa). Además, una sola entrada `manpads` representa a misiles distintos: el Stinger y el Igla (IR) y el RBS 70 (guiado por haz láser) tienen otra velocidad, otro motor y otro guiado. Que compartan el modelo legado **no valida que sean equivalentes**: es una simplificación pendiente hasta tener datos de cada uno.

El dibujo del interceptor en el mapa usa el mismo perfil: sale lento, acelera y llega frenando.

Cuando `fireRange` es menor que 1, la misma envolvente se exige también en el momento del
lanzamiento: la batería retiene el tiro hasta que el blanco entra en el porcentaje elegido. Así la
doctrina tiene un costo temporal real: puede quedar menos ventana para un segundo disparo y un
blanco que cruza el piso, el techo o el punto de impacto puede quedar sin solución. Con `fireRange = 1`
se conserva la conducta histórica.

**Alcance efectivo según el aspecto** (`rangeFactor`): un misil quema el motor en segundos y después planea, así que llega más lejos contra un blanco que viene de frente que contra uno que se aleja (tiene que alcanzarlo).

```
rangeFactor(ca) = 0,8 + 0,2·ca        ca = cos(dirección del blanco, línea blanco→lanzador)
                                       ×1 de frente · ×0,8 de costado · ×0,6 de cola
```

La dirección del blanco sale de su posición 0,5 s antes del punto evaluado (3D, con la altura en km). Se aplica a todos los sistemas, también cañones y drones interceptores. Es un valor de juego (sin fuente directa): la forma es la de las envolventes de CMO, que se achican contra blancos que se alejan (fuente `cmo_kin` en [investigacion/mejoras-fisica.md](investigacion/mejoras-fisica.md)); el 0,6 de cola es conservador.

**Doctrina "disparar dentro del X% del alcance"** (`S.fireRange`, deslizador 50–100% en la pestaña Defensa, `rules.fireRange` en los archivos, válido entre 0,3 y 1; por defecto 1): solo se busca encuentro dentro de esa fracción del alcance efectivo. El motor de Fleet Command dispara SAM al 75% (fuente `nwp_man`, mismo documento). Tirar más cerca sube la Pk (§7) pero deja menos tiempo para un segundo tiro.

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

**Familias de enlace y pasarelas** (`data/datalinks.js`, `physics/engagement.js#netPk`): una pista viaja por la familia de enlace de quien la detectó (Link 16, red C2 ucraniana, red rusa) y solo la usan las unidades de esa familia. Una **pasarela** une dos familias: la pista llega del otro lado con `gwLag` segundos más de demora y un disparo con ella rinde ×`gwPk` (la conversión y la demora agregan error de posición), además del `remotePk` del nivel de C2. Hoy hay una, **Link 16 ↔ red C2 ucraniana** (10 s, ×0,95; estimados, con rango en `UNC.gw`), **apagada por defecto**: se habilita por escenario (`rules.gateways`, casilla en Defensa). Hay fuentes de una imagen aérea común y de la licencia de Link 16 (2025), pero no de que esas pistas sirvan para disparar (docs/investigacion/datos-fisica-enlaces.md); las alertas ya se comparten entre familias sin pasarela. Con la red rusa no hay pasarela.

**Nivel de C2 por unidad** (`u.c2`, selector "Esta unidad" en el panel de selección; `physics/engagement.js#unitC2`): una unidad puede quedar con **menos** coordinación que la red (una batería aislada, o que depende de otro puesto de mando), nunca con más. Si queda "desconectada" no avisa, no publica ni recibe pistas y no participa en la triangulación de jammers (§4).

**Puestos de mando** (`u.cp`, selector "Puesto de mando" en el panel; `defs[].cp` en archivos; `physics/engagement.js#cpOf`): cada unidad pertenece a un puesto (el principal por defecto, o A, B, C). Las pistas de red, las alertas, el reparto de blancos (no repetir un blanco ya enfrentado, mejor tirador, capas) y la triangulación de jammers solo circulan **dentro** del puesto. Un nodo de C2 (puesto de mando o comunicaciones) puede pertenecer a un puesto (`objectives[].cp`): destruirlo degrada solo a sus unidades; sin puesto, a todas.

**Mejor tirador y defensa por capas** (`best`, solo en integrada): antes de disparar, una batería con enlace cede el blanco si (1) otra batería con enlace también puede tirarle ahora y es mejor (contra drones, menor costo esperado por derribo = costo/Pk; contra el resto, mayor Pk), o (2) es un dron y su ruta pasa más adelante por la envolvente de una capa con munición al menos 2 veces más barata por derribo. Así un NASAMS le deja los Shahed al Gepard que los espera junto al objetivo.

**Nodos de C2** (`effectiveC2`, `data/c2.js#C2_NODES`): si un objetivo **puesto de mando** de la defensa es destruido, el C2 efectivo cae a desconectada; cada **sitio de comunicaciones** destruido lo baja un nivel. El registro avisa cuando pasa.

**Enlace de datos del atacante** (`sv.link`, armas con `T.datalink`: Shahed, Geran-3 y Gerbera con módem 4G/mesh o Starlink): el operador ve la posición real, así que el arma descarta el engaño GNSS como si tuviera corrección por terreno (§4). Dentro del radio de un antidrón que corta enlaces (`J.linkJam`, Bukovel-AD) pierde esa ventaja.

**Señuelos** (`physics/decoys.js`): cada barrido de un radar de tiro (bandas con `decoyTau`: S 60 s, C 25 s, X 18 s, Ku 12 s; VHF y L no clasifican) que ve una pista suma `radar.scan` segundos de seguimiento. La pista queda clasificada cuando `1 − exp(−t/τ)` supera un umbral fijo de esa pista (sale de `th.phase`, ya sorteado: no cambia la secuencia de azar). τ es el más rápido de los radares que la siguieron: el de su banda dividido por `radar.discrim`, la capacidad propia de discriminación (Patriot MPQ-65: ×4, rango 1–8, estimado), ×4 para los señuelos que suelta un balístico (acompañan al misil). Un arma real se toma por señuelo con probabilidad 3%. Con la opción **"no tirarle a pistas clasificadas como señuelo"** (pestaña Defensa) se ahorra munición con ese riesgo; el debrief cuenta los señuelos reconocidos y las armas mal clasificadas.

**Recarga:** cada batería tiene munición lista (`mag`) y una **reserva** (`sam.reserve`, editable en el panel de selección). Cuando se vacía y no tiene interceptores en vuelo, recarga toda la batería en `sam.reloadS` segundos (Patriot ≈40 min, NASAMS e IRIS-T ≈20–30 min, Buk ≈13 min, grupos móviles ≈2 min; estimaciones con rango en `UNC`). Si el mapa tiene objetivos **depósito de munición**, solo recarga si alguno sigue en pie a menos de 30 km: destruirlo corta el reabastecimiento.

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
| Energía del misil en el encuentro (no cañones ni drones interceptores) | `energyPk(f)`, hasta 1,25 |
| Maniobra en el aire fino de la altura (misma condición) | `altitudePk`, hasta 1 (abajo) |

**Energía** (`energyPk`): con `f = r / (maxR × rangeFactor)` (fracción del alcance cinemático, **sin** la doctrina: la energía depende de la física, no de la regla de tiro).

Con perfil de motor y planeo (§6), la energía es la del misil después de recorrer `d = f × maxR` (el alcance de balísticos si el blanco es balístico). Contra un blanco que se aleja, `d` es mayor que la distancia real del encuentro, porque tiene que alcanzarlo:

```
energía(d) = 1                        mientras quema el motor (d ≤ vmax·tb/2)
           = (v(t_vuelo(d)) / vmax)²  en el planeo: la aceleración lateral disponible es ∝ ½ρv²
energyPk(f) = min(1,25; energía(f·maxR) / energía(0,9·maxR))
```

Sin perfil, la energía por tramos de antes:

```
energía(f) = 1                       si f ≤ 0,75
           = 1 − 2·(f − 0,75)        hasta 0,5 en f = 1
energyPk(f) = min(1,25; energía(f) / energía(0,9))
```

**Maniobra según la altura** (`altitudePk`, `physics/atmosphere.js`). La aceleración lateral que logra un misil con sus aletas es proporcional a la presión dinámica ½ρv², y el aire se afina con la altura: según la Atmósfera Estándar Internacional (ISO 2533, igual a la US Standard Atmosphere 1976 hasta 32 km), la densidad relativa σ es 0,60 a 5 km, 0,34 a 10 km, 0,16 a 15 km, 0,072 a 20 km y 0,032 a 25 km (prueba contra la tabla, ±0,5%). Cada misil tiene `sam.hFull`: la altura hasta la que, a velocidad máxima, todavía llega a su límite estructural de aceleración. Medido en fracciones de ese límite:

```
disponible  a/gmax = min(1, σ(h)/σ(hFull) · E)        E = (v/vmax)², la energía de arriba
necesario   n = 1 contra un blanco que maniobra en su fase terminal, 1/3 si no maniobra (est)
altitudePk = min(1, min(1, σ/σF·E/n) / min(1, E/n))   (lo que agrega la altura; energyPk ya cuenta la velocidad)
```

Abajo de `hFull` el factor vale 1, así que las Pk calibradas a baja altura no cambian. Arriba baja: un S-300 que alcanza a un blanco que maniobra a 25 km conserva menos de la mitad. Los misiles con **empuje lateral directo** (`sam.dthrust`: PAC-3 con sus motores de control, Aster con PIF-PAF) maniobran con cohetes y no dependen del aire (×1). `hFull` es una estimación por clase, con rango en UNC (largo alcance 15 km, alcance medio 10 km, defensa de punto 5 km): la aceleración máxima por altura de cada misil no es pública (handoff de datos, tema 4). No se modela todavía que las amenazas también maniobren menos arriba.

Es **relativa al tiro típico** (f = 0,9 → ×1) porque las Pk base ya están calibradas con episodios reales de tiros cerca del alcance máximo: aplicarla en absoluto contaría dos veces la pérdida de energía (una versión así bajaba Kiev de ≈70% a ≈25% de noches defendidas). Un tiro corto vale hasta ×1,25 (todavía acotado por el tope de 0,98). En el borde, con perfil, ×0,85–0,93 según el misil; sin perfil, ×0,71. Los valores 0,75, 0,5 y 0,9 son estimaciones de juego; la forma sigue los pasos A y B de `docs/investigacion/mejoras-fisica.md` §8. Todavía no cuenta la altura (aire menos denso arriba, menos maniobra).

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

**Daño funcional de las unidades** (`sim/engine.js#damageUnits`, parámetros en `data/targets.js`): cada caída también daña a las unidades de defensa en tierra que estén cerca (no a los aviones AEW), con la misma fórmula y un blanco `UNIT_TARGET` = 300 HP, huella de 30 m y vulnerabilidad 1,2 (una batería con radar, lanzadores y vehículos, sensible a esquirlas como un sitio de radar).

**Jammers terrestres** (`sim/engine.js#damageJammers`): una caída cerca de un jammer en tierra le quita vida con el mismo blanco `UNIT_TARGET`; a 0 queda destruido y deja de interferir (ruido, DRFM, GNSS y antidrón). Sin daño parcial: con vida sigue entero. Para atacarlo se apunta una salva a su posición. Los aéreos no se dañan así: los derriba el home-on-jam (§4). Falta un misil antirradiación que se guíe a su emisión.

| Vida perdida | Efecto |
|---|---|
| ≥ 20% | pierde un componente |
| ≥ 50% | pierde el otro |
| 100% | destruida |

- **Radar dañado** (`u.dmgRadar`): alcance de detección ×0,7 (radar, óptico o acústico) y tiempo de reacción ×1,5.
- **Lanzador dañado** (`u.dmgLauncher`): no lanza aunque tenga misiles; el sensor sigue viendo y alimentando la red.
- Si la unidad tiene los dos componentes, se sortea cuál cae primero (un número al azar solo en ese caso, para no cambiar la secuencia cuando no hay daño).
- Un impacto *directo* de un arma apuntada a la unidad la destruye, como antes.

Los valores (300 HP, ×0,7, ×1,5, umbrales 20% y 50%) son de juego, sin fuente directa. El debrief nombra las unidades dañadas y el panel de selección muestra qué perdió cada una.

Es un modelo de juego: no representa estructuras, incendios, penetración ni submuniciones.

---

## §11 Simplificaciones conocidas y mejoras posibles

| Simplificación | Efecto | Mejora posible |
|---|---|---|
| RCS con tres aspectos | Sin aspecto arriba/abajo ni detalle angular fino | Tabla por ángulo (como el "3D radar splat" de CMO PE) |
| Clutter de suelo, mar y lluvia | Celda de resolución, Billingsley (suelo), NRL 2012 (mar por estado), Barton/Marshall–Palmer (lluvia), factor de mejora MTI/PD por clase, notch por velocidad radial | Mejora sub-clutter, PRF y resolución publicadas por radar; velocidad media de la lluvia con el viento; clutter discreto |
| Clima simple | Lluvia (ITU-R P.838-3) y su clutter, estado del mar, techo de nubes y factores ópticos/acústicos fijos por escenario | Día y noche, clima que cambia durante el escenario |
| Recarga de batería completa | Recarga toda la batería de una vez (`sam.reloadS`) desde su reserva; los tiempos son estimaciones | Recarga por lanzador; vehículos de recarga como unidades |
| Swerling lento 1/3, integración no coherente opcional | Catálogo aún usa la aproximación de un pulso: faltan datos de integración por modo/radar; sin casos 2 y 4 | Datos de N con fuente/UNC; integración coherente y ruido correlacionado; Swerling 2/4 cuando haya evidencia de fluctuación pulso a pulso |
| Interceptor en línea recta a velocidad media | Energía resumida en dos factores (alcance según el aspecto y Pk según la fracción del alcance); el tiempo de vuelo sigue siendo r / vInt | Perfil de velocidad (motor y planeo) y límite de g (paso B de la propuesta) |
| Discriminación de señuelos | Por banda y tiempo de seguimiento, con un umbral fijo por pista | Discriminación por características (RCS, velocidad, trayectoria) |
| CRPA por conteo de direcciones | N − 1 nulos y 10° de separación; sin potencia de cada fuente ni distancia | Relación señal/interferencia por fuente; profundidad de nulo según los elementos |
| Daño funcional en dos componentes | Radar (alcance y reacción) o lanzador; sin reparación ni daño parcial de lanzadores | Componentes por lanzador, reparación con el tiempo, objetivos con capacidades (una base que no lanza aviones) |

La propuesta detallada de cada mejora (qué cambia, dificultad, datos, pruebas y cómo lo resuelven *Command: Modern Operations* y *Fleet Command*) está en [investigacion/mejoras-fisica.md](investigacion/mejoras-fisica.md).

Cada mejora cambia resultados. Antes de mergearla: correr las pruebas, revisar los cambios de los golden y anotarla en el CHANGELOG (ver [CONTRIBUIR.md](../CONTRIBUIR.md)).
