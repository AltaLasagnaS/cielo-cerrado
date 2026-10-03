// Pestaña "Ataque": configurar una salva nueva, trazar su ruta y listar las programadas.
import { CLS_NAME, THREATS, TARGET_TYPES } from '../../data/index.js';
import { targetName } from '../../sim/setup.js';
import { esc, kmh, mach, money } from '../../util/format.js';
import { isOffmap } from '../../physics/kinematics.js';
import { S } from '../../sim/state.js';
import { $ } from '../dom.js';
import { updateModebar, toast, setMode } from '../modes.js';
import { schedCov } from '../coverage.js';
import { openFicha } from '../fichas.js';
import { renderSel } from './selection.js';

export function renderAtk() {
  const el = $('#tab-atk');
  if (!S.atk) S.atk = defaultAtk('shahed');
  const a = S.atk, T = THREATS[a.type];
  const off = isOffmap(T);
  const opts = side => Object.entries(THREATS).filter(([, t]) => t.side === side).map(([k, t]) => `<option value="${k}" ${k === a.type ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
  const objs = S.setup.objs;
  el.innerHTML = `
    <div class="grp"><h3>Objetivos (${objs.length})</h3>
      <div class="list" id="objList">${objs.map(g => `<div class="item obj"><span class="t">${esc(TARGET_TYPES[g.type].icon)} · ${esc(g.name)}</span><span class="s">${esc(TARGET_TYPES[g.type].name)} · HP ${g.maxHp}</span><span class="a"><button class="btn sm" data-osel="${g.id}">Ver</button><button class="btn sm danger" data-odel="${g.id}" aria-label="Borrar">✕</button></span></div>`).join('') || '<p class="hint">Sin objetivos: las armas caen sobre un punto, sin daño. Agregá uno.</p>'}</div>
      <div class="unitgrid" id="objTypes">${Object.entries(TARGET_TYPES).map(([k, t]) => `<button class="ub obj ${S.mode === 'placeObj' && S.placeType === k ? 'act' : ''}" data-ot="${k}" title="${esc(t.desc)}"><span>${esc(t.icon)} · ${esc(t.name)}</span></button>`).join('')}</div>
      <p class="hint">Elegí un tipo y tocá el mapa para ubicarlo. Al trazar una ruta, terminala sobre un objetivo para apuntarle.</p>
    </div>
    <div class="grp"><h3>Nueva salva</h3>
      <div class="row"><select id="aType" class="sel" style="flex:1;min-width:0"><optgroup label="Rusia">${opts('RU')}</optgroup><optgroup label="Ucrania / OTAN">${opts('UA')}</optgroup></select><button class="btn sm" id="aInfo">Ficha</button></div>
      <p class="hint">${esc(CLS_NAME[T.cls])} · ${kmh(T.v)} (${mach(T.v)}) · RCS ≈${T.rcs} m² · ${money(T.cost)} c/u</p>
      <div class="field"><label for="aCount">Cantidad</label><input id="aCount" class="inp" type="number" min="1" max="60" value="${a.count}"></div>
      <div class="field"><label for="aInt">Intervalo entre lanzamientos (s)</label><input id="aInt" class="inp" type="number" min="0" max="600" value="${a.interval}"></div>
      <label class="check"><input type="checkbox" id="aSync" ${a.sync ? 'checked' : ''}> Sincronizar llegada (en vez de hora de lanzamiento)</label>
      <div class="field"><label for="aTime">${a.sync ? 'Llegada del primero en T+ (s)' : 'Lanzamiento en T+ (s)'}</label><input id="aTime" class="inp" type="number" min="0" max="7200" value="${a.sync ? a.tArrive : a.tStart}"></div>
      ${T.aglRange ? `<div class="field"><label for="aAgl">Altura de vuelo sobre el terreno</label><span class="val" id="aAglV">${a.agl} m</span><input id="aAgl" type="range" min="${T.aglRange[0]}" max="${T.aglRange[1]}" step="1" value="${a.agl}"></div>
      <div class="row" id="aAglModes"><button class="btn sm" data-agl="${T.agl}">Típica${(T.aglModes || []).filter(([, h]) => h === T.agl).map(([n]) => ' · ' + esc(n)).join('')} (${T.agl} m)</button>${(T.aglModes || []).filter(([, h]) => h !== T.agl).map(([n, h]) => `<button class="btn sm" data-agl="${h}">${esc(n)} (${h} m)</button>`).join('')}</div>
      <p class="hint">Límite real: ${T.aglRange[0]}–${T.aglRange[1]} m. ${esc(T.aglNote || '')}</p>` : ''}
      ${off ? `<div class="field"><label for="aDist">Distancia real de lanzamiento (km)</label><input id="aDist" class="inp" type="number" min="20" max="1500" value="${a.launchDist}"></div>` : ''}
      ${(T.maneuver || T.prof === 'ballistic' || T.cls === 'crucero') && T.prof !== 'glide' ? `<label class="check"><input type="checkbox" id="aMan" ${a.maneuver ? 'checked' : ''}> Maniobra evasiva terminal</label>` : ''}
      ${T.decoys ? `<label class="check"><input type="checkbox" id="aDec" ${a.decoys ? 'checked' : ''}> Liberar ${T.decoys} señuelos en fase terminal</label>` : ''}
      ${T.datalink ? `<label class="check" title="${esc(T.datalink)}: el operador ve la posición real y descarta el engaño GNSS, salvo dentro del radio de un antidrón que corta enlaces (Bukovel-AD)"><input type="checkbox" id="aLink" ${a.link ? 'checked' : ''}> Enlace de datos (${esc(T.datalink)})</label>` : ''}
      <button class="btn pri" id="aRoute">${S.mode === 'route' ? 'Trazando…' : 'Trazar ruta en el mapa'}</button>
      <p class="hint">${off ? 'Tocá un punto en la dirección desde donde viene y después el blanco. Se lanza a la distancia indicada, fuera del mapa.' : 'Tocá el punto de entrada, los waypoints (usá valles para esconderte del radar) y el blanco. Si el último punto cae sobre una unidad de defensa, la apunta.'}</p>
    </div>
    <div class="grp"><h3>Salvas programadas (${S.setup.salvos.length})</h3><div class="list" id="svList">${S.setup.salvos.map(sv => { const t = THREATS[sv.type]; const tgt = targetName(sv); return `<div class="item red"><span class="t">${sv.count}× ${esc(t.short)}${tgt ? ' → ' + esc(tgt) : ''}</span><span class="s">${sv.sync ? 'llega T+' + sv.tArrive + 's' : 'sale T+' + sv.tStart + 's'} · c/${sv.interval}s</span><span class="a"><button class="btn sm" data-sel="${sv.id}">Ver</button><button class="btn sm danger" data-del="${sv.id}" aria-label="Borrar">✕</button></span></div>`; }).join('') || '<p class="hint">Todavía no hay ataques.</p>'}</div></div>`;
  $('#aType').onchange = e => { S.atk = defaultAtk(e.target.value, S.atk); renderAtk(); };
  $('#aInfo').onclick = () => openFicha('thr', a.type);
  const num = (id, k) => { const i = $(id); if (i) i.onchange = e => { a[k] = +e.target.value; }; };
  num('#aCount', 'count'); num('#aInt', 'interval'); num('#aDist', 'launchDist');
  $('#aTime').onchange = e => { if (a.sync) a.tArrive = +e.target.value; else a.tStart = +e.target.value; };
  $('#aSync').onchange = e => { a.sync = e.target.checked; renderAtk(); };
  if ($('#aAgl')) $('#aAgl').oninput = e => { a.agl = +e.target.value; $('#aAglV').textContent = a.agl + ' m'; };
  if ($('#aAglModes')) $('#aAglModes').onclick = e => { const b = e.target.closest('[data-agl]'); if (!b) return; a.agl = +b.dataset.agl; $('#aAgl').value = a.agl; $('#aAglV').textContent = a.agl + ' m'; };
  if ($('#aMan')) $('#aMan').onchange = e => { a.maneuver = e.target.checked; };
  if ($('#aDec')) $('#aDec').onchange = e => { a.decoys = e.target.checked; };
  if ($('#aLink')) $('#aLink').onchange = e => { a.link = e.target.checked; };
  $('#aRoute').onclick = () => { if (S.started) { toast('Reiniciá para editar el escenario.'); return; } S.route = { pts: [], targetUnit: null }; S.mode = 'route'; updateModebar(); renderAtk(); };
  $('#objTypes').onclick = e => { const b = e.target.closest('[data-ot]'); if (!b) return; if (S.started) { toast('Reiniciá para editar el escenario.'); return; } if (S.mode === 'placeObj' && S.placeType === b.dataset.ot) setMode('select'); else setMode('placeObj', b.dataset.ot); renderAtk(); };
  $('#objList').onclick = e => {
    const d = e.target.closest('[data-odel]'), s = e.target.closest('[data-osel]');
    if (d) { if (S.started) { toast('Reiniciá para editar.'); return; } removeObj(+d.dataset.odel); }
    if (s) { S.sel = { kind: 'obj', id: +s.dataset.osel }; renderSel(); }
  };
  $('#svList').onclick = e => {
    const d = e.target.closest('[data-del]'), s = e.target.closest('[data-sel]');
    if (d) { if (S.started) { toast('Reiniciá para editar.'); return; } S.setup.salvos = S.setup.salvos.filter(v => v.id != d.dataset.del); if (S.sel && S.sel.id == d.dataset.del) S.sel = null; renderAtk(); renderSel(); }
    if (s) { S.sel = { kind: 'salvo', id: +s.dataset.sel }; renderSel(); }
  };
}
/** Valores iniciales del formulario al elegir un arma (conserva cantidad y sincronización previas). */
export function defaultAtk(type, prev) { const T = THREATS[type]; return { type, count: prev ? prev.count : (T.cls === 'dron' ? 8 : 2), interval: T.cls === 'dron' ? 20 : 10, tStart: 0, sync: prev ? prev.sync : false, tArrive: prev ? prev.tArrive : 900, agl: T.agl ?? 0, launchDist: T.launchDist, maneuver: !!T.maneuver, decoys: !!T.decoys, link: false }; }

/** Borra un objetivo; las salvas que le apuntaban quedan apuntando al mismo punto, sin objetivo. */
export function removeObj(id) {
  S.setup.objs = S.setup.objs.filter(g => g.id !== id);
  for (const sv of S.setup.salvos) if (sv.targetObj === id) sv.targetObj = null;
  if (S.sel && S.sel.kind === 'obj' && S.sel.id === id) S.sel = null;
  renderAtk(); renderSel(); schedCov();
}
