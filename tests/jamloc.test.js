// Triangulación de interferidores y home-on-jam (physics/jamloc.js, sim/ew.js). Ver docs/FISICA.md §4.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bearingSigma, fixError, MIN_CROSS } from '../src/physics/jamloc.js';
import { S } from '../src/sim/state.js';
import { startSim, step } from '../src/sim/engine.js';
import { addDef, addJam } from '../src/sim/setup.js';
import { setRandom, seeded } from '../src/util/rng.js';
import { useMap, clearSetup } from './helpers.js';

test('marcación: el error angular baja con √(J/N) y tiene piso', () => {
  assert.ok(Math.abs(bearingSigma(1, 1) - 1 / (1.6 * Math.SQRT2)) < 1e-12);
  assert.ok(bearingSigma(1, 100) < bearingSigma(1, 1));
  assert.equal(bearingSigma(1, 1e9), 0.05);
});

test('cruce: el error crece cuando las marcaciones se vuelven paralelas y no hay cruce por debajo de MIN_CROSS', () => {
  const a = { x: 0, y: 0, sigma: 0.5 }, b = { x: 20, y: 0, sigma: 0.5 };
  const ok = fixError(a, b, 10, 10), far = fixError(a, b, 10, 80);
  assert.ok(ok > 0 && ok < far, ok + ' < ' + far);
  assert.equal(fixError(a, { x: 1, y: 0, sigma: 0.5 }, 0.5, 100), Infinity, 'marcaciones a menos de ' + MIN_CROSS + '°');
});

/** Dos NASAMS y un jammer aéreo ruso a ≈22 km: corre t segundos sin amenazas. */
function run(c2, seconds, seed = 1) {
  useMap('monterey', { flat: true }); clearSetup(); S.c2 = c2;
  addDef('nasams', 30, 10, { az: 0 }); addDef('nasams', 50, 10, { az: 0 });
  addJam('soj', 40, 30, { alt: 8000 });
  setRandom(seeded(seed));
  try { startSim(); for (let k = 0; k < seconds * 4; k++) step(0.25); } finally { setRandom(null); }
  return S;
}

test('con la red, dos radares ubican al jammer y un NASAMS le tira home-on-jam', () => {
  const S1 = run('coordinada', 120);
  const j = S1.jamsLive[0];
  assert.ok(j.fix && j.fix.err < 5, 'ubicado: ' + JSON.stringify(j.fix));
  assert.ok(S1.log.some(l => /home-on-jam contra/.test(l.msg)), 'dispara');
  assert.ok(S1.units.reduce((s, u) => s + u.magLeft, 0) < S1.units.reduce((s, u) => s + u.mag, 0), 'gasta misiles');
});

test('sin red no hay triangulación ni home-on-jam', () => {
  const S1 = run('desconectada', 120);
  assert.equal(S1.jamsLive[0].fix, undefined);
  assert.ok(!S1.log.some(l => /home-on-jam/.test(l.msg)));
});

test('un jammer derribado deja de interferir', () => {
  let dead = false;
  for (let seed = 1; seed <= 10 && !dead; seed++) dead = run('coordinada', 300, seed).jamsLive[0].dead === true;
  assert.ok(dead, 'en 10 corridas de 5 min, alguna lo derriba');
});
