// Niveles de integración del mando y control (data/c2.js, physics/engagement.js#trackOK y reactionStart).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { C2_LEVELS } from '../src/data/index.js';
import { trackOK, reactionStart } from '../src/physics/engagement.js';

// Pista vista por la red a los 100 s y por última vez a los 150 s; nunca por el radar propio de la unidad.
const th = { det: {}, firstDet: 100, lastNet: 150 };
const u = type => ({ id: 1, type });
const net = c2 => trackOK(u('irist'), th, 155, c2);       // IRIS-T: buscador IR, acepta pista de red
const radar = c2 => trackOK(u('s300'), th, 155, c2);      // S-300P: guiado TVM, necesita pista propia

test('C2: con pista solo de la red, quién puede disparar en cada nivel', () => {
  assert.deepEqual(Object.keys(C2_LEVELS).map(k => [k, net(k), radar(k)]), [
    ['desconectada', false, false],
    ['descoordinada', false, false],   // solo alerta
    ['coordinada', true, false],
    ['integrada', true, true]          // engage-on-remote
  ]);
});

test('C2: la pista de red vence después de la ventana y no llega antes de la demora', () => {
  assert.equal(trackOK(u('irist'), th, 150 + 12.1, 'coordinada'), false);
  assert.equal(trackOK(u('irist'), { det: {}, firstDet: 100, lastNet: 101 }, 101, 'integrada'), false);   // demora 2 s
});

test('C2: la alerta adelanta el tiempo de reacción en "descoordinada" e "integrada", no en las históricas', () => {
  assert.equal(reactionStart(th, 200, 'desconectada'), 200);
  assert.equal(reactionStart(th, 200, 'coordinada'), 200);
  assert.equal(reactionStart(th, 200, 'descoordinada'), 100 + C2_LEVELS.descoordinada.lag);
  assert.equal(reactionStart(th, 200, 'integrada'), 100 + C2_LEVELS.integrada.lag);
  assert.equal(reactionStart(th, 120, 'descoordinada'), 120);   // la alerta todavía no llegó
});
