// Modo Monte Carlo (sim/montecarlo.js): reproducible, no ensucia el catálogo ni el estado, y la
// estadística (Wilson, percentiles, histograma) es correcta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SCENARIOS, THREATS, DEFENSES, JAMMERS } from '../src/data/index.js';
import { rnd } from '../src/util/rng.js';
import { S } from '../src/sim/state.js';
import { hooks } from '../src/sim/hooks.js';
import { applyScenario, addObj, addSalvo } from '../src/sim/setup.js';
import { exportScenario, validateScenario } from '../src/sim/scenario-io.js';
import { createMonteCarlo, runMonteCarlo, aggregate, summarizeRun, wilson, quantile, describe, histogram, isMonteCarloRunning } from '../src/sim/montecarlo.js';
import { useMap, clearSetup, runCurrent, runScenario } from './helpers.js';

const load = key => { useMap(SCENARIOS[key].map); clearSetup(); applyScenario(SCENARIOS[key]); };
const catalog = () => JSON.stringify({ THREATS, DEFENSES, JAMMERS });

test('un ataque posterior a 10.000 s se simula antes de evaluar las metas', () => {
  useMap('monterey'); clearSetup();
  addObj('fuel', 50, 50, { name: 'Depósito', hp: 1 });
  S.scen = { name: 'Ataque tardío', player: 'defensa', goals: [{ side: 'defensa', primary: true, kind: 'protect', target: 'Depósito' }] };
  addSalvo({ type: 'shahed', count: 1, tStart: 11000, pts: [[0, 50], [50, 50]] });
  assert.ok(validateScenario(exportScenario()).ok, 'es un escenario válido');
  const mc = createMonteCarlo({ runs: 1, sample: false, seed: 1 });
  while (!mc.tick(1e9));
  assert.equal(mc.results.length, 1);
  const r = mc.results[0];
  assert.ok(r.t > 11000); assert.equal(r.real, 1);
  assert.equal(r.result, 'fracaso'); assert.equal(r.objs[0].status, 'destroyed');
});

test('una serie bloquea otra y libera el estado al cancelar o fallar', () => {
  load('gb_ruso');
  const mc = createMonteCarlo({ runs: 1 });
  assert.ok(isMonteCarloRunning());
  assert.throws(() => createMonteCarlo(), /en curso/);
  mc.cancel(); assert.equal(isMonteCarloRunning(), false);
  const before = catalog(), h = { ...hooks };
  S.setup.salvos[0].tStart = Infinity;
  S.setup.salvos[0].sync = false;
  const invalid = createMonteCarlo({ runs: 1 });
  assert.throws(() => invalid.tick(1e9), /inválido/);
  assert.equal(invalid.results.length, 0);
  assert.equal(invalid.done, true); assert.equal(isMonteCarloRunning(), false);
  assert.equal(S.started, false); assert.equal(catalog(), before); assert.deepEqual({ ...hooks }, h);
});

test('sin sorteo, la corrida i es idéntica a una corrida normal con la semilla seed + i', () => {
  load('gb_ruso');
  const mc = createMonteCarlo({ runs: 3, seed: 5, sample: false });
  while (!mc.tick(1e9));
  for (let i = 0; i < 3; i++) {
    load('gb_ruso');
    assert.deepEqual(mc.results[i], summarizeRun(runCurrent(5 + i), 5 + i));
  }
});

test('correr en tramos chicos da lo mismo que de una vez (la interfaz corre de a 40 ms)', () => {
  load('gb_ruso');
  const all = createMonteCarlo({ runs: 4, seed: 11, sample: true }); while (!all.tick(1e9));
  load('gb_ruso');
  const sliced = createMonteCarlo({ runs: 4, seed: 11, sample: true }); let n = 0;
  while (!sliced.tick(0)) n++;   // presupuesto 0: un solo paso de simulación por tramo
  assert.ok(n > 50, 'tendría que haber hecho muchos tramos');
  assert.deepEqual(sliced.results, all.results);
});

