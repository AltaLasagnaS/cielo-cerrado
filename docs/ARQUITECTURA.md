# Arquitectura

El juego es una página web estática hecha con **JavaScript moderno (módulos ES), sin frameworks**. El código fuente vive en `src/`; `npm run build` lo junta en un único `index.html` autocontenido que se abre con doble clic.

## Capas

```
 util  →  data  →  physics  →  sim  →  render  →  ui        (main.js conecta todo)
 azar,    catálogo,  modelos     estado,   canvas     paneles,
 formato  escenarios puros       bucle,    del mapa   ventanas,
          relieves   (sin DOM)   debrief              interacción
```

**Regla:** cada capa solo importa de las de su izquierda. `data`, `physics` y `sim` **no tocan el DOM**, así que corren en Node: las pruebas ejecutan corridas completas sin navegador. La simulación avisa a la interfaz mediante enganches (`sim/hooks.js`) que `main.js` conecta:

| Enganche | Lo que hace la interfaz |
|---|---|
| `onLog` | Marca el registro para redibujarlo |
| `onEnd` | Actualiza los controles y abre el debrief |
| `onUnitLost` | Recalcula la cobertura |
| `defenderView` | Consulta la vista del defensor (cambia el texto del registro) |
| `attackerView` | Consulta la vista del atacante (cambia el dibujo y lo que se puede tocar) |

## Mapa de archivos

### `src/data/`: datos puros
- `index.js`: punto de entrada único. Al importarse, aplica los valores probables (`applyProbable`).
- `threats.js`, `defenses.js`, `jammers.js`: catálogo.
- `uncertainty.js` (`UNC`): rangos, confianza y razonamiento de cada parámetro.
- `sources.js` (`SRC`), `observed.js` (`OBS`), `calibration.js` (`CAL`).
- `bands.js`: **la única fuente de datos de bandas** (simulación, fichas, Academia).
- `targets.js`: tipos de objetivo y parámetros de daño.
- `scenarios.js`: escenarios declarativos (objetivos, fuerzas, reglas, metas).
- `terrain/`: relieves (metadatos + grilla en base64 + máscara opcional de ríos y lagos). Kiev, Járkov y Odesa se generan con `scripts/gen-terrain.mjs` (Járkov, con una ventana armada con dos tiles).

### `src/physics/`: modelos (ver [FISICA.md](FISICA.md))
- `terrain.js`: mapa activo, `elev`, `surf`, `los`, importación SRTM.
- `terrain-analysis.js`: puntos altos, relieve relativo, curvas (solo visual).
- `radar.js`: RCS por banda, alcance, sectores, interferencia, horizonte.
- `kinematics.js`: trayectorias de las amenazas.
- `engagement.js`: pistas, solución de tiro (`solve`, `trackKeys`, `arrivalReach`), Pk.
- `track.js`: pista observada: velocidad medida y posición prevista en línea recta (tiro sin omnisciencia).
- `coverage.js`: viewshed de cobertura.
- `damage.js`: daño a objetivos.
- `constants.js`: KR (Tierra 4/3), margen de LOS, coeficiente del horizonte.

### `src/sim/`: estado y simulación
- `state.js` (`S`): estado único. `S.setup` es lo que arma el jugador; el resto es la corrida en curso.
- `setup.js`: agregar objetivos, defensas, salvas y jammers; desplegar escenarios.
- `montecarlo.js`: modo Monte Carlo (N corridas, sorteo de parámetros, distribución de resultados).
- `scenario-io.js`: guardar el escenario del jugador como JSON y validarlo y desplegarlo al cargar.
- `engine.js`: `startSim`, `step(dt)`, `engage`, `impact`.
- `log.js`: registro y eventos de la línea de tiempo.
- `replay.js`: repetición de la corrida (anota los cambios y reconstruye el mapa en cualquier instante).
- `contacts.js`: lo que sabe cada bando: la defensa de cada amenaza (última detección, posición estimada, edad; pistas por radar y por red en `th.obs`) y el atacante de cada defensa (`attackerKnows`). Lo usan las vistas y la solución de tiro.
- `ew.js`: guerra electrónica de la defensa (triangulación de jammers, home-on-jam). `weather-now.js`: clima vigente (plan de cambios, día y noche).
- `goals.js`, `debrief.js`: evaluación de metas y análisis final.
- `mission.js`: informe de fin de misión para la campaña (`missionReport(bando)`): metas de ese bando, sus medios (vida, componentes, munición, si el enemigo los ubicó), el registro como lo conoce y lo gastado. La continuidad entra por el armado: `defs[].hp`, `dmgRadar`, `dmgLauncher`, `mag`, `reserve` y `objectives[].hpNow`.
- `pace.js`: fases del modo de velocidad Auto.
- `hooks.js`: enganches hacia la interfaz.

