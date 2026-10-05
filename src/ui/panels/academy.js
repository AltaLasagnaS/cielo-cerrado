// @ts-check
// Pestaña "Academia": índice de conceptos físicos y de radar que usa el motor.
import { BANDS } from '../../data/index.js';
import { esc } from '../../util/format.js';
import { CONCEPTS, CONCEPT_GROUPS } from '../../edu/concepts.js';
import { $ } from '../dom.js';

export function renderAcademy() {
  const item = c => `<button class="item concept-item" data-concept="${c.id}"><span class="t">${esc(c.title)}</span></button>`;
  $('#tab-edu').innerHTML = `<p class="hint">Explicaciones cortas de los conceptos que usa la simulación. Cada una muestra <b>cómo lo calcula el motor</b>, con las variables reales y números del catálogo. También podés abrirlas desde los botones ⓘ de las fichas y los paneles.</p>
    ${CONCEPT_GROUPS.map(g => `<div class="grp"><h3>${esc(g)}</h3>${g === 'Radar y bandas' ? `<div class="row">${Object.keys(BANDS).map(b => `<button class="chip" data-concept="band:${b}" title="${esc(BANDS[b].name + ' · ' + BANDS[b].freq)}">${esc(b)}</button>`).join('')}</div>` : ''}<div class="list">${CONCEPTS.filter(c => c.group === g && !c.id.startsWith('band:')).map(item).join('')}</div></div>`).join('')}`;
}
