import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { startSourceServer } from './serve.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = await startSourceServer(fileURLToPath(new URL('../../', import.meta.url)));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route(/^https?:\/\//, route => route.request().url().startsWith(server.url + '/') ? route.continue() : route.abort());
  await page.goto(server.url); await page.waitForFunction(() => window.__dbg);
  const select = async kind => page.evaluate(kind => {
    window.__dbg.loadScenario('mb_noche');
    const S = window.__S, key = { def: 'defs', obj: 'objs', salvo: 'salvos', jam: 'jams' }[kind];
    const item = kind === 'def' ? S.setup.defs.find(u => window.DEFENSES_REF[u.type].sam) : S.setup[key][0];
    S.sel = { kind, id: item.id }; window.__dbg.renderAll();
    return { key, id: item.id, before: JSON.stringify(S.setup) };
  }, kind);
  await select('def');
  for (const [id, field] of [['sMag', 'mag'], ['sRes', 'reserve'], ['sSal', 'salvo']]) {
    const input = page.locator('#' + id), original = await input.inputValue();
    for (const bad of ['1.5', '', '-1', '9999']) {
      await input.fill(bad);
      assert.equal(await input.getAttribute('aria-invalid'), 'true');
      assert.equal(await page.locator('#' + id + '-error').isVisible(), true);
      assert.equal(await page.evaluate(field => window.__S.setup.defs.find(u => u.id === window.__S.sel.id)[field], field), Number(original));
      await input.blur(); assert.equal(await input.inputValue(), original);
      assert.match(await page.locator('#' + id + '-error').innerText(), /Se conservó el último valor válido/);
    }
    await input.fill('2'); await input.blur();
    assert.equal(await page.locator('#' + id + '-error').isVisible(), false);
  }
  await page.locator('[data-tab="atk"]').click();
  const count = await page.locator('#aCount').inputValue();
  await page.locator('#aCount').fill('1.5');
  assert.match(await page.locator('#aCount-error').innerText(), /sin decimales/);
  assert.equal(await page.evaluate(() => window.__S.atk.count), Number(count));
  await page.locator('#aCount').blur(); assert.equal(await page.locator('#aCount').inputValue(), count);
  await page.locator('#aCount').fill('3');
  assert.equal(await page.evaluate(() => window.__S.atk.count), 3);

  await page.locator('[data-tab="def"]').click(); await select('def');
  assert.match(await page.locator('#selCard').innerText(), /Enlace técnico de pistas/i);
  assert.match(await page.locator('#selCard').innerText(), /Coordinación C2 \(general\)/i);
  const c2 = await page.evaluate(() => window.__S.c2);
  await page.locator('#sLink').uncheck(); assert.equal(await page.evaluate(() => window.__S.c2), c2);
  assert.match(await page.locator('#selCard').innerText(), /Conserva su sensor propio/);
  await page.locator('#optC2').selectOption('desconectada');
  assert.equal(await page.locator('#sLink').isChecked(), false, 'C2 no enciende el datalink');

  // Delete respeta campos, selectores, contenido editable (incluidos hijos) y ventanas.
  const item = await select('def');
  for (const selector of ['#sMag', '#optC2']) {
    await page.locator(selector).focus(); await page.keyboard.press('Delete');
    assert.equal(await page.evaluate(() => window.__S.setup.defs.some(u => u.id === window.__S.sel.id)), true);
  }
  await page.evaluate(() => {
    const edit = document.createElement('div'); edit.id = 'editableTest'; edit.contentEditable = 'true';
    edit.innerHTML = '<span>Texto editable</span>'; document.body.append(edit); edit.querySelector('span').tabIndex = 0;
  });
  await page.locator('#editableTest span').focus(); await page.keyboard.press('Delete');
  assert.equal(await page.evaluate(id => window.__S.setup.defs.some(u => u.id === id), item.id), true);
  await page.evaluate(() => document.querySelector('#editableTest').remove());
  await page.locator('#sInfo').click(); await page.keyboard.press('Delete');
  assert.equal(await page.evaluate(id => window.__S.setup.defs.some(u => u.id === id), item.id), true);
  await page.keyboard.press('Escape');

  for (const kind of ['def', 'jam', 'salvo', 'obj']) {
    const item = await select(kind);
    if (kind === 'obj') await page.evaluate(id => { window.__S.setup.salvos[0].targetObj = id; }, item.id);
    await page.locator('#scenario').blur(); await page.evaluate(() => document.activeElement?.blur());
    await page.keyboard.press('Delete');
    assert.equal(await page.evaluate(({ key, id }) => window.__S.setup[key].some(u => u.id === id), item), false, kind);
    assert.equal(await page.evaluate(() => window.__S.sel), null);
    if (kind === 'obj') assert.equal(await page.evaluate(() => window.__S.setup.salvos[0].targetObj), null);
    const after = await page.evaluate(() => JSON.stringify(window.__S.setup));
    await page.keyboard.press('Delete'); assert.equal(await page.evaluate(() => JSON.stringify(window.__S.setup)), after, 'sin selección');
  }
  const running = await select('def');
  await page.locator('#play').click(); await page.locator('#play').click();
  assert.equal(await page.evaluate(() => window.__S.started), true);
  await page.keyboard.press('Delete');
  assert.equal(await page.evaluate(id => window.__S.setup.defs.some(u => u.id === id), running.id), true, 'corrida pausada');
  await page.locator('#play').click(); await page.keyboard.press('Delete');
  assert.equal(await page.evaluate(id => window.__S.units.some(u => u.id === id), running.id), true, 'corrida activa');
  await page.locator('#reset').click(); await select('def');
  const protectedMC = await page.evaluate(async () => {
    const { createMonteCarlo } = await import('/sim/montecarlo.js');
    const before = JSON.stringify(window.__S.setup), mc = createMonteCarlo({ runs: 10, sample: false });
    try { document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true })); return JSON.stringify(window.__S.setup) === before; }
    finally { mc.cancel(); }
  });
  assert.equal(protectedMC, true, 'Monte Carlo antes del primer tramo también bloquea Delete');
  assert.deepEqual(errors, []);
  console.log('UX: enteros con mensajes, C2/datalink y Delete protegido en edición/corrida/Monte Carlo OK.');
} finally { await browser.close(); await server.close(); }
