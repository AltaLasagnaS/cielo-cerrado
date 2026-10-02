// Modos de edición del mapa (seleccionar, ubicar defensa/jammer, trazar ruta) y la barra de avisos.
import { DEFENSES, THREATS, JAMMERS } from '../data/index.js';
import { esc } from '../util/format.js';
import { isOffmap } from '../physics/kinematics.js';
import { S } from '../sim/state.js';
import { addSalvo } from '../sim/setup.js';
import { $ } from './dom.js';
import { schedCov } from './coverage.js';
import { renderTabs } from './panels/index.js';
import { renderAtk } from './panels/attack.js';
import { renderSel } from './panels/selection.js';

/** Cambia de modo: 'select' | 'placeDef' | 'placeJam' | 'route'. type = clave de lo que se ubica. */
export function setMode(m, type) {
  S.mode = m; S.placeType = type || null; if (m !== 'route') S.route = null; updateModebar(); renderTabs();
}
/** Muestra la instrucción del modo actual en la barra inferior del mapa. */
export function updateModebar() {
  const mb = $('#modebar');
  if (S.mode === 'select') { mb.hidden = true; return; }
  mb.hidden = false;
  let html = '';
  if (S.mode === 'placeDef') html = 'Tocá el mapa para ubicar <b>' + esc(DEFENSES[S.placeType].short) + '</b>.';
  else if (S.mode === 'placeJam') html = 'Tocá el mapa para ubicar <b>' + esc(JAMMERS[S.placeType].short) + '</b>.';
  else if (S.mode === 'route') { const T = THREATS[S.atk.type]; const off = isOffmap(T); html = off ? (S.route.pts.length ? 'Ahora tocá el <b>blanco</b>.' : 'Tocá un punto en la <b>dirección de lanzamiento</b>.') : 'Tocá el inicio, waypoints y el <b>blanco</b> (último punto). Puntos: ' + S.route.pts.length; if (!off) html += ' <button class="btn sm pri" id="mbOk">Confirmar ruta</button>'; }
  mb.innerHTML = html + ' <button class="btn sm" id="mbX">Cancelar</button>';
  $('#mbX').onclick = () => setMode('select');
  const ok = $('#mbOk'); if (ok) ok.onclick = finishRoute;
}
/** Convierte la ruta trazada en una salva programada. */
export function finishRoute() {
  if (!S.route || S.route.pts.length < 2) { toast('La ruta necesita al menos 2 puntos.'); return; }
  const a = S.atk; const sv = addSalvo({ ...a, pts: S.route.pts });
  sv.targetUnit = S.route.targetUnit;
  S.sel = { kind: 'salvo', id: sv.id }; setMode('select'); renderAtk(); renderSel(); schedCov();
}
/** Aviso breve en la barra inferior (2,2 s). */
let toastT = null;
export function toast(m) { const mb = $('#modebar'); mb.hidden = false; mb.textContent = m; clearTimeout(toastT); toastT = setTimeout(() => updateModebar(), 2200); }
