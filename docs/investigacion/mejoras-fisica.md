# Cómo mejorar los modelos físicos de *Cielo Cerrado*: propuesta de investigación

Fecha: 3 de octubre de 2026. **Todavía no se implementa nada**: este documento ordena las mejoras posibles, compara cómo las resuelven *Command: Modern Operations* (CMO) y *Fleet Command* (con el mod Naval Warfare Project) y dice, para cada una, qué cambia, qué tan difícil es, qué datos hacen falta y cómo probarla.

> **Nota de método (leer primero).**
> - **CMO:** la política de red de esta sesión bloqueó la lectura directa de command.matrixgames.com, ftp.matrixgames.com (manual), forums.matrixgames.com, steamcommunity.com, github.com, cmo-db.com y wikipedia.org. Todo lo que digo de CMO sale de **resultados del buscador** (título, URL y extracto). No leí las páginas completas. Cada afirmación lleva su fuente en la sección I. Conviene abrirlas antes de copiar un número.
> - **Fleet Command:** leí directamente el paquete **NWP v19.2.1** (Naval Warfare Project, mod de la comunidad para *Fleet Command* de Sonalysts, 1999). Usé el manual del mod (PDF, versión 0.20 de 2008), la planilla de la base de datos de Alan Caso y los scripts de doctrina en texto. Su licencia **prohíbe redistribuirlo y hacerle ingeniería inversa**. Por eso no está en el repositorio, no abrí los archivos binarios de la base (`.sdb`, `.odb`, etc.) y acá solo describo ideas, sin copiar tablas ni datos.
> - Los números "en el motor" de este documento los calculé con el código y el catálogo actuales (`src/physics/radar.js`, `src/data/`).

---

## A) Resumen

| # | Mejora | Qué gana el juego | Dificultad | ¿Cambia resultados? |
|---|---|---|---|---|
| 1 | **RCS según el aspecto** (prioridad) — **implementada** (v0.4, ver `docs/FISICA.md` §3) | Un radar que ve la ruta de costado detecta hasta 2× más lejos. Ubicar sensores al costado de los corredores pasa a ser una decisión táctica | Baja–media | Sí **[sim]** |
| 2 | **Fluctuación de la RCS (Swerling)** | La primera detección deja de ser "casi segura" hasta el 80% del alcance; aparecen las detecciones intermitentes | Media | Sí **[sim]** |
| 3 | **Clutter y Doppler** | Lo rasante sobre tierra o mar cuesta más de ver; volar "de costado" a un radar Doppler lo esconde (notch) | Media–alta | Sí **[sim]** |
| 4 | **Integración de la defensa aérea: C2, enlaces de datos y niveles** (pedido nuevo) | Distinguir una defensa desconectada, una que solo recibe alertas, una coordinada y una integrada; quién comparte pistas con quién | Media–alta | Sí **[sim]** |
| 5 | **Clima** (pedido nuevo: estados) | Lluvia que acorta X/Ku, nubes y niebla que ciegan lo óptico e IR, estado del mar | Media | Sí **[sim]** si el escenario tiene clima |
| 6 | **Discriminación de señuelos** | Los radares buenos aprenden a ignorar señuelos con el tiempo de seguimiento; los de VHF no | Media | Sí **[sim]** |
| 7 | **Recarga de munición** | Las baterías vuelven al combate; los depósitos de munición pasan a importar | Baja–media | Sí **[sim]** |
| 8 | **Energía del interceptor** | El alcance depende de si el blanco se acerca o se aleja; los interceptores llegan "cansados" al borde | Alta | Sí **[sim]** |

**Orden sugerido para implementar:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.
- 2 y 3 comparten la misma base (pasar de "alcance de corte" a **relación señal/ruido**): conviene hacerlas juntas o una detrás de la otra.
- La 4 es la más interesante para el juego después de la 1. No depende de las otras.
- Antes de la 2 conviene tener el **arnés de calibración reproducible** (ROADMAP): cambia cuándo se detecta y obliga a recalibrar las Pk.

**Regla para todas:** cada mejora es un PR propio, con pruebas de **propiedades** (por ejemplo "de costado se detecta más lejos que de frente"), golden revisadas y regeneradas a propósito, CHANGELOG con **[sim]** y la sección de `docs/FISICA.md` actualizada. El modo Monte Carlo sirve para medir el efecto: 40 corridas antes y después.

---

## B) Cómo lo resuelven CMO y Fleet Command (vista general)

| Tema | *Command: Modern Operations* | *Fleet Command* + mod NWP v19.2 | *Cielo Cerrado* hoy |
|---|---|---|---|
| RCS | Seis aspectos: frente, costados, cola, arriba y abajo, en dBsm. Las cargas externas la suben y se recalcula al soltarlas. La versión profesional (CPE) agrega un "3D radar splat" con la firma en detalle según el ángulo [cmo_rcs, cpe_splat] | Un solo valor de RCS por unidad (más VCS, la firma visual). Afecta el alcance de detección dentro del máximo del radar. Los furtivos con carga externa son otra entrada de la base, marcada "(E)", con más RCS [nwp_man] | Un valor frontal por banda. `rcsSide` está en el catálogo pero no se usa |
| Probabilidad de detección | El buscador no devolvió una descripción pública del modelo de Pd de CMO. Lo que sí dice: los radares dependen del clima, el clutter, la interferencia, las pérdidas de propagación y el horizonte [cmo_faq] | Según el manual, la RCS y la línea de vista fijan a qué distancia se ve un contacto; no menciona ningún sorteo de detección [nwp_man] | Pd por barrido: 95% hasta el 80% del alcance, cae a 30% en el borde |
| Rasantes / clutter | Clutter de superficie con el relieve de alta resolución para los sensores que miran hacia abajo. **Notch Doppler**: un blanco que no se acerca ni se aleja del radar no lo ve un radar Doppler (CMO solo modela el notch de velocidad radial 0) [cmo_terrain, cmo_notch] | Por **bandas de altura**: radares de superficie de 0 a 2.000 ft y de aire desde 2.000 ft. Algunos SAM marcados como "muy efectivos contra misiles VLOW" [nwp_man] | Solo los esconden el relieve y el horizonte |
| Clima | Nubes en capas (se puede volar debajo, adentro o encima), lluvia, estado del mar y temperatura. Afecta sobre todo lo visual e IR, y al radar en ciertas frecuencias [cmo_faq, cmo_weather] | No encontré modelo de clima en el manual del mod (solo una opción gráfica de lluvia en la configuración). El estado del mar afecta al sonar [nwp_man, fc_wiki] | No hay clima |
| Señuelos | TALD/ITALD son blancos extra para radares y SAM. Los MALD se modelan como aviones. Hay detección → clasificación → identificación y NCTR para algunos radares [cmo_decoy, cmo_faq] | El señuelo ADM-141 es un arma con su doctrina (cambios de rumbo al azar); para la defensa es un blanco más. La chaff es una contramedida que baja la Pk [nwp_doc] | Señuelos idénticos a armas para siempre |
| Recarga | Por **cargadores**: un vehículo de munición agrupado con el lanzador lo recarga solo. En un ejemplo del foro, una batería Patriot tarda unos 40 minutos [cmo_reload] | "Montajes recargables" de punto: cuando se vacían tardan **1 a 15 minutos** en recargar; casi ninguno tiene más de una recarga. Sin reabastecimiento [nwp_man] | Sin recarga |
| Energía del misil | Misiles con *booster* y planeo: aceleran, después pierden velocidad por arrastre, sobre todo al maniobrar. Los ramjet mantienen energía. Opción de disparar dentro de la **zona de no escape** [cmo_kin] | Velocidad constante y apagado al cumplir el tiempo máximo de vuelo. Disparo a un porcentaje del alcance máximo: 75% para SAM y AAM, 90% para antibuque [nwp_man, nwp_doc] | Velocidad media constante en línea recta |
| C2 y enlaces de datos | Imagen común por bando. Desde v1.12, **interrupción de comunicaciones**: una unidad aislada pierde la imagen común y solo se conoce su última posición. Interferencia de comunicaciones (en CMO desde v1.08). Enlaces de datos arma–plataforma de una o dos vías; **CEC/engage-on-remote** (un E-2D guía los SM-6 de un crucero). Control de fuego libre/restringido/retenido, EMCON y autorizaciones de tiro (WRA) [cmo_comms, cmo_cec, cmo_wra, cmo_iads] | Sin modelo de enlaces en el manual del mod. Detección ESM = alcance del emisor + alcance del receptor; radares LPI casi invisibles al ESM. La interferencia anula radares de búsqueda y seguimiento, no los IR, ópticos ni láser [nwp_man] | Interruptor global "red integrada" (`S.net`): pistas de red de 12 s y no repetir blancos |
| Pk | Sin descripción pública encontrada | **Script de doctrina terminal**: parte de un valor base y **resta puntos** por contramedidas del blanco, velocidad mayor a 999 nudos, maniobra, si es misil, si es muy rasante; piso de 20%; después tira un dado [nwp_doc] | Pk base por clase × modificadores multiplicativos, techo 98% |

**Ideas que vale la pena copiar:**
- De CMO: los **seis aspectos de RCS**, el **notch Doppler** como regla simple y la **interrupción de comunicaciones** como estado de cada unidad.
- Del mod NWP:
  - el **piso de Pk** (nunca baja de un mínimo, aunque se acumulen penalizaciones);
  - **montajes recargables** con 1 a 15 minutos de recarga;
  - **disparar a un porcentaje del alcance máximo** (el motor de Fleet Command usa 75% para SAM y AAM, según el manual del mod): es una forma barata de representar la energía;
  - la **interferencia que no afecta lo óptico ni lo IR**, que ya hacemos.

---

## C) Las mejoras, una por una

### 1. RCS según el aspecto (prioridad)

