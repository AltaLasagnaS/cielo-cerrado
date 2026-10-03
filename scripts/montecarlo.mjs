// Monte Carlo en Node para medir y recalibrar escenarios (40 noches por escenario, como pide CONTRIBUIR).
//
//   npm run mc                              (todos los escenarios con metas)
//   npm run mc -- kv_energia gb_refineria   (algunos)
//   N=100 npm run mc -- mb_puente           (otra cantidad de noches)
//   SAMPLE=1 npm run mc -- kv_energia       (sorteando los parámetros dentro de su incertidumbre)
//
// Por defecto usa los VALORES PROBABLES del catálogo (sin sorteo): es la vara con la que están medidas
// las cifras del CHANGELOG ("Kiev ≈70%"…). Con SAMPLE=1 los resultados cambian bastante (por ejemplo,
// el puente de Monterey): son dos preguntas distintas, "qué pasa con los datos más probables" y "qué
// pasa si los datos están en cualquier lugar de su rango".
import { SCENARIOS } from '../src/data/index.js';
import { applyScenario } from '../src/sim/setup.js';
import { runMonteCarlo } from '../src/sim/montecarlo.js';
import { useMap, clearSetup } from '../tests/helpers.js';

const args = process.argv.slice(2);
const keys = args.length ? args : Object.keys(SCENARIOS).filter(k => SCENARIOS[k].goals?.length);
const N = +(process.env.N || 40), sample = process.env.SAMPLE === '1';
const pc = x => Math.round(x.p * 100) + '%';
for (const k of keys) {
  const sc = SCENARIOS[k]; if (!sc) { console.error('No existe el escenario ' + k); process.exitCode = 1; continue; }
  useMap(sc.map); clearSetup(); applyScenario(sc);
  const t0 = Date.now(), a = runMonteCarlo({ runs: N, seed: 1, sample });
  const o = a.outcome;
  console.log(`${k} (juega ${sc.player}, ${N} noches${sample ? ', con sorteo' : ''}): éxito ${pc(o.exito)} [${Math.round(o.exito.lo * 100)}–${Math.round(o.exito.hi * 100)}%], parcial ${pc(o.parcial)}, fracaso ${pc(o.fracaso)} · intercepción media ${Math.round(a.metrics.interceptRate.mean * 100)}% · ${a.metrics.shots.mean.toFixed(1)} disparos · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
