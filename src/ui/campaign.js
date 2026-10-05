// @ts-check
// ---------------- CAMPAÑA ----------------
// Pantalla de la campaña experimental de Odesa dentro del juego. La lógica es la de Codex
// (experimentos/catalogo-presupuesto, PR #61): presupuesto, pedidos de munición con plazo, recargas,
// reparaciones, continuidad entre guardias y guardado (lib/operations.mjs), con el libro de recursos
// como única autoridad de munición. La guardia se juega en el mapa del juego, en vista del defensor,
// avanzada por el puente de combate de Codex (lib/port-combat.mjs) en lugar del paso normal del motor.
// Ver docs/ARQUITECTURA.md ("Campaña").
import { esc } from '../util/format.js';
import { S } from '../sim/state.js';
import { builtinMap, MAP } from '../physics/terrain.js';
import { PORT_CHOICES, PORT_BUDGET, portCampaignDefinition } from '../../experimentos/catalogo-presupuesto/data/port-campaign.mjs';
import { extendedPortCampaignDefinition } from '../../experimentos/catalogo-presupuesto/data/port-campaign-extended.mjs';
import { createOperations, operationView, operationMission, applyOperationResourceCommand, continueOperations, saveOperations, loadOperations } from '../../experimentos/catalogo-presupuesto/lib/operations.mjs';
import { startPortCombat } from '../../experimentos/catalogo-presupuesto/lib/port-combat.mjs';
import { $ } from './dom.js';
import { openModal, closeModal } from './fichas.js';
import { applyMap } from './app.js';
import { renderAll } from './panels/index.js';
import { markLogDirty } from './panels/results.js';
import { updatePlay } from './controls.js';

/** @type {any} */ let operation = null;
/** @type {any} */ let combat = null;
let serial = 0, message = '';
const nextId = p => `${p}-${Date.now()}-${++serial}`;
const hms = n => `${Math.floor(n / 3600)} h ${String(Math.floor(n % 3600 / 60)).padStart(2, '0')} min`;
const PHASE = { planning: 'Preparación', active: 'Guardia en curso', debrief: 'Parte de cierre', finished: 'Campaña terminada' };
const RESULT = { exito: 'Éxito', parcial: 'Éxito parcial', fracaso: 'Fracaso' };
/** Textos de la lógica de Codex (en inglés en el código) para mostrar. */
const ES = { operational: 'operativo', degraded: 'degradado', disabled: 'fuera de servicio', destroyed: 'destruido', pending: 'en curso', interrupted: 'interrumpido', completed: 'terminado', cancelled: 'cancelado', delivery: 'Entrega', transfer: 'Carga', repair: 'Reparación', return: 'Devolución', sensor: 'sensor', launcher: 'lanzador', control: 'control' };
const es = k => ES[k] || k;

/** ¿Hay una guardia de campaña corriendo en el mapa? (el bucle la avanza con campaignStep). */
export const campaignBattle = () => !!combat && operation?.phase === 'active';

/**
 * Un paso de 0,25 s de la guardia (lo llama ui/loop.js en lugar de engine.step). Al terminar, cierra la
 * guardia, para el reloj y abre el parte de cierre. → true mientras siga.
 */
export function campaignStep() {
  if (!combat) return false;
  let more = false;
  try { more = combat.step(); operation = combat.getOperation(); } catch (e) {
    // no se sigue con un libro inconsistente: se pausa y se muestra el motivo
    S.running = false; message = 'La guardia se detuvo: ' + (e instanceof Error ? e.message : String(e)); updatePlay(); openCampaign(); return false;
  }
  if (!more) { S.running = false; combat = null; updatePlay(); openCampaign(); }
  return more;
}

const stock = (loc, ammo) => operation.resources.inventory.stock.find(s => s.locationId === loc && s.ammunitionId === ammo)?.quantity ?? 0;
function command(kind, extra, atSeconds = operation.resources.clockSeconds) {
  operation = applyOperationResourceCommand(operation, { commandId: nextId(kind), sideId: 'ua', atSeconds, kind, ...extra });
}
/** Corre fn; si falla, muestra el motivo en la ventana sin perder la partida. */
function act(fn) { try { fn(); message = ''; } catch (e) { message = e instanceof Error ? e.message : String(e); } if (!campaignBattle()) openCampaign(); }
function positiveInt(v) {
  const n = Number(String(v).trim());
  if (!Number.isSafeInteger(n) || n <= 0) throw Error('La cantidad debe ser un entero positivo; no se redondea.');
  return n;
}

