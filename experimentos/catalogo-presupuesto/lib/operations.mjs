import { deepFreeze, id, integer, seconds, addSeconds } from './common.mjs';
import { createCampaign, applyCampaignCommand, saveCampaign, loadCampaign } from './logistics.mjs';
import { normalizePreparationBriefing } from './briefing.mjs';

// Strategic sequence over ONE authentic logistics ledger. No imports from src/,
// enemy plans, combat calculations, guessed missile identities or free replenishment.
const states = new WeakSet();
const RESULTS = ['exito', 'parcial', 'fracaso'];
const MAX_EVENTS = 2000;
const exact = (v, keys, label) => {
  if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).some(k => !keys.includes(k))) throw Error(`${label}: campos inválidos`);
};
const text = (v, label) => {
  if (typeof v !== 'string' || !v.trim() || v.length > 2000) throw Error(`${label}: texto inválido`);
  return v;
};
const key = v => {
  if (typeof v !== 'string' || !/^[a-z][a-z0-9_]{0,79}$/.test(v)) throw Error('Clave de escenario/mapa inválida');
  return v;
};
const list = (v, label, max = 100) => {
  if (!Array.isArray(v) || v.length > max) throw Error(`${label}: lista inválida`);
  return v;
};
const unique = (rows, label) => {
  if (new Set(rows.map(r => r.id)).size !== rows.length) throw Error(`${label}: ID duplicado`);
};
const coordinate = v => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 10000) throw Error('Coordenada inválida');
  return v;
};
function keep(state) { deepFreeze(state); states.add(state); return state; }
function own(state) { if (!states.has(state)) throw Error('Operación ajena; usar loadOperations'); }
const current = state => state.definition.missions.find(m => m.id === state.currentMissionId);
const reportInput = r => Object.fromEntries(['id', 'text', 'confidence', 'sourceLabel', 'observedAtSeconds', 'receivedAtSeconds'].map(k => [k, r[k]]));

