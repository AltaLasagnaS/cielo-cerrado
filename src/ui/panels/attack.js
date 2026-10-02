// Pestaña "Ataque": configurar una salva nueva, trazar su ruta y listar las programadas.
import { CLS_NAME, THREATS } from '../../data/index.js';
import { esc, kmh, mach, money } from '../../util/format.js';
import { isOffmap } from '../../physics/kinematics.js';
import { S } from '../../sim/state.js';
import { $ } from '../dom.js';
import { updateModebar, toast } from '../modes.js';
import { openFicha } from '../fichas.js';
import { renderSel } from './selection.js';

export function renderAtk() {
  const el = $('#tab-atk');
  if (!S.atk) S.atk = defaultAtk('shahed');
  const a = S.atk, T = THREATS[a.type];
  const off = isOffmap(T);
  const opts = side => Object.entries(THREATS).filter(([, t]) => t.side === side).map(([k, t]) => `<option value="${k}" ${k === a.type ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
  el.innerHTML = `
    <div class="grp"><h3>Nueva salva</h3>
      <div class="row"><select id="aType" class="sel" style="flex:1;min-width:0"><optgroup label="Rusia">${opts('RU')}</optgroup><optgroup label="Ucrania / OTAN">${opts('UA')}</optgroup></select><button class="btn sm" id="aInfo">Ficha</button></div>
      <p class="hint">${esc(CLS_NAME[T.cls])} · ${kmh(T.v)} (${mach(T.v)}) · RCS ≈${T.rcs} m² · ${money(T.cost)} c/u</p>
      <div class="field"><label for="aCount">Cantidad</label><input id="aCount" class="inp" type="number" min="1" max="60" value="${a.count}"></div>
      <div class="field"><label for="aInt">Intervalo entre lanzamientos (s)</label><input id="aInt" class="inp" type="number" min="0" max="600" value="${a.interval}"></div>
      <label class="check"><input type="checkbox" id="aSync" ${a.sync ? 'checked' : ''}> Sincronizar llegada (en vez de hora de lanzamiento)</label>
      <div class="field"><label for="aTime">${a.sync ? 'Llegada del primero en T+ (s)' : 'Lanzamiento en T+ (s)'}</label><input id="aTime" class="inp" type="number" min="0" max="7200" value="${a.sync ? a.tArrive : a.tStart}"></div>
      ${T.aglRange ? `<div class="field"><label for="aAgl">Altura de vuelo sobre el terreno</label><span class="val" id="aAglV">${a.agl} m</span><input id="aAgl" type="range" min="${T.aglRange[0]}" max="${T.aglRange[1]}" step="5" value="${a.agl}"></div>` : ''}
      ${off ? `<div class="field"><label for="aDist">Distancia real de lanzamiento (km)</label><input id="aDist" class="inp" type="number" min="60" max="1500" value="${a.launchDist}"></div>` : ''}
      ${T.maneuver || T.prof === 'ballistic' || T.cls === 'crucero' ? `<label class="check"><input type="checkbox" id="aMan" ${a.maneuver ? 'checked' : ''}> Maniobra evasiva terminal</label>` : ''}
      ${T.decoys ? `<label class="check"><input type="checkbox" id="aDec" ${a.decoys ? 'checked' : ''}> Liberar ${T.decoys} señuelos en fase terminal</label>` : ''}
      <button class="btn pri" id="aRoute">${S.mode === 'route' ? 'Trazando…' : 'Trazar ruta en el mapa'}</button>
      <p class="hint">${off ? 'Tocá un punto en la dirección desde donde viene y después el blanco. Se lanza a la distancia indicada, fuera del mapa.' : 'Tocá el punto de entrada, los waypoints (usá valles para esconderte del radar) y el blanco. Si el último punto cae sobre una unidad de defensa, la apunta.'}</p>
    </div>
    <div class="grp"><h3>Salvas programadas (${S.setup.salvos.length})</h3><div class="list" id="svList">${S.setup.salvos.map(sv => { const t = THREATS[sv.type]; const tgt = sv.targetUnit ? S.setup.defs.find(u => u.id === sv.targetUnit) : null; return `<div class="item red"><span class="t">${sv.count}× ${esc(t.short)}${tgt ? ' → ' + esc(tgt.name) : ''}</span><span class="s">${sv.sync ? 'llega T+' + sv.tArrive + 's' : 'sale T+' + sv.tStart + 's'} · c/${sv.interval}s</span><span class="a"><button class="btn sm" data-sel="${sv.id}">Ver</button><button class="btn sm danger" data-del="${sv.id}" aria-label="Borrar">✕</button></span></div>`; }).join('') || '<p class="hint">Todavía no hay ataques.</p>'}</div></div>`;
  $('#aType').onchange = e => { S.atk = defaultAtk(e.target.value, S.atk); renderAtk(); };
  $('#aInfo').onclick = () => openFicha('thr', a.type);
  const num = (id, k) => { const i = $(id); if (i) i.onchange = e => { a[k] = +e.target.value; }; };
  num('#aCount', 'count'); num('#aInt', 'interval'); num('#aDist', 'launchDist');
  $('#aTime').onchange = e => { if (a.sync) a.tArrive = +e.target.value; else a.tStart = +e.target.value; };
  $('#aSync').onchange = e => { a.sync = e.target.checked; renderAtk(); };
  if ($('#aAgl')) $('#aAgl').oninput = e => { a.agl = +e.target.value; $('#aAglV').textContent = a.agl + ' m'; };
  if ($('#aMan')) $('#aMan').onchange = e => { a.maneuver = e.target.checked; };
  if ($('#aDec')) $('#aDec').onchange = e => { a.decoys = e.target.checked; };
  $('#aRoute').onclick = () => { if (S.started) { toast('Reiniciá para editar el escenario.'); return; } S.route = { pts: [], targetUnit: null }; S.mode = 'route'; updateModebar(); renderAtk(); };
  $('#svList').onclick = e => {
    const d = e.target.closest('[data-del]'), s = e.target.closest('[data-sel]');
    if (d) { if (S.started) { toast('Reiniciá para editar.'); return; } S.setup.salvos = S.setup.salvos.filter(v => v.id != d.dataset.del); if (S.sel && S.sel.id == d.dataset.del) S.sel = null; renderAtk(); renderSel(); }
    if (s) { S.sel = { kind: 'salvo', id: +s.dataset.sel }; renderSel(); }
  };
}
/** Valores iniciales del formulario al elegir un arma (conserva cantidad y sincronización previas). */
export function defaultAtk(type, prev) { const T = THREATS[type]; return { type, count: prev ? prev.count : (T.cls === 'dron' ? 8 : 2), interval: T.cls === 'dron' ? 20 : 10, tStart: 0, sync: prev ? prev.sync : false, tArrive: prev ? prev.tArrive : 900, agl: T.agl ?? 0, launchDist: T.launchDist, maneuver: !!T.maneuver, decoys: !!T.decoys }; }
