# C2 y enlaces de datos: auditoría del modelo

Revisión del motor de `c39cfec5a0cdecb9a9dc9072bb7fc55b64d22bd5`, posterior al PR #33. Esta revisión identifica comportamiento del código y propuestas de desarrollo; no verifica las capacidades reales de los sistemas del catálogo. La [línea de base](../mediciones/README.md) mide este mismo motor, antes de corregir estos puntos.

## Tres conceptos distintos

| Concepto | Qué representa | Estado actual |
|---|---|---|
| Mando y control (C2) | Quién recibe alertas y asigna blancos | Cuatro políticas globales, degradadas por objetivos de mando/comunicaciones destruidos |
| Red táctica entre sensores y baterías | Transporte de pistas, compatibilidad y calidad de la información | Familias de datalink por sistema, interruptor por unidad y tiempos por red; todavía sin topología ni pasarelas detalladas |
| Comunicación y guía de un arma en vuelo | Actualizaciones, telemetría, órdenes o apoyo del radar según el arma | El `link` de ciertos drones interviene en la navegación bajo interferencia; la continuidad de guía de los interceptores no se comprueba |

Compartir una imagen aérea no equivale a poder guiar un misil con ella. Un nombre de protocolo, por sí solo, tampoco demuestra capacidad de disparar con datos de otro sensor: hay que representar y justificar la combinación sensor, red, sistema de control y arma.

## Lo que está implementado

Los niveles se definen en [c2.js](../../src/data/c2.js); las condiciones de pista y reacción, en [engagement.js](../../src/physics/engagement.js).

| Nivel | Información compartida | Demora inicial | Vigencia de pista | Evita disparos duplicados | Selecciona tirador |
|---|---|---:|---:|---|---|
| Desconectada | Ninguna | — | — | No | No |
| Descoordinada | Alerta | 45 s | No se aplica a la alerta | No | No |
| Coordinada | Pista para activos/IR/operador | 0 s | 12 s | Sí | No |
| Integrada | También habilita lanzamiento remoto de guiados por radar, con cobertura del encuentro | 2 s | 12 s | Sí | Sí |

Estos tiempos y capacidades son reglas del juego, no mediciones de enlaces reales. Con pista remota, `coordinada` multiplica la Pk por 0,97 y `integrada` por 1. Los cañones necesitan pista propia. El interruptor de cada unidad apaga sus datalinks: deja de publicar y recibir pistas de tiro, pero no elimina las alertas ni el reparto de blancos del C2.

La primera compatibilidad explícita del catálogo es deliberadamente conservadora: Patriot, Patriot GEM-T, NASAMS, IRIS-T y Saab 340 usan la familia `l16`; S-300, S-125, S-200, sensores de alerta e interceptores de fabricación soviética usan `ua_c2`; S-400, Pantsir, Tor, A-50 y radares equivalentes usan `ru_c2`. El S-300 no comparte automáticamente una pista de Link 16 con NASAMS o Patriot. Estas familias son abstracciones con confianza media: la ficha indica qué está modelado, y las fuentes OSINT explican por qué se eligió, pero no se presenta como una certificación de interoperabilidad.

Un objetivo `command` destruido desconecta a toda la defensa; cada `comms` destruido baja un nivel. No existen dependencias entre nodos y unidades, aislamiento de subredes ni rutas alternativas. La posición del nodo no interviene.

En el lado atacante, [kinematics.js](../../src/physics/kinematics.js) activa el enlace solo cuando lo pide la salva y la amenaza tiene `datalink`. En [engine.js](../../src/sim/engine.js), al primer efecto de interferencia GNSS, un enlace disponible permite rechazar el engaño de navegación; un jammer con `linkJam` en radio lo corta. No hay transmisión de órdenes, vídeo, cambio de blanco ni pérdida y recuperación continua de ese enlace. El efecto queda fijado con `gnssHit`. Ese jammer tampoco corta la red de las baterías.

## Hallazgos reproducibles

Ejecutar desde la raíz:

```sh
node scripts/inspect-c2.mjs
```