function normalize(raw) {
  exact(raw, ['id', 'title', 'resourceInitial', 'assets', 'missions', 'basis'], 'Operación');
  const resourceInitial = createCampaign(raw.resourceInitial).initial;
  const assets = list(raw.assets, 'activos').map(a => {
    exact(a, ['id', 'kind', 'engineType', 'engineName', 'mapKey', 'x', 'y', 'az', 'maxHp', 'hp', 'componentIds', 'repairComponentId'], 'Activo propio');
    if (!['unit', 'objective'].includes(a.kind)) throw Error('Clase de activo inválida');
    const maxHp = integer(a.maxHp, 'HP máximo', 1), hp = integer(a.hp, 'HP');
    if (hp > maxHp) throw Error('HP supera máximo');
    const componentIds = list(a.componentIds, 'componentes del activo').map(c => id(c));
    if (new Set(componentIds).size !== componentIds.length || componentIds.some(c => !resourceInitial.inventory.components.some(row => row.id === c))) throw Error('Componente propio desconocido');
    const repairComponentId = a.repairComponentId === null ? null : id(a.repairComponentId);
    if (repairComponentId !== null && !componentIds.includes(repairComponentId)) throw Error('Reparación no corresponde al activo');
    if (!Number.isFinite(a.az) || a.az < 0 || a.az >= 360) throw Error('Azimut inválido');
    return { id: id(a.id), kind: a.kind, engineType: key(a.engineType), engineName: text(a.engineName, 'nombre'),
      mapKey: key(a.mapKey), x: coordinate(a.x), y: coordinate(a.y), az: a.az, maxHp, hp, componentIds, repairComponentId };
  });
  unique(assets, 'activos');
  if (new Set(assets.map(a => `${a.kind}/${a.engineName}`)).size !== assets.length) throw Error('Nombre de motor duplicado');
  const used = assets.flatMap(a => a.componentIds);
  if (new Set(used).size !== used.length) throw Error('Componente físico asignado a dos activos');
  const missions = list(raw.missions, 'misiones', 20).map(m => {
    exact(m, ['id', 'title', 'scenarioKey', 'mapKey', 'role', 'delayBeforeSeconds', 'planningSeconds', 'allowedAssetIds', 'allowedQuoteIds', 'objectives', 'next'], 'Misión');
    if (!['defence', 'attack'].includes(m.role)) throw Error('Rol inválido');
    const allowedAssetIds = list(m.allowedAssetIds, 'medios').map(v => id(v)), allowedQuoteIds = list(m.allowedQuoteIds, 'ofertas').map(v => id(v));
    if (new Set(allowedAssetIds).size !== allowedAssetIds.length || allowedAssetIds.some(v => !assets.some(a => a.id === v))) throw Error('Activo permitido desconocido/duplicado');
    if (new Set(allowedQuoteIds).size !== allowedQuoteIds.length || allowedQuoteIds.some(v => !resourceInitial.quotes.some(q => q.id === v))) throw Error('Oferta permitida desconocida/duplicada');
    exact(m.next, RESULTS, 'Continuación');
    const next = Object.fromEntries(RESULTS.map(r => [r, m.next[r] === null ? null : id(m.next[r])]));
    const objectives = normalizePreparationBriefing({ sideId: resourceInitial.inventory.sideId, missionId: m.id,
      role: m.role, title: m.title, issuedAtSeconds: 0, objectives: m.objectives, intelligence: [] },
    { sideId: resourceInitial.inventory.sideId, missionId: m.id }, { fractionalTime: true }).objectives;
    return { id: id(m.id), title: text(m.title, 'título'), scenarioKey: key(m.scenarioKey), mapKey: key(m.mapKey), role: m.role,
      delayBeforeSeconds: seconds(m.delayBeforeSeconds), planningSeconds: seconds(m.planningSeconds), allowedAssetIds, allowedQuoteIds, objectives, next };
  });
  unique(missions, 'misiones');
  if (!missions.length || missions[0].id !== resourceInitial.missionId || missions[0].delayBeforeSeconds !== 0) throw Error('Primera misión/origen inválidos');
  for (const [i, m] of missions.entries()) for (const to of Object.values(m.next)) {
    if (to !== null && missions.findIndex(next => next.id === to) <= i) throw Error('Continuación desconocida, cíclica o hacia atrás');
  }
  const reachable = new Set([missions[0].id]);
  for (const m of missions) if (reachable.has(m.id)) for (const to of Object.values(m.next)) if (to) reachable.add(to);
  if (reachable.size !== missions.length) throw Error('Misión inalcanzable');
  const basis = text(raw.basis, 'alcance de campaña');
  const definition = { id: id(raw.id), title: text(raw.title, 'título'), resourceInitial, assets, missions, basis };
  if (JSON.stringify(definition).length > 2 * 1024 * 1024) throw Error('Definición demasiado grande');
  return definition;
}

