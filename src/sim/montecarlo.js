// @ts-check
// ---------------- MODO MONTE CARLO ----------------
// Corre N veces la misma situación (S.setup) con semillas distintas y, si se pide, sorteando los
// parámetros del catálogo dentro de su rango de incertidumbre (applySample). Resume cada corrida y
// arma la distribución: probabilidad de que cada objetivo sobreviva, de cumplir cada meta, de perder
// cada unidad, y la dispersión de interceptaciones, impactos, daño y costos.
//
// Reglas para no ensuciar el juego normal (y que las golden no cambien):
//   - el catálogo sorteado se aplica solo mientras corre un tramo y se vuelve al probable
//     (applyProbable) al final de cada tramo, aunque haya un error;
//   - el generador con semilla se instala solo durante el tramo (setRandom) y después se quita;
//   - los enganches de la interfaz (hooks) se silencian durante el tramo;
//   - al terminar, el estado queda en modo edición (resetState) con el setup intacto.
// La corrida i usa la semilla seed + i para la simulación y otra derivada para el sorteo de
// parámetros: es reproducible y, con sample = false, idéntica a una corrida normal con esa semilla.
import { applySample, applyProbable } from '../data/index.js';
import { setRandom, seeded } from '../util/rng.js';
import { S } from './state.js';
import { hooks } from './hooks.js';
import { startSim, step, resetState } from './engine.js';
import { evaluateGoals } from './goals.js';
import { SIM_STEP } from './clock.js';

/** Paso de simulación (s): el mismo que usa la interfaz, así una corrida da lo mismo acá que en pantalla. */
export const MC_STEP = SIM_STEP;
let active = null;
/** La interfaz no debe avanzar ni reiniciar el estado compartido mientras corre una serie. */
export const isMonteCarloRunning = () => active !== null;

/** Semilla del sorteo de parámetros de la corrida con semilla s (independiente de la de la simulación). */
export const paramSeed = s => (Math.imul(s, 0x9E3779B1) ^ 0x5bd1e995) >>> 0;

const ended = () => !S.pending.length && S.threats.every(t => !t.alive) && S.ints.every(i => i.done);

/** Resumen de una corrida terminada (lo único que se guarda de cada una). */
export function summarizeRun(S, seed) {
  const { goals, outcome } = evaluateGoals(S.scen, S);
  const st = S.stats, real = S.threats.filter(t => !t.isDecoy).length;
  return {
    seed, t: S.t, result: outcome.result,
    goals: goals.map(g => g.met),
    objs: S.objs.map(o => ({ name: o.name, hp: Math.max(0, o.hp), maxHp: o.maxHp, status: o.status })),
    lost: S.units.filter(u => !u.alive).map(u => u.name),
    real, intercepted: st.killed - st.decoysKilled, impacts: st.hits, damage: st.damage,
    shots: st.shots, defCost: st.defCost, atkCost: st.atkCost, decoysKilled: st.decoysKilled
  };
}

/**
 * Prepara una serie Monte Carlo sobre el S.setup actual.
 * opts = { runs = 20, seed = 1, sample = true }
 * Devuelve { runs, done, results, tick(budgetMs) → boolean (true = terminó), cancel() }.
 * tick avanza la serie hasta gastar budgetMs de reloj real (la interfaz lo llama entre cuadros
 * para no congelar la página); runMonteCarlo hace todo de una vez (Node, pruebas).
 */
export function createMonteCarlo({ runs = 20, seed = 1, sample = true } = {}) {
  if (active) throw new Error('Ya hay una serie Monte Carlo en curso.');
  const mc = { runs, seed, sample, results: /** @type {any[]} */ ([]), done: false, cancelled: false, current: -1 };
  active = mc;
  let rng = null, deadline = 0;
  const saved = { ...hooks }, quiet = { onLog() {}, onEnd() {}, onUnitLost() {}, defenderView: () => false };

  mc.tick = (budgetMs = 40) => {
    if (mc.done) return true;
    const t0 = Date.now();
    Object.assign(hooks, quiet);
    try {
      // cada tramo avanza al menos un paso aunque el presupuesto sea 0
      do {
        if (rng === null) {
          // empezar la corrida siguiente
          mc.current = mc.results.length; if (mc.current >= runs) { finish(); break; }
          const s = seed + mc.current;
          if (sample) applySample(seeded(paramSeed(s)));
          rng = seeded(s); setRandom(rng); startSim(); S.running = false;
          // Incluye el último lanzamiento y su vuelo; hasta 400 s para interceptores pendientes.
          deadline = S.pending.reduce((end, th) => Math.max(end, th.tLaunch + th.ft), 0) + 401;
          if (!Number.isFinite(deadline)) throw new Error('Monte Carlo: hay una ruta o un horario de ataque inválido.');
        } else {
          if (sample) applySample(seeded(paramSeed(seed + mc.current)));   // el mismo sorteo de esta corrida
          setRandom(rng);
        }
        while (!ended()) {
          if (S.t >= deadline) throw new Error('Monte Carlo: la corrida no terminó después del último ataque. No se contabilizó como resultado.');
          step(MC_STEP);
          if (Date.now() - t0 >= budgetMs) break;
        }
        if (ended()) { mc.results.push(summarizeRun(S, seed + mc.current)); rng = null; }
        setRandom(null); if (sample) applyProbable();
      } while (Date.now() - t0 < budgetMs && !mc.done);
    } catch (error) {
      finish(); throw error;
    } finally {
      setRandom(null); if (sample) applyProbable(); Object.assign(hooks, saved);
    }
    if (!mc.done && mc.results.length >= runs) finish();
    return mc.done;
  };
  mc.cancel = () => { mc.cancelled = true; finish(); };
  function finish() { if (mc.done) return; mc.done = true; active = null; resetState(); }
  return mc;
}

