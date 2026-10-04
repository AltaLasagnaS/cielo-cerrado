# Fichas de investigación: unidades y municiones

Todas son fichas originales de preparación. No añaden prestaciones al juego ni habilitan combinaciones. Sus valores pendientes siguen desconocidos, no se igualan a otras variantes.

## Patriot

Separar la familia de sistema, su configuración de componentes y cada munición. El radar/control de una batería es una entidad diferente de sus lanzadores y de sus misiles.

| Entrada | Identidad sostenida | Qué todavía no habilita |
|---|---|---|
| GEM-T | RTX la presenta como variante Patriot complementaria a PAC-3 | Todas las versiones de lanzador/control; cualquier carga mixta; valores de Pk |
| PAC-3 CRI | CSIS identifica Cost Reduction Initiative en el desarrollo PAC-3 | Heredar las prestaciones de MSE o su perfil de motor |
| PAC-3 MSE | CSIS distingue Missile Segment Enhancement y su desarrollo | Deducir el alcance operativo completo de una mejora relativa; disponibilidad en cada país |

Fuentes: [RTX GEM-T](https://www.rtx.com/raytheon/what-we-do/integrated-air-and-missile-defense/guidance-enhanced-missile), [RTX Patriot](https://www.rtx.com/raytheon/what-we-do/integrated-air-and-missile-defense/global-patriot-solutions), [CSIS Patriot](https://missilethreat.csis.org/system/patriot/). Acceso correcto el 4 de octubre de 2026. La página PAC-3 de Lockheed consultada anteriormente respondió 403: no se inventó contenido de esa fuente.

Para integrar: precisar lanzador, radar/control, revisión/modificación, composición de carga y evidencia de las relaciones. Las capacidades de un lanzador no se deben confundir con `mag` agregado de la batería legada. La nota local sobre M903 sirve como punto de investigación, no como autorización completa.

El contrato del perfil permite usar `vmax/tb` sólo con su aproximación explícita. Un motor de doble pulso no queda representado literalmente por aceleración uniforme. Los datos publicados sobre motor y los parámetros del modelo deben conservar nombres y procedencias distintos.

Migración: `patriot → PAC-3 MSE` y `patriot2 → GEM-T` son correspondencias de nombres. No trasladan automáticamente radar, capacidades, Pk, canales ni inventario a una configuración desagregada. Los escenarios existentes conservan su representación hasta aprobar la migración.

## NASAMS

Kongsberg describe una estructura modular con FDC, radar Sentinel, sensores y lanzadores. La familia admite varias municiones según configuración. Esa afirmación no confirma el contenido de una batería concreta ni sus existencias en una fecha determinada.

| Entrada | Evidencia disponible | Límite |
|---|---|---|
| AIM-120 sin identificar | Munición base de la familia, según Kongsberg | Marcador del legado: no es una variante física verificada |
| AIM-120 C7 | Referencia comparativa en la página de AMRAAM-ER | La comparación no prueba todas las integraciones nacionales ni convierte el legado en C7 |
| AMRAAM-ER | Oferta documentada dentro de NASAMS | No derivar una envolvente absoluta multiplicando un porcentaje comercial |
| AIM-9X Block II | Kongsberg lo describe como misil IR utilizable con MML | No copiar el guiado ni comportamiento de AMRAAM; configuración/fecha pendientes |

Fuentes: [NASAMS](https://www.kongsberg.com/what-we-do/defence-and-security/integrated-air-and-missile-defence/nasams-air-defence-system/) y [familia de misiles](https://www.kongsberg.com/what-we-do/defence-and-security/integrated-air-and-missile-defence/raytheon-missiles/). Acceso correcto el 4 de octubre de 2026.

Para integrar: identificar variantes, MML y componentes de la configuración, compatibilidad y disponibilidad. Una arquitectura de mando abierta no autoriza cualquier misil ni convierte cualquier pista recibida en capacidad de empleo remoto.

La página comercial publica cifras de éxito. Se registran como declaraciones del fabricante, no como `pk` universal ni datos por clase. Tampoco se transforma una cifra de campaña en probabilidad por disparo sin conocer denominador y condiciones.

Migración: la entrada `nasams` actual permanece como AIM-120 no identificado. No renombrarla silenciosamente a C7 ni ER.

## S-300P

Separar generaciones PT/PT-1/PS y variantes K/KD/R. No unirlas a la familia S-300V por el nombre común, ni trasladar modificaciones de generaciones posteriores a equipos anteriores.

| Candidato | Procedencia de asociación | Estado |
|---|---|---|
| PT / 5V55K | Etiqueta de lista DB3K 442; contexto histórico de APA | Relación por corroborar antes de configurar |
| PT-1 / 5V55KD | Etiqueta de lista DB3K 442 | No una configuración completa validada |
| PS / 5V55R | Etiqueta de lista DB3K 442; contexto de variantes en APA | Componentes y modernizaciones todavía pendientes |

[APA](https://www.ausairpower.net/APA-Grumble-Gargoyle.html) distingue guía por mando en K y TVM en R. Es una fuente secundaria histórica, con actualización indicada en 2014. No usar sus hipótesis de integración o juicios comparativos como capacidades confirmadas actualmente. Acceso correcto el 4 de octubre de 2026.

Los candidatos no autorizan mezclar cualquier radar/lanzador de la familia. Las listas CMO son indicios y referencias externas por revisión, no certificados técnicos ni fuente de parámetros físicos actuales.

Migración: la ficha local `S-300PS/PT (5V55R)` es ambigua. Conservarla explícitamente como configuración legada hasta conocer la intención de cada escenario. No repartir su munición entre variantes ni cambiar su capacidad sin una revisión de resultados.

## Alerta adicional: Stinger, Igla y RBS 70

La última actualización de Claude informa que Hisingen usa la entrada genérica MANPADS como representación de RBS 70 y que eliminó su perfil de aceleración por falta de datos adecuados.

Saab describe [RBS 70 NG](https://www.saab.com/products/rbs-70-ng) con guía láser y beam riding. Acceso correcto el 4 de octubre de 2026. Esa fuente no confirma automáticamente qué versión está representada en Hisingen ni sus parámetros de aceleración. No convertir declaraciones comerciales como «unjammable» en inmunidad universal a perturbación o limitaciones ambientales.

La ficha genérica del checkout menciona Stinger/Igla y un guiado IR. Eso no puede tratarse como validación del modelo RBS 70. Propuesta para una entrega posterior: separar estas familias y sus versiones con fuentes propias, sin corregir ahora los archivos en los que trabaja Claude.

Mantener velocidad constante por falta de datos es una simplificación declarada, no evidencia de que la aceleración real sea despreciable. La decisión sobre cada perfil debe apoyarse en incertidumbre y condiciones, no en conservar la tasa de victoria de un escenario.

## Política común de realismo

Preservar escenarios de referencia al cambiar física. Una nueva tasa de victoria puede ser una consecuencia válida. Si se desea mayor dificultad, crear una variante del escenario con condiciones explícitas; no presentar la modificación como calibración del motor.

Un costo desconocido no se fija copiando otro misil. Un tiempo desconocido no se deriva de Mach sin condiciones. Una compatibilidad desconocida no se marca como imposible ni se habilita por defecto. Toda simplificación debe distinguirse de un dato publicado.