test('con sorteo es reproducible y cambia el resultado respecto de los valores probables', () => {
  load('gb_ruso'); const a = runMonteCarlo({ runs: 6, seed: 3, sample: true });
  load('gb_ruso'); const b = runMonteCarlo({ runs: 6, seed: 3, sample: true });
  load('gb_ruso'); const c = runMonteCarlo({ runs: 6, seed: 3, sample: false });
  assert.deepEqual(a.metrics, b.metrics);
  assert.notDeepEqual(a.metrics, c.metrics);
});

test('después de una serie el catálogo, el azar, los enganches y el estado quedan como antes', () => {
  const before = catalog(), h = { ...hooks };
  load('mb_noche'); const setup = JSON.stringify(S.setup);
  const mc = createMonteCarlo({ runs: 2, seed: 1, sample: true });
  mc.tick(30);   // a mitad de una corrida
  assert.equal(catalog(), before, 'entre tramos el catálogo vuelve al probable');
  mc.cancel();
  assert.equal(catalog(), before);
  assert.deepEqual({ ...hooks }, h);
  assert.equal(S.started, false); assert.equal(S.threats.length, 0);
  assert.equal(JSON.stringify(S.setup), setup);
  // el azar volvió a Math.random: dos llamadas seguidas no repiten la secuencia del generador con semilla
  assert.ok(rnd() !== rnd());
});

test('las golden siguen dando lo mismo después de correr un Monte Carlo con sorteo', () => {
  load('gb_ruso'); runMonteCarlo({ runs: 3, seed: 2, sample: true });
  const golden = JSON.parse(readFileSync(new URL('./golden.json', import.meta.url), 'utf8'));
  const S1 = runScenario('gb_ruso', { seed: 1 });
  assert.deepEqual(JSON.parse(JSON.stringify(S1.stats)), golden.gb_ruso_s1.stats);
});

test('distribución: probabilidades por objetivo, metas y unidades coherentes con las corridas', () => {
  load('gb_ruso');
  const mc = createMonteCarlo({ runs: 8, seed: 1, sample: true }); while (!mc.tick(1e9));
  const a = aggregate(mc.results, SCENARIOS.gb_ruso, { sample: true, seed: 1 });
  assert.equal(a.n, 8);
  assert.equal(a.objectives.length, SCENARIOS.gb_ruso.objectives.length);
  for (const o of a.objectives) {
    assert.equal(o.survive.k + o.destroyed.k, 8);
    assert.ok(o.operational.k <= o.survive.k);
    assert.ok(o.survive.lo <= o.survive.p && o.survive.p <= o.survive.hi);
  }
  const ammo = a.objectives.find(o => o.name === 'Depósito de munición');
  assert.equal(ammo.survive.k, mc.results.filter(r => r.objs[0].status !== 'destroyed').length);
  // la meta defensiva "que el depósito no sea destruido" coincide con la supervivencia del depósito
  const g = a.goals.find(x => x.side === 'defensa' && x.kind === 'survive');
  assert.equal(g.met.k, ammo.survive.k);
  assert.equal(a.outcome.exito.k + a.outcome.parcial.k + a.outcome.fracaso.k + a.outcome.none.k, 8);
  assert.equal(a.interceptHist.reduce((s, h) => s + h.n, 0), 8);
});

test('estadística: Wilson, percentiles, describe e histograma', () => {
  const [lo, hi] = wilson(5, 10);
  assert.ok(Math.abs(lo - 0.2366) < 1e-3 && Math.abs(hi - 0.7634) < 1e-3, `${lo} ${hi}`);
  assert.deepEqual(wilson(0, 0), [0, 1]);
  assert.equal(wilson(0, 20)[0], 0); assert.ok(wilson(0, 20)[1] < 0.17);
  assert.equal(quantile([1, 2, 3, 4], 0.5), 2.5);
  assert.equal(quantile([7], 0.9), 7);
  const d = describe([3, 1, 2, NaN, 4]);
  assert.deepEqual([d.n, d.mean, d.min, d.p50, d.max], [4, 2.5, 1, 2.5, 4]);
  const h = histogram([0, 0.05, 0.5, 1, 1], 0, 1, 10);
  assert.deepEqual(h.map(b => b.n), [2, 0, 0, 0, 0, 1, 0, 0, 0, 2]);
});
