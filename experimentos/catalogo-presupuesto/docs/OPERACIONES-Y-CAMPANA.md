# Campaña de Odesa y contrato de operaciones

Estado: implementación experimental del 5-oct-2026, sobre `main` `0a77102`, PR #61. **Dos misiones jugables con el motor actual**, fuera del menú principal. El enganche nativo y la interfaz de `src/` pertenecen a Claude; no se modifican en este paquete. No se cierra el roadmap entero por esta entrega.

## Qué se puede jugar

Desde la **raíz del repositorio**, `python -m http.server --bind 127.0.0.1 8766`; abrir `/experimentos/catalogo-presupuesto/demo/ports.html` en ese servidor. Los imports del motor requieren servir la raíz, no solamente la carpeta experimental. No hay dependencias de red externas. La pantalla usa fuentes del sistema y módulos ES; no es aún el `index.html` autocontenido.

Se asignan hasta 1500 créditos entre los medios del catálogo actual. La primera guardia admite los medios de origen soviético y grupos móviles elegidos. IRIS-T, si se asignó inicialmente, queda reservado hasta la segunda. Todos empiezan **sin munición**. Pedir, recibir y cargar son actos distintos; cantidades enteras, disponibilidad finita, dinero descontado una vez y plazos explícitos. Las compras iniciales de medios son una asignación presupuestaria fija registrada en la definición, no una transacción posterior del libro de suministros.

Las guardias usan `od_puertos` y `od_corredor`, sobre el relieve de Odesa, con las fuerzas atacantes existentes. No se alteran esas fuerzas para obtener un resultado deseado. Se conservan fondos, stock, componentes, infraestructura, posiciones, trabajos y reportes; no aparecen reemplazos ni premios monetarios al pasar de etapa. El intervalo de 24 h es **una regla de esta campaña hipotética**, no una reconstrucción de las fechas de los dos escenarios históricos inspiradores.

Los créditos, disponibilidad, plazos de entrega/reparación y desbloqueo son supuestos de escenario. Las capacidades de combate y tiempos de recarga proceden del catálogo actual; no se mejoran por costos ni certifican una variante. La capacidad `sam.mag` sigue siendo un agregado legado, **no los misiles de un lanzador exacto**. Cada munición `legacy-*` mantiene esa identidad explícita. No se equiparan PAC-3/GEM-T, S-300PT/PS ni MANPADS diferentes.

El mapa muestra medios e infraestructura propios y pistas previamente observadas. Extrapola sólo dos observaciones; no consulta posición, supervivencia, tipo real ni ruta futura del enemigo para dibujar un contacto. Una pista envejecida permanece gris hasta caducar. La posición/azimut inicial de medios es fija en este prototipo. El debrief experimental informa resultado y daños propios; no publica un inventario exacto de bajas enemigas.

## Una autoridad para munición y daños

`lib/port-combat.mjs` es un puente opcional al **mismo motor** (`startSim`, `step`), no otro modelo balístico. El libro autenticado de `logistics.mjs` mantiene la verdad de recursos. `magLeft` es una copia derivada para la decisión de tiro; `reserveLeft=0` y `reloadUntil=null` impiden las recargas autónomas ajenas al libro. Los disparos normales, fantasmas DRFM y HOJ se asientan una vez con `mission-adapter.mjs`. El puente agenda la recarga temporizada cuando el medio vacío ya no tiene disparos pendientes.

Destruir una unidad destruye sus componentes y su carga asociada; no destruye un depósito externo. La degradación del radar y deshabilitación del lanzador se conservan al cambiar de misión. Reparar consume fondos/repuestos y tiempo; restablece capacidad del componente, no cura gratis todos los HP de la unidad. No hay trayectos geográficos de camiones, dotaciones, talleres ni nueva compra de infraestructura. Son pendientes expresos.

El puente procesa trabajos que vencen en el cuarto de segundo siguiente **antes** del movimiento/daño de ese paso. Es un orden experimental declarado; la integración nativa debe fijar y probar su orden de eventos. Avanza el libro cuando vence un trabajo, ocurre un efecto o cada 30 s; conserva tiempos fraccionarios y evita registrar miles de comandos vacíos. El RNG sembrado se instala sólo durante el paso del motor.

## API estratégica (sin imports de `src/`)

En `lib/operations.mjs`:

- `createOperations(definition)`: valida activos propios, etapas, ofertas y grafo acíclico alcanzable. Crea un único libro.
- `applyOperationResourceCommand(state, command)`: preparación; ofertas de la etapa, presupuesto y ventana temporal.
- `activateOperationMission(state, requestId)`: fija el comienzo de misión sin reiniciar recursos.
- `syncOperationResources(state, authenticBook, requestId)`: checkpoints; exige mismo origen, bando, misión e historia descendiente.
- `completeOperationMission(state, input)`: debrief propio tras `finish()` del adaptador; exige estado de todos los activos permitidos. Recuperar HP exige trabajo pagado/terminado, una sola vez; no resucita activos destruidos.
- `continueOperations(state, requestId)`: rama explícita según éxito/parcial/fracaso; avanza el reloj y completa trabajos pendientes en orden, conservando todo.
- `operationView(state)`: proyección para el comandante. No contiene definiciones de futuras etapas ni planes enemigos.
- `operationMission(state)`: proyección **interna** para el controller, con clave de escenario y activos admitidos. No se publica en el briefing.
- `saveOperations` / `loadOperations`: definición, comandos del libro y eventos estratégicos; reconstrucción y rechazo de replay divergente. No se acepta un snapshot de saldo editado como estado autenticado.

