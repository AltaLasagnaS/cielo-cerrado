// @ts-check
// ---------------- INTERACCIÓN ----------------
// Mouse/táctil sobre el mapa: seleccionar, arrastrar unidades, ubicar, trazar rutas, pan y zoom
// (rueda o pellizco), tooltip; y atajos de teclado (Esc, Enter, barra espaciadora).
import { D, THREATS, TARGET_TYPES, TARGET_STATUS } from '../data/index.js';
import { clamp, segDist } from '../util/math.js';
import { kmh, mach } from '../util/format.js';
import { MAP, elev, surf, latlon } from '../physics/terrain.js';
import { isOffmap, speedAt } from '../physics/kinematics.js';
import { relativeRelief, slopeAt, terrainClass, RELIEF_RADIUS_KM } from '../physics/terrain-analysis.js';
import { S } from '../sim/state.js';
import { label, uLabel } from '../sim/log.js';
import { contactOf, attackerKnows } from '../sim/contacts.js';
import { cv, V, toS, toW, fitView } from '../render/view.js';
import { $, isDefenderView, isAttackerView } from './dom.js';
import { schedCov } from './coverage.js';
import { togglePlay } from './controls.js';
import { setMode, updateModebar, finishRoute, toast, proposePlacement, confirmPlacement, cancelPlacement } from './modes.js';
import { closeModal } from './fichas.js';
import { renderSel, deleteSelected } from './panels/selection.js';

/** Píxeles que tiene que moverse el puntero para que un toque cuente como arrastre y no como click. */
const DRAG_PX = 6;

