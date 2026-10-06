import { CATALOG } from '../data/catalog.mjs';
import { validateCatalog, catalogReadiness } from '../lib/catalog-validation.mjs';
import { GAME_SOURCE_REVIEW } from '../data/game-source-review.mjs';
import { GAME_INDEX_REVIEW } from '../data/game-index-review.mjs';
import { validateGameSources } from '../lib/game-sources-validation.mjs';
import { VARIANT_RESEARCH } from '../data/variant-configurations.mjs';
import { validateVariantResearch } from '../lib/variant-validation.mjs';
import { readFileSync } from 'node:fs';
import { validateDatabaseReview } from '../lib/database-review-validation.mjs';

const result = validateCatalog(CATALOG);
const variants = validateVariantResearch(VARIANT_RESEARCH);
result.errors.push(...variants.errors);
result.ok = result.ok && variants.ok;
if (!result.ok) {
  for (const error of result.errors) console.error(error);
  process.exitCode = 1;
} else {
  const pending = catalogReadiness(CATALOG);
  console.log(`Referencia válida: ${CATALOG.families.length} familias, ${CATALOG.weapons.length} entradas de munición, ${CATALOG.components.length} componentes.`);
  console.log(`${CATALOG.configurations.length} candidatos de configuración; ${pending.filter(row => row.runtimeEnabled).length} habilitados para el simulador.`);
  console.log('Las prestaciones y precios desconocidos permanecen pendientes; no se rellenan con cero.');
  console.log(`${VARIANT_RESEARCH.records.length} fichas de configuración por variante; las combinaciones incompletas permanecen pendientes.`);
}

const games = validateGameSources(GAME_SOURCE_REVIEW, GAME_INDEX_REVIEW);
const database = validateDatabaseReview(JSON.parse(readFileSync(new URL('../data/db3k-versions-review.json', import.meta.url), 'utf8')));
games.errors.push(...database.errors);
games.ok = games.ok && database.ok;
if (!games.ok) {
  for (const error of games.errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`Fuentes de juegos: ${GAME_SOURCE_REVIEW.records.length} fichas revisadas y ${GAME_INDEX_REVIEW.records.length} referencias de índice, separadas del catálogo activo.`);
}
