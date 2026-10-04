# Cómo contribuir

¡Gracias! Este proyecto quiere ser realista **y** fácil de mantener. Estas reglas existen para no romper ninguna de las dos cosas.

## Puesta en marcha

```bash
npm install
npm run dev     # http://localhost:8000, recarga al guardar
```

Editá siempre en `src/`. **No edites `index.html` a mano**: se genera con `npm run build`.

## Antes de subir un cambio

```bash
npm test          # todas las pruebas
npm run build     # regenera index.html
npm run docs      # regenera docs/CATALOGO.md (si tocaste datos)
npm run typecheck # revisa los tipos de util, data, physics y sim (archivos con // @ts-check)
```

Los archivos de `util/`, `data/`, `physics/` y `sim/` empiezan con `// @ts-check`: documentá los tipos nuevos en JSDoc (`src/types.js`) y mantené `npm run typecheck` sin errores. O todo junto: `npm run check`. La CI de GitHub hace lo mismo y además verifica que `index.html` y `docs/CATALOGO.md` estén al día.

Para verificar los campos numéricos y los controles de Monte Carlo en el navegador, dejá `npm run dev` en marcha y ejecutá `node tests/ui.browser.mjs` con Playwright y Chromium disponibles. Si están fuera del proyecto, indicá `PLAYWRIGHT_MODULE=/ruta/a/playwright/index.mjs` y `CHROMIUM_PATH=/ruta/a/chromium`; `TEST_URL` permite usar otro puerto. Esta prueba es adicional a `npm test` y bloquea pedidos externos de tipografías.

## Las pruebas "golden"

`tests/golden.json` guarda el resultado de 8 corridas completas con semilla fija (una o más por escenario jugable). Si tu cambio toca la física o los datos, **van a fallar, y está bien**: es la forma de ver qué cambió.

1. Mirá la diferencia: ¿el cambio va en la dirección esperada? ¿El tamaño es razonable?
2. Si lo es: `UPDATE_GOLDEN=1 npm test` y commiteá el `golden.json` nuevo.
3. Anotalo en el CHANGELOG con la marca **[sim]**.

Si las golden fallan y tu cambio *no* debería alterar la simulación (interfaz, dibujo, refactor), hay un error: no las regeneres.

## Recetas

### Agregar un arma (amenaza)
1. Fuentes en `src/data/sources.js`.
2. Entrada en `src/data/threats.js` (copiá una del mismo perfil; los campos están en `src/types.js`).
3. Rangos en `src/data/uncertainty.js` → `UNC.thr`: al menos `v`, `rcs`, `rcsVHF`, `cep`, `cost`, `info.rangeKm` e `info.warheadKg` (la ojiva define el daño).
4. Opcional: tasas observadas en `src/data/observed.js`.
5. `npm test && npm run docs && npm run build`.

### Agregar una defensa o un sensor
Igual que un arma, en `defenses.js` y `UNC.def`. La Pk por clase debe estar justificada: idealmente con un caso en `calibration-cases.js` (geometría) corrido con `npm run calibrar -- --write`, que regenera `calibration.js`.

### Agregar un escenario
Agregá una entrada en `src/data/scenarios.js`. Todo es declarativo: objetivos, defensas, salvas, jammers, reglas y metas, documentado en el encabezado del archivo. La prueba de catálogo verifica que los tipos y nombres existan, que todo esté dentro del mapa, que las metas apunten a objetivos o defensas reales y que el briefing esté completo (hora, descripción, fuerzas, condiciones, reglas, metas principales de los dos bandos, éxito y fracaso).

Antes de darlo por bueno, medilo con el modo Monte Carlo (20–40 corridas; en Node, `npm run mc -- <escenario>`, 40 noches con los valores probables) y registrá condiciones, incertidumbre y resultados. Un escenario de referencia puede ser asimétrico: un resultado extremo motiva revisar los datos, la geometría y los modelos, no una obligación de cambiar las fuerzas. Cuando un cambio de física mueve el resultado de un escenario de referencia, se documenta cuánto se movió y el escenario no se toca para recuperar la tasa anterior. Las variantes didácticas o de dificultad son escenarios aparte, con sus cambios explícitos. Después sumale un caso a `tests/golden.test.js` y corré `UPDATE_GOLDEN=1 npm test` (verificá que las golden viejas no cambien).

### Agregar un relieve real
`scripts/gen-terrain.mjs` convierte un tile SRTM de 1° × 1° en un relieve del juego (con máscara de ríos y lagos). Agregá una entrada en `MAPS` (tile y lugares con latitud y longitud), corré `node scripts/gen-terrain.mjs <clave>` (o pasale un `.hgt` local) y sumá el módulo a `src/data/terrain/index.js`. Ojo: cada relieve agrega ~0,5 MB a `index.html`. Monterey y Gotemburgo vienen de la versión original; `node scripts/verificar-relieves.mjs` los compara contra sus fuentes (docs/DATOS-Y-FUENTES.md §6).

### Agregar un concepto a la Academia
Agregá un objeto en `src/edu/concepts.js` con `body()` (la explicación) y `engine()` (cómo lo hace el motor). Usá los datos y funciones reales en lugar de copiar números, así la explicación no queda desactualizada.

### Cambiar la física
1. Leé la sección correspondiente de [docs/FISICA.md](docs/FISICA.md).
2. Cambiá el modelo en `src/physics/` y actualizá FISICA.md.
3. Agregá o ajustá una prueba en `tests/physics.test.js` que verifique la **propiedad** (por ejemplo: "16× RCS → 2× alcance"), no un número mágico.
4. Golden (ver arriba) y CHANGELOG con **[sim]**.

## Estilo

- Textos de la interfaz en español rioplatense (voseo: "tocá", "elegí").
- Comentarios en español, explicando el *por qué*.
- `data/`, `physics/` y `sim/` no tocan el DOM.
- Datos sin fuente: marcalos como estimación ("est" en la nota) con el razonamiento.
