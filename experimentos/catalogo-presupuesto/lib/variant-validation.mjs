import { CATALOG } from '../data/catalog.mjs';

// Validates provenance and references, not the truth of a source or runtime compatibility.
export function validateVariantResearch(research, catalog = CATALOG) {
  const errors = [];
  if (!Array.isArray(research?.sources) || !Array.isArray(research?.records)) return { ok: false, errors: ['Listas de investigación requeridas'] };
  const sources = new Map(catalog.sources.map(row => [row.id, row]));
  for (const row of research.sources) {
    if (sources.has(row.id)) errors.push(`Fuente duplicada: ${row.id}`);
    sources.set(row.id, row);
  }
  const candidates = new Map(catalog.configurations.map(row => [row.id, row]));
  const seen = new Set();
  for (const row of research.records) {
    if (seen.has(row.candidateId)) errors.push(`Candidato duplicado: ${row.candidateId}`);
    seen.add(row.candidateId);
    if (!candidates.get(row.candidateId)?.weaponIds.includes(row.weaponId)) errors.push(`Munición/candidato no coinciden: ${row.candidateId}`);
    if (row.readiness !== 'research-only') errors.push(`No se permite activar: ${row.candidateId}`);
    for (const key of ['launcherModel', 'launcherDescription', 'missilesPerLauncher', 'auxiliaryLauncher', 'auxiliaryMissilesPerLauncher', 'auxiliaryRequires', 'fireControlModel', 'supportedSoftware', 'fullCapabilityUpgrade', 'prerequisites', 'minimumSoftware', 'mixedLoad', 'operatorAvailability']) {
      const f = row[key];
      if (!f || !Array.isArray(f.sourceIds)) { errors.push(`${row.candidateId}.${key}: dato inválido`); continue; }
      if (f.status === 'unknown') {
        if (f.value !== null || f.sourceIds.length || f.locator !== null) errors.push(`${row.candidateId}.${key}: desconocido debe ser null sin evidencia`);
      } else {
        const role = { 'documented-primary': 'primary', 'documented-secondary': 'secondary' }[f.status];
        if (!role || f.value == null || !f.sourceIds.length || !f.locator) errors.push(`${row.candidateId}.${key}: evidencia incompleta`);
        for (const sid of f.sourceIds) {
          const source = sources.get(sid);
          if (source?.role !== role || source?.access !== 'reviewed') errors.push(`${row.candidateId}.${key}: fuente no revisada o nivel incorrecto`);
        }
        if (['missilesPerLauncher', 'auxiliaryMissilesPerLauncher'].includes(key) && (!Number.isSafeInteger(f.value) || f.value <= 0)) errors.push(`${row.candidateId}.${key}: capacidad entera positiva requerida`);
      }
    }
    if (row.auxiliaryLauncher?.value && !row.auxiliaryRequires?.value) errors.push(`${row.candidateId}: falta dependencia del lanzador auxiliar`);
  }
  return { ok: !errors.length, errors };
}
