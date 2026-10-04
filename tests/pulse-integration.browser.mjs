// TEST_URL apunta a /src/ o al bundle index.html servido por HTTP.
// PLAYWRIGHT_MODULE y CHROMIUM_PATH pueden indicar una instalación local de Chromium.
import assert from 'node:assert/strict';
import { pdRel } from '../src/physics/radar.js';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const url = process.env.TEST_URL || 'http://127.0.0.1:8000';
  const origin = new URL(url).origin, errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:\/\//, route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await page.goto(url);
  await page.waitForFunction(() => window.__dbg);
  const before = await page.evaluate(() => JSON.stringify(window.__S.setup));
  await page.locator('[data-tab="edu"]').click();
  await page.locator('#tab-edu [data-concept="pulseIntegration"]').click();
  await page.locator('#pulseN').waitFor({ state: 'visible' });
  assert.match(await page.locator('#sheet').innerText(), /Ejemplo hipotético/);
  assert.match(await page.locator('#sheet').innerText(), /por falta de datos/);
  let cases = 0;
  for (const model of [1, 3]) for (const pulses of [1, 8, 128]) {
    await page.locator('#pulseM').selectOption(String(model));
    await page.locator('#pulseN').selectOption(String(pulses));
    for (const distance of [80, 100, 120]) {
      await page.locator('#pulseDistance').fill(String(distance));
      const want = (100 * pdRel(model, (distance / 100) ** -4, pulses)).toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
      assert.match(await page.locator('#pulsePd').innerText(), new RegExp(`Pd por barrido: ${want}% con ${pulses} pulsos`));
      assert.equal(await page.locator('#pulseDistanceV').innerText(), distance + '%');
      const anchor = page.locator('#pulseTable tbody tr').filter({ hasText: /^100%/ });
      assert.deepEqual(await anchor.locator('td').allTextContents(), ['100%', '50,0%', '50,0%']);
      cases++;
    }
  }
  if (process.env.PULSE_SCREENSHOT) await page.screenshot({ path: process.env.PULSE_SCREENSHOT });
  await page.keyboard.press('Escape');
  await page.locator('#pulseN').waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => JSON.stringify(window.__S.setup)), before, 'el ejemplo no altera el escenario');
  assert.equal(await page.evaluate(() => window.__S.started), false);
  assert.deepEqual(errors, []);
  console.log(`Academia de pulsos: ${cases} combinaciones, ancla 50%, escenario intacto y sin errores JavaScript (${url}).`);
} finally { await browser.close(); }