**Qué es.** La RCS es "qué tan grande se ve" un blanco en el radar. Un misil o un dron visto **de frente** muestra poco (la punta). **De costado** muestra todo el fuselaje y las alas: devuelve mucho más eco. Desde la cola se ven el motor y la tobera.

**Qué hace hoy el motor.** Usa siempre la RCS frontal (`th.rcs`, ajustada por banda en `rcsAt`). El catálogo ya tiene `rcsSide` para Shahed, Kh-101, Kalibr y ATACMS, pero no se usa (`docs/FISICA.md` §3 y §11).

**Cuánto cambia, con los números del catálogo actual** (alcance por señal, R ∝ σ^¼):

| Amenaza | Radar | De frente | De costado | Factor |
|---|---|---|---|---|
| Shahed (0,05 → 1 m²) | Patriot / IRIS-T (C, R1 = 100 km) | 47 km | 100 km | ×2,1 |
| Shahed | Pantsir (S, R1 = 30 km) | 14 km | 30 km | ×2,1 |
| Kh-101 (0,03 → 0,3 m²) | Radar 3D (S, R1 = 175 km) | 73 km | 130 km | ×1,8 |
| Kalibr (0,1 → 1 m²) | Patriot (C) | 56 km | 100 km | ×1,8 |

Un radar puesto **al costado** del corredor de los Shahed los vería al doble de distancia que uno puesto en la punta del corredor. Hoy eso no existe en el juego.

**Cómo lo resuelve CMO.** Seis valores: frente, costado, cola, arriba y abajo [cmo_rcs]. El motor elige según desde dónde mira el sensor. Las cargas externas suben la firma [cmo_rcs].

**Cómo lo resuelve Fleet Command (NWP).** No hay aspecto: un valor por unidad. Para los furtivos con carga externa hay una entrada aparte en la base, con más RCS [nwp_man].

**Propuesta.**
1. Datos: en `THREATS`, sumar `rcsSide` (ya está en `UNC` para algunas), `rcsRear` y, para los balísticos, `rcsBelow`. Donde no haya dato: reglas por clase marcadas "est" (por ejemplo, costado = frente × 10 para drones de ala delta y × 5–10 para misiles de crucero), con rango en `UNC` y confianza baja.
2. Física: `rcsAt(th, band, aspect)`. El ángulo de aspecto θ es el ángulo entre la velocidad de la amenaza y la línea amenaza → radar (θ = 0° de frente, 90° de costado, 180° de cola).
3. Interpolar **en decibeles** (la RCS cambia órdenes de magnitud):
   `log σ(θ) = log σ_frente · cos²θ + log σ_costado · sin²θ` para θ ≤ 90°; entre 90° y 180°, lo mismo pero con `σ_cola` en lugar de `σ_frente`.
4. Elevación: si el radar está muy arriba (AEW) o muy abajo (blanco balístico que cae), mezclar con `σ_arriba` o `σ_abajo` según el ángulo vertical.
5. La regla por banda (`BANDS[b].rcs`) se aplica después. En VHF el aspecto pesa menos (resonancia): usar `rcsVHF` sin aspecto o con un rango reducido.
6. `detR(u, th, J)` recibe el aspecto. La **cobertura** (`physics/coverage.js`) y la tabla "¿Quién lo ve?" de las fichas siguen usando el frente, que es el peor caso, y lo dicen.

**Archivos:** `physics/radar.js` (rcsAt, detR), `sim/engine.js` (pasar la velocidad), `data/threats.js`, `data/uncertainty.js`, `edu/concepts.js` (la calculadora de RCS de la Academia puede tener un control de ángulo), `docs/FISICA.md` §3.

**Dificultad:** baja–media. El cálculo es corto. Lo trabajoso son los datos y revisar las fichas.

**Datos que hacen falta.** RCS de costado y de cola por arma. No hay mediciones públicas. Para el Shahed hay un modelado académico de Járkov (ya citado en `UNC`): mediana de 0,23 m² en todos los aspectos y detección de frente 1,7–2 veces menor que de costado. Para el resto: analogía de forma y tamaño, con confianza baja y rango ancho, para que el Monte Carlo muestre cuánto pesa.

**Cómo probarlo.**
- Propiedades (`tests/physics.test.js`):
  - `rcsAt` con θ = 0 da el frente y con θ = 90° da el costado;
  - crece de forma monótona entre 0° y 90°;
  - en VHF varía menos que en X;
  - con `σ_costado = σ_frente` el resultado es idéntico al de hoy.
- Escenario de prueba: una sola amenaza que pasa a 30 km de un radar. La primera detección tiene que ocurrir antes que en el motor actual.
- Golden: van a cambiar. Lo esperable es más detecciones tempranas en `mb_noche` (los Shahed pasan de costado al radar 3D).
- Calibración: volver a correr los casos de `CAL`. Si las tasas salen de su rango, revisar.

**Riesgo.** Las rutas son poligonales, así que el aspecto salta en cada quiebre. No es grave: el radar barre cada pocos segundos.

---

### 2. Fluctuación de la RCS (modelos de Swerling)

**Qué es.** La RCS de un blanco real "titila": cambia de un barrido a otro porque el eco es la suma de muchas partes que a veces se refuerzan y a veces se cancelan. Swerling (1954, RAND) clasificó los casos típicos [swerling].
- **Swerling 1:** muchos reflectores parecidos, cambia de barrido a barrido. Aviones, drones.
- **Swerling 3:** un reflector dominante más otros chicos. Muchos misiles.

**Qué hace hoy el motor.** Pd = 95% hasta el 80% del alcance; de ahí cae en línea recta hasta 30% en el borde, y 0 más allá (`FISICA.md` §2).

**Propuesta.** Pasar a **relación señal/ruido (SNR)**, que además prepara el clutter (mejora 3) y el clima (mejora 5):
- Definir el alcance del catálogo como el de **Pd = 50% en un barrido** con probabilidad de falsa alarma Pfa = 10⁻⁶. Eso fija SNR₅₀ ≈ 18,9 (12,8 dB).
- `SNR(r) = SNR₅₀ · (R/r)⁴ · pérdidas`, donde R sale de `detR`.
- Swerling 1, fórmula cerrada: **Pd = Pfa^(1/(1+SNR))**.
- Swerling 3: usar la fórmula de un pulso de los textos de radar (por ejemplo Mahafza o Skolnik) o una tabla precalculada. **Verificar la expresión antes de implementarla.**

Comparación con lo que hace hoy el motor:

| Distancia / alcance | Pd hoy | Pd Swerling 1 |
|---|---|---|
| 0,3 | 0,95 | 0,99 |
| 0,5 | 0,95 | 0,96 |
| 0,8 | 0,95 | **0,75** |
| 1,0 | 0,30 | **0,50** |
| 1,2 | 0 | **0,26** |

A media distancia detecta un poco menos y en el borde un poco más, como pasa en la realidad. Con varios barridos seguidos la **detección acumulada** sube rápido, y eso queda solo porque cada barrido es un sorteo nuevo.

**Cómo lo resuelven.** No encontré una descripción pública del modelo de Pd de CMO. El manual del mod NWP describe la detección solo por alcance, RCS y línea de vista, sin fluctuación [nwp_man].

**Archivos:** `physics/radar.js` (nueva `pd(u, th, r, J, …)`), `sim/engine.js` (reemplaza la fórmula de Pd), `data/threats.js` (`swerling: 1 | 3`, por clase), `docs/FISICA.md` §2, Academia.

**Dificultad:** media. El código es corto. Lo delicado es que cambia el significado de `R1`, y eso obliga a recalibrar.

**Datos.** El caso Swerling de cada clase sale de los textos de radar (aviones y drones: 1; misiles: 1 o 3). Pfa = 10⁻⁶ es un valor típico de libro: dejarlo como parámetro.

**Cómo probarlo.**
- Propiedades: Pd vale 0,5 en r = R; es monótona decreciente en r; tiende a 1 cerca y a 0 lejos; con Pfa más chica, Pd baja.
- Estadística: en 10.000 sorteos con semilla, la frecuencia de detección a r = R está entre 0,48 y 0,52.
- Golden: cambian. Con Monte Carlo, comparar la distancia media de primera detección antes y después: tiene que moverse poco (menos de 10–15%). Si se mueve mucho, revisar `R1`.

---

### 3. Clutter y Doppler

**Qué es.** El **clutter** es el eco del suelo, el mar o la lluvia. Para un blanco que vuela a 30 m sobre el terreno, el radar recibe al mismo tiempo el eco del misil y el del suelo, que es mucho mayor. Los radares modernos separan lo que se mueve de lo que está quieto por **efecto Doppler** (cambio de frecuencia por la velocidad). Eso tiene un punto ciego: un blanco que vuela **de costado** al radar (no se acerca ni se aleja) no tiene Doppler, y el radar lo descarta junto con el suelo. Ese es el **notch**.

**Qué hace hoy el motor.** Nada de esto: a los rasantes solo los esconden el relieve y el horizonte.

**Cómo lo resuelve CMO.**
- Clutter de superficie, calculado con el relieve de alta resolución, para los sensores que miran hacia abajo [cmo_terrain].
- Notch Doppler: un blanco con velocidad radial cero no lo ve un radar Doppler. Solo modela ese notch, porque los otros dependen de datos clasificados [cmo_notch].
- Los sensores visuales e IR también sufren el fondo del suelo [cmo_terrain].

**Cómo lo resuelve Fleet Command (NWP).** Por **bandas de altura**: los radares de superficie ven de 0 a 2.000 ft y los de aire desde 2.000 ft [nwp_man]. En el script de Pk terminal, una bandera del misil (128) resta 30 puntos. Por los símbolos del manual ("SAM muy efectivo contra misiles VLOW") probablemente es la de los misiles muy rasantes, pero el manual no lo aclara [nwp_doc].

**Propuesta** (sobre la SNR de la mejora 2):
- **Capacidad del radar:**
  - nuevo campo `radar.mti`: 'none' (radar viejo sin filtro), 'mti' o 'pd' (pulso-Doppler);
  - `radar.scv`: visibilidad sub-clutter, en dB.
