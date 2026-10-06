// @ts-check
// Modos de edición del mapa y la barra de avisos/confirmación.
//   select   seleccionar y mover lo ya ubicado
//   placeDef ubicar una defensa · placeJam un interferidor · placeObj un objetivo
//   route    trazar la ruta de una salva
// Regla: nada se crea con un click. El click propone una posición (S.preview) y recién
// "Confirmar" (o Enter) crea la unidad; "Cancelar" (o Esc) descarta la propuesta.
import { DEFENSES, THREATS, JAMMERS, TARGET_TYPES } from '../data/index.js';
import { esc } from '../util/format.js';
import { isOffmap } from '../physics/kinematics.js';
import { surf } from '../physics/terrain.js';
import { terrainClass } from '../physics/terrain-analysis.js';
import { S } from '../sim/state.js';
import { addDef, addJam, addObj, addSalvo } from '../sim/setup.js';
import { orderMove, mobData } from '../sim/mobility.js';
import { draw, measureOf } from '../render/draw.js';
import { $ } from './dom.js';
import { schedCov } from './coverage.js';
import { renderTabs } from './panels/index.js';
import { renderAtk } from './panels/attack.js';
import { renderSel } from './panels/selection.js';

const PLACE = {
  placeDef: { cat: DEFENSES, add: addDef, sel: 'def', name: t => DEFENSES[t].short },
  placeJam: { cat: JAMMERS, add: addJam, sel: 'jam', name: t => JAMMERS[t].short },
  placeObj: { cat: TARGET_TYPES, add: addObj, sel: 'obj', name: t => TARGET_TYPES[t].name }
};

/** Cambia de modo. type = clave de lo que se ubica. Siempre descarta la propuesta pendiente. */
export function setMode(m, type) {
  S.mode = m; S.placeType = type || null; S.preview = null; if (m !== 'route') S.route = null; if (m !== 'relocate') S.relocate = null; if (m !== 'measure') S.measure = null; updateModebar(); renderTabs(); draw();
}

/** Click corto sobre el mapa en un modo de ubicación: propone la posición (no crea nada). */
export function proposePlacement(x, y) {
  S.preview = { mode: S.mode, type: S.placeType, x: +x.toFixed(2), y: +y.toFixed(2) };
  updateModebar(); draw();
}

/** Crea lo propuesto. */
export function confirmPlacement() {
  const p = S.preview; if (!p) return;
  const P = PLACE[p.mode], o = P.add(p.type, p.x, p.y);
  S.preview = null; S.sel = { kind: P.sel, id: o.id };
  renderSel(); renderTabs(); renderAtk(); schedCov(); updateModebar(); draw();
}

export function cancelPlacement() { S.preview = null; updateModebar(); draw(); }

