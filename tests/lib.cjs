// Utilidades comunes de las pruebas: abrir la página en Chromium headless con Math.random
// sembrado (mulberry32), correr escenarios completos y capturar el registro entero.
'use strict';
const path = require('path');

function loadPlaywright() {
  const tries = ['playwright', '@playwright/test', '/opt/node-tools/node_modules/playwright'];
  for (const t of tries) { try { return require(t); } catch (e) { /* sigue */ } }
  throw new Error('No encuentro Playwright. Instalalo con: npm install (o npm i -D playwright)');
}

// Se inyecta antes de que corra cualquier script de la página. Reemplaza Math.random por un
// generador con semilla para que dos versiones de la página consuman exactamente la misma
// secuencia de números. window.__seed(n) reinicia la secuencia.
const SEED_SCRIPT = `(() => {
  let s = 1;
  const r = function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  Math.random = r;
  window.__seed = n => { s = n >>> 0; };
})();`;

const IGNORE = [/fonts\.(googleapis|gstatic)\.com/i, /ERR_FAILED|ERR_NAME_NOT_RESOLVED|ERR_INTERNET_DISCONNECTED|ERR_TUNNEL|ERR_PROXY/i];

async function openPage(htmlPath, { seeded = true, viewport = { width: 1400, height: 900 } } = {}) {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !IGNORE.some(r => r.test(m.text()))) errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + (e.stack || e.message)));
  // Google Fonts: se bloquea para no depender de la red (la página tiene fuentes de respaldo).
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  if (seeded) await page.addInitScript(SEED_SCRIPT);
  await page.goto('file://' + path.resolve(htmlPath));
  await page.waitForFunction(() => window.__S && window.__dbg);
  return { browser, page, errors };
}

// Recarga la página (vuelve a sembrar Math.random y a reiniciar los contadores internos):
// así cada caso golden es independiente del orden en que se corran.
async function fresh(page) {
  await page.reload();
  await page.waitForFunction(() => window.__S && window.__dbg);
}

// Corre un escenario completo con step(0.25) dentro de un solo evaluate (el bucle de dibujo no
// puede intercalarse). Captura TODO el registro (S.log guarda solo los últimos 300).
async function runScenario(page, { key, seed = 1, flat = false, net, doctrine, model, maxSteps = 60000, extra }) {
  return page.evaluate(({ key, seed, flat, net, doctrine, model, maxSteps, extra }) => {
    const d = window.__dbg, S = window.__S;
    if (model) S.model = model;
    d.loadScenario(key);
    if (flat) d.flat();
    if (net !== undefined) S.net = net;
    if (doctrine) S.doctrine = doctrine;
    if (extra) (new Function('S', 'd', extra))(S, d);
    window.__seed(seed);
    d.startSim(); S.running = true;
    const full = [];
    const grab = () => { const fresh = []; for (const l of S.log) { if (l.__seen) break; l.__seen = true; fresh.push([+l.t.toFixed(4), l.cls, l.msg]); } full.push(...fresh.reverse()); };
    grab();
    let n = 0;
    while (S.running && n < maxSteps) { d.step(0.25); grab(); n++; }
    const st = S.stats;
    return {
      key, seed, flat, net: S.net, doctrine: S.doctrine, steps: n, t: +S.t.toFixed(4), ended: !S.running,
      stats: { launched: st.launched, killed: st.killed, hits: st.hits, misses: st.misses, decoys: st.decoys, decoysKilled: st.decoysKilled, shots: st.shots, defCost: +st.defCost.toFixed(6), atkCost: +st.atkCost.toFixed(6), lost: st.lost, byUnit: st.byUnit },
      units: S.units.map(u => [u.name, u.alive, u.magLeft]),
      log: full
    };
  }, { key, seed, flat, net, doctrine, model, maxSteps, extra: extra || null });
}

