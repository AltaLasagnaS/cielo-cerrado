// Recarga de munición (sim/engine.js): reserva, tiempo de recarga y depósitos de munición.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFENSES } from '../src/data/index.js';
import { S } from '../src/sim/state.js';
import { addDef, addSalvo, addObj } from '../src/sim/setup.js';
import { useMap, clearSetup, runCurrent } from './helpers.js';

// grupo móvil contra una oleada larga de Shahed bajos: con 30 ráfagas listas se vacía enseguida
const run = (reserve, prep) => {
  useMap('monterey', { flat: true }); clearSetup();
  addDef('mfg', 50, 60, { name: 'G', reserve }); addDef('ewr', 50, 58, { name: 'R' });
  S.setup.defs.find(d => d.name === 'G').mag = 3;
  addSalvo({ type: 'shahed', count: 12, interval: 90, agl: 400, pts: [[30, 60], [50.5, 60]] });
  if (prep) prep();
  runCurrent(2); return { shots: S.stats.byUnit.G || 0, reloads: S.stats.reloads };
};

test('sin reserva no recarga; con reserva dispara más que la munición inicial, pero nunca más que listos + reserva', () => {
  const a = run(0), b = run(6);
  assert.equal(a.reloads, 0); assert.ok(a.shots <= 3);
  assert.ok(b.reloads > 0 && b.shots > 3 && b.shots <= 3 + 6, JSON.stringify(b));
});

test('con depósitos en el mapa, recarga solo si hay uno a menos de 30 km', () => {
  const far = run(6, () => addObj('ammo', 5, 5, { name: 'Lejos' }));
  assert.equal(far.reloads, 0);
  const near = run(6, () => addObj('ammo', 52, 62, { name: 'Cerca' }));
  assert.ok(near.reloads > 0);
});

test('catálogo: toda defensa con armas tiene reserva y tiempo de recarga', () => {
  for (const [k, d] of Object.entries(DEFENSES)) if (d.sam) assert.ok(d.sam.reserve >= 0 && d.sam.reloadS > 0, k);
});
