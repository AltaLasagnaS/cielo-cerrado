import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { startSourceServer } from '../../../tests/browser/serve.mjs';
import { extendedPortCampaignDefinition } from '../data/port-campaign-extended.mjs';
import { createOperations, saveOperations, loadOperations } from '../lib/operations.mjs';

const server = await startSourceServer(fileURLToPath(new URL('../../../', import.meta.url)));
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined,
    headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage(), errors = [], external = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', route => {
    if (route.request().url().startsWith(server.url + '/')) return route.continue();
    external.push(route.request().url()); return route.abort();
  });
  await page.goto(server.url);
  await page.waitForFunction(() => window.__dbg);
  if (await page.locator('#modal').isVisible()) await page.locator('#sheet .x').click();
  await page.click('#campBtn');
  const op = createOperations(extendedPortCampaignDefinition(['buk', 'vhf', 'iris']));
  await page.locator('#cLoad').setInputFiles({ name: 'odesa-tres-guardias.json',
    mimeType: 'application/json', buffer: Buffer.from(saveOperations(op)) });
  await page.waitForSelector('#cStart');
  for (let stage = 0; stage < 3; stage++) {
    await page.click('#cStart');
    assert.equal(await page.locator('#view').inputValue(), 'def');
    await page.evaluate(() => {
      // Advance the same native controller synchronously, avoiding a long wall-clock wait.
      window.__S.running = false;
      let ticks = 0;
      while (window.__dbg.campaignStep()) if (++ticks > 30000) throw Error('Guardia no termina');
    });
    assert.match(await page.locator('#sheet').innerText(), /Parte de cierre/);
    await page.click('#cNext');
    if (stage === 1) assert.match(await page.locator('#sheet').innerText(), /Tercera guardia/);
  }
  assert.match(await page.locator('#sheet').innerText(), /Campaña terminada/);
  const download = page.waitForEvent('download');
  await page.click('#cSave');
  const saved = await readFile(await (await download).path(), 'utf8');
  const restored = loadOperations(saved, 'ua');
  assert.equal(restored.phase, 'finished');
  assert.equal(restored.history.length, 3);
  assert.equal(restored.resources.balance, op.resources.balance);
  assert.ok(restored.resources.inventory.totals.every(t => t.acquired === 0));
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log('Campaña nativa: cargar definición opcional, tres guardias reales y descargar parte final OK.');
} finally {
  if (browser) await browser.close();
  await server.close();
}
