import { PARAMETER_UNITS } from '../data/catalog.mjs';
import { id } from './common.mjs';

const STATUSES = new Set(['unknown', 'documented-primary', 'documented-secondary', 'indexed', 'legacy-estimate']);
const ROLES = { 'documented-primary': 'primary', 'documented-secondary': 'secondary', indexed: 'index', 'legacy-estimate': 'legacy' };
const TABLES = ['sources', 'families', 'weapons', 'components', 'configurations', 'legacyMappings'];

/** Validates references/evidence, NOT certification of real weapon capabilities. */
export function validateCatalog(catalog) {
  const errors = [];
  const fail = message => errors.push(message);
  if (!catalog || catalog.format !== 'cielo-cerrado/reference-catalog' || catalog.version !== 1) {
    return { ok: false, errors: ['Formato o versión de catálogo inválidos'] };
  }
  for (const table of TABLES) {
    if (!Array.isArray(catalog[table])) fail(`${table}: lista requerida`);
  }
  if (errors.length) return { ok: false, errors };
  const maps = {};
  const allIds = new Set();
  for (const table of TABLES.filter(table => table !== 'legacyMappings')) {
    maps[table] = new Map();
    for (const row of catalog[table]) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        fail(`${table}: registro inválido`); continue;
      }
      try { id(row.id); } catch { fail(`${table}: id inválido`); }
      if (allIds.has(row.id)) fail(`ID duplicado: ${row.id}`);
      allIds.add(row.id); maps[table].set(row.id, row);
    }
  }
  for (const source of maps.sources.values()) {
    if (!['primary', 'secondary', 'index', 'legacy'].includes(source.role)) fail(`${source.id}: rol inválido`);
    if (!['reviewed', 'supplied', 'local', 'blocked'].includes(source.access)) fail(`${source.id}: acceso inválido`);
    if (typeof source.scope !== 'string' || !source.scope.trim()) fail(`${source.id}: falta alcance de fuente`);
    if (source.url !== null && (typeof source.url !== 'string' || !source.url.startsWith('https://'))) fail(`${source.id}: URL inválida`);
  }
  const evidence = (value, where) => {
    if (!value || !STATUSES.has(value.status) || !Array.isArray(value.sourceIds)) {
      fail(`${where}: evidencia inválida`); return;
    }
    if (value.status === 'unknown') {
      if (value.value !== null || value.sourceIds.length) fail(`${where}: desconocido debe ser null sin fuentes`);
      return;
    }
    if (value.value === null || value.value === undefined || !value.sourceIds.length) fail(`${where}: falta valor o fuente`);
    for (const sourceId of value.sourceIds) {
      const source = maps.sources.get(sourceId);
      if (!source) { fail(`${where}: fuente inexistente ${sourceId}`); continue; }
      if (source.role !== ROLES[value.status]) fail(`${where}: nivel de evidencia no coincide con fuente`);
      if (source.access === 'blocked') fail(`${where}: fuente bloqueada no acredita afirmaciones`);
      if (value.status.startsWith('documented-') && source.access !== 'reviewed') fail(`${where}: fuente no revisada`);
    }
  };
  const family = row => {
    if (!maps.families.has(row.familyId)) fail(`${row.id}: familia inexistente`);
  };
  for (const row of maps.families.values()) evidence(row.identity, row.id);
  for (const row of maps.components.values()) {
    family(row); evidence(row.identity, row.id); evidence(row.physicalCapacity, `${row.id}.capacidad`);
    if (!['launcher', 'sensor', 'control', 'control-sensor'].includes(row.kind)) fail(`${row.id}: tipo de componente inválido`);
  }
  for (const row of maps.weapons.values()) {
    family(row); evidence(row.identity, row.id); evidence(row.guidance, `${row.id}.guidance`); evidence(row.price, `${row.id}.price`);
    if (row.readiness !== 'research-only') fail(`${row.id}: no se autoriza activar el borrador`);
    for (const [key, unit] of Object.entries(PARAMETER_UNITS)) {
      const parameter = row.model?.[key];
      if (!parameter || parameter.unit !== unit) fail(`${row.id}.${key}: unidad incorrecta`);
      evidence(parameter, `${row.id}.${key}`);
      if (parameter?.value !== null && (!Number.isFinite(parameter?.value) || parameter.value < 0)) fail(`${row.id}.${key}: valor numérico inválido`);
    }
  }
  for (const row of maps.configurations.values()) {
    family(row);
    if (row.readiness !== 'research-only') fail(`${row.id}: configuración todavía no habilitable`);
    for (const [key, target] of [['weaponIds', 'weapons'], ['componentIds', 'components']]) {
      if (!Array.isArray(row[key]) || !row[key].length) { fail(`${row.id}.${key}: lista vacía o inválida`); continue; }
      if (new Set(row[key]).size !== row[key].length) fail(`${row.id}.${key}: referencia duplicada`);
      for (const reference of row[key]) {
        const item = maps[target].get(reference);
        if (!item) fail(`${row.id}: referencia inexistente ${reference}`);
        else if (item.familyId !== row.familyId) fail(`${row.id}: mezcla de familias no documentada`);
      }
    }
    if (!['family', 'indexed-pairing', 'exact-configuration'].includes(row.relation?.scope)) fail(`${row.id}: alcance de relación inválido`);
    evidence(row.relation?.evidence, `${row.id}.relation`);
    for (const key of ['operatorAvailability', 'nativeDatalink', 'remoteCueing', 'remoteLaunch', 'remoteGuidance']) evidence(row[key], `${row.id}.${key}`);
  }
  const legacyIds = new Set();
  for (const mapping of catalog.legacyMappings) {
    if (!mapping || typeof mapping !== 'object') { fail('Mapeo legado inválido'); continue; }
    if (legacyIds.has(mapping.legacyId)) fail('Mapeo legado duplicado');
    legacyIds.add(mapping.legacyId);
    if (!['name-only', 'ambiguous'].includes(mapping.status)) fail('Estado de mapeo inválido');
    if (!Array.isArray(mapping.candidates) || !mapping.candidates.length) { fail('Mapeo sin candidatos'); continue; }
    for (const candidate of mapping.candidates) if (!maps.weapons.has(candidate)) fail('Mapeo a munición inexistente');
  }
  return { ok: !errors.length, errors };
}

