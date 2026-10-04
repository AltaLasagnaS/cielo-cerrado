import { deepFreeze, id, integer, safeProduct, safeSum } from './common.mjs';

// Isolated allocation ledger, not a logistics engine or real-price database.
// No RNG, DOM, imports from the active simulator, purchases during combat,
// or instant replenishment. Every command returns an immutable new state.
const knownStates = new WeakSet();
const MAX_COMMANDS = 10000;
const MAX_MISSIONS = 100;
const KEYS = {
  buy: ['orderId', 'offerId', 'quantity'],
  cancel: ['orderId'],
  load: ['itemId', 'quantity'],
  unload: ['itemId', 'quantity'],
  activate: [],
  consume: ['itemId', 'quantity'],
  finish: [],
  'begin-mission': ['missionId', 'elapsedSeconds']
};

function keep(state) {
  deepFreeze(state);
  knownStates.add(state);
  return state;
}

function trusted(state) {
  if (!state || !knownStates.has(state)) throw new Error('Estado ajeno; cargar mediante loadPlan');
}

function normalizeInitial(input) {
  if (!input || typeof input !== 'object') throw new Error('Plan inicial requerido');
  const sideId = id(input.sideId, 'sideId');
  const budget = integer(input.budget, 'budget');
  const unit = input.unit;
  if (unit !== 'credits' && !(typeof unit === 'string' && /^[A-Z]{3}-[0-9]{4}-minor$/.test(unit))) {
    throw new Error('Unidad: credits o moneda-año-minor (sin conversiones implícitas)');
  }
  if (!Array.isArray(input.offers) || input.offers.length > 200) throw new Error('Lista de ofertas inválida');
  const ids = new Set();
  const itemKinds = new Map();
  const offers = input.offers.map(offer => {
    if (!offer || typeof offer !== 'object') throw new Error('Oferta inválida');
    const offerId = id(offer.id, 'offerId');
    if (ids.has(offerId)) throw new Error('Oferta duplicada');
    ids.add(offerId);
    if (offer.unit !== unit) throw new Error('No se pueden mezclar unidades monetarias');
    const basis = offer.costBasis;
    if (!basis || !['fictional', 'documented'].includes(basis.kind) || typeof basis.note !== 'string' || !basis.note.trim()) {
      throw new Error('Cada precio necesita tipo y alcance de costo');
    }
    if (!Array.isArray(basis.sourceIds) || basis.sourceIds.some(sourceId => typeof sourceId !== 'string' || !sourceId)) {
      throw new Error('Fuentes de costo inválidas');
    }
    if (unit !== 'credits' && (basis.kind !== 'documented' || !basis.sourceIds.length)) {
      throw new Error('Precios en moneda requieren fuentes, no estimaciones ficticias');
    }
    if (!Array.isArray(offer.bundle) || !offer.bundle.length || offer.bundle.length > 100) throw new Error('Paquete vacío o inválido');
    const itemIds = new Set();
    const bundle = offer.bundle.map(item => {
      if (!item || typeof item !== 'object') throw new Error('Elemento de paquete inválido');
      const itemId = id(item.itemId, 'itemId');
      if (itemIds.has(itemId)) throw new Error('Elemento duplicado en paquete');
      itemIds.add(itemId);
      if (!['durable', 'consumable'].includes(item.kind)) throw new Error('Tipo de recurso inválido');
      if (itemKinds.has(itemId) && itemKinds.get(itemId) !== item.kind) throw new Error('Tipo de recurso contradictorio');
      itemKinds.set(itemId, item.kind);
      return { itemId, kind: item.kind, quantity: integer(item.quantity, 'cantidad incluida', 1) };
    });
    return { id: offerId, unit, price: integer(offer.price, 'precio'),
      quantityLimit: integer(offer.quantityLimit, 'disponibilidad'), bundle,
      costBasis: { kind: basis.kind, note: basis.note, sourceIds: [...basis.sourceIds] } };
  });
  return { sideId, budget, unit, offers, missionId: id(input.missionId ?? 'mission-initial', 'missionId') };
}

export function createPlan(input) {
  const initial = normalizeInitial(input);
  return keep({
    version: 1, initial, sideId: initial.sideId, unit: initial.unit,
    balance: initial.budget, phase: 'planning',
    offers: initial.offers.map(offer => ({ ...structuredClone(offer), remaining: offer.quantityLimit })),
    orders: [], inventory: Object.create(null), audit: [],
    elapsedSeconds: 0,
    missions: [{ id: initial.missionId, elapsedBeforeSeconds: 0, status: 'planning' }]
  });
}

function normalizeCommand(raw) {
  if (!raw || typeof raw !== 'object' || !Object.hasOwn(KEYS, raw.kind)) throw new Error('Comando inválido');
  const fields = ['commandId', 'sideId', 'kind', ...KEYS[raw.kind]];
  if (Object.keys(raw).some(key => !fields.includes(key))) throw new Error('Campo de comando no admitido');
  const command = { commandId: id(raw.commandId, 'commandId'), sideId: id(raw.sideId, 'sideId'), kind: raw.kind };
  for (const key of KEYS[raw.kind]) command[key] = key === 'quantity'
    ? integer(raw[key], key, 1)
    : key === 'elapsedSeconds' ? integer(raw[key], key) : id(raw[key], key);
  return command;
}

function stock(state, itemId) {
  if (!state.initial.offers.some(offer => offer.bundle.some(item => item.itemId === itemId))) throw new Error('Recurso inexistente');
  if (!Object.hasOwn(state.inventory, itemId)) state.inventory[itemId] = { reserve: 0, ready: 0, consumed: 0 };
  return state.inventory[itemId];
}

