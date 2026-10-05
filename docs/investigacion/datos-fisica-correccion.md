# Corrección terminal del interceptor y control de emisiones

Consulta: 5 de octubre de 2026. Relevo de Claude en el issue #62 después de
mergear #59. Sólo documentación: no cambia `arrivalReach`, fuerzas, golden
ni parámetros. El usuario autoriza datos secundarios de juegos, siempre con
fuente y confianza; esa autorización no resuelve contradicciones ni unidades.

## Resultado de la búsqueda

**No encontrado:** un par público verificable de límite angular del buscador
y aceleración lateral **disponible al final del vuelo**, con variante y
condiciones, para cada misil del catálogo. Tampoco se encontró una duración
universal documentada de radar apagado para Patriot, S-300/S-400, Buk o NASAMS.
Los huecos se conservan como `null`; no se toman del alcance, techo, beamwidth
o tiempo de montaje del sistema.

Sí hay respaldo para arquitecturas de control y para la importancia del control
de emisiones. La fuente NASAMS del fabricante pudo leerse esta vez y confirma
sensor EO/IR pasivo dentro de la arquitectura, sin dar un ciclo EMCON fijo.

## Tabla por interceptor activo del catálogo

NF = no encontrado en las fuentes consultadas; no ausencia de capacidad.
Los nombres compuestos del catálogo necesitan identidad más precisa antes de
atribuir una ficha de una variante a todas las demás.

| Entrada / misil | Gimbal o campo total de adquisición verificable | Aceleración lateral terminal, condiciones y duración | Evidencia y limitación |
| --- | --- | --- | --- |
| Patriot PAC-3; MSE en su perfil | NF | NF | [C2] confirma motor y superficies de MSE. [C3] describe control de actitud histórico de ERINT/PAC-3; no cuantifica lo disponible en MSE al final. |
| Patriot PAC-2 GEM-T | NF | NF | [C1] distingue familias del Patriot. No heredar control de actitud PAC-3 ni afirmar buscador activo de GEM-T. |
| SAMP/T, Aster 30 B1 | NF | NF | [C4] confirma PIF-PAF de la familia. «High G» y la cifra secundaria 60 g no fijan aceleración terminal sostenida por altura/velocidad. |
| IRIS-T SLM / IRIS-T SL | NF para variante terrestre | NF | Ruta Diehl [C8] devuelve 404 en esta consulta. SLS, SLM y el misil aire-aire no son intercambiables. Código CMO «High Off-Boresight» no da un ángulo. |
| NASAMS, AIM-120 sin bloque fijado | NF por bloque/configuración terrestre | NF | [C5] describe arquitectura y sensores, sin límite angular ni curva de control. No usar límites de lanzamiento desde avión como corrección terrestre. |
| S-300PS/PT, 5V55R en el catálogo | NF de seguimiento por misil/control | NF | [C7] documenta por separado las búsquedas anteriores. El mando/TVM no se reduce a un gimbal de buscador activo. PT con K/KD requiere su ficha propia. |
| Buk-M1, 9M38 en el catálogo | NF | NF | [C7]; 9M38/9M38M1 y 9M317/9M317M no se equiparan. La ficha antigua de juego tiene contradicción de velocidad. |
| MANPADS compuesto, Stinger/Igla | NF por variante exacta | NF | El marcador legado no permite copiar un límite a ambos. RBS 70 guiado por haz requiere otra configuración y restricciones de seguimiento del operador. |
| Dron interceptor tipo Sting | NF de cámara/control/operador | NF | No es un misil con gimbal radar. Faltan retardo de control, campo de cámara y envolvente de giro verificables. |
| I-Hawk Fase III, MIM-23B | NF | NF | [C7]; SARH requiere geometría de iluminación y recepción; no heredar una cifra de HAWK básico u otra fase. |
| S-125 modernizado, 5V27 | NF de seguimiento/control | NF | [C7]; guía por mando y límites del radar/control. Newa-SC no certifica que toda modernización sea idéntica. |
| S-200V, 5V28 | NF | NF | [C7]; iluminación SARH y condición de vuelo específicas, no sólo alcance máximo. |
| Pantsir-S1, 57E6 | NF de seguimiento/control | NF | [C7]; guía por mando, no un buscador activo inferido por analogía. |
| Tor-M2, 9M338 | NF de seguimiento/control | NF | [C7]; no copiar límites de 9M330/9M331. |
| S-400, 48N6DM; perfil con etiqueta 48N6 | NF por variante exacta | NF | [C7]; DM/E2/E3 no son una única ficha. Debe resolverse identidad antes de usar una cifra terminal. |
| Gepard / ráfaga 35 mm | No corresponde a buscador de misil | No hay corrección guiada en vuelo del proyectil modelado | La solución de tiro debe preceder al disparo; no aplicar la corrección terminal de un SAM a una ráfaga. |
| Grupo móvil / ráfaga 12,7 mm | No corresponde | No hay corrección guiada del proyectil modelado | Mismo límite conceptual; no convertir observación posterior en trayectoria corregida. |

