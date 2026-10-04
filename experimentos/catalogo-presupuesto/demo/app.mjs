import { createPlan, applyCommand, savePlan, loadPlan } from '../lib/budget.mjs';
import { CATALOG } from '../data/catalog.mjs';
import { buildPreparationBriefing } from '../lib/briefing.mjs';

const el = name => document.getElementById(name);
const plans = new Map();
const budgets = { blue: 100, red: 60 };
let sequence = 0;

function initial(sideId) {
  return createPlan({ sideId, budget: budgets[sideId], unit: 'credits', offers: [
    { id: 'example-kit', price: 20, unit: 'credits', quantityLimit: 3,
      costBasis: { kind: 'fictional', note: 'Ejemplo contable; no precio real', sourceIds: [] },
      bundle: [
        { itemId: 'example-equipment', kind: 'durable', quantity: 1 },
        { itemId: 'example-supply', kind: 'consumable', quantity: 4 }
      ] }
  ] });
}

const current = () => plans.get(el('side').value);
function message(text, error = false) {
  el('status').textContent = text;
  el('status').classList.toggle('error', error);
}

function run(action, success) {
  try { action(); render(); message(success); }
  catch (error) { message(error.message, true); }
}

function nextIdentifier(prefix) {
  let candidate;
  do { candidate = `${prefix}-${++sequence}`; }
  while (current().audit.some(entry => entry.commandId === candidate)
    || current().orders.some(order => order.id === candidate)
    || current().missions.some(mission => mission.id === candidate));
  return candidate;
}

function command(kind, fields = {}) {
  const state = current();
  plans.set(state.sideId, applyCommand(state, {
    commandId: nextIdentifier('demo'), sideId: state.sideId, kind, ...fields
  }));
}

function controlInteger(name) {
  const input = el(name);
  if (input.value === '' || !input.validity.valid || !Number.isSafeInteger(input.valueAsNumber)) {
    throw new Error('Ingresá un entero dentro del rango indicado');
  }
  return input.valueAsNumber;
}

function render() {
  const state = current();
  const planning = state.phase === 'planning', active = state.phase === 'active';
  el('balance').textContent = state.balance;
  el('phase').textContent = { planning: 'Preparación', active: 'Activa', completed: 'Finalizada' }[state.phase];
  el('available').textContent = state.offers[0].remaining;
  el('mission').textContent = state.missions.at(-1).id;
  el('elapsed').textContent = state.elapsedSeconds;
  el('next-mission').disabled = state.phase !== 'completed';
  el('briefing').disabled = !planning;
  el('briefing-output').textContent = ''; // Never leave a previous side/mission projection on screen.
  el('buy').disabled = !planning || state.balance < 20 || state.offers[0].remaining === 0;
  for (const name of ['load', 'unload', 'activate']) el(name).disabled = !planning;
  for (const name of ['consume', 'finish']) el(name).disabled = !active;
  el('orders').replaceChildren();
  for (const order of state.orders) {
    const line = document.createElement('p');
    line.textContent = `${order.id}: ${{ cancelled: 'cancelado', reserved: 'reservado', committed: 'comprometido' }[order.status]} · ${order.paid} créditos `;
    if (order.status === 'reserved') {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = 'Cancelar'; button.disabled = !planning;
      button.addEventListener('click', () => run(() => command('cancel', { orderId: order.id }), 'Reserva cancelada.'));
      line.append(button);
    }
    el('orders').append(line);
  }
  el('inventory').replaceChildren();
  for (const [itemId, stock] of Object.entries(state.inventory)) {
    const row = document.createElement('tr');
    for (const value of [itemId === 'example-equipment' ? 'Equipo durable' : 'Consumible', stock.reserve, stock.ready, stock.consumed]) {
      const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
    }
    el('inventory').append(row);
  }
}

for (const sideId of Object.keys(budgets)) plans.set(sideId, initial(sideId));
el('buy').addEventListener('click', () => run(() => command('buy', {
  orderId: nextIdentifier('order'), offerId: 'example-kit', quantity: 1
}), 'Paquete reservado; costo cobrado una sola vez.'));
for (const kind of ['load', 'unload', 'consume']) el(kind).addEventListener('click', () => run(() => command(kind, {
  itemId: 'example-supply', quantity: controlInteger('quantity')
}), 'Existencias actualizadas.'));
for (const kind of ['activate', 'finish']) el(kind).addEventListener('click', () => run(() => command(kind), 'Estado actualizado.'));
el('next-mission').addEventListener('click', () => run(() => command('begin-mission', {
  missionId: nextIdentifier('mission'), elapsedSeconds: controlInteger('elapsed-input')
}), 'Otra preparación con los recursos remanentes; no se rellenó el libro.'));
el('role').addEventListener('change', () => { el('briefing-output').textContent = ''; });
el('briefing').addEventListener('click', () => {
  try {
    const state = current();
    const briefing = buildPreparationBriefing(state, { sideId: state.sideId, missionId: state.missions.at(-1).id,
      role: el('role').value, title: 'Briefing ficticio de preparación', issuedAtSeconds: 0,
      objectives: [{ id: 'example-task', text: 'Preparar recursos de este ejercicio contable', deadlineSeconds: null }],
      intelligence: [{ id: 'example-report', text: 'Informe ficticio: el plan enemigo no está incluido',
        confidence: 'unconfirmed', sourceLabel: 'Autor de la demo', observedAtSeconds: -600, receivedAtSeconds: -120 }] });
    el('briefing-output').textContent = JSON.stringify(briefing, null, 2);
    message('Proyección propia de preparación; no es una vista de combate.');
  } catch (error) { message(error.message, true); }
});
el('side').addEventListener('change', () => { render(); el('saved-plan').value = ''; message('Libro propio seleccionado.'); });
el('reset').addEventListener('click', () => { plans.set(el('side').value, initial(el('side').value)); render(); message('Libro reiniciado con los datos ficticios iniciales.'); });
el('save').addEventListener('click', () => run(() => { el('saved-plan').value = savePlan(current()); }, 'Guardado generado.'));
el('restore').addEventListener('click', () => run(() => {
  const restored = loadPlan(el('saved-plan').value);
  if (restored.sideId !== el('side').value) throw new Error('El guardado pertenece al otro bando');
  plans.set(restored.sideId, restored);
}, 'Libro restaurado.'));
for (const weapon of CATALOG.weapons) {
  const li = document.createElement('li'); li.textContent = `${weapon.name} — ${weapon.identity.status}. ${weapon.note}`;
  el('variants').append(li);
}
render();

// Read-only inspection of this generic prototype, not access to simulator truth.
window.__budgetDemo = Object.freeze({ getState: current });