- **Pérdida por clutter**, solo si el blanco está por debajo de cierta altura sobre el terreno (por ejemplo 300 m) y el radar lo ve "contra el suelo" (ángulo de elevación chico):
  - sobre tierra: según la **rugosidad** local, que sale del relieve: desvío de la elevación en un radio de 1–2 km. `physics/terrain-analysis.js` ya calcula relieve relativo;
  - sobre el mar (elevación < 0): según el **estado del mar**, que entra con el clima (mejora 5);
  - un radar `pd` recupera casi todo (`scv` alto); uno `none` pierde mucho.
- **Notch:** si el radar es `pd` y la velocidad radial del blanco está por debajo de un umbral (por ejemplo 5–10 m/s), Pd = 0 en ese barrido. Combina muy bien con la mejora 1: de costado la RCS es máxima, pero el radar Doppler lo puede perder. Es un dilema real y muy didáctico.
- Ópticos e IR: un factor menor cuando el blanco se ve contra el suelo y no contra el cielo.

**Archivos:** `physics/radar.js`, `physics/terrain-analysis.js` (rugosidad cacheada por celda), `data/defenses.js` (`mti`, `scv`), `data/bands.js` (texto educativo), `sim/engine.js`, `docs/FISICA.md` §2.

**Dificultad:** media–alta. Los datos de visibilidad sub-clutter son escasos y hay que calibrar con cuidado para no volver invisibles a los misiles de crucero.

**Datos.** Qué radares son pulso-Doppler y su visibilidad sub-clutter: hojas de fabricante (pocas dan el número), textos (Skolnik, *Radar Handbook*) y analogía por generación. Clutter de mar por estado del mar: tablas clásicas (Nathanson). Todo con rango en `UNC`.

**Cómo probarlo.**
- Propiedades:
  - blanco a 5.000 m: sin efecto;
  - blanco a 30 m sobre relieve rugoso: Pd baja; sobre relieve plano baja menos;
  - radar `pd`: pierde menos que uno `none`;
  - velocidad radial 0 contra radar `pd`: Pd = 0; contra radar `none`: sin notch.
- Monte Carlo: en `mb_noche`, los Kh-101 rasantes tienen que ser detectados más tarde y los Shahed altos casi igual.
- Calibración: el caso del Oniks en `CAL` (tramo final a 10–15 m) es un buen control.

---

### 4. Integración de la defensa aérea: C2, enlaces de datos y niveles (pedido nuevo)

**Qué es.** Una batería no pelea sola. Recibe alertas de otros radares, comparte pistas y se reparte los blancos con las demás. Cuánto de eso funciona depende del **mando y control (C2)**: qué red hay, con qué demora llega la información, con qué precisión y quién decide a quién le tira cada uno.

**Qué hacía el motor antes de esta separación.** Un interruptor global, "red integrada" (`S.net`):
- encendido: cualquier sensor comparte la pista durante 12 s, los misiles activos o IR pueden usarla, y una batería no le tira a un blanco que ya tiene interceptores en vuelo;
- apagado: cada batería ve solo lo suyo y se pueden repetir blancos.

No distinguía sistemas ni demoras, y era todo o nada para todo el bando.

**Estado actual.** `S.c2` mantiene esos cuatro niveles para la coordinación general. Cada defensa declara `datalinks` (por ejemplo `['l16']`, `['ua_c2']` o `['ru_c2']`) y conserva el interruptor `link`. El C2 puede entregar alertas y repartir blancos aunque el interruptor esté apagado; una pista de tiro remota solo existe cuando emisor y receptor comparten una familia compatible y ambos tienen el enlace activo. Ver la [auditoría de C2 y datalink](c2-datalink.md) para el estado implementado y sus límites.

**Cómo lo resuelve CMO.**
- Imagen común por bando.
- **Interrupción de comunicaciones** (desde v1.12): si se dañan los equipos, si hay ataque electrónico o cibernético o si **interfieren sus comunicaciones** (en CMO desde v1.08), la unidad queda aislada: no recibe la imagen común y el jugador solo conoce su última posición reportada [cmo_comms].
- Enlaces arma–plataforma de una o dos vías.
- **CEC / engage-on-remote**: un crucero dispara SM-6 apenas el blanco entra en la envolvente cinemática, y un E-2D toma la guía cuando el misil baja del horizonte del barco [cmo_cec].
- Para un **IADS** al estilo del Pacto de Varsovia, el foro sugiere: prohibir el fuego automático y asignar cada blanco a mano desde un centro de mando. También se usan EMCON pasivo (la batería solo emite para tirar), el control de fuego libre/restringido/retenido y las autorizaciones de tiro (WRA) [cmo_iads, cmo_wra].

**Cómo lo resuelve Fleet Command (NWP).** No hay modelo de enlaces en el manual del mod. Lo único cercano: la detección ESM (alcance del emisor + alcance del receptor), los radares LPI, y la interferencia que anula radares de búsqueda y seguimiento [nwp_man].

**Cómo es en la realidad (para los datos del juego).**
- **Ucrania:**
  - Los sistemas OTAN (Patriot, NASAMS) usan **Link 16** y están pensados para integrarse entre sí [ua_layers].
  - La red nacional **Virazh** reúne datos de unas 40 clases de sensores. **Virazh-Planshet** lleva la imagen aérea a tabletas de las unidades, incluidos los grupos móviles [ua_virazh, ua_apps].
  - Hay también apps de alerta temprana con aporte civil [ua_apps].
  - Mezclar sistemas soviéticos y occidentales exige pasarelas.
- **Rusia:** los puestos de mando automatizados **Polyana-D4M1** y **Baikal-1ME** integran brigadas S-300/Buk/Tor/Pantsir y pueden asignar blancos a las S-400. **Senezh** permite mezclar sistemas [ru_polyana].
- **EE.UU.:** **IBCS** busca "cualquier sensor, el mejor tirador": una pista compuesta de varios radares (Sentinel, el radar del Patriot, LTAMDS) que puede guiar a cualquier lanzador [us_ibcs]. **CEC** hace lo mismo en la marina [cec].

**Propuesta: niveles de integración.** Son ajustables por bando y, opcionalmente, por unidad. Los nombres son una primera idea para cerrar después:

| Nivel | Qué recibe la batería | Demora y precisión de la pista ajena | ¿Puede tirar con pista ajena? | Reparto de blancos |
|---|---|---|---|---|
| **Desconectada** | Solo sus sensores | — | No | Ninguno: puede tirarle a lo mismo que otra |
| **Descoordinada** (solo alerta) | Alertas por voz o tableta: "drones desde el oeste" | 30–90 s · error de km | No: sirve para orientar el sector y estar lista (baja el tiempo de reacción) | Ninguno |
| **Coordinada** (procedimental) | Imagen común | ~10 s · error de cientos de m | Solo misiles activos o IR (como `S.net` hoy) | Por zonas o por "el primero que la toma" |
| **Integrada** (tipo IBCS/CEC) | Pista compuesta de calidad de tiro | 1–2 s · error de decenas de m | Sí, también *engage-on-remote* para interceptores compatibles | "El mejor tirador": mayor Pk o menor costo |

**Enlaces de datos compatibles.**
- Cada defensa declara sus redes, por ejemplo `datalinks: ['l16']` para Patriot y NASAMS, `['ua_c2']` para lo integrado a la red nacional ucraniana y `['ru_c2']` para lo integrado con Polyana o Baikal.
- Solo se comparten pistas entre unidades con una red en común.
- Una unidad **pasarela** (un puesto de mando, que se puede agregar como objetivo) conecta dos redes y suma demora.

**Ajustes de C2 del escenario:**
- nivel por bando;
- demora y error por nivel (con rango en `UNC`);
- regla de reparto (zonas, primero que la toma, mejor tirador);
- **qué pasa si se corta la comunicación**: la unidad baja a "desconectada" y se queda con la última imagen, como en CMO;
- **interferencia de enlaces**: un jammer de comunicaciones o la destrucción del puesto de mando degradan el nivel.

**Cómo se ve en el debrief.** Cuántas veces dos baterías le tiraron al mismo blanco, cuántos disparos salieron con pista ajena y cuánto tardó la alerta en llegar.

**Archivos:**
- `sim/state.js`: `S.c2` reemplaza a `S.net`, con compatibilidad: `net = true` equivale a "coordinada";
- `physics/engagement.js`: `trackOK` pasa a mirar la calidad y la edad de la pista;
- `sim/engine.js`: pistas por red con demora y error, y reparto;
- `data/defenses.js`: `datalinks`;
- `data/scenarios.js`: `rules.c2`;
- `ui/panels/defense.js`: selector de nivel;
- `sim/scenario-io.js`: guardar y cargar los ajustes, sumando una versión del formato.

**Dificultad:** media–alta. Toca el corazón del enfrentamiento. La primera separación entre C2 y familias de datalink ya está implementada; quedan topología, pasarelas, pérdida por enlace y guía continua como cambios posteriores.

**Datos.** Qué sistema usa qué red (fuentes de arriba, más fichas de fabricante). Las demoras y los errores típicos no son públicos: van como estimaciones con rango y confianza baja, y el Monte Carlo muestra cuánto pesan.

**Cómo probarlo.**
- Propiedades:
  - "desconectada" nunca usa pista ajena;
  - con "coordinada" y demora 0, el resultado es **idéntico** al de `S.net = true` de hoy (así las golden viejas siguen valiendo para ese caso);
  - con "desconectada", idéntico a `S.net = false`;
  - dos unidades sin red en común no comparten pistas;
  - destruir la pasarela corta el puente entre redes.
- Monte Carlo: con la misma disposición, de "desconectada" a "integrada", los interceptores por derribo tienen que bajar y la tasa de derribo subir.

---

### 5. Clima (pedido nuevo: estados de clima)

