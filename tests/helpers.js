// Utilidades para correr el motor sin navegador.
import { SCENARIOS } from '../src/data/index.js';
import { setMap, builtinMap, flatMap } from '../src/physics/terrain.js';
import { setRandom, seeded } from '../src/util/rng.js';
import { S } from '../src/sim/state.js';
import { startSim, resetState, step } from '../src/sim/engine.js';
import { applyScenario } from '../src/sim/setup.js';

/** Activa el mapa de un escenario (o uno plano del mismo tamaño). */
export function useMap(key, { flat = false } = {}) {
  const m = builtinMap(key);
  setMap(flat ? flatMap(m.W, m.H, m.cell) : m);
}

/** Deja el estado limpio con un setup vacío. */
export function clearSetup() {
  resetState();
  S.setup = { objs: [], defs: [], salvos: [], jams: [] }; S.sel = null; S.mode = 'select';
  S.c2 = 'coordinada'; S.doctrine = 'salva'; S.weather = 'despejado'; S.tod = 'noche'; S.wxPlan = []; S.gateways = []; S.wind = { v: 0, from: 0 }; S.ignoreDecoys = false; S.fireRange = 1;
}

/**
 * Corre un escenario completo con semilla fija y devuelve el estado final.
 * opts: { seed, flat, net (viejo: true = coordinada, false = desconectada), c2, doctrine, prep(S) }
 */
export function runScenario(key, opts = {}) {
  const sc = SCENARIOS[key];
  useMap(sc.map, opts);
  clearSetup();
  applyScenario(sc);
  if (opts.net !== undefined) S.c2 = opts.net ? 'coordinada' : 'desconectada';
  if (opts.c2) S.c2 = opts.c2;
  if (opts.doctrine) S.doctrine = opts.doctrine;
  if (opts.prep) opts.prep(S);
  return runCurrent(opts.seed ?? 1);
}

/**
 * Corre lo que haya en S.setup con la semilla dada (máx. 10.000 s simulados). afterStart(S), si se
 * pasa, se llama con la corrida ya armada y antes del primer paso (para tocar S.units).
 */
export function runCurrent(seed, afterStart = null) {
  setRandom(seeded(seed));
  try {
    startSim(); if (afterStart) afterStart(S);
    for (let n = 0; n < 40000; n++) {
      step(0.25);
      if (!S.pending.length && S.threats.every(t => !t.alive) && S.ints.every(i => i.done)) break;
    }
  } finally { setRandom(null); }
  return S;
}
