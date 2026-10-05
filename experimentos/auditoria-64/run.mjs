// Auditoría externa: importa una revisión congelada; nunca modifica su código ni sortea datos.
// node experimentos/auditoria-64/run.mjs --repo=/path --out=/tmp/result.json --runs=40 kv_energia
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const option = (name, fallback) => args.find(a => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=') ?? fallback;
const repo = resolve(option('repo', '.'));
const output = option('out', '/tmp/auditoria64.json');
const runs = Number(option('runs', '40'));
const seed0 = Number(option('seed', '1'));
const captureArrivals = option('arrivals', '0') === '1';
const keys = args.filter(a => !a.startsWith('--'));
if (!Number.isSafeInteger(runs) || runs < 1 || !Number.isSafeInteger(seed0) || seed0 < 1 || !keys.length) throw Error('Corridas, semilla o escenarios inválidos');
const load = p => import(pathToFileURL(resolve(repo, p)).href);
const { D, SCENARIOS, applyProbable } = await load('src/data/index.js');
const { useMap, clearSetup } = await load('tests/helpers.js');
const { applyScenario } = await load('src/sim/setup.js');
const { S } = await load('src/sim/state.js');
const { hooks } = await load('src/sim/hooks.js');
const { startSim, step } = await load('src/sim/engine.js');
const { summarizeRun } = await load('src/sim/montecarlo.js');
const { seeded, setRandom } = await load('src/util/rng.js');
const { surf } = await load('src/physics/terrain.js');
const { speedAt } = await load('src/physics/kinematics.js');
const { label, uLabel } = await load('src/sim/log.js');
const eng = await load('src/physics/engagement.js');
let track;
try { track = await load('src/physics/track.js'); } catch { /* #59 todavía no tiene pista observada. */ }
const result = { commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(), runs, seed: seed0, sample: false, step: 0.25, scenarios: {} };
const ended = () => !S.pending.length && S.threats.every(th => !th.alive) && S.ints.every(it => it.done);
let currentSeed;
const metadata = new WeakMap();

function geometry(it) {
  const { u, th } = it, sm = D(u).sam, p = th.p, t = S.t;
  const lz = surf(u.x, u.y) + 2;
  const r = Math.hypot(p.x - u.x, p.y - u.y, (p.z - lz) / 1000);
  const reach = eng.arrivalReach(u, th, t);
  const kin = r / reach.f;
  const predictedZ = metadata.get(it)?.z;
  const rLaunchAspect = it.f && Number.isFinite(predictedZ) ? Math.hypot(it.px - u.x, it.py - u.y, (predictedZ - lz) / 1000) / it.f : null;
  const agl = p.z - surf(p.x, p.y), speed = speedAt(th, t);
  const reasons = [];
  if (r > kin) reasons.push('range');
  if (r < sm.minR) reasons.push('minR');
  if (agl < sm.altMin) reasons.push('altMin');
  if (p.z - lz > sm.altMax) reasons.push('altMax');
  if (speed > sm.vmaxT) reasons.push('vmaxT');
  const corner = th.cum?.slice(1, -1).reduce((min, c) => Math.min(min, Math.abs(p.s - c)), Infinity);
  return { seed: currentSeed, t, unit: u.name, type: u.type, threat: th.type, n: th.n, guid: sm.guid,
    fLaunch: it.f, fArrival: reach.f, r, kin, kinPredicted: rLaunchAspect, rWithPredictedAspect: rLaunchAspect ? r / rLaunchAspect : null,
    agl, altMin: sm.altMin, speed, vmaxT: sm.vmaxT, flight: t - it.tL,
    predicted: [it.px, it.py, predictedZ ?? null], actual: [p.x, p.y, p.z],
    horizontalError: Math.hypot(it.px - p.x, it.py - p.y), reasons, cornerKm: Number.isFinite(corner) ? corner : null };
}

for (const key of keys) {
  const sc = SCENARIOS[key]; if (!sc) throw Error(`Escenario desconocido: ${key}`);
  const rec = { results: [], units: {}, failures: [], arrivals: [] };
  result.scenarios[key] = rec;
  for (let seed = seed0; seed < seed0 + runs; seed++) {
    applyProbable(); useMap(sc.map); clearSetup(); applyScenario(sc); currentSeed = seed;
    const launched = new Set(), failed = new Set(), arrived = new Set();
    const unitRecord = u => rec.units[u.name] ??= { type: u.type, shots: 0, noReach: 0, killed: 0,
      phantom: 0, magLeft: 0, reserveLeft: 0, samples: 0, globalVelocityNoLocal: 0, localVelocity: 0,
      shotsByThreat: {}, killsByThreat: {} };
    hooks.onLog = () => {
      const e = S.log[0];
      if (e?.cls === 'k') for (const u of S.units) if (e.msg.startsWith(uLabel(u) + ' derriba ')) {
        const ur = unitRecord(u); ur.killed++;
        const th = S.threats.find(th => e.msg.startsWith(uLabel(u) + ' derriba ' + label(th) + ' '));
        if (!th) throw Error('Derribo sin amenaza identificada');
        ur.killsByThreat[th.type] = (ur.killsByThreat[th.type] || 0) + 1;
      }
      if (captureArrivals && eng.arrivalReach && (e?.cls === 'k' || e?.msg.includes(' falla contra '))) {
        const it = S.ints.find(i => i.done && i.th && !arrived.has(i) && S.t - i.tH >= 0 && S.t - i.tH < 0.250001 &&
          (e.msg.startsWith(uLabel(i.u) + ' derriba ' + label(i.th) + ' ') || e.msg.startsWith(i.shot + ' de ' + uLabel(i.u) + ' falla contra ' + label(i.th) + ' ')));
        if (!it) throw Error(`No se pudo asociar llegada aceptada: ${e.msg}`);
        arrived.add(it); rec.arrivals.push({ ...geometry(it), result: e.cls === 'k' ? 'kill' : 'pkMiss' });
      }
      if (e?.cls === 'l' && e.msg.includes(' dispara ')) for (const it of S.ints) if (!metadata.has(it) && it.th && !it.done && it.tL >= S.t) {
        const c2 = eng.unitC2(it.u, eng.effectiveC2(S.c2, S.objs, eng.cpOf(it.u)));
        const ks = eng.trackKeys?.(it.u, it.th, S.t, c2, S.gateways);
        const sol = eng.solve(it.u, it.th, S.t, S.fireRange, ks);
        if (!sol || Math.hypot(sol.p.x - it.px, sol.p.y - it.py) > 1e-8) throw Error('La reconstrucción de la solución no coincide');
        metadata.set(it, { z: sol.p.z });
      }
      if (!e?.msg.includes(' no alcanza a ')) return;
      const it = S.ints.find(i => i.done && i.th && !failed.has(i) && S.t - i.tH >= 0 && S.t - i.tH < 0.250001 && e.msg.startsWith(i.shot + ' de ' + uLabel(i.u) + ' no alcanza a ' + label(i.th)));
      if (!it) throw Error(`No se pudo asociar llegada: ${e.msg}`);
      failed.add(it); unitRecord(it.u).noReach++; rec.failures.push(geometry(it));
    };
    setRandom(seeded(seed));
    try {
      startSim(); S.running = false;
      for (const u of S.units) unitRecord(u);
      const deadline = S.pending.reduce((end, th) => Math.max(end, th.tLaunch + th.ft), 0) + 401;
      while (!ended()) {
        if (S.t >= deadline) throw Error(`No terminó ${key}/${seed}`);
        step(0.25);
        for (const it of S.ints) if (!launched.has(it)) {
          launched.add(it); const ur = unitRecord(it.u); ur.shots++; if (it.phantom) ur.phantom++;
          const target = it.th?.type ?? 'phantom'; ur.shotsByThreat[target] = (ur.shotsByThreat[target] || 0) + 1;
        }
        if (track && eng.trackKeys && S.t % 10 === 0) for (const u of S.units) {
          const sm = D(u).sam; if (!sm || !u.alive || u.magLeft <= 0) continue;
          const c2 = eng.unitC2(u, eng.effectiveC2(S.c2, S.objs, eng.cpOf(u)));
          for (const th of S.threats) {
            if (!th.alive || !th.p || eng.isTBM(th) || th.isDecoy || Math.hypot(u.x - th.p.x, u.y - th.p.y) > sm.maxR) continue;
            const ur = unitRecord(u); ur.samples++;
            const local = track.trackVel(th, eng.trackKeys(u, th, S.t, c2, S.gateways));
            if (local) ur.localVelocity++;
            else if (track.trackVel(th)) ur.globalVelocityNoLocal++;
          }
        }
      }
      const summary = summarizeRun(S, seed); rec.results.push(summary);
      if ([...launched].length !== summary.shots) throw Error('Conteo de disparos distinto del motor');
      for (const u of S.units) { const ur = unitRecord(u); ur.magLeft += u.magLeft || 0; ur.reserveLeft += u.reserveLeft || 0; }
      console.log(`${key} seed=${seed} result=${summary.result} shots=${summary.shots} killed=${summary.intercepted}`);
    } finally { setRandom(null); hooks.onLog = () => {}; }
  }
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
}
console.log(`Guardado ${output}`);
