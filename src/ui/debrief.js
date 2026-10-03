// Ventana de Debrief al terminar una corrida (datos de sim/debrief.js).
import { TARGET_TYPES, TARGET_STATUS } from '../data/index.js';
import { esc, fmtT, money } from '../util/format.js';
import { S } from '../sim/state.js';
import { buildDebrief } from '../sim/debrief.js';
import { $ } from './dom.js';
import { openModal } from './fichas.js';
import { openMonteCarlo } from './montecarlo.js';

const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '—';
const SIDE = { ataque: 'Ataque', defensa: 'Defensa' };

export function openDebrief() {
  const d = buildDebrief(S), a = d.attack, g = d.damage, f = d.defense;
  const res = d.outcome.result, resCls = { exito: 'st-operational', parcial: 'st-damaged', fracaso: 'st-destroyed' }[res] || '';
  const objRows = d.objectives.map(o => `<div class="dbobj"><span class="t">${esc(TARGET_TYPES[o.type].icon)} · ${esc(o.name)}</span><span class="chip st-${o.status}">${TARGET_STATUS[o.status].toUpperCase()}</span><span class="n">${o.dmg} / ${o.maxHp} de daño</span><div class="hpbar"><i class="st-${o.status}" style="width:${(100 * (o.maxHp - o.dmg) / o.maxHp).toFixed(1)}%"></i></div></div>`).join('') || '<p class="hint">El escenario no tiene objetivos: las armas caen sobre puntos del mapa.</p>';
  const goalRows = ['ataque', 'defensa'].map(side => {
    const gs = d.goals.filter(x => x.side === side); if (!gs.length) return '';
    return `<div><b>${SIDE[side]}${d.outcome.side === side ? ' (vos)' : ''}</b><ul class="goals">${gs.map(x => `<li class="${x.met ? 'ok' : 'no'}">${x.met ? '✔' : '✘'} ${x.primary ? '<b>Principal:</b> ' : 'Secundaria: '}${esc(x.text)}</li>`).join('')}</ul></div>`;
  }).join('');
  const typeRows = Object.entries(a.byType).map(([k, b]) => `<tr><td>${esc(k)}</td><td>${b.launched}</td><td>${b.killed}</td><td>${b.arrived}</td><td>${b.shotsAt}</td></tr>`).join('');
  const tl = d.timeline.map(e => `<li><time>${fmtT(e.t)}</time> — ${esc(e.text)}</li>`).join('') || '<li>Sin eventos.</li>';
  openModal(`<header><div><span class="chip">${esc(d.scen?.name || 'Escenario libre')}</span><h2>Debrief</h2></div><button class="btn x">Cerrar</button></header><div class="bd debrief">
    <div class="dbres ${resCls}"><b>${esc(d.outcome.side ? SIDE[d.outcome.side] + ': ' : '')}${esc(d.outcome.text)}</b><span>Duración ${fmtT(d.t).slice(2)} de tiempo simulado</span></div>
    ${goalRows ? `<div><h3>Metas del escenario</h3><div class="dbgoals">${goalRows}</div></div>` : ''}
    <div><h3>Objetivos</h3>${objRows}</div>
    <div class="dbcols">
      <div><h3>Ataque</h3><ul class="dblist">
        <li><b>${a.real}</b> armas lanzadas${a.decoys ? ` + <b>${a.decoys}</b> señuelos` : ''}</li>
        <li><b>${a.intercepted}</b> interceptadas (${pct(a.intercepted, a.real)})</li>
        <li><b>${a.impacts}</b> impactos en el blanco · <b>${a.misses}</b> fuera${a.lostLocally ? ` (<b>${a.lostLocally}</b> perdidas localmente por engaño GNSS)` : ''}</li>
        <li><b>${a.decoysKilled}</b> señuelos derribados</li></ul></div>
      <div><h3>Daño</h3><ul class="dblist">
        <li>Daño total: <b>${g.total}</b> HP</li>
        <li>Mayor fuente de daño: <b>${g.top ? esc(g.top[0]) + ' (' + g.top[1] + ' HP)' : '—'}</b></li>
        <li>Distancia media de caída al punto apuntado: <b>${g.avgMiss == null ? '—' : Math.round(g.avgMiss) + ' m'}</b></li>
        <li>Objetivos destruidos: <b>${g.objsDestroyed}</b> · en pie: <b>${g.objsSurviving}</b></li></ul></div>
      <div><h3>Defensa</h3><ul class="dblist">
        <li>Interceptores lanzados: <b>${f.shots}</b>${f.perKill ? ` (${f.perKill.toFixed(1)} por derribo)` : ''}</li>
        <li>Munición restante: <b>${f.magLeft}</b> de ${f.magTotal}</li>
        <li>Gasto en munición: <b>${money(f.defCost)}</b> (ataque: ${money(f.atkCost)})</li>
        <li>Unidades perdidas: <b>${f.lost.length ? esc(f.lost.join(', ')) : 'ninguna'}</b></li>
        ${f.avgDetKm != null ? `<li>Primera detección, en promedio: <b>${f.avgDetKm.toFixed(0)} km</b> antes del blanco</li>` : ''}</ul></div>
    </div>
    <div><h3>¿Por qué pasó lo que pasó?</h3><ul class="why">${d.why.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>
    <div><h3>Línea de tiempo</h3><ol class="timeline">${tl}</ol></div>
    <div><h3>Por tipo de arma</h3><div class="tblwrap"><table class="t"><thead><tr><th>Arma</th><th>Lanzadas</th><th>Derribadas</th><th>Llegaron</th><th>Interceptores recibidos</th></tr></thead><tbody>${typeRows}</tbody></table></div></div>
    <p class="hint">Todo lo de arriba sale de lo que registró el motor durante la corrida. Corré de nuevo con otra disposición: el azar (detección, Pk, dispersión) cambia el resultado de una corrida a otra.</p>
    <div class="row"><button class="btn" id="dbMc">¿Fue suerte? Repetir muchas veces (Monte Carlo)</button></div>
  </div>`, openDebrief);
  $('#dbMc').onclick = openMonteCarlo;
}
