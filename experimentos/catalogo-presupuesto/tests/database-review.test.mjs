import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateDatabaseReview } from '../lib/database-review-validation.mjs';

const review = JSON.parse(readFileSync(new URL('../data/db3k-versions-review.json', import.meta.url), 'utf8'));
const weapon = (data, build, id) => data.builds.find(b => b.buildLabel === build).records.find(r => r.table === 'DataWeapon' && r.componentId === id);

test('database review preserves a missing column separately from a game default zero', () => {
  assert.deepEqual(validateDatabaseReview(review), { ok: true, errors: [] });
  assert.equal(weapon(review, 496, 3207).rawFields.BurnoutTime, null);
  assert.ok(weapon(review, 496, 3207).missingColumns.includes('BurnoutTime'));
  assert.equal(weapon(review, 515, 3207).rawFields.BurnoutTime, 0);
  const fake = structuredClone(review); weapon(fake, 496, 3207).rawFields.BurnoutTime = 8;
  assert.equal(validateDatabaseReview(fake).ok, false);
});
test('a seeker beam width cannot supply an undocumented gimbal angle', () => {
  assert.equal(weapon(review, 515, 3207).seekerSensors[0].RadarHorizontalBeamwidth, 1);
  assert.equal(weapon(review, 515, 3207).seekerGimbalDegrees, null);
  const fake = structuredClone(review); weapon(fake, 515, 3207).seekerGimbalDegrees = 1;
  assert.equal(validateDatabaseReview(fake).ok, false);
});
test('game mixed load preserves explicit records and cannot certify a physical launcher', () => {
  const load = review.builds.find(b => b.buildLabel === 515).records.find(r => r.table === 'DataMount' && r.componentId === 2761);
  assert.deepEqual(load.weaponRecords.map(r => [r.weaponId, r.DefaultLoad]), [[3207, 6], [1150, 8]]);
  assert.equal(load.realLauncherCompatibility, null);
  const fake = structuredClone(review); fake.builds[0].records[0].runtimeEnabled = true;
  assert.equal(validateDatabaseReview(fake).ok, false);
});
