// Casos aislados: importan el motor real, no una reimplementación.
// Los fixtures sintéticos modifican SOLO estado en memoria; no escriben catálogo ni fuentes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { moduleOf, root } from './context.mjs';
const { S } = await moduleOf('src/sim/state.js');
const { startSim, step, impact, damageUnits, damageJammers } = await moduleOf('src/sim/engine.js');
const { addDef, addObj, addSalvo, addJam } = await moduleOf('src/sim/setup.js');
const { setRandom, seeded } = await moduleOf('src/util/rng.js');
const { frameAt, recUnit } = await moduleOf('src/sim/replay.js');
const { contactOf, emitting } = await moduleOf('src/sim/contacts.js');
const { ewStep } = await moduleOf('src/sim/ew.js');
const { coverageGrid } = await moduleOf('src/physics/coverage.js');
const { damageAt } = await moduleOf('src/physics/damage.js');
const { THREATS, D, UNIT_TARGET, JAMMERS } = await moduleOf('src/data/index.js');
const { setMap, flatMap } = await moduleOf('src/physics/terrain.js');
const { exportScenario, validateScenario, loadScenarioData } = await moduleOf('src/sim/scenario-io.js');
const { createMonteCarlo } = await moduleOf('src/sim/montecarlo.js');
const { useMap, clearSetup } = await moduleOf('tests/helpers.js');
const { portCampaignDefinition } = await moduleOf('experimentos/catalogo-presupuesto/data/port-campaign.mjs');
const { createOperations } = await moduleOf('experimentos/catalogo-presupuesto/lib/operations.mjs');
const { startPortCombat } = await moduleOf('experimentos/catalogo-presupuesto/lib/port-combat.mjs');

function clean() { useMap('monterey', { flat: true }); clearSetup(); S.scen = null; setRandom(seeded(7)); }
function start() { startSim(); S.running = true; }
function complete() {
  for (let i = 0; i < 40000; i++) {
    step(0.25);
    if (!S.pending.length && S.threats.every(t => !t.alive) && S.ints.every(t => t.done) && S.hoj.every(t => t.done)) return;
  }
  throw Error('Fixture excedió 10.000 segundos simulados');
}
function combat(mode) {
  clean(); S.c2 = 'integrada'; addDef('nasams', 40, 40, { az: 0 });
  if (mode !== 'alone') addDef('gepard', 40, 40, { az: 0 });
  addSalvo({ type: 'shahed', count: 1, agl: 50, pts: [[40, 10], [40, 40]] }); start();
  const g = S.units.find(u => u.type === 'gepard');
  if (mode === 'launcher') g.dmgLauncher = true;
  if (mode === 'moving') g.mob = { phase: 'deploy', tReady: 2000 };
  if (mode === 'channels') g.active = D(g).sam.ch;
  if (mode === 'noAmmo') g.magLeft = g.reserveLeft = 0;
  if (mode === 'isolated') { g.c2 = 'desconectada'; g.link = false; g.emcon = 'silencio'; }
  if (mode === 'blind') { g.c2 = 'desconectada'; g.emcon = 'silencio'; }
  if (mode === 'dead') g.alive = false;
  complete();
  return { shots: S.stats.shots, killed: S.stats.killed, hits: S.stats.hits,
    nasamsShots: S.ints.filter(i => i.u.type === 'nasams').length,
    gepardShots: S.ints.filter(i => i.u.type === 'gepard').length, end: S.t };
}
const tiny = { ...THREATS.shahed, short: 'FIXTURE-1kg', cep: 0.001, hitR: 1000,
  info: { ...THREATS.shahed.info, warheadKg: 1 } };
