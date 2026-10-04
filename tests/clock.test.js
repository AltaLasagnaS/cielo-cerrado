import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSimClock, SIM_STEP } from '../src/sim/clock.js';
import { S } from '../src/sim/state.js';
import { SCENARIOS } from '../src/data/index.js';
import { applyScenario } from '../src/sim/setup.js';
import { startSim, step } from '../src/sim/engine.js';
import { summarizeRun } from '../src/sim/montecarlo.js';
import { seeded, setRandom } from '../src/util/rng.js';
import { useMap, clearSetup } from './helpers.js';

test('el reloj conserva fracciones y descarta tiempo pendiente al reiniciar o terminar', () => {
  const clock = createSimClock(), steps = [];
  const tick = dt => { steps.push(dt); };
  clock.advance(0.1, tick); clock.advance(0.1, tick);
  assert.equal(steps.length, 0);
  clock.advance(0.05, tick);
  assert.deepEqual(steps, [SIM_STEP]);
  clock.advance(0.2, tick); clock.reset(); clock.advance(0.1, tick);
  assert.equal(steps.length, 1, 'una corrida nueva no hereda fracciones');
  clock.advance(1, dt => { steps.push(dt); return false; });
  assert.equal(steps.length, 2, 'el fin de corrida corta el avance del cuadro');
  clock.advance(0.1, tick);
  assert.equal(steps.length, 2, 'el tiempo sobrante de una corrida terminada se descarta');
});

test('una corrida completa da el mismo resultado con cuadros y velocidades diferentes', () => {
  const run = frames => {
    useMap('monterey'); clearSetup(); applyScenario(SCENARIOS.mb_noche);
    const clock = createSimClock(); setRandom(seeded(1));
    try {
      startSim(); let ended = false, n = 0;
      while (!ended && n < 100000) {
        clock.advance(frames[n++ % frames.length], dt => {
          step(dt);
          ended = !S.pending.length && S.threats.every(t => !t.alive) && S.ints.every(i => i.done);
          return !ended;
        });
      }
      assert.ok(ended, 'la corrida tiene que terminar');
      return summarizeRun(S, 1);
    } finally { setRandom(null); }
  };
  const reference = run([0.25]);
  assert.deepEqual(run([0.1]), reference);
  assert.deepEqual(run([0.03, 0.8, 0.017, 1.5]), reference);
});
