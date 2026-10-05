# Pendientes identificados y criterios de cierre

Registro original: 4 de octubre de 2026, `9cafba0`. Estado reconciliado el 5 de octubre contra `main` `0a77102` (merge #59), el contrato experimental #61 y el PR abierto #64. **Pendiente** no significa fallo reproducido; las mejoras de comportamiento se separan de bugs. El roadmap físico activo sigue siendo `ROADMAP.md`, no esta lista.

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
| F03 | Selección múltiple y edición grupal — Shift+clic implementado en main (#59) | Edición común y borrado con confirmación. Selección por rectángulo sigue como ampliación |
| F04 | Dos perspectivas restringidas — parcial en main; continuación en #64 | #64 agrega tiro sobre observaciones y vista del atacante. Registro/resultados/debrief siguen pendientes de restricción; ubicación SIGINT automática y balísticos verdaderos requieren revisión. No se cierra por ocultar iconos |
| F05 | Briefing + recursos de una misión — contratos y demo aislados | El briefing logístico ya toma un único inventario propio y reportes fechados. Falta conectar una misión corta al motor/vista propios; no pagar munición dos veces ni revelar ofertas enemigas |
| F06 | Variantes y componentes — seis fichas y contrato experimental #61 | Inventario tipado, dependencias, cargas completas admitidas y pérdidas localizadas probados. Falta primera configuración activa con versión/operador/fecha/evidencia y rangos UNC completos; adaptador legado explícito; ninguna habilitación masiva |
| F07 | Movilidad, despliegue y EMCON/ESM — diseño | Estados/tiempos/capacidades documentados; marcación pasiva no es pista de tiro; no inventar red vial a partir de SRTM |
| F08 | Logística, entrega, recarga y reparación — contrato y demo #61, sin integración | Trabajos con plazos/fondos/repuestos y tránsito, pérdidas y retorno temporizado probados. Faltan trayectos geográficos, severidad de daño y conexión a una sola autoridad física del motor |
| F09 | Campaña persistente — recursos entre misiones, todavía experimental | Conserva componentes/daño/munición/repuestos/fondos/pedidos/tiempo y replay. Faltan escenarios encadenados, inteligencia persistente autorizada, objetivos/debrief por bando y progreso jugable |
| F10 | Aviación con misiones — diferido | Después de movilidad/campaña: combustible/cargas/bases y funciones, no sólo iconos de cazas |
| R01 | Parámetros/precios/configuraciones verificadas — investigación parcial | Fuente por campo/condición; `unknown/null` cuando falte evidencia; ver cola de investigación |
| R02 | Referencias CMO/Fleet — revisión de fichas en #63; bases modernas recibidas | El usuario autoriza datos secundarios de confianza media-baja. Conservar versión, campo, unidad e incertidumbre; no importar Pk genéricas, adivinar unidades ni redistribuir bases completas |
| Q01 | Kiev vuelve a siete Kh-101 — cerrado en main (#47) | `scenarios.js` y briefing tienen 7; CHANGELOG documenta el resultado sin recuperar balance alterando el ataque |
| Q02 | Límite inferior del perfil — cerrado en main (#47) | `solveTd` corrige el caso; `tests/interceptor.test.js` prueba R menor/igual a distancia acelerando. La nota preservada conserva el diagnóstico histórico |
| Q03 | MANPADS legado no implica equivalencia — aclaración en main (#47) | `docs/FISICA.md` §6 y UNC explican ausencia de datos y diferencias Stinger/Igla/RBS 70. Variantes separadas siguen pendientes |
| Q04 | Técnica/replay/idioma/CI — roadmap de Claude | Consultar estado actual antes de tomar tareas; replay/debrief de campaña respetan vista por bando |

## Orden seguro, no fecha de entrega

Documentar/diagnosticar → PR pequeña de UX acordada → primera configuración verificada → perspectiva mínima compartida → misión con recursos → movilidad/logística → campaña → aviación. Las tareas independientes de fuentes y contabilidad pueden avanzar antes; una interfaz restringida no debe esperar al final para evitar una lógica omnisciente.

## Cómo cerrar un pendiente

Registrar commit/PR, prueba concreta, limitaciones y cambio de estado. No tacharlo por tener un documento, una demo o CI verde ajena. Los resultados físicos se explican y revisan, no se ajustan a una victoria deseada.

El usuario autorizó el 5-oct coordinación directa por comentarios/PRs y autonomía sin pedirle que reenvíe mensajes. Ver [registro de autonomía y reparto](AUTONOMIA-2026-10-05.md). Los pendientes de integración o evidencia siguen explícitos, aunque el contrato experimental pase sus pruebas.
