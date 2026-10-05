// Con npm run dev en marcha:
// PLAYWRIGHT_MODULE=/ruta/a/playwright/index.mjs CHROMIUM_PATH=/usr/bin/chromium node tests/ui.browser.mjs
// Si Playwright está instalado normalmente, esas variables son opcionales.
import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const url = process.env.TEST_URL || 'http://127.0.0.1:8000';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => route.request().url().startsWith(url) ? route.continue() : route.abort());
  await page.goto(url);
  await page.waitForFunction(() => window.__dbg);

  await page.evaluate(() => {
    const u = window.__S.setup.defs.find(u => window.DEFENSES_REF[u.type].sam);
    window.__S.sel = { kind: 'def', id: u.id }; window.__dbg.renderAll();
  });
  const original = await page.locator('#sMag').inputValue();
  for (const value of ['-1', '201', '1.5', '']) {
    await page.locator('#sMag').fill(value); await page.locator('#sMag').press('Tab');
    assert.equal(await page.locator('#sMag').inputValue(), original);
    assert.equal(await page.evaluate(async () => {
      const { exportScenario, validateScenario } = await import('/sim/scenario-io.js');
      return validateScenario(exportScenario()).ok;
    }), true, 'una edición inválida no rompe Guardar/Cargar');
  }
  await page.locator('#sMag').fill('12'); await page.locator('#sMag').press('Tab');
  assert.equal(await page.evaluate(() => window.__S.setup.defs.find(u => u.id === window.__S.sel.id).mag), 12);

  await page.locator('[data-tab="atk"]').click();
  const count = await page.locator('#aCount').inputValue();
  await page.locator('#aCount').fill('-1'); await page.locator('#aCount').press('Tab');
  assert.equal(await page.locator('#aCount').inputValue(), count);
  await page.locator('#aTime').fill('7201'); await page.locator('#aTime').press('Tab');
  assert.equal(await page.locator('#aTime').inputValue(), '0');

  const expected = await page.evaluate(async () => {
    const { addSalvo } = await import('/sim/setup.js');
    const { runMonteCarlo } = await import('/sim/montecarlo.js');
    window.__dbg.loadScenario('mb_vacio');
    addSalvo({ type: 'shahed', count: 1, pts: [[10, 10], [11, 10]] });
    return runMonteCarlo({ runs: 10, sample: false, seed: 1 }).metrics;
  });
  await page.locator('#mcBtn').click();
  await page.locator('#mcSeed').fill('1.5'); await page.locator('#mcGo').click();
  assert.equal(await page.locator('#mcStop').count(), 0, 'no aceptar semillas fraccionarias');
  await page.locator('#mcSeed').fill('1'); await page.locator('#mcRuns').selectOption('10');
  await page.locator('#mcSample').uncheck();
  const locked = await page.evaluate(async () => {
    const { togglePlay } = await import('/ui/controls.js');
    document.querySelector('#mcGo').click();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    const withModal = window.__S.running;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    togglePlay();
    return { withModal, afterClose: window.__S.running };
  });
  assert.deepEqual(locked, { withModal: false, afterClose: false });
  await page.waitForFunction(async () => !(await import('/sim/montecarlo.js')).isMonteCarloRunning());
  if (await page.locator('#modal').isVisible()) await page.locator('#sheet .x').click();

  // Volver a correr por la interfaz, sin interferencias, debe producir la misma estadística.
  await page.locator('#mcBtn').click(); await page.locator('#mcGo').click();
  await page.waitForFunction(() => document.querySelector('#sheet h2')?.textContent === 'Debrief Monte Carlo');
  const text = await page.locator('#sheet').innerText();
  assert.match(text, /10 corridas/);
  assert.match(text, /valores probables/);
  const row = page.locator('#sheet tr').filter({ has: page.locator('td', { hasText: /^Impactos en el blanco$/ }) });
  const cells = await row.locator('td').allTextContents();
  const format = value => value.toLocaleString('es-AR', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
  assert.deepEqual(cells.slice(1, 5), [expected.impacts.mean, expected.impacts.p10, expected.impacts.p50, expected.impacts.p90].map(format));
  await page.locator('#sheet .x').click();
  await page.evaluate(() => { window.__S.setup.salvos[0].tStart = Infinity; window.__S.setup.salvos[0].sync = false; });
  await page.locator('#mcBtn').click(); await page.locator('#mcGo').click();
  await page.waitForFunction(() => document.querySelector('#sheet h2')?.textContent === 'Monte Carlo detenido');
  assert.match(await page.locator('#sheet').innerText(), /inválido/);
  assert.equal(await page.evaluate(async () => (await import('/sim/montecarlo.js')).isMonteCarloRunning()), false);
  await page.locator('#sheet .x').click();
  const setup = await page.evaluate(() => JSON.stringify(window.__S.setup));
  await page.locator('[data-tab="edu"]').click();
  await page.locator('#tab-edu [data-concept="pulseIntegration"]').click();
  await page.locator('#pulseN').selectOption('8');
  await page.locator('#pulseM').selectOption('3');
  await page.locator('#pulseDistance').fill('100');
  assert.match(await page.locator('#pulsePd').innerText(), /50,0% con 8 pulsos/);
  await page.locator('#pulseDistance').press(' ');
  assert.equal(await page.evaluate(() => window.__S.running), false, 'el ejemplo no inicia la simulación');
  await page.locator('#pulseDistance').press('Escape');
  await page.locator('#modal').waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => JSON.stringify(window.__S.setup)), setup, 'el ejemplo no altera el escenario');
  // regla de distancias (UX06): mide entre dos toques, no mueve nada y Escape sale
  const before = await page.evaluate(() => JSON.stringify(window.__S.setup));
  await page.locator('#zrule').click();
  const cb = await page.locator('canvas').first().boundingBox();
  await page.mouse.click(cb.x + 300, cb.y + 300); await page.mouse.click(cb.x + 600, cb.y + 300);
  assert.match(await page.locator('#modebar').innerText(), /Distancia horizontal:\s+[\d.]+ km/);
  assert.equal(await page.evaluate(() => JSON.stringify(window.__S.setup)), before, 'medir no cambia el escenario');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => window.__S.mode), 'select');
  assert.deepEqual(errors, []);
  console.log('Interfaz: valores numéricos, atajos, Monte Carlo, Academia de pulsos y regla OK');
} finally { await browser.close(); }
