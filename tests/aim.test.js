// Tiro sin omnisciencia (physics/track.js, physics/engagement.js#solve y #arrivalReach, docs/FISICA.md §6):
// la defensa apunta con la velocidad medida por su pista, no con la ruta futura del arma.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFENSES } from '../src/data/index.js';
import { setMap, flatMap } from '../src/physics/terrain.js';
import { buildThreat, posAt } from '../src/physics/kinematics.js';
import { solve, arrivalReach, trackKeys } from '../src/physics/engagement.js';
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

test('trackKeys: la velocidad sale solo de pistas que le llegan a la batería (propia, su red, su puesto)', () => {
  const pair = (x, t) => ({ s: { x, y: 40, z: 50, t }, q: { x: x - 0.24, y: 40, z: 50, t: t - 1 } });
  const th = { det: {}, net: { l16: { first: 0, last: 10 }, ua_c2: { first: 0, last: 10 } }, obs: { l16: pair(10, 10), ua_c2: pair(20, 10) } };
  const nasams = { id: 7, type: 'nasams', x: 40, y: 40, link: true };
  const keys = trackKeys(nasams, th, 10, 'coordinada');
  assert.deepEqual(keys, ['l16'], 'NASAMS: Link 16 sí, la red C2 ucraniana no (familia incompatible)');
  assert.equal(trackVel(th, keys).s.x, 10, 'la velocidad sale de esa pista, no de la de otra red');
  assert.deepEqual(trackKeys({ ...nasams, cp: 'B' }, th, 10, 'coordinada'), [], 'otro puesto de mando: ninguna');
  assert.equal(solve({ ...nasams, cp: 'B' }, th, 10, 1, []), null, 'sin pista que le llegue no hay solución');
  assert.deepEqual(trackKeys({ ...nasams, link: false }, th, 10, 'coordinada'), [], 'sin enlace: solo la propia (y no la tiene)');
  th.det[7] = 10; th.obs.u7 = pair(30, 10);
  assert.deepEqual(trackKeys({ ...nasams, link: false }, th, 10, 'coordinada'), ['u7'], 'su propio radar');
});

test('arrivalReach: conserva el alcance efectivo con que se planeó el tiro (el aspecto no se recalcula al llegar)', () => {
  setMap(flatMap(400, 400, 200));
  const u = unit('nasams', 40, 40), th = kal([[0, 40], [80, 40]]), maxR = DEFENSES.nasams.sam.maxR;
  // el blanco ya pasó y se aleja: con el aspecto real (de cola) el alcance efectivo es ≈60% de maxR
  const tt = th.ft * 0.5 + (0.75 * maxR) / (th.T.v / 1000); th.p = posAt(th, tt);
  assert.equal(arrivalReach(u, th, tt).ok, false, 'recalculado de cola: fuera');
  assert.ok(arrivalReach(u, th, tt, maxR).ok, 'con el alcance del plan (de frente): adentro');
});

test('arrivalReach: un cañón no tiene cuenta de energía al llegar (su ráfaga no corrige; el acierto está en la Pk)', () => {
  setMap(flatMap(400, 400, 200));
  const g = unit('gepard', 40, 40), maxR = DEFENSES.gepard.sam.maxR, th = kal([[0, 40], [40, 40]]);
  const tt = th.ft - (maxR * 1.0001) / (th.T.v / 1000); th.p = posAt(th, tt);   // apenas afuera del alcance
  assert.ok(arrivalReach(g, th, tt, maxR).ok, 'la ráfaga ya salida llega');
  const m = unit('nasams', 40, 40);
  th.p = posAt(th, 1); assert.equal(arrivalReach(m, th, 1, DEFENSES.nasams.sam.maxR).ok, false, 'un misil fuera de alcance, no');
});

test('una batería aborta su tiro cuando su pista muestra al blanco bajo su piso, y libera el blanco', async () => {
  const { runScenario } = await import('./helpers.js');
  const S = runScenario('gb_refineria', { seed: 1 });
  const ab = S.ints.filter(i => i.aborted != null);
  assert.ok(ab.length > 0, 'en la refinería hay Kalibr que bajan del piso de NASAMS o Patriot');
  for (const i of ab) {
    assert.ok(i.done && i.tH === i.aborted, 'termina en el instante del aborto');
    const s = i.th.obs && Object.values(i.th.obs).some(o => o.s && o.s.t <= i.aborted);
    assert.ok(s, 'lo decidió con una detección, no con la verdad');
  }
});
