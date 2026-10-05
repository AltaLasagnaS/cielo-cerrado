// Niveles de integración del mando y control (data/c2.js, physics/engagement.js#trackOK y reactionStart).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { C2_LEVELS, GATEWAYS } from '../src/data/index.js';
import { trackOK, reactionStart, effectiveC2, netPk, unitC2 } from '../src/physics/engagement.js';
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

test('C2 y datalink: apagar el datalink no quita la alerta C2, pero sí la pista de tiro', () => {
  const off = { id: 1, type: 'irist', link: false };
  for (const k of Object.keys(C2_LEVELS)) assert.equal(trackOK(off, th, 155, k), false, k);
  assert.equal(trackOK(off, { ...th, det: { 1: 154 } }, 155, 'coordinada'), true);   // con su propio radar, sí
  assert.equal(reactionStart({ ...th, cueFirst: 100 }, 200, 'integrada', off), 102);
});

test('datalink: una detección sin transporte no alimenta la red compatible', () => {
  const run = link => {
    useMap('monterey', { flat: true }); clearSetup();
    addDef('ewr', 50, 20, { name: 'R' }); addDef('s300', 50, 60, { name: 'S' });
    S.setup.defs.find(d => d.name === 'R').link = link;
    addSalvo({ type: 'kh22', count: 1, pts: [[50, 0], [50, 59]] });
    runCurrent(2); return S.threats[0];
  };
  assert.ok(run(true).netFirst !== null);
  const th2 = run(false); assert.ok(th2.firstDet !== null);
  assert.ok(th2.netFirst === null || th2.netFirst > th2.firstDet);   // el S-300 no recibe la pista del EWR si el sensor no publica
});

test('datalink: Link 16 une NASAMS y Patriot; al S-300 ucraniano le llega por la pasarela, más tarde y con menos Pk', () => {
  const G = GATEWAYS.ua_l16;
  const remote = { det: {}, net: { l16: { first: 100, last: 150 } }, netFirst: 100, lastNet: 150 };
  assert.equal(trackOK({ id: 1, type: 'patriot', link: true }, remote, 155, 'coordinada'), true);
  assert.equal(trackOK({ id: 2, type: 'nasams', link: true }, remote, 155, 'coordinada'), true);
  assert.equal(netPk({ id: 2, type: 'nasams', link: true }, remote, 155, 'coordinada'), 1, 'red propia');
  assert.equal(trackOK({ id: 3, type: 's300', link: true }, remote, 155, 'integrada'), true, 'por la pasarela');
  assert.equal(netPk({ id: 3, type: 's300', link: true }, remote, 155, 'integrada'), G.gwPk);
  const fresh = { det: {}, net: { l16: { first: 150, last: 152 } } };
  assert.equal(trackOK({ id: 3, type: 's300', link: true }, fresh, 150 + C2_LEVELS.integrada.lag + G.gwLag - 1, 'integrada'), false, 'todavía no cruzó la pasarela');
  assert.equal(trackOK({ id: 3, type: 's300', link: true }, fresh, 150 + C2_LEVELS.integrada.lag + G.gwLag, 'integrada'), true);
  const russian = { det: {}, net: { ru_c2: { first: 100, last: 150 } } };
  assert.equal(trackOK({ id: 4, type: 'patriot', link: true }, russian, 155, 'coordinada'), false, 'no hay pasarela con la red rusa');
});

test('C2 por unidad: una unidad puede quedar con menos coordinación que la red, nunca más', () => {
  assert.equal(unitC2({}, 'integrada'), 'integrada');
  assert.equal(unitC2({ c2: 'desconectada' }, 'integrada'), 'desconectada');
  assert.equal(unitC2({ c2: 'integrada' }, 'coordinada'), 'coordinada');
  assert.equal(unitC2({ c2: 'xx' }, 'coordinada'), 'coordinada');
});

test('C2 por unidad: una batería desconectada no usa ni publica pistas de la red', () => {
  const run = c2u => {
    useMap('monterey', { flat: true }); clearSetup();
    addDef('ewr', 50, 20, { name: 'R', c2: c2u }); addDef('s300', 50, 60, { name: 'S' });
    addSalvo({ type: 'kh22', count: 1, pts: [[50, 0], [50, 59]] });
    runCurrent(2); return S.threats[0];
  };
  assert.ok(run(undefined).netFirst !== null);
  const th = run('desconectada'); assert.ok(th.firstDet !== null);
  assert.ok(th.netFirst === null || th.netFirst > th.firstDet, 'el radar desconectado no publica');
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