/** ¿Qué hay bajo el punto de pantalla (sx, sy)? → { kind: thr|def|jam|obj|salvo, id } o null. */
export function hitTest(sx, sy) {
  const units = S.started ? S.units : S.setup.defs, jams = S.started ? S.jamsLive : S.setup.jams, objs = S.started ? S.objs : S.setup.objs;
  if (S.started && !S.replay) {
    const dv = isDefenderView();
    for (const th of S.threats) {
      // vista del defensor: se toca el contacto donde se lo muestra, no la amenaza real
      const c = dv ? contactOf(th, S.t) : (th.alive && th.p ? th.p : null); if (!c) continue;
      const [a, b] = toS(c.x, c.y); if (Math.hypot(a - sx, b - sy) < 9) return { kind: 'thr', id: th.id };
    }
  }
  const av = S.started && !S.replay && isAttackerView();   // vista del atacante: no se tocan las defensas que no conoce
  for (const u of units) { if (av && !attackerKnows(u, S.t)) continue; const [a, b] = toS(u.x, u.y); if (Math.hypot(a - sx, b - sy) < 11) return { kind: 'def', id: u.id }; }
  for (const j of jams) { const [a, b] = toS(j.x, j.y); if (Math.hypot(a - sx, b - sy) < 11) return { kind: 'jam', id: j.id }; }
  for (const g of objs) { const [a, b] = toS(g.x, g.y); if (Math.hypot(a - sx, b - sy) < 11) return { kind: 'obj', id: g.id }; }
  if (!S.started) for (const sv of S.setup.salvos) { for (let i = 1; i < sv.pts.length; i++) { const [a, b] = toS(...sv.pts[i - 1]), [c2, d2] = toS(...sv.pts[i]); if (segDist(sx, sy, a, b, c2, d2) < 6) return { kind: 'salvo', id: sv.id }; } }
  return null;
}
function evPos(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

// Gesto en curso: un solo puntero que todavía puede ser click, o ya es arrastre del mapa ('pan')
// o de un objeto ('move'). Con dos punteros es pellizco (zoom) y el gesto se anula.
const pointers = new Map(); let pinch = null, gesture = null;
const SETUP_LIST = { def: () => S.setup.defs, jam: () => S.setup.jams, obj: () => S.setup.objs };

/** Click corto: proponer ubicación, agregar punto de ruta o seleccionar. */
function click(g) {
  const [wx, wy] = toW(g.sx, g.sy);
  if (S.mode === 'placeDef' || S.mode === 'placeJam' || S.mode === 'placeObj') {
    if (S.started) { toast('Reiniciá la simulación para editar el escenario.'); return; }
    proposePlacement(wx, wy); return;
  }
  if (S.mode === 'measure') {   // regla: primer punto, segundo punto; un tercero empieza otra medición
    const p = [+wx.toFixed(3), +wy.toFixed(3)], m = S.measure || (S.measure = { a: null, b: null });
    if (!m.a || m.b) { m.a = p; m.b = null; } else m.b = p;
    updateModebar(); return;
  }
  if (S.mode === 'route') {
    const T = THREATS[S.atk.type];
    if (isOffmap(T) && S.route.pts.length >= 2) return;   // esperando confirmación
    let p = [+wx.toFixed(2), +wy.toFixed(2)];
    S.route.targetUnit = S.route.targetObj = null;
    if (g.hit && g.hit.kind === 'def') { const u = S.setup.defs.find(v => v.id === g.hit.id); p = [u.x, u.y]; S.route.targetUnit = u.id; }
    else if (g.hit && g.hit.kind === 'obj') { const o = S.setup.objs.find(v => v.id === g.hit.id); p = [o.x, o.y]; S.route.targetObj = o.id; }
    S.route.pts.push(p); updateModebar();
    return;
  }
  // Shift + click sobre defensas (antes de iniciar): selección múltiple para editar en grupo (F03)
  if (g.shift && g.hit?.kind === 'def' && !S.started) {
    if (!S.multi.length && S.sel?.kind === 'def') S.multi = [S.sel.id];
    S.multi = S.multi.includes(g.hit.id) ? S.multi.filter(i => i !== g.hit.id) : [...S.multi, g.hit.id];
    S.sel = S.multi.length === 1 ? { kind: 'def', id: S.multi[0] } : null; if (S.multi.length === 1) S.multi = [];
    renderSel(); return;
  }
  S.multi = [];
  if (g.hit) { S.sel = g.hit; renderSel(); }
}

/**
 * Termina el rectángulo de selección (S.box, en km): suma al grupo las defensas que quedaron adentro.
 * Solo las del armado (antes de iniciar), así que no consulta nada oculto.
 */
export function boxSelect() {
  const b = S.box; S.box = null; if (!b) return;
  const [x0, x1] = [Math.min(b.a[0], b.b[0]), Math.max(b.a[0], b.b[0])], [y0, y1] = [Math.min(b.a[1], b.b[1]), Math.max(b.a[1], b.b[1])];
  const ins = S.setup.defs.filter(u => u.x >= x0 && u.x <= x1 && u.y >= y0 && u.y <= y1).map(u => u.id);
  if (!S.multi.length && S.sel?.kind === 'def') S.multi = [S.sel.id];
  S.multi = [...new Set([...S.multi, ...ins])];
  S.sel = S.multi.length === 1 ? { kind: 'def', id: S.multi[0] } : null; if (S.multi.length === 1) S.multi = [];
  renderSel();
}

export function initInput() {
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId); pointers.set(e.pointerId, evPos(e));
  if (pointers.size === 2) { const [p1, p2] = [...pointers.values()]; pinch = { d: Math.hypot(p1[0] - p2[0], p1[1] - p2[1]), s: V.s }; gesture = null; return; }
  if (pointers.size > 2) return;
  const [sx, sy] = evPos(e);
  gesture = { sx, sy, cx: V.cx, cy: V.cy, kind: null, hit: hitTest(sx, sy), shift: e.shiftKey };
});
cv.addEventListener('pointermove', e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, evPos(e));
  if (pinch && pointers.size === 2) { const [p1, p2] = [...pointers.values()]; const d = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]); V.s = clamp(pinch.s * d / pinch.d, 1, 80); return; }
  const [sx, sy] = evPos(e), g = gesture;
  if (g) {
    if (!g.kind) {
      if (Math.hypot(sx - g.sx, sy - g.sy) < DRAG_PX) return;
      // arrastrar algo ya ubicado solo en modo selección y antes de iniciar; si no, se mueve el mapa
      const movable = S.mode === 'select' && !S.started && g.hit && SETUP_LIST[g.hit.kind];
      // Shift + arrastrar sobre el mapa vacío (antes de iniciar): rectángulo de selección múltiple (F03)
      const box = S.mode === 'select' && !S.started && g.shift && !g.hit;
      g.kind = movable ? 'move' : box ? 'box' : 'pan';
      if (box) S.box = { a: toW(g.sx, g.sy), b: toW(sx, sy) };
      if (movable) { S.sel = g.hit; renderSel(); }
    }
    if (g.kind === 'pan') { V.cx = g.cx - (sx - g.sx) / V.s; V.cy = g.cy - (sy - g.sy) / V.s; return; }
    if (g.kind === 'box') { if (S.box) S.box.b = toW(sx, sy); return; }
    const [wx, wy] = toW(sx, sy), o = SETUP_LIST[g.hit.kind]().find(v => v.id === g.hit.id);
    if (o) {
      o.x = +wx.toFixed(2); o.y = +wy.toFixed(2);
      for (const sv of S.setup.salvos) if ((g.hit.kind === 'def' && sv.targetUnit === o.id) || (g.hit.kind === 'obj' && sv.targetObj === o.id)) sv.pts[sv.pts.length - 1] = [o.x, o.y];
    }
    return;
  }
  if (S.mode === 'measure' && S.measure?.a && !S.measure.b) S.measure.cur = toW(sx, sy);
  showTip(sx, sy);
});
const endPtr = e => {
  pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null;
  const g = gesture; gesture = null;
  if (!g || e.type === 'pointercancel') return;
  if (!g.kind) click(g);
  else if (g.kind === 'move') { schedCov(); renderSel(); }
  else if (g.kind === 'box') boxSelect();
};
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
cv.addEventListener('pointerleave', () => { $('#tip').hidden = true; });
cv.addEventListener('wheel', e => { e.preventDefault(); const [sx, sy] = evPos(e), [wx, wy] = toW(sx, sy); const f = Math.exp(-e.deltaY * 0.0015); V.s = clamp(V.s * f, 1, 80); const [nx, ny] = toW(sx, sy); V.cx += wx - nx; V.cy += wy - ny; }, { passive: false });
cv.addEventListener('dblclick', e => { if (S.mode === 'route' && !isOffmap(THREATS[S.atk.type])) { e.preventDefault(); finishRoute(); } });
$('#zin').onclick = () => { V.s = clamp(V.s * 1.3, 1, 80); };
$('#zout').onclick = () => { V.s = clamp(V.s / 1.3, 1, 80); };
$('#zfit').onclick = fitView;
$('#zrule').onclick = () => setMode(S.mode === 'measure' ? 'select' : 'measure');
document.addEventListener('keydown', e => {
  if (!$('#modal').hidden) { if (e.key === 'Escape') { e.preventDefault(); closeModal(); } return; }
  if (/** @type {HTMLElement} */ (e.target).closest?.('input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="textbox"]')) return;
  if (e.key === 'Delete') { if (deleteSelected()) e.preventDefault(); return; }
  if (e.key === 'Escape') { if (S.preview) cancelPlacement(); else { if (S.multi.length) { S.multi = []; renderSel(); } setMode('select'); } }
  if (e.key === 'Enter') { if (S.preview) confirmPlacement(); else if (S.mode === 'route') finishRoute(); }
  if (e.key === ' ') { e.preventDefault(); togglePlay(); }
  if (e.key === 'm' || e.key === 'M') setMode(S.mode === 'measure' ? 'select' : 'measure');
});
}

