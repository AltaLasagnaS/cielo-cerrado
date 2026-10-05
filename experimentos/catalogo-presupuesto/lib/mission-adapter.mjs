import { deepFreeze, id, integer, seconds, addSeconds } from './common.mjs';
import { applyCampaignCommand, saveCampaign, loadCampaign } from './logistics.mjs';

// Boundary for the engine's owner. Nothing imports src/, calculates combat,
// infers a missile variant or copies counters back at the end of a battle.
function exact(value, keys, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
      || Object.keys(value).some(key => !keys.includes(key))) throw Error(`${name}: campos inválidos`);
}
function normalizeBindings(campaign, raw) {
  if (!Array.isArray(raw) || raw.length > 200) throw Error('Asignaciones inválidas');
  const result = raw.map(binding => {
    exact(binding, ['unitId', 'readyLocationId', 'reserveLocationId', 'ammunitionIds', 'reloadServiceId'], 'Asignación');
    const unitId = integer(binding.unitId, 'unitId', 1);
    const readyLocationId = id(binding.readyLocationId), reserveLocationId = id(binding.reserveLocationId);
    const inventory = campaign.initial.inventory;
    const ready = inventory.locations.find(row => row.id === readyLocationId);
    const reserve = inventory.locations.find(row => row.id === reserveLocationId);
    if (ready?.kind !== 'launcher' || reserve?.kind !== 'depot') throw Error('Asignación sin lanzador/reserva físicos');
    if (!Array.isArray(binding.ammunitionIds) || !binding.ammunitionIds.length || binding.ammunitionIds.length > 200) throw Error('Municiones de asignación inválidas');
    const ammunitionIds = binding.ammunitionIds.map(value => id(value));
    const configuration = inventory.configurations.find(row => row.id === ready.configurationId);
    if (new Set(ammunitionIds).size !== ammunitionIds.length || ammunitionIds.some(value =>
      !inventory.ammunitionIds.includes(value) || !configuration.loadouts.some(loadout => loadout.rounds.some(round => round.ammunitionId === value)))) throw Error('Munición no admitida por el lanzador');
    const reloadServiceId = binding.reloadServiceId === null ? null : id(binding.reloadServiceId);
    if (reloadServiceId !== null) {
      const service = campaign.initial.services.find(row => row.id === reloadServiceId);
      if (service?.kind !== 'transfer' || service.fromId !== reserveLocationId || service.toId !== readyLocationId
          || ammunitionIds.some(value => !service.ammunitionIds.includes(value))) throw Error('Servicio de recarga no corresponde a la asignación');
    }
    return { unitId, readyLocationId, reserveLocationId, ammunitionIds, reloadServiceId };
  });
  if (new Set(result.map(row => row.unitId)).size !== result.length
      || new Set(result.map(row => row.readyLocationId)).size !== result.length) throw Error('Unidad/lanzador asignado dos veces');
  if (JSON.stringify(result).length > 512 * 1024) throw Error('Asignaciones demasiado grandes');
  return deepFreeze(result);
}