### `src/render/`: canvas
- `view.js`: cámara (centro, escala, `devicePixelRatio`).
- `terrain.js`: relieve en 4 modos, curvas y puntos altos.
- `coverage.js`: capa de cobertura.
- `draw.js`: todo lo demás (unidades, rutas, amenazas, objetivos, previsualización).

### `src/ui/`: interfaz
- `panels/`: una pestaña o tarjeta por archivo.
- `input.js`: gestos (click, arrastre, pellizco) y teclado.
- `modes.js`: modos de edición y confirmación antes de colocar.
- `fichas.js`: ventanas modales con historial ("← Volver").
- `montecarlo.js`: ventanas de configuración, progreso y debrief del modo Monte Carlo.
- `scenario-file.js`: botones Guardar y Cargar (descarga y lectura del archivo, cambio de mapa).
- `goals-editor.js`: editor de metas (bando del jugador, metas de cada bando sobre objetivos o unidades); trabaja sobre una copia de `S.scen`.
- `replay.js`: barra de repetición sobre el mapa (línea de tiempo, velocidad, registro del instante).
- `debrief.js`, `academy.js`, `relief.js`, `controls.js`, `loop.js`, `coverage.js`, `hgt.js`, `help.js`.

### `src/edu/concepts.js`
Contenido de la Academia: cada concepto con su explicación y la sección "En el simulador", generada a partir de los datos y funciones reales.

## Un paso de simulación (`sim/engine.js#step`)

1. **Lanzamientos:** las amenazas programadas cuyo `tLaunch` ya pasó entran en vuelo.
2. **Movimiento:** posición con `posAt`. Al llegar al blanco: `impact` (dispersión, daño, eventos). Liberación de señuelos y efecto GNSS.
3. **Sensores:** cada radar que completa su barrido intenta detectar cada amenaza (alcance, sector, interferencia, Pd, LOS).
4. **Enfrentamientos:** cada unidad con arma evalúa una vez por segundo simulado (`engage`): candidatos con pista, reacción cumplida y sin otra batería disparándoles; solución de tiro; disparo.
5. **Interceptores:** los que llegan al punto de encuentro resuelven derribo o falla con `calcPk`.
6. **Fin:** si no quedan amenazas ni interceptores en vuelo, se registra el evento final y se abre el debrief.

El bucle de la interfaz (`ui/loop.js`) acumula el tiempo entre cuadros con `sim/clock.js` y llama siempre a `step(0,25)`: las fracciones se conservan para el cuadro siguiente. Así **el resultado no depende de la velocidad ni de la frecuencia de cuadros**. Una corrida nueva descarta el tiempo pendiente de la anterior.

## Reproducibilidad y pruebas

- `util/rng.js` centraliza el azar; `seeded(n)` da corridas idénticas.
- `util/ids.js` centraliza los ids. El orden en que se piden importa, porque aparecen en el registro.
- `tests/golden.json` guarda el resultado de 8 corridas con semilla fija. Si cambia la física, estas pruebas fallan **a propósito** (ver [CONTRIBUIR.md](../CONTRIBUIR.md)).

## Build

