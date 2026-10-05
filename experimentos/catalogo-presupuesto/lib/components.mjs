import { deepFreeze, id, integer, safeSum } from './common.mjs';

// Physical inventory contract. It records authorized outcomes from one engine;
// it does not calculate damage, detection, guidance, repair or delivery times.
const states = new WeakSet();
const LIMIT = 10000;
const fields = {
  transfer: ['fromId', 'toId', 'ammunitionId', 'quantity'],
  expend: ['fromId', 'ammunitionId', 'quantity'],
  loss: ['fromId', 'ammunitionId', 'quantity'],
  condition: ['componentId', 'condition']
};

function exact(value, keys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.keys(value).some(key => !keys.includes(key))) throw Error(`${label}: campos inválidos`);
}

function list(value, label, max = 200) {
  if (!Array.isArray(value) || value.length > max) throw Error(`${label}: lista inválida`);
  return value;
}

function unique(values, label) {
  if (new Set(values).size !== values.length) throw Error(`${label}: duplicado`);
}

function known(state) {
  if (!states.has(state)) throw Error('Inventario ajeno; usar loadInventory');
}

function keep(state) {
  deepFreeze(state);
  states.add(state);
  return state;
}

function normalizeInitial(raw) {
  exact(raw, ['sideId', 'ammunitionIds', 'components', 'locations', 'configurations', 'stock'], 'Inventario');
  const sideId = id(raw.sideId, 'sideId');
  const ammunitionIds = list(raw.ammunitionIds, 'municiones').map(value => id(value, 'ammunitionId'));
  unique(ammunitionIds, 'municiones');
  const components = list(raw.components, 'componentes').map(row => {
    exact(row, ['id', 'kind'], 'Componente');
    if (!['launcher', 'sensor', 'control'].includes(row.kind)) throw Error('Tipo de componente inválido');
    return { id: id(row.id, 'componentId'), kind: row.kind };
  });
  unique(components.map(row => row.id), 'componentes');
  const configurations = list(raw.configurations, 'configuraciones').map(row => {
    exact(row, ['id', 'loadouts', 'basis'], 'Configuración');
    // Caller must declare an explicit assumption or source; never infer a load
    // from family membership, individual missile maxima or another variant.
    exact(row.basis, ['kind', 'note', 'sourceIds'], 'Evidencia');
    if (!['fictional', 'documented', 'legacy-estimate'].includes(row.basis.kind)
        || typeof row.basis.note !== 'string' || !row.basis.note.trim()
        || row.basis.note.length > 2000) throw Error('Evidencia de configuración requerida');
    const sourceIds = list(row.basis.sourceIds, 'fuentes').map(value => id(value, 'sourceId'));
    if (row.basis.kind === 'documented' && !sourceIds.length) throw Error('Configuración documentada sin fuente');
    const loadouts = list(row.loadouts, 'cargas admitidas').map(loadout => {
      exact(loadout, ['id', 'rounds'], 'Carga');
      const rounds = list(loadout.rounds, 'munición de carga').map(round => {
        exact(round, ['ammunitionId', 'quantity'], 'Munición');
        const ammunitionId = id(round.ammunitionId, 'ammunitionId');
        if (!ammunitionIds.includes(ammunitionId)) throw Error('Munición desconocida');
        return { ammunitionId, quantity: integer(round.quantity, 'cantidad de carga', 1) };
      });
      if (!rounds.length) throw Error('Carga vacía');
      unique(rounds.map(round => round.ammunitionId), 'munición de carga');
      return { id: id(loadout.id, 'loadoutId'), rounds };
    });
    if (!loadouts.length) throw Error('Capacidad desconocida: no se habilita lanzador');
    unique(loadouts.map(loadout => loadout.id), 'cargas');
    return { id: id(row.id, 'configurationId'), loadouts,
      basis: { kind: row.basis.kind, note: row.basis.note, sourceIds } };
  });
  unique(configurations.map(row => row.id), 'configuraciones');
  const locations = list(raw.locations, 'ubicaciones').map(row => {
    exact(row, ['id', 'kind', 'componentId', 'configurationId', 'launchDependencies'], 'Ubicación');
    const locationId = id(row.id, 'locationId');
    if (row.kind === 'depot') {
      if (['componentId', 'configurationId', 'launchDependencies'].some(key => Object.hasOwn(row, key))) {
        throw Error('Depósito no es un lanzador');
      }
      return { id: locationId, kind: 'depot' };
    }
    if (row.kind !== 'launcher') throw Error('Ubicación inválida');
    const componentId = id(row.componentId, 'componentId');
    if (components.find(component => component.id === componentId)?.kind !== 'launcher') throw Error('Lanzador inexistente');
    const configurationId = id(row.configurationId, 'configurationId');
    if (!configurations.some(configuration => configuration.id === configurationId)) throw Error('Configuración inexistente');
    const launchDependencies = list(row.launchDependencies, 'dependencias').map(value => id(value, 'dependencyId'));
    unique(launchDependencies, 'dependencias');
    if (launchDependencies.some(value => !components.some(component => component.id === value))) throw Error('Dependencia inexistente');
    return { id: locationId, kind: 'launcher', componentId, configurationId, launchDependencies };
  });
  unique(locations.map(row => row.id), 'ubicaciones');
  unique(locations.filter(row => row.kind === 'launcher').map(row => row.componentId), 'ubicación de lanzador');
  const stock = list(raw.stock, 'existencias', LIMIT).map(row => {
    exact(row, ['locationId', 'ammunitionId', 'quantity'], 'Existencias');
    const locationId = id(row.locationId, 'locationId');
    const ammunitionId = id(row.ammunitionId, 'ammunitionId');
    if (!locations.some(location => location.id === locationId) || !ammunitionIds.includes(ammunitionId)) throw Error('Existencias sin identidad válida');
    return { locationId, ammunitionId, quantity: integer(row.quantity, 'existencias') };
  });
  unique(stock.map(row => `${row.locationId}/${row.ammunitionId}`), 'existencias');
  for (const ammunitionId of ammunitionIds) stock.filter(row => row.ammunitionId === ammunitionId)
    .reduce((total, row) => safeSum(total, row.quantity), 0);
  return { sideId, ammunitionIds, components, locations, configurations, stock };
}

