import { cases, cleanup } from './cases.mjs';
import { provenance, save } from './context.mjs';
const only = process.argv.find(a => a.startsWith('--only='))?.slice(7);
const selected = only ? cases.filter(c => c.id.includes(only) || c.audit === only) : cases;
if (!selected.length) throw Error('Ningún caso corresponde al filtro');
const rows = [];
for (const c of selected) {
  const { run, ...description } = c;
  const began = performance.now();
  try {
    const r = await run();
    const status = r.designQuestion ? 'DESIGN_REVIEW' : r.holds ? 'HOLDS' : 'VIOLATED';
    rows.push({ ...description, ...r, status, milliseconds: performance.now() - began });
    console.log(`${status.padEnd(13)} ${c.id}`);
  } catch (e) {
    rows.push({ ...description, status: 'ERROR', error: e.stack, milliseconds: performance.now() - began });
    console.error(`ERROR ${c.id}: ${e.message}`);
  } finally { cleanup(); }
}
const summary = Object.fromEntries(['HOLDS', 'VIOLATED', 'DESIGN_REVIEW', 'ERROR'].map(s => [s, rows.filter(r => r.status === s).length]));
save('node.json', { provenance: provenance(), summary, cases: rows });
console.log(JSON.stringify(summary));
// 0: todas las invariantes comprobadas se sostienen; 2: violaciones del producto;
// 1: falló el diagnóstico. No convertir bugs conocidos en pruebas verdes.
process.exitCode = summary.ERROR ? 1 : summary.VIOLATED ? 2 : 0;