La tabla delimita qué datos no se obtuvieron; no recomienda números por clase.
Una futura estimación explícita debe declarar su condición, incertidumbre y
efecto estadístico, sin llamarse medición ni garantía del fabricante.

## Qué sí aportan las bases DB3K recibidas

La selección revisada de DB3K 496/512/514/515 está en el PR #63, con script,
hash por archivo y registros crudos. No se adjunta la base comercial.

- PAC-3 MSE y ERINT referencian `DataSensor.ID=1715`, `Active Radar Seeker`.
  Sus campos de ancho horizontal y vertical tienen valor 1. Esto no es el
  ángulo máximo de giro del buscador ni el campo total de adquisición.
- `DataWeapon.BurnoutTime` no existe en 496 y aparece en cero en las armas
  seleccionadas de builds posteriores. Cero por defecto no acredita una
  duración física de combustión/aceleración ni que el motor ya esté apagado.
- Etiquetas de códigos como `High Off-Boresight` o `Attitude Control - Combined`
  son capacidad codificada del juego. No proporcionan grados, g o duración.
- Las descripciones de otro build desconocido no se unen por ID a SQLite 515.
  Si una cifra contradice su equivalente en otra unidad, queda pendiente.

**Fuente [C9]:** archivos suministrados por el usuario; compilación de juego,
confianza media-baja para sus afirmaciones, baja para certificar hardware real.
Los campos de gimbal y aceleración terminal en la revisión permanecen `null`.

## Implicación para la corrección a la llegada

Estar dentro de la envolvente desde el lanzador es una condición de factibilidad
global, no prueba de que el interceptor que ya voló hacia otro punto pueda
recuperar la diferencia instantáneamente. La validación terminal necesita su
posición, vector de velocidad/actitud, tiempo remanente y margen de maniobra.
La energía restante sola no fija ese margen.

Separar, según el guiado concreto:

1. **Observabilidad:** si el buscador o el conjunto radar/control puede medir
   el blanco en esa geometría, con el enlace/iluminación necesarios.
2. **Adquisición y seguimiento:** campo total, límites de giro, velocidad de
   seguimiento, retardo y posibles pérdidas de pista; ancho de haz no basta.
3. **Alcanzabilidad:** corrección compatible con trayectoria/tiempo y autoridad
   lateral disponibles, sin mover instantáneamente al interceptor al punto real.
4. **Impacto:** evaluar distancia de paso y espoleta/colisión después de volar
   la trayectoria; una detección tardía no garantiza derribo.

La relación de sustentación general [C10] incluye densidad, velocidad relativa
al aire, coeficiente, superficie y masa. No da una aceleración terminal sólo
por altura. Motor vectorado/ACM/PIF aporta autoridad distinta y limitada por
empuje/impulso/duración. El máximo estructural o pico no es un g sostenido.

Prueba útil para el motor, a cargo de Claude: mismo misil hasta la adquisición
terminal y blancos con igual distancia final al lanzador, pero diferente
desplazamiento lateral respecto del interceptor. El resultado no debe ser
idéntico por consultar sólo el alcance global. No fija una cifra desconocida;
detecta la omisión de la geometría y del tiempo.

## EMCON: evidencia frente a tiempos desconocidos

| Sistema | Evidencia pública consultada | Tiempo apagado / ciclo fijo | Tipo y confianza |
| --- | --- | --- | --- |
| Patriot | FM 3-01.85 §6-118–120 y glosario EMCON: controlar indicios/emisiones y evitar localización de emisores | **No encontrado** por variante o situación | [C1], manual primario histórico; alta para principio doctrinal, no duración ni práctica ucraniana actual |
| S-300PS/PT | Informe RUSI distingue supervivencia/reubicación y empleo de sistemas soviéticos | **No encontrado** | [C6], análisis con entrevistas, secundaria; media para descripción histórica, insuficiente para ciclo universal |
| S-400 | La doctrina/los tiempos de apagado por variante exacta no están cuantificados en las fuentes leídas | **No encontrado** | [C7], revisión anterior; no extrapolar S-300PS ni tiempo de despliegue |
| Buk / SA-11 | RUSI describe empleo de TELAR individuales como amenazas intermitentes, pp. 13–14 del informe | **No encontrado**; no derivar segundos de «pop-up» | [C6], secundaria, media para el empleo descrito, baja para generalizar a Buk-M2/M3 o a toda época |
| NASAMS | Fabricante confirma FDC, radar Sentinel, sensores EO/IR pasivos y red distribuida | **No encontrado** | [C5], primaria, alta para arquitectura; no demuestra cobertura pasiva idéntica al radar ni un ciclo EMCON |