/** Tooltip: datos de la amenaza o unidad bajo el cursor, o coordenadas y elevación del terreno. */
function showTip(sx, sy) {
  const tip = $('#tip'); const h = hitTest(sx, sy); let txt = '';
  const [wx, wy] = toW(sx, sy);
  if (h && h.kind === 'thr') {
    const th = S.threats.find(t => t.id === h.id); const dv = isDefenderView();
    const by = Object.keys(th.det).filter(k => S.t - th.det[k] < 12).map(k => uLabel(S.units.find(u => u.id == k))).join(', ') || 'nadie';
    if (dv) {
      // solo lo que sabe la defensa: posición y velocidad estimadas por la pista, edad del último reporte
      const c = contactOf(th, S.t); if (!c) return;
      txt = 'Pista #' + th.id + (c.lost ? ' · perdida hace ' + Math.round(c.age) + ' s' : '') + '\nAlt: ' + Math.round(c.z) + ' m (' + Math.round(c.z - surf(c.x, c.y)) + ' AGL)\nVel: ' + kmh(c.v) + ' · ' + mach(c.v) + ' (estimada)\nDetectada por: ' + by;
    } else {
      const p = th.p, v = speedAt(th, S.t);
      txt = label(th) + '\nAlt: ' + Math.round(p.z) + ' m (' + Math.round(p.z - surf(p.x, p.y)) + ' AGL)\nVel: ' + kmh(v) + ' · ' + mach(v) + '\nA ' + p.rem.toFixed(1) + ' km del blanco' + (S.started && !S.replay && isAttackerView() ? '' : '\nDetectada por: ' + by);   // el atacante no sabe qué sensores lo ven
    }
  } else if (h && h.kind === 'def') {
    const u = (S.started ? S.units : S.setup.defs).find(u => u.id === h.id); txt = (u.name || D(u).short) + '\n' + D(u).name;
  } else if (h && h.kind === 'obj') {
    const g = (S.started ? S.objs : S.setup.objs).find(v => v.id === h.id), hp = g.hp ?? g.maxHp;
    txt = 'OBJETIVO: ' + g.name + '\n' + TARGET_TYPES[g.type].name + (S.started && !S.replay && isAttackerView() ? '\nDaño: sin evaluar (vista del atacante)' : '\nHP ' + hp + ' / ' + g.maxHp + ' · ' + TARGET_STATUS[g.status || 'operational']);
  } else if (MAP && wx >= 0 && wy >= 0 && wx <= MAP.wKm && wy <= MAP.hKm) {
    const e = elev(wx, wy), ll = latlon(wx, wy);
    txt = wx.toFixed(1) + ' / ' + wy.toFixed(1) + ' km · ' + ll[0].toFixed(3) + '°, ' + ll[1].toFixed(3) + '°\n';
    if (e <= 0) txt += 'Mar' + (e < -5 ? ' (prof. ' + Math.round(-e) + ' m)' : '');
    else { const rel = Math.round(relativeRelief(wx, wy)); txt += 'Elevación: ' + Math.round(e) + ' m\nRelieve relativo: ' + (rel >= 0 ? '+' : '') + rel + ' m (vs. ' + RELIEF_RADIUS_KM + ' km alrededor)\nLectura: ' + terrainClass(wx, wy) + ' · pendiente ' + Math.round(slopeAt(wx, wy)) + '%'; }
  }
  if (!txt) { tip.hidden = true; return; }
  tip.textContent = txt; tip.hidden = false;
  const r = $('#mapwrap').getBoundingClientRect(); let x = sx + 14, y = sy + 14; if (x > r.width - 330) x = sx - 330; if (y > r.height - 110) y = sy - 110; tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