// Cobertura (sin aleatoriedad): hash FNV-1a de la grilla para una amenaza y altura dadas.
async function coverageHash(page, { key, ref, agl, model }) {
  return page.evaluate(({ key, ref, agl, model }) => {
    const d = window.__dbg, S = window.__S;
    if (model) S.model = model;
    d.loadScenario(key); S.covRef = ref; S.covAgl = agl; d.computeCov();
    const c = S._cov; let h = 0x811c9dc5, sum = 0;
    for (let i = 0; i < c.length; i++) { h ^= c[i]; h = Math.imul(h, 16777619) >>> 0; sum += c[i]; }
    return { key, ref, agl, hash: h.toString(16), sum, pct: S.covStat.pct };
  }, { key, ref, agl, model });
}

// Escenarios armados por código para que el golden recorra todos los tipos de amenaza, defensa
// e interferidor (los escenarios de fábrica dejan caminos del motor sin ejercitar).
const BUILD_MIX = `
  const D = (t, x, y, o) => d.addDef(t, x, y, o || {});
  D('ewr', 85.4, 53.2); D('p18', 70, 40); D('aew_s340', 40, 80, { az: 90 }); D('acoustic', 50, 50); D('acoustic', 45, 62);
  D('patriot', 58, 58, { az: 320 }); D('patriot2', 60, 62, { az: 300 }); D('sampt', 55, 65); D('irist', 44, 67); D('nasams', 56, 62);
  D('s300', 62, 50, { az: 270 }); D('buk', 48, 58); D('gepard', 40, 62); D('mfg', 52, 47); D('manpads', 47, 64); D('intdrone', 60, 54);
  D('pantsir', 50, 60); D('tor', 66, 60); D('s400', 64, 66, { az: 300 }); D('aew_a50', 30, 95);
  const A = o => d.addSalvo(o);
  A({ type: 'shahed', count: 6, interval: 20, tStart: 0, agl: 800, pts: [[2, 28], [34, 44], [56, 58]] });
  A({ type: 'geran3', count: 4, interval: 15, tStart: 30, agl: 1500, pts: [[2, 40], [30, 50], [56, 60]] });
  A({ type: 'gerbera', count: 6, interval: 15, tStart: 10, agl: 900, pts: [[2, 36], [36, 50], [55, 59]] });
  A({ type: 'lyutyi', count: 4, interval: 10, tStart: 60, agl: 300, pts: [[88, 100], [70, 70], [57, 60]] });
  A({ type: 'kh101', count: 3, interval: 10, sync: true, tArrive: 900, agl: 40, pts: [[88, 110], [80, 85], [73, 70], [58, 58]] });
  A({ type: 'kalibr', count: 3, interval: 8, sync: true, tArrive: 910, agl: 25, pts: [[0, 75], [30, 70], [44, 67]] });
  A({ type: 'isk_k', count: 2, interval: 8, sync: true, tArrive: 920, agl: 30, maneuver: true, pts: [[0, 100], [30, 80], [55, 65]] });
  A({ type: 'storm', count: 2, interval: 6, sync: true, tArrive: 930, agl: 35, pts: [[0, 60], [30, 56], [50, 60]] });
  A({ type: 'neptune', count: 2, interval: 6, sync: true, tArrive: 935, agl: 12, pts: [[0, 20], [36, 40], [52, 47]] });
  A({ type: 'flamingo', count: 2, interval: 6, sync: true, tArrive: 940, agl: 35, pts: [[0, 10], [40, 40], [62, 50]] });
  A({ type: 'isk_m', count: 2, interval: 20, sync: true, tArrive: 950, launchDist: 300, maneuver: true, decoys: true, pts: [[60, 0], [58, 58]], targetUnit: 'Patriot-1' });
  A({ type: 'kinzhal', count: 2, interval: 15, sync: true, tArrive: 960, launchDist: 450, maneuver: true, pts: [[89, 0], [60, 62]] });
  A({ type: 'atacms', count: 2, interval: 10, sync: true, tArrive: 965, launchDist: 220, pts: [[0, 0], [64, 66]], targetUnit: 'S-400' });
  A({ type: 'kh22', count: 2, interval: 10, sync: true, tArrive: 970, launchDist: 450, pts: [[0, 111], [56, 62]] });
  A({ type: 'oniks', count: 2, interval: 10, sync: true, tArrive: 975, launchDist: 250, maneuver: true, pts: [[0, 50], [55, 65]] });
  A({ type: 'zircon', count: 2, interval: 10, sync: true, tArrive: 980, launchDist: 400, maneuver: true, pts: [[89, 111], [58, 58]] });
  d.addJam('soj', 4, 18, { alt: 8000 }); d.addJam('krasukha4', 10, 90); d.addJam('krasukha2', 20, 100); d.addJam('gnss', 40, 52);
`;
const BUILD_CAL = {
  kh101: `d.addDef('irist', 50, 55); d.addDef('nasams', 52, 57); d.addDef('ewr', 54, 52); d.addSalvo({ type: 'kh101', count: 16, interval: 5, tStart: 0, agl: 50, pts: [[0, 55], [50, 56]] });`,
  isk: `d.addDef('patriot', 50, 55, { az: 0 }); d.addSalvo({ type: 'isk_m', count: 8, interval: 20, tStart: 0, launchDist: 300, maneuver: true, decoys: true, pts: [[50, 0], [51, 56]] });`,
  kh22: `d.addDef('irist', 50, 55); d.addDef('nasams', 52, 57); d.addSalvo({ type: 'kh22', count: 6, interval: 5, tStart: 0, launchDist: 450, pts: [[0, 0], [51, 56]] });`,
  shahed: `d.addDef('gepard', 48, 55); d.addDef('gepard', 53, 57); d.addDef('mfg', 45, 52); d.addDef('mfg', 50, 50); d.addDef('mfg', 55, 53); d.addDef('intdrone', 50, 58); d.addDef('intdrone', 46, 56); d.addDef('acoustic', 40, 52); d.addDef('acoustic', 45, 55); d.addDef('acoustic', 50, 55);
    d.addSalvo({ type: 'shahed', count: 20, interval: 10, tStart: 0, agl: 500, pts: [[0, 50], [51, 56]] }); d.addSalvo({ type: 'gerbera', count: 10, interval: 15, tStart: 5, agl: 600, pts: [[0, 60], [51, 56]] });`
};

