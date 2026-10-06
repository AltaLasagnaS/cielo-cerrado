import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_SOURCE_REVIEW as descriptions } from '../data/game-source-review.mjs';
import { GAME_INDEX_REVIEW as index } from '../data/game-index-review.mjs';
import { validateGameSources } from '../lib/game-sources-validation.mjs';

const find = key => descriptions.records.find(row => row.id === key);
test('game fact matrix is traceable, immutable and never becomes a live weapon catalog', () => {
  assert.deepEqual(validateGameSources(descriptions, index), { ok: true, errors: [] });
  assert.equal(descriptions.records.length, 13); assert.equal(index.records.filter(row => row.kind === 'sensor').length, 15);
  assert.ok(Object.isFrozen(find('patriot-mse-game').measurements));
  const activated = structuredClone(descriptions); activated.records[0].runtimeEnabled = true;
  assert.equal(validateGameSources(activated, index).ok, false);
});
test('nautical-mile conversion stays separate from speed meaning and unsupported engine parameters', () => {
  assert.ok(Math.abs(find('patriot-mse-game').measurements.rangeKm.value[1] - 120.38) < 1e-9);
  assert.ok(Math.abs(find('patriot-mse-game').measurements.tbmMaxRangeKm.value - 59.264) < 1e-9);
  assert.ok(Math.abs(find('s300-5v55r-game').measurements.rangeKm.value[1] - 75.006) < 1e-9);
  for (const row of descriptions.records) assert.equal(row.model.vInt, null, 'reported speed is not proven mean speed');
});
test('contradictory speed, height, range and identification stay unresolved', () => {
  assert.equal(find('buk-m1-game').measurements.speedMps.value, null);
  assert.equal(find('patriot-mse-game').measurements.altitudeM.value, null);
  assert.equal(find('s300-48n6e2-game').measurements.rangeKm.value, null);
  assert.ok(Object.values(find('buk-2970-unresolved-game').measurements).every(row => row.value === null));
  assert.equal(find('s300-5v55k-game').measurements.reloadSeconds.value, null);
});
test('index load labels are game claims, not launcher compatibility or exact hardware certification', () => {
  const mse = index.records.find(row => row.id === 'cmo-442-launcher-2760');
  assert.equal(mse.reportedLoadCount, 12); assert.equal(mse.realLauncherCapacity, null);
  const fake = structuredClone(index); fake.records[0].realLauncherCapacity = 4;
  assert.equal(validateGameSources(descriptions, fake).ok, false);
  const badUnit = structuredClone(descriptions); badUnit.records[0].measurements.speedMps.unit = 'km/h';
  assert.equal(validateGameSources(badUnit, index).ok, false);
  const emptyModel = structuredClone(descriptions); emptyModel.records[0].model = {};
  assert.equal(validateGameSources(emptyModel, index).ok, false);
  const scalarRange = structuredClone(descriptions); scalarRange.records[0].measurements.rangeKm.value = 160;
  assert.equal(validateGameSources(scalarRange, index).ok, false);
});
