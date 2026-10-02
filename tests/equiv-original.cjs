// Equivalencia de interfaz con el index.html original (Etapa 0).
// Uso:  git show main:index.html > /tmp/original.html
//       node tests/equiv-original.cjs /tmp/original.html
// Compara el HTML de los paneles, de cada ficha y de los comparadores, y capturas de pantalla
// píxel a píxel (al cargar y en plena simulación). Solo vale mientras la interfaz no cambie a
// propósito: desde la Etapa 1 las fichas tienen secciones nuevas y esta prueba deja de aplicar.
'use strict';
const path = require('path');
const { openPage } = require('./lib.cjs');

async function snapshot(htmlPath) {
  const { browser, page, errors } = await openPage(htmlPath);
  await page.waitForTimeout(700);
  const out = { errors, html: {}, shots: {} };
  out.shots.load = await page.screenshot();
  for (const t of ['def', 'atk', 'ew', 'cat']) out.html['tab-' + t] = await page.$eval('#tab-' + t, e => e.innerHTML);
  out.html.sel = await page.$eval('#selCard', e => e.innerHTML);
  await page.click('.tabs button[data-tab="cat"]');
  const items = await page.$$eval('#tab-cat [data-f]', els => els.map(e => e.dataset.f));
  for (const f of items) {
    await page.click(`#tab-cat [data-f="${f}"]`);
    out.html['ficha ' + f] = await page.$eval('#sheet', e => e.innerHTML);
    await page.click('#sheet .x');
  }
  for (const b of ['#cmpT', '#cmpD', '#calB', '#helpBtn']) { await page.click(b); out.html[b] = await page.$eval('#sheet', e => e.innerHTML); await page.click('#sheet .x'); }
  // simulación a mitad de camino: mismo estado → mismo dibujo
  await page.evaluate(() => {
    window.__seed(3); window.__dbg.startSim(); window.__S.running = true;
    for (let i = 0; i < 5600; i++) window.__dbg.step(0.25);
    window.__S.running = false; window.__S.fx = []; window.__dbg.renderAll(); window.__dbg.draw();
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => { window.__S.fx = []; window.__dbg.draw(); });
  out.html.stats = await page.$eval('#stats', e => e.innerHTML);
  out.html.log = await page.$eval('#log', e => e.innerHTML);
  out.shots.sim = await page.screenshot();
  await browser.close();
  return out;
}

(async () => {
  const orig = process.argv[2];
  if (!orig) { console.error('Uso: node tests/equiv-original.cjs <ruta al index.html original>'); process.exit(2); }
  const a = await snapshot(orig), b = await snapshot(path.join(__dirname, '..', 'index.html'));
  let bad = 0;
  for (const k of Object.keys(a.html)) {
    if (a.html[k] !== b.html[k]) { bad++; console.log('DISTINTO: ' + k); }
  }
  for (const k of Object.keys(a.shots)) {
    const same = Buffer.compare(a.shots[k], b.shots[k]) === 0;
    if (!same) { bad++; console.log('CAPTURA DISTINTA: ' + k); require('fs').writeFileSync(path.join(__dirname, '..', 'equiv-' + k + '-orig.png'), a.shots[k]); require('fs').writeFileSync(path.join(__dirname, '..', 'equiv-' + k + '-nuevo.png'), b.shots[k]); }
  }
  if (a.errors.length || b.errors.length) { bad++; console.log('errores:', a.errors, b.errors); }
  console.log(bad ? bad + ' diferencias' : 'Equivalente: ' + Object.keys(a.html).length + ' bloques de HTML y ' + Object.keys(a.shots).length + ' capturas idénticas.');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
