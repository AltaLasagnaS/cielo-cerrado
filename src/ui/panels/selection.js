// @ts-check
// Tarjeta "Selección": detalle y parámetros editables de lo que esté seleccionado en el mapa
// (defensa, jammer, salva o amenaza en vuelo).
import { THREATS, JAMMERS, JAM_MODES, TARGET_TYPES, TARGET_STATUS, D, DATALINKS, datalinksOf, UNIT_TARGET, C2_LEVELS, C2_ORDER, C2_NODES } from '../../data/index.js';
import { esc, fmtT, kmh, money } from '../../util/format.js';
import { releaseId } from '../../util/ids.js';
import { surf, latlon } from '../../physics/terrain.js';
import { antZ, horizon } from '../../physics/radar.js';
import { buildThreat, speedAt } from '../../physics/kinematics.js';
import { S } from '../../sim/state.js';
import { label, uLabel } from '../../sim/log.js';
import { targetName } from '../../sim/setup.js';
import { warheadKg, directDamage } from '../../physics/damage.js';
import { $, isDefenderView, isAttackerView } from '../dom.js';
import { draw } from '../../render/draw.js';
import { contactOf } from '../../sim/contacts.js';
import { schedCov } from '../coverage.js';
import { openFicha } from '../fichas.js';
import { renderAtk, removeObj } from './attack.js';
import { renderEW } from './ew.js';
import { bindNumber } from '../number-input.js';
import { isMonteCarloRunning } from '../../sim/montecarlo.js';

/** Puestos de mando que se pueden asignar ('' = el principal). */
const CPS = [['', 'Principal'], ['A', 'Puesto A'], ['B', 'Puesto B'], ['C', 'Puesto C']];

/** Reutiliza los botones de borrado de la selección; nunca edita una corrida ni una serie. */
export function deleteSelected() {
  if (S.started || isMonteCarloRunning()) return false;
  if (S.multi.length > 1) { renderSel(); const b = $('#mDel'); if (b) { b.click(); return true; } }
  if (!S.sel) return false;
  renderSel();
  const id = { def: '#sDel', jam: '#jDel', salvo: '#vDel', obj: '#oDel' }[S.sel?.kind];
  const button = id && $(id);
  if (!button || button.disabled) return false;
  button.click(); return true;
}

/** live = refresco periódico durante la corrida (no pisa un campo que el jugador está editando). */
/**
 * Panel de un grupo de defensas (Shift + click, pedido F03): muestra cuántas y cuáles, y deja cambiar a la
 * vez las propiedades que tienen todas. Si los valores difieren, el control lo dice ("mezcla") y no toca
 * nada hasta que se elige uno. Borrar el grupo pide confirmación.
 */