- `scripts/build.mjs`: esbuild empaqueta `src/main.js` (IIFE, sin minificar) y lo inserta, junto con el CSS, en la plantilla `src/index.html`. El resultado es el `index.html` de la raíz.
- `scripts/dev.mjs`: servidor de desarrollo que sirve `src/` tal cual (los módulos ES funcionan nativos en el navegador) y recarga al guardar.
- `scripts/gen-catalog-doc.mjs`: genera `docs/CATALOGO.md`.

## Archivo de escenario (Guardar / Cargar)

El botón **Guardar** descarga `S.setup` más las reglas y las metas como JSON (`sim/scenario-io.js#exportScenario`). Ejemplo abreviado:

```json
{
 "format": "cielo-cerrado/escenario", "version": 1, "saved": "2026-10-03T12:00:00.000Z",
 "map": { "key": "monterey", "name": "Bahía de Monterey (California, EE.UU.)" },
 "rules": { "net": true, "doctrine": "salva" },
 "scenario": { "base": "mb_noche", "name": "…", "player": "defensa", "goals": [ … ], "description": "…" },
 "setup": {
  "objs":   [ { "id": 1, "type": "fuel", "x": 63.5, "y": 55.8, "name": "…", "maxHp": 800 } ],
  "defs":   [ { "id": 4, "type": "patriot", "x": 58, "y": 58, "name": "Patriot-1", "az": 320, "mast": 4, "mag": 16, "salvo": 2 } ],
  "salvos": [ { "id": 18, "type": "isk_m", "count": 2, "pts": [[60, 0], [58.2, 58]], "targetUnit": 4, "sync": true, "tArrive": 1530 } ],
  "jams":   [ { "id": 24, "type": "soj", "x": 4, "y": 18, "alt": 8000, "on": true } ]
 }
}
```

- Las coordenadas son las del juego (km desde la esquina noroeste). `targetUnit` y `targetObj` son ids **del archivo**; al cargar se renumeran y las salvas siguen apuntando a lo mismo.
- **Al cargar** (`validateScenario`) se revisa todo antes de tocar el estado: formato y versión, mapa incluido (o, para un relieve `.hgt`, que ese mismo relieve esté cargado), tipos que existan en el catálogo (`DEFENSES`, `THREATS`, `JAMMERS`, `TARGET_TYPES`), posiciones dentro del mapa (±1 km), números finitos y en rango, ids únicos y blancos existentes. Si hay errores no se cambia nada y se listan; una meta sobre algo que ya no existe es solo un aviso. Solo se copian los campos conocidos.
- Con la misma semilla, un escenario guardado y vuelto a cargar da **exactamente** la misma corrida (`tests/scenario-io.test.js`).
- Si el formato cambia, subir `VERSION` y aceptar las versiones anteriores que se puedan convertir.

## Repetición (`sim/replay.js`)

El debrief tiene un botón **Ver repetición**: el mapa vuelve a mostrar la corrida con una línea de tiempo (reproducir, pausar, arrastrar y tres velocidades) y las últimas líneas del registro de ese instante. No se graban fotos del estado: las trayectorias de las amenazas son deterministas (`posAt`), así que durante la corrida solo se anota **cuándo** cambia cada cosa: fin de cada amenaza (`th.tEnd`) y nacimiento de cada señuelo (`th.tBorn`), todos los interceptores (`S.rec.ints`; `S.ints` se poda), el estado de unidades y objetivos después de cada cambio (`S.rec.units`, `S.rec.objs`), el registro completo (`S.rec.log`) y el instante de cada caída. `frameAt(T)` reconstruye el cuadro y `render/draw.js` lo dibuja en lugar del estado vivo; el panel de objetivos también sigue el instante elegido. Anotar no consume azar: las golden no cambian. `tests/replay.test.js` compara el cuadro reconstruido con el estado real de la simulación en seis instantes (posiciones, interceptores, unidades, objetivos, impactos y registro). Se muestra la verdad (como el debrief), no solo lo que veía la defensa.