function one() { clean(); addDef('nasams', 40, 40); start(); return S.units[0]; }
function jamScene() {
  clean(); S.c2 = 'coordinada'; addDef('nasams', 30, 10); addDef('nasams', 50, 10);
  addJam('soj', 40, 30, { alt: 8000 }); start();
}
function jsonFixture() {
  clean(); useMap('monterey'); addObj('fuel', 40, 40);
  const v = exportScenario(new Date('2026-10-12T00:00:00Z'));
  assert(validateScenario(v).ok, 'el JSON de control debe ser válido antes de mutarlo');
  return v;
}
const c = (id, audit, priority, location, expected, run) => ({ id, audit, priority, location, expected, run });
export const cases = [
  c('replay-initial-damage', 'F06', 'P2', 'src/sim/replay.js#frameAt', 'Replay(0) conserva el daño y HP iniciales.', () => {
    clean(); addDef('patriot', 40, 40, { hp: 120, dmgRadar: true }); addObj('fuel', 50, 50, { hp: 800, hpNow: 300 }); start();
    const live = { radar: S.units[0].dmgRadar, unitHp: S.units[0].hp, objectiveHp: S.objs[0].hp };
    const f = frameAt(0), historical = { radar: f.units[0].dmgRadar, unitHp: f.units[0].hp, objectiveHp: f.objs[0].hp };
    return { holds: JSON.stringify(live) === JSON.stringify(historical), observed: { live, historical } };
  }),
  c('replay-partial-hp', 'F06', 'P2', 'src/sim/engine.js#damageUnits; src/sim/replay.js#recUnit', 'Replay reproduce HP tras daño que no pierde componentes.', () => {
    const u = one(); S.t = 10; damageUnits(tiny, 40, 40); const f = frameAt(10);
    assert(u.hp < UNIT_TARGET.hp && u.alive, 'el fixture debe producir daño no letal');
    return { holds: f.units[0].hp === u.hp, observed: { liveHp: u.hp, historicalHp: f.units[0].hp ?? null, events: S.rec.units.length } };
  }),
  c('replay-reserve', 'N01', 'P2', 'src/sim/replay.js#recUnit', 'La reserva histórica no se pierde al reconstruir.', () => {
    const u = one(); S.t = 20; u.reserveLeft = 3; recUnit(u);
    return { holds: frameAt(20).units[0].reserveLeft === 3, observed: { expectedReserve: 3, reconstructedReserve: frameAt(20).units[0].reserveLeft ?? null } };
  }),
  c('replay-jammer', 'F07', 'P2', 'src/sim/replay.js#frameAt; src/sim/engine.js#damageJammers', 'El cuadro histórico contiene el estado del jammer antes/después del daño.', () => {
    clean(); addJam('lima', 40, 40); start(); const before = frameAt(0);
    S.t = 10; damageJammers(THREATS.isk_m, 40, 40); const after = frameAt(10);
    assert(S.jamsLive[0].dead, 'el fixture debe destruir el jammer');
    return { holds: before.jams?.[0]?.dead !== true && after.jams?.[0]?.dead === true,
      observed: { frameKeys: Object.keys(after), actualDead: S.jamsLive[0].dead, before: before.jams ?? null, after: after.jams ?? null } };
  }),
  c('same-observations', 'F08', 'P1', 'src/sim/contacts.js#contactOf', 'Mismas observaciones dan el mismo contacto hasta un nuevo reporte.', () => {
    const th = { alive: true, seenPrev: { x: 1, y: 1, z: 50, t: 9 }, seen: { x: 2, y: 1, z: 50, t: 10, by: 1 } };
    const a = contactOf(th, 11); th.alive = false; const b = contactOf(th, 11);
    return { holds: JSON.stringify(a) === JSON.stringify(b), observed: { aliveWorld: a, deadWorld: b } };
  }),
  ...['launcher', 'moving', 'channels', 'blind', 'isolated', 'noAmmo', 'dead'].map(mode =>
    c(`delegation-${mode}`, 'F01', 'P1', 'src/sim/engine.js#engage/reaches', 'Una capa indisponible no debe suprimir al NASAMS capaz de intervenir.', () => {
      const control = combat('alone'); assert(control.nasamsShots > 0, 'control NASAMS debe tirar');
      const pair = combat(mode); return { holds: pair.nasamsShots > 0, observed: { mode, control, pair } };
    })),
  c('delegation-operational-control', 'F01-control', 'CONTROL', 'src/sim/engine.js#engage', 'La capa barata operativa conserva su intervención.', () => {
    const observed = combat('operational'); return { holds: observed.gepardShots > 0 && observed.killed > 0, observed };
  }),
  c('targetunit-damage-equivalence', 'F02', 'P1', 'src/sim/engine.js#impact/damageUnits', 'Designación no cambia HP ni supervivencia de una explosión equivalente.', () => {
    function fall(designated) {
      clean(); const u = addDef('nasams', 40, 40); const sv = addSalvo({ type: 'shahed', pts: [[40, 39], [40, 40]], targetUnit: designated ? u.id : null });
      start(); const th = S.pending[0]; th.T = tiny; th.alive = true; th.targetUnit = designated ? S.units[0].id : null;
      setRandom(seeded(7)); impact(th); return { hp: S.units[0].hp, alive: S.units[0].alive, explosion: S.impacts[0] };
    }
    const a = fall(false), b = fall(true); assert.deepEqual(a.explosion, b.explosion, 'misma caída');
    return { holds: a.hp === b.hp && a.alive === b.alive, observed: { coordinates: a, targetUnit: b, calculatedDamage: damageAt(tiny, UNIT_TARGET, 0).dmg } };
  }),
  c('silent-radar-guide', 'F03', 'P1', 'src/sim/engine.js#solveFor; physics/engagement.js#trackOK', 'TVM no se emplea sin emisión necesaria ni encendido registrado.', () => {
    clean(); S.c2 = 'integrada'; addDef('s300', 40, 40, { az: 0, emcon: 'silencio' }); addDef('ewr', 40, 30);
    addSalvo({ type: 'shahed', count: 1, agl: 200, pts: [[40, 10], [40, 40]] }); start(); complete();
    const u = S.units[0], shots = S.ints.filter(i => i.u.id === u.id).length;
    return { holds: shots === 0 || u.emitFrom != null, observed: { shots, emitFrom: u.emitFrom ?? null, emitting: emitting(u, S.t), killed: S.stats.killed } };
  }),
  c('guide-silence-during-flight', 'F03-extensión', 'P1', 'src/sim/engine.js#step/resolución de interceptores', 'Apagar guía requerida durante vuelo impide continuar sin reactivación explícita.', () => {
    clean(); S.c2 = 'integrada'; addDef('s300', 40, 40, { az: 0 }); addDef('ewr', 40, 30);
    addSalvo({ type: 'shahed', agl: 200, pts: [[40, 10], [40, 40]] }); start();
    for (let n = 0; n < 4000 && !S.ints.length; n++) step(0.25);
    assert(S.ints.some(i => !i.done), 'el control debe lanzar antes de cortar emisión');
    const u = S.units[0], disabledAt = S.t; u.emcon = 'silencio'; complete();
    return { holds: !S.stats.killed || emitting(u, S.t), observed: { disabledAt, killed: S.stats.killed, emittingAtEnd: emitting(u, S.t), shots: S.stats.shots } };
  }),
  ...['s300', 'buk', 's125', 'nasams', 'irist', 'gepard'].map(type =>
    c(`guidance-class-${type}`, 'F03-matriz', 'P1', 'physics/engagement.js#trackOK; sim/engine.js#solveFor', 'Emisiones respetan la clase: activo/IR admite pista compatible; TVM/SARH/mando exige guía; cañón exige observación propia.', () => {
      function scene(silent) {
        clean(); S.c2 = 'integrada'; addDef(type, 40, 40, { az: 0, emcon: silent ? 'silencio' : 'siempre' });
        // Sensor de la misma familia y red nativa, sin rondas/reserva: no se
        // habilita una pasarela ni se atribuye compatibilidad nueva a hardware.
        addDef(type, 40, 30, { az: 0, mag: 0, reserve: 0, name: 'SENSOR-SIN-MUNICIÓN' });
        addSalvo({ type: 'shahed', agl: 200, pts: [[40, 10], [40, 40]] }); start(); complete();
        const u = S.units[0]; return { guide: D(u).sam.guid, shots: S.ints.filter(i => i.u === u).length,
          emissionRegistered: u.emitFrom != null, detectorShotCount: S.ints.filter(i => i.u === S.units[1]).length };
      }
      const control = scene(false), silent = scene(true);
      assert(control.shots > 0 && control.detectorShotCount === 0, 'control con emisión y sensor sin munición');
      const remoteAllowed = ['activo', 'IR'].includes(silent.guide);
      return { holds: remoteAllowed ? silent.shots > 0 : silent.shots === 0 || silent.emissionRegistered,
        observed: { type, control, silent, remoteAllowed } };
    })),
  c('gun-projectile-after-launcher-loss', 'N04', 'P1', 'src/sim/engine.js#resolución de interceptores; physics/engagement.js#RADAR_GUID', 'Una ráfaga ya disparada y no guiada no depende de la supervivencia posterior del lanzador.', () => {
    function shot(destroy) {
      clean(); addDef('gepard', 40, 40); addSalvo({ type: 'shahed', agl: 50, pts: [[40, 38], [40, 40]] }); start();
      for (let n = 0; n < 4000 && !S.ints.length; n++) step(0.25);
      assert(S.ints.some(i => !i.done), 'debe existir ráfaga en vuelo');
      const u = S.units[0], launch = S.ints[0].tL, arrival = S.ints[0].tH;
      u.alive = !destroy; u.nextEval = Infinity; u.nextScan = Infinity;
      // Resolver el único tiro sin diferencia aleatoria entre las dos ramas.
      // No cambia Pk ni catálogo. No se usa para estimar una tasa real.
      setRandom(() => 0); complete();
      return { killed: S.stats.killed, shots: S.stats.shots, launch, arrival,
        guidanceLog: S.log.filter(l => /guía|autodestrucción/.test(l.msg)).map(l => l.msg) };
    }
    const alive = shot(false), destroyedAfterFiring = shot(true);
    assert(alive.killed === 1 && alive.shots === 1, 'control: un único tiro resuelve con acierto');
    return { holds: destroyedAfterFiring.killed === alive.killed, observed: { alive, destroyedAfterFiring } };
  }),
  c('hoj-channel-capacity', 'F04', 'P1', 'src/sim/ew.js#ewStep', 'HOJ no supera canales ya ocupados.', () => {
    jamScene(); for (const u of S.units) u.active = D(u).sam.ch; ewStep(0);
    return { holds: S.units.every(u => u.active <= D(u).sam.ch), observed: { shots: S.hoj.length, channels: S.units.map(u => ({ active: u.active, limit: D(u).sam.ch })) } };
  }),
  c('hoj-pending-completion', 'F05', 'P1', 'src/sim/engine.js#step', 'Una corrida sigue activa mientras HOJ válido está en vuelo.', () => {
    jamScene(); ewStep(0); assert(S.hoj.length > 0, 'control HOJ debe lanzar');
    const arrival = S.hoj[0].tH; step(0.25);
    return { holds: S.running && !S.hoj[0].done, observed: { t: S.t, arrival, running: S.running, done: !!S.hoj[0].done } };
  }),
  c('hoj-montecarlo-completion', 'F05-extensión', 'P1', 'src/sim/montecarlo.js#ended', 'MC no termina antes de la llegada del HOJ que lanzó en esa misma preparación/semilla.', () => {
    jamScene(); addSalvo({ type: 'shahed', pts: [[5, 5], [5, 5.1]], agl: 50 });
    setRandom(seeded(7)); start(); complete();
    assert(S.hoj.length > 0, 'el escenario debe generar HOJ real');
    const earliestArrival = S.hoj[0].tH, normalEnd = S.t;
    const mc = createMonteCarlo({ runs: 1, seed: 7, sample: false }); while (!mc.tick(1e9));
    const r = mc.results[0];
    return { holds: r.t >= earliestArrival, observed: { earliestHojArrival: earliestArrival, normalEndIncludingEffects: normalEnd, mcEnd: r.t, mcShots: r.shots } };
  }),
  c('replay-hoj-flight', 'F07', 'P2', 'src/sim/replay.js#frameAt', 'Replay muestra el interceptor HOJ pendiente.', () => {
    jamScene(); ewStep(0); assert(S.hoj.length > 0);
    const f = frameAt(1); const observed = { liveHoj: S.hoj.filter(h => !h.done).length, replayInts: f.ints.length, replayHoj: f.hoj?.length ?? null };
    return { holds: f.ints.length + (f.hoj?.length || 0) >= observed.liveHoj, observed };
  }),
  c('ew-silence-localization', 'N02', 'P1', 'src/sim/ew.js#strobes', 'Si emisión es necesaria, debe registrarse; distinguir recepción pasiva deliberada.', () => {
    jamScene(); for (const u of S.units) u.emcon = 'silencio'; ewStep(0);
    return { holds: !S.hoj.length, observed: { hoj: S.hoj.length, fix: S.jamsLive[0].fix ?? null,
      emissions: S.units.map(u => ({ emitting: emitting(u, 0), emitFrom: u.emitFrom ?? null })) },
      designQuestion: 'La recepción pasiva puede ser intencional: revisar contrato antes de declarar esto bug.' };
  }),
  c('coverage-silent-moving', 'F10', 'P2', 'src/physics/coverage.js#coverageGrid', 'Cobertura operacional excluye radar sin emitir/trasladándose, o se etiqueta como potencial.', () => {
    const u = one(); setMap(flatMap(100, 100, 200)); u.x = u.y = 10; u.emcon = 'silencio';
    const a = coverageGrid([u], [], THREATS.shahed, 50); u.mob = { phase: 'deploy', tReady: 100 };
    const b = coverageGrid([u], [], THREATS.shahed, 50); const count = v => v.reduce((n, x) => n + (x > 0), 0);
    return { holds: count(a) === 0 && count(b) === 0, observed: { silentCells: count(a), movingCells: count(b), emitting: emitting(u, 0) } };
  }),
  c('json-own-catalog-keys', 'F11', 'P2', 'src/sim/scenario-io.js#validateScenario', 'Los tipos heredados del prototipo se rechazan.', () => {
    const rows = [];
    for (const type of ['constructor', 'toString', '__proto__']) { const v = jsonFixture(); v.setup.objs[0].type = type; const r = validateScenario(v); rows.push({ type, accepted: r.ok, errors: r.errors }); }
    return { holds: rows.every(r => !r.accepted), observed: rows };
  }),
  c('json-hp-over-max', 'F11', 'P2', 'src/sim/scenario-io.js#validateScenario/loadScenarioData', 'HP mayor al máximo se rechaza explícitamente.', () => {
    const v = jsonFixture(); v.setup.objs[0].maxHp = 800; v.setup.objs[0].hpNow = 99999;
    const r = validateScenario(v); let loaded = null;
    if (r.ok) { loadScenarioData(r.data); start(); loaded = S.objs[0].hp; }
    return { holds: !r.ok, observed: { accepted: r.ok, requested: 99999, loaded, errors: r.errors } };
  }),
  c('json-invalid-atomic', 'F11-control', 'CONTROL', 'src/sim/scenario-io.js#validateScenario', 'Rechazo de referencia rota no muta preparación.', () => {
    const v = jsonFixture(), before = JSON.stringify(S.setup); v.setup.salvos = [{ id: 999, type: 'shahed', count: 1, interval: 0, agl: 50, pts: [[40, 30], [40, 40]], targetObj: 123456 }];
    const r = validateScenario(v); return { holds: !r.ok && before === JSON.stringify(S.setup), observed: { accepted: r.ok, unchanged: before === JSON.stringify(S.setup), errors: r.errors } };
  }),
  c('json-degenerate-route', 'F11', 'P2', 'src/sim/scenario-io.js#validateScenario', 'Ruta de longitud cero se rechaza, no crea vuelos inválidos.', () => {
    const v = jsonFixture(); v.setup.salvos = [{ id: 999, type: 'shahed', count: 1, interval: 0, agl: 50, pts: [[40, 40], [40, 40]] }];
    const r = validateScenario(v); return { holds: !r.ok, observed: { accepted: r.ok, errors: r.errors } };
  }),
  c('json-degenerate-flight-consumer', 'N03/F11', 'P2', 'src/sim/scenario-io.js → src/physics/kinematics.js → sim/engine.js', 'Un JSON aceptado no produce fecha de vuelo NaN al ser consumido.', () => {
    const v = jsonFixture(); v.setup.salvos = [{ id: 999, type: 'shahed', count: 1, interval: 0, agl: 50, pts: [[40, 40], [40, 40]] }];
    const r = validateScenario(v); if (!r.ok) return { holds: true, observed: { rejected: true, errors: r.errors } };
    loadScenarioData(r.data); start(); const th = S.pending[0];
    return { holds: Number.isFinite(th.ft), observed: { accepted: true, finiteFlight: Number.isFinite(th.ft), flightSeconds: Number.isFinite(th.ft) ? th.ft : String(th.ft) } };
  }),
  c('json-aggregate-work', 'F11', 'P2', 'src/sim/scenario-io.js#validateScenario', 'El validador identifica costo total, no solo límites por lista.', () => {
    const v = jsonFixture(); v.setup.salvos = Array.from({ length: 500 }, (_, i) => ({ id: 1000 + i, type: 'shahed', count: 500, interval: 0, agl: 50, pts: [[40, 30], [40, 40]] }));
    const r = validateScenario(v); return { holds: !r.ok, observed: { accepted: r.ok, totalThreats: 250000, errors: r.errors,
      note: 'No se ejecutan 250000 amenazas. No se propone aquí un límite seguro arbitrario.' } };
  }),
  c('campaign-ci-dependencies', 'F12', 'P2', '.github/workflows/catalogo-presupuesto.yml', 'CI experimental se activa al cambiar dependencias de producción.', () => {
    const src = readFileSync(join(root, '.github/workflows/catalogo-presupuesto.yml'), 'utf8');
    return { holds: /['"]src\//.test(src) || !src.includes('paths:'), observed: { paths: [...src.matchAll(/- ['"]([^'"]+)['"]/g)].map(m => m[1]) }, kind: 'static-workflow-inspection' };
  }),
  c('mission-mc-equivalence-control', 'F12-control', 'CONTROL', 'src/sim/montecarlo.js#runBatch', 'Sin muestreo, misión y MC coinciden en reglas/semilla equivalentes.', () => {
    const live = combat('alone');
    const mc = createMonteCarlo({ runs: 1, seed: 7, sample: false });
    while (!mc.tick(1e9));
    const r = mc.results[0]; return { holds: r.shots === live.shots && r.intercepted === live.killed && r.impacts === live.hits,
      observed: { live, mc: { shots: r.shots, killed: r.intercepted, hits: r.impacts, end: r.t } } };
  }),
  c('campaign-mission-equivalence-control', 'F12-control', 'CONTROL', 'experimentos/catalogo-presupuesto/lib/port-combat.mjs', 'Puente y misión normal coinciden con mismos medios, reglas y semilla; no se compara contra defensa distinta.', () => {
    clean(); const op = createOperations(portCampaignDefinition(['radar'])); const battle = startPortCombat(op, 7);
    const setup = structuredClone(S.setup), scen = S.scen;
    const rules = Object.fromEntries(['c2', 'doctrine', 'weather', 'tod', 'wind', 'wxPlan', 'gateways', 'fireRange', 'ignoreDecoys'].map(k => [k, structuredClone(S[k])]));
    let steps = 0; while (battle.step()) { if (++steps > 40000) throw Error('El puente no terminó'); }
    const projection = () => ({ shots: S.stats.shots, hits: S.stats.hits, killed: S.stats.killed, damage: S.stats.damage,
      objectives: S.objs.map(o => ({ name: o.name, hp: o.hp })) });
    const campaign = projection(), resources = battle.getOperation().resources;
    clearSetup(); S.setup = setup; S.scen = scen; Object.assign(S, rules); setRandom(seeded(7)); start(); complete();
    const normal = projection();
    return { holds: JSON.stringify(campaign) === JSON.stringify(normal), observed: { campaign, normal,
      stockExpended: resources.inventory.totals.reduce((n, t) => n + t.expended, 0),
      note: 'Control sin lanzadores: evita introducir recargas distintas y aisla el puente/daño/fin.' } };
  })
];
export function cleanup() { setRandom(null); }