**Qué es.**
- La **lluvia** absorbe y dispersa las ondas: cuanto más alta la frecuencia, más pierde el radar.
- Las **nubes y la niebla** ciegan lo óptico y el infrarrojo.
- El **estado del mar** agrega clutter para los blancos rasantes sobre el agua.
- El **viento** cambia los tiempos de vuelo de los drones lentos.

**Cuánto pierde un radar con lluvia** (atenuación de ida, ITU-R P.838-3, polarización horizontal; calculado con los coeficientes de la recomendación) [itu838]:

| Banda (frecuencia de ejemplo) | Lluvia moderada, 5 mm/h | Fuerte, 25 mm/h | Muy fuerte, 50 mm/h |
|---|---|---|---|
| L (1,3 GHz) | 0,0002 dB/km | 0,001 dB/km | 0,002 dB/km |
| S (3 GHz) | 0,001 | 0,007 | 0,017 |
| C (5,5 GHz) | 0,006 | 0,08 | 0,25 |
| X (9,5 GHz) | 0,08 | **0,61** | **1,5** |
| Ku (15 GHz) | 0,27 | 1,7 | 3,6 |
| Ka (35 GHz) | 1,4 | 6,2 | 11,6 |

**Ejemplo.** Un radar X que mira a través de 10 km de lluvia fuerte pierde 2 × 0,61 × 10 ≈ 12 dB de ida y vuelta. Como R ∝ (señal)^¼, el alcance se multiplica por 10^(−12/40) ≈ **0,5**. Con la misma lluvia, VHF, L y S casi no cambian. Esto explica por qué los radares de alerta usan bandas bajas y los de tiro sufren con el mal tiempo.

**Cómo lo resuelve CMO.**
- Clima con temperatura, nubes por capas (se puede volar debajo, adentro o encima, y la visibilidad depende de la densidad), lluvia y estado del mar [cmo_faq, cmo_weather].
- Afecta sobre todo lo visual e IR, y al radar en ciertas frecuencias [cmo_faq].

**Cómo lo resuelve Fleet Command (NWP).** No encontré modelo de clima en el manual del mod: solo una opción gráfica de lluvia en `Fleet Command.ini`. Según una fuente secundaria, el estado del mar del editor afecta al sonar [nwp_man, fc_wiki].

**Propuesta: estados de clima por escenario** (presets, ajustables en el briefing):

| Estado | Lluvia (mm/h) | Extensión de la lluvia | Techo de nubes | Visibilidad | Mar (Douglas) | Viento |
|---|---|---|---|---|---|---|
| Despejado | 0 | — | — | 20+ km | 2 | 5 m/s |
| Nublado | 0 | — | 600 m | 10 km | 3 | 8 m/s |
| Lluvia moderada | 5 | Todo el mapa | 400 m | 5 km | 4 | 10 m/s |
| Tormenta | 25–50 | Celdas de 5–15 km | 300 m | 2 km | 5 | 15 m/s |
| Niebla | 0 | — | 0 (niebla) | 0,5 km | 2 | 2 m/s |
| Nieve | (equivalente bajo) | Todo el mapa | 300 m | 1–3 km | 3 | 8 m/s |

**Efectos en el motor:**
- **Radar:** atenuación de ida y vuelta `2·γ(f, R)·d_lluvia` en dB. Entra como pérdida en la SNR (mejora 2) o, sin la mejora 2, como factor `10^(−L/40)` sobre el alcance. `d_lluvia` es la parte de la línea radar–blanco que cruza lluvia (cálculo de segmento contra círculo, en el caso de celdas).
- **Ópticos e IR** (grupos móviles, MANPADS): el alcance se limita por visibilidad. Un blanco que vuela dentro o encima de las nubes no se ve.
- **Buscadores IR:** Pk menor con lluvia o nubes entre el interceptor y el blanco.
- **Acústico:** el viento sube el ruido de fondo y baja el alcance.
- **Mar:** alimenta el clutter de la mejora 3.
- **Drones lentos:** el viento de frente o de cola cambia su velocidad respecto del suelo (un Shahed a 185 km/h con 15 m/s de frente pierde un 30%).
- **Noche y día:** ya están en el texto de los escenarios. Acá pasarían a afectar lo óptico de verdad.

**Archivos:** `data/weather.js` (nuevo: presets y coeficientes por banda, con la fuente ITU), `physics/weather.js` (nuevo: atenuación y visibilidad), `physics/radar.js`, `physics/kinematics.js` (viento), `sim/state.js` (`S.weather`), `data/scenarios.js` (`weather`), panel del escenario y briefing, `render/` (sombreado de las celdas de lluvia).

**Dificultad:** media. La física es simple y con buena fuente. El trabajo está en la interfaz y en las celdas de lluvia.

**Datos.**
- Coeficientes k y α de ITU-R P.838-3 por frecuencia: alta confianza. Usar la frecuencia central de cada banda o, mejor, la de cada radar del catálogo.
- Visibilidad en niebla y lluvia: tablas meteorológicas estándar.
- Ruido acústico por viento: estimación.

**Cómo probarlo.**
- Propiedades:
  - sin lluvia, todo idéntico a hoy;
  - la atenuación crece con la frecuencia y con la lluvia;
  - en S y VHF, con 25 mm/h y 10 km, el alcance cambia menos de 1%;
  - en X, el mismo caso da un factor de alrededor de 0,5;
  - con niebla, un grupo móvil no ve a 2 km.
- Una prueba de datos que compare `γ` a 10 GHz y 25 mm/h con el valor de la recomendación (± 5%).
- Golden: no cambian, porque los escenarios actuales quedan "despejados". Sumar un caso golden con tormenta.

---

### 6. Discriminación de señuelos

**Qué es.** Rusia lanza señuelos (Gerbera) mezclados con Shahed, y el Iskander-M suelta hasta seis señuelos en la fase final. Ucrania reporta que eso le hace gastar interceptores Patriot [isk_decoys]. Un radar bueno puede distinguir, con tiempo, un señuelo de un arma por cómo se mueve, por cómo cambia su eco o por cómo frena en el aire. Un radar VHF de alerta casi no puede.

**Qué hace hoy el motor.** Los señuelos son idénticos a las armas para siempre. La "vista del defensor" lo muestra así, y el debrief cuenta los interceptores gastados en señuelos.

**Cómo lo resuelve CMO.** Separa **detección → clasificación → identificación**. Hay NCTR (reconocimiento no cooperativo del tipo de blanco) en algunos radares: por ejemplo, la modulación de las paletas del motor (JEM) solo funciona en un cono de ±15° del frente del blanco, y el tiempo de clasificación depende del entrenamiento del operador. Los señuelos TALD/ITALD son blancos extra [cmo_faq, cmo_decoy].

**Cómo lo resuelve Fleet Command (NWP).** El señuelo ADM-141 tiene su propia doctrina (cambia de rumbo al azar para parecer real). Para la defensa es un blanco más [nwp_doc].

**Propuesta.**
- Cada pista tiene un estado: `sin clasificar → arma | señuelo`.
- En cada barrido de un radar de **tiro** (C, X, Ku) con la pista propia, la probabilidad de clasificarla bien es `1 − exp(−t_seguimiento / τ)`, donde τ depende de:
  - la banda: VHF nunca; S lento; C/X/Ku más rápido;
  - el tipo de señuelo: Gerbera, de espuma y lento, cuesta poco; el señuelo del Iskander, que acompaña al misil, cuesta mucho;
  - la fase del vuelo: los señuelos balísticos frenan distinto que la ojiva al reentrar.
- Puede haber error: clasificar un arma como señuelo, con probabilidad chica.
- Nueva opción de doctrina: "**no tirarle a pistas clasificadas como señuelo**". Ahorra munición, con el riesgo del error.
- Debrief: cuántos señuelos se descartaron y cuántas armas se confundieron.

**Archivos:** `sim/engine.js` (estado de la pista y sorteo por barrido), `physics/engagement.js` (filtro en `engage`), `data/threats.js` (`decoyTau` por banda), `data/bands.js`, `ui/` (doctrina y vista del defensor), `sim/debrief.js`.

**Dificultad:** media.

**Datos.** Casi nada público y cuantitativo: la mayoría son reportes ucranianos sobre el efecto (gasto de interceptores) [isk_decoys] y la proporción de señuelos en las oleadas (la Fuerza Aérea ucraniana reportó que la mitad eran señuelos en algunos ataques [ua_decoys]). Los τ van como estimaciones con rango amplio y se **calibran** contra el caso del Iskander-M que ya está en `CAL`, donde el Patriot gasta unos 4 interceptores por ataque.

**Cómo probarlo.**
- Propiedades:
  - con τ infinito, idéntico a hoy;
  - un radar VHF nunca clasifica;
  - la probabilidad crece con el tiempo de seguimiento;
  - con la doctrina activa, los disparos contra señuelos bajan.
- Calibración: el caso del Iskander en `CAL` tiene que seguir dentro de su rango.

---

### 7. Recarga de munición

**Qué es.** Cuando una batería se queda sin misiles en los lanzadores, puede recargar desde vehículos de munición. Tarda, y el depósito tiene que existir.

**Qué hace hoy el motor.** Sin recarga: munición inicial y listo.

**Cómo lo resuelve CMO.** Con **cargadores**: si un vehículo de munición con el mismo tipo de cargador está agrupado con el lanzador vacío, lo recarga solo. En un ejemplo del foro, una batería Patriot tarda alrededor de **40 minutos**. Los depósitos (*ammo dumps*) también sirven para recargar SAM, artillería y unidades terrestres [cmo_reload].

**Cómo lo resuelve Fleet Command (NWP).** "Montajes recargables" de defensa de punto: cuando se vacían, el lanzador se pone en rojo y tarda **1 a 15 minutos** en recargar. Casi ninguno tiene más de una recarga, y no hay reabastecimiento [nwp_man].

