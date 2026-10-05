// @ts-check
// Pestaña "Catálogo": listado de todo lo modelado con acceso a fichas, comparativas y calibración.
import { THREATS, DEFENSES, JAMMERS } from '../../data/index.js';
import { esc, kmh } from '../../util/format.js';
import { $ } from '../dom.js';
import { openFicha, cmpThreats, cmpDefs, openCal } from '../fichas.js';

export function renderCat() {
  const el = $('#tab-cat');
  const row = (kind, k, o, extra) => `<div class="item ${kind === 'thr' ? 'red' : kind === 'jam' ? 'vio' : ''}" style="cursor:pointer" data-f="${kind}:${k}"><span class="t">${esc(o.name)}</span><span class="s">${extra}</span><span class="a"><span class="chip ${o.side === 'RU' ? 'ru' : o.side === 'UA' ? 'ua' : ''}">${o.side === 'RU' ? 'RU' : o.side === 'UA' ? 'UA' : 'ambos'}</span></span></div>`;
  el.innerHTML = `
    <div class="row"><button class="btn" id="cmpT">Comparar amenazas</button><button class="btn" id="cmpD">Comparar defensas</button><button class="btn" id="calB">Calibración de Pk</button></div>
    <p class="hint">Cada ficha tiene una sección <b>Confianza de los datos</b> con rangos mín/probable/máx y fuentes. Revisión OSINT: octubre 2026.</p>
    <div class="grp"><h3>Amenazas</h3><div class="list">${Object.entries(THREATS).map(([k, t]) => row('thr', k, t, kmh(t.v) + ' · RCS ' + t.rcs + ' m²')).join('')}</div></div>
    <div class="grp"><h3>Defensas y sensores</h3><div class="list">${Object.entries(DEFENSES).map(([k, d]) => row('def', k, d, d.sam ? d.sam.maxR + ' km · ' + d.sam.guid : (d.radar ? 'banda ' + d.radar.band : ''))).join('')}</div></div>
    <div class="grp"><h3>Guerra electrónica</h3><div class="list">${Object.entries(JAMMERS).map(([k, j]) => row('jam', k, j, j.gnssJam ? 'GNSS · ' + j.radius + ' km' : 'bandas ' + j.bands.join('/'))).join('')}</div></div>`;
  el.onclick = e => { const f = e.target.closest('[data-f]'); if (f) { const [kind, k] = f.dataset.f.split(':'); openFicha(kind, k); } };
  $('#cmpT').onclick = cmpThreats; $('#cmpD').onclick = cmpDefs; $('#calB').onclick = openCal;
}
