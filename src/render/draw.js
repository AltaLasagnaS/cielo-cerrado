// ---------------- DIBUJO ----------------
// Redibuja todo el mapa en cada cuadro: relieve, cobertura, grilla, anillos de alcance, sectores,
// "strobes" de interferencia, rutas, jammers, unidades, impactos, amenazas, interceptores y explosiones.
import { THREATS, JAMMERS, D } from '../data/index.js';
import { azOf, clamp } from '../util/math.js';
import { MAP } from '../physics/terrain.js';
import { jamJ } from '../physics/radar.js';
import { isOffmap, posAt } from '../physics/kinematics.js';
import { S } from '../sim/state.js';
import { isDefenderView } from '../ui/dom.js';
import { cv, ctx, dpr, V, toS } from './view.js';
import { drawTerrain, drawPeaks } from './terrain.js';
import { covCanvas } from './coverage.js';

export function draw() {
  if (!MAP) return;
  const w = cv.width / dpr, h = cv.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0a1520'; ctx.fillRect(0, 0, w, h);
  // relieve (raster suavizado + vectores) y cobertura (interpolada, sin bloques)
  const [ox, oy] = toS(0, 0), mw = MAP.wKm * V.s, mh = MAP.hKm * V.s;
  drawTerrain({ ctx, dpr, s: V.s, ox, oy }, S.relief);
  if (S.showCov && covCanvas.width) { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(covCanvas, ox, oy, mw, mh); }
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
  const units = S.started ? S.units : S.setup.defs;
  const jams = S.started ? S.jamsLive : S.setup.jams;
  // anillos de alcance y sectores
  for (const u of units) {
    const d = D(u); const [sx, sy] = toS(u.x, u.y); const dead = S.started && !u.alive;
    if (dead) continue;
    const isSel = S.sel && S.sel.kind === 'def' && S.sel.id === u.id;
    if (d.sam) {
      ctx.setLineDash([5, 5]); ctx.strokeStyle = isSel ? 'rgba(230,165,60,.9)' : (d.side === 'RU' ? 'rgba(255,159,90,.45)' : 'rgba(98,182,255,.45)'); ctx.lineWidth = isSel ? 1.6 : 1;
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
    for (const j of jams) { if (JAMMERS[j.type].gnssJam || !j.on) continue; const jaz = azOf(j.x - u.x, j.y - u.y); const J = jamJ(u, jaz, [j]); if (J < 0.2) continue;
      const [a, b] = toS(u.x, u.y), [c2, d2] = toS(j.x, j.y); ctx.strokeStyle = `rgba(197,140,255,${clamp(0.25 + Math.log10(J + 1) * 0.3, 0.25, 0.9)})`; ctx.lineWidth = 1.2; ctx.setLineDash([8, 4]); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c2, d2); ctx.stroke(); ctx.setLineDash([]); }
  }
  // rutas de salvas (setup)
  if (!S.started || !S.running) for (const sv of S.setup.salvos) drawRoute(sv, S.sel && S.sel.kind === 'salvo' && S.sel.id === sv.id);
  if (S.route) drawRoute({ type: S.atk.type, pts: S.route.pts, preview: true }, true);
  // jammers
  for (const j of jams) {
    const J = JAMMERS[j.type], [sx, sy] = toS(j.x, j.y); const isSel = S.sel && S.sel.kind === 'jam' && S.sel.id === j.id;
    if (J.gnssJam) { ctx.strokeStyle = j.on ? 'rgba(197,140,255,.6)' : 'rgba(197,140,255,.2)'; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.arc(sx, sy, J.radius * V.s, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
    ctx.fillStyle = j.on ? '#c58cff' : '#5d4a75'; ctx.strokeStyle = isSel ? '#e6a53c' : '#1a1024'; ctx.lineWidth = isSel ? 2 : 1;
    ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = k % 2 ? 4 : 9; ctx.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke();
    labelAt(sx, sy, J.short, '#d8b8ff');
  }
  // unidades
  for (const u of units) {
    const d = D(u), [sx, sy] = toS(u.x, u.y), dead = S.started && !u.alive;
    const isSel = S.sel && S.sel.kind === 'def' && S.sel.id === u.id;
    const c = d.side === 'RU' ? '#ff9f5a' : '#62b6ff';
    ctx.lineWidth = isSel ? 2.2 : 1.2; ctx.strokeStyle = isSel ? '#e6a53c' : '#08101a'; ctx.fillStyle = dead ? '#3a4452' : c;
    ctx.beginPath();
    if (d.kind === 'sensor' || d.kind === 'aew') { ctx.moveTo(sx, sy - 8); ctx.lineTo(sx + 8, sy); ctx.lineTo(sx, sy + 8); ctx.lineTo(sx - 8, sy); ctx.closePath(); }
    else if (d.kind === 'acoustic') { ctx.arc(sx, sy, 5, 0, 7); }
    else if (d.kind === 'gun') { ctx.rect(sx - 6, sy - 6, 12, 12); }
    else { ctx.moveTo(sx, sy - 9); ctx.lineTo(sx + 8, sy + 6); ctx.lineTo(sx - 8, sy + 6); ctx.closePath(); }
    ctx.fill(); ctx.stroke();
    if (d.kind === 'aew') { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(sx, sy, 12, 0, 7); ctx.stroke(); }
    if (dead) { ctx.strokeStyle = '#ff5b4d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx - 7, sy - 7); ctx.lineTo(sx + 7, sy + 7); ctx.moveTo(sx + 7, sy - 7); ctx.lineTo(sx - 7, sy + 7); ctx.stroke(); }
    const ammo = S.started && d.sam && u.alive ? ' ' + u.magLeft : '';
    labelAt(sx, sy, (u.name || d.short) + ammo, dead ? '#6b7888' : '#e6eef6');
  }
  // impactos
  for (const im of S.impacts) { const [sx, sy] = toS(im.x, im.y); ctx.strokeStyle = im.k === 'hit' ? '#ff5b4d' : im.k === 'miss' ? '#e6a53c' : '#6b7888'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx - 5, sy - 5); ctx.lineTo(sx + 5, sy + 5); ctx.moveTo(sx + 5, sy - 5); ctx.lineTo(sx - 5, sy + 5); ctx.stroke(); }
  // amenazas
  const dv = isDefenderView();
  for (const th of S.threats) {
    if (!th.alive || !th.p) continue;
    const tracked = S.t - th.lastNet <= 12;
    if (dv && !tracked) continue;
    const decoyLook = th.isDecoy && !dv;
    const col = tracked ? '#ff5b4d' : 'rgba(255,91,77,.55)';
    ctx.strokeStyle = 'rgba(255,91,77,.35)'; ctx.lineWidth = 1; ctx.beginPath();
    for (const p of th.trail) { const [a, b] = toS(p[0], p[1]); ctx.lineTo(a, b); } { const [a, b] = toS(th.p.x, th.p.y); ctx.lineTo(a, b); } ctx.stroke();
    const [sx, sy] = toS(th.p.x, th.p.y);
    const nx = posAt(th, S.t + 2); const hd = nx ? Math.atan2(nx.y - th.p.y, nx.x - th.p.x) : 0;
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(hd);
    ctx.fillStyle = decoyLook ? 'transparent' : col; ctx.strokeStyle = decoyLook ? '#e6a53c' : (tracked ? '#2a0806' : col); ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (th.cls === 'dron') { ctx.moveTo(6, 0); ctx.lineTo(-4, -5); ctx.lineTo(-2, 0); ctx.lineTo(-4, 5); }
    else if (th.cls === 'balistico' || th.cls === 'hiper') { ctx.moveTo(7, 0); ctx.lineTo(0, -4); ctx.lineTo(-7, 0); ctx.lineTo(0, 4); }
    else { ctx.moveTo(8, 0); ctx.lineTo(-6, -3); ctx.lineTo(-6, 3); }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
    if (V.s > 9) { ctx.font = '10px "IBM Plex Mono", monospace'; ctx.fillStyle = 'rgba(255,190,180,.9)'; ctx.fillText(dv ? '#' + th.id : th.T.short, sx + 7, sy - 6); }
  }
  // interceptores
  for (const it of S.ints) {
    if (it.done || S.t < it.tL) continue;
    const f = clamp((S.t - it.tL) / Math.max(0.1, it.tH - it.tL), 0, 1);
    const [a, b] = toS(it.x0, it.y0), [c2, d2] = toS(it.x0 + (it.px - it.x0) * f, it.y0 + (it.py - it.y0) * f);
    ctx.strokeStyle = 'rgba(120,220,255,.75)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c2, d2); ctx.stroke();
    ctx.fillStyle = '#bff0ff'; ctx.beginPath(); ctx.arc(c2, d2, 2.2, 0, 7); ctx.fill();
  }
  // explosiones
  const now = performance.now();
  S.fx = S.fx.filter(f => now - f.rt < 1400);
  for (const f of S.fx) { const k = (now - f.rt) / 1400, [sx, sy] = toS(f.x, f.y); ctx.strokeStyle = f.c; ctx.globalAlpha = 1 - k; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, (f.big ? 6 : 3) + k * (f.big ? 26 : 14), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
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