El [script](../../scripts/inspect-c2.mjs) usa mapas planos y semillas fijas. Imprime observaciones, no convierte las limitaciones actuales en resultados que deban conservarse para siempre.

1. **C2 y datalink tienen efectos diferentes.** Dos NASAMS con `link: false`, frente a un Shahed, semilla 5: con C2 coordinada sale un disparo; con C2 desconectada salen dos. Es intencional: la coordinación C2 evita duplicar la asignación, mientras el datalink decide si una batería puede usar la pista del sensor ajeno para disparar.
2. **La destrucción de la batería no interrumpe la guía en vuelo.** S-300 frente a Kh-22, semilla 4: el control dispara dos interceptores y logra un derribo; desactivar la batería inmediatamente después del lanzamiento, a los 332,25 s, da los mismos dos disparos y un derribo. El experimento cambia `alive` directamente para aislar la dependencia de guía. El motor comprueba la cobertura al lanzar, pero al resolver el impacto solo exige que el blanco siga vivo. No vuelve a exigir radar disponible, pista propia ni línea de visión. Esto contradice la dependencia declarada para TVM/SARH/mando; la solución debe distinguirlos de un arma autónoma.
   **Estado:** corregido para la destrucción de la batería. Un interceptor TVM, SARH o por mando cuya batería cae en vuelo pierde la guía; los activos, IR y drones interceptores siguen (`tests/unit-damage.test.js`). Todavía no se exige pista propia ni línea de vista al resolver.
3. **Una alerta antigua sigue adelantando la reacción.** Con primera y última detección en 0 s, una llamada a `reactionStart` en 1000 s devuelve 45 s para C2 descoordinada. Hay memoria indefinida de la alerta, sin política de caducidad/reconfirmación. Puede ser una simplificación intencional de preparación de la batería, pero debe distinguirse de una pista vigente.
4. **La demora solo afecta a la primera detección.** Con `net.l16.first: 0` y una actualización `last: 100`, es usable en el instante 100 bajo C2 integrada: no espera los dos segundos de entrega. No hay mensajes en tránsito ni latencia por actualización.
5. **El daño de comunicaciones tiene efecto global.** Un nodo destruido en cualquier coordenada baja `integrada` a `coordinada`, aunque no se haya asociado a ninguna batería. Es una abstracción de escenario, no una red modelada.

Además, cada interceptor guarda `remote` y `c2` al disparar. El factor remoto al resolver se calcula con ese estado inicial, sin representar cambios del enlace durante el vuelo. Se conserva la antigüedad por familia, pero todavía no una pista por emisor/receptor con error o topología.

## Orden propuesto para los cambios

1. **Corregir las dependencias actuales.** Definir caducidad de alertas; verificar continuidad de guía según el tipo de interceptor; y añadir pruebas de pérdida de batería/pista y controles donde el arma sí es autónoma. Medir el impacto con las mismas semillas de la línea de base y explicar cualquier cambio de golden.
2. **Introducir redes y capacidades explícitas.** Separar afiliación de red, transporte compatible y capacidad de alerta/pista/tiro. Guardar emisor, instante de observación y recepción, calidad y destinatarios. Asociar baterías con nodos y pasarelas. Mantener una migración explícita para escenarios guardados que hoy solo tienen `link` y C2 global.
3. **Modelar degradación de enlaces.** Demora por actualización, antigüedad y pérdida/recuperación; diferenciar enlace táctico del enlace de control de armas. Primero reglas simples y pruebas de conectividad; parámetros por sistema solo con fuentes y rangos de incertidumbre documentados.

Antes de asignar protocolos a cada plataforma hay que verificar las fuentes del [anexo K](mejoras-fisica.md#k-anexo-quién-tiene-enlace-de-datos-de-verdad-para-el-interruptor-por-unidad). Sus referencias y niveles de confianza provienen de una investigación previa, no de esta auditoría. La propuesta de compartir automáticamente pistas de tiro entre usuarios de un mismo protocolo todavía no está implementada y no alcanza como criterio de compatibilidad.

Conviene resolver estas dependencias antes de recalibrar probabilidades o equilibrar escenarios: ajustar esos números ahora podría compensar un error de coordinación que después desaparezca.
