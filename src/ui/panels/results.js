// @ts-check
// Tarjetas "Resultado" y "Registro".
import { fmtT, esc, money } from '../../util/format.js';
import { S } from '../../sim/state.js';
import { $, viewNow } from '../dom.js';
import { logFor } from '../../sim/log.js';
import { openDebrief } from '../debrief.js';

let logDirty = true;

/** Marca el registro para redibujar en el próximo refresco. */
export function markLogDirty() { logDirty = true; }

/** Redibuja el registro solo si cambió. */
export function renderLogIfDirty() { if (logDirty) renderLog(); }

export function renderStats() {
  const s = S.stats, v = S.started ? viewNow() : 'all';
  const rate = s.launched ? Math.round(100 * s.killed / s.launched) : 0;
  const done = S.started && !S.running && !S.pending.length && S.threats.length && S.threats.every(t => !t.alive);
  if (v !== 'all' && !done) {
    // vistas por bando: cada uno ve lo que sabe durante la noche; el debrief muestra todo al final
    $('#stats').innerHTML = v === 'def' ? `
    <div class="stat g"><b>${s.killed}</b><small>Derribos propios</small></div>
    <div class="stat"><b>${s.shots}</b><small>Interceptores usados</small></div>
    <div class="stat r"><b>${s.hits}</b><small>Impactos en objetivos</small></div>
    <div class="stat"><b>${money(s.defCost)}</b><small>Gasto defensa</small></div>
    ${s.lost ? `<div class="stat r"><b>${s.lost}</b><small>Unidades perdidas</small></div>` : ''}
    ${S.objs.length ? `<div class="stat ${s.damage ? 'r' : ''}"><b>${s.damage}</b><small>Daño a objetivos (HP)</small></div>` : ''}
    <p class="hint" style="grid-column:1/-1">Vista del defensor: no sabe cuántas armas se lanzaron, cuáles eran señuelos ni cuánto gastó el ataque.</p>` : `
    <div class="stat"><b>${s.launched}</b><small>Lanzadas (${s.decoys} señuelos)</small></div>
    <div class="stat"><b>${money(s.atkCost)}</b><small>Gasto ataque</small></div>
    <p class="hint" style="grid-column:1/-1">Vista del atacante: cuántas llegan y qué daño hacen se sabe en el debrief.</p>`;
    return;
  }
  $('#stats').innerHTML = `
    <div class="stat"><b>${s.launched}</b><small>Lanzadas (${s.decoys} señuelos)</small></div>
    <div class="stat g"><b>${s.killed}</b><small>Derribadas · ${rate}%</small></div>
    <div class="stat r"><b>${s.hits}</b><small>Impactos en blanco</small></div>
    <div class="stat a"><b>${s.misses}</b><small>Cayeron fuera</small></div>
    <div class="stat"><b>${s.shots}</b><small>Interceptores usados</small></div>
    <div class="stat"><b>${s.decoysKilled}</b><small>Señuelos derribados</small></div>
    <div class="stat"><b>${money(s.defCost)}</b><small>Gasto defensa</small></div>
    <div class="stat"><b>${money(s.atkCost)}</b><small>Gasto ataque</small></div>
    ${s.lost ? `<div class="stat r"><b>${s.lost}</b><small>Unidades perdidas</small></div>` : ''}
    ${S.objs.length ? `<div class="stat ${s.damage ? 'r' : ''}"><b>${s.damage}</b><small>Daño a objetivos (HP)</small></div><div class="stat"><b>${s.objsDestroyed}/${S.objs.length}</b><small>Objetivos destruidos</small></div>` : ''}
    ${done ? '<button class="btn pri" id="dbBtn" style="grid-column:1/-1">Ver debrief</button>' : ''}`;
  const b = $('#dbBtn'); if (b) b.onclick = openDebrief;
}
/** Registro de la vista activa: cada bando ve solo lo que sabe (sim/log.js#logFor). */
export function renderLog() { logDirty = false; $('#log').innerHTML = logFor(S.log, viewNow()).slice(0, 150).map(l => `<div class="${l.cls}"><time>${fmtT(l.t)}</time>${esc(l.text)}</div>`).join('') || '<div>Sin eventos todavía. Apretá ▶ Iniciar.</div>'; }