## Vista del defensor (`sim/contacts.js`)

Con el selector de vista en **Vista del defensor**, el mapa, la ayuda emergente y la ficha de una pista muestran **contactos**, no la verdad. Cada detección de la defensa anota la posición vista (`th.seen`, y la anterior en `th.seenPrev`); `contactOf(th, t)` da la posición estimada por estima (última posición + velocidad de las dos últimas detecciones × edad) mientras la pista vive (12 s, la ventana de la red), y el último reporte fechado cuando se pierde (hasta 90 s). No muestra el tipo de arma, su blanco, su ruta ni la distancia que le falta; tocar el mapa selecciona el contacto donde se lo ve. Anotar no consume azar (las golden no cambian; `tests/contacts.test.js`). La repetición sigue mostrando la verdad.

Cada unidad tiene un **dueño explícito** (`u.owner`, `data/index.js#sideOf`): quién la opera, separado del país del equipo (un 36D6 o un Buk puede ser de cualquiera de los dos bandos).

**Tiro sin omnisciencia**: la solución de tiro (`physics/engagement.js#solve`) predice el punto de encuentro con la pista observada (`physics/track.js`: última detección y velocidad medida en una pista que le llega a esa batería, `th.obs` y `trackKeys`), no con la ruta real; solo los balísticos usan la trayectoria verdadera, que la física fija. Al llegar, `arrivalReach` decide con la posición real si al misil le alcanza la energía (docs/FISICA.md §6).

## Vista del atacante (`sim/contacts.js#attackerKnows`)

Con el selector en **Vista del atacante**, durante la corrida el mapa muestra sus armas (la verdad: son suyas) y solo las defensas que conoce: las que tienen un radar que ya emitió (`u.emitFrom`, también el AEW), porque la inteligencia de señales las ubica por su emisión, y las demás (cañones, MANPADS, drones interceptores, sensores acústicos u ópticos, radares en silencio) recién desde su primer disparo (`u.revealed`). El motor anota las dos cosas sin consumir azar (las golden no cambian). No muestra si una defensa está dañada o destruida, su munición, los interceptores en vuelo, la cobertura de radar, la ubicación de los jammers por triangulación ni el daño de los objetivos; la ficha y la ayuda emergente muestran solo posición, tipo y alcance de catálogo. La repetición sigue mostrando la verdad. Con el control de emisiones (`u.emcon`, docs/FISICA.md §6) un radar puede quedar apagado hasta la primera alerta o todo el tiempo, y así no se delata. 

**Registro, resultados y objetivos por bando** (`sim/log.js`): cada mensaje lleva quién puede saberlo (`who`: `'def'`, `'atk'` o `'all'`) y, si la defensa lo cuenta distinto, su versión (`alt`, que nombra la amenaza como `pista #N (clasificación)`, sin el tipo real). `logFor(entradas, vista)` filtra. La defensa ve sus detecciones, disparos, derribos, recargas, daños propios e impactos; el atacante, lo de sus armas (señuelos, GNSS, CRPA); los dos, el inicio, el clima y el resumen final. El panel de resultados muestra a cada bando solo sus números (el defensor no sabe cuántas armas se lanzaron ni cuáles eran señuelos; el atacante no sabe cuántas llegaron) y la lista de objetivos del atacante dice "sin evaluar". **El debrief muestra toda la verdad a propósito**: es el análisis posterior de la noche, para aprender qué pasó. La decisión de la defensa al repartir blancos usa su estimación de la Pk (`calcPk(..., est = true)`: última posición vista, velocidad medida, sin saber si el blanco va a estar en su maniobra terminal).

## Movilidad (`sim/mobility.js`)

