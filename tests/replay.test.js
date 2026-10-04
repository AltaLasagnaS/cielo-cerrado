// Repetición de la corrida (sim/replay.js): el cuadro reconstruido en un instante T tiene que coincidir
// con el estado real que tenía la simulación en ese mismo instante.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS } from '../src/data/index.js';
import { setRandom, seeded } from '../src/util/rng.js';
import { S } from '../src/sim/state.js';
import { startSim, step } from '../src/sim/engine.js';
import { applyScenario } from '../src/sim/setup.js';
import { frameAt, canReplay } from '../src/sim/replay.js';
import { useMap, clearSetup } from './helpers.js';

/** Corre Monterey noche con semilla 7 y saca fotos del estado real en los instantes pedidos. */
function runWithSnapshots(times) {
  const sc = SCENARIOS.mb_noche; useMap(sc.map); clearSetup(); applyScenario(sc);
  const snaps = new Map(); const want = [...times].sort((a, b) => a - b);
  setRandom(seeded(7));
  try {
    startSim();
    for (let n = 0; n < 40000; n++) {
      step(0.25);
      while (want.length && S.t >= want[0]) {
        const T = want.shift();
        snaps.set(T, {
          threats: new Map(S.threats.filter(th => th.alive && th.p).map(th => [th.id, { x: th.p.x, y: th.p.y }])),
          ints: S.ints.filter(it => !it.done && it.tL <= T).length,
          units: new Map(S.units.map(u => [u.id, [u.alive, u.magLeft, u.dmgRadar, u.dmgLauncher]])),
          objs: new Map(S.objs.map(g => [g.id, g.hp])),
          impacts: S.impacts.length, log: S.log.length
        });
      }
      if (!S.pending.length && S.threats.every(t => !t.alive) && S.ints.every(i => i.done)) break;
    }
  } finally { setRandom(null); }
  return snaps;
}

test('replay: el cuadro reconstruido coincide con el estado real en cada instante', () => {
  const times = [300, 900, 1450, 1500, 1510, 1525];
  const snaps = runWithSnapshots(times);
  assert.ok(canReplay());
  for (const T of times) {
    const real = snaps.get(T); assert.ok(real, `foto en ${T}`);
    const f = frameAt(T);
    assert.deepEqual(new Set(f.threats.map(th => th.id)), new Set(real.threats.keys()), `amenazas en vuelo a T=${T}`);
    for (const th of f.threats) {
      const r = real.threats.get(th.id);
      assert.ok(Math.hypot(th.p.x - r.x, th.p.y - r.y) < 1e-9, `posición de #${th.id} a T=${T}`);
    }
    assert.equal(f.ints.length, real.ints, `interceptores en vuelo a T=${T}`);
    for (const u of f.units) assert.deepEqual([u.alive, u.magLeft, u.dmgRadar, u.dmgLauncher], real.units.get(u.id), `${u.name} a T=${T}`);
    for (const g of f.objs) assert.equal(g.hp, real.objs.get(g.id), `${g.name} a T=${T}`);
    assert.equal(f.impacts.length, real.impacts, `impactos a T=${T}`);
    assert.equal(f.log.length, real.log, `registro a T=${T}`);
  }
});

test('replay: al principio todo intacto y al final igual al estado final', () => {
  runWithSnapshots([]);
  const f0 = frameAt(0);
  assert.equal(f0.threats.length, 0); assert.equal(f0.impacts.length, 0);
  assert.ok(f0.units.every(u => u.alive && u.magLeft === u.mag));
  const fe = frameAt(S.t);
  assert.equal(fe.threats.length, 0, 'al final no queda nada en vuelo');
  assert.equal(fe.impacts.length, S.impacts.length);
  for (const u of fe.units) { const v = S.units.find(w => w.id === u.id); assert.deepEqual([u.alive, u.magLeft], [v.alive, v.magLeft], u.name); }
  for (const g of fe.objs) assert.equal(g.hp, S.objs.find(h => h.id === g.id).hp, g.name);
  assert.ok(S.rec.log.length >= S.log.length, 'el archivo del registro no se poda');
});
