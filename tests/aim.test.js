// Tiro sin omnisciencia (physics/track.js, physics/engagement.js#solve y #arrivalReach, docs/FISICA.md §6):
// la defensa apunta con la velocidad medida por su pista, no con la ruta futura del arma.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFENSES } from '../src/data/index.js';
import { setMap, flatMap } from '../src/physics/terrain.js';
import { buildThreat, posAt } from '../src/physics/kinematics.js';
import { solve, arrivalReach } from '../src/physics/engagement.js';
import { trackVel, predictAt, PRED_FLOOR } from '../src/physics/track.js';
import { seeTrack } from './helpers.js';

const unit = (type, x, y) => ({ id: 1, type, x, y, az: 0, mast: DEFENSES[type].radar?.mast ?? 2 });
const kal = pts => buildThreat({ id: 9, type: 'kalibr', count: 1, pts, agl: 50 }, 0, 0);

test('trackVel: sin dos detecciones (o muy separadas) no hay velocidad ni solución de tiro', () => {
  setMap(flatMap(400, 400, 200));
  const th = kal([[0, 40], [40, 40]]), u = unit('nasams', 40, 40);
  th.seen = { x: 10, y: 40, z: 50, t: 50 }; th.seenPrev = null;
  assert.equal(trackVel(th), null);
  assert.equal(solve(u, th, 50), null, 'con un solo eco no se dispara');
  th.seenPrev = { x: 5, y: 40, z: 50, t: 20 };
  assert.equal(trackVel(th), null, 'hueco mayor que VEL_GAP: la pista se reinicia');
});

test('predictAt: línea recta con la velocidad medida, altura sobre el terreno, nunca bajo PRED_FLOOR', () => {
  setMap(flatMap(400, 400, 200));
  const th = kal([[0, 40], [40, 40]]);
  th.seenPrev = { x: 10, y: 40, z: 300, t: 9 }; th.seen = { x: 10.24, y: 40, z: 200, t: 10 };
  const v = trackVel(th); assert.ok(v);
  const p = predictAt(v, 11);
  assert.ok(Math.abs(p.x - 10.48) < 1e-9 && Math.abs(p.z - 100) < 1e-9);
  assert.equal(predictAt(v, 20).z, PRED_FLOOR, 'una pista que baja no se predice bajo tierra');
});

test('un blanco que gira después del disparo se escapa; uno que sigue derecho, no', () => {
  setMap(flatMap(400, 400, 200));
  const u = unit('nasams', 40, 40);
  const straight = kal([[0, 40], [40, 40]]), turn = kal([[0, 40], [8, 40], [8, 0]]);
  // primer disparo posible con la pista del blanco recto; el que gira tiene la misma pista hasta el giro
  let t = 0, sol = null;
  for (; t < 30 && !sol; t++) sol = solve(u, seeTrack(straight, t), t);
  assert.ok(sol, 'tiene que haber solución'); t--;
  const s2 = solve(u, seeTrack(turn, t), t); assert.ok(s2, 'la pista es la misma: la defensa dispara igual');
  const tH = t + s2.tau;
  straight.p = posAt(straight, tH); turn.p = posAt(turn, tH);
  assert.ok(arrivalReach(u, straight, tH).ok, 'derecho: llega');
  assert.equal(arrivalReach(u, turn, tH).ok, false, 'giró: queda fuera de lo que cubre la energía del misil');
  assert.ok(Math.hypot(turn.p.x - s2.p.x, turn.p.y - s2.p.y) > 1, 'el que giró no está donde se lo esperaba');
});

test('arrivalReach: fuera del alcance cinemático en la llegada, no lo alcanza', () => {
  setMap(flatMap(400, 400, 200));
  const u = unit('nasams', 40, 40), th = kal([[0, 40], [40, 40]]);
  th.p = posAt(th, 1);   // a ~40 km, más allá del maxR del NASAMS
  assert.equal(arrivalReach(u, th, 1).ok, false);
  th.p = posAt(th, th.ft - 60);
  assert.ok(arrivalReach(u, th, th.ft - 60).ok);
});

test('balísticos: la trayectoria la fija la física, el tiro no necesita pista medida', () => {
  setMap(flatMap(400, 400, 200));
  const u = unit('patriot', 40, 40);
  const th = buildThreat({ id: 3, type: 'isk_m', count: 1, pts: [[40, 0], [40, 40]], launchDist: 300 }, 0, 0);
  th.seen = th.seenPrev = null;
  let sol = null; for (let t = 0; t < th.ft && !sol; t++) sol = solve(u, th, t);
  assert.ok(sol, 'sin pista medida igual hay solución');
  assert.equal(sol.v, null);
});
