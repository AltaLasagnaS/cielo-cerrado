# Movilidad: datos, condiciones y huecos por variante

Consulta: **5 de octubre de 2026, hora de Buenos Aires**. Catálogo de `main`
`7de9e70` (#71). Reparto acordado en [#62][coord]: Claude implementa movilidad
en `src/`; Codex entrega evidencia. Esta entrega **no habilita sistemas ni cambia
la física**. [El registro JSON](datos-movilidad.json) conserva cobertura de los
22 identificadores activos, afirmaciones, fuentes, hashes y accesos fallidos.

## Qué se obtuvo

- **TRML-4D:** Hensoldt publica montaje y repliegue en **10–15 min**, para el
  radar. No publica en esa ficha el tiempo de la batería IRIS-T SLM completa.
- **S-300PS:** dos referencias técnicas describen **5 min** para la configuración
  autopropulsada. No trasladar ese dato a S-300PT ni a un radar sobre torre 40V6.
- **Buk-M1:** se localizó su ficha específica, con **5 min** de
  despliegue/repliegue. La ficha de Buk original contiene un cambio de modo
  de **≤20 s**, que no prueba arranque frío de Buk-M1.
- **Stinger:** un manual primario histórico separa el desmontaje del equipo
  transportado y el calentamiento del arma (**3–5 s**). No es encendido de radar,
  despliegue de batería ni prueba de tiro desde un vehículo que sigue circulando.
- **RBS 70 NG:** Saab publica **45 s** de despliegue; sirve para esa futura
  variante, no para completar el MANPADS genérico del catálogo.

**No se obtuvo un perfil completo de movilidad de una batería activa** con
velocidad media en ruta, fuera de ruta, ambos plazos y condiciones de operación.
Tampoco un tiempo de **arranque frío de radar** verificable para las variantes
activas. Los límites siguientes son de esta búsqueda; no demuestran ausencia de
la capacidad. No presentar una cifra nominal de folleto como ensayo operativo.

## Magnitudes que deben mantenerse separadas

1. **Repliegue:** de posición operativa a configuración apta para transporte.
2. **Despliegue:** desde configuración de transporte hasta el estado especificado
   por la fuente. Puede incluir estabilizadores, orientación, cables o pruebas.
3. **Arranque frío del radar:** energización de equipos apagados hasta poder
   producir el producto definido. No confundirlo con habilitar emisión desde
   espera, reacción de tiro o período de barrido.
4. **Velocidad:** máxima del chasis, media de marcha del vehículo y media de toda
   una batería son parámetros distintos. Marcha fuera de ruta requiere condiciones
   de terreno. Una autonomía de 400 km no es una velocidad de 400 km/h.
5. **En marcha:** observar, emitir, publicar pistas, recibir coordinación y
   disparar son capacidades distintas. Una plataforma estabilizada no confirma
   por sí sola todas ellas. Una parada corta incluye detenerse.

`null` significa **no encontrado o no transferible**, nunca cero ni falso.
El motor puede adoptar un freno conservador sin convertirlo en un hecho del
sistema real. Conservar también la diferencia entre radio de mando y enlace
técnico: que el radar esté apagado no prueba silencio de todas las comunicaciones.

### Rangos sin números fabricados

| Afirmación leída | Mínimo | Probable | Máximo | Interpretación |
|---|---:|---:|---:|---|
| TRML-4D, «Set up and decamp in 10–15 minutes» [M01] | 600 s | `null` | 900 s | Intervalo declarado del fabricante; no distribución estadística ni suma de ambos trabajos |
| S-300PS, tabla «Deployment/cooling time … 5/5» [M04] | `null` | `null` | `null` | Valor nominal publicado: 300 s por fase. Traducción defectuosa de repliegue; contrastar con [M05], sin inventar extremos |
| Buk-M1, «Deployment time (closures) … 5» [M06] | `null` | `null` | `null` | Valor nominal publicado: 300 s; tabla no separa tiempos por cada componente |
| Buk original, marcha→combate [M07] | `null` | `null` | 300 s | Límite superior para 9S18 y 9A310 descritos, no M1 |
| Buk original, espera→operativo con equipos encendidos [M07] | `null` | `null` | 20 s | Cambio de modo; no arranque frío ni despliegue |
| Torre 40V6M/MD, ciclo de redepliegue [M08] | 3.600 s | `null` | 7.200 s | Ciclo descrito por APA; **no** dos plazos independientes de 1–2 h |
| Stinger histórico, calentamiento del arma [M03] | 3 s | `null` | 5 s | Equipo de arma; ninguna transferencia a `radar.warmupS` |
| RBS 70 NG, «Deployment time 45 sec» [M02] | `null` | `null` | `null` | Valor nominal publicado: 45 s; no heredable por Stinger o Igla |

Los campos `publishedValue` y `relation` del JSON conservan los valores nominales
o límites. Su `range.probable` queda `null` cuando no se publica. **No importar
estas filas ciegamente a `UNC`** ni sustituir un probable ausente por el punto
medio. Tampoco elegir la menor cifra entre referencias de variantes diferentes.

## Cobertura del catálogo activo

En la tabla, **NF** implica `null` en el registro. Los datos se refieren a lo
identificado en la columna, no a todos los elementos que el icono agrega.

| ID activo / configuración | Repliegue y despliegue encontrados | Marcha en ruta / fuera de ruta | Detección o tiro en marcha / parada corta | Encendido del radar |
|---|---|---|---|---|
| `patriot`, PAC-3 MSE / MPQ-65 | NF por batería y M903. [M09] describe emplazamiento del lanzador histórico M901, no plazos MSE actuales | NF medias por batería; no usar máximo del tractor | [M09] exige emplazar/alinear el lanzador antes del tiro histórico. No certifica cada configuración M903 | NF arranque frío MPQ-65 |
| `patriot2`, GEM-T / MPQ-65 | Mismo hueco; compartir radar no prueba mismos trabajos ni misma dotación | NF | La evidencia histórica anterior no da tiempos de parada corta GEM-T | NF |
| `sampt`, Aster 30 B1 / Arabel | [M10] dice período «very short», sin cifra. La antigua URL MBDA ahora redirige a **NG** [A01] | NF | NF por configuración Arabel; no heredar NG | NF Arabel |
| `irist`, IRIS-T SLM / TRML-4D | Radar 600–900 s [M01]; lanzadores/CTOC y batería completa NF. [M11] identifica componentes separados | [M12] publica límite de chasis MAN SX45 de 90 km/h; media de batería y fuera de ruta NF | NF de tiro en marcha/parada corta de SLM. No heredar SLS sobre otra plataforma | NF; no agregar otra espera a los 10–15 min sin saber qué incluyen |
| `nasams`, AMRAAM / MPQ-64 | NF. [M13] confirma radar, FDC y lanzadores dispersables, sin plazos. [M14] es ficha histórica Sentinel | NF; versión de lanzador/chasis no fijada | NF; no sustituir lanzador remolcado por HUMRAAM ni por Avenger | NF; barrido de 30 rpm [M14] no es calentamiento |
| `s300`, mezcla PT/PS y radar en torre | **PS sin torre:** nominal 300/300 s [M04–M05]. **PT:** NF por fase. **40V6:** ciclo de 1–2 h [M08], sin reparto verificable | NF medias y fuera de ruta por configuración | NF de operación continua durante traslado; los soportes y montaje son parte de la configuración descrita [M04] | NF independiente; [M04] incluye controles y alta tensión en la transición completa |
| `buk`, Buk-M1 / 9S35 y 9S18M1 | Nominal 300 s en tabla M1 [M06], sin desglose de radar/C2/TELAR. El ≤300 s de [M07] es del Buk original | NF por M1 | NF para M1; no heredar capacidades de Buk-M2/M3 | NF M1. **≤20 s de [M07] no transferible** |
| `gepard`, versión sin fijar | NF de ambos plazos por versión | [M15] da velocidad de vehículo de 65 km/h; no media de batería ni velocidad fuera de ruta | [M15] muestra radares plegados en transporte y estabilización. Eso no prueba que toda detección en marcha sea imposible ni habilita tiro en marcha | NF |
| `mfg`, grupo móvil genérico | NF; ametralladora/reflector y vehículo concreto no fijados | NF; requiere elegir transporte y montaje | NF; «móvil» no certifica tiro mientras circula | No tiene radar RF; tiempo de preparación de óptica/reflector NF |
| `manpads`, Stinger / Igla mezclados | NF traslado/despliegue común. Stinger histórico: desmontar y ocupar posición [M03] | NF; equipo a pie y transportado son distintos | [M03] documenta convoy con equipo desmontado para tiro, **no** disparo desde vehículo en marcha. Igla NF; no heredar a ambos | Sin radar RF propio. Calentamiento Stinger histórico 3–5 s, no radar |
| `intdrone`, tipo Sting | NF preparación/traslado del equipo de lanzamiento y control | NF transporte terrestre; velocidad del dron interceptor no sirve | NF de lanzamiento/control desde plataforma que circula | Sin radar propio declarado; preparación de estación NF |
| `hawk`, I-Hawk Fase III | NF por conjunto MPQ-61/50/62, control y lanzadores; no heredar datos de otra fase | NF de convoy/remolques | NF de parada corta; una ficha de chasis no describe toda la unidad de fuego | NF por cada radar |
| `s125`, Pechora / Newa-SC mezclados | NF de configuración completa. [M16] describe S-125 legado y transporte; no prueba plazos Newa-SC ni Pechora-2M | NF por modernización | NF; no asumir que SNR-125 sobre remolque y conversión a MAZ tienen igual secuencia | NF SNR-125; reacción de 25 s del catálogo no es arranque frío |
| `s200`, S-200V / 5N62 | [M17] menciona despliegue desde marcha de 24 h en su descripción. Alcance exacto de esa posición/configuración requiere manual: no usar como plazo automático de todo S-200V | NF | NF. Transportable no equivale a movilidad táctica rápida | NF 5N62 |
| `pantsir`, Pantsir-S1 | NF por versión/chasis. Fuentes primarias consultadas inaccesibles [A02] | [M18] menciona 90 km/h para plataforma de ruedas descrita; no media ni dato de todas las S1 | [M18] describe incapacidad en marcha de **prototipo temprano**. No usar como flag falso de S1 de producción | NF |
| `tor`, Tor-M2 / 16×9M338 | NF para esa configuración exacta. **M2E de 8 misiles y M1** no son este M2 [M19–M20] | 80 km/h máximo **M2E con MZKT-69222** [M20]; media y chasis del M2 activo NF | [M19] dice M1 detecta en marcha y dispara en parada corta. No convierte eso en tiro en marcha del M2 activo | NF M2; reacción M1 no es encendido M2 |
| `s400`, 48N6DM / 92N6 en torre | NF de ambas fases de esa configuración completa; torre comparte el hueco [M08]. [M21] describe la familia, no el par de plazos requerido | NF; no usar dato MAZ de otra variante como promedio | NF por configuración exacta | NF 92N6 |
| `ewr`, 36D6 / ST-68UM mezclados | [M22] publica nominal 30 min despliegue/repliegue de **36D6M modernizado**. No es automáticamente 36D6/ST-68UM con torre | NF; transportado por dos vehículos no fija velocidad | NF en marcha | NF; modernización digital no implica arranque instantáneo |
| `p18`, P-18 / P-18MR mezclados | NF. [M22] distingue P-18MR de MR18; sus 10–15 min corresponden a **80K6T**, no P-18MR | NF de convoy KrAZ-6322 y fuera de ruta | NF; no heredar automatización móvil de MR18 | NF P-18MR |
| `acoustic`, nodo Sky Fortress | NF. Mover un nodo exige condiciones de reinstalación y conexión no publicadas aquí | NF; no asignar velocidad de vehículo genérico | NF de funcionamiento del micrófono durante transporte | No radar; arranque/sincronización de nodo NF |
| `aew_s340`, ASC 890 / Erieye | Fuera del alcance de traslados terrestres; no usar estados de camión | No aplicable; la velocidad de vuelo no es marcha terrestre | El catálogo ya modela sensor aéreo; esta entrega no modifica vuelos | NF arranque Erieye en configuración ASC 890 |
| `aew_a50`, A-50U / Shmel-M | Fuera del alcance de traslados terrestres | No aplicable | Esta entrega no modifica vuelos | NF arranque Shmel-M |

## Qué puede revisar Claude antes de integrar

- Conservar la **configuración real**: 5 min de S-300PS y torre de 25/39 m no
  forman juntos un perfil confirmado. La torre exige desmontaje/montaje y medios
  auxiliares; no basta con mover el icono y conservar su cobertura.
- Los trabajos pueden realizarse en paralelo o depender de otros. El tiempo de
  una batería no es automáticamente la suma ni el máximo de plazos de folletos:
  falta personal, secuencia, energía y comunicaciones.
- Si `mob.kmh` representa velocidad **media**, los máximos del chasis no llenan
  ese campo. Una velocidad ordenada por el autor, explícitamente hipotética y
  sometida a límites documentados, es una decisión de escenario; no una medida
  nueva para `UNC`. No proponer aquí un valor de ese supuesto.
- Registrar por separado detección en marcha, tiro en marcha y parada corta,
  junto con variante y condiciones. Un `false` conservador del motor debe
  distinguirse de un `false` confirmado por evidencia.
- Si el despliegue ya incluye energización/autoprueba, agregar un calentamiento
  independiente puede contar dos veces la misma espera. Mantenerlo desconocido
  hasta tener un desglose que permita cambiar emisiones durante una partida.
- Mantener rutas del escenario como rutas declaradas. SRTM informa alturas;
  no demuestra carreteras, capacidad de puentes ni transitabilidad.

Esto permite completar parte de F07 y la investigación de perspectivas; **no
cierra** la movilidad de campaña, órdenes desde el mapa, perfiles por variante,
campaña atacante/BDA o el resto del ROADMAP. Las variantes revisadas de CMO en
#71 siguen siendo evidencia secundaria experimental, no unidades activas nuevas.

## Fuentes leídas y alcance

Confianza **alta** indica que la fuente primaria afirma la magnitud citada, no
garantía de la prestación en Ucrania. **Media** indica descripción técnica
secundaria; **baja** o no transferible requiere resolver identificación/condición.
Dos sitios que repiten cifras no garantizan ensayos independientes.

- **[M01]** Hensoldt, [TRML-4D][trml], «Features and benefits»: *Set up and decamp
  in 10–15 minutes*. Primaria de fabricante, alta para ese radar y redacción.
- **[M02]** Saab, [RBS 70 NG][rbs], «Technical data»: *Deployment time 45 sec*;
  recarga <5 s es otra tarea. Primaria, alta; sólo NG.
- **[M03]** US Army, *FM 44-18-1 Stinger Team Operations*, 31-dic-1984,
  [PDF público][stinger], cap. 3 «Firing Sequence» y cap. 7 «Protecting a Convoy».
  Primaria histórica, alta para ese procedimiento. El PDF leído coincide en
  tamaño y SHA-1 con el original del índice Archive; no certifica todas las
  revisiones de Stinger. Calentamiento: *3 to 5 seconds*.
- **[M04]** Missilery, [S-300PS][s300ps], composición y características; 5/5 min,
  controles y paso del transmisor a alta tensión. Secundaria, media. La traducción
  automática «cooling» no es enfriamiento térmico medido.
- **[M05]** Carlo Kopp / Air Power Australia, [S-300P/S-400][s300apa], sección
  S-300PS: radar y TELs pueden quedar listos en 5 min. Secundaria técnica, media;
  no ofrece aquí distribución ni configuración ucraniana particular.
- **[M06]** Missilery, [Buk-M1][bukm1], composición 9A310M1/9S18M1 y tabla final:
  despliegue/repliegue 5 min. Secundaria, media para cifra nominal de la ficha;
  no desglose por componente.
- **[M07]** Missilery, [Buk original 9K37][buk], apartados 9S18 y 9A310:
  marcha→combate ≤5 min, espera→operativo ≤20 s. Secundaria, media histórica;
  **no transferible a M1 como arranque frío**.
- **[M08]** Carlo Kopp / APA, [40V6M/MD][mast], sección de movilidad: *relocate a
  mast equipped radar in 1-2 hours*, *redeployment cycle*. Secundaria técnica,
  media; ciclo y medios auxiliares, no plazos separados.
- **[M09]** US Army, *FM 3-01.85*, mayo 2002, [PDF][patriot], §§B-20–B-22,
  pp. PDF 119–120; §G, p. PDF 208. Primaria histórica, alta para emplazamiento
  del equipo descrito. Los 30 min son preparación de **reconocimiento RSOP**.
- **[M10]** CSIS Missile Threat, [SAMP/T][sampt], especificaciones. Secundaria,
  media para composición y descripción cualitativa; **sin cifra temporal**.
- **[M11]** Diehl, [IRIS-T SLM][diehl], componentes de la unidad de fuego.
  Primaria, alta para modularidad; sin tiempos cuantificados leídos.
- **[M12]** Army Recognition, [IRIS-T SLM][iris-ar], «Mobility»:
  límite electrónico de velocidad MAN SX45 90 km/h. Secundaria, media-baja:
  esa plataforma, **no** promedio operativo de la batería.
- **[M13]** Kongsberg, [NASAMS][nasams], elementos dispersables más de 20 km del
  FDC. Primaria, alta para arquitectura, sin tiempos de traslado cuantificados.
- **[M14]** ThalesRaytheonSystems, *AN/MPQ-64 Sentinel*, mayo 2003,
  [folleto público en espejo][sentinel], p. PDF 2. Primaria histórica en espejo;
  no plazos de montaje/arranque en el contenido leído. No heredar a Sentinel A4.
- **[M15]** Weaponsystems.net, [Gepard][gepard], «Layout», «Mobility» y tabla.
  Secundaria, media-baja: 65 km/h y representación de radares en transporte.
  No ensayo de tiro en marcha ni plazo de puesta en batería.
- **[M16]** Missilery, [S-125][s125], componentes transportados y lanzador.
  Secundaria histórica, sin plazos de las modernizaciones activas.
- **[M17]** Missilery, [S-200][s200], descripción de posición y 5P72D:
  *Deployment time - from march 24 hours*. Secundaria, baja para aplicación
  a todo S-200V: conservar el pasaje, pedir alcance/manual antes de activar.
- **[M18]** Carlo Kopp / APA, [Pantsir/Tunguska][pantsir], evolución histórica.
  Secundaria técnica; 90 km/h de plataforma descrita e incapacidad de disparar
  en marcha de prototipo temprano, no una certificación de S1 actual.
- **[M19]** Carlo Kopp / APA, [Tor][torapa], texto técnico de Tor-M1 y tabla
  de variantes: detección en marcha y tiro en parada corta; tiempo de parada
  añadido a reacción. Media para M1, no dato directo de M2/9M338.
- **[M20]** Army Recognition, [Tor-M2E][tor-ar], MZKT-69222, 8×9M331, máximo
  en ruta 80 km/h y despliegue aproximado 3 min. Media-baja: tabla con campo de
  tripulación duplicado/incongruente; requiere contraste, no habilita M2/9M338.
- **[M21]** Carlo Kopp / APA, [S-400][s400apa], componentes/configuraciones.
  Secundaria técnica; sin par de plazos exactos obtenido para radar en torre.
- **[M22]** Defense Express, [Closing air coverage gaps][p18dx], 27-jun-2019.
  Secundaria, media-baja: tabla 36D6M publica despliegue/repliegue 30 min.
  Después describe P-18MR y una tabla VHF con rótulo 36D6 inconsistente;
  **no copiar campos sólo por proximidad**. 80K6T es otro radar.

## Accesos que no son evidencia positiva

El JSON registra URL pedida, URL final, estado, hash de respuestas leídas y error.
No se adjuntan bases de juegos ni folletos completos con copyright. Un código
HTTP 200 por sí solo no confirma que se leyó la ficha buscada.

- **[A01]** MBDA: la URL histórica SAMP/T termina en ficha **SAMP/T NG**;
  Army Technology `/projects/hawk/` termina en vehículo **Hawkei**. Se descartó
  su uso para plazos Arabel/I-Hawk. Ukroboronprom `/en/product/radar-36d6`
  termina en portada; tampoco confirma una prestación del radar.
- **[A02]** ROE Pantsir-S1/Tor-M2E/S-400: 503; KBP Pantsir: bloqueo 403;
  KNDS Gepard, incluidas rutas actuales descubiertas: 503; Radionix: bloqueo
  403. Algunas rutas antiguas Hensoldt/Diehl/Radartutorial/Iskra cambiaron.
  Se encontró y leyó la nueva ficha Diehl; no se reemplazaron otras por títulos
  de buscador. Iskra actual mostró portada sin ficha técnica de movilidad.
- **[A03]** Las consultas web se usaron para descubrir enlaces. Los resultados
  de buscador, sus resúmenes y desafíos antibot **no** respaldan cifras. No se
  completó un perfil con un resumen, una URL que devolvió error o otra variante.

[coord]: https://github.com/AltaLasagnaS/cielo-cerrado/issues/62#issuecomment-6007179002
[trml]: https://www.hensoldt.net/products/trml-4d-air-surveillance-and-target-acquisition-radar
[rbs]: https://www.saab.com/products/rbs-70-ng
[stinger]: https://archive.org/download/FM_44_18_1_S_T_O_1984/FM%2044-18-1%20Stinger%20Team%20Operations%20%281984%29.pdf
[s300ps]: https://en.missilery.info/missile/c300ps
[s300apa]: https://www.ausairpower.net/APA-Grumble-Gargoyle.html
[bukm1]: https://en.missilery.info/missile/bukm1
[buk]: https://en.missilery.info/missile/buk
[mast]: https://www.ausairpower.net/APA-40V6M-Mast-System.html
[patriot]: https://archive.org/download/Fm301.85PatriotBattalionAndBatteryOperations/fm%203-01.85%20Patriot%20Battalion%20and%20Battery%20Operations.pdf
[sampt]: https://missilethreat.csis.org/defsys/samp-t/
[diehl]: https://new.diehl.com/defence/en/products/air-defence-systems/iris-t-slm2
[iris-ar]: https://www.armyrecognition.com/military-products/army/air-defense-systems/air-defense-vehicles/iris-t-slm-medium-range-air-defense-missile-system-technical-data
[nasams]: https://www.kongsberg.com/what-we-do/defence-and-security/integrated-air-and-missile-defence/nasams-air-defence-system/
[sentinel]: https://www.mobileradar.org/Documents/MPQ_64.pdf
[gepard]: https://weaponsystems.net/system/69-Gepard
[s125]: https://en.missilery.info/missile/c125
[s200]: https://en.missilery.info/missile/c200
[pantsir]: https://www.ausairpower.net/APA-96K6-Pantsir-2K22-Tunguska.html
[torapa]: https://www.ausairpower.net/APA-9K331-Tor.html
[tor-ar]: https://www.armyrecognition.com/military-products/army/air-defense-systems/air-defense-vehicles/tor-m2e
[s400apa]: https://www.ausairpower.net/APA-S-400-Triumf.html
[p18dx]: https://en.defence-ua.com/weapon_and_tech/closing_air_coverage_gaps-1670.html
