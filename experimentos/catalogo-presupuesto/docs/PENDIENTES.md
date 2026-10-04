# Pendientes identificados y criterios de cierre

Fecha/base: 4 de octubre de 2026, `9cafba0`. **Pendiente** no significa fallo reproducido; las mejoras de comportamiento se separan de bugs. El roadmap físico activo sigue siendo `ROADMAP.md`, no esta lista.

| ID | Pedido / estado | Criterio de cierre y dependencia |
|---|---|---|
| UX01 | Cantidades discretas sin decimales — parcialmente verificado | Chromium confirma rechazo en estado/blur/guardado para mag/reserve/salvo e importación de mag fraccionaria; ampliar cantidad de ataque, pegado/mensajes y otros campos; no redondear ni quitar decimales continuos |
| UX02 | Delete elimina selección — ausencia observada, pendiente | Chromium confirma que no borra; reutilizar borrado existente sólo en preparación; ignorar inputs/textarea/select/contenteditable; probar referencias/objetivos/rutas y simulación activa |
| UX03 | Explicar C2 frente a datalink — pendiente | Selector global, ficha y Academia coherentes; explicar coordinación humana, transporte y calidad/capacidad de empleo por separado |
| UX04 | Academia con explicación vieja de enlaces — texto obsoleto localizado | Revisar `concepts.js`: dice que no hay enlaces por sistema pese al modelo actual; actualizar con pruebas de documentación/UI, no alterar capacidades |
| UX05 | Etiquetas BLUEFOR/REDFOR claras, especialmente EW — pendiente | Texto/icono además de color; propietario separado de procedencia y rol; no prohibir material mixto |
| F01 | Pertenencia al C2 por unidad — feature pendiente | Independiente de `u.link`; una unidad aislada conserva autonomía/reportes viejos, no recibe órdenes nuevas por UI; coordinar con vista del mando |
| F02 | Doctrina de señuelos por unidad — feature pendiente | Heredar/ignorar/permitir explícitos; decidir por clasificación conocida, no por identidad real oculta |
| F03 | Selección múltiple y edición grupal — feature pendiente | Shift/rectángulo/estado mixto; aplicar sólo propiedades comunes; no consultar unidades/contactos ocultos; borrar grupo exige alcance/confirmación definidos |
| F04 | Dos perspectivas restringidas — diseño pendiente de motor | Ni mapa, listas, logs, tooltips, decisiones/IA, Monte Carlo ni debrief revelan planes ocultos; conservar modo laboratorio explícito |
| F05 | Briefing + recursos de una misión — prototipo aislado | Conectar una misión corta al motor/vista propios; no pagar munición dos veces ni revelar ofertas enemigas |
| F06 | Variantes y componentes — referencia aislada | Primera configuración con versión/operador/fecha/evidencia y rangos UNC completos; adaptador legado explícito; ninguna habilitación masiva |
| F07 | Movilidad, despliegue y EMCON/ESM — diseño | Estados/tiempos/capacidades documentados; marcación pasiva no es pista de tiro; no inventar red vial a partir de SRTM |
| F08 | Logística, entrega, recarga y reparación — diseño compartido | Tiempo simulado, recursos y localización; una sola autoridad física de daño; no aparición instantánea ni reparación por descontar dinero |
| F09 | Campaña persistente — libro experimental parcial | Conservar componentes/daño/munición/localización/inteligencia y progreso; tiempos/entregas explícitos, guardado sin duplicación, debrief sin revelar próxima misión |
| F10 | Aviación con misiones — diferido | Después de movilidad/campaña: combustible/cargas/bases y funciones, no sólo iconos de cazas |
| R01 | Parámetros/precios/configuraciones verificadas — investigación parcial | Fuente por campo/condición; `unknown/null` cuando falte evidencia; ver cola de investigación |
| R02 | Referencias CMO/Fleet — conservadas | Índices/manuales sirven para diseño; no importar Pk/comportamientos como física ni redistribuir archivos |
| Q01 | Kiev vuelve a siete Kh-101 — pendiente de Claude | Escenario y briefing consistentes; preservar física y documentar estadística original; no modificar golden por una meta de balance |
| Q02 | Límite inferior del perfil — diagnóstico aislado | Evaluar si ocurre en perfiles/muestras actuales; corregir sólo con responsable de física y pruebas; nota reproducible no demuestra impacto actual |
| Q03 | MANPADS legado no implica equivalencia — documentado parcialmente | Ficha/Academia distinguen aproximación y guía por variante; no crear números para recuperar tasas |
| Q04 | Técnica/replay/idioma/CI — roadmap de Claude | Consultar estado actual antes de tomar tareas; replay/debrief de campaña respetan vista por bando |

## Orden seguro, no fecha de entrega

Documentar/diagnosticar → PR pequeña de UX acordada → primera configuración verificada → perspectiva mínima compartida → misión con recursos → movilidad/logística → campaña → aviación. Las tareas independientes de fuentes y contabilidad pueden avanzar antes; una interfaz restringida no debe esperar al final para evitar una lógica omnisciente.

## Cómo cerrar un pendiente

Registrar commit/PR, prueba concreta, limitaciones y cambio de estado. No tacharlo por tener un documento, una demo o CI verde ajena. Los resultados físicos se explican y revisan, no se ajustan a una victoria deseada.