function entry(state, locationId, ammunitionId) {
  let row = state.stock.find(value => value.locationId === locationId && value.ammunitionId === ammunitionId);
  if (!row) { row = { locationId, ammunitionId, quantity: 0 }; state.stock.push(row); }
  return row;
}

function fits(state, location) {
  if (location.kind === 'depot') return true;
  const cargo = state.stock.filter(row => row.locationId === location.id && row.quantity > 0);
  const configuration = state.initial.configurations.find(row => row.id === location.configurationId);
  // A partial load is allowed only as a subset of ONE explicitly admitted full
  // load. Separate maxima for missiles A/B do not imply mixed A+B permission.
  return configuration.loadouts.some(loadout => cargo.every(row =>
    row.quantity <= (loadout.rounds.find(round => round.ammunitionId === row.ammunitionId)?.quantity ?? 0)));
}

export function createInventory(raw) {
  const initial = normalizeInitial(raw);
  const state = { version: 1, initial, sideId: initial.sideId, atSeconds: 0,
    components: initial.components.map(row => ({ ...row, condition: 'operational' })),
    stock: structuredClone(initial.stock),
    totals: initial.ammunitionIds.map(ammunitionId => ({ ammunitionId, expended: 0, lost: 0 })), events: [] };
  if (!initial.locations.every(location => fits(state, location))) throw Error('Carga inicial no admitida');
  return keep(state);
}

