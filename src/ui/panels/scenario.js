// Tarjeta "Escenario" (panel derecho) y ventana de briefing: para qué se juega cada escenario.
import { TARGET_TYPES, TARGET_STATUS, TERRAIN } from '../../data/index.js';
import { esc } from '../../util/format.js';
import { MAP } from '../../physics/terrain.js';
import { S } from '../../sim/state.js';
import { frameAt } from '../../sim/replay.js';
import { $ } from '../dom.js';
import { openModal } from '../fichas.js';
import { renderSel } from './selection.js';

const SIDE = { ataque: 'Ataque', defensa: 'Defensa' };
const KIND = { destroy: 'destruir', damage: 'dañar', protect: 'proteger', survive: 'que sobreviva', killUnit: 'destruir unidad', keepUnit: 'conservar unidad' };

const objRow = g => {
  const hp = g.hp ?? g.maxHp, st = g.status || 'operational';
  return `<div class="sobj" data-oid="${g.id}"><span class="t">${esc(TARGET_TYPES[g.type].icon)} · ${esc(g.name)}</span><span class="chip st-${st}">${TARGET_STATUS[st]}</span><div class="hpbar"><i class="st-${st}" style="width:${(100 * Math.max(0, hp) / g.maxHp).toFixed(1)}%"></i></div><span class="n">HP ${Math.max(0, hp)} / ${g.maxHp}</span></div>`;
};

export function renderScenario() {
  const el = $('#scenCard'), sc = S.scen;
  if (!sc) { el.innerHTML = `<h3>Escenario</h3><p class="hint">Relieve importado: escenario libre. Ubicá objetivos en la pestaña Ataque.</p>`; return; }
  const objs = S.replay ? frameAt(S.replay.t).objs : S.started ? S.objs : S.setup.objs;   // en la repetición, los del instante elegido
  const mine = (sc.goals || []).filter(g => g.side === sc.player);
  el.innerHTML = `<div class="row" style="justify-content:space-between"><h3>Escenario</h3><button class="btn sm" id="briefBtn">Briefing</button></div>
    <p class="hint">${sc.time ? esc(sc.time) + ' · ' : ''}Jugás: <b>${SIDE[sc.player] || '—'}</b></p>
    ${objs.length ? `<div class="sobjs">${objs.map(objRow).join('')}</div>` : '<p class="hint">Sin objetivos: agregalos en la pestaña Ataque.</p>'}
    ${mine.length ? `<ul class="sgoals">${mine.map(g => `<li>${g.primary ? '<b>Principal:</b> ' : ''}${esc(g.text)}</li>`).join('')}</ul>` : ''}`;
  $('#briefBtn').onclick = openBriefing;
  el.onclick = e => { const r = e.target.closest('[data-oid]'); if (r) { S.sel = { kind: 'obj', id: +r.dataset.oid }; renderSel(); } };
}

/** Ventana con todo el escenario: situación, fuerzas, condiciones, reglas, objetivos y metas. */
export function openBriefing() {
  const sc = S.scen; if (!sc) return;
  const goals = side => (sc.goals || []).filter(g => g.side === side);
  const goalList = side => goals(side).length ? `<div><b>${SIDE[side]}${sc.player === side ? ' (vos)' : ''}</b><ul class="goals">${goals(side).map(g => `<li>${g.primary ? '<b>Principal:</b> ' : 'Secundaria: '}${esc(g.text)} <span class="dim">(${KIND[g.kind]})</span></li>`).join('')}</ul></div>` : '';
  openModal(`<header><div><span class="chip">Briefing · ${esc(TERRAIN[sc.map]?.name || MAP?.name || '')}</span><h2>${esc(sc.name)}</h2></div><button class="btn x">Cerrar</button></header><div class="bd">
    <div class="specs">${[['Hora', sc.time || '—'], ['Jugás', SIDE[sc.player] || '—'], ['Mapa', TERRAIN[sc.map]?.name || '—']].map(([a, b]) => `<div class="spec"><small>${a}</small><b>${esc(b)}</b></div>`).join('')}</div>
    <p>${esc(sc.description || '')}</p>
    ${sc.forces ? `<div class="dbcols"><div><h3>Defensa</h3><p>${esc(sc.forces.defensa)}</p></div><div><h3>Ataque</h3><p>${esc(sc.forces.ataque)}</p></div></div>` : ''}
    ${sc.conditions ? `<div><h3>Condiciones iniciales</h3><p>${esc(sc.conditions)}</p></div>` : ''}
    ${sc.rulesText?.length ? `<div><h3>Reglas especiales</h3><ul>${sc.rulesText.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>` : ''}
    ${sc.objectives?.length ? `<div><h3>Objetivos</h3><ul>${sc.objectives.map(o => `<li><b>${esc(o.name)}</b> — ${esc(TARGET_TYPES[o.type].name)}, ${o.hp || TARGET_TYPES[o.type].hp} HP. ${esc(o.desc || '')}</li>`).join('')}</ul></div>` : ''}
    ${(sc.goals || []).length ? `<div><h3>Metas</h3><div class="dbgoals">${goalList('defensa')}${goalList('ataque')}</div></div>` : ''}
    ${sc.success || sc.failure ? `<div class="dbcols">${sc.success ? `<div class="okbox"><h3>Éxito</h3><p>${esc(sc.success)}</p></div>` : ''}${sc.failure ? `<div class="warn"><h3>Fracaso</h3><p>${esc(sc.failure)}</p></div>` : ''}</div>` : ''}
    <p class="hint">Podés cambiar todo: mover defensas, agregar ataques u objetivos. Al terminar, el debrief evalúa estas metas.</p>
  </div>`, openBriefing);
}
