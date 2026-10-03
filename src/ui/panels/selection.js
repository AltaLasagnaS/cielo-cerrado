// Tarjeta "Selección": detalle y parámetros editables de lo que esté seleccionado en el mapa
// (defensa, jammer, salva o amenaza en vuelo).
import { THREATS, JAMMERS, TARGET_TYPES, TARGET_STATUS, D } from '../../data/index.js';
import { esc, fmtT, kmh, money } from '../../util/format.js';
import { releaseId } from '../../util/ids.js';
import { surf, latlon } from '../../physics/terrain.js';
import { antZ, horizon } from '../../physics/radar.js';
import { buildThreat, speedAt } from '../../physics/kinematics.js';
import { S } from '../../sim/state.js';
import { label } from '../../sim/log.js';
import { targetName } from '../../sim/setup.js';
import { warheadKg, directDamage } from '../../physics/damage.js';
import { $ } from '../dom.js';
import { schedCov } from '../coverage.js';
import { openFicha } from '../fichas.js';
import { renderAtk, removeObj } from './attack.js';
import { renderEW } from './ew.js';

/** live = refresco periódico durante la corrida (no pisa un campo que el jugador está editando). */
export function renderSel(live) {
  const el = $('#selCard'); const sel = S.sel;
  if (!sel) { el.innerHTML = '<h3>Selección</h3><p class="hint">Tocá una unidad, jammer o ruta en el mapa para ver y ajustar sus parámetros. Arrastrá unidades para moverlas (antes de iniciar).</p>'; return; }
  if (live && document.activeElement && el.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
  if (sel.kind === 'def') {
    const u = (S.started ? S.units : S.setup.defs).find(v => v.id === sel.id); if (!u) { S.sel = null; return renderSel(); }
    const d = D(u), r = d.radar; const ll = latlon(u.x, u.y); const ed = !S.started;
    const ground = Math.round(surf(u.x, u.y));
    let html = `<h3>Selección</h3><div class="row" style="justify-content:space-between"><b style="font-size:15px">${esc(u.name)}</b><span class="chip ${d.side === 'RU' ? 'ru' : 'ua'}">${esc(d.short)}</span></div>
      <dl class="kv"><dt>Posición</dt><dd>${u.x.toFixed(1)}, ${u.y.toFixed(1)} km</dd><dt>Lat/Lon</dt><dd>${ll[0].toFixed(3)}°, ${ll[1].toFixed(3)}°</dd><dt>Terreno</dt><dd>${ground} m</dd>`;
    if (r && r.band !== 'ACU') { const hor = horizon(antZ(u) - (d.kind === 'aew' ? 0 : ground), 50); html += `<dt>Radar</dt><dd>${esc(r.name)} · ${r.band}</dd><dt>Horizonte vs blanco a 50 m</dt><dd>${hor.toFixed(0)} km</dd>`; }
    if (d.sam) html += `<dt>Alcance</dt><dd>${d.sam.maxR} km${d.sam.maxRtbm ? ' (TBM ' + d.sam.maxRtbm + ')' : ''}</dd><dt>Guiado</dt><dd>${d.sam.guid}</dd>`;
    if (S.started && d.sam) html += `<dt>Munición</dt><dd>${u.magLeft}/${u.mag}</dd><dt>En vuelo</dt><dd>${u.active}/${d.sam.ch}</dd>`;
    if (S.started) html += `<dt>Estado</dt><dd style="color:${u.alive ? 'var(--ok)' : 'var(--red)'}">${u.alive ? 'Operativa' : 'Destruida'}</dd>`;
    html += '</dl>';
    if (ed) {
      if (r && d.kind !== 'aew' && r.band !== 'ACU' && r.band !== 'OPT') {
        const [lo, hi] = r.mastRange || [r.mast, r.mast];
        html += lo === hi ? `<div class="field"><label>Altura de antena</label><span class="val">${u.mast} m · fija</span></div>` : `<div class="field"><label for="sMast">Altura de antena / mástil</label><span class="val">${u.mast} m</span><input id="sMast" type="range" min="${lo}" max="${hi}" value="${u.mast}"></div>`;
        if (r.mastNote) html += `<p class="hint">${esc(r.mastNote)}</p>`;
      }
      if (d.kind === 'aew') html += `<div class="field"><label for="sAlt">Altitud de vuelo</label><span class="val">${u.alt} m</span><input id="sAlt" type="range" min="2000" max="11000" step="250" value="${u.alt}"></div>`;
      if (r && (r.sector < 360)) html += `<div class="field"><label for="sAz">${r.side ? 'Rumbo de vuelo' : 'Orientación del sector'}</label><span class="val">${u.az}°</span><input id="sAz" type="range" min="0" max="359" value="${u.az}"></div>`;
      if (d.sam) html += `<label class="check"><input type="checkbox" id="sNoD" ${u.noDrones ? 'checked' : ''}> No gastar en drones (reservar para misiles)</label><div class="field"><label for="sMag">Munición disponible</label><input id="sMag" class="inp" type="number" min="1" max="200" value="${u.mag}"></div><div class="field"><label for="sSal">Interceptores por blanco</label><input id="sSal" class="inp" type="number" min="1" max="4" value="${u.salvo}"></div>`;
    }
    html += `<div class="row"><button class="btn sm" id="sInfo">Ficha</button>${ed ? '<button class="btn sm danger" id="sDel">Eliminar</button>' : ''}</div>`;
    el.innerHTML = html;
    $('#sInfo').onclick = () => openFicha('def', u.type);
    if (ed) {
      const bind = (id, k, cov) => { const i = $(id); if (!i) return; i.oninput = e => { u[k] = +e.target.value; const v = i.parentElement.querySelector('.val'); if (v) v.textContent = u[k] + (k === 'az' ? '°' : ' m'); if (cov) schedCov(); }; };
      bind('#sMast', 'mast', 1); bind('#sAlt', 'alt', 1); bind('#sAz', 'az', 1); bind('#sMag', 'mag'); bind('#sSal', 'salvo');
      if ($('#sNoD')) $('#sNoD').onchange = e => { u.noDrones = e.target.checked; };
      $('#sDel').onclick = () => { S.setup.defs = S.setup.defs.filter(v => v.id !== u.id); S.sel = null; renderSel(); schedCov(); };
    }
  } else if (sel.kind === 'jam') {
    const j = (S.started ? S.jamsLive : S.setup.jams).find(v => v.id === sel.id); if (!j) { S.sel = null; return renderSel(); }
    const J = JAMMERS[j.type];
    el.innerHTML = `<h3>Selección</h3><b style="font-size:15px">${esc(J.name)}</b><dl class="kv"><dt>Posición</dt><dd>${j.x.toFixed(1)}, ${j.y.toFixed(1)} km</dd>${J.bands ? '<dt>Bandas</dt><dd>' + J.bands.join(', ') + '</dd>' : '<dt>Radio</dt><dd>' + J.radius + ' km</dd>'}</dl>
      ${J.air && !S.started ? `<div class="field"><label for="jAlt">Altitud</label><span class="val">${j.alt} m</span><input id="jAlt" type="range" min="1000" max="12000" step="250" value="${j.alt}"></div>` : ''}
      <div class="row"><button class="btn sm" id="jInfo">Ficha</button>${!S.started ? '<button class="btn sm danger" id="jDel">Eliminar</button>' : ''}</div>`;
    $('#jInfo').onclick = () => openFicha('jam', j.type);
    if ($('#jAlt')) $('#jAlt').oninput = e => { j.alt = +e.target.value; j._losMap = {}; e.target.parentElement.querySelector('.val').textContent = j.alt + ' m'; schedCov(); };
    if ($('#jDel')) $('#jDel').onclick = () => { S.setup.jams = S.setup.jams.filter(v => v.id !== j.id); S.sel = null; renderSel(); renderEW(); schedCov(); };
  } else if (sel.kind === 'salvo') {
    const sv = S.setup.salvos.find(v => v.id === sel.id); if (!sv) { S.sel = null; return renderSel(); }
    const T = THREATS[sv.type]; const probe = buildThreat(sv, 0, 0); releaseId();
    el.innerHTML = `<h3>Selección</h3><b style="font-size:15px">${sv.count}× ${esc(T.name)}</b><dl class="kv"><dt>Blanco</dt><dd>${esc(targetName(sv) || 'punto del mapa')}</dd><dt>Ojiva</dt><dd>${warheadKg(T) ? warheadKg(T) + ' kg · ' + Math.round(directDamage(T)) + ' HP por impacto directo' : 'sin ojiva'}</dd><dt>Recorrido</dt><dd>${probe.L.toFixed(0)} km</dd><dt>Tiempo de vuelo</dt><dd>${fmtT(probe.ft).slice(2)}</dd><dt>${sv.sync ? 'Llegada' : 'Lanzamiento'}</dt><dd>T+${sv.sync ? sv.tArrive : sv.tStart} s</dd>${T.aglRange ? '<dt>Altura</dt><dd>' + sv.agl + ' m AGL</dd>' : ''}<dt>Maniobra</dt><dd>${sv.maneuver ? 'sí' : 'no'}</dd><dt>Costo salva</dt><dd>${money(T.cost * sv.count)}</dd></dl>
      <div class="row"><button class="btn sm" id="vInfo">Ficha</button>${!S.started ? '<button class="btn sm danger" id="vDel">Eliminar</button>' : ''}</div>`;
    $('#vInfo').onclick = () => openFicha('thr', sv.type);
    if ($('#vDel')) $('#vDel').onclick = () => { S.setup.salvos = S.setup.salvos.filter(v => v.id !== sv.id); S.sel = null; renderSel(); renderAtk(); };
  } else if (sel.kind === 'obj') {
    const g = (S.started ? S.objs : S.setup.objs).find(v => v.id === sel.id); if (!g) { S.sel = null; return renderSel(); }
    const tt = TARGET_TYPES[g.type], hp = g.hp ?? g.maxHp, st = g.status || 'operational', ll = latlon(g.x, g.y);
    const dmgBy = Object.entries(g.dmgBy || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => esc(k) + ' ' + v).join(', ');
    el.innerHTML = `<h3>Selección</h3><div class="row" style="justify-content:space-between"><b style="font-size:15px">OBJETIVO: ${esc(g.name)}</b><span class="chip st-${st}">${TARGET_STATUS[st]}</span></div>
      <div class="hpbar"><i class="st-${st}" style="width:${Math.max(0, 100 * hp / g.maxHp).toFixed(1)}%"></i></div>
      <dl class="kv"><dt>HP</dt><dd>${hp} / ${g.maxHp}</dd><dt>Tipo</dt><dd>${esc(tt.name)}</dd><dt>Posición</dt><dd>${g.x.toFixed(1)}, ${g.y.toFixed(1)} km</dd><dt>Lat/Lon</dt><dd>${ll[0].toFixed(3)}°, ${ll[1].toFixed(3)}°</dd><dt>Huella</dt><dd>${tt.radius} m de radio</dd><dt>Vulnerabilidad</dt><dd>×${tt.vuln}</dd>${S.started ? `<dt>Impactos con daño</dt><dd>${g.hits}</dd>${dmgBy ? `<dt>Daño por arma</dt><dd>${dmgBy}</dd>` : ''}` : ''}</dl>
      <p class="hint">${esc(g.desc || tt.desc)}</p>
      ${!S.started ? `<div class="field"><label for="oHp">Vida máxima</label><input id="oHp" class="inp" type="number" min="50" max="20000" step="50" value="${g.maxHp}"></div><div class="row"><button class="btn sm danger" id="oDel">Eliminar</button></div>` : ''}`;
    if ($('#oHp')) $('#oHp').onchange = e => { g.maxHp = Math.max(1, +e.target.value || tt.hp); };
    if ($('#oDel')) $('#oDel').onclick = () => removeObj(g.id);
  } else if (sel.kind === 'thr') {
    const th = S.threats.find(t => t.id === sel.id); if (!th || !th.p) { el.innerHTML = '<h3>Selección</h3><p class="hint">La amenaza ya no está en vuelo.</p>'; return; }
    const p = th.p, v = speedAt(th, S.t);
    el.innerHTML = `<h3>Selección</h3><b style="font-size:15px">${esc(label(th))}</b><dl class="kv"><dt>Altitud</dt><dd>${Math.round(p.z)} m (${Math.round(p.z - surf(p.x, p.y))} AGL)</dd><dt>Velocidad</dt><dd>${kmh(v)}</dd><dt>Al blanco</dt><dd>${p.rem.toFixed(1)} km</dd><dt>Primera detección</dt><dd>${th.firstDet === null ? '—' : fmtT(th.firstDet)}</dd></dl><div class="row"><button class="btn sm" id="tInfo">Ficha</button></div>`;
    $('#tInfo').onclick = () => openFicha('thr', th.type);
  }
}
