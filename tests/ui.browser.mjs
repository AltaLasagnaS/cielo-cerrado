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
  // selección múltiple (F03): click + Shift-click, edición en grupo y Delete con confirmación
  await page.evaluate(() => { window.__dbg.loadScenario('mb_noche'); window.__S.sel = null; window.__S.multi = []; });
  const pos = await page.evaluate(async () => {
    const { toS } = await import('/render/view.js'); const r = document.querySelector('canvas').getBoundingClientRect();
    return window.__S.setup.defs.slice(0, 2).map(u => { const [x, y] = toS(u.x, u.y); return [r.left + x, r.top + y, u.id]; });
  });
  await page.mouse.click(pos[0][0], pos[0][1]);
  await page.keyboard.down('Shift'); await page.mouse.click(pos[1][0], pos[1][1]); await page.keyboard.up('Shift');
  assert.deepEqual(await page.evaluate(() => window.__S.multi.length), 2);
  assert.match(await page.locator('#selCard').innerText(), /2 defensas/);
  await page.locator('#mCp').selectOption('A');
  assert.deepEqual(await page.evaluate(ids => ids.map(id => window.__S.setup.defs.find(u => u.id === id).cp), [pos[0][2], pos[1][2]]), ['A', 'A']);
  const nDefs = await page.evaluate(() => window.__S.setup.defs.length);
  page.once('dialog', d => d.accept());
  await page.locator('canvas').first().focus().catch(() => {});
  await page.keyboard.press('Delete');
  assert.equal(await page.evaluate(() => window.__S.setup.defs.length), nDefs - 2, 'Delete borra el grupo después de confirmar');
  // rectángulo de selección: Shift + arrastrar sobre el mapa vacío suma las defensas de adentro
  await page.evaluate(() => { window.__dbg.loadScenario('mb_noche'); window.__S.sel = null; window.__S.multi = []; });
  const box = await page.evaluate(async () => {
    const { toS, toW } = await import('/render/view.js'); const r = document.querySelector('canvas').getBoundingClientRect();
    const pts = window.__S.setup.defs.map(u => toS(u.x, u.y));
    const x0 = Math.min(...pts.map(p => p[0])) - 25, y0 = Math.min(...pts.map(p => p[1])) - 25, x1 = x0 + (Math.max(...pts.map(p => p[0])) - x0) * 0.6, y1 = Math.max(...pts.map(p => p[1])) + 25;
    const [ax, ay] = toW(x0, y0), [bx, by] = toW(x1, y1);
    const want = window.__S.setup.defs.filter(u => u.x >= Math.min(ax, bx) && u.x <= Math.max(ax, bx) && u.y >= Math.min(ay, by) && u.y <= Math.max(ay, by)).length;
    return { a: [r.left + x0, r.top + y0], b: [r.left + x1, r.top + y1], want };
  });
  await page.keyboard.down('Shift'); await page.mouse.move(...box.a); await page.mouse.down(); await page.mouse.move(box.b[0], box.b[1], { steps: 8 }); await page.mouse.up(); await page.keyboard.up('Shift');
  assert.ok(box.want >= 2, 'el rectángulo de prueba abarca varias defensas: ' + box.want);
  assert.equal(await page.evaluate(() => window.__S.multi.length), box.want, 'selecciona las defensas de adentro');
  assert.equal(await page.evaluate(() => window.__S.box), null, 'y borra el rectángulo');
  // traslado durante la partida (sim/mobility.js): sin datos no se ofrece; con datos (de prueba) se marca la
  // ruta tocando el mapa, se confirma y la unidad se repliega
  await page.evaluate(() => { window.__dbg.loadScenario('mb_noche'); window.__dbg.startSim(); });
  const mv = await page.evaluate(() => { const u = window.__S.units.find(v => v.alive); window.__S.sel = { kind: 'def', id: u.id }; window.__dbg.renderAll(); return u.id; });
  assert.match(await page.locator('#selCard').innerText(), /No se puede trasladar: no hay datos de despliegue/);
  await page.evaluate(async id => { const { DEFENSES } = await import('/data/index.js'); const u = window.__S.units.find(v => v.id === id); DEFENSES[u.type].mob = { stowS: 60, deployS: 60, vmax: 60 }; window.__dbg.renderAll(); }, mv);
  // la ficha no se reemplaza si no cambió (el refresco periódico la dejaba imposible de tocar en máquinas lentas)
  const stable = await page.evaluate(() => new Promise(res => { const b = document.querySelector('#sMove'); setTimeout(() => res(!!b && b.isConnected), 600); }));
  assert.ok(stable, 'el botón Trasladar sigue siendo el mismo después de varios refrescos');
  await page.click('#sMove');
  const dest = await page.evaluate(async id => {
    const { toS } = await import('/render/view.js'); const r = document.querySelector('canvas').getBoundingClientRect(), u = window.__S.units.find(v => v.id === id);
    const [c, d] = toS(u.x - 5, u.y + 2); return [r.left + c, r.top + d];   // 5 km hacia adentro del mapa
  }, mv);
  await page.mouse.click(dest[0], dest[1]);
  assert.match(await page.locator('#modebar').textContent(), /Ruta de 1 punto/);
  await page.click('#mbOk');
  assert.match(await page.locator('#modebar').textContent(), /velocidad de marcha/, 'sin velocidad no ordena');
  await page.waitForSelector('#mbKmh', { timeout: 4000 });
  await page.fill('#mbKmh', '40');
  await page.click('#mbOk');
  assert.equal(await page.evaluate(id => window.__S.units.find(v => v.id === id).mob?.phase, mv), 'stow', 'se repliega');
  assert.match(await page.locator('#modebar').textContent(), /se repliega/);
  await page.evaluate(async id => { const { DEFENSES } = await import('/data/index.js'); delete DEFENSES[window.__S.units.find(v => v.id === id).type].mob; window.__dbg.loadScenario('mb_noche'); }, mv);
  // zonas de clima (sim/weather-now.js): se agregan desde Defensa → Clima tocando el mapa, se editan y se quitan
  await page.evaluate(() => { window.__dbg.loadScenario('mb_noche'); });
  if (await page.locator('#modal').isVisible()) await page.locator('#sheet .x').click();
  await page.locator('[data-tab="def"]').click();
  await page.selectOption('#optZw', 'niebla');
  await page.click('#optZadd');
  const zc = await page.evaluate(async () => { const { toS } = await import('/render/view.js'); const r = document.querySelector('canvas').getBoundingClientRect(); const [a, b] = toS(40, 60); return [r.left + a, r.top + b]; });
  await page.mouse.click(zc[0], zc[1]);
  const z = await page.evaluate(() => window.__S.wxZones);
  assert.equal(z.length, 1); assert.equal(z[0].weather, 'niebla'); assert.ok(Math.abs(z[0].x - 40) < 1 && Math.abs(z[0].y - 60) < 1, JSON.stringify(z));
  await page.fill('[data-zr="0"]', '25'); await page.locator('[data-zr="0"]').dispatchEvent('change');
  assert.equal(await page.evaluate(() => window.__S.wxZones[0].r), 25);
  await page.click('[data-zx="0"]');
  assert.equal(await page.evaluate(() => window.__S.wxZones.length), 0, 'se quita');
  // campaña (lógica de Codex, experimentos/catalogo-presupuesto): asignar, pedir y cargar munición, jugar la
  // guardia en el mapa y llegar al parte de cierre y a la guardia siguiente
  page.on('dialog', d => d.accept());
  await page.click('#campBtn'); await page.selectOption('#cLen', '3'); await page.click('#cCreate');
  assert.match(await page.locator('#sheet').innerText(), /Preparar la guardia/i);
  const camp = await page.$$eval('[data-order]', bs => bs.map(b => /** @type {HTMLElement} */ (b).dataset.order));
  for (const id of camp) { await page.fill('#cq-' + id, '2'); await page.click(`[data-order="${id}"]`); }
  while (await page.$('#cWait:not([disabled])')) await page.click('#cWait');
  for (const id of camp) { await page.fill('#cq-' + id, '2'); await page.click(`[data-load="${id}"]`); }
  while (await page.$('#cWait:not([disabled])')) await page.click('#cWait');
  await page.click('#cStart');
  assert.equal(await page.locator('#view').inputValue(), 'def', 'la guardia se juega en vista del defensor');
  // durante la guardia no se puede ver la verdad, cambiar de escenario o de relieve, ni correr Monte Carlo;
  // el botón principal solo pausa y sigue
  await page.selectOption('#view', 'all');
  assert.equal(await page.locator('#view').inputValue(), 'def', 'la vista completa queda bloqueada en la guardia');
  await page.click('#mcBtn');
  assert.equal(await page.locator('#modal').isHidden(), true, 'Monte Carlo no se abre en la guardia');
  const world = () => page.evaluate(() => JSON.stringify([window.__S.scen?.name, window.__S.started, window.__S.t, window.__S.setup]));
  await page.evaluate(() => { window.__S.running = false; });   // en pausa, para que el reloj no se mueva
  const w0 = await world();
  // un escenario válido (el mismo exportado) tampoco entra: lo que importa es que no resetee el mundo
  const scenJson = await page.evaluate(async () => JSON.stringify((await import('/sim/scenario-io.js')).exportScenario()));
  await page.setInputFiles('#loadScen', { name: 'otro.json', mimeType: 'application/json', buffer: Buffer.from(scenJson) });
  await page.waitForTimeout(100);
  assert.equal(await world(), w0, 'no se carga otro escenario');
  assert.equal(await page.evaluate(() => window.__dbg.loadFromObject({}).ok), false, 'ni por código');
  assert.equal(await page.locator('#modal').isHidden(), true, 'ni se abre la ventana de errores');
  await page.setInputFiles('#hgt', { name: 'N46E030.hgt', mimeType: 'application/octet-stream', buffer: Buffer.alloc(8) });
  assert.equal(await world(), w0, 'no se carga otro relieve');
  // borde (prueba de Codex en #69): sin amenazas vivas ni por llegar, en guardia el botón dice "Seguir"
  // y no arma una corrida nueva
  const edge = await page.evaluate(async () => {
    const { togglePlay, updatePlay } = await import('/ui/controls.js'), S = window.__S, keep = [S.pending, S.threats, S.running];
    S.running = false; S.pending = []; S.threats = []; updatePlay();
    const label = document.querySelector('#play')?.textContent; togglePlay(); const out = [label, S.running, S.started];
    [S.pending, S.threats, S.running] = keep; updatePlay(); return out;
  });
  assert.deepEqual(edge, ['▶ Seguir', true, true], 'en guardia el botón nunca es "Nueva corrida"');
  const run0 = await page.evaluate(() => window.__S.running);
  await page.click('#play');
  assert.deepEqual(await page.evaluate(() => [window.__S.running, window.__S.started]), [!run0, true], 'el botón pausa sin reiniciar');
  await page.click('#play');
  await page.evaluate(() => { let k = 0; while (window.__dbg.campaignStep() && k < 40000) k++; });
  assert.match(await page.locator('#sheet').innerText(), /Parte de cierre/i);
  await page.click('#cNext');
  assert.match(await page.locator('#sheet').innerText(), /Segunda guardia/i, 'la campaña sigue con la guardia siguiente');
  // la tercera guardia (opcional, de Codex): se juega con lo que quedó, sin recargar
  await page.click('#cStart');
  await page.evaluate(() => { let k = 0; while (window.__dbg.campaignStep() && k < 40000) k++; });
  await page.click('#cNext');
  assert.match(await page.locator('#sheet').innerText(), /Tercera guardia/i, 'con "Tres guardias" llega a la tercera');
  assert.deepEqual(errors, []);
  console.log('Interfaz: valores numéricos, atajos, Monte Carlo, Academia de pulsos, regla, selección múltiple y por rectángulo, traslado, zonas de clima, campaña OK');
} finally { await browser.close(); }
