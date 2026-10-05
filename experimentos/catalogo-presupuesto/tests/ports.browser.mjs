import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const server = createServer(async (req, res) => {
  try {
    const path = resolve(root, '.' + new URL(req.url, 'http://local').pathname);
    if (!path.startsWith(root)) { res.writeHead(403); return res.end(); }
    const data = await readFile(path);
    res.setHeader('Content-Type', ({ '.html':'text/html', '.mjs':'application/javascript', '.js':'application/javascript', '.css':'text/css' })[extname(path)] ?? 'application/octet-stream');res.end(data);
  } catch { res.writeHead(404);res.end(); }
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ executablePath:process.env.CHROMIUM_PATH || undefined, headless:true,args:['--no-sandbox'] });
try {
  const page = await browser.newPage({viewport:{width:1200,height:1000}}), errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>{if(route.request().url().startsWith(origin+'/'))return route.continue();external.push(route.request().url());return route.abort();});
  await page.goto(origin+'/experimentos/catalogo-presupuesto/demo/ports.html');
  await page.waitForFunction(()=>window.__portsDemo);
  const view = ()=>page.evaluate(()=>window.__portsDemo.view());
  for(const id of ['radar','s125','mobile'])await page.locator(`#choice-${id}`).uncheck();
  await page.locator('#choice-iris').check();await page.locator('#create').click();
  assert.equal((await view()).phase,'planning');assert.equal(await page.locator('#order-iris').count(),0);
  const funds=(await view()).resources.balance;
  await page.locator('#quantity-buk').fill('1.5');await page.locator('#order-buk').click();
  assert.match(await page.locator('#status').textContent(),/entero/);assert.equal((await view()).resources.jobs.length,0);
  await page.locator('#quantity-buk').fill('4');await page.locator('#order-buk').click();
  assert.equal((await view()).resources.balance,funds-40);
  await page.locator('#wait').click();await page.locator('#load-buk').click();await page.locator('#wait').click();
  assert.equal((await view()).resources.stock.find(s=>s.locationId==='buk-ready').quantity,4);
  await page.locator('#save').click();const preparation=await page.locator('#saved').inputValue();
  await page.locator('#saved').fill(preparation.slice(0,-3));await page.locator('#restore').click();
  assert.equal((await view()).resources.stock.find(s=>s.locationId==='buk-ready').quantity,4,'invalid file keeps current campaign');
  await page.locator('#saved').fill(preparation);await page.locator('#restore').click();
  await page.locator('#speed').selectOption('1');await page.locator('#start').click();await page.locator('#pause').click();
  assert.equal((await view()).phase,'active');assert.equal(await page.locator('#save').isDisabled(),true);
  assert.equal(await page.locator('#restore').isDisabled(),true);
  const live=await page.evaluate(()=>window.__portsDemo.combatView());assert.equal(Object.hasOwn(live,'pending'),false);assert.equal(Object.hasOwn(live,'threats'),false);
  await page.locator('#speed').selectOption('1200');await page.locator('#pause').click();
  await page.waitForFunction(()=>window.__portsDemo.view().phase==='debrief',null,{timeout:60000});
  const first=await view();assert.ok(first.assets.some(a=>a.kind==='objective'&&a.hp<a.maxHp));assert.equal(first.resources.balance,funds-40);
  assert.equal(first.resources.stock.find(s=>s.locationId==='buk-ready').quantity,0);
  await page.locator('#save').click();const saved=await page.locator('#saved').inputValue();
  await page.locator('#next').click();const second=await view();assert.equal(second.phase,'planning');
  assert.equal(await page.locator('#order-iris').count(),1);
  for(const a of first.assets.filter(a=>a.kind==='objective')){const next=second.assets.find(n=>n.id===a.id);if(next)assert.equal(next.hp,a.hp);}
  await page.locator('#saved').fill(saved);await page.locator('#restore').click();assert.equal((await view()).phase,'debrief');
  await page.locator('#next').click();await page.locator('#start').click();
  await page.waitForFunction(()=>window.__portsDemo.view().phase==='debrief',null,{timeout:60000});
  await page.locator('#next').click();assert.equal((await view()).phase,'finished');assert.equal((await view()).resources.balance,funds-40);
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log('Campaña Odesa: dos combates reales, recursos, daño, desbloqueo, replay, enteros, vista propia y móvil; sin red externa.');
} finally { await browser.close();await new Promise(resolve=>server.close(resolve)); }