function requirePlanning(state) {
  if (state.phase !== 'planning') throw new Error('La preparación está cerrada');
}

export function applyCommand(state, raw) {
  trusted(state);
  const command = normalizeCommand(raw);
  if (command.sideId !== state.sideId) throw new Error('Comando de otro bando');
  const previous = state.audit.find(entry => entry.commandId === command.commandId);
  if (previous) {
    if (JSON.stringify(previous) !== JSON.stringify(command)) throw new Error('commandId reutilizado con otro contenido');
    return state; // Retry is idempotent even after a phase change.
  }
  if (state.audit.length >= MAX_COMMANDS) throw new Error('Límite de comandos alcanzado');
  const next = structuredClone(state);
  switch (command.kind) {
    case 'buy': {
      requirePlanning(next);
      if (next.orders.some(order => order.id === command.orderId)) throw new Error('orderId ya utilizado');
      const offer = next.offers.find(row => row.id === command.offerId);
      if (!offer) throw new Error('Oferta inexistente');
      if (command.quantity > offer.remaining) throw new Error('Disponibilidad insuficiente');
      const paid = safeProduct(offer.price, command.quantity);
      if (paid > next.balance) throw new Error('Presupuesto insuficiente');
      for (const item of offer.bundle) {
        const entry = stock(next, item.itemId);
        entry.reserve = safeSum(entry.reserve, safeProduct(item.quantity, command.quantity));
      }
      offer.remaining -= command.quantity;
      next.balance -= paid;
      next.orders.push({ id: command.orderId, offerId: offer.id, quantity: command.quantity, paid, status: 'reserved' });
      break;
    }
    case 'cancel': {
      requirePlanning(next);
      const order = next.orders.find(row => row.id === command.orderId);
      if (!order || order.status !== 'reserved') throw new Error('Reserva inexistente o ya cancelada');
      const offer = next.offers.find(row => row.id === order.offerId);
      for (const item of offer.bundle) {
        const quantity = safeProduct(item.quantity, order.quantity);
        const entry = stock(next, item.itemId);
        if (entry.reserve < quantity) throw new Error('Descargar primero los elementos listos para cancelar');
        entry.reserve -= quantity;
      }
      next.balance = safeSum(next.balance, order.paid);
      offer.remaining = safeSum(offer.remaining, order.quantity);
      order.status = 'cancelled';
      break;
    }
    case 'load':
    case 'unload': {
      requirePlanning(next);
      const entry = stock(next, command.itemId);
      const source = command.kind === 'load' ? 'reserve' : 'ready';
      const target = command.kind === 'load' ? 'ready' : 'reserve';
      if (entry[source] < command.quantity) throw new Error('Existencias insuficientes');
      entry[source] -= command.quantity;
      entry[target] = safeSum(entry[target], command.quantity);
      break;
    }
    case 'activate':
      requirePlanning(next);
      // Acquisition committed to an earlier mission cannot be refunded later.
      for (const order of next.orders) if (order.status === 'reserved') order.status = 'committed';
      next.phase = 'active';
      next.missions.at(-1).status = 'active';
      break;
    case 'consume': {
      if (next.phase !== 'active') throw new Error('Consumo requiere misión activa');
      const item = next.initial.offers.flatMap(offer => offer.bundle).find(row => row.itemId === command.itemId);
      if (!item || item.kind !== 'consumable') throw new Error('Sólo se consumen recursos consumibles');
      const entry = stock(next, command.itemId);
      if (entry.ready < command.quantity) throw new Error('Munición o recursos listos insuficientes');
      entry.ready -= command.quantity;
      entry.consumed = safeSum(entry.consumed, command.quantity);
      // Already paid on acquisition: no second charge on consumption.
      break;
    }
    case 'finish':
      if (next.phase !== 'active') throw new Error('Finalización requiere misión activa');
      next.phase = 'completed';
      next.missions.at(-1).status = 'completed';
      break;
    case 'begin-mission': {
      if (next.phase !== 'completed') throw new Error('Cerrar la misión anterior antes de continuar');
      if (next.missions.length >= MAX_MISSIONS) throw new Error('Límite de misiones alcanzado');
      if (next.missions.some(mission => mission.id === command.missionId)) throw new Error('missionId ya utilizado');
      next.elapsedSeconds = safeSum(next.elapsedSeconds, command.elapsedSeconds);
      next.missions.push({ id: command.missionId, elapsedBeforeSeconds: command.elapsedSeconds, status: 'planning' });
      next.phase = 'planning';
      // No reset of balance, availability, quotes, ready/reserve or consumption.
      // Elapsed time is recorded, not used to invent repairs or deliveries.
      break;
    }
  }
  next.audit.push(command);
  return keep(next);
}

/** Save inputs and events, not a trusted mutable balance/inventory snapshot. */
export function savePlan(state) {
  trusted(state);
  return JSON.stringify({ format: 'cielo-cerrado/allocation-prototype', version: 1,
    initial: state.initial, commands: state.audit });
}

export function loadPlan(text) {
  if (typeof text !== 'string' || text.length > 2 * 1024 * 1024) throw new Error('Archivo demasiado grande o inválido');
  const raw = JSON.parse(text);
  if (!raw || raw.format !== 'cielo-cerrado/allocation-prototype' || raw.version !== 1 || !Array.isArray(raw.commands)) {
    throw new Error('Formato de plan inválido');
  }
  if (raw.commands.length > MAX_COMMANDS) throw new Error('Demasiados comandos');
  let state = createPlan(raw.initial);
  for (const command of raw.commands) state = applyCommand(state, command);
  return state;
}
