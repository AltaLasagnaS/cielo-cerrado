// Pestaña "Defensa": catálogo de sistemas para ubicar, mando y control, y opciones de cobertura.
import { DEFENSES, THREATS } from '../../data/index.js';
import { esc } from '../../util/format.js';
import { S } from '../../sim/state.js';
import { draw } from '../../render/draw.js';
import { $ } from '../dom.js';
import { schedCov } from '../coverage.js';
import { setMode, toast } from '../modes.js';
import { openFicha } from '../fichas.js';

/** Botón de unidad con su "i" para abrir la ficha. */
export function unitBtn(key, def, act, cls) { return `<button class="ub ${cls} ${act ? 'act' : ''}" data-k="${key}" title="${esc(def.name)}"><span>${esc(def.short)}</span><i data-info="${key}" role="button" aria-label="Ficha">i</i></button>`; }
export function renderDef() {
  const el = $('#tab-def');
  const grp = (title, filter) => { const ks = Object.keys(DEFENSES).filter(k => filter(DEFENSES[k])); return `<div class="grp"><h3>${title}</h3><div class="unitgrid">${ks.map(k => unitBtn(k, DEFENSES[k], S.mode === 'placeDef' && S.placeType === k, DEFENSES[k].side === 'RU' ? 'ru' : '')).join('')}</div></div>`; };
  el.innerHTML = `
    ${grp('Ucrania / OTAN', d => (d.side === 'UA' || d.side === 'both') && d.kind !== 'sensor' && d.kind !== 'aew' && d.kind !== 'acoustic')}
    ${grp('Rusia', d => d.side === 'RU' && d.kind !== 'aew')}
    ${grp('Sensores', d => ['sensor', 'aew', 'acoustic'].includes(d.kind))}
    <div class="grp"><h3>Mando y control</h3>
      <label class="check"><input type="checkbox" id="optNet" ${S.net ? 'checked' : ''}><span>Red integrada<br><span class="hint">Las pistas de cualquier sensor se comparten. Misiles activos/IR y drones interceptores pueden disparar con pista ajena, y se evita que dos baterías gasten misiles en el mismo blanco.</span></span></label>
      <div class="field"><label for="optDoc">Doctrina de tiro</label><select id="optDoc" class="sel"><option value="salva" ${S.doctrine === 'salva' ? 'selected' : ''}>Salva (según unidad)</option><option value="sls" ${S.doctrine === 'sls' ? 'selected' : ''}>Disparar-observar-disparar</option></select></div>
    </div>
    <div class="grp"><h3>Cobertura de radar</h3>
      <label class="check"><input type="checkbox" id="optCov" ${S.showCov ? 'checked' : ''}> Mostrar cobertura sobre el mapa</label>
      <div class="field"><label for="optRef">Contra</label><select id="optRef" class="sel">${Object.entries(THREATS).map(([k, t]) => `<option value="${k}" ${k === S.covRef ? 'selected' : ''}>${esc(t.short)} (RCS ${t.rcs} m²)</option>`).join('')}</select></div>
      <div class="field"><label for="optAgl">Altura del blanco sobre el terreno</label><span class="val" id="aglVal">${S.covAgl} m</span><input type="range" id="optAgl" min="10" max="10000" step="10" value="${S.covAgl}"></div>
      <p class="hint" id="covInfo"></p>
    </div>`;
  el.onclick = e => {
    const inf = e.target.closest('[data-info]'); if (inf) { e.stopPropagation(); openFicha('def', inf.dataset.info); return; }
    const b = e.target.closest('.ub'); if (!b) return; if (S.started) { toast('Reiniciá para editar el escenario.'); return; }
    if (S.mode === 'placeDef' && S.placeType === b.dataset.k) setMode('select'); else setMode('placeDef', b.dataset.k);
  };
  $('#optNet').onchange = e => { S.net = e.target.checked; };
  $('#optDoc').onchange = e => { S.doctrine = e.target.value; };
  $('#optCov').onchange = e => { S.showCov = e.target.checked; draw(); };
  $('#optRef').onchange = e => { S.covRef = e.target.value; const T = THREATS[S.covRef]; S.covAgl = T.agl ?? (T.prof === 'ballistic' ? 10000 : (T.prof === 'hilo' ? 15 : 5000)); $('#optAgl').value = S.covAgl; $('#aglVal').textContent = S.covAgl + ' m'; schedCov(); };
  $('#optAgl').oninput = e => { S.covAgl = +e.target.value; $('#aglVal').textContent = S.covAgl + ' m'; schedCov(); };
  renderCovInfo();
}
/** Texto explicativo bajo las opciones de cobertura (incluye el % cubierto). */
export function renderCovInfo() { const el = $('#covInfo'); if (!el) return; const T = THREATS[S.covRef]; el.innerHTML = `Turquesa: al menos un sensor ve un <b>${esc(T.short)}</b> a <b>${S.covAgl} m</b> sobre el terreno (más intenso = 2+ sensores). Oscuro: hueco de cobertura. ${S.covStat ? 'Cubierto: <b>' + S.covStat.pct + '%</b> del mapa.' : ''}`; }
