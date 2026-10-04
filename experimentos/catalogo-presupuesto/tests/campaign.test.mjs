import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlan, applyCommand, savePlan, loadPlan } from '../lib/budget.mjs';

const fixture = () => ({ sideId: 'blue', missionId: 'first', unit: 'credits', budget: 100,
  offers: [{ id: 'kit', unit: 'credits', price: 20, quantityLimit: 3,
    costBasis: { kind: 'fictional', note: 'Paquete de prueba, no precio real', sourceIds: [] },
    bundle: [{ itemId: 'equipment', kind: 'durable', quantity: 1 },
      { itemId: 'supply', kind: 'consumable', quantity: 4 }] }] });
const cmd = (kind, fields = {}) => ({ commandId: `${kind}-first`, sideId: 'blue', kind, ...fields });
const step = (state, kind, fields) => applyCommand(state, cmd(kind, fields));
function completed() {
  let state = step(createPlan(fixture()), 'buy', { orderId: 'order-first', offerId: 'kit', quantity: 1 });
  state = step(state, 'load', { itemId: 'supply', quantity: 3 });
  state = step(state, 'activate');
  state = step(state, 'consume', { itemId: 'supply', quantity: 2 });
  return step(state, 'finish');
}
const next = (state = completed(), fields = {}) => step(state, 'begin-mission',
  { missionId: 'second', elapsedSeconds: 3600, ...fields });

test('continuar conserva dinero, disponibilidad, equipo, reservas y consumo', () => {
  const first = completed(); const second = next(first);
  assert.equal(second.phase, 'planning'); assert.equal(second.balance, 80);
  assert.equal(second.offers[0].remaining, 2);
  assert.deepEqual(second.inventory, first.inventory);
  assert.deepEqual(second.inventory.supply, { reserve: 1, ready: 1, consumed: 2 });
  assert.equal(second.inventory.equipment.reserve, 1);
  assert.equal(first.phase, 'completed'); assert.equal(first.missions.length, 1);
});

test('no reinicia cotización ni ofrece gratis paquetes ya adquiridos', () => {
  let state = next();
  state = step(state, 'buy', { commandId: 'buy-second', orderId: 'order-second', offerId: 'kit', quantity: 2 });
  assert.equal(state.balance, 40); assert.equal(state.offers[0].remaining, 0);
  assert.equal(state.offers[0].price, 20);
  assert.throws(() => step(state, 'buy', { commandId: 'buy-third', orderId: 'order-third', offerId: 'kit', quantity: 1 }));
});

test('no reembolsa adquisiciones comprometidas con la misión anterior', () => {
  const state = next();
  assert.equal(state.orders[0].status, 'committed');
  assert.throws(() => step(state, 'cancel', { orderId: 'order-first' }));
  let newer = step(state, 'buy', { commandId: 'buy-second', orderId: 'order-second', offerId: 'kit', quantity: 1 });
  newer = step(newer, 'cancel', { commandId: 'cancel-second', orderId: 'order-second' });
  assert.equal(newer.balance, state.balance);
  assert.deepEqual(newer.inventory, state.inventory);
});

test('tiempo entre misiones no regala reparaciones, entregas ni recargas', () => {
  const first = completed(); const state = next(first, { elapsedSeconds: 86400 });
  assert.equal(state.elapsedSeconds, 86400);
  assert.deepEqual(state.inventory, first.inventory);
  assert.deepEqual(state.missions, [
    { id: 'first', elapsedBeforeSeconds: 0, status: 'completed' },
    { id: 'second', elapsedBeforeSeconds: 86400, status: 'planning' }
  ]);
});

test('tercera misión acumula tiempo y consumo sin pagar dos veces', () => {
  let state = next();
  state = step(state, 'activate', { commandId: 'activate-second' });
  state = step(state, 'consume', { commandId: 'consume-second', itemId: 'supply', quantity: 1 });
  state = step(state, 'finish', { commandId: 'finish-second' });
  state = next(state, { commandId: 'begin-third', missionId: 'third', elapsedSeconds: 1800 });
  assert.equal(state.elapsedSeconds, 5400); assert.equal(state.balance, 80);
  assert.deepEqual(state.inventory.supply, { reserve: 1, ready: 0, consumed: 3 });
});

test('transición exige cerrar la misión anterior y no repite IDs', () => {
  assert.throws(() => next(createPlan(fixture())));
  assert.throws(() => next(step(createPlan(fixture()), 'activate')));
  assert.throws(() => next(completed(), { missionId: 'first' }));
  assert.throws(() => next(next(), { commandId: 'begin-again', missionId: 'third' }));
});

