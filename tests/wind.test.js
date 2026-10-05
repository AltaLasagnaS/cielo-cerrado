// Viento sobre drones y misiles de crucero (physics/kinematics.js#groundSpeed, docs/FISICA.md §1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS, THREATS, ENV } from '../src/data/index.js';
import { windAt } from '../src/physics/weather.js';
import { groundSpeed, buildThreat } from '../src/physics/kinematics.js';
import { S } from '../src/sim/state.js';
import { applyScenario } from '../src/sim/setup.js';
import { exportScenario, validateScenario, loadScenarioData } from '../src/sim/scenario-io.js';
import { useMap, clearSetup } from './helpers.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('groundSpeed: de frente resta, de cola suma, cruzado corrige la deriva; sin viento no cambia nada', () => {
  // tramo hacia el este (ux = 1): viento DESDE el este (90°) es de frente, desde el oeste (270°) de cola
  close(groundSpeed(50, 1, 0, { v: 10, from: 90 }), 40, 1e-9, 'de frente');
  close(groundSpeed(50, 1, 0, { v: 10, from: 270 }), 60, 1e-9, 'de cola');
  close(groundSpeed(50, 1, 0, { v: 30, from: 0 }), 40, 1e-9, 'cruzado: √(50² − 30²)');
  // tramo hacia el norte (y negativa en el mapa): viento desde el norte es de frente
  close(groundSpeed(50, 0, -1, { v: 10, from: 0 }), 40, 1e-9, 'hacia el norte con viento del norte');
  assert.equal(groundSpeed(50, 1, 0, null), 50);
  assert.equal(groundSpeed(50, 1, 0, { v: 0, from: 90 }), 50);
  assert.equal(groundSpeed(50, 1, 0, { v: 60, from: 0 }), 5, 'cruzado mayor que su velocidad: acotado a 0,1·v');
});

test('buildThreat: el viento alarga o acorta el vuelo de un Shahed y casi no toca a un misil de crucero', () => {
  useMap('monterey', { flat: true }); clearSetup();
  const sv = (type) => ({ id: 1, type, count: 1, pts: [[0, 50], [60, 50]] });   // 60 km hacia el este
  const ft = (type, wind) => buildThreat(sv(type), 0, 0, wind).ft;
  const calm = ft('shahed'), head = ft('shahed', { v: 10, from: 90 }), tail = ft('shahed', { v: 10, from: 270 });
  close(calm, 60000 / THREATS.shahed.v, 1e-6, 'sin viento, como antes');
  const w = windAt(10, THREATS.shahed.agl);   // el viento a la altura de vuelo del Shahed
  assert.ok(w > 10, 'arriba sopla más que en superficie');
  close(head, 60000 / (THREATS.shahed.v - w), 1e-6, 'de frente');
  close(tail, 60000 / (THREATS.shahed.v + w), 1e-6, 'de cola');
  const k = ft('kalibr', { v: 10, from: 90 }) / ft('kalibr');
  assert.ok(k > 1 && k < 1.08, `Kalibr con 10 m/s de frente en superficie (≈12 m/s a su altura): ×${k.toFixed(3)}`);
  assert.ok(head / calm > 1.2, 'al Shahed le pesa mucho más');
});

test('buildThreat: cada tramo de la ruta tiene su propio efecto', () => {
  useMap('monterey', { flat: true }); clearSetup();
  // ida al este 30 km y vuelta al oeste 30 km con viento del este: tarda más que en calma
  const th = buildThreat({ id: 1, type: 'shahed', count: 1, pts: [[10, 50], [40, 50], [10, 50.001]] }, 0, 0, { v: 10, from: 90 });
  const v = THREATS.shahed.v, w = windAt(10, THREATS.shahed.agl);
  close(th.ft, 30000 / (v - w) + 30000 / (v + w), 1e-3, 'ida de frente, vuelta de cola');
  assert.ok(th.ft > 60000 / v, 'ida y vuelta con viento siempre tarda más que en calma');
});

test('viento con la altura: ley de potencia 1/7 en la capa límite', () => {
  close(windAt(10, 10), 10, 1e-12, 'a 10 m, el de superficie');
  close(windAt(10, 2), 10, 1e-12, 'debajo de 10 m no baja más');
  close(windAt(10, 1000), 10 * Math.pow(100, ENV.modelo.windAlpha), 1e-9, 'a 1.000 m');
  assert.ok(windAt(10, 5000) > windAt(10, ENV.modelo.windTop), 'arriba de la capa límite sigue creciendo (perfil de Kiev)');
  assert.ok(windAt(10, 1000) / 10 > 1.8 && windAt(10, 1000) / 10 < 2.0, 'con 1/7, ≈1,9 veces');
});

test('buildThreat: los balísticos y los lanzados desde fuera del mapa no cambian con el viento', () => {
  useMap('monterey', { flat: true }); clearSetup();
  for (const type of ['isk_m', 'kinzhal', 'kab']) {
    const sv = { id: 1, type, count: 1, pts: [[50, 0], [50, 60]] };
    assert.equal(buildThreat(sv, 0, 0, { v: 25, from: 0 }).ft, buildThreat(sv, 0, 0).ft, type);
  }
});

test('rules.wind: se guarda, se carga, se valida y un escenario sin viento queda en calma', () => {
  useMap('monterey'); clearSetup(); applyScenario(SCENARIOS.mb_noche);
  assert.deepEqual(S.wind, { v: 0, from: 0 });
  S.wind = { v: 12, from: 225 };
  const file = JSON.parse(JSON.stringify(exportScenario(new Date(0))));
  assert.deepEqual(file.rules.wind, { v: 12, from: 225 });
  clearSetup();
  const res = validateScenario(file); assert.ok(res.ok, res.errors.join('\n'));
  loadScenarioData(res.data); assert.deepEqual(S.wind, { v: 12, from: 225 });
  file.rules.wind = { v: 50, from: 0 };
  assert.match(validateScenario(file).errors.join('\n'), /rules\.wind\.v/);
  file.rules.wind = 'fuerte';
  assert.match(validateScenario(file).errors.join('\n'), /rules\.wind/);
  delete file.rules.wind;
  const old = validateScenario(file); assert.ok(old.ok, old.errors.join('\n'));
  loadScenarioData(old.data); assert.deepEqual(S.wind, { v: 0, from: 0 }, 'archivo viejo sin viento: calma');
});
