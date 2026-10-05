import { CATALOG } from '../data/catalog.mjs';
import { validateCatalog, catalogReadiness } from '../lib/catalog-validation.mjs';
import { VARIANT_RESEARCH } from '../data/variant-configurations.mjs';
import { validateVariantResearch } from '../lib/variant-validation.mjs';

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