/** Muestra la instrucción o la pregunta de confirmación del modo actual. */
export function updateModebar() {
  const mb = $('#modebar');
  if (S.mode === 'select') { mb.hidden = true; return; }
  mb.hidden = false;
  let html = '', ok = null, cancel = () => setMode('select'), cancelTxt = 'Salir';
  const P = PLACE[S.mode];
  if (P && S.preview) {
    const p = S.preview, e = Math.round(surf(p.x, p.y));
    html = `¿Colocar <b>${esc(P.name(p.type))}</b> aquí? <span class="dim">${p.x.toFixed(1)}, ${p.y.toFixed(1)} km · ${e} m · ${esc(terrainClass(p.x, p.y))}</span>`;
    ok = confirmPlacement; cancel = cancelPlacement; cancelTxt = 'Cancelar';
  } else if (P) {
    html = `Tocá el mapa donde quieras ubicar <b>${esc(P.name(S.placeType))}</b>; vas a poder confirmar o cancelar.`;
  } else if (S.mode === 'relocate') {
    const r = S.relocate, n = r?.pts.length ?? 0, u = r && S.units.find(v => v.id === r.id), vmax = u ? mobData(u)?.vmax : null;
    html = n ? `Ruta de <b>${n} punto${n > 1 ? 's' : ''}</b>: el último es el destino. Tocá más puntos o confirmá.` : 'Tocá el mapa para marcar la <b>ruta del traslado</b> (el último punto es el destino).';
    // la velocidad de marcha la decide quien ordena (no es una prestación publicada); tope: la de la ficha
    html += ` <label class="dim" for="mbKmh">Marcha</label> <input id="mbKmh" class="inp" type="number" min="1" max="${vmax ?? ''}" step="1" style="width:70px" placeholder="km/h" value="${r?.kmh ?? ''}" title="Velocidad de marcha que ordenás, en km/h (máximo ${vmax ?? '?'} km/h, la del vehículo más lento)"> <span class="dim">km/h (máx ${vmax ?? '?'})</span>`;
    if (n) ok = finishRelocate;
    cancelTxt = 'Cancelar';
  } else if (S.mode === 'measure') {
    const m = S.measure;
    if (m?.a && m.b) { const r = measureOf(m.a, m.b); html = `Distancia horizontal: <b>${r.km.toFixed(r.km < 10 ? 2 : 1)} km</b> · rumbo ${Math.round(r.az)}°. Tocá otro punto para medir de nuevo.`; }
    else html = m?.a ? 'Tocá el <b>segundo punto</b>.' : 'Regla: tocá el <b>primer punto</b> (tecla M o Esc para salir).';
  } else if (S.mode === 'route') {
    const T = THREATS[S.atk.type], off = isOffmap(T), n = S.route.pts.length;
    if (off) {
      if (n >= 2) { html = `¿Lanzar <b>${S.atk.count}× ${esc(T.short)}</b> desde ${S.atk.launchDist} km hacia este blanco?`; ok = finishRoute; cancel = () => { S.route.pts = []; S.route.targetUnit = S.route.targetObj = null; updateModebar(); draw(); }; cancelTxt = 'Cancelar'; }
      else html = n ? 'Ahora tocá el <b>blanco</b> (un objetivo o una defensa para apuntarle).' : 'Tocá un punto en la <b>dirección de lanzamiento</b>.';
    } else {
      html = 'Tocá el inicio, los waypoints y el <b>blanco</b> (último punto). Puntos: ' + n;
      if (n >= 2) ok = finishRoute;
    }
  }
  mb.innerHTML = html + (ok ? ' <button class="btn sm pri" id="mbOk">Confirmar</button>' : '') + ` <button class="btn sm" id="mbX">${cancelTxt}</button>`;
  $('#mbX').onclick = cancel;
  const kIn = $('#mbKmh'); if (kIn) kIn.oninput = () => { if (S.relocate) S.relocate.kmh = +kIn.value || null; };
  if (ok) $('#mbOk').onclick = ok;
}

/** Convierte la ruta trazada en una salva programada. */
export function finishRoute() {
  if (!S.route || S.route.pts.length < 2) { toast('La ruta necesita al menos 2 puntos.'); return; }
  const sv = addSalvo({ ...S.atk, pts: S.route.pts, targetUnit: S.route.targetUnit, targetObj: S.route.targetObj });
  S.sel = { kind: 'salvo', id: sv.id }; setMode('select'); renderAtk(); renderSel(); schedCov();
}

/** Ordena el traslado marcado (sim/mobility.js); si no se puede, avisa por qué. */
export function finishRelocate() {
  const r = S.relocate, u = r && S.units.find(v => v.id === r.id); if (!u || !r.pts.length) return;
  if (!(r.kmh > 0)) { toast('Escribí la velocidad de marcha (km/h).'); return; }
  const why = orderMove(u, r.pts, r.kmh);
  setMode('select'); renderSel();
  toast(why ? 'No se puede trasladar: ' + why + '.' : `${u.name} se repliega para trasladarse.`);
}

/** Aviso breve en la barra inferior (2,2 s). */
let toastT = null;
export function toast(m) { const mb = $('#modebar'); mb.hidden = false; mb.textContent = m; clearTimeout(toastT); toastT = setTimeout(() => updateModebar(), 2200); }