export function applyInventoryEvent(state, raw) {
  known(state);
  if (!Object.hasOwn(fields, raw?.kind)) throw Error('Evento desconocido');
  exact(raw, ['eventId', 'sideId', 'atSeconds', 'kind', ...fields[raw.kind]], 'Evento');
  const event = { eventId: id(raw.eventId, 'eventId'), sideId: id(raw.sideId, 'sideId'),
    atSeconds: integer(raw.atSeconds, 'atSeconds'), kind: raw.kind };
  for (const key of fields[raw.kind]) {
    event[key] = key === 'quantity' ? integer(raw[key], key, 1)
      : key === 'condition' ? raw[key] : id(raw[key], key);
  }
  if (event.sideId !== state.sideId) throw Error('Evento de otro bando');
  const previous = state.events.find(row => row.eventId === event.eventId);
  if (previous) {
    if (JSON.stringify(previous) !== JSON.stringify(event)) throw Error('eventId reutilizado');
    return state;
  }
  if (state.events.length >= LIMIT) throw Error('Demasiados eventos');
  if (event.atSeconds < state.atSeconds) throw Error('Evento fuera de orden temporal');
  const next = structuredClone(state);
  if (event.kind === 'condition') {
    if (!['operational', 'disabled', 'destroyed'].includes(event.condition)) throw Error('Condición inválida');
    const component = next.components.find(row => row.id === event.componentId);
    if (!component) throw Error('Componente inexistente');
    if (component.condition === 'destroyed' && event.condition !== 'destroyed') throw Error('Componente destruido no se resucita');
    component.condition = event.condition;
    if (event.condition === 'destroyed') {
      const location = next.initial.locations.find(row => row.componentId === component.id);
      if (location) for (const row of next.stock.filter(value => value.locationId === location.id)) {
        const total = next.totals.find(value => value.ammunitionId === row.ammunitionId);
        total.lost = safeSum(total.lost, row.quantity); row.quantity = 0;
      }
    }
  } else {
    const source = next.initial.locations.find(row => row.id === event.fromId);
    if (!source || !next.initial.ammunitionIds.includes(event.ammunitionId)) throw Error('Origen o munición inexistente');
    const row = entry(next, source.id, event.ammunitionId);
    if (row.quantity < event.quantity) throw Error('Existencias insuficientes');
    if (event.kind === 'transfer') {
      const target = next.initial.locations.find(value => value.id === event.toId);
      if (!target || target.id === source.id) throw Error('Destino inválido');
      if (target.kind === 'launcher' && next.components.find(value => value.id === target.componentId).condition !== 'operational') throw Error('Lanzador destino no operativo');
      row.quantity -= event.quantity;
      const destination = entry(next, target.id, event.ammunitionId);
      destination.quantity = safeSum(destination.quantity, event.quantity);
      if (!fits(next, target)) throw Error('Carga mixta o capacidad no admitida');
    } else {
      if (event.kind === 'expend') {
        if (source.kind !== 'launcher') throw Error('No se dispara desde un depósito');
        const required = [source.componentId, ...source.launchDependencies];
        if (required.some(componentId => next.components.find(value => value.id === componentId).condition !== 'operational')) throw Error('Dependencia de lanzamiento no operativa');
      }
      row.quantity -= event.quantity;
      const total = next.totals.find(value => value.ammunitionId === event.ammunitionId);
      const key = event.kind === 'expend' ? 'expended' : 'lost';
      total[key] = safeSum(total[key], event.quantity);
    }
  }
  next.atSeconds = event.atSeconds; next.events.push(event);
  return keep(next);
}

export function saveInventory(state) {
  known(state);
  return JSON.stringify({ format: 'cielo-cerrado/component-inventory', version: 1,
    initial: state.initial, events: state.events });
}

export function loadInventory(text) {
  if (typeof text !== 'string' || text.length > 4 * 1024 * 1024) throw Error('Archivo de inventario inválido');
  const raw = JSON.parse(text);
  exact(raw, ['format', 'version', 'initial', 'events'], 'Archivo');
  if (raw.format !== 'cielo-cerrado/component-inventory' || raw.version !== 1) throw Error('Formato desconocido');
  let state = createInventory(raw.initial);
  for (const event of list(raw.events, 'eventos', LIMIT)) state = applyInventoryEvent(state, event);
  return state;
}