**Propuesta.**
- Separar lo **listo** (en lanzadores) de la **reserva**:
  - `sam.ready`: misiles listos;
  - `sam.reserve`: en vehículos;
  - `sam.reloadS`: segundos por recarga;
  - `sam.launchers`: cantidad de lanzadores.
- Cuando un lanzador queda vacío y hay reserva, empieza una recarga. Mientras dura, ese lanzador no cuenta.
- Un objetivo de tipo `ammo` puede ser la reserva de una o más baterías: si lo destruyen, se acaba la recarga. Esto conecta con el daño funcional del ROADMAP.

**Dato a tener en cuenta.** Los escenarios actuales duran unos 25 minutos. Una recarga del Patriot de 30 a 60 minutos [patriot_reload] casi no entra; un Gepard o un grupo móvil sí. La recarga importa más en escenarios largos o con varias oleadas, que conviene agregar con este cambio.

**Archivos:** `data/defenses.js` y `UNC.def` (los tiempos van con rango), `sim/engine.js`, `sim/setup.js`, `ui/panels/selection.js` (reserva editable), `sim/debrief.js` (recargas hechas y "sin munición" que siguen apareciendo).

**Dificultad:** baja–media.

**Datos.**
- Patriot: 30–60 minutos por lanzador con grúa, según una fuente secundaria [patriot_reload]. Confianza media–baja: buscar el manual de campo.
- NASAMS, IRIS-T SLM y sistemas rusos: hace falta buscar. El buscador no dio datos firmes.
- Cañones (Gepard): recarga de cintas, del orden de minutos.

**Cómo probarlo.**
- Propiedades:
  - reserva 0: idéntico a hoy;
  - con reserva, la munición total disparada puede superar la inicial, pero nunca `ready + reserve`;
  - durante la recarga ese lanzador no dispara;
  - destruir el depósito corta la recarga.
- Golden: no cambian si los escenarios actuales quedan con reserva 0.

---

### 8. Energía del interceptor

**Qué es.** Un misil antiaéreo acelera con su motor unos segundos y después **planea**, perdiendo velocidad por el arrastre (más si maniobra). Contra un blanco que **se acerca**, llega lejos; contra uno que **se aleja**, se queda sin energía mucho antes. Cerca del borde de su alcance llega lento y maniobra mal.

**Qué hace hoy el motor.** El interceptor vuela en línea recta a una velocidad media constante (`sam.vInt`). Es igual de bueno a cualquier distancia dentro del alcance máximo.

**Cómo lo resuelve CMO.**
- Los misiles de *booster* y planeo aceleran hasta su velocidad máxima y después pierden velocidad por el arrastre, sobre todo en giros cerrados. Por eso es más fácil esquivarlos en el borde de la envolvente.
- Los ramjet (SA-6, Meteor) mantienen más energía.
- Opción de disparar solo dentro de la **zona de no escape** (donde el blanco no puede huir aunque gire en el momento del disparo) [cmo_kin].

**Cómo lo resuelve Fleet Command (NWP).** Velocidad constante. Algunas doctrinas apagan el arma cuando se cumple su tiempo máximo de vuelo (alcance ÷ velocidad). Y el motor, según el manual del mod, dispara SAM y AAM al **75% del alcance máximo** [nwp_man, nwp_doc].

**Estado:** paso A hecho (alcance según el aspecto, Pk relativa al tiro típico y doctrina de alcance; ver `docs/FISICA.md` §6–§7). Desde octubre de 2026 la doctrina menor que 100% también retiene el lanzamiento hasta que el blanco entra en ese umbral: esperar reduce la ventana para reintentar y puede dejar al blanco sin solución. Paso B hecho en octubre de 2026: perfil de motor y planeo con `vmax` y `tb` por misil, `τd` despejado para conservar el tiempo de vuelo a `maxR`, y Pk según la velocidad que le queda (`docs/FISICA.md` §6–§7). La ficha de cada misil muestra el alcance efectivo según el aspecto (la zona de no escape del modelo es el alcance contra un blanco que se aleja) y una tabla de tiempo de vuelo, velocidad al llegar y factor de Pk. Queda pendiente la maniobra según la altura, por falta de datos: la densidad del aire es conocida (atmósfera estándar), pero la aceleración lateral máxima de cada misil y la maniobra que exige cada blanco no son públicas, y PAC-3 y Aster maniobran con empuje lateral directo, que casi no depende de la densidad.

**Propuesta, en dos pasos:**
- **Paso A (barato, estilo NWP).**
  - Parámetro de doctrina "**disparar dentro del X% del alcance**": por defecto 100%, que es lo de hoy. Si se elige menos, el blanco tiene que estar dentro de ese porcentaje en el lanzamiento, no solo en el punto futuro de encuentro.
  - Pk menor cuando el punto de encuentro está más allá del 70–80% del alcance, por ejemplo `× (1 − 0,5·(r/maxR − 0,75)/0,25)` en ese tramo.
  - Fácil de explicar y de calibrar.
- **Paso B (perfil de energía).**
  - Por interceptor: tiempo de motor `tb`, velocidad máxima `vmax` y constante de frenado `τd`.
  - Velocidad: `v(t) = vmax·t/tb` durante el motor; después `v(t) = vmax / (1 + (t − tb)/τd)`.
  - El tiempo de vuelo a la distancia r sale de integrar `v(t)`: tiene forma cerrada con un logaritmo.
  - `solve` usa ese tiempo de vuelo en lugar de `r / vInt`.
  - En el encuentro, la Pk depende de la velocidad que le queda al interceptor frente a la del blanco y de la diferencia de g (maniobra terminal).
  - Una versión simple de la zona de no escape para mostrar en la ficha.

**Archivos:** `physics/engagement.js` (`solve`, `calcPk`), `data/defenses.js` (`tb`, `vmax`, `τd`, o el porcentaje de doctrina), `ui/fichas.js` (curva de alcance contra blancos que se acercan o se alejan), Academia.

**Dificultad:** paso A baja; paso B alta. Cambia la solución de tiro y obliga a recalibrar todas las Pk.

**Datos.**
- Velocidades máximas y tiempos de motor: algunos públicos (fichas de fabricante, CSIS Missile Threat).
- La constante de frenado casi nunca es pública: se ajusta para que el alcance contra un blanco que se acerca dé el `maxR` del catálogo.

**Cómo probarlo.**
- Propiedades:
  - con `τd` infinito y `tb` = 0, el paso B da lo mismo que hoy;
  - el tiempo de vuelo crece más rápido que lineal con la distancia;
  - el alcance contra un blanco que se aleja es menor que contra uno que se acerca;
  - en el paso A, al 100% el resultado es idéntico al de hoy.
- Recalibrar `CAL` completo.

---

## D) Datos nuevos en el catálogo (resumen)

| Mejora | Dónde | Campos | Con rango en `UNC` |
|---|---|---|---|
| 1 | `THREATS` | `rcsSide`, `rcsRear`, `rcsBelow` | Sí, confianza baja |
| 2 | `THREATS` | `swerling` (1 o 3) | No (clasificación) |
| 3 | `DEFENSES.radar` | `mti`, `scv` (dB) | `scv` sí |
| 4 | `DEFENSES`, escenarios | `links`; `rules.c2` (nivel, demoras, error, reparto) | Demoras y errores sí |
| 5 | `data/weather.js`, escenarios | presets; `weather` del escenario; k y α por banda | No (fuente ITU) |
| 6 | `THREATS` (señuelos) | `decoyTau` por banda | Sí |
| 7 | `DEFENSES.sam` | `ready`, `reserve`, `reloadS`, `launchers` | `reloadS` sí |
| 8 | `DEFENSES.sam` | `launchPct` (paso A); `tb`, `vmax`, `tauD` (paso B) | Sí |

Todo campo nuevo tiene que tener valor por defecto **neutro** (el que reproduce el comportamiento de hoy). Así cada PR puede entrar sin romper los escenarios y las golden cambian recién cuando se activan los datos.

## E) Cómo se prueba cada cambio (receta común)

1. **Pruebas de propiedades** en `tests/physics.test.js`: la forma del efecto, no un número mágico.
2. **Prueba de neutralidad:** con el parámetro en su valor neutro, la corrida es idéntica a la de hoy (comparar con las golden actuales).
3. **Golden:** activar los datos, ver la diferencia, revisar que vaya en la dirección esperada, `UPDATE_GOLDEN=1 npm test` y CHANGELOG con **[sim]**.
4. **Monte Carlo:** 40 corridas antes y después en `mb_noche`, `gb_refineria` y `mb_puente`. Anotar en el PR la probabilidad de supervivencia de los objetivos y la tasa de interceptación.
5. **Calibración:** correr los casos de `CAL` (mejor con el arnés `npm run calibrar` del ROADMAP) y verificar que sigan dentro de su rango.
6. **Academia y fichas:** cada mejora agrega o actualiza un concepto con su calculadora (por ejemplo, RCS con control de ángulo o atenuación por lluvia según la banda).

## F) Decisiones tomadas y preguntas que siguen abiertas

**Decidido (3-oct-2026):**
- **C2: dos ejes separados.**
  1. **Nivel de integración del bando**, uno de cuatro: desconectada, descoordinada, coordinada o integrada. Es cómo **circula la información en general**: voz, tabletas, sistema automatizado nacional.
  2. **Enlace de datos por unidad**, un interruptor aparte. Dos unidades con enlace compatible encendido se pasan **pistas de calidad de tiro**, con poca demora, **aunque el resto de la defensa esté fuera del circuito**. Ejemplo: un avión o un radar con Link 16 que le pasa la pista a un Patriot mientras los Buk y los grupos móviles solo reciben alertas por tableta.
  
  Quién tiene enlace nativo y comprobable está en el anexo K: son pocos, casi todos occidentales.