Una defensa se traslada en tres fases: replegando, en tránsito y desplegando. Mientras dura no detecta, no dispara ni recarga (docs/FISICA.md §12).
- **Cómo se ordena:** con `orderMove(u, pts)` o con traslados programados en el escenario (`defs[].moves`, que `mobStep` ordena a su hora).
- **Datos:** los tiempos y la velocidad máxima salen de la ficha (`D(u).mob`, que se carga desde `UNC`). Sin datos no hay traslado. La velocidad de marcha va en cada orden (`orderMove(u, pts, kmh)`, `moves[].kmh`), con ese tope.
- **Repetición:** `recUnit` anota la posición y la fase. Durante el tránsito anota cada 5 s, así la repetición dibuja el trayecto.
- **Vista del atacante:** `contacts.js#asAttackerSees` muestra cada unidad en su última ubicación conocida (`u.fixes`), no donde está.

## Campaña (`ui/campaign.js`)

Botón **Campaña** (arriba): la campaña experimental de Odesa, con la lógica de Codex en `experimentos/catalogo-presupuesto/` (PR #61; guía en su `docs/OPERACIONES-Y-CAMPANA.md`). `lib/operations.mjs` lleva la campaña (etapas, presupuesto, pedidos con plazo, reparaciones, continuidad, guardado) y `lib/logistics.mjs` el **libro de recursos, la única autoridad de munición**. `ui/campaign.js` es la pantalla: asignación inicial, preparación (pedir, esperar, cargar, reparar), parte de cierre y continuar, más descargar y cargar la partida. La guardia se juega en el mapa del juego en vista del defensor: `lib/port-combat.mjs` arma el escenario y el bucle (`ui/loop.js`) llama a su paso (`campaignStep`) en lugar de `engine.step`, para que cada disparo, recarga y daño se asiente en el libro. El motor no cambia.

Es la única parte de `src/` que importa de `experimentos/`. Esos módulos importan el motor como `../../../src/…`: el empaquetado lo resuelve solo; el servidor de desarrollo y el de pruebas de navegador reescriben esas rutas a `/…` para que el navegador use la misma copia del estado (`scripts/dev.mjs`, `tests/browser/serve.mjs`). No se restaura una guardia a mitad de camino: se guarda en preparación o en el parte.

## Modo Monte Carlo (`sim/montecarlo.js`)

Corre N veces el mismo `S.setup`. La corrida *i* usa la semilla `seed + i` para la simulación y, si se pide sorteo, otra semilla derivada (`paramSeed`) para `applySample`, que reemplaza cada parámetro de `UNC` por un valor de una distribución triangular (mín, probable, máx). Lo que elige el jugador (posiciones, munición, mástil, rutas y alturas de las salvas) no se sortea porque se copia al ubicar cada cosa.

Una corrida se contabiliza únicamente cuando no quedan ataques pendientes, amenazas ni interceptores en vuelo. El límite de seguridad se calcula con el último lanzamiento más su tiempo de vuelo y 401 s para interceptores pendientes; no hay un corte fijo a los 10.000 s. Si ese límite se supera, la serie se detiene con un error y la corrida incompleta no se presenta como un resultado. Mientras corre la serie, el control de iniciar/pausar está bloqueado, incluso al cerrar la ventana para cancelar.

Para no ensuciar el juego normal ni las golden:

- la serie corre en **tramos** (`tick(ms)`): la interfaz los llama entre cuadros para no congelar la página. Al empezar cada tramo se vuelve a aplicar el mismo sorteo y se instala el generador de la corrida; al terminar el tramo (aunque haya un error) se restaura el catálogo probable (`applyProbable`), se quita el generador (`setRandom(null)`) y se reponen los enganches de la interfaz;
- al final el estado vuelve a modo edición (`resetState`) con el setup intacto;
- sin sorteo, cada corrida es idéntica a una corrida normal con la misma semilla.

De cada corrida se guarda un resumen (`summarizeRun`) y `aggregate` arma la distribución: probabilidad de que cada objetivo sobreviva o siga operativo, de cumplir cada meta y de perder cada unidad (con intervalo de confianza del 95% de Wilson), media y percentiles 10/50/90 de interceptaciones, impactos, daño y costos, y un histograma del porcentaje interceptado. Pruebas en `tests/montecarlo.test.js`.