function renderMulti(el) {
  const us = S.multi.map(id => S.setup.defs.find(v => v.id === id)).filter(Boolean);
  if (us.length < 2) { S.multi = []; return false; }
  const same = f => { const v = us.map(f); return v.every(x => x === v[0]) ? v[0] : undefined; };
  const sams = us.filter(u => D(u).sam);
  const opt = (id, label, cur, opts) => `<div class="field"><label for="${id}">${label}</label><select id="${id}" class="sel">${cur === undefined ? '<option value="__mix" selected>(mezcla)</option>' : ''}${opts.map(([k, n]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`;
  let h = `<h3>Selección</h3><b style="font-size:15px">${us.length} defensas</b><p class="hint">${us.map(u => esc(u.name)).join(', ')}</p><p class="hint">Shift + click suma o saca una unidad; Esc limpia el grupo. Solo se cambian los valores que elijas.</p>`;
  h += opt('mOwn', 'Operada por', same(u => u.owner || ''), [['', 'Según el equipo'], ['UA', 'Ucrania / OTAN'], ['RU', 'Rusia']]);
  h += opt('mC2', 'Coordinación C2', same(u => u.c2 || ''), [['', 'Igual que la red'], ...C2_ORDER.slice(0, C2_ORDER.indexOf(S.c2)).map(k => [k, C2_LEVELS[k].name])]);
  h += opt('mCp', 'Puesto de mando', same(u => u.cp || ''), CPS);
  h += opt('mLink', 'Datalink', same(u => u.link !== false ? 'on' : 'off'), [['on', 'Activo'], ['off', 'Apagado']]);
  if (sams.length === us.length) {
    h += opt('mDec', 'Pistas clasificadas como señuelo', same(u => u.decoyDoc || ''), [['', 'Como la regla general'], ['ignorar', 'No tirarles'], ['tirar', 'Tirarles igual']]);
    h += opt('mNoD', 'Drones', same(u => u.noDrones ? 'no' : 'si'), [['si', 'Les tira'], ['no', 'No gastar en drones']]);
  }
  h += `<div class="row"><button class="btn sm danger" id="mDel">Eliminar las ${us.length} unidades</button></div>`;
  el.innerHTML = h;
  const bind = (id, apply) => { const s = $(id); if (s) s.onchange = e => { const v = e.target.value; if (v === '__mix') return; for (const u of us) apply(u, v); draw(); renderMulti(el); }; };
  bind('#mOwn', (u, v) => { if (v) u.owner = v; else delete u.owner; });
  bind('#mC2', (u, v) => { if (v) u.c2 = v; else delete u.c2; });
  bind('#mCp', (u, v) => { if (v) u.cp = v; else delete u.cp; });
  bind('#mLink', (u, v) => { u.link = v === 'on'; });
  bind('#mDec', (u, v) => { if (v) u.decoyDoc = v; else delete u.decoyDoc; });
  bind('#mNoD', (u, v) => { u.noDrones = v === 'no'; });
  $('#mDel').onclick = () => {
    if (!window.confirm(`¿Eliminar las ${us.length} unidades seleccionadas?`)) return;
    const ids = new Set(us.map(u => u.id));
    S.setup.defs = S.setup.defs.filter(v => !ids.has(v.id));
    for (const sv of S.setup.salvos) if (ids.has(sv.targetUnit)) sv.targetUnit = null;
    S.multi = []; S.sel = null; renderSel(); schedCov(); draw();
  };
  return true;
}

