import { createCampaign, applyCampaignCommand, saveCampaign, loadCampaign } from '../lib/logistics.mjs';
import { demoCampaign } from '../data/demo-campaign.mjs';
import { buildCampaignBriefing } from '../lib/campaign-briefing.mjs';

const $ = id => document.getElementById(id);
const labels = { planning: 'Preparación', active: 'En curso', completed: 'Finalizada',
  operational: 'Operativo', disabled: 'Averiado', destroyed: 'Destruido', pending: 'En curso',
  degraded: 'Degradado',
  interrupted: 'Interrumpido', lost: 'Perdido', returned: 'Devuelto', failed: 'Falló', cancelled: 'Cancelado' };
let state = createCampaign(demoCampaign());
let serial = 0;
let briefingForState = null;
function nextId(prefix) {
  let value;
  do { value = `${prefix}-${++serial}`; }
  while (state.commands.some(row => row.commandId === value) || state.jobs.some(row => row.id === value));
  return value;
}
function integerInput(elementId) {
  const raw = $(elementId).value.trim(), value = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < 1) throw Error('Ingresá un entero positivo, sin decimales');
  return value;
}
function run(action) {
  try { action(); $('status').textContent = 'Actualizado.'; $('status').className = ''; }
  catch (error) { $('status').textContent = error.message; $('status').className = 'error'; }
  render();
}
function command(kind, properties = {}) {
  state = applyCampaignCommand(state, { commandId: nextId('ui'), sideId: state.sideId,
    atSeconds: state.clockSeconds, kind, ...properties });
}
function outcome(kind, properties) { command('outcome', { outcome: { kind, ...properties } }); }
function quantity(locationId, ammunitionId) {
  return state.inventory.stock.find(row => row.locationId === locationId && row.ammunitionId === ammunitionId)?.quantity ?? 0;
}
function row(values) {
  const tr = document.createElement('tr');
  for (const value of values) { const td = document.createElement('td'); td.textContent = String(value); tr.append(td); }
  return tr;
}
function render() {
  if (state.phase !== 'planning' || briefingForState !== state) $('briefing-output').textContent = '';
  $('briefing').disabled = state.phase !== 'planning';
  for (const [elementId, value] of Object.entries({ balance: state.balance, clock: state.clockSeconds,
    mission: state.missions.at(-1).id, phase: labels[state.phase], spares: state.spares[0].quantity })) $(elementId).textContent = String(value);
  $('stock').replaceChildren(...[['depot', 'Depósito'], ['cargo', 'En tránsito'], ['launcher-stock', 'Lanzador']]
    .map(([locationId, label]) => row([label, quantity(locationId, 'alpha'), quantity(locationId, 'beta')])));
  $('totals').textContent = state.inventory.totals.map(total => `${total.ammunitionId}: ${total.acquired} / ${total.expended} / ${total.lost}`).join(' · ');
  $('components').replaceChildren(...state.inventory.components.map(component => {
    const li = document.createElement('li'); li.textContent = `${component.id}: ${labels[component.condition]}`; return li;
  }));
  $('jobs').replaceChildren(...state.jobs.map(job => {
    const tr = row([job.id, job.kind, job.dueAtSeconds, labels[job.status] ?? job.status]);
    const td = document.createElement('td');
    if (['pending', 'interrupted'].includes(job.status) && !job.returning
        && (job.kind !== 'delivery' || state.initial.quotes.find(quote => quote.id === job.quoteId).cancellable)) {
      const button = document.createElement('button'); button.textContent = job.kind === 'transfer' ? 'Ordenar retorno' : 'Cancelar';
      button.dataset.jobId = job.id; button.addEventListener('click', () => run(() => command('cancel', { jobId: job.id })));
      td.append(button);
    }
    tr.append(td); return tr;
  }));
  $('activate').disabled = state.phase !== 'planning'; $('finish').disabled = state.phase !== 'active';
  $('next').disabled = state.phase !== 'completed'; $('fire').disabled = state.phase !== 'active';
}
$('order').addEventListener('click', () => run(() => command('order', { jobId: nextId('order'),
  quoteId: `${$('ammunition').value}-supply`, quantity: integerInput('quantity') })));
$('reload').addEventListener('click', () => run(() => command('transfer', { jobId: nextId('load'), serviceId: 'reload',
  ammunitionId: $('ammunition').value, quantity: integerInput('quantity') })));
$('disable').addEventListener('click', () => run(() => outcome('condition', { componentId: $('component').value, condition: 'disabled' })));
$('destroy').addEventListener('click', () => run(() => outcome('condition', { componentId: $('component').value, condition: 'destroyed' })));
$('repair').addEventListener('click', () => run(() => command('repair', { jobId: nextId('repair'), serviceId: 'workshop', componentId: $('component').value })));
$('cargo-loss').addEventListener('click', () => run(() => outcome('loss', { fromId: 'cargo', ammunitionId: $('ammunition').value, quantity: integerInput('quantity') })));
$('fire').addEventListener('click', () => run(() => outcome('expend', { fromId: 'launcher-stock', ammunitionId: $('ammunition').value, quantity: integerInput('quantity') })));
$('advance').addEventListener('click', () => run(() => command('advance', { atSeconds: state.clockSeconds + integerInput('seconds') })));
$('activate').addEventListener('click', () => run(() => command('activate')));
$('finish').addEventListener('click', () => run(() => command('finish')));
$('next').addEventListener('click', () => run(() => command('begin-mission', { missionId: nextId('mission') })));
$('save').addEventListener('click', () => run(() => { $('saved').value = saveCampaign(state); }));
$('briefing').addEventListener('click', () => run(() => {
  const briefing = buildCampaignBriefing(state, { sideId: state.sideId, missionId: state.missions.at(-1).id,
    role: 'defence', title: 'Puerto · ejercicio ficticio', issuedAtSeconds: state.clockSeconds,
    objectives: [{ id: 'port', text: 'Mantener operativa la instalación durante esta misión.', deadlineSeconds: null }],
    intelligence: [{ id: 'warning', text: 'Posible ataque. Composición, horario y ejes de llegada desconocidos.',
      confidence: 'unconfirmed', sourceLabel: 'Informe ficticio', observedAtSeconds: -600, receivedAtSeconds: -120 }] });
  briefingForState = state;
  $('briefing-output').textContent = JSON.stringify(briefing, null, 2);
}));
$('restore').addEventListener('click', () => run(() => {
  const restored = loadCampaign($('saved').value);
  if (restored.sideId !== state.sideId) throw Error('Guardado de otro bando');
  state = restored;
}));
$('reset').addEventListener('click', () => run(() => { state = createCampaign(demoCampaign()); $('saved').value = ''; }));
window.__logisticsDemo = Object.freeze({ getState: () => state });
render();
