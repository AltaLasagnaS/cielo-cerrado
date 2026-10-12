import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { moduleOf, root, provenance, save, output } from './context.mjs';
import { mkdirSync } from 'node:fs';
const { startSourceServer } = await moduleOf('tests/browser/serve.mjs');
const { JAMMERS } = await moduleOf('src/data/index.js');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE ||
  join(root, 'tests/browser/node_modules/playwright/index.mjs')).href);
const server = await startSourceServer(root);
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
const rows = [];
mkdirSync(output, { recursive: true });
try {
  // El modo del bundle es explícito: no presentar HTTP como prueba file://.
  for (const mode of ['source', 'standalone-http']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage(); const errors = [], external = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => {
      const u = new URL(route.request().url());
      if (u.hostname === '127.0.0.1' || ['data:', 'blob:'].includes(u.protocol)) return route.continue();
      external.push(u.origin); return route.abort();
    });
    await page.goto(server.url + (mode === 'source' ? '/' : '/__bundle__.html'));
    await page.waitForFunction(() => window.__S && window.__dbg?.draw && window.__S.setup.defs.length);
    const result = await page.evaluate(async ({ mode, jammerShort }) => {
      const S = window.__S, dbg = window.__dbg;
      dbg.resetSim(); dbg.flat(); S.setup = { defs: [], objs: [], jams: [], salvos: [] }; S.sel = null;
      S.weather = 'despejado'; S.c2 = 'coordinada'; S.tod = 'noche'; S.wxPlan = []; S.wind = { v: 0, from: 0 };
      dbg.addDef('nasams', 40, 40, { name: '__AUDIT_UNIT__' });
      dbg.addJam('soj', 30, 20, { alt: 8000 });
      dbg.addSalvo({ type: 'shahed', pts: [[5, 5], [15, 15], [25, 25]], count: 1, agl: 50, tStart: 1000 });
      dbg.startSim(); const short = S.pending[0].T.short;
      const canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
      const original = ctx.fillText, labels = [];
      ctx.fillText = function(text, ...args) { labels.push(String(text)); return original.call(this, text, ...args); };
      const traceMethods = ['beginPath', 'moveTo', 'lineTo', 'arc', 'closePath', 'stroke'];
      const originals = Object.fromEntries(traceMethods.map(k => [k, ctx[k]]));
      let path = [], nonlinear = false, routeStrokes = 0;
      for (const k of traceMethods) ctx[k] = function(...args) {
        if (k === 'beginPath') { path = []; nonlinear = false; }
        if (k === 'moveTo' || k === 'lineTo') path.push(args.slice(0, 2));
        if (k === 'arc' || k === 'closePath') nonlinear = true;
        if (k === 'stroke' && !nonlinear && path.length === 3) {
          const [a, b, c] = path;
          const cross = (b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);
          if (Math.abs(cross) < 1e-7 && Math.hypot(b[0]-a[0],b[1]-a[1]) > 1) routeStrokes++;
        }
        return originals[k].apply(this, args);
      };
      // Tres puntos colineales exclusivos del fixture, sin depender del color
      // ni de que el renderer siga mostrando una etiqueta.
      const snapshot = () => { labels.length = 0; routeStrokes = 0; dbg.draw(); return { labels: [...labels], routeStrokes }; };
      document.getElementById('view').value = 'def'; S.running = true; const running = snapshot();
      S.running = false; const paused = snapshot();
      const route = { id: 'paused-hidden-route', audit: 'F09', mode,
        expected: 'Pausar vista defensora no dibuja planes de ataque ocultos.',
        holds: !paused.labels.some(t => t === short) && paused.routeStrokes === 0,
        observed: { runningRouteLabels: running.labels.filter(t => t === short), pausedRouteLabels: paused.labels.filter(t => t === short),
          runningRouteStrokes: running.routeStrokes, pausedRouteStrokes: paused.routeStrokes } };
      const jammer = { id: 'unobserved-jammer-label', audit: 'F09', mode,
        expected: 'Interferidor enemigo sin fix ni observación no revela identidad/posición exactas.',
        holds: !paused.labels.includes(jammerShort), observed: { fix: S.jamsLive[0].fix ?? null,
          canvasLabels: paused.labels.filter(t => t === jammerShort), expectedHiddenLabel: jammerShort } };
      ctx.fillText = original;
      for (const k of traceMethods) ctx[k] = originals[k];
      const jams = S.jamsLive; S.jamsLive = []; S.covRef = 'shahed'; S.covAgl = 50;
      S.units[0].emcon = 'silencio'; dbg.computeCov();
      const countCells = () => S._cov.reduce((n, v) => n + (v > 0), 0);
      const silentCells = countCells();
      S.units[0].mob = { phase: 'deploy', route: [[40, 40], [41, 40]], km: 1, kmh: 36, tMove: 0, tDeploy: 0, tReady: 1000 };
      dbg.computeCov();
      const movingCells = countCells(), hint = document.getElementById('covInfo')?.textContent || '';
      const coverage = { id: 'coverage-operational-label', audit: 'F10', mode,
        expected: 'La ejecución excluye sensores indisponibles o etiqueta explícitamente capacidad potencial.',
        holds: (silentCells === 0 && movingCells === 0) || /potencial|planificaci[oó]n/i.test(hint),
        observed: { silentCells, movingCells, hint } };
      S.units[0].mob = null; S.jamsLive = jams;
      S.running = false; S.t = 20; S.replay = { t: 5 }; S.units[0].x = 60; S.units[0].magLeft = 1;
      S.rec.units.push({ t: 10, id: S.units[0].id, x: 60, y: 40, alive: true, magLeft: 1 });
      S.sel = { kind: 'def', id: S.units[0].id }; dbg.renderAll();
      const panel = document.getElementById('selCard').textContent;
      const selection = { id: 'historical-selection', audit: 'F07', mode,
        expected: 'La ficha en replay T=5 usa posición de T=5 (40,40), no final (60,40).',
        holds: /40\.0,\s*40\.0/.test(panel), observed: { panel } };
      const out = [route, jammer, coverage, selection];
      if (mode === 'source') {
        const { hitTest } = await import('/ui/input.js'); const { toS } = await import('/render/view.js');
        const historicalHit = hitTest(...toS(40, 40)), finalHit = hitTest(...toS(60, 40));
        out.push({ id: 'historical-hit-test', audit: 'F07', mode,
          expected: 'Hit testing encuentra la unidad donde el cuadro histórico la dibuja.',
          holds: historicalHit?.id === S.units[0].id,
          observed: { historicalHit: historicalHit ?? null, finalHit: finalHit ?? null, wantedId: S.units[0].id } });
      }
      dbg.draw();
      return out;
    }, { mode, jammerShort: JAMMERS.soj.short });
    for (const r of result) { r.status = r.holds ? 'HOLDS' : 'VIOLATED'; rows.push(r); console.log(`${r.status} ${mode} ${r.id}`); }
    await page.screenshot({ path: join(output, `${mode}-historical-selection.png`), fullPage: true });
    await page.evaluate(() => { window.__S.replay = null; document.getElementById('view').value = 'def'; window.__dbg.draw(); });
    await page.screenshot({ path: join(output, `${mode}-paused-defender.png`), fullPage: true });
    const responsiveness = await page.evaluate(async () => {
      const S = window.__S, dbg = window.__dbg;
      dbg.resetSim(); S.setup = { defs: [], objs: [], jams: [], salvos: [] }; S.sel = null;
      dbg.addDef('nasams', 40, 40); dbg.addDef('ewr', 40, 30);
      dbg.addSalvo({ type: 'shahed', count: 1000, interval: 0, agl: 50, pts: [[40, 10], [40, 40]] });
      const began = performance.now();
      const timer = new Promise(resolve => setTimeout(() => resolve(performance.now() - began), 0));
      dbg.startSim(); S.running = false;
      const durations = [];
      for (let n = 0; n < 80; n++) { const t = performance.now(); dbg.step(0.25); durations.push(performance.now() - t); }
      const drawAt = performance.now(); dbg.draw(); const drawMs = performance.now() - drawAt;
      const synchronousMs = performance.now() - began, timerDelayMs = await timer;
      return { count: 1000, steps: 80, simulatedSeconds: S.t, synchronousMs, drawMs, timerDelayMs,
        maxStepMs: Math.max(...durations),
        note: 'Bloque sintético de 80 pasos sin ceder, no flujo Auto/Monte Carlo. Mide retraso de temporizador en hilo UI; no define presupuesto seguro.' };
    });
    rows.push({ id: 'ui-thread-measurement', mode, status: 'MEASURED', observed: responsiveness });
    rows.push({ id: 'javascript-errors', mode, status: errors.length ? 'ERROR' : 'HOLDS', observed: { errors, blockedExternalOrigins: [...new Set(external)] } });
    await context.close();
  }
} catch (e) {
  rows.push({ id: 'browser-execution', status: 'ERROR', error: e.stack }); console.error(e);
} finally { await browser.close(); await server.close(); }
const summary = Object.fromEntries(['HOLDS', 'VIOLATED', 'ERROR'].map(s => [s, rows.filter(r => r.status === s).length]));
save('browser.json', { provenance: provenance(), chromium: browser.version(), summary, cases: rows });
console.log(JSON.stringify(summary)); process.exitCode = summary.ERROR ? 1 : summary.VIOLATED ? 2 : 0;
