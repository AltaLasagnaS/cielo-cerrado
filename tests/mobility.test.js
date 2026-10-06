// Movilidad (sim/mobility.js, docs/FISICA.md §12): repliegue → tránsito → despliegue con tiempos de la
// ficha; sin datos no hay traslado; trasladándose no detecta ni dispara; el atacante la sigue viendo donde
// la ubicó; un ataque a la posición vieja no la destruye.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { DEFENSES } from '../src/data/index.js';
import { setMap, flatMap } from '../src/physics/terrain.js';
import { setRandom, seeded } from '../src/util/rng.js';
import { S } from '../src/sim/state.js';
import { startSim, step } from '../src/sim/engine.js';
import { addDef, addSalvo } from '../src/sim/setup.js';
import { orderMove, cantMove, MOB_PHASE } from '../src/sim/mobility.js';
import { asAttackerSees } from '../src/sim/contacts.js';
import { validateScenario, exportScenario } from '../src/sim/scenario-io.js';
import { clearSetup, runCurrent, useMap } from './helpers.js';

// datos de prueba (no son del catálogo: la ficha real todavía no tiene movilidad)
const FIX = { stowS: 300, deployS: 600, kmh: 36 };
const saved = DEFENSES.nasams.mob;
after(() => { if (saved === undefined) delete DEFENSES.nasams.mob; else DEFENSES.nasams.mob = saved; });

const until = T => { while (S.t < T - 1e-9) step(0.25); };
function setupOne() { setMap(flatMap(200, 200, 200)); clearSetup(); return addDef('nasams', 50, 50, { name: 'N-1' }); }

test('sin datos de despliegue y repliegue la unidad no se puede mover (no se inventa un valor)', () => {
  delete DEFENSES.nasams.mob;
  setupOne(); setRandom(seeded(1)); startSim(); setRandom(null);
  const u = S.units[0];
  assert.match(cantMove(u), /no hay datos de despliegue/);
  assert.match(orderMove(u, [[60, 50]]), /no hay datos/);
  assert.ok(!u.mob);
});

test('las tres fases terminan en instantes fijos y la posición avanza a la velocidad de la ficha', () => {
  DEFENSES.nasams.mob = { ...FIX };
  setupOne(); setRandom(seeded(1)); startSim();
  const u = S.units[0];
  assert.equal(orderMove(u, [[56, 50]]), null);   // 6 km a 36 km/h = 600 s
  until(299); assert.equal(u.mob.phase, 'stow'); assert.equal(u.x, 50);
  until(600); assert.equal(u.mob.phase, 'move'); assert.ok(Math.abs(u.x - 53) < 1e-9, 'a la mitad del tramo: ' + u.x);
  until(900); assert.equal(u.mob.phase, 'deploy'); assert.equal(u.x, 56);
  until(1499); assert.ok(u.mob, 'todavía desplegando');
  until(1500); assert.equal(u.mob, null, 'operativa a los 300 + 600 + 600 s');
  setRandom(null);
  assert.equal(MOB_PHASE.move, 'en tránsito');
});

test('no se traslada con misiles en vuelo ni dos veces a la vez', () => {
  DEFENSES.nasams.mob = { ...FIX };
  setupOne(); setRandom(seeded(1)); startSim(); setRandom(null);
  const u = S.units[0];
  u.active = 1; assert.match(cantMove(u), /misiles en vuelo/);
  u.active = 0; assert.equal(orderMove(u, [[60, 50]]), null);
  assert.match(cantMove(u), /ya se está trasladando/);
});

/** Un dron que pasa por arriba de la batería a los ~10–20 min. */
function droneOver(target) { addSalvo({ type: 'shahed', count: 1, tStart: 0, pts: [[50, 0], [50, 100]], ...target }); }

test('trasladándose no detecta ni dispara', () => {
  DEFENSES.nasams.mob = { ...FIX };
  setupOne(); droneOver({});
  const run = move => runCurrent(3, move ? s => { s.units[0].moves = [{ t: 0, pts: [[51, 50]] }]; } : null);
  const still = run(false), shotsStill = still.stats.shots, detStill = still.threats[0].firstDet;
  assert.ok(shotsStill > 0 && detStill != null, 'quieta, la batería lo ve y le tira');
  DEFENSES.nasams.mob = { stowS: 300, deployS: 7200, kmh: 36 };   // queda desplegando toda la corrida
  setupOne(); droneOver({});
  const moved = run(true);
  assert.equal(moved.threats[0].det[moved.units[0].id], undefined, 'su radar no lo vio');
  assert.equal(moved.stats.shots, 0, 'no disparó');
});

test('el atacante la sigue viendo donde la ubicó hasta que emite desde el lugar nuevo', () => {
  DEFENSES.nasams.mob = { ...FIX };
  setupOne(); setRandom(seeded(1)); startSim();
  const u = S.units[0];
  until(10); assert.equal(asAttackerSees(u, S.t).x, 50, 'emitió: el atacante la ubicó');
  orderMove(u, [[56, 50]]);
  until(1200); assert.equal(asAttackerSees(u, S.t).x, 50, 'en el destino, pero sin emitir todavía');
  until(1520); assert.equal(asAttackerSees(u, S.t).x, 56, 'emitió desde el lugar nuevo');
  assert.equal(asAttackerSees(u, 1200).x, 50, 'la historia se conserva (repetición)');
  setRandom(null);
});

test('un ataque planeado contra su posición vieja no la destruye si se fue', () => {
  // un Kalibr contra la batería (tarda ~27 min); quieta la destruye, trasladada a 3 km no
  const strike = move => {
    DEFENSES.nasams.mob = { ...FIX };
    setupOne(); addSalvo({ type: 'kalibr', count: 1, tStart: 0, pts: [[50, 199], [50, 60], [50, 50]], targetUnit: 'N-1' });
    return runCurrent(7, s => { s.units[0].emcon = 'silencio'; if (move) s.units[0].moves = [{ t: 0, pts: [[53, 50]] }]; });
  };
  const still = strike(false);
  assert.equal(still.units[0].alive, false, 'quieta: el impacto la destruye');
  const moved = strike(true);
  assert.equal(moved.units[0].alive, true, 'se fue: el impacto cae donde estaba');
  assert.equal(moved.units[0].x, 53);
});

test('scenario-io: los traslados programados se validan y viajan con la defensa', () => {
  useMap('odesa'); clearSetup();
  const u = addDef('nasams', 50, 50, { name: 'N-1' }); u.moves = [{ t: 60, pts: [[55, 50], [55, 55]] }];
  const ok = JSON.parse(JSON.stringify(exportScenario()));
  const r = validateScenario(ok);
  assert.ok(r.ok, JSON.stringify(r.errors));
  assert.deepEqual(r.data.setup.defs[0].moves, [{ t: 60, pts: [[55, 50], [55, 55]] }]);
  ok.setup.defs[0].moves = [{ t: 60, pts: [] }, { t: 10, pts: [[1, 1]] }];
  const bad = validateScenario(ok);
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some(e => /entre 1 y 50 puntos/.test(e)) && bad.errors.some(e => /orden de tiempo/.test(e)), bad.errors.join(' | '));
});