// Casos golden del modelo clásico: tienen que dar idéntico al index.html original.
const GOLDEN_RUNS = [
  { key: 'mb_noche', seed: 1 }, { key: 'mb_noche', seed: 2 }, { key: 'mb_noche', seed: 3 },
  { key: 'gb_ruso', seed: 1 }, { key: 'gb_ruso', seed: 2 }, { key: 'gb_ruso', seed: 3 },
  { key: 'mb_noche', seed: 7, net: false, doctrine: 'sls' },
  { key: 'gb_ruso', seed: 7, flat: true },
  { key: 'mb_noche', seed: 5, name: 'vistadef', extra: `document.getElementById('defView').checked = true;` },
  { key: 'mb_vacio', seed: 1, name: 'mix', extra: BUILD_MIX },
  { key: 'mb_vacio', seed: 2, name: 'mix', extra: BUILD_MIX },
  { key: 'mb_vacio', seed: 3, name: 'mix_nonet', net: false, doctrine: 'sls', extra: BUILD_MIX },
  { key: 'mb_vacio', seed: 1, name: 'cal_kh101', flat: true, extra: BUILD_CAL.kh101 },
  { key: 'mb_vacio', seed: 1, name: 'cal_isk', flat: true, extra: BUILD_CAL.isk },
  { key: 'mb_vacio', seed: 1, name: 'cal_kh22', flat: true, extra: BUILD_CAL.kh22 },
  { key: 'mb_vacio', seed: 1, name: 'cal_shahed', flat: true, extra: BUILD_CAL.shahed }
];
const GOLDEN_COV = [
  { key: 'mb_noche', ref: 'kh101', agl: 50 }, { key: 'mb_noche', ref: 'shahed', agl: 2000 },
  { key: 'mb_noche', ref: 'isk_m', agl: 10000 }, { key: 'gb_ruso', ref: 'storm', agl: 35 },
  { key: 'gb_ruso', ref: 'lyutyi', agl: 200 }
];
const goldenName = c => [c.key, c.name, 's' + c.seed, c.flat ? 'flat' : '', c.net === false ? 'nonet' : '', c.doctrine || ''].filter(Boolean).join('_');

module.exports = { loadPlaywright, openPage, fresh, runScenario, coverageHash, GOLDEN_RUNS, GOLDEN_COV, goldenName, SEED_SCRIPT };