test('reintento de transición no duplica misión ni tiempo y no permite otro bando', () => {
  const command = cmd('begin-mission', { missionId: 'second', elapsedSeconds: 3600 });
  const state = applyCommand(completed(), command);
  assert.equal(applyCommand(state, command), state);
  assert.throws(() => applyCommand(state, { ...command, elapsedSeconds: 7200 }));
  assert.throws(() => applyCommand(completed(), { ...command, sideId: 'red' }));
});

test('rechaza tiempos fraccionarios, negativos, infinitos y desbordamientos', () => {
  for (const elapsedSeconds of [-1, 0.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => next(completed(), { elapsedSeconds }));
  }
  let state = next(completed(), { elapsedSeconds: Number.MAX_SAFE_INTEGER });
  state = step(state, 'activate', { commandId: 'activate-second' });
  state = step(state, 'finish', { commandId: 'finish-second' });
  const saved = savePlan(state);
  assert.throws(() => next(state, { commandId: 'begin-third', missionId: 'third', elapsedSeconds: 1 }));
  assert.equal(savePlan(state), saved);
  assert.equal(next(completed(), { elapsedSeconds: 0 }).elapsedSeconds, 0);
});

test('guardar/cargar reconstruye varias misiones desde un solo libro', () => {
  let state = next();
  state = step(state, 'activate', { commandId: 'activate-second' });
  state = step(state, 'consume', { commandId: 'consume-second', itemId: 'supply', quantity: 1 });
  const restored = loadPlan(savePlan(state));
  assert.deepEqual(restored, state);
  assert.equal(savePlan(restored), savePlan(state));
  const raw = JSON.parse(savePlan(state)); raw.commands.push(cmd('begin-mission', { commandId: 'invalid', missionId: 'third', elapsedSeconds: 1 }));
  assert.throws(() => loadPlan(JSON.stringify(raw)));
});

test('guardados viejos sin missionId mantienen una misión inicial explícita', () => {
  const initial = fixture(); delete initial.missionId;
  const old = JSON.stringify({ format: 'cielo-cerrado/allocation-prototype', version: 1, initial,
    commands: [cmd('buy', { orderId: 'order-first', offerId: 'kit', quantity: 1 }), cmd('activate'), cmd('finish')] });
  const state = loadPlan(old);
  assert.equal(state.missions[0].id, 'mission-initial'); assert.equal(state.balance, 80);
  assert.equal(next(state).inventory.supply.reserve, 4);
});

test('límites y libro inmutable impiden campañas ilimitadas o snapshots falsificados', () => {
  let state = createPlan(fixture());
  for (let index = 1; index <= 100; index++) {
    state = step(state, 'activate', { commandId: `activate-${index}` });
    state = step(state, 'finish', { commandId: `finish-${index}` });
    if (index < 100) state = next(state, { commandId: `begin-${index}`, missionId: `mission-${index}`, elapsedSeconds: 1 });
  }
  assert.equal(state.missions.length, 100); assert.equal(state.elapsedSeconds, 99);
  assert.throws(() => next(state, { commandId: 'too-many', missionId: 'mission-last' }));
  assert.throws(() => { state.missions[0].status = 'planning'; }, TypeError);
  assert.throws(() => next({ ...state, balance: 999 }));
});

test('continuidad conservativa para combinaciones de reserva, carga y consumo', () => {
  for (let purchased = 1; purchased <= 3; purchased++) {
    for (let loaded = 0; loaded <= purchased * 4; loaded++) {
      for (let consumed = 0; consumed <= loaded; consumed++) {
        let state = step(createPlan(fixture()), 'buy', { orderId: 'order-first', offerId: 'kit', quantity: purchased });
        if (loaded) state = step(state, 'load', { itemId: 'supply', quantity: loaded });
        state = step(state, 'activate');
        if (consumed) state = step(state, 'consume', { itemId: 'supply', quantity: consumed });
        state = step(state, 'finish'); const before = state;
        state = next(loadPlan(savePlan(state)));
        assert.equal(state.balance, before.balance);
        assert.deepEqual(state.inventory, before.inventory);
        assert.equal(state.inventory.supply.reserve + state.inventory.supply.ready + state.inventory.supply.consumed, purchased * 4);
        assert.equal(state.balance + state.orders.reduce((sum, row) => sum + row.paid, 0), 100);
      }
    }
  }
});
