import test from 'node:test';
import assert from 'node:assert/strict';
import { createInventory, applyInventoryEvent, saveInventory, loadInventory } from '../lib/components.mjs';

// Fictional capacities exercise mechanics; none describe a real missile.
function fixture() {
  return { sideId: 'blue', ammunitionIds: ['alpha', 'beta'],
    components: [{ id: 'launcher-one', kind: 'launcher' }, { id: 'launcher-two', kind: 'launcher' },
      { id: 'sensor', kind: 'sensor' }, { id: 'control', kind: 'control' }],
    configurations: [{ id: 'pure', basis: { kind: 'fictional', note: 'Prueba, no OSINT', sourceIds: [] },
      loadouts: [{ id: 'alpha-only', rounds: [{ ammunitionId: 'alpha', quantity: 4 }] },
        { id: 'beta-only', rounds: [{ ammunitionId: 'beta', quantity: 8 }] }] },
    { id: 'mixed', basis: { kind: 'fictional', note: 'Prueba, no OSINT', sourceIds: [] },
      loadouts: [{ id: 'declared-mix', rounds: [{ ammunitionId: 'alpha', quantity: 2 }, { ammunitionId: 'beta', quantity: 3 }] }] }],
    locations: [{ id: 'depot', kind: 'depot' },
      { id: 'first', kind: 'launcher', componentId: 'launcher-one', configurationId: 'pure', launchDependencies: ['sensor', 'control'] },
      { id: 'second', kind: 'launcher', componentId: 'launcher-two', configurationId: 'mixed', launchDependencies: ['control'] }],
    stock: [{ locationId: 'depot', ammunitionId: 'alpha', quantity: 20 },
      { locationId: 'depot', ammunitionId: 'beta', quantity: 20 }] };
}
let sequence = 0;
const event = (kind, props = {}) => ({ eventId: `event-${++sequence}`, sideId: 'blue', atSeconds: 0, kind, ...props });
const qty = (state, locationId, ammunitionId) => state.stock.find(row => row.locationId === locationId && row.ammunitionId === ammunitionId)?.quantity ?? 0;
function conserve(state) {
  for (const total of state.totals) {
    const current = state.stock.filter(row => row.ammunitionId === total.ammunitionId).reduce((sum, row) => sum + row.quantity, 0);
    const initial = state.initial.stock.filter(row => row.ammunitionId === total.ammunitionId).reduce((sum, row) => sum + row.quantity, 0);
    assert.equal(current + total.expended + total.lost, initial);
  }
}

test('separate maxima do not permit an invented mixed load; failure is atomic', () => {
  const initial = createInventory(fixture());
  const loaded = applyInventoryEvent(initial, event('transfer', { fromId: 'depot', toId: 'first', ammunitionId: 'alpha', quantity: 2 }));
  assert.throws(() => applyInventoryEvent(loaded, event('transfer', { fromId: 'depot', toId: 'first', ammunitionId: 'beta', quantity: 1 })), /no admitida/);
  assert.equal(qty(loaded, 'depot', 'beta'), 20);
  assert.equal(qty(initial, 'first', 'alpha'), 0);
  conserve(loaded);
});

test('explicit mixed load, partial load and unload conserve each type', () => {
  let state = createInventory(fixture());
  for (const [ammunitionId, quantity] of [['alpha', 2], ['beta', 3]]) state = applyInventoryEvent(state,
    event('transfer', { fromId: 'depot', toId: 'second', ammunitionId, quantity }));
  assert.throws(() => applyInventoryEvent(state, event('transfer', { fromId: 'depot', toId: 'second', ammunitionId: 'alpha', quantity: 1 })), /no admitida/);
  state = applyInventoryEvent(state, event('transfer', { fromId: 'second', toId: 'depot', ammunitionId: 'beta', quantity: 2 }));
  assert.equal(qty(state, 'second', 'beta'), 1); conserve(state);
});

