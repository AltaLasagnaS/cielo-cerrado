// Confirmación de pistas "M de N" (physics/radar.js#confirms, sim/engine.js): un eco suelto no abre una
// pista; dos en los últimos tres barridos, sí. Ver docs/FISICA.md §2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TRACK_M, TRACK_N, confirms, pdRel, PD_CUTOFF } from '../src/physics/radar.js';
import { S } from '../src/sim/state.js';
import { addDef, addSalvo } from '../src/sim/setup.js';
import { useMap, clearSetup, runCurrent } from './helpers.js';

test('2 de 3: un eco suelto no alcanza; dos en los últimos tres barridos, sí', () => {
  assert.deepEqual([TRACK_M, TRACK_N], [2, 3]);
  assert.equal(confirms(0b001), false);
  assert.equal(confirms(0b100), false);
  assert.equal(confirms(0b011), true);
  assert.equal(confirms(0b101), true);
  assert.equal(confirms(0b1001), false, 'el cuarto barrido hacia atrás ya no cuenta');
});

test('el corte de rendimiento está donde la Pd ya es despreciable', () => {
  assert.ok(pdRel(1, PD_CUTOFF ** -4) < 1e-4 && pdRel(3, PD_CUTOFF ** -4) < 1e-4);
});

test('corrida: cada radar lleva su propia historia y la pista se abre con dos ecos', () => {
  useMap('monterey', { flat: true }); clearSetup();
  addDef('ewr', 50, 60, { name: 'R' });
  addSalvo({ type: 'shahed', count: 2, interval: 30, agl: 1500, pts: [[0, 60], [70, 60]] });
  runCurrent(2);
  const u = S.units[0];
  for (const th of S.threats) {
    assert.ok(th.firstDet !== null, 'el radar 3D los ve');
    assert.ok(th.mn && typeof th.mn[u.id] === 'number', 'guarda la historia de barridos');
    // la detección se confirmó en el segundo eco: al menos un barrido después del primero posible
    assert.ok(th.detKm < Math.hypot(70, 0), `confirmada a ${th.detKm} km del blanco`);
  }
  assert.notEqual(S.threats[0].mn, S.threats[1].mn, 'historias independientes');
});
