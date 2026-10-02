// Suite principal:  node tests/run.cjs   (o: npm test)
// Abre index.html por file:// en Chromium headless y verifica:
//  - cero errores de consola (se ignoran las fuentes de Google),
//  - que los escenarios terminan corriendo step(0.25),
//  - golden: el modelo clásico da exactamente lo mismo que el index.html original,
//  - que todas las fichas, comparadores, calibración y ayuda abren sin errores.
'use strict';
const fs = require('fs');
const path = require('path');
const { openPage, fresh, runScenario, coverageHash, GOLDEN_RUNS, GOLDEN_COV, goldenName } = require('./lib.cjs');

const ROOT = path.join(__dirname, '..');
const only = process.argv.slice(2).filter(a => !a.startsWith('-'));
const results = [];
async function test(name, fn) {
  if (only.length && !only.some(o => name.includes(o))) return;
  const t0 = Date.now();
  try { await fn(); results.push([true, name]); console.log('  ok   ' + name + ' (' + (Date.now() - t0) + ' ms)'); }
  catch (e) { results.push([false, name, e]); console.log('  FALLA ' + name + '\n        ' + String(e && e.message || e).split('\n').join('\n        ')); }
}
function assert(c, msg) { if (!c) throw new Error(msg || 'aserción fallida'); }
function firstDiff(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) return i;
  return -1;
}

// Pruebas extra de otras etapas (cada archivo exporta async (ctx) => {...}).
const EXTRA = fs.readdirSync(__dirname).filter(f => /^t-.*\.cjs$/.test(f)).sort();

(async () => {
  const { browser, page, errors } = await openPage(path.join(ROOT, 'index.html'));
  const ctx = { page, errors, test, assert, fresh, runScenario, ROOT };

  await test('carga sin errores de consola', async () => {
    await page.waitForTimeout(400);
    assert(!errors.length, errors.join('\n'));
  });

  for (const key of ['mb_noche', 'gb_ruso']) {
    await test('escenario ' + key + ' termina', async () => {
      await fresh(page);
      const r = await runScenario(page, { key, seed: 11 });
      assert(r.ended, 'no terminó: t=' + r.t);
      assert(r.stats.launched > 0, 'no lanzó amenazas');
      assert(!errors.length, errors.join('\n'));
    });
  }

  for (const c of GOLDEN_RUNS) {
    await test('golden ' + goldenName(c), async () => {
      const g = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden', goldenName(c) + '.json'), 'utf8'));
      await fresh(page);
      const r = await runScenario(page, { ...c, model: 'clasico' });
      assert(JSON.stringify(r.stats) === JSON.stringify(g.stats), 'stats distintas:\n  golden ' + JSON.stringify(g.stats) + '\n  ahora  ' + JSON.stringify(r.stats));
      const i = firstDiff(g.log, r.log);
      assert(i < 0, 'registro distinto en la línea ' + i + ':\n  golden ' + JSON.stringify(g.log[i]) + '\n  ahora  ' + JSON.stringify(r.log[i]));
      assert(JSON.stringify(r.units) === JSON.stringify(g.units), 'estado final de unidades distinto');
      assert(r.t === g.t && r.steps === g.steps, 'duración distinta');
      await page.evaluate(() => { document.getElementById('defView').checked = false; });
    });
  }

  await test('golden cobertura', async () => {
    const g = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden', 'coverage.json'), 'utf8'));
    for (let i = 0; i < GOLDEN_COV.length; i++) {
      await fresh(page);
      const r = await coverageHash(page, { ...GOLDEN_COV[i], model: 'clasico' });
      assert(JSON.stringify(r) === JSON.stringify(g[i]), 'cobertura distinta:\n  golden ' + JSON.stringify(g[i]) + '\n  ahora  ' + JSON.stringify(r));
    }
  });

  await test('abren todas las fichas, comparadores, calibración y ayuda', async () => {
    await fresh(page);
    const n0 = errors.length;
    await page.click('.tabs button[data-tab="cat"]');
    const items = await page.$$eval('#tab-cat [data-f]', els => els.map(e => e.dataset.f));
    assert(items.length >= 30, 'pocas fichas en el catálogo: ' + items.length);
    const open = async (sel, what) => {
      await page.click(sel);
      const ok = await page.evaluate(() => !document.getElementById('modal').hidden && document.querySelector('#sheet h2') && document.querySelector('#sheet h2').textContent.length > 0);
      assert(ok, 'no abrió: ' + what);
      await page.click('#sheet .x');
      assert(await page.evaluate(() => document.getElementById('modal').hidden), 'no cerró: ' + what);
    };
    for (const f of items) await open(`#tab-cat [data-f="${f}"]`, f);
    await open('#cmpT', 'comparar amenazas'); await open('#cmpD', 'comparar defensas'); await open('#calB', 'calibración');
    await open('#helpBtn', 'ayuda');
    // los botones "i" de las pestañas de defensa y guerra electrónica
    await page.click('.tabs button[data-tab="def"]');
    for (const k of await page.$$eval('#tab-def [data-info]', els => els.map(e => e.dataset.info))) await open(`#tab-def [data-info="${k}"]`, 'i ' + k);
    await page.click('.tabs button[data-tab="ew"]');
    for (const k of await page.$$eval('#tab-ew [data-info]', els => els.map(e => e.dataset.info))) await open(`#tab-ew [data-info="${k}"]`, 'i ' + k);
    assert(errors.length === n0, errors.slice(n0).join('\n'));
  });

  for (const f of EXTRA) await require(path.join(__dirname, f))(ctx);

  await test('sin errores de consola al final', async () => { assert(!errors.length, errors.join('\n')); });
  await browser.close();
  const bad = results.filter(r => !r[0]);
  console.log('\n' + (results.length - bad.length) + '/' + results.length + ' pruebas ok' + (bad.length ? ' — FALLARON: ' + bad.map(b => b[1]).join(', ') : ''));
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
