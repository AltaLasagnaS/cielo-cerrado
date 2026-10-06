import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const dir = resolve(process.argv[2] ?? '/tmp');
const target = resolve(process.argv[3] ?? 'experimentos/auditoria-64/data/ventanas.json');
const read = name => JSON.parse(readFileSync(resolve(dir, name), 'utf8'));
const output = { sampleSeconds: 1, phase: 'after-step', runs: 40, seed: 1, versions: {} };
for (const version of ['base59', 'pista64', 'red64', 'prioridad64']) {
  const raw = read(`caida-windows-${version}.json`), reference = read(`caida-${version}.json`);
  const summary = { commit: raw.commit, scenarios: {} }; output.versions[version] = summary;
  for (const [key, rec] of Object.entries(raw.scenarios)) {
    if (JSON.stringify(rec.results) !== JSON.stringify(reference.scenarios[key].results)) throw Error('La sonda cambió resultados');
    if (rec.windows.length !== 40) throw Error('No se completaron las semillas');
    const counts = {}, episodes = rec.windows.flatMap(w => w.episodes), outcomes = {};
    for (const w of rec.windows) for (const [unit, row] of Object.entries(w.units)) {
      const c = counts[unit] ??= {};
      for (const [reason, value] of Object.entries(row)) c[reason] = (c[reason] || 0) + value;
    }
    for (const e of episodes) {
      const o = [...new Set(e.blockers.map(b => b.outcome))].sort().join('+'); outcomes[o] = (outcomes[o] || 0) + 1;
    }
    for (const c of Object.values(counts)) {
      const { queries, ...reasons } = c;
      if (Object.values(reasons).reduce((s, n) => s + n, 0) !== queries) throw Error('Contadores inconsistentes');
    }
    summary.scenarios[key] = { normalResultsIdentical: true, counts, blockedNights: new Set(episodes.map(e => e.seed)).size,
      episodeCount: episodes.length, outcomes, episodes };
  }
}
writeFileSync(target, JSON.stringify(output, null, 2) + '\n');
console.log(`Ventanas: ${target}`);
