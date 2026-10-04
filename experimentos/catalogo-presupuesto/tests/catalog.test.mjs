import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG } from '../data/catalog.mjs';
import { validateCatalog, catalogReadiness, profileBranch } from '../lib/catalog-validation.mjs';

test('el catálogo original tiene referencias y evidencia coherentes', () => {
  assert.deepEqual(validateCatalog(CATALOG), { ok: true, errors: [] });
  assert.equal(CATALOG.weapons.length, 10);
  assert.equal(CATALOG.configurations.length, 10);
});

test('datos de referencia inmutables, sin activar prestaciones desconocidas', () => {
  assert.throws(() => { CATALOG.weapons[0].name = 'otro'; }, TypeError);
  const report = catalogReadiness(CATALOG);
  assert.ok(report.every(row => !row.runtimeEnabled && row.missingParameters.length === 7));
});

for (const [name, mutate] of [
  ['IDs repetidos', c => { c.weapons[1].id = c.weapons[0].id; }],
  ['fuente ausente', c => { c.weapons[0].identity.sourceIds = ['missing']; }],
  ['fuente bloqueada', c => { c.weapons[0].identity.sourceIds = ['lm-pac3-blocked']; }],
  ['índice tratado como fuente primaria', c => { c.weapons[0].identity.sourceIds = ['cmo-index-442']; }],
  ['cambiar unidad', c => { c.weapons[0].model.maxR.unit = 'm'; }],
  ['NaN', c => { c.weapons[0].model.maxR = { unit: 'km', status: 'legacy-estimate', value: NaN, sourceIds: ['local-legacy'] }; }],
  ['desconocido convertido a cero', c => { c.weapons[0].model.maxR.value = 0; }],
  ['configuración con misil ajeno', c => { c.configurations[0].weaponIds = ['nasams-amraam-er']; }],
  ['referencia duplicada', c => { c.configurations[0].componentIds.push(c.configurations[0].componentIds[0]); }],
  ['habilitación accidental', c => { c.configurations[0].readiness = 'runtime-ready'; }]
]) test(`rechaza ${name}`, () => {
  const copy = structuredClone(CATALOG); mutate(copy);
  assert.equal(validateCatalog(copy).ok, false);
});

test('entradas malformadas informan errores, no crean datos', () => {
  for (const input of [null, {}, { format: CATALOG.format, version: 1 }]) assert.equal(validateCatalog(input).ok, false);
  const copy = structuredClone(CATALOG); copy.weapons[0] = null;
  assert.equal(validateCatalog(copy).ok, false);
});

test('contrato de perfil: datos ficticios sólo para comprobar unidades y ramas', () => {
  assert.equal(profileBranch({ maxR: 10, vInt: 100 }).mode, 'legacy-constant');
  assert.equal(profileBranch({ maxR: 10, vInt: 100, vmax: 200, tb: 10 }).mode, 'calibrated-deceleration');
  assert.equal(profileBranch({ maxR: 10, vInt: 100, vmax: 200, tb: 100 }).mode, 'unbraked-fallback');
  assert.equal(profileBranch({ maxR: 10, vInt: 100, vmax: 125, tb: 40 }).mode, 'unbraked-fallback');
  // Equality bound: 125 * (100 - 40/2) === 10000, strict > is required.
});

test('rechaza perfiles incompletos, no finitos y velocidades inválidas', () => {
  for (const input of [
    {}, { maxR: -1, vInt: 100 }, { maxR: Infinity, vInt: 100 },
    { maxR: 10, vInt: 100, vmax: 200 }, { maxR: 10, vInt: 100, tb: 10 },
    { maxR: 10, vInt: 100, vmax: 100, tb: 10 },
    { maxR: 10, vInt: 100, vmax: 200, tb: 0 },
    { maxR: Number.MAX_VALUE, vInt: 1, vmax: 2, tb: 1 }
  ]) assert.equal(profileBranch(input).valid, false);
});

test('detecta el límite inferior de distancia antes de afirmar calibración', () => {
  // Generic numerical fixture, not a real munition: distance at tb is 2000 m,
  // greater than requested 1000 m. Deceleration after tb cannot undo distance.
  assert.equal(profileBranch({ maxR: 1, vInt: 10, vmax: 200, tb: 20 }).mode, 'requires-review');
  assert.equal(profileBranch({ maxR: 2, vInt: 20, vmax: 200, tb: 20 }).mode, 'requires-review');
});
