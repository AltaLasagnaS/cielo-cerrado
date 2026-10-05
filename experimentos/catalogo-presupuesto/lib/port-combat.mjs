import { DEFENSES, SCENARIOS } from '../../../src/data/index.js';
import { S } from '../../../src/sim/state.js';
import { startSim, step, resetState } from '../../../src/sim/engine.js';
import { applyScenario, addDef } from '../../../src/sim/setup.js';
import { evaluateGoals } from '../../../src/sim/goals.js';
import { targetStatus } from '../../../src/physics/damage.js';
import { setMap, builtinMap, MAP } from '../../../src/physics/terrain.js';
import { seeded, setRandom } from '../../../src/util/rng.js';
import { attachMission } from './mission-adapter.mjs';
import { activateOperationMission, completeOperationMission, operationMission, syncOperationResources } from './operations.mjs';
import { deepFreeze, integer } from './common.mjs';

// Optional executable bridge: no edits to the shared engine. Unit counters are
// derived caches; reserveLeft stays zero to disable autonomous free reloads.
// This bridge is separate from Claude's native integration, not a second engine.
let active = null;
export function startPortCombat(operation, seed = 1) {
  if (active) throw Error('Ya hay un combate experimental activo');
  integer(seed, 'semilla', 1);
  const mission = operationMission(operation);
  if (mission.role !== 'defence' || operation.resources.sideId !== 'ua' || !SCENARIOS[mission.scenarioKey]) throw Error('Configuración de combate no admitida');
  const scenario = SCENARIOS[mission.scenarioKey];
  if (scenario.map !== mission.mapKey) throw Error('Mapa de campaña no corresponde');
  for (const asset of mission.assets) if (asset.mapKey !== mission.mapKey) throw Error('Falta traslado geográfico del activo');
  operation = activateOperationMission(operation, `start-${mission.id}`);
  setMap(builtinMap(mission.mapKey)); resetState();
  S.setup = { objs: [], defs: [], salvos: [], jams: [] };
  S.c2 = 'coordinada'; S.doctrine = 'salva'; S.weather = 'despejado'; S.tod = 'noche'; S.wxPlan = [];
  S.gateways = []; S.wind = { v: 0, from: 0 }; S.ignoreDecoys = false; S.fireRange = 1;
  applyScenario(scenario);
  S.setup.defs = [];
  for (const a of mission.assets.filter(a => a.kind === 'unit' && a.hp > 0)) {
    if (!DEFENSES[a.engineType]) throw Error('Tipo de defensa desconocido');
    addDef(a.engineType, a.x, a.y, { name: a.engineName, owner: 'UA', az: a.az, reserve: 0 });
  }
  const names = new Set(S.setup.defs.map(u => u.name));
  S.scen = { ...S.scen, goals: S.scen.goals.filter(g => g.kind !== 'keepUnit' || names.has(g.target)) };
  const rng = seeded(seed);
  try { setRandom(rng); startSim(); } finally { setRandom(null); }
  S.running = false;
  const assetsByUnit = new Map(S.units.map(u => [u, mission.assets.find(a => a.kind === 'unit' && a.engineName === u.name)]));
  for (const [u, a] of assetsByUnit) u.hp = a.hp;
  for (const g of S.objs) {
    const a = mission.assets.find(a => a.kind === 'objective' && a.engineName === g.name);
    if (!a) throw Error('Objetivo físico fuera del contrato de misión');
    g.hp = a.hp; g.maxHp = a.maxHp; g.status = targetStatus(g.hp, g.maxHp);
  }
  const bindings = [...assetsByUnit].filter(([u]) => DEFENSES[u.type].sam).map(([u, a]) => ({ unitId: u.id,
    readyLocationId: `${a.id}-ready`, reserveLocationId: 'depot', ammunitionIds: [`legacy-${a.id}`], reloadServiceId: `${a.id}-reload` }));
  const session = attachMission(operation.resources, { sideId: 'ua', bindings });
  const origin = operation.resources.clockSeconds;
  const fired = new Set(), muted = new Set(); let serial = 0, finished = false;
  const requestId = () => `battle-${mission.id}-${++serial}`;
  const functional = (campaign, id) => campaign.inventory.components.some(c => c.id === id && ['operational', 'degraded'].includes(c.condition));
  const currentCondition = id => session.getCampaign().inventory.components.find(c => c.id === id)?.condition;
  const ended = () => !S.pending.length && S.threats.every(th => !th.alive) && S.ints.every(it => it.done) && S.hoj.every(it => it.done);

  function prepareCounters() {
    const campaign = session.getCampaign();
    for (const [u, a] of assetsByUnit) {
      const sm = DEFENSES[u.type].sam;
      const sensor = a.componentIds.find(id => id.endsWith('-sensor'));
      u.dmgRadar = !!sensor && ['degraded', 'disabled', 'destroyed'].includes(currentCondition(sensor));
      if (sensor && !functional(campaign, sensor)) { u.nextScan = Infinity; muted.add(u); }
      else if (muted.delete(u)) u.nextScan = S.t;
      if (!sm) continue;
      u.dmgLauncher = ['disabled', 'destroyed'].includes(currentCondition(`${a.id}-launcher`));
      const ready = session.ammunition(u.id)[0].ready;
      u.magLeft = a.componentIds.every(id => functional(campaign, id)) ? ready : 0;
      u.reserveLeft = 0; u.reloadUntil = null;
    }
  }
  function recordEffects() {
    // Normal shots, DRFM phantoms and home-on-jam all spend one canonical round.
    for (const it of [...S.ints, ...S.hoj]) if (!fired.has(it)) {
      const a = assetsByUnit.get(it.u); if (!a) throw Error('Disparo de unidad no asignada');
      session.fire({ requestId: requestId(), missionSeconds: S.t, unitId: it.u.id, ammunitionId: `legacy-${a.id}`, quantity: 1 });
      fired.add(it);
    }
    for (const [u, a] of assetsByUnit) {
      for (const id of a.componentIds) {
        const next = !u.alive ? 'destroyed' : id.endsWith('-launcher') && u.dmgLauncher ? 'disabled'
          : id.endsWith('-sensor') && u.dmgRadar ? 'degraded' : null;
        const previous = currentCondition(id);
        if (next && previous !== next && previous !== 'destroyed' && !(previous === 'disabled' && next === 'degraded')) {
          session.damage({ requestId: requestId(), missionSeconds: S.t, componentId: id, condition: next });
        }
      }
      const sm = DEFENSES[u.type].sam;
      if (!sm || !u.alive || u.active > 0 || !functional(session.getCampaign(), `${a.id}-launcher`)) continue;
      const stock = session.ammunition(u.id)[0];
      const busy = session.getCampaign().jobs.some(j => j.serviceId === `${a.id}-reload` && ['pending', 'interrupted'].includes(j.status));
      if (!busy && stock.ready === 0 && stock.reserve > 0) session.reload({ requestId: requestId(), missionSeconds: S.t,
        unitId: u.id, ammunitionId: stock.ammunitionId, quantity: Math.min(sm.mag, stock.reserve) });
    }
  }
  function finalize() {
    session.finish({ requestId: requestId(), missionSeconds: S.t });
    const result = evaluateGoals(S.scen, S).outcome.result;
    const assetOutcomes = mission.assets.map(a => {
      const obj = a.kind === 'unit' ? S.units.find(u => u.name === a.engineName) : S.objs.find(o => o.name === a.engineName);
      return { id: a.id, hp: obj ? Math.max(0, a.kind === 'unit' && !obj.alive ? 0 : obj.hp) : a.hp,
        x: obj?.x ?? a.x, y: obj?.y ?? a.y, mapKey: mission.mapKey, restoredByJobId: null };
    });
    operation = completeOperationMission(operation, { requestId: `debrief-${mission.id}`, resources: session.getCampaign(),
      result, assetOutcomes, intelligence: [{ id: `inspection-${mission.id}`, text: 'Inspección de la infraestructura y medios propios al terminar la guardia.',
        confidence: 'confirmed', sourceLabel: 'Parte propio de cierre', observedAtSeconds: origin + S.t, receivedAtSeconds: origin + S.t }],
      summary: 'La guardia terminó. El estado de los medios e infraestructura propios y la munición restante pasan a la siguiente misión.' });
    finished = true; active = null;
  }
  const bridge = {
    step() {
      if (finished) return false;
      const next = S.t + 0.25;
      const due = session.getCampaign().jobs.some(j => j.status === 'pending' && j.dueAtSeconds <= origin + next);
      if (due || Math.floor(next / 30) > Math.floor(S.t / 30)) session.advance({ missionSeconds: next });
      prepareCounters();
      try { setRandom(rng); step(0.25); } finally { setRandom(null); }
      recordEffects();
      if (ended()) finalize();
      return !finished;
    },
    getOperation() {
      if (!finished && session.getCampaign() !== operation.resources) operation = syncOperationResources(operation, session.getCampaign(), `checkpoint-${mission.id}-${++serial}`);
      return operation;
    },
    view() {
      // No threat type, future waypoint, hidden launch, true survival or enemy budget escapes here.
      const contacts = [];
      for (const th of S.threats) {
        const s = th.seen; if (!s) continue;
        const age = S.t - s.t; if (age < 0 || age > 90) continue;
        const q = th.seenPrev, dt = q ? s.t - q.t : 0;
        const lost = age > 12, k = lost ? 0 : age;
        contacts.push({ id: th.id, x: s.x + (dt > 0 ? (s.x - q.x) / dt : 0) * k,
          y: s.y + (dt > 0 ? (s.y - q.y) / dt : 0) * k, age, lost, classification: th.clsAs ?? null });
      }
      return deepFreeze({ finished, seconds: S.t, contacts, shots: session.getCampaign().inventory.totals.reduce((n, t) => n + t.expended, 0),
        units: [...assetsByUnit].map(([u, a]) => ({ id: a.id, name: u.name, x: u.x, y: u.y, hp: Math.max(0, u.alive ? u.hp : 0),
          ready: DEFENSES[u.type].sam ? session.ammunition(u.id)[0].ready : null })),
        objectives: S.objs.map(g => ({ name: g.name, x: g.x, y: g.y, hp: Math.max(0, g.hp), maxHp: g.maxHp })) });
    },
    map: () => MAP,
    release() { if (!finished) throw Error('Terminar la guardia antes de liberar el motor'); }
  };
  active = bridge;
  return bridge;
}
