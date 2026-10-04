import assert from 'node:assert/strict';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.TEST_URL || 'http://127.0.0.1:8766/demo/';
const origin = new URL(url).origin;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => route.request().url().startsWith(origin + '/') ? route.continue() : route.abort());
  await page.goto(url);
  await page.waitForFunction(() => window.__budgetDemo);
  assert.equal(await page.locator('#balance').textContent(), '100');
  assert.equal(await page.locator('#variants li').count(), 10);
  await page.locator('#buy').click();
  assert.equal(await page.locator('#balance').textContent(), '80');
  await page.locator('#quantity').fill('1.5'); await page.locator('#load').click();
  assert.equal(await page.evaluate(() => window.__budgetDemo.getState().inventory['example-supply'].ready), 0);
  assert.ok((await page.locator('#status').textContent()).includes('entero'));
  await page.locator('#quantity').fill('2'); await page.locator('#load').click();
  await page.locator('#activate').click();
  assert.equal(await page.locator('#buy').isDisabled(), true);
  assert.equal(await page.locator('#load').isDisabled(), true);
  await page.locator('#quantity').fill('1'); await page.locator('#consume').click();
  assert.equal(await page.locator('#balance').textContent(), '80');
  await page.locator('#save').click();
  const saved = await page.locator('#saved-plan').inputValue();
  await page.locator('#side').selectOption('red');
  assert.equal(await page.locator('#balance').textContent(), '60');
  await page.locator('#saved-plan').fill(saved); await page.locator('#restore').click();
  assert.ok((await page.locator('#status').textContent()).includes('otro bando'));
  assert.equal(await page.locator('#balance').textContent(), '60');
  await page.locator('#side').selectOption('blue'); await page.locator('#reset').click();
  await page.locator('#saved-plan').fill(saved); await page.locator('#restore').click();
  assert.equal(await page.locator('#balance').textContent(), '80');
  assert.equal(await page.evaluate(() => window.__budgetDemo.getState().inventory['example-supply'].consumed), 1);
  await page.locator('#consume').click();
  assert.equal(await page.evaluate(() => window.__budgetDemo.getState().inventory['example-supply'].consumed), 2);
  await page.locator('#finish').click(); assert.equal(await page.locator('#consume').isDisabled(), true);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'sin desborde horizontal en móvil');
  assert.deepEqual(errors, [], 'sin errores de JavaScript');
  console.log('Demo: compra, rechazo de fracciones, consumo, bandos, guardado y móvil verificados.');
} finally { await browser.close(); }