export function createOperations(raw) {
  const definition = normalize(raw), resources = createCampaign(definition.resourceInitial);
  return keep({ definition, resources, currentMissionId: definition.missions[0].id, phase: 'planning',
    enteredAtSeconds: 0, assets: structuredClone(definition.assets), intelligence: [], history: [], events: [], usedRecoveryJobs: [] });
}
function descendant(state, resources) {
  saveCampaign(resources);
  if (JSON.stringify(resources.initial) !== JSON.stringify(state.resources.initial)
    || resources.commands.length < state.resources.commands.length
    || JSON.stringify(resources.commands.slice(0, state.resources.commands.length)) !== JSON.stringify(state.resources.commands)) throw Error('Libro sustituido o historia retrocedida');
  if (resources.sideId !== state.resources.sideId || resources.missions.at(-1).id !== state.currentMissionId) throw Error('Libro de otro bando/misión');
}
function evolve(state, event, change) {
  own(state);
  if (state.events.length >= MAX_EVENTS) throw Error('Límite de eventos de operación');
  const prior = state.events.find(e => e.requestId === event.requestId);
  if (prior) {
    if (JSON.stringify(prior) !== JSON.stringify(event)) throw Error('requestId reutilizado');
    return state;
  }
  return keep({ ...state, ...change, events: [...state.events, event] });
}
export function applyOperationResourceCommand(state, command) {
  own(state);
  if (state.phase !== 'planning') throw Error('Órdenes logísticas del jugador requieren preparación');
  const mission = current(state);
  if (!['order', 'transfer', 'repair', 'cancel', 'advance'].includes(command.kind)) throw Error('Acción de preparación inválida');
  if (command.kind === 'order' && !mission.allowedQuoteIds.includes(command.quoteId)) throw Error('Oferta no disponible en esta etapa');
  if (command.atSeconds > addSeconds(state.enteredAtSeconds, mission.planningSeconds)) throw Error('Terminó la ventana de preparación');
  const resources = applyCampaignCommand(state.resources, command);
  if (resources === state.resources) return state;
  return evolve(state, { kind: 'sync', requestId: id(command.commandId), commandCount: resources.commands.length }, { resources });
}
export function activateOperationMission(state, requestId) {
  own(state); id(requestId);
  const prior = state.events.find(e => e.requestId === requestId);
  if (prior) {
    if (prior.kind !== 'activate') throw Error('requestId reutilizado');
    return state;
  }
  if (state.phase !== 'planning') throw Error('Misión no está en preparación');
  const mission = current(state);
  if (state.resources.clockSeconds > addSeconds(state.enteredAtSeconds, mission.planningSeconds)) throw Error('Terminó la preparación');
  const resources = applyCampaignCommand(state.resources, { commandId: requestId, sideId: state.resources.sideId,
    atSeconds: state.resources.clockSeconds, kind: 'activate' });
  return evolve(state, { kind: 'activate', requestId, commandCount: resources.commands.length }, { resources, phase: 'active' });
}
export function syncOperationResources(state, resources, requestId) {
  own(state); id(requestId); descendant(state, resources);
  if (state.phase !== 'active' || resources.phase !== 'active') throw Error('Sincronizar requiere combate activo');
  return evolve(state, { kind: 'sync', requestId, commandCount: resources.commands.length }, { resources });
}
export function completeOperationMission(state, input) {
  own(state);
  exact(input, ['requestId', 'resources', 'result', 'assetOutcomes', 'intelligence', 'summary'], 'Debrief propio');
  id(input.requestId);
  const priorEvent = state.events.find(e => e.requestId === input.requestId);
  if (priorEvent) {
    saveCampaign(input.resources);
    if (priorEvent.kind !== 'complete' || JSON.stringify(input.resources.initial) !== JSON.stringify(state.resources.initial)
      || input.resources.commands.length !== priorEvent.commandCount
      || JSON.stringify(input.resources.commands) !== JSON.stringify(state.resources.commands.slice(0, priorEvent.commandCount))) throw Error('requestId reutilizado');
    const m = state.definition.missions.find(m => m.id === priorEvent.debrief.missionId);
    const reports = normalizePreparationBriefing({ sideId: input.resources.sideId, missionId: m.id, role: m.role, title: m.title,
      issuedAtSeconds: input.resources.clockSeconds, objectives: m.objectives, intelligence: input.intelligence },
    { sideId: input.resources.sideId, missionId: m.id }, { fractionalTime: true }).intelligence;
    const rows = list(input.assetOutcomes, 'estado propio').map(r => {
      exact(r, ['id', 'hp', 'x', 'y', 'mapKey', 'restoredByJobId'], 'Resultado');
      return { id: r.id, hp: r.hp, x: r.x, y: r.y, mapKey: r.mapKey, restoredByJobId: r.restoredByJobId };
    });
    if (input.result !== priorEvent.debrief.result || input.summary !== priorEvent.debrief.summary
      || JSON.stringify(rows) !== JSON.stringify(priorEvent.debrief.assetOutcomes) || JSON.stringify(reports) !== JSON.stringify(priorEvent.debrief.intelligence)) throw Error('requestId reutilizado');
    return state;
  }
  descendant(state, input.resources);
  if (!RESULTS.includes(input.result)) throw Error('Resultado inválido');
  if (state.phase !== 'active' || input.resources.phase !== 'completed') throw Error('El motor debe finalizar el libro antes del debrief');
  const at = input.resources.clockSeconds, mission = current(state);
  const briefing = normalizePreparationBriefing({ sideId: input.resources.sideId, missionId: mission.id,
    role: mission.role, title: mission.title, issuedAtSeconds: at, objectives: mission.objectives, intelligence: input.intelligence },
  { sideId: input.resources.sideId, missionId: mission.id }, { fractionalTime: true });
  const rows = list(input.assetOutcomes, 'estado propio').map(row => {
    exact(row, ['id', 'hp', 'x', 'y', 'mapKey', 'restoredByJobId'], 'Resultado de activo');
    const asset = state.assets.find(a => a.id === row.id);
    if (!asset || !mission.allowedAssetIds.includes(row.id)) throw Error('Activo no pertenece a la misión');
    const hp = integer(row.hp, 'HP');
    if (hp > asset.maxHp) throw Error('HP supera máximo');
    const restoredByJobId = row.restoredByJobId === null ? null : id(row.restoredByJobId);
    if (hp > asset.hp) {
      const job = input.resources.jobs.find(j => j.id === restoredByJobId && j.kind === 'repair' && j.status === 'completed' && j.componentId === asset.repairComponentId);
      if (!job || state.usedRecoveryJobs.includes(job.id) || asset.hp === 0) throw Error('Recuperación sin trabajo pagado y terminado');
    } else if (restoredByJobId !== null) throw Error('Trabajo de recuperación sin recuperación');
    if (row.mapKey !== mission.mapKey) throw Error('Resultado en otro mapa');
    return { id: id(row.id), hp, x: coordinate(row.x), y: coordinate(row.y), mapKey: key(row.mapKey), restoredByJobId };
  });
  unique(rows, 'resultados propios');
  if (rows.length !== mission.allowedAssetIds.length) throw Error('Falta estado de activos propios de la misión');
  const recovered = rows.map(r => r.restoredByJobId).filter(Boolean);
  if (new Set(recovered).size !== recovered.length) throw Error('Reparación aplicada a dos activos');
  const assets = state.assets.map(a => {
    const row = rows.find(r => r.id === a.id); return row ? { ...a, hp: row.hp, x: row.x, y: row.y, mapKey: row.mapKey } : a;
  });
  const reports = new Map(state.intelligence.map(r => [r.id, r]));
  for (const report of briefing.intelligence) {
    const prior = reports.get(report.id);
    if (prior && JSON.stringify(prior) !== JSON.stringify(report)) {
      // Age is recomputed at projection; observation identity may not be rewritten.
      const fields = ['text', 'confidence', 'sourceLabel', 'observedAtSeconds', 'receivedAtSeconds'];
      if (fields.some(f => prior[f] !== report[f])) throw Error('Reporte reescrito');
    }
    reports.set(report.id, report);
  }
  if (reports.size > 100) throw Error('Demasiados reportes persistentes');
  const debrief = { missionId: mission.id, result: input.result, atSeconds: at,
    summary: text(input.summary, 'resumen'), assetOutcomes: rows, intelligence: briefing.intelligence };
  const event = { kind: 'complete', requestId: input.requestId, commandCount: input.resources.commands.length, debrief };
  return evolve(state, event, { resources: input.resources, phase: 'debrief', assets,
    intelligence: [...reports.values()], history: [...state.history, debrief], usedRecoveryJobs: [...state.usedRecoveryJobs, ...recovered] });
}
export function continueOperations(state, requestId) {
  own(state); id(requestId);
  const prior = state.events.find(e => e.requestId === requestId);
  if (prior) { if (prior.kind !== 'continue') throw Error('requestId reutilizado'); return state; }
  if (state.phase !== 'debrief') throw Error('Terminar y revisar misión antes de continuar');
  const to = current(state).next[state.history.at(-1).result];
  if (to === null) return evolve(state, { kind: 'continue', requestId, commandCount: state.resources.commands.length, missionId: null }, { phase: 'finished' });
  const mission = state.definition.missions.find(m => m.id === to);
  const clock = addSeconds(state.resources.clockSeconds, mission.delayBeforeSeconds);
  let resources = applyCampaignCommand(state.resources, { commandId: `${requestId}-time`, sideId: state.resources.sideId, atSeconds: clock, kind: 'advance' });
  resources = applyCampaignCommand(resources, { commandId: requestId, sideId: resources.sideId, atSeconds: clock, kind: 'begin-mission', missionId: to });
  return evolve(state, { kind: 'continue', requestId, commandCount: resources.commands.length, missionId: to },
    { resources, currentMissionId: to, phase: 'planning', enteredAtSeconds: clock });
}
export function operationMission(state) {
  own(state); const mission = current(state);
  return deepFreeze({ ...mission, assets: structuredClone(state.assets.filter(a => mission.allowedAssetIds.includes(a.id))) });
}
export function operationView(state) {
  own(state); const mission = current(state), at = state.resources.clockSeconds;
  const briefing = normalizePreparationBriefing({ sideId: state.resources.sideId, missionId: mission.id, role: mission.role,
    title: mission.title, issuedAtSeconds: at, objectives: mission.objectives, intelligence: state.intelligence.map(reportInput) },
  { sideId: state.resources.sideId, missionId: mission.id }, { fractionalTime: true });
  return deepFreeze({ campaignId: state.definition.id, campaignTitle: state.definition.title, basis: state.definition.basis,
    sideId: state.resources.sideId, phase: state.phase, missionId: mission.id, title: mission.title,
    atSeconds: at, preparationEndsAtSeconds: addSeconds(state.enteredAtSeconds, mission.planningSeconds),
    briefing, assets: structuredClone(state.assets.filter(a => mission.allowedAssetIds.includes(a.id))),
    resources: { balance: state.resources.balance, unit: state.resources.unit, stock: structuredClone(state.resources.inventory.stock),
      jobs: structuredClone(state.resources.jobs), spares: structuredClone(state.resources.spares),
      quotes: state.resources.initial.quotes.filter(q => mission.allowedQuoteIds.includes(q.id))
        .map(q => ({ ...structuredClone(q), remaining: state.resources.quotes.find(row => row.id === q.id).remaining })) },
    debrief: state.phase === 'debrief' || state.phase === 'finished' ? structuredClone(state.history.at(-1)) : null });
}

