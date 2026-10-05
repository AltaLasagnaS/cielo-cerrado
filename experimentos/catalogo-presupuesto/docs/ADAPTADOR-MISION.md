# Adaptador ejecutable de una misión

5-oct-2026. `lib/mission-adapter.mjs` conecta el contrato de recursos con un consumidor de combate. Se prueba con [la campaña ficticia](../data/demo-campaign.mjs), sin importar `src/`. Claude conserva el enganche en el motor, según [el reparto acordado](AUTONOMIA-2026-10-05.md). No habilita variantes reales.

## Asignación y autoridad

`attachMission(campaign, {sideId, bindings})` exige un libro auténtico activo (o finalizado para consulta/restauración). Cada binding declara `unitId` numérico del motor, `readyLocationId` de un lanzador, `reserveLocationId` de un depósito, `ammunitionIds` y `reloadServiceId` o `null`. Verifica referencias, carga admitida y correspondencia del servicio. No asigna un mismo lanzador a dos unidades; varios pueden compartir una reserva sin duplicarla.

El motor construye bindings **sólo de unidades del bando indicado**, según su dueño explícito, no su procedencia. El adaptador no recibe el mundo completo ni puede descubrir que un ID del caller correspondía al enemigo. No infiere variantes/capacidad a partir del nombre Patriot/S-300. Un legado agregado requiere declarar la aproximación, sin presentarlo como una variante identificada.

Hay un solo libro físico. `getCampaign()` devuelve estado inmutable para persistencia interna, **no la vista autorizada del comandante**. Durante combate, todas las operaciones usan la misma sesión. Copiar cantidades a otro libro o aplicar órdenes sobre una copia anterior crea dos autoridades y queda fuera del contrato.

## Métodos

Cada operación lleva `requestId` globalmente único y `missionSeconds` desde el inicio de esa misión. Un reintento idéntico no repite efectos aunque ya haya pasado el tiempo o terminado la misión. Un ID repetido con otro contenido se rechaza.

| Método | Datos adicionales | Efecto |
|---|---|---|
| `ammunition(unitId)` | Sin ID/tiempo | Cantidades listas y de reserva **por tipo** |
| `advance({missionSeconds})` | Sin ID | Procesa trabajos vencidos al avanzar el motor |
| `fire` | `unitId, ammunitionId, quantity` | Consumo único desde el lanzador; tiros normales, DRFM y HOJ |
| `reload` | `unitId, ammunitionId, quantity` | Servicio explícito con tránsito, plazo y costo |
| `damage` | `componentId, condition` | Registra `degraded/disabled/destroyed` decidido por la física |
| `loseStock` | `locationId, ammunitionId, quantity` | Pérdida en una ubicación explícita, decidida por la física |
| `repair` | `serviceId, componentId` | Repuestos, fondos y plazo; no recuperación gratuita |
| `order` | `quoteId, quantity` | Pedido finito con entrega demorada |
| `cancel` | `jobId` | Condiciones del contrato; retorno con plazo/costo |
| `finish` | Ninguno | Cierra sin restaurar recursos/trabajos |
| `save/loadMission(text, expectedSideId)` | Sin evento | Replay del libro y bindings; conserva reloj y recarga en curso |

El reloj admite segundos fraccionarios finitos, acotados a 1e9 s desde el origen (unos 31 años). `S.t` usa pasos de **0,25 s**: se suma el inicio absoluto de la misión, sin truncar ni redondear. Cantidades y unidades monetarias menores siguen siendo enteras. El briefing nuevo admite este reloj; el libro contable anterior conserva sus intervalos enteros.

`degraded` conserva capacidad funcional; prestaciones las calcula el motor. En el legado, `dmgRadar` reduce alcance/reacción y no debe traducirse automáticamente a `disabled`. Un lanzador fuera de servicio sí queda inutilizado. Destruir una batería debe producir consecuencias por componente y ubicación; no se inventa dónde estaban las reservas externas.

## Enganches concretos a cargo del motor

1. `startSim`: leer el estado persistente; no rellenar `magLeft/reserveLeft` desde el catálogo en cada misión. Los caches de render/replay derivan del único libro.
2. `step`: avanzar con `S.t`. Definir prioridad de impacto frente a trabajo vencido en el mismo instante; el adaptador no consulta trayectoria futura.
3. `engage`, `phantomShot`, `ew`/HOJ: verificar autorización física sobre observación y munición tipada antes de lanzar; `fire` exactamente una vez por lanzamiento efectivo. El ID corresponde al evento real, incluyendo índice de cada misil de la salva. No generar otro ID para reintentar.
4. Recarga: sustituir incrementos/restas autónomos por `reload` y consulta del resultado temporizado. El motor decide distancia, seguridad, canales y disponibilidad antes de iniciar.
5. Daño/destrucción: emitir resultados por componente/localización. Luego la perspectiva limita qué bajas conoce el jugador incomunicado.
6. Fin/continuación: guardar el libro y comenzar otra misión sin restaurar cantidades. También hace falta conservar HP/posición de unidades/objetivos desde la autoridad física; el inventario no reconstruye integridad ni movimiento.
7. Monte Carlo: instancias independientes por corrida, sin consumir la campaña del usuario. Replay consulta historia, no vuelve a disparar ni comprar.

La munición que se registra debe coincidir con la configuración física que usa el disparo. No se elige por precio ni por nombre de familia. La selección de un nuevo tipo de interceptor exige datos/UNC completos y validación independiente, no un cambio de etiqueta.

Pruebas: origen temporal distinto de cero y pasos de 0,25 s; recarga demorada; consumo tipado/idempotente tras ticks/fin; error que no confirma ni el reloj propuesto; radar degradado/inutilizado; pérdida localizada; restore en recarga y continuidad; rechazo de doble asignación, bando, munición y servicio.

(Pendiente: enganche de Claude y pruebas de un escenario real; migración explícita del legado; HP/posición/inteligencia persistentes, trayectos y campaña jugable. Las fixtures certifican conservación del contrato, no configuraciones militares.)