La definición incluye `resourceInitial`, activos con HP/posición/mapa y componentes, y misiones con `scenarioKey`, `allowedAssetIds`, `allowedQuoteIds`, objetivos propios, ventana de preparación e intervalo. Las ramas actuales permiten continuar aun fracasando; la API admite terminar o elegir otra etapa, con pruebas de esa rama. No se añade un requisito de victoria artificial.

## Entrada y salida para Claude: `missionReport` versión 1

`operationScenario(state, template)` recibe una plantilla interna **del archivo de escenario v1**, con `scenario.base` y `map.key` correspondientes a la etapa. Devuelve `{ scenario, bindings }`. Mantiene el plan enemigo del autor; reemplaza medios propios por los permitidos/supervivientes y sus HP, posición, daño y munición canónica; agrega `hpNow` a infraestructura. No inventa una nueva trayectoria para un ataque dirigido a una unidad ausente: falla y exige que el autor defina esa contingencia. No admite cargas mixtas ni múltiples lanzadores en una unidad legada: necesita el modelo nativo de componentes para ello.

`completeMissionReport(state, { report, resources, requestId, scenarioName })` recibe el informe **filtrado del bando** de `src/sim/mission.js` del #64 (`4e91267`) y el libro canónico ya finalizado. Devuelve operaciones en `debrief`. Rechaza bando/versión/escenario/tiempo incompatibles, activos ajenos, munición divergente, disparos sin asentar y daños de componentes no registrados. **El informe no crea ni repone munición.** Reintentos idénticos no duplican efectos, incluso después de continuar. Los reportes se conservan como información no confirmada, fechada, sin convertir un texto de registro en verdad enemiga; límite de 100 reportes persistentes, priorizando los últimos del parte hasta llenar el espacio.

Secuencia del controller:

```js
const { scenario, bindings } = operationScenario(operations, template);
// validateScenario(scenario) y loadScenarioData: API de Claude.
operations = activateOperationMission(operations, 'start-first-watch');
const session = attachMission(operations.resources, { sideId: 'ua', bindings });
// Durante combate: session.fire/reload/damage/advance; consultas canónicas.
// Contadores derivados; no segundo depósito dentro del motor.
session.finish({ requestId: 'finish-first-watch', missionSeconds: report.t });
operations = completeMissionReport(operations, {
  report, resources: session.getCampaign(), requestId: 'report-first-watch',
  scenarioName: scenario.scenario.name
});
// Mostrar operationView(operations). El jugador elige continuar:
operations = continueOperations(operations, 'next-watch');
const next = operationScenario(operations, nextTemplate);
```

**El enganche de consumo/recarga durante el combate sigue siendo necesario.** Leer `mag` al comenzar y copiar `magLeft` al final no alcanza para garantizar identidad de munición, duración de transferencias, pérdidas y un solo inventario. `port-combat.mjs` muestra ese enganche ejecutable sin tocar `src/` para que Claude pueda trasladarlo a su controller. Sólo se admite defensa ucraniana con medios/objetivos contratados; campaña atacante, EW propia persistente y BDA incierto siguen pendientes.

Se comprobó que el escenario generado pasa `validateScenario` del #64 `4e91267`, sin errores ni advertencias. Eso verifica **compatibilidad de entrada**, no integración de la pantalla nativa. Las pruebas Node verifican `missionReport` v1 con fixtures del contrato y casos de rechazo; los combates completos del puente se prueban aparte con el motor de `main`.

## Persistencia y validación

La pantalla guarda en preparación/debrief/fin y restaura atómicamente: un archivo inválido conserva la partida actual. No restaura una batalla en curso, porque el guardado estratégico aún no incluye vuelo/RNG/replay físico. La API puede conservar el libro activo, pero eso no equivale a reanudar el mundo de la simulación. El archivo local no cifra planes de escenario ni protege contra modificar la definición inicial; las restricciones de vista son interfaz, no seguridad multijugador.

Pruebas relevantes: `operations.test.mjs`, `mission-report.test.mjs`, `port-combat.test.mjs` y `ports.browser.mjs`. Las dos últimas ejecutan dos guardias con el motor, verifican daño, gasto, desbloqueo, debrief y continuidad. Chromium comprueba enteros explícitos, guardado/restauración, fase activa sin guardado engañoso, vista propia y ausencia de pedidos de red externa; viewport de 390 px sin desbordamiento. La workflow experimental las ejecuta junto a las pruebas previas.

Pendientes para cerrar F05/F08/F09 en el juego: integrar el controller/UI de Claude; partida autocontenida; configuración y precios reales con evidencia; distribución/movilidad/traslados geográficos; campaña por ambos bandos con inteligencia y BDA autorizados; restauración física de una batalla en curso. Aviones, inglés y app de escritorio quedan fuera de la prioridad actual por decisión del usuario.