// Internal integration output, never a commander-facing briefing: the template
// contains the scenario author's hostile plan. The caller keeps it private.
// Core reserve is zero: timed reloads belong to the one canonical adapter.
export function operationScenario(state, template) {
  own(state);
  if (state.phase !== 'planning') throw Error('Armar escenario requiere preparación');
  const mission = operationMission(state);
  if (mission.role !== 'defence' || state.resources.sideId !== 'ua') throw Error('Primera integración admite defensa ucraniana');
  if (template?.format !== 'cielo-cerrado/escenario' || template.version !== 1
      || template.map?.key !== mission.mapKey || template.scenario?.base !== mission.scenarioKey
      || !template.setup || !Array.isArray(template.setup.defs) || !Array.isArray(template.setup.objs)) throw Error('Plantilla de otra misión/formato');
  const data = structuredClone(template), bindings = [], inv = state.resources.inventory;
  let nextId = Math.max(0, ...['defs','objs','salvos','jams'].flatMap(k => (template.setup[k] ?? []).map(r => integer(r.id, 'ID de escenario', 1)))) + 1;
  data.setup.defs = mission.assets.filter(a => a.kind === 'unit' && a.hp > 0).map(a => {
    const ready = inv.initial.locations.filter(l => l.kind === 'launcher' && a.componentIds.includes(l.componentId));
    if (ready.length > 1) throw Error('Escenario legado no admite múltiples lanzadores por unidad');
    const original = template.setup.defs.find(u => u.name === a.engineName && u.type === a.engineType);
    const unit = { id: original?.id ?? nextId++, type: a.engineType, name: a.engineName, x: a.x, y: a.y, az: a.az, owner: 'UA', hp: a.hp,
      reserve: 0, dmgRadar: a.componentIds.some(id => inv.components.some(c => c.id === id && c.kind === 'sensor' && c.condition !== 'operational')),
      dmgLauncher: a.componentIds.some(id => inv.components.some(c => c.id === id && c.kind === 'launcher' && ['disabled','destroyed'].includes(c.condition))) };
    if (ready.length) {
      const location = ready[0], conf = inv.initial.configurations.find(c => c.id === location.configurationId);
      const ammunitionIds = [...new Set(conf.loadouts.flatMap(l => l.rounds.map(r => r.ammunitionId)))];
      if (ammunitionIds.length !== 1) throw Error('Motor legado requiere identidad única de munición por unidad');
      const service = state.resources.initial.services.find(s => s.kind === 'transfer' && s.toId === location.id);
      if (!service) throw Error('Falta ruta de recarga para el enganche');
      unit.mag = inv.stock.find(s => s.locationId === location.id && s.ammunitionId === ammunitionIds[0])?.quantity ?? 0;
      bindings.push({ unitId: unit.id, readyLocationId: location.id, reserveLocationId: service.fromId, ammunitionIds, reloadServiceId: service.id });
    }
    return unit;
  });
  const objectives = mission.assets.filter(a => a.kind === 'objective');
  if (data.setup.objs.length !== objectives.length) throw Error('Objetivos de plantilla no corresponden a la misión');
  data.setup.objs = data.setup.objs.map(g => {
    const a = objectives.find(a => a.engineName === g.name && a.engineType === g.type);
    if (!a) throw Error('Objetivo físico ajeno');
    return { ...g, x: a.x, y: a.y, maxHp: a.maxHp, hpNow: a.hp };
  });
  const names = new Set(data.setup.defs.map(u => u.name));
  if ((data.setup.salvos ?? []).some(s => s.targetUnit != null && !data.setup.defs.some(u => u.id === s.targetUnit))) throw Error('Ataque de plantilla apunta a una unidad que no se despliega; autor debe definir esa contingencia');
  data.scenario.player = 'defensa';
  if (data.scenario.goals) data.scenario.goals = data.scenario.goals.filter(g => g.kind !== 'keepUnit' || names.has(g.target));
  return deepFreeze({ scenario: data, bindings });
}

