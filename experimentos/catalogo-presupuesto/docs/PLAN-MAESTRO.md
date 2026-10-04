# Plan maestro: evolución operativa y campaña

Fecha: 4 de octubre de 2026. Estado: diseño acordado como rumbo; cada etapa requiere su implementación y pruebas.

Consolidación del plan que antes se preparó fuera del repositorio. Base actual revisada: `9cafba0`, con #42 (perfil físico) y #43 (prototipo aislado) mergeados. No sustituye `ROADMAP.md` ni modifica su orden automáticamente. El trabajo de Claude se reconcilia antes de cada integración. Ver [ESTADO-Y-RELEVO.md](ESTADO-Y-RELEVO.md) para distinguir lo ejecutable de lo pendiente.

## 1. Dirección

Un simulador táctico liviano, educativo y basado en información pública, con decisiones operativas y recursos limitados. No un CMO completo ni un juego de comprar unidades hasta conseguir una victoria equilibrada.

- Realismo primero: capacidades distintas, escenarios asimétricos y resultados adversos legítimos.
- Distinguir lo documentado, lo estimado y lo simplificado. Más detalle no garantiza más fidelidad.
- Mantener JavaScript modular, las capas existentes, ejecución en Node y la página autocontenida.
- Mantener los escenarios actuales como modo laboratorio/editor; añadir un modo comandante restringido.
- Priorizar dos perspectivas, inteligencia, presupuesto, variantes, movilidad y campaña. Aviones con misiones quedan para después.
- No retocar física para conseguir un porcentaje de victorias deseado. Revisar los casos extremos para encontrar errores de modelado o condiciones injustificadas, no para forzar equilibrio.

## 2. La separación que sostiene todo

La simulación necesita conocer el mundo real para resolver movimiento, sensores y daño. El jugador y la automatización de su bando no deben acceder a ese mundo directamente.

```text
Estado real → mediciones → contactos locales de cada unidad
                              ↓ comunicaciones permitidas
                         panorama del mando
                              ↓ vista autorizada
                         interfaz / decisiones
```

La física consume el estado real; las decisiones consumen información conocida. Una pérdida de enlace modifica qué llega al mando y qué órdenes llegan a la unidad, no borra la unidad del mundo.

Separar tres conceptos hoy demasiado cercanos: nacionalidad de un equipo, propietario de una unidad desplegada y rol ofensivo/defensivo de una misión. Un sistema disponible para ambos países no pertenece a ambos jugadores.

Cada contacto necesita identidad pública propia, fecha de observación, procedencia, estimación de posición o marcación, incertidumbre y niveles de identificación. Detectar, reconocer una clase y declarar hostilidad son pasos distintos. No mostrar automáticamente el modelo exacto del misil.

No hace falta empezar con un sistema de fusión enorme: primero mediciones aproximadas, extrapolación simple y envejecimiento explícito. Sus coeficientes serán estimaciones documentadas, no precisión inventada.

### Consecuencias prácticas

- El mapa, fichas, listas, registros, cobertura, metas y alertas deben recibir una vista filtrada, no filtrar solamente el dibujo final.
- Una unidad propia aislada muestra su último reporte de posición, existencias y estado, con antigüedad. Desconectada no significa destruida.
- La unidad aislada continúa según su misión y doctrina local; no recibe órdenes nuevas sin un canal habilitado. Puede conservar contactos antiguos que pierden vigencia.
- Al reconectar, los reportes conservan su fecha original: información antigua no se vuelve fresca por transmitirla ahora.
- La IA debe usar el mismo límite de información. Un ataque programado por el autor puede ser fijo; no presentarlo como IA adaptativa informada por sensores.
- Un objetivo fijo conocido puede atacarse por coordenadas de inteligencia. Una unidad móvil no debe arrastrar mágicamente el punto de impacto al moverse; el seguimiento depende del arma y de observaciones disponibles.
- El debrief puede ser restringido o explicativo. En campaña, no revelar secretos que afecten la siguiente misión. La reconstrucción omnisciente queda como opción explícita de laboratorio o al terminar la campaña.

En el checkout histórico `bb0d718`, `defaultAz()` orienta defensas hacia el origen real de la primera salva, y `solve()` consulta posiciones futuras de la trayectoria real. Son comportamientos útiles en el laboratorio actual, pero incompatibles con una perspectiva estrictamente limitada. Hay que separar predicción para decidir y movimiento real para resolver, no simplemente ocultar rutas en pantalla.

