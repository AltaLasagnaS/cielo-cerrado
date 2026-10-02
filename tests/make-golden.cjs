// Genera los archivos golden a partir del index.html ORIGINAL (rama main, commit 917aefe).
// Uso:  git show main:index.html > /tmp/original.html
//       node tests/make-golden.cjs /tmp/original.html
// Solo hace falta volver a correrlo si se decide cambiar a propósito el modelo clásico (no debería).
'use strict';
const fs = require('fs');
const path = require('path');
const { openPage, fresh, runScenario, coverageHash, GOLDEN_RUNS, GOLDEN_COV, goldenName } = require('./lib.cjs');

(async () => {
  const src = process.argv[2];
  if (!src) { console.error('Uso: node tests/make-golden.cjs <ruta al index.html original>'); process.exit(2); }
  const out = path.join(__dirname, 'golden');
  fs.mkdirSync(out, { recursive: true });
  const { browser, page, errors } = await openPage(src);
  for (const c of GOLDEN_RUNS) {
    await fresh(page);
    const r = await runScenario(page, c);
    if (!r.ended) throw new Error('El escenario no terminó: ' + goldenName(c));
    fs.writeFileSync(path.join(out, goldenName(c) + '.json'), JSON.stringify(r, null, 1));
    await page.evaluate(() => { document.getElementById('defView').checked = false; });
    console.log('golden', goldenName(c), 't=' + r.t, 'log=' + r.log.length, JSON.stringify(r.stats));
  }
  const cov = [];
  for (const c of GOLDEN_COV) { await fresh(page); cov.push(await coverageHash(page, c)); }
  fs.writeFileSync(path.join(out, 'coverage.json'), JSON.stringify(cov, null, 1));
  console.log('cobertura', JSON.stringify(cov));
  if (errors.length) { console.error('Errores en la página original:\n' + errors.join('\n')); process.exitCode = 1; }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
