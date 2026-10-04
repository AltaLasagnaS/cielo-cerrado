# Presupuesto, briefing y campaña: contratos de diseño

Esta parte es diseño de integración, no una campaña implementada. El libro de recursos de `lib/budget.mjs` es el prototipo ejecutable; no calcula misiones ni combate. Ahora admite continuidad de recursos entre etapas y `lib/briefing.mjs` una proyección de preparación: ver [contrato ejecutable y límites](PROTOCOLO-PROTOTIPO.md).

## Flujo de una misión

1. Seleccionar bando y recibir su briefing, objetivos, plazo y restricciones.
2. Consultar únicamente inteligencia disponible para ese mando.
3. Asignar recursos disponibles dentro del presupuesto y preparar medios propios.
4. Congelar ofertas y despliegue al ejecutar. Las compras dejan de estar disponibles.
5. Recibir reportes y emitir órdenes por canales habilitados, según la futura perspectiva que implemente Claude.
6. Recibir debrief propio. La reconstrucción omnisciente es una opción separada de laboratorio.

Dos bandos pueden tener cantidades, costos marginales, reservas y disponibilidad diferentes. No se igualan por razones de balance. El briefing no tiene que revelar el presupuesto ni las fuerzas completas del enemigo.

## Propiedad de datos

- El autor/editor posee la definición completa del escenario, incluidos planes de ambos bandos.
- El motor posee la verdad de la ejecución.
- Cada mando posee un briefing, recursos e inteligencia propios; una vista por bando le entrega sólo lo permitido.
- Un reporte tiene fecha de observación, fecha de recepción y fuente. Recibirlo tarde no actualiza la observación.
- Los objetivos reales pueden evaluarse internamente sin revelar inmediatamente pérdidas o daños enemigos no confirmados.

Codex no implementa aquí otra niebla de guerra en paralelo. Este contrato debe adaptarse a la vista que desarrolle Claude. Filtrar el texto del briefing no basta si listas, coberturas, archivos exportados o debrief filtran información real.

## Datos propuestos de briefing

`sideId`, `issuedAtSimTime`, `missionId`, `taskText`, `deadline`, `constraints`, `ownResources`, `intelligenceReports`, `knownObjectives` y `uncertainties`.

Los reportes no contienen referencias internas del mundo real que la interfaz pueda resolver para obtener coordenadas actuales. Los contactos tienen su identidad visible y estimación propia. La nacionalidad del equipo no sustituye a `ownerSideId`.

Un reporte puede referirse a una instalación fija conocida o a una posición estimada de una unidad móvil. Un arma dirigida a coordenadas antiguas no persigue automáticamente una unidad que se mueve. La interacción con guía y sensores pertenece al motor, no al presupuesto.

## Qué resuelve el prototipo de recursos

- Cantidades y precios enteros; operaciones sin redondeos flotantes.
- Cotización congelada y disponibilidad máxima por oferta.
- Paquetes con composición explícita: equipos durables y consumibles separados.
- Compra única y cancelación segura durante preparación.
- Distinción entre existencias reservadas, asignadas como listas y consumidas.
- Eventos con ID, reintentos idempotentes y rechazo de comandos de otro libro/bando.
- Guardado por configuración inicial y eventos, con validación al reconstruir.
- Continuidad de recursos mediante `begin-mission` después de `finish`, sin reset de saldo, disponibilidad ni consumidos. Pedidos comprometidos no se reembolsan en etapas posteriores.

El campo `ready` todavía no asigna munición a un lanzador concreto. La integración futura deberá respetar capacidades, compatibilidad y localización. El prototipo no puede certificar que una batería real esté desplegada u operativa.

Los créditos de demostración no son dólares ni precios militares. La unidad monetaria real requiere moneda, año, alcance, impuestos/servicios incluidos y normalización explícita. Que un formulario acepte referencias no acredita automáticamente que un contrato contenga el precio supuesto.

## Logística y reparación: interfaz pendiente

Un pedido pagado no llega al mapa instantáneamente. La operación futura de entrega debe declarar disponibilidad, origen, destino, medio, tiempo simulado y condiciones. La recarga necesita existencias compatibles en el lugar adecuado, lanzador apto y proceso de duración positiva o abstracción declarada.

Claude mantiene los estados físicos de daño y reparación. El presupuesto no debe establecer otro umbral de daño ni reparar por deducir dinero. Un proceso físico exitoso podrá producir un evento económico/logístico; ese evento se aplica una sola vez.

No hay recarga durante combate en este prototipo. `load/unload` sólo preparan la asignación previa. Integrar una recarga exige implementar un evento de finalización autorizado por el motor, no abrir libremente `load` durante misión.

Los equipos durables no se consumen al disparar. Las bajas reales de unidades y componentes requieren eventos de pérdida distintos. Los recursos de reparación y consumibles tienen contabilidad propia; no compensan automáticamente otras pérdidas.

## Campaña corta

Primera campaña propuesta: pocas misiones enlazadas. El estado persistente incluye unidades/componentes, daño, munición por localización, presupuesto, disponibilidad, objetivos funcionales e inteligencia, no sólo una puntuación.

Transición entre misiones:

1. Congelar el estado real de la misión al terminar y conservar su semilla/eventos.
2. Evaluar tareas reales y, por separado, producir el reporte conocido por el jugador.
3. Avanzar un tiempo entre misiones explícito. Aplicar sólo procesos de reparación/transporte factibles durante ese intervalo.
4. Incorporar pérdidas, consumos, entregas y gastos una vez; reconciliar inventarios sin duplicar.
5. Construir el briefing siguiente con la inteligencia persistente y sus reportes nuevos. No revelar automáticamente la verdad anterior.
6. Ofrecer recursos realmente disponibles para la misión siguiente y crear una nueva preparación.

No reutilizar simplemente `createPlan()` para iniciar cada misión con dinero y ofertas originales: regeneraría recursos. El prototipo ahora continúa el mismo libro con `begin-mission`. La campaña real deberá añadir únicamente los cambios autorizados por su estado físico/logístico, sin fabricar otro presupuesto inicial.

El estado verdadero de campaña y su panorama conocido se guardan por separado. Una unidad destruida y no confirmada no reaparece; puede continuar como contacto/reportes inciertos. La reparación usa el tiempo simulado y recursos; un cambio de escenario no cura equipos por defecto.

La persistencia de incertidumbre técnica debe acordarse con el sistema `UNC`/RNG de Claude: parámetros desconocidos del mismo equipo no se resortean oportunistamente en cada disparo, mientras que los eventos aleatorios de cada encuentro sí se producen durante la ejecución.

## Criterios de aceptación de la integración

- Guardar/cargar no duplica fondos, equipos, munición ni entregas.
- Repetir la llegada de un evento no aplica dos veces su efecto.
- Ninguna compra permite ver existencias secretas del enemigo.
- Disparar reduce munición lista sin volver a pagar su adquisición.
- Una reserva en depósito no equivale a munición cargada en un lanzador.
- Pausar no avanza movimiento, reparación, llegada o recarga.
- Un corte de comunicaciones no equivale a muerte ni permite controlar la unidad por el panel de presupuesto.
- Debrief/campaña no revelan inteligencia reservada de futuras misiones.
- Las metas dependen de funciones y plazo definidos, no de lograr una tasa de victoria deseada.
