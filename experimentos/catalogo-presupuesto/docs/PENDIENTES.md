# Pendientes identificados y criterios de cierre

Registro original: 4 de octubre de 2026, `9cafba0`. Estado reconciliado el 5 de octubre contra `main` `f0428e4` (merge #68, que incluye #61 y la campaña nativa; #64 ya mergeado). **Pendiente** no significa fallo reproducido; las mejoras de comportamiento se separan de bugs. El roadmap físico activo sigue siendo `ROADMAP.md`, no esta lista.

| ID | Pedido / estado | Criterio de cierre y dependencia |
|---|---|---|
| UX01 | Cantidades mag/reserve/salvo/count — implementadas con mensajes | Rechazo explícito de fracciones, estado intacto y recuperación del último valor válido; Chromium. Otros campos se revisan según su semántica; magnitudes continuas conservan decimales |
| UX02 | Delete elimina selección — implementado en preparación | Reutiliza los botones de borrado; ignora campos, contenido editable, ventanas, corridas y Monte Carlo; Chromium verifica objetivo/referencias y selección vacía |
| UX03 | Explicar C2 frente a datalink — rótulos y ayuda implementados | Coordinación global separada del enlace técnico por unidad, con efectos al desconectar; no agrega pertenencia C2 individual ni modifica el motor |
| UX04 | Academia con explicación de enlaces — corregido en main (#59) | Familias compatibles, coordinación C2 y enlace técnico separados; pasarelas apagadas por defecto, sin asumir calidad de tiro |
| UX05 | Etiquetas BLUEFOR/REDFOR claras, especialmente EW — implementadas en main (#59) | Texto/icono además de color; propietario separado de procedencia y rol; no prohíbe material mixto |
| UX06 | Regla para medir distancias en el mapa — implementada en main (#59) | Dos puntos y distancia horizontal en km; verificar zoom/pan y Escape sin mover unidades ni consultar entidades ocultas |
| UX07 | Fijar una pista aérea y consultar su información — implementado en main (#59) | Contactos y ficha conocida; la auditoría de pérdida y antigüedad continúa con perspectivas. No equivale a lock de tiro |
| F01 | Pertenencia al C2 por unidad — implementada en main (#59) | Independiente de `u.link`; revisar conocimiento y aislamiento en las perspectivas restringidas |
| F02 | Doctrina de señuelos por unidad — implementada en main (#59) | Heredar/ignorar/permitir; clasificación conocida, no identidad real oculta |
| F03 | Selección múltiple y edición grupal — implementada en main (#59/#64) | Shift+clic, Shift+rectángulo, edición común y borrado con confirmación; prueba de navegador nativa |
| F04 | Dos perspectivas y tiro observado — implementados en main (#64) | Registro, resultados y objetivos por bando; el debrief de laboratorio explica la verdad. El parte atacante de campaña requiere decidir conocimiento/BDA; los controles de campaña Q05 quedaron cerrados en #69 |
| F05 | Briefing + recursos — campaña nativa en main (#68, incluye #61) | Dos guardias, preparación/compra/carga/reparación, libro único y contrato missionReport v1; Chromium de punta a punta. Créditos y plazos hipotéticos, no precios reales; Q05 cerrado en #69 |
| F06 | Variantes y componentes — seis fichas y contrato experimental #61 | Inventario tipado, dependencias, cargas completas admitidas y pérdidas localizadas probados. Falta primera configuración activa con versión/operador/fecha/evidencia y rangos UNC completos; adaptador legado explícito; ninguna habilitación masiva |
| F07 | Movilidad/despliegue — diseño; control de emisiones en main (#64) | Radares siempre/alerta/apagados ya disponibles. Falta tiempo de encendido por radar y doctrina con evidencia, trayectos y estados de movimiento/despliegue; no inventar red vial a partir de SRTM |
| F08 | Logística — integrada en campaña nativa (#68) | Libro único, recargas temporizadas y pérdidas conectado al controlador; faltan trayectos geográficos y severidad de averías documentada |
| F09 | Campaña persistente — dos guardias nativas en main (#68) | Conserva recursos, daños, trabajos, posiciones y reportes fechados, guardado entre misiones. Tercera guardia opcional, elegible en el menú desde #69, sin migrar partidas existentes; faltan atacante/BDA y restauración durante combate |
| F10 | Aviación con misiones — diferido | Después de movilidad/campaña: combustible/cargas/bases y funciones, no sólo iconos de cazas |
| R01 | Parámetros/precios/configuraciones verificadas — investigación parcial | Fuente por campo/condición; `unknown/null` cuando falte evidencia; ver cola de investigación |
| R02 | Referencias CMO/Fleet — revisión de fichas en #63; bases modernas recibidas | El usuario autoriza datos secundarios de confianza media-baja. Conservar versión, campo, unidad e incertidumbre; no importar Pk genéricas, adivinar unidades ni redistribuir bases completas |
| Q01 | Kiev vuelve a siete Kh-101 — cerrado en main (#47) | `scenarios.js` y briefing tienen 7; CHANGELOG documenta el resultado sin recuperar balance alterando el ataque |
| Q02 | Límite inferior del perfil — cerrado en main (#47) | `solveTd` corrige el caso; `tests/interceptor.test.js` prueba R menor/igual a distancia acelerando. La nota preservada conserva el diagnóstico histórico |
| Q03 | MANPADS legado no implica equivalencia — aclaración en main (#47) | `docs/FISICA.md` §6 y UNC explican ausencia de datos y diferencias Stinger/Igla/RBS 70. Variantes separadas siguen pendientes |
| Q04 | Técnica/replay/idioma/CI — roadmap de Claude | Consultar estado actual antes de tomar tareas; replay/debrief de campaña respetan vista por bando |
| Q05 | Controles que alteran una guardia de campaña — **cerrado en #69** | En f31738a/main f0428e4: vista completa aceptada, cargar escenario y Monte Carlo resetean el mundo mientras sigue activo el libro. Reproducción y reparto en [#62](https://github.com/AltaLasagnaS/cielo-cerrado/issues/62#issuecomment-6002465534). Cerrado en #69: durante la guardia se bloquean vista completa/atacante, cargar escenario o relieve y Monte Carlo; el botón solo pausa. Prueba de navegador en `tests/ui.browser.mjs` (falla sin los frenos) |

## Orden seguro, no fecha de entrega

Documentar/diagnosticar → PR pequeña de UX acordada → primera configuración verificada → perspectiva mínima compartida → misión con recursos → movilidad/logística → campaña → aviación. Las tareas independientes de fuentes y contabilidad pueden avanzar antes; una interfaz restringida no debe esperar al final para evitar una lógica omnisciente.

## Cómo cerrar un pendiente

Registrar commit/PR, prueba concreta, limitaciones y cambio de estado. No tacharlo por tener un documento, una demo o CI verde ajena. Los resultados físicos se explican y revisan, no se ajustan a una victoria deseada.

El usuario autorizó el 5-oct coordinación directa por comentarios/PRs y autonomía sin pedirle que reenvíe mensajes. Ver [registro de autonomía y reparto](AUTONOMIA-2026-10-05.md). Los pendientes de integración o evidencia siguen explícitos, aunque el contrato experimental pase sus pruebas.
