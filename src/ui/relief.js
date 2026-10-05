// @ts-check
// Control "Relieve" sobre el mapa: cambia el modo de lectura del terreno (solo visual).
import { S } from '../sim/state.js';
import { RELIEF_MODES } from '../render/terrain.js';
import { draw } from '../render/draw.js';
import { $ } from './dom.js';

const HELP = {
  normal: 'Colores por altura con sombreado suave y curvas maestras.',
  peaks: 'Marca los puntos altos que dominan su entorno (▲ y cota). Útil para ubicar radares y puestos de observación.',
  contours: 'Curvas de nivel nítidas; cada 5ª curva es más gruesa (curva maestra).',
  shade: 'Sombreado del relieve iluminado desde el noroeste: resalta crestas, valles y laderas.'
};

export function initRelief() {
  const el = $('#relief');
  el.insertAdjacentHTML('beforeend', Object.entries(RELIEF_MODES).map(([k, n]) => `<button data-relief="${k}" title="${HELP[k]}">${n}</button>`).join(''));
  el.onclick = e => { const b = e.target.closest('[data-relief]'); if (!b) return; S.relief = b.dataset.relief; updateRelief(); draw(); };
  updateRelief();
}

export function updateRelief() { for (const b of $('#relief').querySelectorAll('[data-relief]')) b.classList.toggle('act', b.dataset.relief === S.relief); }