/** Interface check only. Does not solve flight, change physics, or sample RNG. */
export function profileBranch({ maxR, vInt, vmax, tb } = {}) {
  if (!(Number.isFinite(maxR) && maxR > 0 && Number.isFinite(vInt) && vInt > 0)) {
    return { valid: false, mode: 'invalid', reason: 'maxR y vInt deben ser positivos y finitos' };
  }
  const peakPresent = vmax !== undefined && vmax !== null;
  const timePresent = tb !== undefined && tb !== null;
  if (peakPresent !== timePresent) return { valid: false, mode: 'invalid', reason: 'vmax y tb deben aparecer juntos' };
  if (!peakPresent) return { valid: true, mode: 'legacy-constant' };
  if (!(Number.isFinite(vmax) && vmax > vInt && Number.isFinite(tb) && tb > 0)) {
    return { valid: false, mode: 'invalid', reason: 'vmax > vInt y tb > 0 son necesarios en este contrato' };
  }
  const distanceM = maxR * 1000;
  const timeS = distanceM / vInt;
  const boundM = vmax * (timeS - tb / 2);
  const motorDistanceM = vmax * (tb / 2);
  if (![distanceM, timeS, boundM, motorDistanceM].every(Number.isFinite)) return { valid: false, mode: 'invalid', reason: 'Desbordamiento numérico' };
  if (timeS > tb && distanceM <= motorDistanceM) {
    return { valid: true, mode: 'requires-review', warning: 'No existe frenado positivo que conserve T: ya se recorrió R durante aceleración' };
  }
  return timeS > tb && boundM > distanceM
    ? { valid: true, mode: 'calibrated-deceleration' }
    : { valid: true, mode: 'unbraked-fallback', warning: 'No conserva necesariamente el tiempo vInt de referencia' };
}

export function catalogReadiness(catalog) {
  const result = validateCatalog(catalog);
  if (!result.ok) throw new Error(result.errors.join('\n'));
  const required = ['maxR', 'maxRtbm', 'minR', 'altMin', 'altMax', 'vInt', 'vmaxT'];
  return catalog.weapons.map(weapon => ({
    id: weapon.id, runtimeEnabled: false,
    missingParameters: required.filter(key => weapon.model[key].status === 'unknown'),
    missingGuidance: weapon.guidance.status === 'unknown',
    note: 'Validar estructura no certifica prestaciones ni autoriza integración.'
  }));
}
