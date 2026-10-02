// ---------------- PANELES ----------------
// Cada pestaña del panel izquierdo y cada tarjeta del derecho tiene su módulo. Todos regeneran su
// HTML completo a partir de S (no hay estado propio en el DOM).
import { $ } from '../dom.js';
import { updatePlay } from '../controls.js';
import { renderDef } from './defense.js';
import { renderAtk } from './attack.js';
import { renderEW } from './ew.js';
import { renderCat } from './catalog.js';
import { renderSel } from './selection.js';
import { renderStats, renderLog } from './results.js';

/** Pestañas que dependen del modo de edición. */
export function renderTabs() { renderDef(); renderEW(); }

/** Todo el panel. */
export function renderAll() { renderTabs(); renderAtk(); renderCat(); renderSel(); renderStats(); renderLog(); updatePlay(); }

/** Cambio de pestaña (Defensa / Ataque / Guerra E. / Catálogo). */
export function initTabs() {
  document.querySelector('.tabs').onclick = e => { const b = e.target.closest('button'); if (!b) return; for (const x of document.querySelectorAll('.tabs button')) x.classList.toggle('act', x === b); for (const t of ['def', 'atk', 'ew', 'cat']) $('#tab-' + t).hidden = t !== b.dataset.tab; };
}
