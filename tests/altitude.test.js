// Atmósfera estándar y maniobra según la altura (physics/atmosphere.js, physics/engagement.js#altitudePk).
// Ver docs/FISICA.md §7.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isaSigma } from '../src/physics/atmosphere.js';
import { altitudePk } from '../src/physics/engagement.js';
import { DEFENSES } from '../src/data/index.js';

test('ISA: densidad relativa contra la tabla de la US Standard Atmosphere 1976 (±0,5%)', () => {
  // ρ (kg/m³) de la tabla / 1,225
  for (const [h, rho] of [[0, 1.225], [5000, 0.73612], [11000, 0.36392], [15000, 0.19367], [20000, 0.088035], [25000, 0.039466], [30000, 0.018012]]) {
    const want = rho / 1.225, got = isaSigma(h);
    assert.ok(Math.abs(got / want - 1) < 0.005, `${h} m: ${got} vs ${want}`);
  }
});

test('maniobra en altura: abajo de hFull no cambia nada; arriba baja, y más contra un blanco que maniobra', () => {
  const sm = DEFENSES.s300.sam;
  assert.equal(altitudePk(sm, 0.5, false, 3000, true), 1);
  assert.equal(altitudePk(sm, 0.5, false, sm.hFull, true), 1);
  const hi = altitudePk(sm, 0.5, false, 25000, true), hiStraight = altitudePk(sm, 0.5, false, 25000, false);
  assert.ok(hi < 0.5, String(hi));
  assert.ok(hiStraight > hi && hiStraight <= 1);
  assert.ok(altitudePk(sm, 0.5, false, 20000, true) > hi, 'más arriba, menos');
});

test('maniobra en altura: PAC-3 y Aster (empuje lateral directo), cañones y misiles sin hFull no cambian', () => {
  assert.equal(altitudePk(DEFENSES.patriot.sam, 0.5, false, 30000, true), 1);
  assert.equal(altitudePk(DEFENSES.sampt.sam, 0.5, false, 25000, true), 1);
  assert.equal(altitudePk(DEFENSES.gepard.sam, 0.5, false, 2500, true), 1);
});
