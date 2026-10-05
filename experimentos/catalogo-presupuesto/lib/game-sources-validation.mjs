import { id } from './common.mjs';

const units = { speedMps: 'm/s', rangeKm: 'km', tbmMaxRangeKm: 'km', altitudeM: 'm', reloadSeconds: 's' };
const rangeFields = new Set(['rangeKm', 'altitudeM', 'reloadSeconds']);
const modelFields = ['maxR', 'maxRtbm', 'minR', 'altMin', 'altMax', 'vInt', 'vmax', 'tb', 'pk', 'price'];
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

/** Structural evidence check. It NEVER certifies a game source as reality. */
export function validateGameSources(descriptions, index) {
  const errors = [], fail = message => errors.push(message), ids = new Set();
  if (descriptions?.format !== 'cielo-cerrado/game-source-review' || descriptions.version !== 1
      || index?.format !== 'cielo-cerrado/game-index-review' || index.version !== 1) return { ok: false, errors: ['Formato de revisión inválido'] };
  if (!Array.isArray(descriptions.records) || !Array.isArray(index.records)) return { ok: false, errors: ['Registros requeridos'] };
  if (descriptions.source?.role !== 'game-compilation' || descriptions.source.databaseBuild !== null
      || !hash(descriptions.source.sha256)) fail('La compilación no acredita versión ni es fuente primaria');
  if (index.source?.role !== 'game-index' || !hash(index.source.sha256)) fail('Índice sin procedencia válida');
  const checkIdentity = row => {
    if (!row || typeof row !== 'object') { fail('Registro inválido'); return false; }
    try { id(row.id); } catch { fail('Identificador inválido'); }
    if (ids.has(row.id)) fail('Registro duplicado'); ids.add(row.id);
    if (typeof row.name !== 'string' || !row.name.trim()) fail('Nombre requerido');
    if (row.runtimeEnabled !== false) fail('No habilitar entradas por pasar esta validación');
    return true;
  };
  for (const row of descriptions.records) {
    if (!checkIdentity(row)) continue;
    if (row.sourceId !== descriptions.source.id || !hash(row.sha256)
        || !/^Weapon_\d+\.txt$/i.test(row.file ?? '') || row.databaseBuild !== null) fail(`${row.id}: origen/versionado inválido`);
    if (!Number.isSafeInteger(row.gameComponentId) || row.gameComponentId < 1) fail(`${row.id}: ID de ficha inválido`);
    if (!Array.isArray(row.claims) || !Array.isArray(row.issues)) fail(`${row.id}: falta trazabilidad/limitaciones`);
    for (const [field, unit] of Object.entries(units)) {
      const fact = row.measurements?.[field];
      if (!fact || fact.unit !== unit) { fail(`${row.id}.${field}: unidad inválida`); continue; }
      if (fact.value === null) {
        if (fact.confidence !== 'unknown' || fact.locator !== null) fail(`${row.id}.${field}: desconocido mal representado`);
        continue;
      }
      const values = Array.isArray(fact.value) ? fact.value : [fact.value];
      if (Array.isArray(fact.value) !== rangeFields.has(field)) fail(`${row.id}.${field}: forma de cantidad inválida`);
      if (values.some(value => !Number.isFinite(value) || value < 0)
          || (Array.isArray(fact.value) && (values.length !== 2 || values[0] > values[1]))) fail(`${row.id}.${field}: número/rango inválido`);
      if (fact.confidence !== 'medium-low' || typeof fact.locator !== 'string' || !fact.locator) fail(`${row.id}.${field}: evidencia de juego requerida`);
    }
    if (!row.model || Object.keys(row.model).length !== modelFields.length
        || modelFields.some(field => row.model[field] !== null)) fail(`${row.id}: no convertir automáticamente reporte en parámetros del motor`);
  }
  for (const row of index.records) {
    if (!checkIdentity(row)) continue;
    if (row.sourceId !== index.source.id || row.database !== 'DB3K' || row.databaseBuild !== 442
        || !['Mounts', 'Sensors', 'Weapons'].includes(row.section) || row.confidence !== 'low') fail(`${row.id}: namespace/evidencia inválidos`);
    if (!Number.isSafeInteger(row.componentId) || row.componentId < 1 || !Number.isSafeInteger(row.line) || row.line < 1) fail(`${row.id}: localizador inválido`);
    if (row.reportedLoadCount !== null && (!Number.isSafeInteger(row.reportedLoadCount) || row.reportedLoadCount < 1)) fail(`${row.id}: cantidad de etiqueta inválida`);
    if (row.realLauncherCapacity !== null || row.physicalParameters !== null) fail(`${row.id}: índice no certifica capacidad física`);
  }
  return { ok: !errors.length, errors };
}