test('damage to a required sensor blocks fire; another launcher with different dependencies remains available', () => {
  let state = createInventory(fixture());
  for (const toId of ['first', 'second']) state = applyInventoryEvent(state,
    event('transfer', { fromId: 'depot', toId, ammunitionId: 'alpha', quantity: 2 }));
  state = applyInventoryEvent(state, event('condition', { componentId: 'sensor', condition: 'disabled' }));
  assert.throws(() => applyInventoryEvent(state, event('expend', { fromId: 'first', ammunitionId: 'alpha', quantity: 1 })), /no operativa/);
  state = applyInventoryEvent(state, event('expend', { fromId: 'second', ammunitionId: 'alpha', quantity: 1 }));
  assert.equal(state.totals[0].expended, 1); conserve(state);
});

test('destroying one launcher loses only its loaded ammunition and cannot resurrect it', () => {
  let state = createInventory(fixture());
  for (const toId of ['first', 'second']) state = applyInventoryEvent(state,
    event('transfer', { fromId: 'depot', toId, ammunitionId: 'alpha', quantity: 2 }));
  state = applyInventoryEvent(state, event('condition', { componentId: 'launcher-one', condition: 'destroyed' }));
  assert.equal(qty(state, 'first', 'alpha'), 0); assert.equal(qty(state, 'second', 'alpha'), 2);
  assert.equal(state.totals[0].lost, 2); assert.equal(qty(state, 'depot', 'alpha'), 16);
  assert.throws(() => applyInventoryEvent(state, event('condition', { componentId: 'launcher-one', condition: 'operational' })), /resucita/);
  conserve(state);
});

test('deposit losses, fire, reload and save replay preserve totals and chronology', () => {
  let state = createInventory(fixture());
  state = applyInventoryEvent(state, event('loss', { fromId: 'depot', ammunitionId: 'beta', quantity: 4 }));
  const receipt = event('transfer', { fromId: 'depot', toId: 'first', ammunitionId: 'alpha', quantity: 4, atSeconds: 10 });
  state = applyInventoryEvent(state, receipt);
  state = applyInventoryEvent(state, event('expend', { fromId: 'first', ammunitionId: 'alpha', quantity: 2, atSeconds: 20 }));
  assert.equal(applyInventoryEvent(state, receipt), state);
  assert.throws(() => applyInventoryEvent(state, { ...receipt, quantity: 1 }), /reutilizado/);
  assert.throws(() => applyInventoryEvent(state, event('loss', { fromId: 'depot', ammunitionId: 'alpha', quantity: 1, atSeconds: 19 })), /temporal/);
  const restored = loadInventory(saveInventory(state));
  assert.deepEqual(restored, state); conserve(restored);
});

test('unknown capacities, invalid identities, fractions, side and oversized totals fail explicitly', () => {
  let raw = fixture(); raw.configurations[0].loadouts = [];
  assert.throws(() => createInventory(raw), /Capacidad desconocida/);
  raw = fixture(); raw.stock[0].quantity = 1.1;
  assert.throws(() => createInventory(raw), /entero/);
  raw = fixture(); raw.stock[0].quantity = Number.MAX_SAFE_INTEGER; raw.stock.push({ locationId: 'first', ammunitionId: 'alpha', quantity: 1 });
  assert.throws(() => createInventory(raw), /entero/);
  const state = createInventory(fixture());
  assert.throws(() => applyInventoryEvent(state, event('loss', { fromId: 'depot', ammunitionId: 'alpha', quantity: 1, sideId: 'red' })), /otro bando/);
  assert.throws(() => applyInventoryEvent(state, event('expend', { fromId: 'depot', ammunitionId: 'alpha', quantity: 1 })), /depósito/);
  assert.throws(() => applyInventoryEvent(state, event('loss', { fromId: 'depot', ammunitionId: 'alpha', quantity: 1, truth: {} })), /campos/);
  assert.throws(() => applyInventoryEvent(structuredClone(state), event('loss', { fromId: 'depot', ammunitionId: 'alpha', quantity: 1 })), /ajeno/);
  assert.ok(Object.isFrozen(state.stock));
});