export function renderSel(live) {
  const el = $('#selCard'); const sel = S.sel;
  if (S.multi.length && !S.started && renderMulti(el)) return;
  if (!sel) { el.innerHTML = '<h3>Selección</h3><p class="hint">Tocá una unidad, jammer o ruta en el mapa para ver y ajustar sus parámetros. Arrastrá unidades para moverlas (antes de iniciar).</p>'; return; }
  if (live && document.activeElement && el.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
  if (sel.kind === 'def') {
    const u = (S.started ? S.units : S.setup.defs).find(v => v.id === sel.id); if (!u) { S.sel = null; return renderSel(); }
    const d = D(u), r = d.radar; const ll = latlon(u.x, u.y); const ed = !S.started;
    const ground = Math.round(surf(u.x, u.y));
    if (S.started && !S.replay && isAttackerView()) {
      // vista del atacante: dónde está y qué es (catálogo), no su estado, munición ni enlaces
      el.innerHTML = `<h3>Selección</h3><b style="font-size:15px">${esc(d.short)}</b><dl class="kv"><dt>Posición</dt><dd>${u.x.toFixed(1)}, ${u.y.toFixed(1)} km</dd>${r && r.band !== 'ACU' && r.band !== 'OPT' ? `<dt>Radar</dt><dd>${esc(r.name)} · ${r.band}</dd>` : ''}${d.sam ? `<dt>Alcance (catálogo)</dt><dd>${d.sam.maxR} km</dd>` : ''}<dt>Estado</dt><dd>desconocido</dd></dl><p class="hint">Vista del atacante: ${r && r.band !== 'ACU' && r.band !== 'OPT' ? 'ubicada por su emisión de radar' : 'ubicada al disparar'}. No se sabe si está dañada ni cuánta munición le queda.</p>`;
      return;
    }
    let html = `<h3>Selección</h3><div class="row" style="justify-content:space-between"><b style="font-size:15px">${esc(u.name)}</b><span class="chip ${d.side === 'RU' ? 'ru' : 'ua'}">${esc(d.short)}</span></div>
      <dl class="kv"><dt>Posición</dt><dd>${u.x.toFixed(1)}, ${u.y.toFixed(1)} km</dd><dt>Lat/Lon</dt><dd>${ll[0].toFixed(3)}°, ${ll[1].toFixed(3)}°</dd><dt>Terreno</dt><dd>${ground} m</dd>`;
    if (r && r.band !== 'ACU') { const hor = horizon(antZ(u) - (d.kind === 'aew' ? 0 : ground), 50); html += `<dt>Radar</dt><dd>${esc(r.name)} · ${r.band}</dd><dt>Horizonte vs blanco a 50 m</dt><dd>${hor.toFixed(0)} km</dd>`; }
    if (d.sam) html += `<dt>Alcance</dt><dd>${d.sam.maxR} km${d.sam.maxRtbm ? ' (TBM ' + d.sam.maxRtbm + ')' : ''}</dd><dt>Guiado</dt><dd>${d.sam.guid}</dd>`;
    const links = datalinksOf(d).map(k => DATALINKS[k].name).join(', ');
    if (d.sam || r) html += `<dt>Enlace técnico de pistas</dt><dd>${esc(links || 'Sin enlace compatible')}</dd><dt>Coordinación C2 (general)</dt><dd>${esc(C2_LEVELS[S.c2].name)}</dd>`;
    if (S.started && d.sam) html += `<dt>Munición</dt><dd>${u.magLeft}/${u.mag} · reserva ${u.reserveLeft}</dd><dt>En vuelo</dt><dd>${u.active}/${d.sam.ch}</dd>${u.reloadUntil !== null ? `<dt>Recargando</dt><dd>faltan ${Math.ceil((u.reloadUntil - S.t) / 60)} min</dd>` : ''}`;
    if (S.started) {
      const hurt = u.alive && (u.dmgRadar || u.dmgLauncher), what = [u.dmgRadar ? 'radar: menos alcance y reacción más lenta' : '', u.dmgLauncher ? 'lanzador fuera de servicio' : ''].filter(Boolean).join('; ');
      html += `<dt>Estado</dt><dd style="color:${!u.alive ? 'var(--red)' : hurt ? 'var(--warn, #e6a53c)' : 'var(--ok)'}">${!u.alive ? 'Destruida' : hurt ? 'Dañada (' + what + ')' : 'Operativa'}${u.alive && u.hp < UNIT_TARGET.hp ? ' · ' + Math.max(0, u.hp) + '/' + UNIT_TARGET.hp + ' HP' : ''}</dd>`;
    }
    html += '</dl>';
    if (ed) {
      if (r && d.kind !== 'aew' && r.band !== 'ACU' && r.band !== 'OPT') {
        const [lo, hi] = r.mastRange || [r.mast, r.mast];
        html += lo === hi ? `<div class="field"><label>Altura de antena</label><span class="val">${u.mast} m · fija</span></div>` : `<div class="field"><label for="sMast">Altura de antena / mástil</label><span class="val">${u.mast} m</span><input id="sMast" type="range" min="${lo}" max="${hi}" value="${u.mast}"></div>`;
        if (r.mastNote) html += `<p class="hint">${esc(r.mastNote)}</p>`;
      }
      if (d.kind === 'aew') html += `<div class="field"><label for="sAlt">Altitud de vuelo</label><span class="val">${u.alt} m</span><input id="sAlt" type="range" min="2000" max="11000" step="250" value="${u.alt}"></div>`;
      if (r && (r.sector < 360)) html += `<div class="field"><label for="sAz">${r.side ? 'Rumbo de vuelo' : 'Orientación del sector'}</label><span class="val">${u.az}°</span><input id="sAz" type="range" min="0" max="359" value="${u.az}"></div>`;
      html += `<div class="field" title="Quién opera la unidad. El país que fabricó el equipo no decide de qué lado pelea: un Buk o un radar 36D6 puede ser ucraniano o ruso. Decide qué interferidores la afectan y su color en el mapa."><label for="sOwn">Operada por</label><select id="sOwn" class="sel"><option value="" ${!u.owner ? 'selected' : ''}>Según el equipo (${d.side === 'both' ? 'ambos bandos' : d.side === 'RU' ? 'Rusia' : 'Ucrania / OTAN'})</option><option value="UA" ${u.owner === 'UA' ? 'selected' : ''}>Ucrania / OTAN</option><option value="RU" ${u.owner === 'RU' ? 'selected' : ''}>Rusia</option></select></div>`;
      if (d.sam || r) html += `<h3>Enlace técnico de pistas</h3>`;
      if (datalinksOf(d).length) html += `<label class="check"><input type="checkbox" id="sLink" ${u.link !== false ? 'checked' : ''}> Datalink activo (${esc(links)})</label><p class="hint">Al apagarlo, esta unidad deja de publicar y recibir pistas de tiro por enlaces compatibles. Conserva su sensor propio y puede recibir alertas C2 si la coordinación general lo permite.</p>`;
      else if (d.sam || r) html += `<p class="hint">Sin enlace técnico compatible: las alertas C2 no son una pista de tiro ni permiten guiar un misil con un sensor ajeno.</p>`;
      if (d.sam || r) html += `<h3>Coordinación C2</h3><p class="hint">Red: ${esc(C2_LEVELS[S.c2].name)} (se cambia en Defensa). En Desconectada no hay alertas compartidas, pistas de red ni reparto de blancos; las unidades conservan sus sensores y disparos propios.</p><div class="field"><label for="sC2">Esta unidad</label><select id="sC2" class="sel">${['', ...C2_ORDER.slice(0, C2_ORDER.indexOf(S.c2))].map(k => `<option value="${k}" ${(u.c2 || '') === k ? 'selected' : ''}>${k ? esc(C2_LEVELS[k].name) : 'Igual que la red'}</option>`).join('')}</select></div><p class="hint">Una unidad puede quedar con menos coordinación que la red (por ejemplo, una batería aislada). Desconectada: ni avisa ni recibe.</p><div class="field"><label for="sCp">Puesto de mando</label><select id="sCp" class="sel">${CPS.map(([k, n]) => `<option value="${k}" ${(u.cp || '') === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div><p class="hint">Las pistas, alertas, el reparto de blancos y la triangulación de jammers solo circulan entre unidades del mismo puesto.</p>`;
      if (d.sam) html += `<div class="field" title="Los radares de tiro aprenden a distinguir señuelos con el tiempo de seguimiento; la decisión usa esa clasificación, que a veces se equivoca."><label for="sDec">Pistas clasificadas como señuelo</label><select id="sDec" class="sel"><option value="" ${!u.decoyDoc ? 'selected' : ''}>Como la regla general (${S.ignoreDecoys ? 'no tirarles' : 'tirarles'})</option><option value="ignorar" ${u.decoyDoc === 'ignorar' ? 'selected' : ''}>No tirarles</option><option value="tirar" ${u.decoyDoc === 'tirar' ? 'selected' : ''}>Tirarles igual</option></select></div>`;
      if (d.sam) html += `<label class="check"><input type="checkbox" id="sNoD" ${u.noDrones ? 'checked' : ''}> No gastar en drones (reservar para misiles)</label><div class="field"><label for="sMag">Munición disponible</label><input id="sMag" class="inp" type="number" min="1" max="200" value="${u.mag}"></div><div class="field"><label for="sRes">Reserva para recargar (${Math.round(d.sam.reloadS / 60)} min por recarga)</label><input id="sRes" class="inp" type="number" min="0" max="500" value="${u.reserve ?? 0}"></div><div class="field"><label for="sSal">Interceptores por blanco</label><input id="sSal" class="inp" type="number" min="1" max="4" value="${u.salvo}"></div>`;
    }
    html += `<div class="row"><button class="btn sm" id="sInfo">Ficha</button>${ed ? '<button class="btn sm danger" id="sDel">Eliminar</button>' : ''}</div>`;
    el.innerHTML = html;
    $('#sInfo').onclick = () => openFicha('def', u.type);
    if (ed) {
      const bind = (id, k, cov) => { const i = $(id); bindNumber(i, () => u[k], value => { u[k] = value; const v = i.parentElement.querySelector('.val'); if (v) v.textContent = u[k] + (k === 'az' ? '°' : ' m'); if (cov) schedCov(); }, { integer: ['mag', 'reserve', 'salvo'].includes(k) }); };
      bind('#sMast', 'mast', 1); bind('#sAlt', 'alt', 1); bind('#sAz', 'az', 1); bind('#sMag', 'mag'); bind('#sRes', 'reserve'); bind('#sSal', 'salvo');
      if ($('#sNoD')) $('#sNoD').onchange = e => { u.noDrones = e.target.checked; };
      if ($('#sLink')) $('#sLink').onchange = e => { u.link = e.target.checked; };
      if ($('#sC2')) $('#sC2').onchange = e => { if (e.target.value) u.c2 = e.target.value; else delete u.c2; };
      if ($('#sOwn')) $('#sOwn').onchange = e => { if (e.target.value) u.owner = e.target.value; else delete u.owner; draw(); };
      if ($('#sDec')) $('#sDec').onchange = e => { if (e.target.value) u.decoyDoc = e.target.value; else delete u.decoyDoc; };
      if ($('#sCp')) $('#sCp').onchange = e => { if (e.target.value) u.cp = e.target.value; else delete u.cp; };
      $('#sDel').onclick = () => { S.setup.defs = S.setup.defs.filter(v => v.id !== u.id); S.sel = null; renderSel(); schedCov(); };
    }
  } else if (sel.kind === 'jam') {
    const j = (S.started ? S.jamsLive : S.setup.jams).find(v => v.id === sel.id); if (!j) { S.sel = null; return renderSel(); }
    const J = JAMMERS[j.type];
    el.innerHTML = `<h3>Selección</h3><b style="font-size:15px">${esc(J.name)}</b><dl class="kv"><dt>Posición</dt><dd>${j.x.toFixed(1)}, ${j.y.toFixed(1)} km</dd>${J.bands ? '<dt>Bandas</dt><dd>' + J.bands.join(', ') + '</dd>' : '<dt>Radio</dt><dd>' + J.radius + ' km</dd>'}</dl>
      ${J.air && !S.started ? `<div class="field"><label for="jAlt">Altitud</label><span class="val">${j.alt} m</span><input id="jAlt" type="range" min="1000" max="12000" step="250" value="${j.alt}"></div>` : ''}
      ${J.bands ? jamModeHtml(j, J) : ''}
      <div class="row"><button class="btn sm" id="jInfo">Ficha</button>${!S.started ? '<button class="btn sm danger" id="jDel">Eliminar</button>' : ''}</div>`;
    $('#jInfo').onclick = () => openFicha('jam', j.type);
    if ($('#jAlt')) $('#jAlt').oninput = e => { j.alt = +e.target.value; j._losMap = {}; e.target.parentElement.querySelector('.val').textContent = j.alt + ' m'; schedCov(); };
    if ($('#jDel')) $('#jDel').onclick = () => { S.setup.jams = S.setup.jams.filter(v => v.id !== j.id); S.sel = null; renderSel(); renderEW(); schedCov(); };
    if ($('#jMode')) $('#jMode').onchange = e => { j.mode = e.target.value; if (j.mode === 'spot' && j.target == null) j.target = jamTargets(J)[0]?.id ?? null; renderSel(); schedCov(); };
    if ($('#jTgt')) $('#jTgt').onchange = e => { j.target = +e.target.value; renderSel(); schedCov(); };
  } else if (sel.kind === 'salvo') {
    const sv = S.setup.salvos.find(v => v.id === sel.id); if (!sv) { S.sel = null; return renderSel(); }
    const T = THREATS[sv.type]; const probe = buildThreat(sv, 0, 0, S.wind); releaseId();
    el.innerHTML = `<h3>Selección</h3><b style="font-size:15px">${sv.count}× ${esc(T.name)}</b><dl class="kv"><dt>Blanco</dt><dd>${esc(targetName(sv) || 'punto del mapa')}</dd><dt>Ojiva</dt><dd>${warheadKg(T) ? warheadKg(T) + ' kg · ' + Math.round(directDamage(T)) + ' HP por impacto directo' : 'sin ojiva'}</dd><dt>Recorrido</dt><dd>${probe.L.toFixed(0)} km</dd><dt>Tiempo de vuelo</dt><dd>${fmtT(probe.ft).slice(2)}</dd><dt>${sv.sync ? 'Llegada' : 'Lanzamiento'}</dt><dd>T+${sv.sync ? sv.tArrive : sv.tStart} s</dd>${T.aglRange ? '<dt>Altura</dt><dd>' + sv.agl + ' m AGL</dd>' : ''}<dt>Maniobra</dt><dd>${sv.maneuver ? 'sí' : 'no'}</dd><dt>Costo salva</dt><dd>${money(T.cost * sv.count)}</dd>${sv.crpa ? `<dt>Antena GNSS</dt><dd>CRPA de ${sv.crpa} elementos: anula hasta ${sv.crpa - 1} interferidores</dd>` : ''}</dl>
      <div class="row"><button class="btn sm" id="vInfo">Ficha</button>${!S.started ? '<button class="btn sm danger" id="vDel">Eliminar</button>' : ''}</div>`;
    $('#vInfo').onclick = () => openFicha('thr', sv.type);
    if ($('#vDel')) $('#vDel').onclick = () => { S.setup.salvos = S.setup.salvos.filter(v => v.id !== sv.id); S.sel = null; renderSel(); renderAtk(); };
  } else if (sel.kind === 'obj') {
    const g = (S.started ? S.objs : S.setup.objs).find(v => v.id === sel.id); if (!g) { S.sel = null; return renderSel(); }
    if (S.started && !S.replay && isAttackerView()) {
      el.innerHTML = `<h3>Selección</h3><b style="font-size:15px">OBJETIVO: ${esc(g.name)}</b><dl class="kv"><dt>Tipo</dt><dd>${esc(TARGET_TYPES[g.type].name)}</dd><dt>Posición</dt><dd>${g.x.toFixed(1)}, ${g.y.toFixed(1)} km</dd><dt>Daño</dt><dd>sin evaluar</dd></dl><p class="hint">Vista del atacante: el daño se conoce en el debrief.</p>`;
      return;
    }
    const tt = TARGET_TYPES[g.type], hp = g.hp ?? g.maxHp, st = g.status || 'operational', ll = latlon(g.x, g.y);
    const dmgBy = Object.entries(g.dmgBy || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => esc(k) + ' ' + v).join(', ');
    el.innerHTML = `<h3>Selección</h3><div class="row" style="justify-content:space-between"><b style="font-size:15px">OBJETIVO: ${esc(g.name)}</b><span class="chip st-${st}">${TARGET_STATUS[st]}</span></div>
      <div class="hpbar"><i class="st-${st}" style="width:${Math.max(0, 100 * hp / g.maxHp).toFixed(1)}%"></i></div>
      <dl class="kv"><dt>HP</dt><dd>${hp} / ${g.maxHp}</dd><dt>Tipo</dt><dd>${esc(tt.name)}</dd><dt>Posición</dt><dd>${g.x.toFixed(1)}, ${g.y.toFixed(1)} km</dd><dt>Lat/Lon</dt><dd>${ll[0].toFixed(3)}°, ${ll[1].toFixed(3)}°</dd><dt>Huella</dt><dd>${tt.radius} m de radio</dd><dt>Vulnerabilidad</dt><dd>×${tt.vuln}</dd>${S.started ? `<dt>Impactos con daño</dt><dd>${g.hits}</dd>${dmgBy ? `<dt>Daño por arma</dt><dd>${dmgBy}</dd>` : ''}` : ''}</dl>
      <p class="hint">${esc(g.desc || tt.desc)}</p>
      ${!S.started ? `<div class="field"><label for="oHp">Vida máxima</label><input id="oHp" class="inp" type="number" min="50" max="20000" step="50" value="${g.maxHp}"></div><div class="row"><button class="btn sm danger" id="oDel">Eliminar</button></div>` : ''}`;
    if (!S.started && C2_NODES[g.type]) { $('#oHp').parentElement.insertAdjacentHTML('afterend', `<div class="field"><label for="oCp">Nodo de mando de</label><select id="oCp" class="sel">${CPS.map(([k, n]) => `<option value="${k}" ${(g.cp || '') === k ? 'selected' : ''}>${k ? n : 'Todos los puestos'}</option>`).join('')}</select></div>`); $('#oCp').onchange = e => { if (e.target.value) g.cp = e.target.value; else delete g.cp; }; }
    bindNumber($('#oHp'), () => g.maxHp, value => { g.maxHp = value; });
    if ($('#oDel')) $('#oDel').onclick = () => removeObj(g.id);
  } else if (sel.kind === 'thr') {
    const th = S.threats.find(t => t.id === sel.id);
    if (th && isDefenderView() && !S.replay) {
      // pista fijada (UX07): solo lo que sabe la defensa; si se pierde, queda el último reporte fechado
      const c = contactOf(th, S.t);
      if (!c) { el.innerHTML = `<h3>Selección</h3><p class="hint">Pista #${th.id}: sin reportes recientes.</p>`; return; }
      const by = c.by != null ? uLabel(S.units.find(u => u.id == c.by)) : '—';
      el.innerHTML = `<h3>Selección</h3><b style="font-size:15px">Pista #${th.id}</b> <span class="chip">${c.lost ? 'perdida' : 'en seguimiento'}</span><dl class="kv"><dt>Último reporte</dt><dd>hace ${Math.round(c.age)} s, de ${esc(by)}</dd><dt>Posición${c.lost ? '' : ' estimada'}</dt><dd>${c.x.toFixed(1)}, ${c.y.toFixed(1)} km</dd><dt>Altitud</dt><dd>${Math.round(c.z)} m (${Math.round(c.z - surf(c.x, c.y))} AGL)</dd><dt>Velocidad estimada</dt><dd>${kmh(c.v)}</dd><dt>Clasificación</dt><dd>${esc(th.clsAs || 'sin clasificar')}</dd><dt>Primera detección</dt><dd>${th.firstDet === null ? '—' : fmtT(th.firstDet)}</dd></dl><p class="hint">Vista del defensor: no se muestra el tipo de arma, su blanco ni su posición real.</p>`;
      return;
    }
    if (!th || !th.p) { el.innerHTML = '<h3>Selección</h3><p class="hint">La amenaza ya no está en vuelo.</p>'; return; }
    const p = th.p, v = speedAt(th, S.t);
    el.innerHTML = `<h3>Selección</h3><b style="font-size:15px">${esc(label(th))}</b><dl class="kv"><dt>Altitud</dt><dd>${Math.round(p.z)} m (${Math.round(p.z - surf(p.x, p.y))} AGL)</dd><dt>Velocidad</dt><dd>${kmh(v)}</dd><dt>Al blanco</dt><dd>${p.rem.toFixed(1)} km</dd><dt>Primera detección</dt><dd>${th.firstDet === null ? '—' : fmtT(th.firstDet)}</dd></dl><div class="row"><button class="btn sm" id="tInfo">Ficha</button></div>`;
    $('#tInfo').onclick = () => openFicha('thr', th.type);
  }
}

/** Defensas cuyo radar trabaja en alguna banda del jammer J (blancos posibles del ruido puntual). */
const jamTargets = J => S.setup.defs.filter(u => D(u).radar && J.bands.includes(D(u).radar.band));

/** Modo del jammer (barrera, puntual o engaño DRFM) y, si es puntual, el radar elegido. */
function jamModeHtml(j, J) {
  const ed = !S.started, tg = S.setup.defs.find(u => u.id === j.target), r = tg && D(tg).radar;
  const opts = Object.entries(JAM_MODES).map(([k, M]) => `<option value="${k}" ${(j.mode || 'barrage') === k ? 'selected' : ''}>${esc(M.name)}</option>`).join('');
  let h = `<div class="field" title="Barrera: reparte la potencia en toda la banda. Puntual: la concentra en la frecuencia de un radar (×${JAM_MODES.spot.gain}), pero un radar con agilidad de frecuencia salta y la deja en ×${JAM_MODES.spot.agileGain}. DRFM: no mete ruido; devuelve copias del pulso que el radar toma por blancos (${JAM_MODES.drfm.falseTargets} falsos blancos)."><label for="jMode">Modo</label><select id="jMode" class="sel" ${ed ? '' : 'disabled'}>${opts}</select></div>`;
  if (j.mode === 'spot') {
    h += `<div class="field"><label for="jTgt">Contra el radar de</label><select id="jTgt" class="sel" ${ed ? '' : 'disabled'}>${jamTargets(J).map(u => `<option value="${u.id}" ${u.id === j.target ? 'selected' : ''}>${esc(u.name)} (${D(u).radar.band})</option>`).join('') || '<option>No hay radares en sus bandas</option>'}</select></div>`;
    if (r) h += `<p class="hint">${r.agile ? `${esc(tg.name)} tiene agilidad de frecuencia: salta de frecuencia y el ruido puntual casi no le hace nada (×${JAM_MODES.spot.agileGain}). Contra él conviene la barrera.` : `${esc(tg.name)} no tiene agilidad de frecuencia: el ruido puntual le pega ×${JAM_MODES.spot.gain} más que la barrera. A los demás radares no los toca.`}</p>`;
  }
  if (j.mode === 'drfm') h += `<p class="hint">Engaño DRFM: no tapa con ruido. Crea ${JAM_MODES.drfm.falseTargets} falsos blancos en cada radar que lo recibe fuerte; ocupan su capacidad de seguimiento y, si está llena, el radar no abre pistas nuevas. Entran por el haz principal y, si el jammer está cerca, por los costados, salvo en radares con blanqueo de lóbulos laterales.</p>`;
  return h;
}
