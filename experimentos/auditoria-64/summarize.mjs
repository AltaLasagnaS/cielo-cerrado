// Reduce los archivos completos del runner a evidencia legible para revisión.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? '/tmp');
const out = resolve(process.argv[3] ?? 'experimentos/auditoria-64/data/resumen.json');
const read = name => JSON.parse(readFileSync(resolve(dir, name), 'utf8'));
const versions = ['base59', 'pista64', 'red64', 'prioridad64'];
const summary = { runs: 40, seed: 1, sample: false, step: 0.25, versions: {} };
const mean = (xs, get) => xs.reduce((s, x) => s + get(x), 0) / xs.length;

for (const version of versions) {
  const raw = read(`caida-${version}.json`), typed = read(`caida-tipos-${version}.json`);
  const v = { commit: raw.commit, scenarios: {} }; summary.versions[version] = v;
  for (const [key, s] of Object.entries(raw.scenarios)) {
    if (s.results.length !== 40 || s.results.some((r, i) => r.seed !== i + 1)) throw Error('Semillas incompletas');
    if (typed.scenarios[key] && JSON.stringify(s.results) !== JSON.stringify(typed.scenarios[key].results)) throw Error('La instrumentación cambió los resultados');
    const reasons = {}, unitReasons = {}, examples = {};
    for (const f of s.failures) {
      for (const reason of f.reasons) reasons[reason] = (reasons[reason] || 0) + 1;
      const group = f.unit + '/' + f.reasons.join('+'); unitReasons[group] = (unitReasons[group] || 0) + 1;
      // Un ejemplo exacto por arma, causa y tipo de amenaza.
      examples[group + '/' + f.threat] ??= f;
    }
    const units = {};
    for (const [name, u] of Object.entries(s.units)) {
      units[name] = { type: u.type, shots: u.shots / 40, killsIncludingDecoys: u.killed / 40,
        noReach: u.noReach, magLeft: u.magLeft / 40, reserveLeft: u.reserveLeft / 40,
        samples: u.samples, globalVelocityNoLocal: u.globalVelocityNoLocal, localVelocity: u.localVelocity };
      const t = typed.scenarios[key]?.units[name];
      if (t) Object.assign(units[name], { shotsByThreat40: t.shotsByThreat, killsByThreat40: t.killsByThreat });
    }
    v.scenarios[key] = { successes: s.results.filter(r => r.result === 'exito').length,
      shots: mean(s.results, r => r.shots), realIntercepted: mean(s.results, r => r.intercepted),
      noReach: s.failures.length, reasons, unitReasons, units, failureExamples: Object.values(examples),
      failureXYUnder1e6Km: s.failures.filter(f => f.horizontalError < 1e-6).length,
      rangeInsidePredictedAspect: s.failures.filter(f => f.reasons.includes('range') && f.rWithPredictedAspect != null && f.rWithPredictedAspect <= 1).length,
      results: s.results.map(({ seed, result, shots, intercepted, impacts, damage, goals }) => ({ seed, result, shots, intercepted, impacts, damage, goals })) };
  }
}

const latest = read('caida-actual64.json'), reference = read('caida-prioridad64.json');
summary.headVerification = { commit: latest.commit, reference: reference.commit, scenarios: {} };
for (const [k, s] of Object.entries(reference.scenarios)) {
  const equal = ['results', 'units', 'failures'].every(part => JSON.stringify(s[part]) === JSON.stringify(latest.scenarios[k][part]));
  if (!equal) throw Error(`El head avanzó y cambió ${k}`);
  summary.headVerification.scenarios[k] = { identicalResultsUnitsFailures: equal };
}
const arrivals = read('caida64-arrivals.json');
summary.arrivals10 = { commit: arrivals.commit, scenarios: {} };
for (const [k, s] of Object.entries(arrivals.scenarios)) {
  const sorted = [...s.arrivals].sort((a, b) => b.horizontalError - a.horizontalError);
  summary.arrivals10.scenarios[k] = { accepted: s.arrivals.length, horizontalErrorOver1Km: sorted.filter(a => a.horizontalError > 1).length, largest: sorted.slice(0, 5) };
}
writeFileSync(out, JSON.stringify(summary, null, 2) + '\n');
console.log(`Evidencia: ${out}`);