El modo local no puede impedir que alguien inspeccione el archivo o el navegador. La garantía inicial es que la interfaz y los agentes del juego no hagan trampas. Multijugador con secretos realmente protegidos exigiría un servidor autoritativo y sería otro proyecto.

## 3. C2, comunicaciones y enlace de datos

Conservar explícitamente la separación que pidió el usuario:

1. Coordinación: asignación de tareas, reglas, mensajes y reportes; puede existir por voz o canales humanos.
2. Integración técnica: interfaces y pasarelas que permiten compartir determinadas pistas.
3. Capacidad de empleo: calidad de pista, continuidad, guía y compatibilidad necesarias para una acción concreta.

Poder avisar una dirección aproximada no equivale a proporcionar una solución de tiro. Compartir una pista tampoco prueba por sí solo que se pueda lanzar o guiar remotamente un misil.

Representar capacidades, conectividad y activación por separado. No inferir compatibilidad universal por pertenecer al mismo bando, usar un buscador activo o tener un enlace etiquetado como Link 16. Las combinaciones concretas requieren evidencia de integración y de versión.

Revisar primero lo ya implementado por Claude. El nuevo trabajo debería extenderlo para transportar reportes y órdenes con edad y disponibilidad, no reemplazar su estructura sin necesidad.

## 4. Catálogo: más variedad sin multiplicar copias

Separar definiciones de armas, sensores, lanzadores y configuraciones de sistema. Después instanciar unidades con componentes, propietario, daño, munición y estados operativos propios.

Una batería puede seguir apareciendo como un grupo sencillo en la interfaz. El detalle interno debe permitir que perder el radar, un lanzador o el nodo de mando tenga consecuencias distintas. Separar o agrupar elementos nunca crea munición ni duplica recursos.

El selector debe mostrar configuraciones válidas, no cualquier combinación de piezas. Versiones, software, modificaciones nacionales, disponibilidad temporal y compatibilidad de contenedores importan. Cambiar de munición puede cambiar la capacidad del lanzador; no asumir que todos sus espacios son intercambiables.

Primera expansión propuesta, sujeta a verificación de fuentes:

- Patriot: distinguir GEM-T, PAC-3 CRI y PAC-3 MSE, y configuraciones de lanzador/control que realmente los admiten.
- NASAMS: distinguir las variantes documentadas de AIM-120 y AMRAAM-ER cuando corresponda a una configuración y fecha verificadas.
- S-300: separar PT y PS antes de sumar más versiones; evitar una sola ficha que mezcle sus misiles y componentes.
- SAMP/T: mantener clara la diferencia entre configuraciones y generaciones, sin introducir capacidades futuras en equipos anteriores.
- Separar familias agrupadas de MANPADS cuando existan datos suficientes para justificar diferencias relevantes.

Primero profundidad en pocas familias existentes; después nuevas familias que aporten mecanismos distintos. No añadir veinte nombres con idéntico comportamiento.

Cada parámetro conserva fuente, versión, unidades, incertidumbre y condiciones de uso. Los IDs de CMO sirven de referencia cruzada, no como IDs internos ni prueba de prestaciones. No importar valores de Pk como constantes universales.

## 5. Presupuesto y misión de un solo bando

El flujo propuesto es: elegir bando → briefing e inteligencia → asignar recursos → desplegar o planificar → ejecutar → debrief propio.

El briefing describe tareas, plazo, restricciones, medios disponibles y apreciación del enemigo. Las posiciones confirmadas, probables y desconocidas se distinguen visualmente. La incertidumbre inicial debe venir del escenario o de un procedimiento reproducible, no desaparecer al abrir una ficha.

Cada bando tiene un presupuesto y un catálogo de disponibilidad propios. Por defecto se trata de asignación para una misión o campaña, no de todo el presupuesto nacional de defensa.

### Economía coherente

- Separar adquisición/asignación de equipos, existencias de munición, reposición y gastos operativos.
- Cada paquete indica qué incluye. No cobrar dos veces los misiles iniciales ni considerar que disparar los vuelve a comprar.
- Distinguir munición cargada, reserva y suministros en transporte. Estar en un depósito no equivale a estar lista para disparar.
- Antes de ejecutar, cambios de selección pueden devolver el costo de forma explícita. Después no hay venta instantánea ni compras que aparecen en el mapa.
- La disponibilidad limita las compras: tener dinero no garantiza que exista un equipo ni que se entregue a tiempo.
- Los costos publicados requieren año, moneda y alcance del contrato. Un contrato de batería, entrenamiento y repuestos no da directamente un precio unitario comparable.
- Si falta una base económica suficiente, usar créditos de asignación claramente ficticios, no dólares supuestamente realistas. La física no cambia para compensar esos créditos.
- Si se sortean costos inciertos, congelar la cotización durante la preparación de esa misión. Reabrir el selector no debe permitir buscar precios favorables.

