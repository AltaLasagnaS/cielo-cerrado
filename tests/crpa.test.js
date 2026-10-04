// Antena CRPA contra varias fuentes GNSS (physics/navigation.js, docs/FISICA.md §4): una CRPA de N
// elementos anula hasta N − 1 interferidores desde direcciones distintas; con más, el arma pierde el GNSS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CRPA_SIZES, SCENARIOS } from '../src/data/index.js';
import { crpaNulls, distinctDirections, crpaOverwhelmed, CRPA_SEP_DEG } from '../src/physics/navigation.js';
import { S } from '../src/sim/state.js';
import { addSalvo, addJam, applyScenario } from '../src/sim/setup.js';
import { exportScenario, validateScenario, loadScenarioData } from '../src/sim/scenario-io.js';
import { useMap, clearSetup, runCurrent } from './helpers.js';

test('una CRPA de N elementos anula N − 1 fuentes; sin CRPA, ninguna', () => {
  assert.equal(crpaNulls(0), 0); assert.equal(crpaNulls(4), 3); assert.equal(crpaNulls(16), 15);
  const at = (n, k) => crpaOverwhelmed(n, 0, 0, Array.from({ length: k }, (_, i) => ({ x: 10 * Math.cos(i), y: 10 * Math.sin(i) })));
  assert.equal(at(0, 1), true, 'sin CRPA alcanza con una fuente');
  assert.equal(at(4, 3), false, '4 elementos anulan 3');
  assert.equal(at(4, 4), true, 'con 4 fuentes pierde el GNSS');
  assert.equal(at(8, 0), false, 'sin fuentes no pasa nada');
});

test('dos fuentes casi en la misma dirección caen en el mismo nulo', () => {
  const near = [{ x: 0, y: -20 }, { x: 20 * Math.tan((CRPA_SEP_DEG / 2) * Math.PI / 180), y: -20 }];
  assert.equal(distinctDirections(0, 0, near), 1);
  const apart = [{ x: 0, y: -20 }, { x: 20, y: 0 }];
  assert.equal(distinctDirections(0, 0, apart), 2);
  // a uno y otro lado del norte (359° y 2°): una sola dirección
  const wrap = [{ x: -0.35, y: -20 }, { x: 0.7, y: -20 }];
  assert.equal(distinctDirections(0, 0, wrap), 1);
});

/** Shahed contra un blanco con k estaciones Pole-21 repartidas alrededor; → navErr medio. */
function navErr(crpa, k) {
  useMap('monterey', { flat: true }); clearSetup();
  // El blanco es RU; usamos un anti-GNSS UA para que el filtro de bando no lo trate como fratricidio.
  for (let i = 0; i < k; i++) { const a = i * 2 * Math.PI / Math.max(1, k); addJam('pokrova', 60 + 8 * Math.cos(a), 60 + 8 * Math.sin(a)); }
  addSalvo({ type: 'shahed', count: 4, interval: 30, agl: 1500, crpa, pts: [[5, 60], [60, 60]] });
  runCurrent(5);
  const arr = S.arrivals.filter(a => a.type === 'shahed');
  return arr.reduce((s, a) => s + a.nav, 0) / arr.length;
}

test('corrida: la CRPA protege mientras haya nulos y pierde con más fuentes', () => {
  assert.ok(navErr(0, 1) > 100, 'sin CRPA, una estación alcanza');
  assert.equal(navErr(4, 3), 0, 'CRPA de 4 contra 3 estaciones: sin error');
  assert.ok(navErr(4, 5) > 100, 'CRPA de 4 contra 5 estaciones: pierde el GNSS');
});

test('crpa se guarda en el archivo, se carga y se valida', () => {
  useMap('monterey'); clearSetup(); applyScenario(SCENARIOS.mb_noche);
  assert.equal(S.setup.salvos[0].crpa, 0, 'por defecto, antena común (no cambia los escenarios)');
  S.setup.salvos[0].crpa = 12;
  const file = JSON.parse(JSON.stringify(exportScenario(new Date(0))));
  assert.equal(file.setup.salvos[0].crpa, 12);
  clearSetup(); const res = validateScenario(file); assert.ok(res.ok, res.errors.join('\n'));
  loadScenarioData(res.data); assert.equal(S.setup.salvos[0].crpa, 12);
  file.setup.salvos[0].crpa = 7;
  assert.match(validateScenario(file).errors.join('\n'), /crpa/);
  assert.deepEqual(CRPA_SIZES, [0, 4, 8, 12, 16]);
});
