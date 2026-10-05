// @ts-check
// Academia: ventana de cada concepto y botones ⓘ en toda la interfaz.
// Cualquier elemento con data-concept="id" abre el concepto (ver edu/concepts.js).
import { BANDS } from '../data/index.js';
import { esc } from '../util/format.js';
import { CONCEPTS, conceptById } from '../edu/concepts.js';
import { $ } from './dom.js';
import { openModal, pushModalFn } from './fichas.js';

/** Botón ⓘ que abre un concepto. */
export const infoBtn = (id, title) => `<button class="cinfo" data-concept="${id}" title="${esc(title || 'Qué es: ' + (conceptById(id)?.title || id))}" aria-label="Explicación">ⓘ</button>`;

/** Chip de banda con tooltip (nombre y frecuencia) que abre su explicación. */
export const bandChip = b => `<button class="chip" data-concept="band:${b}" title="${esc(BANDS[b].name + ' · ' + BANDS[b].freq)}">${esc(b)}</button>`;

function showConcept(id) {
  const c = conceptById(id); if (!c) return;
  const related = CONCEPTS.filter(x => x.group === c.group && x.id !== c.id && !x.id.startsWith('band:')).map(x => `<button class="chip" data-concept="${x.id}">${esc(x.title)}</button>`).join(' ');
  openModal(`<header><div><span class="chip">Academia · ${esc(c.group)}</span><h2>${esc(c.title)}</h2></div><button class="btn x">Cerrar</button></header>
    <div class="bd concept">${c.body()}
      ${c.widget ? `<div><h3>Probalo</h3>${c.widget.html()}</div>` : ''}
      <div class="engine"><h3>En el simulador</h3>${c.engine()}</div>
      ${related ? `<div><h3>Relacionado</h3><div class="row">${related}</div></div>` : ''}
    </div>`, () => showConcept(id));
  if (c.widget) c.widget.mount($('#sheet'));
}

/** Abre un concepto; si había una ficha abierta, "← Volver" regresa a ella. */
export function openConcept(id) { pushModalFn(() => showConcept(id)); }

export function initAcademy() {
  // fase de captura: el ⓘ no dispara el click de la fila o botón que lo contiene
  document.addEventListener('click', e => {
    const el = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (e.target).closest('[data-concept]')); if (!el) return;
    e.preventDefault(); e.stopPropagation(); openConcept(el.dataset.concept);
  }, true);
}