La victoria depende de cumplir funciones en un plazo, no solamente de destruir unidades o ahorrar dinero. Proteger una instalación exige definir cuánto daño o pérdida de capacidad es admisible y durante cuánto tiempo. Que las metas reales se evalúen internamente no autoriza a informar al jugador daños enemigos todavía no conocidos.

Primera versión jugable: un escenario corto, dos perspectivas alternativas, briefing diferente, existencias y presupuesto finitos, despliegue propio e información enemiga limitada. Sin exigir todavía aviación, economía nacional ni generación procedimental de campañas.

## 6. EMCON, información pasiva y movilidad

EMCON debe cambiar emisiones y disponibilidad de sensores, no aplicar un bono arbitrario de invisibilidad. Un receptor ESM mínimo permite detectar emisiones con una marcación e incertidumbre, sin convertir automáticamente una marcación en coordenadas de tiro.

Separar radar de búsqueda, dirección de tiro, comunicaciones y perturbación. Apagar un radar no implica necesariamente dejar de recibir mensajes. Una orden de reactivación por amenaza sólo puede basarse en información que haya llegado a la unidad.

La continuidad de guía depende de la munición y la configuración. Apagar un componente no hace que todos los misiles desaparezcan ni que todos continúen normalmente. Dejar inicialmente fuera las técnicas avanzadas que no puedan modelarse o respaldarse bien.

Movilidad mediante estados explícitos: operativo → replegando → en tránsito → desplegando → operativo. Añadir mantenimiento, reparación y reabastecimiento como procesos con condiciones y recursos.

- Tiempos y velocidades por configuración, con incertidumbre y fuentes; no copiar tiempos navales o aéreos a baterías terrestres.
- Detectar o disparar en movimiento sólo cuando la capacidad esté documentada.
- Relieve SRTM no proporciona una red vial ni distingue todos los suelos. Primera entrega: rutas transitables definidas por el escenario y limitaciones declaradas; no fingir cálculo realista de carreteras.
- Los procesos usan tiempo simulado, no tiempo de pared. Pausar no completa una reparación; acelerar no modifica el resultado.
- La recarga consume existencias, capacidad logística y tiempo. Daño de un lanzador afecta ese lanzador, no mágicamente toda la batería.

## 7. Campaña corta y persistente

Empezar con pocas misiones enlazadas y estados persistentes: unidades, componentes, munición, daños, recursos, posición admisible e inteligencia. La rama siguiente puede depender de tareas cumplidas, sin recompensas diseñadas sólo para equilibrar al enemigo.

Definir cuánto tiempo transcurre entre misiones, qué puede repararse, dónde y con qué recursos. Refuerzos requieren disponibilidad y llegada, no aparición instantánea salvo abstracción declarada del cambio de escenario.

Separar estado verdadero de campaña y conocimiento del comandante. Una baja no confirmada puede seguir siendo incierta para el jugador; no reaparecer porque nadie la vio. Los errores de inteligencia no deben borrarse automáticamente al cambiar de misión.

La incertidumbre sobre parámetros técnicos puede mantenerse coherente durante una campaña; el azar de detección o de encuentros sigue ocurriendo durante la ejecución. No resamplear todo el rendimiento de un equipo en cada disparo.

El manual recibido de CMO describe campañas enlazadas por escenarios y puntuación. No documenta aquí una economía ni la persistencia automática propuesta: eso es diseño nuestro.

## 8. Orden de entrega y aceptación

Cada etapa admite varias PR pequeñas. Antes de empezar, registrar qué ya resolvió Claude y reutilizarlo.

