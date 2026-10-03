# Cielo Cerrado — guía para asistentes de código

Simulador táctico de defensa aérea para el navegador (JS vanilla, módulos ES, sin frameworks). El usuario no programa: explicá en español rioplatense, simple, y verificá todo lo que afirmes.

## Comandos
- `npm test`: pruebas en Node (física, catálogo, daño, golden). Correrlas siempre.
- `npm run build`: regenera `index.html` (raíz) desde `src/`. **Nunca editar `index.html` a mano.**
- `npm run docs`: regenera `docs/CATALOGO.md` desde `src/data/`.
- `npm run dev`: servidor en :8000 con recarga.
- `npm run check`: todo, más la verificación de que los archivos generados estén al día (es lo que corre la CI).

## Reglas de arquitectura
- Capas: `util → data → physics → sim → render → ui`. Solo se importa hacia la izquierda.
- `data/`, `physics/` y `sim/` no tocan el DOM. La simulación avisa a la interfaz por `sim/hooks.js`.
- Todo el azar pasa por `util/rng.js#rnd()` y los ids por `util/ids.js`. El orden de las llamadas importa para la reproducibilidad.
- `BANDS` (`data/bands.js`) es la única fuente de bandas. Los parámetros con incertidumbre viven en `UNC` (`data/uncertainty.js`) con fuentes en `SRC`.
- Si un cambio altera los resultados, las golden fallan a propósito: revisar, `UPDATE_GOLDEN=1 npm test`, y CHANGELOG con **[sim]**. Si el cambio no debería alterar la simulación y las golden fallan, hay un bug.

## Documentación
README · docs/ARQUITECTURA.md · docs/FISICA.md (el código remite a sus §) · docs/DATOS-Y-FUENTES.md · CONTRIBUIR.md · ROADMAP.md · CHANGELOG.md (Keep a Changelog).

## Verificación visual
Playwright está disponible globalmente (`/opt/node-tools/node_modules/playwright`). Para pruebas en el navegador: abrir `file://.../index.html`, bloquear los pedidos externos (tipografías), usar `window.__S` (estado) y `window.__dbg` (startSim, step, loadScenario, computeCov, openDebrief…). Revisar que la consola no tenga errores.
