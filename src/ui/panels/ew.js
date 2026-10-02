// Pestaña "Guerra E.": ubicar interferidores, prenderlos/apagarlos y explicación del modelo.
import { JAMMERS } from '../../data/index.js';
import { esc } from '../../util/format.js';
import { S } from '../../sim/state.js';
import { $ } from '../dom.js';
import { schedCov } from '../coverage.js';
import { setMode, toast } from '../modes.js';
import { openFicha } from '../fichas.js';

export function renderEW() {
  const el = $('#tab-ew');
  el.innerHTML = `
    <div class="grp"><h3>Interferidores y contramedidas</h3><div class="unitgrid">${Object.entries(JAMMERS).map(([k, j]) => `<button class="ub ew ${S.mode === 'placeJam' && S.placeType === k ? 'act' : ''}" data-k="${k}" title="${esc(j.name)}"><span>${esc(j.short)}</span><i data-info="${k}" role="button" aria-label="Ficha">i</i></button>`).join('')}</div></div>
    <label class="check"><input type="checkbox" id="optStr" ${S.strobes ? 'checked' : ''}> Mostrar "strobes" de interferencia (líneas violeta radar → jammer)</label>
    <div class="grp"><h3>Desplegados</h3><div class="list" id="jList">${S.setup.jams.map(j => `<div class="item vio"><span class="t">${esc(JAMMERS[j.type].name)}</span><span class="s">${j.x.toFixed(1)}, ${j.y.toFixed(1)} km${JAMMERS[j.type].air ? ' · ' + j.alt + ' m' : ''}</span><span class="a"><button class="btn sm ${j.on ? 'on' : ''}" data-tog="${j.id}">${j.on ? 'Activo' : 'Apagado'}</button><button class="btn sm danger" data-del="${j.id}" aria-label="Borrar">✕</button></span></div>`).join('') || '<p class="hint">Ninguno.</p>'}</div></div>
    <div class="grp"><h3>Modelo</h3><p class="hint">Jammer de ruido: reduce el alcance de detección como <b>R' = R·(1/(1+J/N))<sup>¼</sup></b>. J/N cae con la distancia al cuadrado, solo afecta radares de la misma banda, necesita línea de vista y es ~25 dB más débil fuera del lóbulo principal. Cada radar tiene un margen ECCM (dB) en su ficha. El anti-GNSS no toca radares: desvía armas que navegan por satélite.</p></div>`;
  el.onclick = e => {
    const inf = e.target.closest('[data-info]'); if (inf) { e.stopPropagation(); openFicha('jam', inf.dataset.info); return; }
    const t = e.target.closest('[data-tog]'); if (t) { const j = S.setup.jams.find(v => v.id == t.dataset.tog); j.on = !j.on; if (S.started) { const jl = S.jamsLive.find(v => v.id == j.id); if (jl) jl.on = j.on; } renderEW(); schedCov(); return; }
    const d = e.target.closest('[data-del]'); if (d) { if (S.started) { toast('Reiniciá para editar.'); return; } S.setup.jams = S.setup.jams.filter(v => v.id != d.dataset.del); renderEW(); schedCov(); return; }
    const b = e.target.closest('.ub'); if (!b) return; if (S.started) { toast('Reiniciá para editar el escenario.'); return; }
    if (S.mode === 'placeJam' && S.placeType === b.dataset.k) setMode('select'); else setMode('placeJam', b.dataset.k);
  };
  $('#optStr').onchange = e => { S.strobes = e.target.checked; };
}
