'use strict';
// ---------------- INTERACCIÓN ----------------
let drag = null;
function hitTest(sx, sy) {
  const units = S.started ? S.units : S.setup.defs, jams = S.started ? S.jamsLive : S.setup.jams;
  if (S.started) for (const th of S.threats) { if (!th.alive || !th.p) continue; const [a, b] = toS(th.p.x, th.p.y); if (Math.hypot(a - sx, b - sy) < 9) return { kind: 'thr', id: th.id }; }
  for (const u of units) { const [a, b] = toS(u.x, u.y); if (Math.hypot(a - sx, b - sy) < 11) return { kind: 'def', id: u.id }; }
  for (const j of jams) { const [a, b] = toS(j.x, j.y); if (Math.hypot(a - sx, b - sy) < 11) return { kind: 'jam', id: j.id }; }
  if (!S.started) for (const sv of S.setup.salvos) { for (let i = 1; i < sv.pts.length; i++) { const [a, b] = toS(...sv.pts[i - 1]), [c2, d2] = toS(...sv.pts[i]); if (segDist(sx, sy, a, b, c2, d2) < 6) return { kind: 'salvo', id: sv.id }; } }
  return null;
}
function segDist(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1; const t = clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1); return Math.hypot(px - ax - dx * t, py - ay - dy * t); }
function evPos(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
const pointers = new Map(); let pinch = null;
cv.addEventListener('pointerdown', e => {
  cv.setPointerCapture(e.pointerId); pointers.set(e.pointerId, evPos(e));
  if (pointers.size === 2) { const [p1, p2] = [...pointers.values()]; pinch = { d: Math.hypot(p1[0] - p2[0], p1[1] - p2[1]), s: V.s }; drag = null; return; }
  const [sx, sy] = evPos(e), [wx, wy] = toW(sx, sy);
  if (S.mode === 'placeDef' || S.mode === 'placeJam') {
    if (S.started) { toast('Reiniciá la simulación para editar el escenario.'); return; }
    if (S.mode === 'placeDef') { const u = addDef(S.placeType, +wx.toFixed(2), +wy.toFixed(2)); S.sel = { kind: 'def', id: u.id }; }
    else { const j = addJam(S.placeType, +wx.toFixed(2), +wy.toFixed(2)); S.sel = { kind: 'jam', id: j.id }; }
    renderSel(); renderTabs(); schedCov(); return;
  }
  if (S.mode === 'route') {
    let p = [+wx.toFixed(2), +wy.toFixed(2)];
    const h = hitTest(sx, sy); if (h && h.kind === 'def') { const u = S.setup.defs.find(v => v.id === h.id); p = [u.x, u.y]; S.route.targetUnit = u.id; } else S.route.targetUnit = null;
    S.route.pts.push(p); updateModebar();
    const T = THREATS[S.atk.type]; if (['ballistic', 'highdive', 'hilo'].includes(T.prof) && S.route.pts.length >= 2) finishRoute();
    return;
  }
  const h = hitTest(sx, sy);
  if (h) { S.sel = h; renderSel(); if (!S.started && (h.kind === 'def' || h.kind === 'jam')) drag = { kind: h.kind, id: h.id, moved: false }; else drag = null; }
  else { drag = { pan: true, sx, sy, cx: V.cx, cy: V.cy, moved: false }; }
});
cv.addEventListener('pointermove', e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, evPos(e));
  if (pinch && pointers.size === 2) { const [p1, p2] = [...pointers.values()]; const d = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]); V.s = clamp(pinch.s * d / pinch.d, 1, 80); return; }
  const [sx, sy] = evPos(e);
  if (drag && drag.pan) { V.cx = drag.cx - (sx - drag.sx) / V.s; V.cy = drag.cy - (sy - drag.sy) / V.s; drag.moved = true; return; }
  if (drag && (drag.kind === 'def' || drag.kind === 'jam')) {
    const [wx, wy] = toW(sx, sy); const o = drag.kind === 'def' ? S.setup.defs.find(u => u.id === drag.id) : S.setup.jams.find(u => u.id === drag.id);
    if (o) { o.x = +wx.toFixed(2); o.y = +wy.toFixed(2); drag.moved = true; for (const sv of S.setup.salvos) if (sv.targetUnit === o.id) sv.pts[sv.pts.length - 1] = [o.x, o.y]; }
    return;
  }
  showTip(sx, sy);
});
const endPtr = e => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null; if (drag && drag.moved && drag.kind) { schedCov(); renderSel(); } drag = null; };
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
cv.addEventListener('pointerleave', () => { $('#tip').hidden = true; });
cv.addEventListener('wheel', e => { e.preventDefault(); const [sx, sy] = evPos(e), [wx, wy] = toW(sx, sy); const f = Math.exp(-e.deltaY * 0.0015); V.s = clamp(V.s * f, 1, 80); const [nx, ny] = toW(sx, sy); V.cx += wx - nx; V.cy += wy - ny; }, { passive: false });
cv.addEventListener('dblclick', e => { if (S.mode === 'route') { e.preventDefault(); finishRoute(); } });
$('#zin').onclick = () => { V.s = clamp(V.s * 1.3, 1, 80); };
$('#zout').onclick = () => { V.s = clamp(V.s / 1.3, 1, 80); };
$('#zfit').onclick = fitView;
document.addEventListener('keydown', e => {
  if (e.target.matches('input,select,textarea')) return;
  if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); else setMode('select'); }
  if (e.key === 'Enter' && S.mode === 'route') finishRoute();
  if (e.key === ' ') { e.preventDefault(); togglePlay(); }
});
function showTip(sx, sy) {
  const tip = $('#tip'); const h = hitTest(sx, sy); let txt = '';
  const [wx, wy] = toW(sx, sy);
  if (h && h.kind === 'thr') {
    const th = S.threats.find(t => t.id === h.id); const p = th.p; const dv = $('#defView').checked;
    const v = speedAt(th, S.t);
    txt = (dv ? 'Pista #' + th.id + (th.cls === 'dron' ? ' (dron?)' : '') : label(th)) + '\nAlt: ' + Math.round(p.z) + ' m (' + Math.round(p.z - surf(p.x, p.y)) + ' AGL)\nVel: ' + kmh(v) + ' · ' + mach(v) + '\nA ' + p.rem.toFixed(1) + ' km del blanco\nDetectada por: ' + (Object.keys(th.det).filter(k => S.t - th.det[k] < 12).map(k => uLabel(S.units.find(u => u.id == k))).join(', ') || 'nadie');
  } else if (h && h.kind === 'def') {
    const u = (S.started ? S.units : S.setup.defs).find(u => u.id === h.id); txt = (u.name || D(u).short) + '\n' + D(u).name;
  } else if (MAP && wx >= 0 && wy >= 0 && wx <= MAP.wKm && wy <= MAP.hKm) {
    const e = elev(wx, wy), ll = latlon(wx, wy);
    txt = wx.toFixed(1) + ' / ' + wy.toFixed(1) + ' km\n' + (e <= 0 ? 'Mar' + (e < -5 ? ' (prof. ' + Math.round(-e) + ' m)' : '') : 'Elev. ' + Math.round(e) + ' m') + '\n' + ll[0].toFixed(3) + '°, ' + ll[1].toFixed(3) + '°';
  }
  if (!txt) { tip.hidden = true; return; }
  tip.textContent = txt; tip.hidden = false;
  const r = $('#mapwrap').getBoundingClientRect(); let x = sx + 14, y = sy + 14; if (x > r.width - 220) x = sx - 220; if (y > r.height - 110) y = sy - 110; tip.style.left = x + 'px'; tip.style.top = y + 'px';
}
function setMode(m, type) {
  S.mode = m; S.placeType = type || null; if (m !== 'route') S.route = null; updateModebar(); renderTabs();
}
function updateModebar() {
  const mb = $('#modebar');
  if (S.mode === 'select') { mb.hidden = true; return; }
  mb.hidden = false;
  let html = '';
  if (S.mode === 'placeDef') html = 'Tocá el mapa para ubicar <b>' + esc(DEFENSES[S.placeType].short) + '</b>.';
  else if (S.mode === 'placeJam') html = 'Tocá el mapa para ubicar <b>' + esc(JAMMERS[S.placeType].short) + '</b>.';
  else if (S.mode === 'route') { const T = THREATS[S.atk.type]; const off = ['ballistic', 'highdive', 'hilo'].includes(T.prof); html = off ? (S.route.pts.length ? 'Ahora tocá el <b>blanco</b>.' : 'Tocá un punto en la <b>dirección de lanzamiento</b>.') : 'Tocá el inicio, waypoints y el <b>blanco</b> (último punto). Puntos: ' + S.route.pts.length; if (!off) html += ' <button class="btn sm pri" id="mbOk">Confirmar ruta</button>'; }
  mb.innerHTML = html + ' <button class="btn sm" id="mbX">Cancelar</button>';
  $('#mbX').onclick = () => setMode('select');
  const ok = $('#mbOk'); if (ok) ok.onclick = finishRoute;
}
function finishRoute() {
  if (!S.route || S.route.pts.length < 2) { toast('La ruta necesita al menos 2 puntos.'); return; }
  const a = S.atk; const sv = addSalvo({ ...a, pts: S.route.pts });
  sv.targetUnit = S.route.targetUnit;
  S.sel = { kind: 'salvo', id: sv.id }; setMode('select'); renderAtk(); renderSel(); schedCov();
}
let toastT = null;
function toast(m) { const mb = $('#modebar'); mb.hidden = false; mb.textContent = m; clearTimeout(toastT); toastT = setTimeout(() => updateModebar(), 2200); }