| Etapa | Entrega | Prueba principal |
|---|---|---|
| 0. Reconciliar | Último main, inventario de cambios, baseline y contratos de datos | Tests existentes y escenarios reproducibles; pendientes conocidos separados de novedades |
| 1. Perspectivas | Propietario explícito, vistas por bando, contactos básicos y decisiones sin ruta futura real | Cambiar información oculta no cambia lo presentado ni decisiones previas a una observación |
| 2. Variantes | Componentes, munición tipada y primeras configuraciones verificadas | Compatibilidades inválidas rechazadas; conservación de componentes y existencias |
| 3. Misión con recursos | Briefing propio, presupuesto, disponibilidad y metas temporales | No gastar de más; preparación y guardado reproducibles; jugar ambos lados sin ver planes enemigos |
| 4. Operación informada | Incertidumbre, reportes, autonomía al aislarse, EMCON y ESM mínimo | Reportes antiguos siguen antiguos; no llegan órdenes sin canal; ni IA ni UI usan datos ocultos |
| 5. Movilidad/logística | Estados de despliegue, movimiento, recarga y reparación | Ningún recurso aparece gratis; capacidades durante movimiento y tiempos cumplen sus reglas |
| 6. Campaña | Estado persistente, tiempo entre misiones, inteligencia y refuerzos | Guardar/cargar reproduce recursos, daño, conocimiento y progreso sin duplicación |
| 7. Aviones | Misiones, combustible, cargas y bases con capacidad funcional | Diseñar después de estabilizar las etapas anteriores |

La etapa 1 necesita contactos mínimos; la 4 los profundiza. No dejar la lógica de tiro omnisciente hasta el final. La primera misión con presupuesto se entrega en la etapa 3; no esperar a completar toda la campaña para probar si la experiencia funciona.

### Pruebas transversales

- Migrar escenarios v1 con advertencias explícitas y defaults compatibles; no cambiar silenciosamente los actuales a reglas estrictas.
- Separar archivo de escenario completo, partida guardada y exportación de la vista de un bando. El primero es material de editor, no un reporte de inteligencia.
- Semilla fija, paso simulado fijo y restauración del estado/RNG/catálogos al terminar Monte Carlo. No introducir otro generador de azar.
- El laboratorio puede variar la verdad del escenario; un análisis durante el modo comandante sólo usa hipótesis autorizadas. No mostrar distribuciones que revelen planes secretos.
- Revisar fugas por nombres, IDs, orientación por defecto, orden de listas, tooltips, registros, cobertura, metas y debrief; no únicamente por iconos.
- La igualdad de vistas antes de observar no implica igualdad de resultados físicos: el mundo oculto sí puede cambiar lo que sucede después.
- Pruebas de navegador además de Node: preparación, cambio de bando en editor, aislamiento, guardado y debrief; sin errores de consola.
- Revisar las golden con razonamiento y CHANGELOG `[sim]` cuando cambien resultados. No regenerarlas solamente para eliminar fallas.
- Agregar registros causales internos de decisiones y bloqueos para explicar por qué no hubo disparo; mostrar sólo causas conocidas por esa perspectiva.

## 9. Cambios al roadmap actual

Conservar calibración, fuentes, incertidumbre y regresiones como base. Insertar perspectivas y variantes antes de sumar muchas plataformas. Mover aviación después de movilidad/campaña. Tratar los casos de victoria constante como auditorías, no obligaciones de balance.

Repetición sigue siendo útil, pero comenzar con eventos y debrief propios. Una reproducción omnisciente durante campaña puede filtrar información de la misión siguiente.

No propondría ahora reescribir en un framework, convertir a 3D, añadir multijugador, simular todas las técnicas EW ni importar masivamente una base comercial. Esas expansiones no son necesarias para la experiencia pedida.

## 10. Antes de programar

Este plan ya sirve para acordar alcance; no hace falta otro manual para sus primeras etapas. Las prestaciones concretas de las nuevas configuraciones sí necesitan investigación pública adicional y verificación de disponibilidad/costos. El material recibido inspira estructura y mecánicas; no sustituye esa investigación.

Siguiente trabajo recomendado: contrastar el último main con la etapa 0 y escribir los contratos pequeños de propietario, contacto, vista y configuración. Después una entrega vertical que permita preparar y jugar una misión desde un solo bando, sin tocar a la vez toda la física.

Ver [REFERENCIAS.md](REFERENCIAS.md) para el alcance y las limitaciones de los materiales.

## 11. Pedidos de interfaz y seguimiento

También forman parte del rumbo los pedidos de cantidades enteras, explicación de C2 frente a enlace técnico, pertenencia C2 por unidad, doctrina de señuelos por unidad o selección múltiple, bandos visibles en EW, borrado con `Delete`, regla de distancias y fijar una pista aérea con su información actualizada. Ver [PENDIENTES.md](PENDIENTES.md) para IDs, criterios de aceptación y dependencias; y [NOTAS-USUARIO.md](NOTAS-USUARIO.md) para el contexto original.

La lista es un registro de intención, no una afirmación de que esos cambios ya existen. Lo ya implementado aquí permanece en el laboratorio experimental, sin conexión al simulador.