// Report v1 supplies own outcomes; it never supplies ammunition authority.
// The engine must already have fired/reloaded/damaged through mission-adapter
// and called finish(). A mismatched counter is an error, never a free refill.
export function completeMissionReport(state, input) {
  own(state);
  exact(input, ['report','resources','requestId','scenarioName'], 'Informe de motor');
  const { report, resources, requestId, scenarioName } = input;
  id(requestId);
  const priorIndex = state.events.findIndex(e => e.requestId === requestId);
  if (priorIndex >= 0) {
    const prior = state.events[priorIndex];
    if (prior.kind !== 'complete') throw Error('requestId reutilizado');
    const saved = JSON.parse(saveOperations(state));
    saved.events = saved.events.slice(0,priorIndex);
    saved.resources.commands = saved.resources.commands.slice(0,saved.events.at(-1)?.commandCount ?? 0);
    const previous = loadOperations(JSON.stringify(saved),state.resources.sideId);
    const retried = completeMissionReport(previous,input);
    if (JSON.stringify(retried.events.at(-1)) !== JSON.stringify(prior)) throw Error('requestId reutilizado');
    return state;
  }
  descendant(state, resources);
  if (report?.version !== 1 || report.side !== 'defensa' || current(state).role !== 'defence'
      || report.scenario !== text(scenarioName, 'escenario esperado') || !RESULTS.includes(report.outcome)) throw Error('Informe de versión/bando/escenario/resultado incompatible');
  const mission = resources.missions.at(-1);
  if (resources.phase !== 'completed' || seconds(report.t) !== mission.endedAtSeconds - mission.startedAtSeconds) throw Error('Tiempo del informe no coincide con libro terminado');
  const ownAssets = operationMission(state).assets;
  const units = list(report.assets?.units,'unidades de informe'), objectives = list(report.assets?.objectives,'objetivos de informe');
  if (list(report.assets?.jammers,'guerra electrónica de informe').length) throw Error('Campaña actual no tiene contrato de persistencia de jammers');
  for (const [rows, kind] of [[units,'unit'],[objectives,'objective']]) {
    if (new Set(rows.map(r => r.name)).size !== rows.length || rows.some(r => !ownAssets.some(a => a.kind === kind && a.engineName === r.name && a.engineType === r.type))) throw Error('Informe contiene activos ajenos o duplicados');
  }
  const assets = ownAssets.map(a => {
    const r = (a.kind === 'unit' ? units : objectives).find(r => r.name === a.engineName);
    if (!r) { if (a.kind === 'unit' && a.hp === 0) return { id:a.id,hp:0,x:a.x,y:a.y,mapKey:a.mapKey,restoredByJobId:null }; throw Error('Falta activo propio en informe'); }
    integer(r.hp,'HP informado');
    if (a.kind === 'unit') {
      if (typeof r.alive !== 'boolean' || typeof r.dmgRadar !== 'boolean' || typeof r.dmgLauncher !== 'boolean') throw Error('Estado físico inválido');
      if (r.alive) {
        const launcher = resources.inventory.initial.locations.find(l => l.kind === 'launcher' && a.componentIds.includes(l.componentId));
        if (launcher) {
          const ready = resources.inventory.stock.filter(s => s.locationId === launcher.id).reduce((n,s) => n+s.quantity,0);
          if (integer(r.magLeft,'Munición informada') !== ready || r.reserveLeft !== 0) throw Error('Munición del informe diverge del inventario; falta enganche de consumo/recarga');
        } else if (r.magLeft !== null || r.reserveLeft !== null) throw Error('Sensor sin inventario de munición');
      }
      for (const id of a.componentIds) {
        const c = resources.inventory.components.find(c => c.id === id);
        if ((!r.alive && c.condition !== 'destroyed') || (r.alive && r.dmgRadar && c.kind === 'sensor' && c.condition === 'operational')
            || (r.alive && r.dmgLauncher && c.kind === 'launcher' && c.condition === 'operational')) throw Error('Daño del informe no asentado en el libro');
      }
    }
    return { id:a.id,hp:a.kind==='unit'&&!r.alive?0:r.hp,x:a.kind==='unit'?r.x:a.x,y:a.kind==='unit'?r.y:a.y,mapKey:a.mapKey,restoredByJobId:null };
  });
  const startIndex = resources.commands.findLastIndex(c => c.kind === 'activate');
  const saved = JSON.parse(saveCampaign(resources)); saved.commands = resources.commands.slice(0,startIndex+1);
  const initial = loadCampaign(JSON.stringify(saved));
  const expended = book => book.inventory.totals.reduce((n,t) => n+t.expended,0);
  if (integer(report.spent?.interceptors,'Disparos de informe') !== expended(resources)-expended(initial)) throw Error('Disparos del informe divergen del gasto tipado');
  const room = Math.max(0,100-state.intelligence.length), log = list(report.reports,'partes',10000);
  const reports = (room ? log.slice(-room) : []).map((r,i) => ({
    id:`report-${state.currentMissionId}-${i+1}`, text:text(r.text,'texto de parte'), confidence:'unconfirmed', sourceLabel:'Registro filtrado del bando (missionReport v1)',
    observedAtSeconds:addSeconds(mission.startedAtSeconds,seconds(r.t)),receivedAtSeconds:resources.clockSeconds }));
  return completeOperationMission(state,{ requestId,resources,result:report.outcome,assetOutcomes:assets,intelligence:reports,
    summary:'Informe del bando recibido. Se conservan fondos, munición asentada, trabajos y estado de los medios e infraestructura propios.' });
}
export function saveOperations(state) {
  own(state);
  const saved = JSON.stringify({ format: 'cielo-cerrado/operations', version: 1, definition: state.definition,
    resources: JSON.parse(saveCampaign(state.resources)), events: state.events });
  if (saved.length > 12 * 1024 * 1024) throw Error('Guardado de operación demasiado grande');
  return saved;
}
export function loadOperations(saved, expectedSideId) {
  if (typeof saved !== 'string' || saved.length > 12 * 1024 * 1024) throw Error('Guardado inválido');
  const raw = JSON.parse(saved);
  exact(raw, ['format', 'version', 'definition', 'resources', 'events'], 'Guardado');
  if (raw.format !== 'cielo-cerrado/operations' || raw.version !== 1) throw Error('Formato de operación inválido');
  let state = createOperations(raw.definition);
  if (state.resources.sideId !== id(expectedSideId)) throw Error('Operación de otro bando');
  const final = loadCampaign(JSON.stringify(raw.resources), expectedSideId);
  if (JSON.stringify(final.initial) !== JSON.stringify(state.resources.initial)) throw Error('Inventario inicial sustituido');
  let count = 0;
  for (const event of list(raw.events, 'eventos', MAX_EVENTS)) {
    integer(event.commandCount, 'cursor');
    if (event.commandCount < count || event.commandCount > final.commands.length) throw Error('Cursor de recursos inválido');
    const resources = loadCampaign(JSON.stringify({ ...raw.resources, commands: final.commands.slice(0, event.commandCount) }), expectedSideId);
    const allowed = event.kind === 'complete' ? ['kind', 'requestId', 'commandCount', 'debrief']
      : event.kind === 'continue' ? ['kind', 'requestId', 'commandCount', 'missionId'] : ['kind', 'requestId', 'commandCount'];
    exact(event, allowed, 'Evento');
    if (event.kind === 'sync') {
      if (state.phase === 'planning') {
        for (const command of resources.commands.slice(count)) state = applyOperationResourceCommand(state, command);
      } else state = syncOperationResources(state, resources, event.requestId);
    } else if (event.kind === 'activate') state = activateOperationMission(state, event.requestId);
    else if (event.kind === 'complete') {
      exact(event.debrief, ['missionId', 'result', 'atSeconds', 'summary', 'assetOutcomes', 'intelligence'], 'Debrief');
      if (event.debrief.missionId !== state.currentMissionId || event.debrief.atSeconds !== resources.clockSeconds) throw Error('Debrief de otra misión/tiempo');
      state = completeOperationMission(state, { requestId: event.requestId, resources, result: event.debrief.result,
        assetOutcomes: event.debrief.assetOutcomes, intelligence: event.debrief.intelligence.map(reportInput), summary: event.debrief.summary });
    } else if (event.kind === 'continue') state = continueOperations(state, event.requestId);
    else throw Error('Evento de operación desconocido');
    if (JSON.stringify(state.events.at(-1)) !== JSON.stringify(event) || JSON.stringify(state.resources.commands) !== JSON.stringify(resources.commands)) throw Error('Replay divergente');
    count = event.commandCount;
  }
  if (count !== final.commands.length) throw Error('Comandos de recursos sin evento autorizado');
  return state;
}
