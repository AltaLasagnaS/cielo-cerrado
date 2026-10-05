import { CATALOG } from '../data/catalog.mjs';
import { validateCatalog, catalogReadiness } from '../lib/catalog-validation.mjs';
import { GAME_SOURCE_REVIEW } from '../data/game-source-review.mjs';
import { GAME_INDEX_REVIEW } from '../data/game-index-review.mjs';
import { validateGameSources } from '../lib/game-sources-validation.mjs';

const result = validateCatalog(CATALOG);
if (!result.ok) {
  for (const error of result.errors) console.error(error);
  process.exitCode = 1;
} else {
  const pending = catalogReadiness(CATALOG);
  console.log(`Referencia válida: ${CATALOG.families.length} familias, ${CATALOG.weapons.length} entradas de munición, ${CATALOG.components.length} componentes.`);
  console.log(`${CATALOG.configurations.length} candidatos de configuración; ${pending.filter(row => row.runtimeEnabled).length} habilitados para el simulador.`);
  console.log('Las prestaciones y precios desconocidos permanecen pendientes; no se rellenan con cero.');
}

const games = validateGameSources(GAME_SOURCE_REVIEW, GAME_INDEX_REVIEW);
if (!games.ok) {
  for (const error of games.errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`Fuentes de juegos: ${GAME_SOURCE_REVIEW.records.length} fichas revisadas y ${GAME_INDEX_REVIEW.records.length} referencias de índice, separadas del catálogo activo.`);
}
