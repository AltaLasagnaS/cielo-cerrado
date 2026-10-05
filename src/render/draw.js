// @ts-check
// ---------------- DIBUJO ----------------
// Redibuja todo el mapa en cada cuadro: relieve, cobertura, grilla, anillos de alcance, sectores,
// "strobes" de interferencia, rutas, jammers, unidades, impactos, amenazas, interceptores y explosiones.
import { THREATS, JAMMERS, DEFENSES, TARGET_TYPES, D, sideOf } from '../data/index.js';
import { azOf, clamp } from '../util/math.js';
import { MAP } from '../physics/terrain.js';
import { jamJ, horizon } from '../physics/radar.js';
import { surf } from '../physics/terrain.js';
import { isOffmap, posAt } from '../physics/kinematics.js';
import { profileOf, distAt } from '../physics/interceptor.js';
import { S } from '../sim/state.js';
import { contactOf, attackerKnows } from '../sim/contacts.js';
import { hooks } from '../sim/hooks.js';
import { frameAt } from '../sim/replay.js';
import { cv, ctx, dpr, V, toS } from './view.js';
import { drawTerrain, drawPeaks } from './terrain.js';
import { covCanvas } from './coverage.js';

export function draw() {
  if (!MAP) return;
  // repetición: se dibuja el cuadro reconstruido en S.replay.t en lugar del estado vivo (sim/replay.js)
  const R = S.replay ? frameAt(S.replay.t) : null, tNow = R ? R.t : S.t;
  const w = cv.width / dpr, h = cv.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0a1520'; ctx.fillRect(0, 0, w, h);
  // relieve (raster suavizado + vectores) y cobertura (interpolada, sin bloques)
  const [ox, oy] = toS(0, 0), mw = MAP.wKm * V.s, mh = MAP.hKm * V.s;
  // vista del atacante (no en la repetición, que muestra la verdad): solo las defensas que conoce, sin su estado
  const av = S.started && !R && hooks.attackerView();
  drawTerrain({ ctx, dpr, s: V.s, ox, oy }, S.relief);
  if (S.showCov && covCanvas.width && !av) { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(covCanvas, ox, oy, mw, mh); }
  ctx.strokeStyle = 'rgba(230,165,60,.5)'; ctx.lineWidth = 1; ctx.strokeRect(ox, oy, mw, mh);
  // grilla km
  ctx.font = '10px "IBM Plex Mono", monospace'; ctx.fillStyle = 'rgba(200,215,230,.55)'; ctx.strokeStyle = 'rgba(200,215,230,.08)';
  const gs = V.s > 12 ? 5 : 10;
  for (let x = 0; x <= MAP.wKm; x += gs) { const [sx] = toS(x, 0); ctx.beginPath(); ctx.moveTo(sx, oy); ctx.lineTo(sx, oy + mh); ctx.stroke(); if (x % 10 === 0) ctx.fillText(x + '', sx + 2, oy + 11); }
  for (let y = 0; y <= MAP.hKm; y += gs) { const [, sy] = toS(0, y); ctx.beginPath(); ctx.moveTo(ox, sy); ctx.lineTo(ox + mw, sy); ctx.stroke(); if (y % 10 === 0 && y) ctx.fillText(y + '', ox + 2, sy - 2); }
  // escala
  drawScale(w, h);
  // puntos altos (capa de lectura del relieve)
  if (S.relief === 'peaks') drawPeaks(ctx, toS, w, h);
  // lugares
  ctx.font = '600 12px "IBM Plex Sans", sans-serif';
  for (const p of MAP.places || []) { const [sx, sy] = toS(p[1], p[2]); ctx.fillStyle = 'rgba(10,15,22,.75)'; ctx.fillRect(sx - 2, sy - 2, 4, 4); ctx.fillStyle = 'rgba(235,240,245,.85)'; ctx.fillText(p[0], sx + 5, sy + 4); }
  const units = (R ? R.units : S.started ? S.units : S.setup.defs).filter(u => !av || attackerKnows(u, tNow));
  const jams = S.started ? S.jamsLive : S.setup.jams;
  // anillos de alcance y sectores
  for (const u of units) {
    const d = D(u); const [sx, sy] = toS(u.x, u.y); const dead = S.started && !u.alive && !av;
    if (dead) continue;
    const isSel = S.sel && S.sel.kind === 'def' && S.sel.id === u.id;
    if (d.sam) {
      ctx.setLineDash([5, 5]); ctx.strokeStyle = isSel ? 'rgba(230,165,60,.9)' : (sideOf(u) === 'RU' ? 'rgba(255,159,90,.45)' : 'rgba(98,182,255,.45)'); ctx.lineWidth = isSel ? 1.6 : 1;
      ctx.beginPath(); ctx.arc(sx, sy, d.sam.maxR * V.s, 0, 7); ctx.stroke();
      if (d.sam.maxRtbm && d.sam.maxRtbm !== d.sam.maxR) { ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.arc(sx, sy, d.sam.maxRtbm * V.s, 0, 7); ctx.stroke(); }
      ctx.setLineDash([]);
    }
    if (d.radar && d.radar.sector < 360) {
      const r = (isSel ? 60 : 25) * V.s / 6 + 20, half = d.radar.sector / 2;
      const dirs = d.radar.side ? [(u.az + 90) % 360, (u.az + 270) % 360] : [u.az];
      ctx.strokeStyle = 'rgba(230,165,60,.55)'; ctx.lineWidth = 1;
      for (const a0 of dirs) { for (const a of [a0 - half, a0 + half]) { const rad = a * Math.PI / 180; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.sin(rad) * r, sy - Math.cos(rad) * r); ctx.stroke(); } ctx.beginPath(); ctx.arc(sx, sy, r, (a0 - half - 90) * Math.PI / 180, (a0 + half - 90) * Math.PI / 180); ctx.stroke(); }
    }
  }
  // strobes de interferencia
  if (S.strobes) for (const u of units) {
    if (S.started && !u.alive) continue; const d = D(u); if (!d.radar || d.radar.band === 'ACU' || d.radar.band === 'OPT') continue;
    for (const j of jams) { if (JAMMERS[j.type].gnssJam || !j.on || j.dead) continue; const jaz = azOf(j.x - u.x, j.y - u.y); const J = jamJ(u, jaz, [j]); if (J < 0.2) continue;
      const [a, b] = toS(u.x, u.y), [c2, d2] = toS(j.x, j.y); ctx.strokeStyle = `rgba(197,140,255,${clamp(0.25 + Math.log10(J + 1) * 0.3, 0.25, 0.9)})`; ctx.lineWidth = 1.2; ctx.setLineDash([8, 4]); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c2, d2); ctx.stroke(); ctx.setLineDash([]); }
  }
  // rutas de salvas (setup)
  if (!R && (!S.started || !S.running)) for (const sv of S.setup.salvos) drawRoute(sv, S.sel && S.sel.kind === 'salvo' && S.sel.id === sv.id);
  if (S.route) drawRoute({ type: S.atk.type, pts: S.route.pts, preview: true }, true);
  // objetivos (debajo de las unidades)
  for (const g of R ? R.objs : S.started ? S.objs : S.setup.objs) drawObjective(g, S.sel && S.sel.kind === 'obj' && S.sel.id === g.id, av);
  // jammers
  for (const j of jams) {
    const J = JAMMERS[j.type], [sx, sy] = toS(j.x, j.y); const isSel = S.sel && S.sel.kind === 'jam' && S.sel.id === j.id;
    if (J.gnssJam) { ctx.strokeStyle = j.on ? 'rgba(197,140,255,.6)' : 'rgba(197,140,255,.2)'; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(sx, sy, J.radius * V.s, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle = j.on && !j.dead ? '#c58cff' : '#5d4a75'; ctx.strokeStyle = isSel ? '#e6a53c' : '#1a1024'; ctx.lineWidth = isSel ? 2 : 1;
    ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = k % 2 ? 4 : 9; ctx.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke();
    // ubicado por triangulación (sim/ew.js): círculo del error; derribado (home-on-jam): cruz
    if (S.started && j.fix && !j.dead && !av) { ctx.strokeStyle = 'rgba(230,165,60,.8)'; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.arc(sx, sy, Math.max(6, j.fix.err * V.s), 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    if (S.started && j.dead) { ctx.strokeStyle = '#ff5b4d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx - 7, sy - 7); ctx.lineTo(sx + 7, sy + 7); ctx.moveTo(sx + 7, sy - 7); ctx.lineTo(sx - 7, sy + 7); ctx.stroke(); }
    labelAt(sx, sy, J.short, '#d8b8ff');
  }
  // unidades
  for (const u of units) {
    const d = D(u), [sx, sy] = toS(u.x, u.y), dead = S.started && !u.alive && !av;
    const isSel = (S.sel && S.sel.kind === 'def' && S.sel.id === u.id) || S.multi.includes(u.id);
    const c = sideOf(u) === 'RU' ? '#ff9f5a' : '#62b6ff';
    ctx.lineWidth = isSel ? 2.2 : 1.2; ctx.strokeStyle = isSel ? '#e6a53c' : '#08101a'; ctx.fillStyle = dead ? '#3a4452' : c;
    ctx.beginPath();
    if (d.kind === 'sensor' || d.kind === 'aew') { ctx.moveTo(sx, sy - 8); ctx.lineTo(sx + 8, sy); ctx.lineTo(sx, sy + 8); ctx.lineTo(sx - 8, sy); ctx.closePath(); }
    else if (d.kind === 'acoustic') { ctx.arc(sx, sy, 5, 0, 7); }
    else if (d.kind === 'gun') { ctx.rect(sx - 6, sy - 6, 12, 12); }
    else { ctx.moveTo(sx, sy - 9); ctx.lineTo(sx + 8, sy + 6); ctx.lineTo(sx - 8, sy + 6); ctx.closePath(); }
    ctx.fill(); ctx.stroke();
    if (d.kind === 'aew') { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(sx, sy, 12, 0, 7); ctx.stroke(); }
    if (S.started && !dead && !av && (u.dmgRadar || u.dmgLauncher)) { ctx.strokeStyle = '#e6a53c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, 12, 0, 7); ctx.stroke(); }   // dañada
    if (dead) { ctx.strokeStyle = '#ff5b4d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx - 7, sy - 7); ctx.lineTo(sx + 7, sy + 7); ctx.moveTo(sx + 7, sy - 7); ctx.lineTo(sx - 7, sy + 7); ctx.stroke(); }
    const ammo = S.started && d.sam && u.alive && !av ? ' ' + u.magLeft : '';
    labelAt(sx, sy, (u.name || d.short) + ammo, dead ? '#6b7888' : '#e6eef6');
  }
  // posición propuesta, pendiente de confirmar
  if (S.preview) drawPreview(S.preview);
  // impactos
  for (const im of R ? R.impacts : S.impacts) { const [sx, sy] = toS(im.x, im.y); ctx.strokeStyle = im.k === 'hit' ? '#ff5b4d' : im.k === 'miss' ? '#e6a53c' : '#6b7888'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx - 5, sy - 5); ctx.lineTo(sx + 5, sy + 5); ctx.moveTo(sx + 5, sy - 5); ctx.lineTo(sx - 5, sy + 5); ctx.stroke(); }
  // amenazas
  const dv = hooks.defenderView();
  // vista del defensor (no en la repetición, que muestra la verdad): solo contactos, con su edad
  if (dv && !R) { drawContacts(tNow); } else
  for (const th of R ? R.threats : S.threats) {
    if (!th.alive || !th.p) continue;
    const tracked = tNow - th.lastNet <= 12;
    if (dv && !tracked) continue;
    const decoyLook = th.isDecoy && !dv;
    const col = tracked ? '#ff5b4d' : 'rgba(255,91,77,.55)';
    ctx.strokeStyle = 'rgba(255,91,77,.35)'; ctx.lineWidth = 1; ctx.beginPath();
    for (const p of th.trail) { const [a, b] = toS(p[0], p[1]); ctx.lineTo(a, b); } { const [a, b] = toS(th.p.x, th.p.y); ctx.lineTo(a, b); } ctx.stroke();
    const [sx, sy] = toS(th.p.x, th.p.y);
    const nx = posAt(th, tNow + 2); const hd = nx ? Math.atan2(nx.y - th.p.y, nx.x - th.p.x) : 0;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(hd);
    ctx.fillStyle = decoyLook ? 'transparent' : col; ctx.strokeStyle = decoyLook ? '#e6a53c' : (tracked ? '#2a0806' : col); ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (th.cls === 'dron') { ctx.moveTo(6, 0); ctx.lineTo(-4, -5); ctx.lineTo(-2, 0); ctx.lineTo(-4, 5); }
    else if (th.cls === 'balistico' || th.cls === 'hiper') { ctx.moveTo(7, 0); ctx.lineTo(0, -4); ctx.lineTo(-7, 0); ctx.lineTo(0, 4); }
    else { ctx.moveTo(8, 0); ctx.lineTo(-6, -3); ctx.lineTo(-6, 3); }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    if (V.s > 9) { ctx.font = '10px "IBM Plex Mono", monospace'; ctx.fillStyle = 'rgba(255,190,180,.9)'; ctx.fillText(dv ? '#' + th.id : th.T.short, sx + 7, sy - 6); }
  }
  // interceptores (el atacante no los ve)
  if (!av) for (const it of R ? R.ints : S.ints) {
    if (it.done || tNow < it.tL) continue;
    // fracción del camino recorrida según el perfil de motor y planeo (acelera al salir, frena al final)
    const P = profileOf(D(it.u).sam), fl = Math.max(0.1, it.tH - it.tL);
    const f = clamp(distAt(P, tNow - it.tL) / Math.max(1, distAt(P, fl)), 0, 1);
    const [a, b] = toS(it.x0, it.y0), [c2, d2] = toS(it.x0 + (it.px - it.x0) * f, it.y0 + (it.py - it.y0) * f);
    ctx.strokeStyle = 'rgba(120,220,255,.75)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c2, d2); ctx.stroke();
    ctx.fillStyle = '#bff0ff'; ctx.beginPath(); ctx.arc(c2, d2, 2.2, 0, 7); ctx.fill();
  }
  // explosiones
  const now = performance.now();
  S.fx = S.fx.filter(f => now - f.rt < 1400);
  for (const f of S.fx) { const k = (now - f.rt) / 1400, [sx, sy] = toS(f.x, f.y); ctx.strokeStyle = f.c; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, (f.big ? 6 : 3) + k * (f.big ? 26 : 14), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
  // regla de medición (modo 'measure', ui/input.js): solo puntos que tocó el usuario, nada oculto
  if (S.mode === 'measure' && S.measure?.a) drawMeasure(S.measure);
}

/** Distancia horizontal (km) y rumbo (°, desde el norte) entre dos puntos del mapa. */
export function measureOf(a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  return { km: Math.hypot(dx, dy), az: (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360 };
}

/** Línea de la regla con su distancia y rumbo en el medio. */
function drawMeasure(m) {
  const b = m.b || m.cur; if (!b) return;
  const [x1, y1] = toS(...m.a), [x2, y2] = toS(...b), r = measureOf(m.a, b);
  ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 1.6; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]);
  for (const [x, y] of [[x1, y1], [x2, y2]]) { ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); }
  labelAt((x1 + x2) / 2 - 10, (y1 + y2) / 2 - 12, r.km.toFixed(r.km < 10 ? 2 : 1) + ' km · ' + Math.round(r.az) + '°', '#ffd36b');
}

/**
 * Contactos de la defensa (sim/contacts.js): pistas vivas en su posición estimada y pistas perdidas como
 * último reporte fechado. No usa la posición real, la ruta ni la identidad del arma.
 */
function drawContacts(tNow) {
  for (const th of S.threats) {
    if (th.isDecoyChild && !th.seen) continue;
    const c = contactOf(th, tNow); if (!c) continue;
    const [sx, sy] = toS(c.x, c.y), hd = Math.atan2(c.vy, c.vx);
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(hd);
    ctx.fillStyle = c.lost ? 'transparent' : '#ff5b4d'; ctx.strokeStyle = c.lost ? 'rgba(255,91,77,.6)' : '#2a0806'; ctx.lineWidth = 1.2;
    if (c.lost) ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-6, -4); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    if (V.s > 9 || c.lost) { ctx.font = '10px "IBM Plex Mono", monospace'; ctx.fillStyle = c.lost ? 'rgba(255,190,180,.6)' : 'rgba(255,190,180,.9)'; ctx.fillText('#' + th.id + (c.lost ? ' · hace ' + Math.round(c.age) + ' s' : ''), sx + 7, sy - 6); }
  }
}

/** Etiqueta con fondo oscuro a la derecha de un símbolo. */
export function labelAt(sx, sy, txt, c) { ctx.font = '500 11px "IBM Plex Sans", sans-serif'; const w = ctx.measureText(txt).width; ctx.fillStyle = 'rgba(8,13,20,.72)'; ctx.fillRect(sx + 10, sy - 7, w + 6, 14); ctx.fillStyle = c; ctx.fillText(txt, sx + 13, sy + 4); }
/**
 * Barra de escala en km (abajo a la derecha) con cuánto tarda en recorrerla un dron y un misil de
 * crucero: ayuda a leer las distancias en tiempo (1× es tiempo real).
 */
export function drawScale(w, h) {
  const targets = [1, 2, 5, 10, 20, 50]; let km = 10; for (const t of targets) if (t * V.s > 70) { km = t; break; }
  const len = km * V.s, dur = v => { const s = km * 1000 / v; return s >= 60 ? Math.round(s / 60) + ' min' : Math.round(s) + ' s'; };
  const hint = 'Shahed ' + dur(THREATS.shahed.v) + ' · Kh-101 ' + dur(THREATS.kh101.v);
  ctx.font = '11px "IBM Plex Mono", monospace';
  const bw = Math.max(len, ctx.measureText(hint).width) + 16, x0 = w - 10 - bw, y0 = h - 50;
  ctx.fillStyle = 'rgba(12,18,25,.85)'; ctx.fillRect(x0, y0, bw, 42);
  const x = w - 18 - len, y = h - 30;
  ctx.strokeStyle = '#d9e2ec'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 2); ctx.moveTo(x + len, y - 4); ctx.lineTo(x + len, y + 2); ctx.stroke();
  ctx.fillStyle = '#d9e2ec'; ctx.font = '600 11px "IBM Plex Mono", monospace'; ctx.fillText(km + ' km', x, y - 6);
  ctx.fillStyle = '#8a9aac'; ctx.font = '10px "IBM Plex Mono", monospace'; ctx.fillText(hint, x0 + 8, y + 15);
}
/** Ruta de una salva: línea, flecha, retícula sobre el blanco y etiqueta. */
export function drawRoute(sv, hi) {
  const T = THREATS[sv.type]; const pts = sv.pts; if (!pts || !pts.length) return;
  const off = isOffmap(T);
  ctx.strokeStyle = hi ? 'rgba(255,120,100,.95)' : 'rgba(255,91,77,.55)'; ctx.lineWidth = hi ? 2 : 1.4; ctx.setLineDash(off ? [10, 6] : [6, 4]);
  ctx.beginPath(); for (const p of pts) { const [a, b] = toS(p[0], p[1]); ctx.lineTo(a, b); } ctx.stroke(); ctx.setLineDash([]);
  const L = pts.length;
  if (L >= 2) { // flecha
    const [a, b] = toS(...pts[L - 2]), [c2, d2] = toS(...pts[L - 1]); const ang = Math.atan2(d2 - b, c2 - a);
    ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.moveTo(c2, d2); ctx.lineTo(c2 - 10 * Math.cos(ang - .4), d2 - 10 * Math.sin(ang - .4)); ctx.lineTo(c2 - 10 * Math.cos(ang + .4), d2 - 10 * Math.sin(ang + .4)); ctx.fill();
    ctx.strokeStyle = '#ff5b4d'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(c2, d2, 7, 0, 7); ctx.moveTo(c2 - 11, d2); ctx.lineTo(c2 + 11, d2); ctx.moveTo(c2, d2 - 11); ctx.lineTo(c2, d2 + 11); ctx.stroke();
  }
  const [a, b] = toS(...pts[0]);
  if (!sv.preview) labelAt(a, b, (sv.count > 1 ? sv.count + '× ' : '') + T.short + (off ? ' (desde ' + (sv.launchDist || T.launchDist) + ' km)' : ''), '#ffb3aa');
  for (const p of pts) { const [x, y] = toS(p[0], p[1]); ctx.fillStyle = '#ff5b4d'; ctx.fillRect(x - 2, y - 2, 4, 4); }
}

const STATUS_COLOR = { operational: '#6fd08c', damaged: '#e6a53c', destroyed: '#ff5b4d' };

/** Objetivo: ícono cuadrado con la letra del tipo, nombre y barra de vida. hide: el estado no se conoce (vista del atacante). */
function drawObjective(g, isSel, hide = false) {
  const tt = TARGET_TYPES[g.type], [sx, sy] = toS(g.x, g.y), hp = hide ? g.maxHp : g.hp ?? g.maxHp, st = hide ? 'operational' : g.status || 'operational', col = hide ? '#8a9aac' : STATUS_COLOR[st];
  // huella real del objetivo cuando el zoom la hace visible
  const rpx = tt.radius / 1000 * V.s; if (rpx > 4) { ctx.strokeStyle = 'rgba(242,212,138,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sx, sy, rpx, 0, 7); ctx.stroke(); }
  ctx.fillStyle = st === 'destroyed' ? '#3a2422' : '#1f2630'; ctx.strokeStyle = isSel ? '#e6a53c' : col; ctx.lineWidth = isSel ? 2.2 : 1.6;
  ctx.beginPath(); ctx.rect(sx - 8, sy - 8, 16, 16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f2e6c9'; ctx.font = '700 10px "IBM Plex Mono", monospace'; ctx.textAlign = 'center'; ctx.fillText(tt.icon, sx, sy + 3.5); ctx.textAlign = 'left';
  if (st === 'destroyed') { ctx.strokeStyle = '#ff5b4d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx - 9, sy - 9); ctx.lineTo(sx + 9, sy + 9); ctx.moveTo(sx + 9, sy - 9); ctx.lineTo(sx - 9, sy + 9); ctx.stroke(); }
  // nombre corto + barra de vida, centrados debajo del ícono (no compiten con las etiquetas de unidades)
  ctx.font = '600 10.5px "IBM Plex Sans", sans-serif';
  const txt = g.short || g.name, tw = Math.max(ctx.measureText(txt).width, 40), x0 = sx - tw / 2;
  ctx.fillStyle = 'rgba(8,13,20,.8)'; ctx.fillRect(x0 - 4, sy + 10, tw + 8, 20);
  ctx.fillStyle = '#f2e6c9'; ctx.fillText(txt, x0, sy + 21);
  const f = Math.max(0, hp / g.maxHp);
  ctx.fillStyle = '#2a323c'; ctx.fillRect(x0, sy + 24, tw, 3);
  ctx.fillStyle = col; ctx.fillRect(x0, sy + 24, tw * f, 3);
}

/** Posición propuesta: marcador translúcido, alcance de tiro y horizonte de radar contra 50 m. */
function drawPreview(p) {
  const [sx, sy] = toS(p.x, p.y);
  ctx.save(); ctx.globalAlpha = 0.85;
  ctx.strokeStyle = '#e6a53c'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.arc(sx, sy, 13, 0, 7); ctx.stroke();
  if (p.mode === 'placeDef') {
    const d = DEFENSES[p.type];
    if (d.sam) { ctx.beginPath(); ctx.arc(sx, sy, d.sam.maxR * V.s, 0, 7); ctx.stroke(); }
    if (d.radar && d.radar.band !== 'ACU' && d.radar.band !== 'OPT') {
      const hz = horizon(d.kind === 'aew' ? d.alt : d.radar.mast + 0, 50);
      ctx.strokeStyle = 'rgba(79,209,197,.8)'; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.arc(sx, sy, hz * V.s, 0, 7); ctx.stroke();
      labelAt(sx + hz * V.s * 0.71 - 10, sy - hz * V.s * 0.71, 'horizonte vs 50 m: ' + hz.toFixed(0) + ' km', '#9ee7df');
    }
  }
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(230,165,60,.55)'; ctx.beginPath(); ctx.arc(sx, sy, 6, 0, 7); ctx.fill();
  ctx.restore();
  const name = p.mode === 'placeDef' ? DEFENSES[p.type].short : p.mode === 'placeJam' ? JAMMERS[p.type].short : TARGET_TYPES[p.type].name;
  labelAt(sx, sy + 16, '¿' + name + ' aquí? · ' + Math.round(surf(p.x, p.y)) + ' m', '#f2d48a');
}
