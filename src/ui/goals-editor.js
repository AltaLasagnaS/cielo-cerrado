// @ts-check
// Editor de metas del escenario (ventana desde la tarjeta "Escenario"). Las metas viven en S.scen.goals
// con el mismo formato que data/scenarios.js y los archivos guardados (sim/scenario-io.js las valida);
// las evalúa sim/goals.js al terminar. Nunca modifica el escenario incluido: trabaja sobre una copia.
import { DAMAGED_AT } from '../data/index.js';
import { esc } from '../util/format.js';
import { S } from '../sim/state.js';
import { $ } from './dom.js';
import { openModal } from './fichas.js';
import { toast } from './modes.js';

const SIDE = { defensa: 'Defensa', ataque: 'Ataque' };
/** Tipos de meta: sobre objetivos (obj) o sobre unidades de defensa (unit). */
export const GOAL_TYPES = {
  destroy: { on: 'obj', name: 'Destruir objetivo', text: t => `Destruir ${t}` },
  damage: { on: 'obj', name: 'Dañar objetivo (≥ %)', text: (t, g) => `Dañar ${t} (≥ ${Math.round((g.min ?? DAMAGED_AT) * 100)}%)` },
  protect: { on: 'obj', name: 'Mantener operativo', text: t => `Mantener operativo ${t}` },
  survive: { on: 'obj', name: 'Que no sea destruido', text: t => `Que ${t} no sea destruido` },
  killUnit: { on: 'unit', name: 'Destruir unidad', text: t => `Destruir la unidad ${t}` },
  keepUnit: { on: 'unit', name: 'Conservar unidad', text: t => `Conservar la unidad ${t}` }
};

/** Texto automático de una meta (el que se muestra en el briefing y el debrief). */
export const goalText = g => GOAL_TYPES[g.kind]?.text(g.target || '—', g) ?? g.text;

/** Nombres que puede apuntar una meta del tipo kind (objetivos o unidades del escenario armado). */
const targetsFor = kind => GOAL_TYPES[kind].on === 'obj' ? S.setup.objs.map(o => o.name) : S.setup.defs.map(u => u.name);

/** Copia editable del escenario actual (o uno libre si no hay). */
function draft() {
  const sc = S.scen || { name: 'Escenario libre', player: 'defensa', goals: [] };
  return { ...sc, player: sc.player || 'defensa', goals: (sc.goals || []).map(g => ({ ...g })) };
}

export function openGoalsEditor() {
  if (S.started) { toast('Reiniciá para editar las metas.'); return; }
  const d = draft();
  const row = (g, i) => {
    const names = targetsFor(g.kind), missing = g.target && !names.includes(g.target);
    return `<tr data-i="${i}">
      <td><select class="sel" data-f="side" aria-label="Bando">${Object.entries(SIDE).map(([k, v]) => `<option value="${k}" ${g.side === k ? 'selected' : ''}>${v}</option>`).join('')}</select></td>
      <td><label class="check"><input type="checkbox" data-f="primary" ${g.primary ? 'checked' : ''}> Principal</label></td>
      <td><select class="sel" data-f="kind" aria-label="Tipo de meta">${Object.entries(GOAL_TYPES).map(([k, v]) => `<option value="${k}" ${g.kind === k ? 'selected' : ''}>${v.name}</option>`).join('')}</select></td>
      <td><select class="sel" data-f="target" aria-label="Blanco">${missing ? `<option value="${esc(g.target)}" selected>⚠ ${esc(g.target)} (ya no existe)</option>` : ''}${names.map(n => `<option value="${esc(n)}" ${g.target === n ? 'selected' : ''}>${esc(n)}</option>`).join('') || '<option value="">(no hay)</option>'}</select></td>
      <td>${g.kind === 'damage' ? `<input class="inp" type="number" data-f="min" min="5" max="100" step="5" value="${Math.round((g.min ?? DAMAGED_AT) * 100)}" aria-label="Daño mínimo (%)" style="width:5em">%` : ''}</td>
      <td><button class="btn sm danger" data-del="${i}" aria-label="Borrar meta">✕</button></td></tr>`;
  };
  const render = () => {
    openModal(`<header><div><span class="chip">${esc(d.name || 'Escenario')}</span><h2>Metas del escenario</h2></div><button class="btn x">Cerrar</button></header><div class="bd">
      <div class="field"><label for="gPlayer">Jugás</label><select id="gPlayer" class="sel">${Object.entries(SIDE).map(([k, v]) => `<option value="${k}" ${d.player === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <p class="hint">El resultado se juzga con tus metas <b>principales</b>: todas cumplidas es éxito, algunas es éxito parcial, ninguna es fracaso. Las secundarias se cuentan aparte. Las metas apuntan a objetivos o unidades por su nombre: si renombrás o borrás uno, la meta queda marcada con ⚠.</p>
      <div class="tblwrap"><table class="t"><thead><tr><th>Bando</th><th></th><th>Meta</th><th>Sobre</th><th>Mínimo</th><th></th></tr></thead><tbody>${d.goals.map(row).join('') || '<tr><td colspan="6" class="hint">Sin metas.</td></tr>'}</tbody></table></div>
      <ul class="goals">${d.goals.map(g => `<li>${SIDE[g.side]} · ${g.primary ? '<b>Principal:</b> ' : 'Secundaria: '}${esc(goalText(g))}</li>`).join('')}</ul>
      <div class="row"><button class="btn" id="gAdd">+ Agregar meta</button><button class="btn pri" id="gSave">Guardar metas</button></div>
    </div>`, null);
    $('#gPlayer').onchange = e => { d.player = e.target.value; };
    $('#gAdd').onclick = () => {
      const kind = S.setup.objs.length ? 'survive' : 'keepUnit';
      d.goals.push({ side: d.player, primary: !d.goals.some(g => g.side === d.player && g.primary), kind, target: targetsFor(kind)[0] || '' });
      render();
    };
    $('#gSave').onclick = () => {
      const goals = d.goals.filter(g => g.target).map(g => ({ ...g, text: goalText(g) }));
      S.scen = { ...d, goals };
      toast(goals.length + ' meta' + (goals.length === 1 ? '' : 's') + ' guardada' + (goals.length === 1 ? '' : 's') + '.');
      onSaved?.();
      $('#modal').hidden = true;
    };
    for (const tr of $('#sheet').querySelectorAll('tr[data-i]')) {
      const g = d.goals[+tr.dataset.i];
      tr.onchange = e => {
        const f = e.target.dataset.f; if (!f) return;
        if (f === 'primary') g.primary = e.target.checked;
        else if (f === 'min') { const v = +e.target.value; if (Number.isFinite(v) && v >= 5 && v <= 100) g.min = v / 100; }
        else g[f] = e.target.value;
        if (f === 'kind' && !targetsFor(g.kind).includes(g.target)) g.target = targetsFor(g.kind)[0] || '';
        render();
      };
    }
    for (const b of $('#sheet').querySelectorAll('[data-del]')) b.onclick = () => { d.goals.splice(+b.dataset.del, 1); render(); };
  };
  render();
}

/** Lo que hay que refrescar después de guardar (lo conecta la tarjeta "Escenario"). */
let onSaved = null;
export function setGoalsSavedHook(fn) { onSaved = fn; }
