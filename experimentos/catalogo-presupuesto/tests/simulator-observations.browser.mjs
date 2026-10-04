import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Read-only repository diagnosis in a disposable browser page. No source edits.
// This observes the current baseline, NOT acceptance of the proposed Delete feature.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.TEST_SIM_URL || 'http://127.0.0.1:8768/index.html';
const origin = new URL(url).origin;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  await page.goto(url);
  await page.waitForFunction(() => window.__S && window.__dbg);
  const original = await page.evaluate(() => {
    const S = window.__S;
    const unit = S.setup.defs.find(row => window.DEFENSES_REF[row.type].sam);
    S.sel = { kind: 'def', id: unit.id }; window.__dbg.renderAll();
    return { id: unit.id, mag: unit.mag, reserve: unit.reserve, salvo: unit.salvo };
  });
  for (const [selector, field] of [['#sMag', 'mag'], ['#sRes', 'reserve'], ['#sSal', 'salvo']]) {
    await page.locator(selector).fill('1.5');
    assert.equal(await page.locator(selector).evaluate(element => element.validity.stepMismatch), true);
    assert.equal(await page.evaluate(({ id, field }) => window.__S.setup.defs.find(row => row.id === id)[field],
      { id: original.id, field }), original[field], `${field}: no compromete una fracción`);
    await page.locator(selector).blur();
    assert.equal(Number(await page.locator(selector).inputValue()), original[field], `${field}: recupera el valor válido`);
  }
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#saveScen').click();
  const downloaded = await downloadPromise;
  const saved = JSON.parse(await readFile(await downloaded.path(), 'utf8'));
  assert.ok(saved.setup.defs.every(row => ['mag', 'reserve', 'salvo'].every(field => row[field] === undefined || Number.isInteger(row[field]))));
  saved.setup.defs[0].mag = 1.5;
  const imported = await page.evaluate(raw => window.__dbg.loadFromObject(raw, 'diagnostico-fraccion.json'), saved);
  assert.equal(imported.ok, false, 'rechaza una fracción importada');
  await page.keyboard.press('Escape');
  await page.locator('#map').click({ position: { x: 15, y: 300 } }); // Below the overlay toolbar, outside numeric controls.
  await page.evaluate(id => { window.__S.sel = { kind: 'def', id }; window.__dbg.renderAll(); }, original.id);
  const beforeDelete = await page.evaluate(() => window.__S.setup.defs.length);
  await page.keyboard.press('Delete');
  assert.equal(await page.evaluate(() => window.__S.setup.defs.length), beforeDelete,
    'baseline observado: Delete todavía no borra, no darlo por implementado');
  assert.deepEqual(errors, []);
  console.log('Observado: mag/reserve/salvo no guardan 1,5; blur restaura e importación lo rechaza.');
  console.log('Observado: Delete todavía no elimina selección. Sin cambios al código del simulador.');
} finally { await browser.close(); }
