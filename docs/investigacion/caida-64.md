# Caída de resultados del PR #64

Revisión: 5-oct-2026. Pedido de Claude en [coordinación #62](https://github.com/AltaLasagnaS/cielo-cerrado/issues/62#issuecomment-5998506745).
Sólo documentación y herramientas externas; no se modifica el motor, el catálogo ni las fuerzas.

## Dictamen

La caída se reproduce, pero **no permite concluir que el nuevo porcentaje sea más realista**.
Eliminar el conocimiento de la ruta futura y restringir las pistas a sus receptores son objetivos
correctos. El resultado combina esos cambios con una extrapolación sin actualización del punto
apuntado, un rechazo de llegada que no conoce la trayectoria del interceptor y cambios de reparto.

Hay dos efectos decisivos verificables: los Kalibr de Gotemburgo pasan de la defensa corta a
disparos de NASAMS/Patriot que no cumplen el piso al llegar; en Kiev la munición cara compensa
los drones, pero pierde capacidad contra Kh-101. No basta con encender una pasarela ni corregir
únicamente los fallos de los drones interceptores. Hace falta revisar el mecanismo y medir cada
cambio por separado antes de usar estos resultados para campaña/presupuesto.

No se encontró evidencia pública suficiente para habilitar automáticamente una pista de tiro
P-18/36D6 → Patriot/NASAMS/IRIS-T, ni límites de corrección terminal de las variantes exactas
que permitan sustituir el umbral actual por una curva numérica verificable.

## Método y reproducibilidad

Fuentes de código congeladas, en orden:

| Nombre | Commit | Cambio |
|---|---|---|
| #59 | `0a77102401f3e057c821d945f6f4da48ef0e7c3e` | Main al iniciar |
| Pista | `9acaea9` | Apuntar con posición/velocidad observadas; nueva comprobación al llegar |
| Redes | `f36f609` | Observaciones por radar/red y `trackKeys` |
| Prioridad | `a207526` | Prioridad con pista observada |
| Head posterior | `4fb9ac581fbb6d337976e563d99257ea0f00bce2` | EMCON/perspectivas posteriores; verificación adicional |

40 noches por escenario y revisión, semillas 1–40, catálogo probable sin sorteo, mapa real del
escenario, paso 0,25 s, reglas originales y pasarelas originales. Se captura `hooks.onLog`;
no se llama a RNG desde el diagnóstico. Se reconstruye la altura apuntada con la función pura
`solve()` y se exige que coincida su X/Y. No se añaden datos al estado del motor.

[Runner e instrucciones](../../experimentos/auditoria-64/README.md),
[resumen por semilla/unidad](../../experimentos/auditoria-64/data/resumen.json) y
[registro de acceso a fuentes](../../experimentos/auditoria-64/data/accesos-fuentes.json).
640 corridas principales, 160 de verificación del head, 320 replays de desglose por tipo y
20 de diagnóstico de llegadas. Los replays no aumentan la muestra estadística independiente.

Semillas iguales reproducen cada revisión; después de divergir las decisiones, diverge también
el consumo del RNG. Las diferencias son del sistema completo: no una atribución exacta a una
única fórmula ni pares de misiles con idéntico azar. Muestrear disponibilidad de velocidad cada
10 s tampoco equivale a contar oportunidades efectivas de tiro.

## Resultados completos de metas

Cada celda es **éxitos de defensa / 40**, no porcentaje de derribos.

| Escenario | #59 | Pista | Redes | Prioridad |
|---|---:|---:|---:|---:|
| `gb_refineria` | 26 (65%) | 8 (20%) | 2 (5%) | 2 (5%) |
| `kv_energia` | 37 (92,5%) | 17 (42,5%) | 10 (25%) | 10 (25%) |
| `mb_noche` | 26 (65%) | 18 (45%) | 19 (47,5%) | 22 (55%) |
| `kh_umpk` | 22 (55%) | 16 (40%) | 23 (57,5%) | 21 (52,5%) |

Reproduce exactamente la tabla del handoff, con sus porcentajes sin redondear.
`4fb9ac5` da **los mismos resultados por semilla, contadores de unidad y registros de rechazo**
que `a207526` en los cuatro escenarios. No se extiende la conclusión a commits futuros.
Con 40 noches, cambios de pocos puntos no prueban mejora: 2/40 tiene intervalo Wilson 95%
aproximado 1–17%, 10/40 14–40% y 37/40 80–97%.

| Escenario | Disparos medios #59 → Prioridad | Derribos reales medios #59 → Prioridad | Rechazos al llegar en 40 noches |
|---|---:|---:|---:|
| Gotemburgo | 45,90 → 48,70 | 25,82 → 24,15 | 140 |
| Kiev | 80,90 → 79,88 | 37,85 → 33,50 | 273 |
| Monterey | 74,08 → 77,43 | 29,02 → 28,30 | 189 |
| Járkov | 77,78 → 77,25 | 35,40 → 33,83 | 143 |

Los derribos reales excluyen señuelos. Un pequeño cambio de esa media puede destruir una meta
principal si el arma que pasa es un crucero dirigido al objetivo crítico.

## Desglose por unidades

Disparos y derribos son medias por noche. En estas tablas **derribos incluye señuelos**, para
no ocultar qué consume la batería. Rechazos es el total final de 40 noches. Unidades que no
dispararon en ambas revisiones quedan en el JSON y se omiten de las tablas.

### Gotemburgo

| Unidad | Disparos #59 → final | Derribos #59 → final | Rechazos |
|---|---:|---:|---:|
| Patriot-1 | 4,55 → 7,90 | 2,15 → 2,05 | 35 |
| IRIS-T-1 | 24,00 → 24,00 | 19,45 → 19,43 | 0 |
| NASAMS-1 | 13,38 → 16,05 | 10,32 → 10,40 | 105 |
| RBS 70-1 | 3,85 → 0,62 | 1,82 → 0,25 | 0 |
| Grupo móvil 2 | 0,00 → 0,05 | 0,00 → 0,00 | 0 |
| Interceptores-1 | 0,12 → 0,07 | 0,07 → 0,03 | 0 |

La etiqueta RBS 70 usa **MANPADS legado**: estos números no validan un modelo real del RBS 70.

Todos los Kalibr derribados son de esa unidad corta: **73 → 29 → 10 → 10 de 160** en las cuatro
revisiones. En #59 NASAMS/Patriot no disparan contra Kalibr; al final hacen **115 y 100 tiros**,
sin derribar ninguno. 105 y 35, respectivamente, son rechazados por `altMin`. El resto puede
terminar con el blanco ya impactado, por Pk u otra condición; no se contabiliza como rechazo.

Caso semilla 1, NASAMS/Kalibr 4, t=1472,75: X/Y previsto y real coincide a precisión numérica,
pero la altura prevista es 37,07 m ASL y la real 20 m ASL/AGL, por debajo del piso 30 m.
No hubo un giro horizontal que explique ese rechazo.

**Hipótesis a instrumentar:** `deconf` impide otra defensa del mismo puesto mientras vuela el
disparo previo. Un tiro que apunta sobre el piso pero luego falla puede ocupar la ventana del
MANPADS. El código confirma la regla y los contadores confirman la redistribución, pero esta
auditoría no mide el contrafactual sin ese bloqueo. No atribuirle una cantidad exacta de victorias.

Además hay **Saab AEW en Link 16**. La restricción de redes no significa que todas las baterías
occidentales se hayan quedado sin pistas. El MANPADS sin datalink pierde también el acceso a
la velocidad global que usaba después de una detección propia: la segunda caída no es exclusivamente
NASAMS/Patriot ni se resolvería necesariamente con `ua_l16`.

### Kiev

| Unidad | Disparos #59 → final | Derribos #59 → final | Rechazos |
|---|---:|---:|---:|
| Patriot-1 | 16,00 → 16,00 | 6,72 → 5,10 | 101 |
| NASAMS-1 | 18,00 → 18,00 | 14,05 → 14,18 | 17 |
| IRIS-T-1 | 23,68 → 24,00 | 19,95 → 20,40 | 0 |
| Gepard-1 | 15,15 → 16,43 | 5,47 → 5,45 | 0 |
| Interceptores-1 | 8,07 → 5,45 | 4,70 → 0,90 | 155 |

De los 273 rechazos, 155 son drones interceptores y 17 NASAMS por alcance, y 101 Patriot por
piso. La proporción exacta para las primeras diez semillas del final es 70 rechazos/785 tiros;
el número 75/788 del handoff no se reproduce con este protocolo. Falta identificar su revisión
y semillas originales antes de compararlo.

El resultado decisivo por amenaza: **Shahed derribados totales 960 → 960; Kh-101 254 → 75 de
280**. IRIS-T compensa al interceptor barato: pasa de 372 tiros a Shahed y 367 a Gerbera a
421 y 474. Sus tiros a Kh-101 bajan 208 → 65 y sus derribos de esos misiles 188 → 59.
Patriot mantiene un gasto similar contra Kh-101, 131 → 139 tiros, pero derriba 66 → 11.
NASAMS sigue gastando prácticamente toda su munición en Shahed.

Por eso contar sólo el fallo del dron o la probabilidad de un misil no explica las metas de
infraestructura. Hay redistribución de recursos, horarios y blancos. Los efectos separados de
coordinación, extrapolación, piso y RNG quedan pendientes de ablaciones controladas.

### Monterey

| Unidad | Disparos #59 → final | Derribos #59 → final | Rechazos |
|---|---:|---:|---:|
| Patriot-1 | 16,00 → 16,00 | 6,62 → 6,25 | 18 |
| IRIS-T-1 | 24,00 → 24,00 | 19,25 → 19,60 | 0 |
| NASAMS-1 | 8,20 → 10,50 | 6,42 → 7,97 | 0 |
| Gepard-1 | 1,10 → 1,25 | 0,35 → 0,50 | 0 |
| Gepard-2 | 17,80 → 18,73 | 6,88 → 6,20 | 0 |
| Grupo móvil 2 | 2,98 → 2,95 | 0,03 → 0,07 | 40 |
| Interceptores-1 | 4,00 → 4,00 | 2,33 → 0,42 | 131 |

171 de 189 rechazos tienen error X/Y <1e-6 km. Grupo móvil 2 tiene un rechazo por noche:
semilla 1, Kh-101 2, t=1472,75, error horizontal ~1,4e-14 km, vertical 7,82 m,
`f=1,000102625`. Un proyectil sin guía no recupera una corrección terminal; el motor usa el
mismo examen de envolvente que para misiles y drones. Los otros rechazos son 131 de drones
por alcance y 18 Patriot por alcance mínimo.

### Járkov

| Unidad | Disparos #59 → final | Derribos #59 → final | Rechazos |
|---|---:|---:|---:|
| Patriot-1 | 16,00 → 16,00 | 8,00 → 7,97 | 0 |
| IRIS-T-1 | 24,00 → 24,00 | 7,45 → 7,35 | 0 |
| NASAMS-1 | 18,00 → 18,00 | 13,47 → 11,55 | 140 |
| Gepard-1 | 19,77 → 19,25 | 6,47 → 6,95 | 3 |

143 rechazos por alcance. **122 quedarían dentro** si se conserva el denominador de alcance
efectivo de la solución original y sólo se actualiza la distancia final. Es un diagnóstico,
no una prueba de que esos tiros sean físicamente alcanzables. Semilla 1, NASAMS/Shahed 2,
t=718,25: error X/Y 55 m, `f` inicial 0,99924, final 1,00043, usando el aspecto inicial 0,99936.
136 rechazos están a <1 km de un waypoint intermedio: aquí sí conviene revisar los quiebres.

## Qué verifica realmente `arrivalReach`

En `physics/engagement.js`, recibe `(u, th, t)`. No recibe el interceptor, `tL`, su posición,
velocidad, combustible, trayectoria, guía disponible ni punto apuntado. Calcula distancia
**lanzador → blanco actual**, aspecto verdadero del blanco, piso, techo, mínimo y velocidad.
`engine.js` aplica ese resultado en el horario calculado antes de salir y luego usa la nueva
fracción de alcance en Pk. No hay propagación ni actualización de guía hacia la nueva posición.

Consecuencias verificables en código, confianza alta:

1. No distingue dos interceptores con igual batería/blanco/instante pero diferentes trayectorias
   o correcciones necesarias. Estar dentro de esa envolvente no acredita llegar a tiempo.
2. El aspecto cambia instantáneamente el denominador aun después de lanzar; no se integra
   la energía ni el esfuerzo de giro. El límite rechaza f>1 antes del sorteo de Pk.
3. Se reaplican límites respecto de la batería a armas ya en vuelo; su interpretación física
   debe distinguir envolvente de lanzamiento, adquisición y capacidad terminal.
4. La misma regla alcanza cañones y drones con motor continuo, aunque sus restricciones son
   diferentes de las de un SAM que acelera y planea.

No es sólo un sesgo pesimista. En las diez noches de Kiev se aceptan cuatro llegadas con error
horizontal >1 km. Una mata un Gerbera a **4,03 km** del punto apuntado (semilla 7, t=1355,25,
dron interceptor, 284 s de vuelo, f final 0,90384), sin computar esa corrección. No se afirma
que un dron real sea incapaz: faltan guía y dinámica para decidirlo.

Tampoco es un simple error de coma flotante: el déficit más pequeño de piso es 6,1 cm en
Gotemburgo y 11,8 cm en Kiev; los rechazos por alcance superan las tolerancias numéricas normales.
Añadir un epsilon no resolvería el problema del modelo.

### Fuentes de corrección terminal y Pk cerca del límite

La revisión [datos-fisica-maniobra.md](datos-fisica-maniobra.md) y el trabajo complementario
[PR #65](https://github.com/AltaLasagnaS/cielo-cerrado/pull/65) mantienen gimbal y aceleración
terminal desconocidos por variante. [F4] confirma PIF-PAF de Aster, pero «high G» no fija
aceleración sostenida a una altura/velocidad ni una curva de Pk. [F5] describe la arquitectura
NASAMS y AMRAAM, sin límites terminales cuantificados. [F6] explica por qué la sustentación
depende de densidad, velocidad, coeficiente y superficie; no da números de un interceptor concreto.

**No encontrado:** curva pública Pk(f) por variante, campo de adquisición/gimbal aplicable al
tiro terrestre y aceleración lateral terminal con condiciones/duración. Un ancho de haz de
DB3K, una distancia aérea de AMRAAM, o 60 g sin condiciones no resuelven esos campos.
No hay respaldo para fijar aquí una transición de 1% o 2% ni aumentar el alcance real.

La revisión del motor debería representar por separado: predicción inicial, actualizaciones
que efectivamente recibe el misil, adquisición/seguimiento, movimiento del interceptor y
alcanzabilidad temporal. Si la fidelidad disponible no permite eso, describir explícitamente
la aproximación y medir su sensibilidad; no anunciarla como corrección terminal verificada.

## Rutas y quiebres cerca de la defensa

[F1], pp. 32–33, describe navegación inercial/GPS de Shahed y observación directa de un giro
alrededor del blanco para hacer una picada desde un rumbo preprogramado. Confianza media-alta
para que puedan realizar virajes programados; no especifica estas rutas ni sus radios de giro.
No demuestra maniobra reactiva frente a una batería ni aplica automáticamente a toda variante.

En el juego, `xyAt()` une waypoints por segmentos rectos y cambia de dirección sin radio de
giro. También hay perfiles verticales por tramos y altura sobre terreno anticipado (`ahead`).
Dos mediciones AGL pueden extrapolar una tendencia que cambia después al variar el relieve
o comenzar una picada. Los waypoints de estos escenarios son ilustrativos, no reconstrucciones
OSINT de ataques concretos. No se encontró evidencia de sus coordenadas de giro exactas.

El Shahed de Kiev semilla 1/número 10 falla a 8,11 km del quiebre, con vuelo del interceptor
de 294 s y error horizontal 1,20 km. La observación vieja se proyecta durante un vuelo largo:
«cerca de la batería» por sí solo no demuestra una ruta inválida. En Járkov sí aparece una
concentración próxima al quiebre. En Monterey coinciden los X/Y en casi todos los rechazos.
No corresponde borrar todos los giros para recuperar victorias: comprobar continuidad del
movimiento, actualizaciones de guía y sensibilidad a radio/posición, manteniendo desconocidos
los límites de maniobra de la variante que no estén documentados.

## Redes: evidencia, alcance y fecha

| Pregunta | Evidencia pública leída | Resultado/confianza |
|---|---|---|
| ¿NASAMS tiene arquitectura en red e interoperabilidad con Patriot? | [F5], fabricante: FDC, Sentinel, EO/IR y red interna de tiempo real; interoperabilidad con sistemas de mayor alcance como Patriot | Confirmado, alta para capacidad general; no certifica cualquier radar soviético |
| ¿Ucrania dispone de Sentinel asociados a NASAMS? | [F2], CRS IF12230, componentes y provisión a Ucrania | Confirmado institucionalmente; no equivale a integración P-18/36D6 |
| ¿CSI/Link 16 integra coordinación ucraniana occidental? | [F3a/F3b], licencia anunciada en 2025, declaraciones de la viceministra | Confirmado como anuncio/acuerdo, media; no dos comprobaciones independientes de calidad de tiro |
| ¿P-18/36D6 vía Virazh/Kropyva/Diia proporciona pista suficiente para lanzar NASAMS/IRIS-T/Patriot sin pista orgánica? | Ninguna fuente leída publica la cadena concreta sensor/convertidor/receptor, versión, latencia, precisión ni ensayo | **No encontrado** |
| ¿«Cajas negras» citadas en el catálogo resuelven esa cadena? | [F7] devuelve HTTP 404; no se leyó contenido verificable | No sustenta una pasarela habilitada |

[F2] incluso plantea explícitamente como pregunta de supervisión si NASAMS es plenamente
interoperable con sistemas no OTAN/UE suministrados a Ucrania. Es una pregunta, no una
prueba de incompatibilidad. [F3b] menciona intercambio de información de amenazas/targeting,
pero ni ese término ni «tiempo real» fijan los requisitos de lanzamiento con pista remota.
El anuncio de junio 2025 tampoco prueba un despliegue operativo en **Kiev invierno 2024–25**.

La separación de redes evita que una detección de cualquier radar resuelva la velocidad de
cualquier arma. En Kiev, el muestreo final registra 26.497 pares Patriot/blanco con velocidad
global pero sin velocidad local utilizable, sobre 54.527 pares nominalmente dentro de alcance.
En Gotemburgo, los correspondientes valores son sólo 584/20.499 para Patriot y 526/3.832 para
NASAMS; para RBS 70-1 son 226/326. Son muestras temporales correlacionadas, no tiros perdidos.
Confirman que el efecto de `trackKeys` varía mucho entre unidades y escenarios.

**No habilitar `ua_l16` a partir de estos datos.** Tampoco declarar que esos sistemas reales
carecen de integración. Separar alertas/COP, cueing para adquisición propia, medición de
velocidad y calidad suficiente para tiro remoto; la agrupación del simulador es una
aproximación. La capacidad NASAMS de netear FDC/Sentinel no necesita reducirse conceptualmente
a Link 16 entre cada sensor y cada lanzador. Su representación detallada queda para componentes.

## Entrega al responsable del motor

- Conservar la eliminación de omnisciencia y los límites de compatibilidad; revisar la
  equivalencia entre envolvente desde lanzador y corrección en vuelo, con los casos exactos arriba.
- Separar dinámica de SAM, proyectil y dron. Comprobar piso/altura prevista, quiebres y
  actualización de guía antes de decidir si cada rechazo es físicamente razonable.
- Medir por separado las reglas de llegada, reparto/deconf y extrapolación con diagnósticos
  explícitos. No presentar un contrafactual como un dato público de prestaciones.
- Mantener pasarelas de calidad de tiro no verificadas apagadas; buscar evidencia por cadena
  y época. No cambiar las fuerzas ni usar el éxito previo como objetivo de calibración.

Pendiente: dinámica/guía del interceptor y radio de giro del atacante; ablación de deconf;
interfaces ucranianas por configuración/época; límites terminales y curva Pk documentados.
Este informe no autoriza dar por cerrados esos campos ni el resto del ROADMAP.

## Fuentes

- **[F1] Secundaria técnica con observación directa, leída:** Justin Bronk con Nick Reynolds y
  Jack Watling, RUSI, *The Russian Air War and Ukrainian Requirements for Air Defence*,
  7-nov-2022, pp. 32–33 y nota 147 (observación de vuelo/impacto, octubre 2022).
  [PDF](https://static.rusi.org/SR-Russian-Air-War-Ukraine-web-final.pdf). Confianza media-alta
  para comportamiento observado; no tabla de maniobra ni ruta de los escenarios.
- **[F2] Institucional, leída HTTP 200:** CRS IF12230, Andrew Feickert, *National Advanced
  Surface-to-Air Missile System (NASAMS)*, actualizado 1-dic-2022, «Components» e «Issues for Congress».
  [Informe](https://www.everycrsreport.com/reports/IF12230.html). Confianza alta para su contenido;
  no confirma interoperabilidad soviética de tiro.
- **[F3a] Periodística, leída HTTP 200:** The New Voice of Ukraine, *Ukraine joins NATO aviation
  system with CSI software for F-16, Mirage coordination*, 1-jun-2025, anuncio del 29-may.
  [Artículo](https://english.nv.ua/nation/ukraine-integrates-into-nato-s-aviation-system-defense-ministry-says-50518462.html).
  Confianza media para anuncio; no prueba técnica del enlace.
- **[F3b] Periodística especializada, leída HTTP 200:** Defense Express, *Ukrainian Patriots,
  F-16s, and Mirages to Join NATO's “Military Wi-Fi” Network via Link-16 Integration*,
  1-jun-2025, anuncio CSI y cita de Kateryna Chernohorenko.
  [Artículo](https://en.defence-ua.com/weapon_and_tech/ukrainian_patriots_f_16s_and_mirages_to_join_natos_military_wi_fi_network_via_link_16_integration-14708.html).
  Confianza media para el anuncio; comparte origen declarativo con F3a.
- **[F4] Fabricante, leída previamente:** EUROSAM, *ASTER Missile Family*, «PIF-PAF Technology».
  [Página](https://eurosam.com/aster-missiles-family/). Alta para arquitectura, no números terminales.
- **[F5] Fabricante, leída HTTP 200:** Kongsberg, *NASAMS Air Defence System*, «The System»,
  «Flexible mission configuration» y «Evolution».
  [Página](https://www.kongsberg.com/kda/what-we-do/defence-and-security/integrated-air-and-missile-defence/nasams-air-defence-system/).
  Alta para arquitectura descrita; sin prueba específica de pasarela ucraniana.
- **[F6] Técnica primaria general, leída en investigación previa:** NASA Glenn,
  [Lift Equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/lift-equation/).
  Alta para ecuación general; no mide autoridad de maniobra de estas armas.
- **[F7] Acceso fallido, no evidencia:** MissileStrikes,
  [Lessons from Ukraine air defense](https://missilestrikes.com/guide/lessons-from-ukraine-air-defense/),
  HTTP 404 el 5-oct-2026. No se atribuye contenido a esa página.
- **[F8] Código/datos del simulador, reproducidos:** commits y runner de esta auditoría.
  Alta para los resultados del programa; no es una fuente independiente de prestaciones reales.
