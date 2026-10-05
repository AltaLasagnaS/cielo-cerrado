import { deepFreeze, id, integer, safeProduct, safeSum } from './common.mjs';
import { createInventory, applyInventoryEvent } from './components.mjs';

// Campaign resource authority: ONE physical ammunition inventory. Quotes,
// durations and repair requirements are supplied evidence/assumptions, not
// inferred military capabilities. Combat outcomes and the clock come from
// the caller; this module never calculates damage, movement or intelligence.
const states = new WeakSet();
const keys = {
  order: ['jobId', 'quoteId', 'quantity'],
  transfer: ['jobId', 'serviceId', 'ammunitionId', 'quantity'],
  repair: ['jobId', 'serviceId', 'componentId'],
  cancel: ['jobId'],
  outcome: ['outcome'], advance: [], activate: [], finish: [],
  'begin-mission': ['missionId']
};
const MAX = 10000;

function exact(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.keys(value).some(key => !allowed.includes(key))) throw Error(`${label}: campos inválidos`);
}
function list(value, label, limit = 200) {
  if (!Array.isArray(value) || value.length > limit) throw Error(`${label}: lista inválida`);
  return value;
}
function unique(rows, label) {
  if (new Set(rows.map(row => row.id)).size !== rows.length) throw Error(`${label}: duplicado`);
}
function keep(state) { deepFreeze(state); states.add(state); return state; }
function basis(raw, unit, label) {
  exact(raw, ['kind', 'note', 'sourceIds'], label);
  const sourceIds = list(raw.sourceIds, 'fuentes').map(value => id(value, 'sourceId'));
  if (!['fictional', 'documented'].includes(raw.kind) || typeof raw.note !== 'string'
      || !raw.note.trim() || raw.note.length > 2000) throw Error('Costo/tiempo requiere alcance y evidencia');
  if ((unit !== 'credits' || raw.kind === 'documented') && (raw.kind !== 'documented' || !sourceIds.length)) {
    throw Error('Moneda o dato documentado requieren fuentes');
  }
  return { kind: raw.kind, note: raw.note, sourceIds };
}
function normalize(raw) {
  exact(raw, ['inventory', 'budget', 'unit', 'missionId', 'quotes', 'services', 'spares'], 'Campaña');
  const inventory = createInventory(raw.inventory).initial;
  const unit = raw.unit;
  if (unit !== 'credits' && !(typeof unit === 'string' && /^[A-Z]{3}-[0-9]{4}-minor$/.test(unit))) throw Error('Unidad monetaria inválida');
  const depot = value => inventory.locations.find(row => row.id === value)?.kind === 'depot';
  const quotes = list(raw.quotes, 'cotizaciones').map(row => {
    exact(row, ['id', 'ammunitionId', 'toId', 'price', 'quantityLimit', 'leadSeconds', 'cancellable', 'basis'], 'Cotización');
    const ammunitionId = id(row.ammunitionId, 'ammunitionId'), toId = id(row.toId, 'toId');
    if (!inventory.ammunitionIds.includes(ammunitionId) || !depot(toId)) throw Error('Entrega sin depósito o munición conocidos');
    if (typeof row.cancellable !== 'boolean') throw Error('Cotización requiere condición de cancelación explícita');
    return { id: id(row.id), ammunitionId, toId, cancellable: row.cancellable, price: integer(row.price, 'precio'),
      quantityLimit: integer(row.quantityLimit, 'disponibilidad'), leadSeconds: integer(row.leadSeconds, 'plazo', 1),
      basis: basis(row.basis, unit, 'Evidencia de entrega') };
  });
  unique(quotes, 'cotizaciones');
  const spares = list(raw.spares, 'repuestos').map(row => {
    exact(row, ['id', 'quantity'], 'Repuesto');
    return { id: id(row.id), quantity: integer(row.quantity, 'repuestos') };
  });
  unique(spares, 'repuestos');
  const services = list(raw.services, 'servicios').map(row => {
    const common = ['id', 'kind', 'fee', 'durationSeconds', 'basis'];
    const extra = row.kind === 'transfer' ? ['fromId', 'toId', 'transitId', 'recoveryId', 'ammunitionIds']
      : ['componentIds', 'spareId', 'spareQuantity'];
    exact(row, [...common, ...extra], 'Servicio');
    const service = { id: id(row.id), kind: row.kind, fee: integer(row.fee, 'costo de servicio'),
      durationSeconds: integer(row.durationSeconds, 'duración', 1), basis: basis(row.basis, unit, 'Evidencia de servicio') };
    if (row.kind === 'transfer') {
      for (const key of ['fromId', 'toId', 'transitId', 'recoveryId']) service[key] = id(row[key], key);
      if (!depot(service.transitId) || !depot(service.recoveryId)
          || !inventory.locations.some(location => location.id === service.fromId)
          || !inventory.locations.some(location => location.id === service.toId)
          || new Set([service.fromId, service.toId, service.transitId]).size !== 3) throw Error('Ruta logística inválida');
      service.ammunitionIds = list(row.ammunitionIds, 'municiones del servicio').map(value => id(value));
      if (!service.ammunitionIds.length || service.ammunitionIds.some(value => !inventory.ammunitionIds.includes(value))) throw Error('Munición del servicio desconocida');
      if (inventory.stock.some(stock => stock.locationId === service.transitId && stock.quantity > 0)) throw Error('Tránsito debe empezar vacío');
    } else if (row.kind === 'repair') {
      service.componentIds = list(row.componentIds, 'componentes reparables').map(value => id(value));
      service.spareId = id(row.spareId); service.spareQuantity = integer(row.spareQuantity, 'repuestos requeridos', 1);
      if (!service.componentIds.length || service.componentIds.some(value => !inventory.components.some(component => component.id === value))
          || !spares.some(spare => spare.id === service.spareId)) throw Error('Reparación sin componente o repuesto conocido');
    } else throw Error('Servicio desconocido');
    return service;
  });
  unique(services, 'servicios');
  const transitIds = services.filter(row => row.kind === 'transfer').map(row => row.transitId);
  if (quotes.some(row => transitIds.includes(row.toId)) || new Set(transitIds).size !== transitIds.length || services.some(row => row.kind === 'transfer'
      && [row.fromId, row.toId, row.recoveryId].some(value => transitIds.includes(value)))) throw Error('Tránsito reservado para una sola ruta');
  const initial = { inventory, budget: integer(raw.budget, 'presupuesto'), unit,
    missionId: id(raw.missionId), quotes, services, spares };
  if (JSON.stringify(initial).length > 1024 * 1024) throw Error('Configuración demasiado grande');
  return initial;
}
export function createCampaign(raw) {
  const initial = normalize(raw);
  return keep({ version: 1, initial, sideId: initial.inventory.sideId, unit: initial.unit,
    balance: initial.budget, clockSeconds: 0, phase: 'planning',
    inventory: createInventory(initial.inventory), spares: structuredClone(initial.spares),
    quotes: initial.quotes.map(row => ({ id: row.id, remaining: row.quantityLimit })),
    jobs: [], missions: [{ id: initial.missionId, status: 'planning', startedAtSeconds: null, endedAtSeconds: null }], commands: [] });
}
function stock(state, locationId, ammunitionId) {
  return state.inventory.stock.find(row => row.locationId === locationId && row.ammunitionId === ammunitionId)?.quantity ?? 0;
}
function condition(state, componentId) { return state.inventory.components.find(row => row.id === componentId)?.condition; }
function record(state, atSeconds, kind, properties) {
  state.inventory = applyInventoryEvent(state.inventory, { eventId: `ledger-event-${state.inventory.events.length}`,
    sideId: state.sideId, atSeconds, kind, ...properties });
}
function pay(state, amount) {
  if (amount > state.balance) throw Error('Presupuesto insuficiente');
  state.balance -= amount;
}
function newJob(state, command) {
  if (state.jobs.some(job => job.id === command.jobId)) throw Error('jobId ya utilizado');
  if (state.jobs.length >= MAX) throw Error('Demasiados trabajos');
}
function eventRoom(state, extra) {
  const reserved = state.jobs.filter(job => job.status === 'pending').length;
  if (state.inventory.events.length + reserved + extra > MAX) throw Error('Límite de eventos de inventario alcanzado');
}
function serviceFor(state, command, kind) {
  const service = state.initial.services.find(row => row.id === command.serviceId && row.kind === kind);
  if (!service) throw Error('Servicio inexistente');
  if (state.jobs.some(job => job.serviceId === service.id && ['pending', 'interrupted'].includes(job.status))) throw Error('Servicio ocupado');
  return service;
}
function complete(state, job) {
  if (job.kind === 'delivery') {
    record(state, job.dueAtSeconds, 'receipt', { toId: job.toId, ammunitionId: job.ammunitionId, quantity: job.quantity });
    job.status = 'completed';
  } else if (job.kind === 'repair') {
    if (condition(state, job.componentId) === 'destroyed') job.status = 'failed';
    else {
      record(state, job.dueAtSeconds, 'condition', { componentId: job.componentId, condition: 'operational' });
      job.status = 'completed';
    }
  } else {
    const available = stock(state, job.transitId, job.ammunitionId);
    const destination = state.inventory.initial.locations.find(row => row.id === job.toId);
    const destinationReady = destination.kind === 'depot' || condition(state, destination.componentId) === 'operational';
    if (available < job.quantity || !destinationReady) {
      job.status = available === 0 ? 'lost' : 'interrupted'; return;
    }
    try {
      record(state, job.dueAtSeconds, 'transfer', { fromId: job.transitId, toId: job.toId,
        ammunitionId: job.ammunitionId, quantity: job.quantity });
      job.status = job.returning ? 'returned' : 'completed';
    } catch (error) {
      // A changed load may no longer fit. Keep the cargo in transit rather
      // than dropping it, creating ammunition or stopping the clock.
      if (error.code !== 'LOAD_NOT_ADMITTED') throw error;
      job.status = 'interrupted';
    }
  }
}
function normalizeCommand(raw) {
  if (!Object.hasOwn(keys, raw?.kind)) throw Error('Comando desconocido');
  exact(raw, ['commandId', 'sideId', 'atSeconds', 'kind', ...keys[raw.kind]], 'Comando');
  const command = { commandId: id(raw.commandId), sideId: id(raw.sideId), atSeconds: integer(raw.atSeconds, 'tiempo'), kind: raw.kind };
  for (const key of keys[raw.kind]) command[key] = key === 'quantity' ? integer(raw[key], 'cantidad', 1)
    : key === 'outcome' ? structuredClone(raw[key]) : id(raw[key], key);
  if (command.kind === 'outcome') {
    const fields = command.outcome?.kind === 'condition' ? ['componentId', 'condition'] : ['fromId', 'ammunitionId', 'quantity'];
    if (!['condition', 'expend', 'loss'].includes(command.outcome?.kind)) throw Error('Resultado de combate inválido');
    exact(command.outcome, ['kind', ...fields], 'Resultado');
    command.outcome = { kind: command.outcome.kind, ...Object.fromEntries(fields.map(key => [key, command.outcome[key]])) };
    // Damage may disable/destroy. Recovery must go through a paid timed job.
    if (command.outcome.kind === 'condition' && !['disabled', 'destroyed'].includes(command.outcome.condition)) throw Error('Recuperación requiere reparación');
  }
  return command;
}
export function applyCampaignCommand(state, raw) {
  if (!states.has(state)) throw Error('Campaña ajena; usar loadCampaign');
  const command = normalizeCommand(raw);
  if (command.sideId !== state.sideId) throw Error('Comando de otro bando');
  const prior = state.commands.find(row => row.commandId === command.commandId);
  if (prior) {
    if (JSON.stringify(prior) !== JSON.stringify(command)) throw Error('commandId reutilizado');
    return state;
  }
  if (state.commands.length >= MAX) throw Error('Demasiados comandos');
  if (command.kind === 'advance' ? command.atSeconds < state.clockSeconds : command.atSeconds !== state.clockSeconds) throw Error('Tiempo fuera del reloj autorizado');
  const { inventory, ...rest } = state;
  const next = { ...structuredClone(rest), inventory };
  switch (command.kind) {
    case 'order': {
      newJob(next, command);
      eventRoom(next, 1);
      const quote = next.initial.quotes.find(row => row.id === command.quoteId);
      const availability = next.quotes.find(row => row.id === command.quoteId);
      if (!quote || command.quantity > availability.remaining) throw Error('Cotización inexistente o disponibilidad insuficiente');
      let lifetime = next.initial.inventory.stock.filter(row => row.ammunitionId === quote.ammunitionId)
        .reduce((total, row) => safeSum(total, row.quantity), 0);
      lifetime = safeSum(lifetime, next.inventory.totals.find(row => row.ammunitionId === quote.ammunitionId).acquired);
      for (const job of next.jobs.filter(row => row.kind === 'delivery' && row.status === 'pending' && row.ammunitionId === quote.ammunitionId)) {
        lifetime = safeSum(lifetime, job.quantity);
      }
      safeSum(lifetime, command.quantity); // Reject an impossible future receipt before payment.
      const dueAtSeconds = safeSum(next.clockSeconds, quote.leadSeconds);
      const paid = safeProduct(quote.price, command.quantity);
      pay(next, paid); availability.remaining -= command.quantity;
      next.jobs.push({ id: command.jobId, kind: 'delivery', quoteId: quote.id, toId: quote.toId,
        ammunitionId: quote.ammunitionId, quantity: command.quantity, paid, dueAtSeconds, status: 'pending' });
      break;
    }
    case 'transfer': {
      newJob(next, command); const service = serviceFor(next, command, 'transfer');
      eventRoom(next, 2);
      if (!service.ammunitionIds.includes(command.ammunitionId)) throw Error('Munición no admitida por el servicio');
      const dueAtSeconds = safeSum(next.clockSeconds, service.durationSeconds);
      pay(next, service.fee);
      record(next, next.clockSeconds, 'transfer', { fromId: service.fromId, toId: service.transitId,
        ammunitionId: command.ammunitionId, quantity: command.quantity });
      next.jobs.push({ id: command.jobId, kind: 'transfer', serviceId: service.id, fromId: service.fromId,
        toId: service.toId, transitId: service.transitId, recoveryId: service.recoveryId,
        ammunitionId: command.ammunitionId, quantity: command.quantity, paid: service.fee, dueAtSeconds, status: 'pending' });
      break;
    }
    case 'repair': {
      newJob(next, command); const service = serviceFor(next, command, 'repair');
      eventRoom(next, 1);
      if (!service.componentIds.includes(command.componentId) || condition(next, command.componentId) !== 'disabled') throw Error('Componente no reparable');
      if (next.jobs.some(job => job.kind === 'repair' && job.componentId === command.componentId && job.status === 'pending')) throw Error('Componente ya en reparación');
      const spare = next.spares.find(row => row.id === service.spareId);
      if (spare.quantity < service.spareQuantity) throw Error('Repuestos insuficientes');
      const dueAtSeconds = safeSum(next.clockSeconds, service.durationSeconds);
      pay(next, service.fee); spare.quantity -= service.spareQuantity;
      next.jobs.push({ id: command.jobId, kind: 'repair', serviceId: service.id, componentId: command.componentId,
        paid: service.fee, dueAtSeconds, status: 'pending' });
      break;
    }
    case 'cancel': {
      const job = next.jobs.find(row => row.id === command.jobId);
      if (!job || !['pending', 'interrupted'].includes(job.status)) throw Error('Trabajo no cancelable');
      if (job.kind === 'delivery') {
        if (!next.initial.quotes.find(row => row.id === job.quoteId).cancellable) throw Error('Pedido no admite cancelación');
        next.balance = safeSum(next.balance, job.paid);
        next.quotes.find(row => row.id === job.quoteId).remaining += job.quantity;
      } else if (job.kind === 'transfer') {
        if (job.returning) throw Error('Retorno ya está en curso');
        const remaining = stock(next, job.transitId, job.ammunitionId);
        if (remaining) {
          if (job.status === 'interrupted') eventRoom(next, 1);
          const service = next.initial.services.find(row => row.id === job.serviceId);
          const dueAtSeconds = safeSum(next.clockSeconds, service.durationSeconds);
          pay(next, service.fee);
          job.returning = true; job.toId = job.recoveryId; job.quantity = remaining;
          job.paid = safeSum(job.paid, service.fee); job.dueAtSeconds = dueAtSeconds; job.status = 'pending';
          break;
        }
      }
      // Started service costs/spares are sunk; undelivered orders refund.
      job.status = 'cancelled'; break;
    }
    case 'outcome': {
      eventRoom(next, 1);
      const { kind, ...properties } = command.outcome;
      if (kind === 'expend' && next.phase !== 'active') throw Error('Disparo requiere misión activa');
      record(next, next.clockSeconds, kind, properties); break;
    }
    case 'advance': {
      const due = next.jobs.filter(job => job.status === 'pending' && job.dueAtSeconds <= command.atSeconds)
        .sort((a, b) => a.dueAtSeconds - b.dueAtSeconds); // Stable insertion order for simultaneous completions.
      for (const job of due) complete(next, job);
      next.clockSeconds = command.atSeconds; break;
    }
    case 'activate': {
      if (next.phase !== 'planning') throw Error('Misión no está en preparación');
      next.phase = 'active'; const mission = next.missions.at(-1);
      mission.status = 'active'; mission.startedAtSeconds = next.clockSeconds; break;
    }
    case 'finish': {
      if (next.phase !== 'active') throw Error('Misión no está activa');
      next.phase = 'completed'; const mission = next.missions.at(-1);
      mission.status = 'completed'; mission.endedAtSeconds = next.clockSeconds; break;
    }
    case 'begin-mission': {
      if (next.phase !== 'completed') throw Error('Debe terminar la misión anterior');
      if (next.missions.length >= 100 || next.missions.some(row => row.id === command.missionId)) throw Error('Identidad o límite de misiones inválido');
      next.phase = 'planning'; next.missions.push({ id: command.missionId, status: 'planning', startedAtSeconds: null, endedAtSeconds: null }); break;
    }
  }
  next.commands.push(command); return keep(next);
}
export function saveCampaign(state) {
  if (!states.has(state)) throw Error('Campaña ajena');
  const text = JSON.stringify({ format: 'cielo-cerrado/logistics-campaign', version: 1, initial: state.initial, commands: state.commands });
  if (text.length > 8 * 1024 * 1024) throw Error('Guardado demasiado grande');
  return text;
}
export function loadCampaign(text) {
  if (typeof text !== 'string' || text.length > 8 * 1024 * 1024) throw Error('Archivo de campaña inválido');
  const raw = JSON.parse(text); exact(raw, ['format', 'version', 'initial', 'commands'], 'Guardado');
  if (raw.format !== 'cielo-cerrado/logistics-campaign' || raw.version !== 1) throw Error('Formato de campaña desconocido');
  let state = createCampaign(raw.initial);
  for (const command of list(raw.commands, 'comandos', MAX)) state = applyCampaignCommand(state, command);
  return state;
}
