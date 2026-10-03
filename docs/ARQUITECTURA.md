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

## Mapa de archivos

### `src/data/`: datos puros
- `index.js`: punto de entrada único. Al importarse, aplica los valores probables (`applyProbable`).
- `threats.js`, `defenses.js`, `jammers.js`: catálogo.
- `uncertainty.js` (`UNC`): rangos, confianza y razonamiento de cada parámetro.
- `sources.js` (`SRC`), `observed.js` (`OBS`), `calibration.js` (`CAL`).
- `bands.js`: **la única fuente de datos de bandas** (simulación, fichas, Academia).
- `targets.js`: tipos de objetivo y parámetros de daño.
- `scenarios.js`: escenarios declarativos (objetivos, fuerzas, reglas, metas).
- `terrain/`: relieves (metadatos + grilla en base64).

### `src/physics/`: modelos (ver [FISICA.md](FISICA.md))
- `terrain.js`: mapa activo, `elev`, `surf`, `los`, importación SRTM.
- `terrain-analysis.js`: puntos altos, relieve relativo, curvas (solo visual).
- `radar.js`: RCS por banda, alcance, sectores, interferencia, horizonte.
- `kinematics.js`: trayectorias de las amenazas.
- `engagement.js`: pistas, solución de tiro, Pk.
- `coverage.js`: viewshed de cobertura.
- `damage.js`: daño a objetivos.
- `constants.js`: KR (Tierra 4/3), margen de LOS, coeficiente del horizonte.

### `src/sim/`: estado y simulación
- `state.js` (`S`): estado único. `S.setup` es lo que arma el jugador; el resto es la corrida en curso.
- `setup.js`: agregar objetivos, defensas, salvas y jammers; desplegar escenarios.
- `engine.js`: `startSim`, `step(dt)`, `engage`, `impact`.
- `log.js`: registro y eventos de la línea de tiempo.
- `goals.js`, `debrief.js`: evaluación de metas y análisis final.
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

El bucle de la interfaz (`ui/loop.js`) llama a `step(0,25)` las veces necesarias según la velocidad, así que **el resultado no depende de la velocidad** elegida.

## Reproducibilidad y pruebas

- `util/rng.js` centraliza el azar; `seeded(n)` da corridas idénticas.
- `util/ids.js` centraliza los ids. El orden en que se piden importa, porque aparecen en el registro.
- `tests/golden.json` guarda el resultado de 6 corridas con semilla fija. Si cambia la física, estas pruebas fallan **a propósito** (ver [CONTRIBUIR.md](../CONTRIBUIR.md)).

## Build

- `scripts/build.mjs`: esbuild empaqueta `src/main.js` (IIFE, sin minificar) y lo inserta, junto con el CSS, en la plantilla `src/index.html`. El resultado es el `index.html` de la raíz.
- `scripts/dev.mjs`: servidor de desarrollo que sirve `src/` tal cual (los módulos ES funcionan nativos en el navegador) y recarga al guardar.
- `scripts/gen-catalog-doc.mjs`: genera `docs/CATALOGO.md`.