- **Interruptor de enlace también para el ataque**, por ahora solo de tecnología: si el arma tiene o no enlace de datos. Qué armas lo tienen está en el anexo K. El efecto en el juego (cambiar de blanco en vuelo, guía en vivo) se define cuando se implemente.
- **Clima:** estados **fijos** por escenario (sin clima que cambie durante la corrida).
- **RCS:** valores basados en OSINT y en la base de CMO. Cuando las dos fuentes difieren, el probable es el **punto medio en escala logarítmica** (media geométrica) y el rango cubre a las dos.
- **RCS:** se implementa primero. Los números salen como explica el anexo J.

**Siguen abiertas:**
- **RCS:** ¿cuatro aspectos (frente, costado, cola, abajo) o los seis de CMO? Propuesta: cuatro, en **dos rangos de frecuencia** como CMO (anexo J).
- **Energía:** ¿alcanza el paso A o queremos el perfil completo del paso B?
- **Efecto del enlace en las armas atacantes** (anexo K): ¿cambiar de blanco a mitad de camino, esquivar defensas conocidas o guía en vivo del operador? Queda para cuando se implemente.

## G) Notas sobre las fuentes

- Las páginas de CMO son del desarrollador (blog oficial, Mega-FAQ, manual) y de foros. Describen el **juego**, no la realidad: sirven como ideas de diseño, no como datos.
- El mod NWP es un trabajo de la comunidad de 1999–2013. Sus números están pensados para el motor de *Fleet Command* y para el equilibrio del juego (lo dice su manual). Sirve como inspiración de diseño, no como fuente de datos.
- La atenuación por lluvia (ITU-R P.838-3) y los modelos de Swerling son física estándar con fuente primaria: confianza alta.
- Lo de Virazh, Polyana, IBCS y los señuelos del Iskander sale de prensa especializada, del fabricante (Polyana) o de una sola parte del conflicto. Confianza media, para usar como descripción y no como número.

## H) Próximos pasos

1. PR "RCS por aspecto": tabla de RCS por arma (frente, costado, cola, abajo × banda baja y alta) con fuentes y rangos (anexo J), física, pruebas, golden y Academia.
2. Cerrar las preguntas que siguen abiertas (sección F).
3. Arnés de calibración reproducible (ROADMAP), antes de Swerling y clutter.
4. PR "C2 nivel 1": niveles del bando con demora y error, compatibles con `S.net`. PR "C2 nivel 2": interruptor de enlace de datos por unidad (anexo K).
5. Seguir el orden de la tabla A.

---

## J) Anexo: de dónde sacar los números de RCS

**El problema.** Ningún país publica la RCS medida de sus armas. Hay que estimarla. La idea es no inventar un número, sino juntar **varias estimaciones independientes**, poner el rango que cubra a todas y dejar que el Monte Carlo muestre cuánto pesa la duda.

**Cómo lo organiza CMO (y lo que conviene copiar).** Además de los seis aspectos, CMO guarda la firma de radar en **dos rangos de frecuencia** [cmo_rcs, cmo_db_bands]:
- **"A–D"**: bandas bajas, hasta ~2 GHz (VHF, UHF y L). Ahí los blancos chicos y furtivos se ven más grandes por resonancia.
- **"E–M"**: bandas altas, de ~2 GHz para arriba (S, C, X, Ku).

Encaja con lo que ya tenemos: `BANDS` sigue diciendo qué banda usa cada radar, pero la RCS de cada arma pasa a ser una tabla de **2 rangos × 4 aspectos** en lugar de un número frontal más multiplicadores. Las reglas actuales por banda quedan como valor por defecto cuando falte el dato.

**Ejemplo: el Shahed-136, según tres fuentes que no coinciden.**

| Fuente | Banda alta (S–X), frente | Banda alta, costado | Banda alta, cola | Banda baja, frente / costado / cola |
|---|---|---|---|---|
| Catálogo actual de *Cielo Cerrado* | 0,05 m² (0,01–0,2) | 1 m² (0,3–3) | — | `rcsVHF` 0,3 m² |
| Modelado académico de Járkov [kharkiv_rcs] | mediana 0,23 m² **en todos los aspectos**; de frente se detecta 1,7–2× más cerca que de costado (≈ 8–16× menos RCS) | | | — |
| Pedido a la base de datos de CMO [cmo_req_shahed] | −21 dBsm ≈ **0,008 m²** | −17 dBsm ≈ 0,02 m² | −21 dBsm | −13 / −10 / −13 dBsm ≈ 0,05 / 0,1 / 0,05 m² |

Las tres difieren **en un orden de magnitud**. El pedido de CMO saca el frente de "promedios de un modelo de RCS" y el costado y la cola **por analogía** con Harop/Harpy y Mobin. Lo honesto es un rango ancho:
- frente: 0,008–0,2 m², probable 0,05;
- costado: 0,02–3 m², probable alrededor de 0,5.

La diferencia frente–costado es la parte más incierta. Por eso el Monte Carlo con sorteo de parámetros es clave para esta mejora.

**Otras referencias útiles:**
- **Drones chicos medidos en banda X:** entre −15 y −5 dBsm (0,03–0,3 m²), con picos de frente y de costado. Hay mediciones por aspecto, polarización y frecuencia de 8 a 18 GHz (Rosamilia y otros; Cranfield; OTAN STO-MP-MSG-SET-183) [uav_rcs].
- **Misil de crucero tipo Tomahawk** (análogo del Kalibr): una simulación numérica (MLFMA) en **banda L** da una media de **1,41 m² de frente y 0,41 m² de cola**. En banda baja la cola puede ser *menor* que el frente [tomahawk_l]. GlobalSecurity cita ~0,5 m² para el Tomahawk y < 0,05 m² para el ALCM furtivo, ya usado en el catálogo [gs_rcs].
- **Base de datos de CMO** (cmo-db.com, visor comunitario): trae valores por aspecto y por rango para casi todo el catálogo. Sirve como **segunda opinión**, citando cada valor como "estimación de juego". No conviene copiarla entera: es una base de terceros y sus valores también son estimados.
- **Mod NWP de Fleet Command:** un solo valor por unidad. Además, los valores están en los binarios de la base, que la licencia no deja abrir. No sirve para esto.

**Método propuesto para cada arma:**
1. Buscar mediciones o modelados académicos (confianza media).
2. Sumar la estimación de CMO como segunda opinión (confianza baja, "est. de juego").
3. Chequear contra la física. Los blancos chicos frente a la longitud de onda (drones en VHF) están en resonancia: la RCS en banda baja no puede ser mucho menor que en banda alta para un objeto de ese tamaño. De costado, el fuselaje y las alas dan reflejos especulares grandes.
4. Rango = desde la menor hasta la mayor estimación razonable; probable = la mediana o la más justificada; confianza baja salvo que dos fuentes independientes coincidan.
5. Todo con fuente en `SRC` y razonamiento en la nota de `UNC`, como el resto del catálogo.

**Hecho (base DB3K 515 de CMO).** Con la base moderna se tomó el valor de CMO arma por arma (frente, costado y cola en E–M, y frente en A–D) y el probable pasó a ser la **media geométrica** con la estimación por forma u OSINT; el rango cubre a las dos. Resultado principal: CMO trata al **Kh-101** (−40 dBsm de frente) y al **Storm Shadow** (−44 dBsm) como muy furtivos, así que bajaron de 0,03 y 0,05 m² a ≈0,0017 y 0,0014 m² (un radar los detecta a la mitad de distancia que antes, porque R ∝ σ^¼). Iskander, Kinzhal y Zircon subieron un poco; Kh-22, Kalibr, ATACMS y Neptune bajaron un poco. Sin entrada en la base: Gerbera, Liutyi y Flamingo (quedan con la regla general). Para unidades futuras la base también trae, por ejemplo, UMPK FAB-500 (−18,7 dBsm), KAB-1500 (−12,2), Kh-59M (−10,6), Lancet-3M (−29,8) y Harop (−19).

**Qué hacía falta para avanzar más rápido:** leer cmo-db.com y los papers de RCS de drones. Hoy la red del entorno los bloquea. Hay dos caminos: habilitar esos dominios, o que me pases capturas o exportaciones de las fichas de CMO de las armas que nos interesan (Shahed, Geran-3, Gerbera, Kh-101, Kalibr, Iskander, Kinzhal, Kh-22, Oniks, Tsirkon, Storm Shadow, ATACMS, Neptune, Liutyi y Flamingo).

---

## K) Anexo: quién tiene enlace de datos de verdad (para el interruptor por unidad)

"Enlace de datos" acá quiere decir **intercambio digital de pistas de calidad de tiro entre sistemas**. No incluye una alerta por voz o tableta, que entra por el nivel del bando. Lo que encontré, con su confianza:

| Sistema (en el catálogo) | Enlace | Qué dice la fuente | Confianza |
|---|---|---|---|
| **NASAMS** | Link 16 nativo | Diseñado para integrarse en red con Patriot [ua_layers] | Alta |
| **Patriot** (Ucrania) | Link 16 (MIDS) | En 2025 Ucrania firmó el acuerdo CRC System Interface (CSI) para conectar por Link 16 F-16, Mirage 2000 y Patriot con plataformas aliadas. Hay reportes de que al principio el Link 16 y el IFF venían deshabilitados en los Patriot entregados [ua_l16] | Media |
| **IRIS-T SLM** | Link 16 y SAMOC | El fabricante y la prensa lo presentan compatible con Link 16 y lo demostraron en el ejercicio OTAN JPOW [iris_l16] | Media |
| **SAMP/T** | Probablemente Link 16 | No lo verifiqué en esta búsqueda | A verificar |
| **Saab 340 AEW** (Ucrania) | Probablemente Link 16 | Está operando en Ucrania; su enlace no lo verifiqué [ua_saab] | A verificar |
| **F-16 / Mirage 2000** (no están en el juego todavía) | Link 16 | Mismo acuerdo CSI [ua_l16] | Media |
| **S-300P, Buk y radares soviéticos** (Ucrania) | Sin enlace OTAN nativo | Se integran a la imagen aérea nacional con "cajas negras" de conversión hechas por ingenieros ucranianos con ayuda de EE.UU. y Alemania. La información circula, pero no como pista de tiro [ua_mix] | Media |
| **Gepard, grupos móviles, MANPADS, acústicos** (Ucrania) | Tabletas (Virazh-Planshet) | Reciben la imagen aérea para orientarse, no para guiar [ua_virazh] | Media |
| **S-400, S-300, Buk, Tor, Pantsir** (Rusia) | Red automatizada propia | Polyana-D4M1, Baikal-1ME y Senezh integran brigadas mixtas y asignan blancos a las S-400 (fabricante) [ru_polyana] | Existencia alta; desempeño real desconocido |

