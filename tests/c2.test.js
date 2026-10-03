// Niveles de integración del mando y control (data/c2.js, physics/engagement.js#trackOK y reactionStart).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { C2_LEVELS } from '../src/data/index.js';
import { trackOK, reactionStart, effectiveC2 } from '../src/physics/engagement.js';
import { S } from '../src/sim/state.js';
import { addDef, addSalvo } from '../src/sim/setup.js';
import { useMap, clearSetup, runCurrent } from './helpers.js';

// Pista vista por la red a los 100 s y por última vez a los 150 s; nunca por el radar propio de la unidad.
const th = { det: {}, firstDet: 100, netFirst: 100, lastNet: 150 };
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
  assert.equal(trackOK(u('irist'), { det: {}, firstDet: 100, netFirst: 100, lastNet: 101 }, 101, 'integrada'), false);   // demora 2 s
});

test('C2: la alerta adelanta el tiempo de reacción en "descoordinada" e "integrada", no en las históricas', () => {
  assert.equal(reactionStart(th, 200, 'desconectada'), 200);
  assert.equal(reactionStart(th, 200, 'coordinada'), 200);
  assert.equal(reactionStart(th, 200, 'descoordinada'), 100 + C2_LEVELS.descoordinada.lag);
  assert.equal(reactionStart(th, 200, 'integrada'), 100 + C2_LEVELS.integrada.lag);
  assert.equal(reactionStart(th, 120, 'descoordinada'), 120);   // la alerta todavía no llegó
});

test('C2: los cañones (Gepard, grupos móviles) siempre necesitan ver el blanco con su propio sensor', () => {
  for (const k of Object.keys(C2_LEVELS)) for (const type of ['gepard', 'mfg']) assert.equal(trackOK(u(type), th, 155, k), false, `${type} ${k}`);
  assert.equal(trackOK(u('gepard'), { ...th, det: { 1: 154 } }, 155, 'integrada'), true);
});

test('C2 integrada: un guiado por radar no lanza con pista ajena si su sector no cubre el punto de encuentro', () => {
  // S-300P mirando al norte (sector 90°); el Kh-22 viene del sur y lo ve solo el radar 3D de la red
  const shots = az => {
    useMap('monterey', { flat: true }); clearSetup(); S.c2 = 'integrada';
    addDef('s300', 50, 50, { name: 'S', az }); addDef('ewr', 50, 52, { name: 'R' });
    addSalvo({ type: 'kh22', count: 2, interval: 30, pts: [[50, 110], [50, 52]] });
    runCurrent(3); return S.stats.byUnit.S || 0;
  };
  assert.equal(shots(0), 0);          // de espaldas: no dispara aunque la red tenga la pista
  assert.ok(shots(180) > 0);          // de frente: dispara
});

test('C2: una unidad sin enlace de datos no recibe pistas de la red ni alertas', () => {
  const off = { id: 1, type: 'irist', link: false };
  for (const k of Object.keys(C2_LEVELS)) assert.equal(trackOK(off, th, 155, k), false, k);
  assert.equal(trackOK(off, { ...th, det: { 1: 154 } }, 155, 'coordinada'), true);   // con su propio radar, sí
  assert.equal(reactionStart(th, 200, 'integrada', off), 200);
});

test('C2: una detección de un sensor sin enlace no alimenta la red', () => {
  const run = link => {
    useMap('monterey', { flat: true }); clearSetup();
    addDef('ewr', 50, 20, { name: 'R' }); addDef('irist', 50, 60, { name: 'I' });
    S.setup.defs.find(d => d.name === 'R').link = link;
    addSalvo({ type: 'kh22', count: 1, pts: [[50, 0], [50, 59]] });
    runCurrent(2); return S.threats[0];
  };
  assert.ok(run(true).netFirst !== null);
  const th2 = run(false); assert.ok(th2.firstDet !== null);
  assert.ok(th2.netFirst === null || th2.netFirst > th2.firstDet);   // la red se entera recién cuando lo ve el IRIS-T
});

test('C2: el puesto de mando y las comunicaciones destruidos bajan el nivel efectivo', () => {
  const g = (type, status) => ({ type, status });
  assert.equal(effectiveC2('integrada', []), 'integrada');
  assert.equal(effectiveC2('integrada', [g('command', 'damaged')]), 'integrada');
  assert.equal(effectiveC2('integrada', [g('command', 'destroyed')]), 'desconectada');
  assert.equal(effectiveC2('integrada', [g('comms', 'destroyed')]), 'coordinada');
  assert.equal(effectiveC2('coordinada', [g('comms', 'destroyed'), g('comms', 'destroyed'), g('comms', 'destroyed')]), 'desconectada');
});

test('C2 integrada: defensa por capas, el NASAMS le deja los drones al Gepard que los espera más adelante', () => {
  const shooters = c2 => {
    useMap('monterey', { flat: true }); clearSetup(); S.c2 = c2;
    addDef('nasams', 50, 62, { name: 'N' }); addDef('gepard', 49, 60, { name: 'G' }); addDef('ewr', 52, 60, { name: 'R' });
    addSalvo({ type: 'shahed', count: 4, interval: 40, agl: 300, pts: [[10, 60], [49, 60]] });
    runCurrent(5); return { ...S.stats.byUnit, cost: S.stats.defCost, hits: S.stats.hits, killed: S.stats.killed };
  };
  const co = shooters('coordinada'), it = shooters('integrada');
  assert.ok(co.N > 0, 'coordinada: el NASAMS tira primero ' + JSON.stringify(co));
  assert.ok((it.N || 0) < co.N && it.G > (co.G || 0), JSON.stringify({ co, it }));
  assert.ok(it.cost < co.cost / 2, JSON.stringify({ co, it }));
});
