import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const packageRoot = fileURLToPath(new URL('./', import.meta.url));
const artifacts = process.env.BROWSER_ARTIFACTS || join(packageRoot, 'artifacts');
const standaloneUrl = process.env.STANDALONE_URL || new URL('../../index.html', import.meta.url).href;
const allowedOrigin = new URL(standaloneUrl).protocol === 'http:' ? new URL(standaloneUrl).origin : null;
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: true, args: ['--no-sandbox'] });
let context, page;
let current = 'arranque';
const checks = [];
const errors = [];
const blocked = [];
try {
  context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  await context.tracing.start({ screenshots: true, snapshots: true });
  // Funcionalidad sin red. Las tipografías externas fallan de forma deliberada, no se ignoran errores JS.
  await context.route(/^https?:\/\//, route => {
    const url = route.request().url();
    if (allowedOrigin && url.startsWith(allowedOrigin + '/')) return route.continue();
    blocked.push(url); return route.abort();
  });
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  const check = async (name, action) => {
    current = name; await action(); checks.push(name); console.log(`OK: ${name}`);
  };

  await check('index.html autocontenido abre y dibuja un mapa sin red externa', async () => {
    await page.goto(standaloneUrl);
    await page.waitForFunction(() => window.__dbg && window.__S.setup.defs.length > 0);
    await page.waitForFunction(() => {
      const canvas = document.querySelector('#map');
      return canvas.width > 0 && canvas.height > 0 && canvas.getContext('2d')
        .getImageData(canvas.width >> 1, canvas.height >> 1, 1, 1).data[3] > 0;
    });
    assert.ok((await page.locator('#scenario option').count()) >= 6);
    assert.ok(await page.locator('#play').isVisible());
  });

  await check('pestañas, ficha de catálogo, Academia y cierre por Escape', async () => {
    for (const tab of ['def', 'atk', 'ew', 'cat', 'edu']) {
      await page.locator(`[data-tab="${tab}"]`).click();
      assert.equal(await page.locator(`#tab-${tab}`).isVisible(), true);
    }
    await page.locator('#tab-edu [data-concept]').first().click();
    assert.equal(await page.locator('#modal').isVisible(), true);
    assert.ok((await page.locator('#sheet h2').textContent()).trim());
    await page.keyboard.press('Escape'); assert.equal(await page.locator('#modal').isVisible(), false);
    await page.locator('[data-tab="cat"]').click();
    await page.locator('#tab-cat [data-f="def:patriot"]').click();
    assert.match(await page.locator('#sheet').innerText(), /Confianza de los datos/i);
    await page.locator('#sheet .x').click();
  });

  await check('briefing y selección de escenario por el control real', async () => {
    await page.locator('#scenario').selectOption('kh_umpk');
    assert.equal(await page.locator('#modal').isVisible(), true);
    assert.match(await page.locator('#sheet').innerText(), /Járkov/);
    assert.ok((await page.evaluate(() => window.__S.setup.defs.length)) > 0);
    await page.locator('#sheet .x').click();
    await page.locator('#briefBtn').click(); assert.equal(await page.locator('#modal').isVisible(), true);
    await page.keyboard.press('Escape');
  });

  await check('cantidades inválidas no llegan al estado del archivo compilado', async () => {
    await page.evaluate(() => {
      const u = window.__S.setup.defs.find(row => window.DEFENSES_REF[row.type].sam);
      window.__S.sel = { kind: 'def', id: u.id }; window.__dbg.renderAll();
    });
    for (const [selector, field] of [['#sMag', 'mag'], ['#sRes', 'reserve'], ['#sSal', 'salvo']]) {
      const previous = await page.locator(selector).inputValue();
      for (const value of ['', '-1', '1.5']) {
        await page.locator(selector).fill(value); await page.locator(selector).press('Tab');
        assert.equal(await page.locator(selector).inputValue(), previous);
        assert.equal(await page.evaluate(field => window.__S.setup.defs.find(row => row.id === window.__S.sel.id)[field], field), Number(previous));
      }
    }
    await page.locator('#sMag').fill('12'); await page.locator('#sMag').press('Tab');
    assert.equal(await page.evaluate(() => window.__S.setup.defs.find(row => row.id === window.__S.sel.id).mag), 12);
  });

  await check('guardar y cargar JSON mediante descarga/input, sin perder recursos', async () => {
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#saveScen').click();
    const download = await downloadPromise;
    const bytes = await readFile(await download.path());
    const saved = JSON.parse(bytes.toString('utf8'));
    assert.equal(saved.format, 'cielo-cerrado/escenario');
    assert.ok(saved.setup.defs.some(row => row.mag === 12));
    const expected = saved.setup.defs.map(({ type, x, y, mag, reserve, salvo }) => ({ type, x, y, mag, reserve, salvo }));
    await page.locator('#scenario').selectOption('mb_noche');
    await page.locator('#sheet .x').click();
    await page.locator('#loadScen').setInputFiles({ name: 'browser-roundtrip.json', mimeType: 'application/json', buffer: bytes });
    await page.waitForFunction(() => document.querySelector('#scenario').value === 'file');
    const actual = await page.evaluate(() => window.__S.setup.defs.map(({ type, x, y, mag, reserve, salvo }) => ({ type, x, y, mag, reserve, salvo })));
    assert.deepEqual(actual, expected);
    const before = await page.evaluate(() => JSON.stringify(window.__S.setup));
    const invalid = structuredClone(saved); invalid.setup.defs.find(row => row.mag !== undefined).mag = 1.5;
    await page.locator('#loadScen').setInputFiles({ name: 'browser-invalid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) });
    await page.waitForFunction(() => document.querySelector('#sheet h2')?.textContent === 'No se pudo cargar el escenario');
    assert.equal(await page.evaluate(() => JSON.stringify(window.__S.setup)), before);
    await page.locator('#sheet .x').click();
  });

  await check('iniciar, pausar y reiniciar sin alterar preparación', async () => {
    const setup = await page.evaluate(() => JSON.stringify(window.__S.setup));
    await page.locator('#speeds [data-s="1"]').click();
    await page.locator('#play').click();
    await page.waitForFunction(() => window.__S.started && window.__S.running && window.__S.t > 0);
    await page.locator('#play').click();
    assert.equal(await page.evaluate(() => window.__S.running), false);
    const paused = await page.evaluate(() => window.__S.t);
    await page.evaluate(() => new Promise(accept => requestAnimationFrame(() => requestAnimationFrame(accept))));
    assert.equal(await page.evaluate(() => window.__S.t), paused);
    await page.locator('#reset').click();
    assert.equal(await page.evaluate(() => window.__S.started), false);
    assert.equal(await page.evaluate(() => window.__S.t), 0);
    assert.equal(await page.evaluate(() => JSON.stringify(window.__S.setup)), setup);
  });

  await check('ayuda, cobertura y vista del defensor sin errores JavaScript', async () => {
    await page.locator('#defView').check(); await page.locator('#defView').uncheck();
    await page.locator('#helpBtn').click(); assert.match(await page.locator('#sheet h2').innerText(), /Cómo se usa/);
    await page.keyboard.press('Escape'); assert.equal(await page.locator('#modal').isVisible(), false);
    await page.evaluate(() => window.__dbg.computeCov());
    assert.deepEqual(errors, [], 'no esconder excepciones del juego');
  });
  await context.tracing.stop();
  await writeFile(join(artifacts, 'standalone-results.json'), JSON.stringify({ passed: checks.length, checks,
    protocol: new URL(standaloneUrl).protocol, javascriptErrors: errors, blockedExternalRequests: blocked.length }, null, 2));
  console.log(`Autocontenido: ${checks.length} comprobaciones, sin red ni errores JavaScript.`);
} catch (error) {
  if (page) await page.screenshot({ path: join(artifacts, 'standalone-failure.png'), fullPage: true }).catch(() => {});
  if (context) await context.tracing.stop({ path: join(artifacts, 'standalone-trace.zip') }).catch(() => {});
  await writeFile(join(artifacts, 'standalone-failure.json'), JSON.stringify({ failedCheck: current, passed: checks,
    error: String(error), javascriptErrors: errors }, null, 2));
  throw error;
} finally { await browser.close(); }