export function attachMission(campaign, input) {
  saveCampaign(campaign); // Authenticate the immutable ledger, not a snapshot.
  exact(input, ['sideId', 'bindings'], 'Adaptador');
  const sideId = id(input.sideId);
  if (sideId !== campaign.sideId) throw Error('Adaptador de otro bando');
  if (!['active', 'completed'].includes(campaign.phase)) throw Error('Activar la misión antes de conectar el motor');
  const bindings = normalizeBindings(campaign, input.bindings);
  const originSeconds = campaign.missions.at(-1).startedAtSeconds;
  let current = campaign, serial = 0;
  function bindingOf(unitId) {
    integer(unitId, 'unitId', 1);
    const binding = bindings.find(row => row.unitId === unitId);
    if (!binding) throw Error('Unidad sin asignación propia');
    return binding;
  }
  function roundOf(binding, ammunitionId) {
    id(ammunitionId);
    if (!binding.ammunitionIds.includes(ammunitionId)) throw Error('Munición ajena a la asignación');
  }
  function clockId(state) {
    let value;
    do { value = `adapter-clock-${++serial}`; } while (state.commands.some(row => row.commandId === value));
    return value;
  }
  function advance(state, missionSeconds) {
    const atSeconds = addSeconds(originSeconds, seconds(missionSeconds, 'tiempo de misión'));
    if (atSeconds < state.clockSeconds) throw Error('Reloj de misión retrocede');
    if (atSeconds === state.clockSeconds) return state;
    return applyCampaignCommand(state, { commandId: clockId(state), sideId, atSeconds, kind: 'advance' });
  }
  function execute(request, kind, properties) {
    id(request.requestId, 'requestId');
    const atSeconds = addSeconds(originSeconds, seconds(request.missionSeconds, 'tiempo de misión'));
    const command = { commandId: request.requestId, sideId, atSeconds, kind, ...properties };
    // A retry at its original time remains idempotent after later ticks or end.
    if (current.commands.some(row => row.commandId === request.requestId)) {
      current = applyCampaignCommand(current, command); return current;
    }
    if (current.phase !== 'active') throw Error('La sesión de combate terminó');
    let next = advance(current, request.missionSeconds);
    next = applyCampaignCommand(next, command);
    current = next; return current; // Commit only if clock + operation succeed.
  }
  const adapter = {
    getCampaign: () => current,
    getMissionSeconds: () => (current.phase === 'completed' ? current.missions.at(-1).endedAtSeconds : current.clockSeconds) - originSeconds,
    ammunition(unitId) {
      const binding = bindingOf(unitId);
      const stock = (locationId, ammunitionId) => current.inventory.stock.find(row => row.locationId === locationId && row.ammunitionId === ammunitionId)?.quantity ?? 0;
      return deepFreeze(binding.ammunitionIds.map(ammunitionId => ({ ammunitionId,
        ready: stock(binding.readyLocationId, ammunitionId), reserve: stock(binding.reserveLocationId, ammunitionId) })));
    },
    advance(request) {
      exact(request, ['missionSeconds'], 'Reloj');
      if (current.phase !== 'active') throw Error('La sesión de combate terminó');
      const next = advance(current, request.missionSeconds); current = next; return current;
    },
    fire(request) {
      exact(request, ['requestId', 'missionSeconds', 'unitId', 'ammunitionId', 'quantity'], 'Disparo');
      const binding = bindingOf(request.unitId); roundOf(binding, request.ammunitionId);
      return execute(request, 'outcome', { outcome: { kind: 'expend', fromId: binding.readyLocationId,
        ammunitionId: request.ammunitionId, quantity: integer(request.quantity, 'cantidad', 1) } });
    },
    reload(request) {
      exact(request, ['requestId', 'missionSeconds', 'unitId', 'ammunitionId', 'quantity'], 'Recarga');
      const binding = bindingOf(request.unitId); roundOf(binding, request.ammunitionId);
      if (binding.reloadServiceId === null) throw Error('Unidad sin servicio de recarga declarado');
      return execute(request, 'transfer', { jobId: request.requestId, serviceId: binding.reloadServiceId,
        ammunitionId: request.ammunitionId, quantity: integer(request.quantity, 'cantidad', 1) });
    },
    damage(request) {
      exact(request, ['requestId', 'missionSeconds', 'componentId', 'condition'], 'Daño');
      return execute(request, 'outcome', { outcome: { kind: 'condition', componentId: id(request.componentId), condition: request.condition } });
    },
    loseStock(request) {
      exact(request, ['requestId', 'missionSeconds', 'locationId', 'ammunitionId', 'quantity'], 'Pérdida');
      return execute(request, 'outcome', { outcome: { kind: 'loss', fromId: id(request.locationId),
        ammunitionId: id(request.ammunitionId), quantity: integer(request.quantity, 'cantidad', 1) } });
    },
    repair(request) {
      exact(request, ['requestId', 'missionSeconds', 'serviceId', 'componentId'], 'Reparación');
      return execute(request, 'repair', { jobId: request.requestId, serviceId: id(request.serviceId), componentId: id(request.componentId) });
    },
    order(request) {
      exact(request, ['requestId', 'missionSeconds', 'quoteId', 'quantity'], 'Pedido');
      return execute(request, 'order', { jobId: request.requestId, quoteId: id(request.quoteId), quantity: integer(request.quantity, 'cantidad', 1) });
    },
    cancel(request) {
      exact(request, ['requestId', 'missionSeconds', 'jobId'], 'Cancelación');
      return execute(request, 'cancel', { jobId: id(request.jobId) });
    },
    finish(request) {
      exact(request, ['requestId', 'missionSeconds'], 'Fin'); return execute(request, 'finish', {});
    },
    save() {
      const text = JSON.stringify({ format: 'cielo-cerrado/mission-resource-session', version: 1,
        sideId, bindings, campaign: JSON.parse(saveCampaign(current)) });
      if (text.length > 10 * 1024 * 1024) throw Error('Sesión demasiado grande');
      return text;
    }
  };
  return Object.freeze(adapter);
}

export function loadMission(text, expectedSideId) {
  if (typeof text !== 'string' || text.length > 10 * 1024 * 1024) throw Error('Sesión inválida');
  const raw = JSON.parse(text); exact(raw, ['format', 'version', 'sideId', 'bindings', 'campaign'], 'Sesión');
  if (raw.format !== 'cielo-cerrado/mission-resource-session' || raw.version !== 1) throw Error('Formato de sesión desconocido');
  if (id(expectedSideId) !== raw.sideId) throw Error('Sesión de otro bando');
  return attachMission(loadCampaign(JSON.stringify(raw.campaign)), { sideId: raw.sideId, bindings: raw.bindings });
}