**Del lado atacante: qué armas del catálogo tienen enlace de datos.** "Enlace" acá es cualquier comunicación con el arma después del lanzamiento (telemetría, cambio de blanco, video o guía en vivo):

| Arma | ¿Enlace? | Qué dice la fuente | Confianza |
|---|---|---|---|
| **Shahed / Geran-2** | Sí, en parte de la flota desde 2025 | Módems *mesh* chinos (XK-F358, HX-50), cámaras y antenas en restos. Permiten telemetría, redirigirlos y hasta guiarlos en vivo a ~100 km del frente [shahed_mesh] | Media–alta |
| **Gerbera** (señuelo) | Sí, en algunos | Fueron los primeros con cámara y módem *mesh* en 2025 [shahed_mesh] | Media |
| **Geran-3** (a reacción) | Sí, en algunos | Ejemplar intacto recuperado en septiembre de 2025 con cámara, video en vivo y módem *mesh* [geran3_mesh] | Media–alta |
| **Kh-101** | Cambio de blanco en vuelo, según varias fuentes | No encontré confirmación de un enlace bidireccional [kh101_retarget] | Baja–media |
| **Iskander-M** | Antes del lanzamiento, sí; en vuelo, dudoso | El vehículo programa el misil por enlace. Hay versiones de que la cabeza óptica se puede corregir por radio desde AWACS o drones: sin confirmar [isk_link] | Baja |
| **Oniks** | Integración de blancos en el lanzador | El lanzador Bastion integra datos externos para salvas coordinadas. Que los misiles "conversen" entre sí es un antecedente del P-500 Bazalt, no algo confirmado en el Oniks [oniks_link] | Baja |
| **Kalibr, Kinzhal, Kh-22, Tsirkon, 9M728** | Sin datos públicos | — | — |
| **Storm Shadow** | Enlace de una vía para informar el impacto; el cambio de blanco en vuelo con enlace de dos vías figuraba como mejora planeada | [storm_link] | Media (lo planeado, sin confirmar) |
| **ATACMS** | No | Guía inercial + GNSS | Media |
| **Neptune** | Sin datos firmes | Solo prensa genérica sobre "actualización en tiempo real" | Baja |
| **Liutyi y Flamingo** | Sin datos firmes | Hay drones ucranianos con Starlink y *mesh* (Palytsia, Bucha), pero no encontré confirmación para estos dos [ua_mesh] | Baja |

**Cómo queda en el juego:**
- Cada defensa trae en el catálogo `datalinks` (por ejemplo `['l16']`), con fuente y confianza.
- En la tarjeta de la unidad, un interruptor **"Enlace de datos: Link 16 (encendido/apagado)"**. Sirve para escenarios donde el enlace está apagado, interferido o todavía no integrado, como el caso del IFF deshabilitado.
- Las unidades con el mismo enlace encendido comparten pistas de tiro con 1–2 s de demora y error de decenas de metros, **cualquiera sea el nivel del bando**.
- El resto recibe la información según el nivel del bando (sección C.4).
- Con aviones propios (ROADMAP, "Plataformas aéreas propias"), el caso "F-16 que le pasa la pista a un Patriot" sale solo.

---

## I) Fuentes

Claves usadas en el texto. Todas aparecieron en resultados de búsqueda del 3 de octubre de 2026. Las de CMO y Steam no las pude abrir por la política de red (ver la nota de método).

**Command: Modern Operations**
- **cmo_rcs**: Matrix Games, "Command – Inside the Features: Game & Sim Mechanics Part I" — <https://command.matrixgames.com/?p=1873>; foro Matrix Games, "Bug in aircraft Radar Cross Section inputs" — <https://forums.matrixgames.com/viewtopic.php?t=371536>
- **cpe_splat**: "When high fidelity counts: 3D radar splat in Command PE" — <https://command.matrixgames.com/?p=5546> y <https://www.matrixprosims.com/news/command-pe-3d-radar-splat>
- **cmo_faq**: Mega-FAQ de CMO — <https://command.matrixgames.com/?page_id=2920>; "Manual Addendum: AI & Mechanics" — <https://command.matrixgames.com/?page_id=2711>
- **cmo_terrain**: blog de CMO, mayo de 2021 (relieve de alta resolución y clutter para sensores que miran hacia abajo) — <https://command.matrixgames.com/?m=202105>
- **cmo_notch**: idem *cpe_splat* y foro Matrix Games, "Altitude/Speed/Radar questions" — <https://forums.matrixgames.com/viewtopic.php?p=3369216>
- **cmo_weather**: foro Matrix Games, "Weather in CMO" — <https://www.matrixgames.com/forums/tm.asp?m=4713177>
- **cmo_decoy**: foro Matrix Games, "MALDs: aircraft or missiles?" — <https://matrixgames.com/forums/tm.asp?m=3568974>
- **cmo_reload**: Steam, "How to replenish a SAM Patriot battery" — <https://steamcommunity.com/app/321410/discussions/0/142261027580494488/>; foro Matrix Games, "RELOAD SAM PATRIOT" — <http://www.matrixgames.com/forums/viewtopic.php?t=294701>; "Manual Addendum: Scenario Editor" — <https://command.matrixgames.com/?page_id=2709>
- **cmo_kin**: Steam, anuncios de CMO (misiles con *booster* y planeo, ramjet) — <https://store.steampowered.com/news/posts/?feed=steam_community_announcements&appids=1076160&appgroupname=Command:+Modern+Operations&enddate=1677159249>; blog de CMO, enero de 2023 — <https://command.matrixgames.com/?m=202301>
- **cmo_comms**: "The new features of Chains Of War: Communications disruption" — <https://command.matrixgames.com/?p=4454>; notas de CMO v1.08 (julio de 2025) — <https://steamdb.info/patchnotes/18808439/>
- **cmo_cec**: "The road to v1.10: New weaponry capabilities" — <https://command.matrixgames.com/?p=4076>
- **cmo_wra**: "New in v1.07: Weapon Release Authorization (WRA)" — <https://command.matrixgames.com/?p=3598>
- **cmo_iads**: foro Matrix Games, "IADS Hierarchy and EMCON" — <https://www.matrixgames.com/forums/viewtopic.php?p=4844971>; Steam, "Keep the Unit EMCON Passive." — <https://steamcommunity.com/app/1076160/discussions/0/3199244571748219057/>
- Manual de CMO (PDF, no se pudo abrir) — <https://ftp.matrixgames.com/pub/CommandModernOperations/CMO%20manual%20EBOOK.pdf>

**Fleet Command**
- **nwp_man**: *Naval Warfare Project Complete Manual*, versión 0.20 (NWS Team, 12-jun-2008), incluido en NWP v19.2.1. Secciones "How sensors are designed into the NWP files?", "Radar Symbology", "Reloadable Weapon Mounts", "Weapon Range Circles" y "Radar-jamming". Archivo local entregado por el usuario; no se redistribuye.
- **nwp_doc**: scripts de doctrina de NWP v19.2.1 (`TRMSAM3`: Pk terminal por puntos con piso de 20%; `TRM_ADM141`: señuelo; `Anti_air2`: chaff). Mismo origen y misma restricción.
- **nwp_db**: planilla "19.02 Database" de Alan Caso (columnas de alcance, altura, blindaje y "% Effective", que según su autor **no** es una Pk sino una comparación relativa entre armas parecidas). Mismo origen y misma restricción.
- **fc_wiki**: Wikipedia, "Fleet Command" — <https://en.wikipedia.org/wiki/Fleet_Command>; SUBSIM Review — <https://www.subsim.com/ssr/fleet1.html>

**Física**
- **itu838**: Recomendación ITU-R P.838-3, *Specific attenuation model for rain for use in prediction methods* (2005) — <https://www.itu.int/dms_pubrec/itu-r/rec/p/r-rec-p.838-3-200503-i!!pdf-e.pdf>. Los valores de la tabla se calcularon con sus coeficientes, tomados de la implementación abierta `itur` (ITU-Rpy) — <https://itu-rpy.readthedocs.io/en/latest/apidoc/itu838.html>
- **swerling**: P. Swerling, *Probability of Detection for Fluctuating Targets*, RAND RM-1217 (1954) — <https://www.rand.org/pubs/research_memoranda/RM1217.html>; DTIC, "Evaluation of Probability of Detection for Several Target Fluctuation Models" — <https://apps.dtic.mil/sti/html/tr/ADA013733/>