/** Abre la ventana de campaña en la fase que corresponda. */
export function openCampaign() {
  const head = `<header><div><span class="chip">Campaña experimental</span><h2>Odesa: sostener los puertos</h2></div><button class="btn x">Cerrar</button></header>`;
  const note = '<p class="hint">Campaña hipotética. Los créditos, la disponibilidad y los plazos son reglas del escenario, no precios ni contratos reales; las capacidades son las del catálogo actual. Lógica de recursos y continuidad: Codex (experimentos/catalogo-presupuesto).</p>';
  const err = message ? `<p class="warn" role="status">${esc(message)}</p>` : '';
  if (!operation) {
    const def = ['radar', 'vhf', 's125', 'buk', 'mobile'];
    openModal(`${head}<div class="bd">${note}${err}<h3>Asignación inicial · ${PORT_BUDGET} créditos</h3>
      <div class="cchoices">${PORT_CHOICES.map(c => `<label class="check"><input type="checkbox" value="${esc(c.id)}" ${def.includes(c.id) ? 'checked' : ''}> ${esc(c.name)} · ${c.cost} créditos${c.later ? ' · disponible desde la segunda guardia' : ''}</label>`).join('')}</div>
      <p id="cTotal" class="hint"></p><div class="field"><label for="cLen">Duración</label><select id="cLen" class="sel"><option value="2">Dos guardias</option><option value="3">Tres guardias (la tercera, 24 h después, con lo que quede; sin refuerzos)</option></select></div><div class="row"><button class="btn pri" id="cCreate">Asignar medios y empezar</button><label class="btn" for="cLoad">Cargar partida</label><input id="cLoad" type="file" accept=".json,application/json" hidden></div></div>`, openCampaign);
    const sel = () => [...document.querySelectorAll('.cchoices input:checked')].map(i => /** @type {HTMLInputElement} */ (i).value);
    const total = () => { const spent = PORT_CHOICES.filter(c => sel().includes(c.id)).reduce((n, c) => n + c.cost, 0); $('#cTotal').textContent = `Asignados ${spent}; quedan ${PORT_BUDGET - spent} créditos para munición y servicios.`; $('#cCreate').disabled = !sel().length || spent > PORT_BUDGET; };
    document.querySelectorAll('.cchoices input').forEach(i => { /** @type {HTMLInputElement} */ (i).onchange = total; }); total();
    // tres guardias: la continuación opcional de Codex (data/port-campaign-extended.mjs), mismo formato y guardado
    $('#cCreate').onclick = () => act(() => { const long = /** @type {HTMLSelectElement} */ ($('#cLen')).value === '3'; operation = createOperations((long ? extendedPortCampaignDefinition : portCampaignDefinition)(sel())); });
    bindLoad();
    return;
  }
  const v = operationView(operation);
  const goals = v.briefing.objectives.map(g => `<li>${esc(g.text)}</li>`).join('');
  let body = `<p><b>${esc(v.title)}</b> · ${PHASE[v.phase] || v.phase} · Fondos: <b>${v.resources.balance}</b> créditos · Tiempo de campaña: ${hms(v.atSeconds)}</p><ul>${goals}</ul>`;
  if (v.phase === 'planning') body += planning(v);
  if (v.debrief) body += `<h3>Parte de cierre</h3><p><b>${RESULT[v.debrief.result] || esc(v.debrief.result)}</b>. ${esc(v.debrief.summary || '')}</p><ul>${v.assets.map(a => `<li>${esc(a.engineName)}: ${a.hp}/${a.maxHp} HP</li>`).join('')}</ul>`;
  const btns = [];
  if (v.phase === 'planning') btns.push('<button class="btn pri" id="cStart">Iniciar guardia en el mapa</button>');
  if (v.phase === 'debrief') btns.push('<button class="btn pri" id="cNext">Continuar campaña</button>');
  if (v.phase !== 'active') btns.push('<button class="btn" id="cSave">Descargar partida</button><label class="btn" for="cLoad">Cargar partida</label><input id="cLoad" type="file" accept=".json,application/json" hidden><button class="btn danger" id="cQuit">Abandonar campaña</button>');
  openModal(`${head}<div class="bd">${note}${err}${body}<div class="row">${btns.join('')}</div></div>`, openCampaign);
  if ($('#cStart')) $('#cStart').onclick = () => act(startBattle);
  if ($('#cNext')) $('#cNext').onclick = () => act(() => { operation = continueOperations(operation, nextId('continue')); });
  if ($('#cSave')) $('#cSave').onclick = () => act(() => {
    const url = URL.createObjectURL(new Blob([saveOperations(operation)], { type: 'application/json' })), a = document.createElement('a');
    a.href = url; a.download = 'cielo-campana-odesa.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  if ($('#cQuit')) $('#cQuit').onclick = () => { if (window.confirm('¿Abandonar la campaña? Lo que no hayas descargado se pierde.')) { operation = null; message = ''; openCampaign(); } };
  bindLoad();
  bindPlanning(v);
}

function bindLoad() {
  const inp = /** @type {HTMLInputElement | null} */ ($('#cLoad')); if (!inp) return;
  inp.onchange = async () => {
    const f = inp.files?.[0]; if (!f) return; const txt = await f.text();
    act(() => {
      const r = loadOperations(txt, 'ua');
      if (r.phase === 'active') throw Error('Esta pantalla no restaura una guardia en curso: guardá en preparación o en el parte.');
      if (r.definition.id !== 'odessa-resource-campaign') throw Error('Esta pantalla admite la campaña de Odesa.');
      operation = r;
    });
  };
}

/** Preparación: pedir munición, cargarla, reparar y esperar trabajos (todo con plazos). */
function planning(v) {
  let h = '<h3>Preparar la guardia</h3><p class="hint">Pedí munición, esperá la entrega y cargá los medios. Pedir, recibir y cargar son pasos distintos y tardan; la ventana de preparación es limitada.</p><table class="ctab"><tr><th>Medio</th><th>Precio</th><th>Disp.</th><th>Depósito</th><th>Listos</th><th>Cantidad</th><th></th></tr>';
  for (const q of v.resources.quotes) {
    const id = q.id.replace(/-supply$/, ''), a = v.assets.find(x => x.id === id); if (!a) continue;
    h += `<tr><td>${esc(a.engineName)}</td><td>${q.price}</td><td>${q.remaining}</td><td>${stock('depot', q.ammunitionId)}</td><td>${stock(`${id}-ready`, q.ammunitionId)}</td><td><input class="inp" style="width:70px" type="number" min="1" step="1" value="4" id="cq-${esc(id)}"></td><td><button class="btn sm" data-order="${esc(id)}" ${q.remaining === 0 || a.hp === 0 ? 'disabled' : ''}>Pedir</button> <button class="btn sm" data-load="${esc(id)}" ${a.hp === 0 ? 'disabled' : ''}>Cargar</button></td></tr>`;
  }
  h += '</table><h3>Componentes</h3><ul>';
  for (const a of v.assets.filter(x => x.kind === 'unit')) for (const cid of a.componentIds) {
    const c = operation.resources.inventory.components.find(x => x.id === cid);
    h += `<li>${esc(a.engineName)} · ${esc(es(c.kind))}: ${esc(es(c.condition))}${['degraded', 'disabled'].includes(c.condition) ? ` <button class="btn sm" data-repair="${esc(a.id)}|${esc(cid)}">Reparar (50 créditos + 1 repuesto)</button>` : ''}</li>`;
  }
  h += '</ul><h3>Trabajos en curso</h3><ul>';
  const jobs = v.resources.jobs.filter(j => ['pending', 'interrupted'].includes(j.status));
  for (const j of jobs) h += `<li>${esc(es(j.kind))}: ${esc(es(j.status))} · termina a las ${hms(j.dueAtSeconds)} <button class="btn sm" data-cancel="${esc(j.id)}">Cancelar / devolver</button></li>`;
  h += `${jobs.length ? '' : '<li class="dim">Ninguno.</li>'}</ul><button class="btn" id="cWait" ${v.resources.jobs.some(j => j.status === 'pending' && j.dueAtSeconds <= v.preparationEndsAtSeconds) ? '' : 'disabled'}>Esperar al próximo trabajo</button>`;
  return h;
}
function bindPlanning(v) {
  if (v.phase !== 'planning') return;
  const qty = id => positiveInt(/** @type {HTMLInputElement} */ ($('#cq-' + id)).value);
  document.querySelectorAll('[data-order]').forEach(b => { /** @type {HTMLElement} */ (b).onclick = () => act(() => { const id = /** @type {HTMLElement} */ (b).dataset.order; command('order', { jobId: nextId('delivery'), quoteId: `${id}-supply`, quantity: qty(id) }); }); });
  document.querySelectorAll('[data-load]').forEach(b => { /** @type {HTMLElement} */ (b).onclick = () => act(() => { const id = /** @type {HTMLElement} */ (b).dataset.load; command('transfer', { jobId: nextId('load'), serviceId: `${id}-reload`, ammunitionId: `legacy-${id}`, quantity: qty(id) }); }); });
  document.querySelectorAll('[data-repair]').forEach(b => { /** @type {HTMLElement} */ (b).onclick = () => act(() => { const [aid, cid] = String(/** @type {HTMLElement} */ (b).dataset.repair).split('|'); command('repair', { jobId: nextId('repair'), serviceId: `${aid}-repair`, componentId: cid }); }); });
  document.querySelectorAll('[data-cancel]').forEach(b => { /** @type {HTMLElement} */ (b).onclick = () => act(() => command('cancel', { jobId: /** @type {HTMLElement} */ (b).dataset.cancel })); });
  if ($('#cWait')) $('#cWait').onclick = () => act(() => {
    const due = Math.min(...operationView(operation).resources.jobs.filter(j => j.status === 'pending').map(j => j.dueAtSeconds));
    if (!Number.isFinite(due)) throw Error('No hay trabajos pendientes.');
    command('advance', {}, due);
  });
}

/** Arranca la guardia en el mapa del juego, en vista del defensor (no se ve lo que la defensa no sabe). */
function startBattle() {
  const key = operationMission(operation).mapKey;
  if (MAP?.key !== key) applyMap(builtinMap(key));
  combat = startPortCombat(operation, operation.history.length + 1);   // carga el escenario y arranca el motor
  operation = combat.getOperation();
  if (MAP) applyMap(MAP);   // el puente vuelve a cargar el mapa: se repinta el relieve
  const view = /** @type {HTMLSelectElement} */ ($('#view')); view.value = 'def';
  S.sel = null; S.multi = []; S.running = true; S.auto = true;
  markLogDirty(); renderAll(); updatePlay(); closeModal();
}
