// Tarjetas "Resultado" y "Registro".
import { fmtT, esc, money } from '../../util/format.js';
import { S } from '../../sim/state.js';
import { $ } from '../dom.js';

let logDirty = true;

/** Marca el registro para redibujar en el próximo refresco. */
export function markLogDirty() { logDirty = true; }

/** Redibuja el registro solo si cambió. */
export function renderLogIfDirty() { if (logDirty) renderLog(); }

export function renderStats() {
  const s = S.stats;
  const rate = s.launched ? Math.round(100 * s.killed / s.launched) : 0;
  $('#stats').innerHTML = `
    <div class="stat"><b>${s.launched}</b><small>Lanzadas (${s.decoys} señuelos)</small></div>
    <div class="stat g"><b>${s.killed}</b><small>Derribadas · ${rate}%</small></div>
    <div class="stat r"><b>${s.hits}</b><small>Impactos en blanco</small></div>
    <div class="stat a"><b>${s.misses}</b><small>Cayeron fuera</small></div>
    <div class="stat"><b>${s.shots}</b><small>Interceptores usados</small></div>
    <div class="stat"><b>${s.decoysKilled}</b><small>Señuelos derribados</small></div>
    <div class="stat"><b>${money(s.defCost)}</b><small>Gasto defensa</small></div>
    <div class="stat"><b>${money(s.atkCost)}</b><small>Gasto ataque</small></div>
    ${s.lost ? `<div class="stat r"><b>${s.lost}</b><small>Unidades perdidas</small></div>` : ''}`;
}
export function renderLog() { logDirty = false; $('#log').innerHTML = S.log.slice(0, 150).map(l => `<div class="${l.cls}"><time>${fmtT(l.t)}</time>${esc(l.msg)}</div>`).join('') || '<div>Sin eventos todavía. Apretá ▶ Iniciar.</div>'; }