/** Corre la serie completa de una vez y devuelve la distribución (ver aggregate). */
export function runMonteCarlo(opts = {}) {
  const mc = createMonteCarlo(opts);
  while (!mc.tick(1e9));
  return aggregate(mc.results, S.scen, opts);
}

// ---------------- ESTADÍSTICA ----------------

/** Percentil q (0–1) de una lista ya ordenada, con interpolación lineal. */
export function quantile(sorted, q) {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * q, a = Math.floor(i), b = Math.ceil(i);
  return sorted[a] + (sorted[b] - sorted[a]) * (i - a);
}

/** Intervalo de confianza del 95% de Wilson para k éxitos en n intentos → [lo, hi]. */
export function wilson(k, n, z = 1.96) {
  if (!n) return [0, 1];
  const p = k / n, d = 1 + z * z / n, c = p + z * z / (2 * n), m = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
}

/** Proporción con su intervalo: { k, n, p, lo, hi }. */
const prop = (k, n) => { const [lo, hi] = wilson(k, n); return { k, n, p: n ? k / n : 0, lo, hi }; };

/** Media y percentiles 10/50/90 de una lista de números. */
export function describe(values) {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return { n: 0, mean: null, min: null, p10: null, p50: null, p90: null, max: null };
  return { n: v.length, mean: v.reduce((s, x) => s + x, 0) / v.length, min: v[0], p10: quantile(v, 0.1), p50: quantile(v, 0.5), p90: quantile(v, 0.9), max: v[v.length - 1] };
}

/** Histograma de valores en [lo, hi] con `bins` cajas iguales → [{ from, to, n }]. */
export function histogram(values, lo, hi, bins = 10) {
  const out = Array.from({ length: bins }, (_, i) => ({ from: lo + (hi - lo) * i / bins, to: lo + (hi - lo) * (i + 1) / bins, n: 0 }));
  for (const x of values) { if (!Number.isFinite(x)) continue; const i = Math.min(bins - 1, Math.max(0, Math.floor((x - lo) / (hi - lo || 1) * bins))); out[i].n++; }
  return out;
}

/**
 * Distribución de una serie de corridas.
 * → { n, sample, seed, outcome: { exito, parcial, fracaso, none } (proporciones), goals: [{ ...meta, met: prop }],
 *     objectives: [{ name, maxHp, survive, operational, destroyed: prop, dmgFrac: describe }],
 *     unitsLost: [{ name, lost: prop }], metrics: { interceptRate, intercepted, impacts, damage, shots, defCost, atkCost },
 *     interceptHist }
 */
export function aggregate(results, scen, { sample = true, seed = 1 } = {}) {
  const n = results.length;
  const count = f => results.filter(f).length;
  const outcome = {};
  for (const r of ['exito', 'parcial', 'fracaso']) outcome[r] = prop(count(x => x.result === r), n);
  outcome.none = prop(count(x => x.result === null), n);
  const goals = (scen?.goals || []).map((g, i) => ({ ...g, met: prop(count(x => x.goals[i]), n) }));
  const names = results[0]?.objs.map(o => o.name) || [];
  const objectives = names.map((name, i) => {
    const os = results.map(r => r.objs[i]);
    return {
      name, maxHp: os[0].maxHp,
      survive: prop(os.filter(o => o.status !== 'destroyed').length, n),
      operational: prop(os.filter(o => o.status === 'operational').length, n),
      destroyed: prop(os.filter(o => o.status === 'destroyed').length, n),
      dmgFrac: describe(os.map(o => (o.maxHp - o.hp) / o.maxHp))
    };
  });
  const lostNames = [...new Set(results.flatMap(r => r.lost))];
  const unitsLost = lostNames.map(name => ({ name, lost: prop(count(r => r.lost.includes(name)), n) })).sort((a, b) => b.lost.p - a.lost.p);
  const rate = results.map(r => r.real ? r.intercepted / r.real : NaN);
  const metrics = {
    interceptRate: describe(rate), intercepted: describe(results.map(r => r.intercepted)), impacts: describe(results.map(r => r.impacts)),
    damage: describe(results.map(r => r.damage)), shots: describe(results.map(r => r.shots)),
    defCost: describe(results.map(r => r.defCost)), atkCost: describe(results.map(r => r.atkCost))
  };
  return { n, sample, seed, scen, player: scen?.player || null, outcome, goals, objectives, unitsLost, metrics, interceptHist: histogram(rate, 0, 1, 10) };
}