**Mando y control, enlaces y señuelos**
- **ua_layers**: Norsk Luftvern, "NASAMS vs PATRIOT" (Link 16) — <https://norskluftvern.com/2025/07/06/nasams-vs-patriot-complementary-pillars-of-nato-air-defense/>; New Geopolitics, "Complexity and Layering: How Ukraine's Air Defence Must Operate" — <https://www.newgeopolitics.org/2025/11/15/complexity-and-layering-how-ukraines-air-defence-must-operate/>
- **ua_virazh**: Ukraine's Arms Monitor, "Combat Software in the Service of the Armed Forces of Ukraine" — <https://ukrainesarmsmonitor.substack.com/p/combat-software-in-the-service-of>
- **ua_apps**: Kyiv Post, "After Drones, Smartphone Apps Are Ukraine's Next Secret Weapon" — <https://www.kyivpost.com/post/30149>; Rubryka, "Seven seconds from smartphone to air defense maps" — <https://rubryka.com/en/article/seven-seconds-to-air-defense-maps/>
- **ua_decoys**: Yahoo News, "Ukrainian Air Force reveals tactics of Russian drone attacks: 50% of aerial assets are live, 50% decoys" — <https://www.yahoo.com/news/ukrainian-air-force-reveals-tactics-103246675.html>
- **ru_polyana**: Wikipedia, "Polyana-D4" — <https://en.wikipedia.org/wiki/Polyana-D4>; Rosoboronexport, "Polyana-D4M1 (9S52M1)" — <https://roe.ru/en/production/protivovozdushnaya-oborona/avtomatizirovannye-sistemy-upravleniya/bazovyy-komplekt-podsistemy-upravleniya-pvo-edinoy-sistemy-upravleniya-voyskami-silami-i-oruzhiem-v/asu-polyana-d4m1/>; Wikipedia, "Buk missile system" (Baikal-1ME, Senezh) — <https://en.wikipedia.org/wiki/Buk_missile_system>; Armada International, "Russian IADS Redux Part-6" — <https://www.armadainternational.com/2023/08/russian-air-defence-command-and-control/>
- **us_ibcs**: Wikipedia, "Integrated Air and Missile Defense Battle Command System" — <https://en.wikipedia.org/wiki/Integrated_Air_and_Missile_Defense_Battle_Command_System>; Breaking Defense, "How the Army's IBCS unifies missile defense across domains" (mar-2025) — <https://breakingdefense.com/2025/03/deploying-forward-how-the-armys-ibcs-unifies-missile-defense-across-domains/>
- **cec**: Wikipedia, "Cooperative Engagement Capability" — <https://en.wikipedia.org/wiki/Cooperative_Engagement_Capability>; DTIC, "The Cooperative Engagement Capability (CEC)" — <https://apps.dtic.mil/sti/pdfs/ADA471258.pdf>
- **isk_decoys**: Kyiv Independent, "Russia upgrades Iskander ballistic missiles, more difficult for Ukraine's Patriots to intercept" — <https://kyivindependent.com/the-missile-no-longer-flies-straight-ukraine-says-russia-improved-its-ballistic-missiles/>; Kyiv Post, "Upgraded Russian Iskander Ballistic Missiles Outfox Patriots" — <https://www.kyivpost.com/post/53291>
- **patriot_reload**: The Defense Watch, "Patriot PAC-3 Missile Defense System – Full Specifications" (30–60 min, 3–5 personas; fuente secundaria) — <https://thedefensewatch.com/defense-systems/patriot-pac-3-missile-system/>; CSIS Missile Threat, "Patriot" — <https://missilethreat.csis.org/system/patriot/>

**RCS y enlaces (agregadas el 3-oct-2026)**
- **cmo_db_bands**: visor comunitario de la base de CMO (rangos "A–D" y "E–M") — <https://www.cmo-db.com/en/cmo/sensor/5958>
- **cmo_req_shahed**: pedido de alta del Shahed-136 en la base de CMO, con valores y razonamiento — <https://github.com/PygmalionOfCyprus/cmo-db-requests/issues/2214>
- **kharkiv_rcs**: Sukharevsky y otros (Universidad de la Fuerza Aérea, Járkov, 2023), modelado de la RCS del Shahed-136, ya citado en el catálogo (`SRC.kharkiv_rcs`) — <https://fliphtml5.com/pdvau/uvoj/Shahed_136_UAV_RCS_measurements/>
- **uav_rcs**: Rosamilia y otros, "RCS Measurements of UAVs and Their Statistical Analysis" (Cranfield) — <https://dspace.lib.cranfield.ac.uk/server/api/core/bitstreams/b70b94cb-9ed7-4067-a2ae-913fa1950b41/content>; OTAN STO-MP-MSG-SET-183, "Drone RCS Statistical Behaviour" — <https://publications.sto.nato.int/publications/STO%20Meeting%20Proceedings/STO-MP-MSG-SET-183/MP-MSG-SET-183-04.pdf>; "Low signature UAVs: radar cross section analysis, simulation, and measurement in X-band" (2025) — <https://link.springer.com/article/10.1007/s11760-025-04074-y>
- **tomahawk_l**: "Predição Radar do Míssil de Cruzeiro Tomahawk em Banda L baseado na RCS Dinâmica" — <https://www.researchgate.net/publication/363731654_Predicao_Radar_do_Missil_de_Cruzeiro_Tomahawk_em_Banda_L_baseado_na_RCS_Dinamica>
- **gs_rcs**: GlobalSecurity, "Radar Cross Section (RCS)" — <https://www.globalsecurity.org/military/world/stealth-aircraft-rcs.htm>
- **ua_l16**: Defense Express, "Ukrainian Patriots, F-16s and Mirages to Join NATO's 'Military Wi-Fi' Network via Link-16 Integration" — <https://en.defence-ua.com/weapon_and_tech/ukrainian_patriots_f_16s_and_mirages_to_join_natos_military_wi_fi_network_via_link_16_integration-14708.html>; EADaily (fuente rusa, 31-may-2025) — <https://eadaily.com/en/news/2025/05/31/creeping-introduction-ukrainian-f-16-and-patriot-air-defense-systems-are-connected-to-natos-military-wi-fi>; Kyiv Post, "Ukrainian Air Superiority 2026 Status Update" — <https://www.kyivpost.com/post/67328>
- **iris_l16**: Unmanned Airspace, "Diehl reports NATO interoperability of its IRIS-T SLM" — <https://www.unmannedairspace.info/counter-uas-systems-and-policies/diehl-reports-nato-interoperatility-of-its-iris-t-slm-air-defence-c-uas-system/>; Defence Industry EU, "IRIS-T SLM interoperability demonstrated during NATO exercise" — <https://defence-industry.eu/diehl-defence-iris-t-slm-interoperability-demonstrated-during-nato-exercise/>
- **ua_saab**: TWZ, "Ukraine's Saab 340 Airborne Early Warning Radar Plane Spotted Operating Over The Country" — <https://www.twz.com/air/ukraines-saab-340-airborne-early-warning-radar-plane-spotted-operating-over-the-country>
- **ua_mix**: IISS, "Ukraine's ground-based air defence: evolution, resilience and pressure" (feb-2025) — <https://www.iiss.org/online-analysis/military-balance/2025/02/ukraines-ground-based-air-defence-evolution-resilience-and-pressure/>; CSIS, "Does Ukraine Already Have Functional CJADC2 Technology?" — <https://www.csis.org/analysis/does-ukraine-already-have-functional-cjadc2-technology>; Ukraine War Analytics, "Radar Systems Supporting Ukrainian Air Defense" — <https://ukraine-war-analytics.com/air-defense/air-defense-radars-ukraine.html>
- **shahed_mesh**: Fabian Hinz, "Networking the Shahed" — <https://luftlage.substack.com/p/networking-the-shahed>; NV / Defense Express, "Russia turns Shaheds into FPV drones with cameras and mesh modems" — <https://english.nv.ua/nation/russia-turns-shaheds-into-fpv-drones-with-cameras-and-mesh-modems-defense-express-50544076.html>; Calibre Defence, "Mesh networks" — <https://www.calibredefence.co.uk/mesh-networks-how-russia-is-increasing-the-range-of-its-drones/>
- **kh101_retarget**: GlobalSecurity, "Kh-101 / Kh-102" — <https://www.globalsecurity.org/wmd/world/russia/kh-101.htm>; Missile Defense Advocacy Alliance, "KH-101/102" — <https://www.missiledefenseadvocacy.org/missile-threat-and-proliferation/todays-missile-threat/russia/kh-101102/>
- **geran3_mesh**: Euromaidan Press, "Ukraine recovers Russia's undamaged Geran-3 jet kamikaze drone carrying camera and live-link equipment" (27-nov-2025) — <https://euromaidanpress.com/2025/11/27/ukraine-recovers-russias-undamaged-geran-3-jet-kamikaze-drone-carrying-camera-and-live-link-equipment-video/>; dev.ua — <https://dev.ua/en/news/syly-oborony-zakhopyly-neushkodzhenyi-reaktyvnyi-dron-heran-3-z-kameroiu-ta-mesh-zviazkom-1764235139>
- **isk_link**: RUSI, "The Iskander-M and Iskander-K: A Technical Profile" — <https://www.rusi.org/explore-our-research/publications/commentary/iskander-m-and-iskander-k-technical-profile>; Army Technology, "Iskander Tactical Ballistic Missile System" — <https://www.army-technology.com/projects/iksander-system/>
- **oniks_link**: Wikipedia, "K-300P Bastion-P" — <https://en.wikipedia.org/wiki/K-300P_Bastion-P>; Wikipedia, "P-500 Bazalt" — <https://en.wikipedia.org/wiki/P-500_Bazalt>
- **storm_link**: Wikipedia, "Storm Shadow" — <https://en.wikipedia.org/wiki/Storm_Shadow>; FlightGlobal, "Upgrade for Storm Shadow/Scalp" — <https://www.flightglobal.com/upgrade-for-storm-shadow/scalp/55352.article>
- **ua_mesh**: UA News, "Palytsia equipped with Starlink" — <https://ua.news/en/war-vs-rf/ukrayinskii-dron-palitsia-otrimav-starlink-i-dalnist-polotu-do-90-km>; Kyiv Post, "Ukraine's FP-2 Drones Hit Deep Inside Russia Where Starlink Is Unavailable" — <https://www.kyivpost.com/post/83087>
- **cmo_isk**: foro Matrix Games, "Thread for DB3000 database problems, updates or issues", p. 92 (Iskander-E: −9,8 dBsm en la base) — <https://forums.matrixgames.com/viewtopic.php?t=243914&start=1820>
