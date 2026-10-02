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
  S.net = true; S.doctrine = 'salva';
}

/**
 * Corre un escenario completo con semilla fija y devuelve el estado final.
 * opts: { seed, flat, net, doctrine, prep(S) }
 */
export function runScenario(key, opts = {}) {
  const sc = SCENARIOS[key];
  useMap(sc.map, opts);
  clearSetup();
  applyScenario(sc);
  if (opts.net !== undefined) S.net = opts.net;
  if (opts.doctrine) S.doctrine = opts.doctrine;
  if (opts.prep) opts.prep(S);
  return runCurrent(opts.seed ?? 1);
}

/** Corre lo que haya en S.setup con la semilla dada (máx. 10.000 s simulados). */
export function runCurrent(seed) {
  setRandom(seeded(seed));
  try {
    startSim();
    for (let n = 0; n < 40000; n++) {
      step(0.25);
      if (!S.pending.length && S.threats.every(t => !t.alive) && S.ints.every(i => i.done)) break;
    }
  } finally { setRandom(null); }
  return S;
}
