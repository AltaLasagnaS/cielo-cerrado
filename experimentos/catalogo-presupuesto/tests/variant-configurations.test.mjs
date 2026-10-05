import test from 'node:test';
import assert from 'node:assert/strict';
import { VARIANT_RESEARCH } from '../data/variant-configurations.mjs';
import { validateVariantResearch } from '../lib/variant-validation.mjs';

test('las relaciones de variantes tienen fuentes revisadas y referencias al catálogo existente', () => {
  assert.deepEqual(validateVariantResearch(VARIANT_RESEARCH), { ok: true, errors: [] });
  assert.throws(() => { VARIANT_RESEARCH.records[0].missilesPerLauncher.value = 4; }, TypeError);
});

test('no convertir capacidades genéricas de PAC-3/GEM ni inventario de batería en datos de CRI/MSE/GEM-T', () => {
  const patriot = VARIANT_RESEARCH.records.filter(row => row.weaponId.startsWith('patriot-'));
  assert.equal(patriot.length, 3);
  for (const row of patriot) {
    assert.equal(row.missilesPerLauncher.value, null);
    assert.equal(row.launcherModel.value, null);
    assert.equal(row.mixedLoad.value, null);
    assert.equal(row.minimumSoftware.value, null);
  }
  const mse = patriot.find(row => row.weaponId === 'patriot-pac3-mse');
  assert.equal(mse.supportedSoftware.value, 'PDB-7');
  assert.equal(mse.fullCapabilityUpgrade.value.software, 'PDB-8');
  const pt1 = VARIANT_RESEARCH.records.find(row => row.weaponId === 's300p-5v55kd');
  assert.equal(pt1.missilesPerLauncher.value, null);
});

for (const [label, mutate] of [
  ['desconocido vuelto cero', r => { r.records[0].missilesPerLauncher.value = 0; }],
  ['fuente bloqueada', r => { r.records[2].supportedSoftware.sourceIds = ['lm-pac3-blocked']; }],
  ['capacidad fraccionaria', r => { r.records[3].missilesPerLauncher.value = 4.5; }],
  ['confundir munición', r => { r.records[0].weaponId = 'patriot-pac3-mse'; }],
  ['auxiliar sin dependencia', r => { r.records[5].auxiliaryRequires = { status: 'unknown', value: null, sourceIds: [], locator: null }; }],
  ['activación accidental', r => { r.records[3].readiness = 'runtime-ready'; }]
]) test(`investigación rechaza ${label}`, () => {
  const copy = structuredClone(VARIANT_RESEARCH); mutate(copy);
  assert.equal(validateVariantResearch(copy).ok, false);
});