El informe RUSI de 2022 no sirve como observación de Patriot/NASAMS desplegados
en Ucrania en fechas posteriores. El manual Patriot de 2002 tampoco prescribe
por sí solo una práctica actual. No se asigna una duración fija para balancear.

Apagar un radar no elimina automáticamente las coordenadas ya conocidas por
el enemigo, ni garantiza invisibilidad ante todos los sensores. A la inversa,
estar encendido no entrega instantáneamente su ubicación exacta a cualquier
atacante: hacen falta un receptor, cobertura, medición, incertidumbre y difusión.
Separar emisión, detección pasiva, marcación/localización y pista de tiro.

Los sensores EO/IR pasivos de NASAMS son respaldo para una configuración
pasiva concreta, no para que todo NASAMS dispare con cualquier aviso externo.
Guiado por mando/SARH/TVM impone dependencias durante el vuelo; radar apagado
no se reduce a ocultar su icono. La comunicación C2 puede seguir emitiendo y
el conocimiento de cada bando debe conservar último reporte y antigüedad.

## Fuentes y localizadores

- **[C1] Primaria histórica, leída:** US Army, *FM 3-01.85, Patriot Battalion and Battery Operations*, mayo 2002, §6-118–120 y glosario «EMCON» (definición de JP 1-02). [PDF público](https://archive.org/download/Fm301.85PatriotBattalionAndBatteryOperations/fm%203-01.85%20Patriot%20Battalion%20and%20Battery%20Operations.pdf). No se encontró ciclo de apagado aplicable a la petición.
- **[C2] Primaria institucional, leída previamente:** US DoD, PAC-3 MSE Selected Acquisition Report, diciembre 2015, p. impresa 6, «Mission and Description». [DTIC AD1019515](https://archive.org/download/DTIC_AD1019515/DTIC_AD1019515.pdf). No contiene los límites terminales requeridos.
- **[C3] Primaria histórica, leída previamente:** USASMDC/ARSTRAT, *PAC-3: The Evolution of a System from Concept to Deployment*, 2011, pasaje de ERINT/control de actitud, p. PDF 2. [DTIC ADA560833](https://archive.org/download/DTIC_ADA560833/DTIC_ADA560833.pdf). Arquitectura histórica, no curva terminal de MSE.
- **[C4] Fabricante, leída:** EUROSAM, *ASTER Missile Family*, «PIF-PAF Technology». [Página](https://eurosam.com/aster-missiles-family/), acceso 5-oct-2026. Dice control aerodinámico y directo, «high G»; no gimbal ni curva terminal cuantificada.
- **[C5] Fabricante, leída:** Kongsberg, *NASAMS Air Defence System*, apartado «The System». [Página](https://www.kongsberg.com/kda/what-we-do/defence-and-security/integrated-air-and-missile-defence/nasams-air-defence-system/), acceso 5-oct-2026. FDC, Sentinel y EO/IR pasivo. Sin ciclo EMCON.
- **[C6] Secundaria con entrevistas, leída:** Justin Bronk con Nick Reynolds y Jack Watling / RUSI, *The Russian Air War and Ukrainian Requirements for Air Defence*, 7-nov-2022, pp. impresas 13–14 y 16. [Informe](https://static.rusi.org/SR-Russian-Air-War-Ukraine-web-final.pdf). Empleo de SA-11 y vulnerabilidad por emisión; sin intervalo universal de apagado.
- **[C7] Revisión de búsqueda anterior:** [datos-fisica-maniobra.md](datos-fisica-maniobra.md), tabla por variante y fuentes M6/M10–M15. Mantiene curvas desconocidas y accesos no leídos separados de evidencia confirmada.
- **[C8] Fabricante, no leído:** ruta Diehl [IRIS-T SLM](https://www.diehl.com/defence/en/products/ground-based-air-defence/iris-t-slm/), HTTP 404 el 5-oct-2026. No se atribuye contenido a ese acceso.
- **[C9] Compilación de juego suministrada:** revisión reproducible en [PR #63](https://github.com/AltaLasagnaS/cielo-cerrado/pull/63), `data/db3k-versions-review.json` y `research/read-db3k.py` dentro de la carpeta experimental. Unidades/semántica por campo pendientes donde no se verificaron.
- **[C10] Técnica primaria general, leída previamente:** NASA Glenn, [Lift Equation](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/lift-equation/). Confianza alta para la relación general; no mide un misil concreto.
