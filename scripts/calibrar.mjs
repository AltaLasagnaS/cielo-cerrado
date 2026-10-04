// Arnés de calibración de la Pk (docs/DATOS-Y-FUENTES.md §4): corre los casos de
// src/data/calibration-cases.js y compara la tasa de derribo simulada con el rango objetivo.
//
//   npm run calibrar                     (todos los casos, 40 noches cada uno)
//   npm run calibrar -- kh22_patriot     (algunos)
//   N=100 npm run calibrar               (otra cantidad de noches)
//   npm run calibrar -- --write          (además reescribe src/data/calibration.js, la tabla CAL)
//
// Columnas: "sim" con las Pk probables; "lo" y "hi" con TODAS las Pk de las defensas en el mínimo y en
// el máximo de su rango en UNC (cuánto se mueve el caso con la incertidumbre de la Pk). "ok": sim dentro
// del objetivo (null en los casos de control). Semillas 1..N: el resultado es reproducible.
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAL_CASES } from '../src/data/calibration-cases.js';
import { DEFENSES, UNC, applyProbable, setPath } from '../src/data/index.js';
import { addDef, addSalvo } from '../src/sim/setup.js';
import { S } from '../src/sim/state.js';
import { useMap, clearSetup, runCurrent } from '../tests/helpers.js';

const args = process.argv.slice(2), write = args.includes('--write');
const ids = args.filter(a => !a.startsWith('--'));
const N = +(process.env.N || 40);

/** Tasa de derribo agrupada de un caso en N noches (derribadas / lanzadas). */
export function runCase(c, n = N) {
  const types = new Set(c.salvos.map(s => s.type));
  let killed = 0, launched = 0;
  for (let seed = 1; seed <= n; seed++) {
    useMap('monterey', { flat: true }); clearSetup(); Object.assign(S, c.rules || {});
    for (const [type, x, y, o] of c.defs) addDef(type, x, y, o);
    for (const s of c.salvos) addSalvo({ ...s, pts: s.pts.map(p => [...p]) });
    runCurrent(seed);
    for (const th of S.threats) {
      if (!types.has(th.type) || (c.metric !== 'todos' && (th.isDecoyChild || th.isDecoy))) continue;
      launched++; if (th.killed) killed++;
    }
  }
  return launched ? killed / launched : 0;
}

/** Pone todas las Pk de las defensas en el extremo k ('min' | 'max') de su rango. */
function setPk(k) {
  for (const [def, params] of Object.entries(UNC.def)) for (const [path, u] of Object.entries(params)) if (path.startsWith('sam.pk.')) setPath(DEFENSES[def], path, u[k]);
}

const r2 = x => Math.round(x * 1000) / 1000, pc = x => Math.round(x * 100) + '%';
const out = [];
for (const c of CAL_CASES) {
  if (ids.length && !ids.includes(c.id)) continue;
  const t0 = Date.now();
  let sim, lo, hi;
  try { sim = runCase(c); setPk('min'); lo = runCase(c); setPk('max'); hi = runCase(c); } finally { applyProbable(); }
  const ok = c.obj ? sim >= c.obj[0] && sim <= c.obj[1] : null;
  out.push({ id: c.id, caso: c.caso, real: c.real, obj: c.obj ? `${pc(c.obj[0])}–${pc(c.obj[1])}`.replace('%–', '–') : '—', sim: r2(sim), lo: r2(lo), hi: r2(hi), ok });
  console.log(`${c.id}: ${pc(sim)} (Pk mín–máx ${pc(lo)}–${pc(hi)}) · objetivo ${out.at(-1).obj} · ${ok == null ? 'control' : ok ? 'dentro' : 'FUERA'} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

if (write) {
  if (ids.length) { console.error('--write necesita correr todos los casos'); process.exit(1); }
  const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'calibration.js');
  await writeFile(file, `// ARCHIVO GENERADO por scripts/calibrar.mjs (npm run calibrar -- --write): no editar a mano.
// Casos de calibración (geometría en data/calibration-cases.js) corridos con el motor: ${N} noches, C2
// coordinada, doctrina de salva. "real" = dato observado; "obj" = rango objetivo para la tasa de derribo
// dentro de cobertura; "sim" = con las Pk probables; "lo"/"hi" = con todas las Pk en el mínimo/máximo de UNC.
export const CAL = ${JSON.stringify(out, null, 1)};
`);
  console.log('src/data/calibration.js reescrito');
}
if (out.some(c => c.ok === false)) process.exitCode = 1;
