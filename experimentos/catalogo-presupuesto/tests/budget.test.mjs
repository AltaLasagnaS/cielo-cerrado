import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlan, applyCommand, savePlan, loadPlan } from '../lib/budget.mjs';

// Fictional generic fixtures: these are not real units or prices.
const fixture = () => ({ sideId: 'blue', unit: 'credits', budget: 100,
  offers: [{ id: 'kit', unit: 'credits', price: 20, quantityLimit: 3,
    costBasis: { kind: 'fictional', note: 'Precio de prueba, no USD', sourceIds: [] },
    bundle: [{ itemId: 'launcher-example', kind: 'durable', quantity: 1 },
      { itemId: 'round-example', kind: 'consumable', quantity: 4 }] }] });
const cmd = (kind, fields = {}) => ({ commandId: `${kind}-one`, sideId: 'blue', kind, ...fields });
const buy = (state = createPlan(fixture()), fields = {}) => applyCommand(state,
  cmd('buy', { orderId: 'order-one', offerId: 'kit', quantity: 1, ...fields }));

function conserved(state) {
  const paid = state.orders.filter(order => order.status !== 'cancelled').reduce((total, order) => total + order.paid, 0);
  assert.equal(state.balance + paid, state.initial.budget);
  const totals = Object.create(null);
  for (const order of state.orders.filter(order => order.status !== 'cancelled')) {
    for (const item of state.initial.offers.find(offer => offer.id === order.offerId).bundle) {
      totals[item.itemId] = (totals[item.itemId] || 0) + item.quantity * order.quantity;
    }
  }
  for (const [itemId, stock] of Object.entries(state.inventory)) {
    assert.equal(stock.reserve + stock.ready + stock.consumed, totals[itemId] || 0);
    assert.ok([stock.reserve, stock.ready, stock.consumed].every(value => Number.isSafeInteger(value) && value >= 0));
  }
}

test('compra cobra una vez e incluye el paquete completo', () => {
  const state = buy(); assert.equal(state.balance, 80);
  assert.deepEqual(state.inventory['round-example'], { reserve: 4, ready: 0, consumed: 0 });
  assert.equal(state.offers[0].remaining, 2); conserved(state);
});

test('cancelar devuelve costo e inventario; no duplica devolución', () => {
  const before = buy(); const cancellation = cmd('cancel', { orderId: 'order-one' });
  const after = applyCommand(before, cancellation);
  assert.equal(after.balance, 100); assert.equal(after.offers[0].remaining, 3);
  assert.equal(after.inventory['round-example'].reserve, 0);
  assert.equal(applyCommand(after, cancellation), after);
  assert.throws(() => applyCommand(after, { ...cancellation, commandId: 'cancel-two' })); conserved(after);
});

test('mismo comando es idempotente y un ID no admite contenido distinto', () => {
  const initial = createPlan(fixture()); const command = cmd('buy', { orderId: 'order-one', offerId: 'kit', quantity: 1 });
  const once = applyCommand(initial, command);
  assert.equal(applyCommand(once, command), once);
  assert.throws(() => applyCommand(once, { ...command, quantity: 2 }));
  assert.throws(() => buy(once, { commandId: 'buy-two' }));
});

test('no reutiliza orderId cancelado para una compra nueva', () => {
  const state = applyCommand(buy(), cmd('cancel', { orderId: 'order-one' }));
  assert.throws(() => buy(state, { commandId: 'buy-two' }));
});

test('requiere fondos y disponibilidad sin mutar el estado al fallar', () => {
  const initial = createPlan(fixture()); const saved = savePlan(initial);
  assert.throws(() => buy(initial, { quantity: 4 }));
  const poor = fixture(); poor.budget = 19;
  assert.throws(() => buy(createPlan(poor)));
  assert.equal(savePlan(initial), saved);
});

test('compra, carga y consumo conservan stock; consumir no cobra otra vez', () => {
  let state = applyCommand(buy(), cmd('load', { itemId: 'round-example', quantity: 3 }));
  state = applyCommand(state, cmd('activate'));
  state = applyCommand(state, cmd('consume', { itemId: 'round-example', quantity: 2 }));
  assert.equal(state.balance, 80);
  assert.deepEqual(state.inventory['round-example'], { reserve: 1, ready: 1, consumed: 2 });
  conserved(state);
});

test('reserva no lista no se puede consumir; no hay recarga instantánea durante combate', () => {
  const state = applyCommand(buy(), cmd('activate'));
  assert.throws(() => applyCommand(state, cmd('consume', { itemId: 'round-example', quantity: 1 })));
  assert.throws(() => applyCommand(state, cmd('load', { itemId: 'round-example', quantity: 1 })));
});

test('no consume equipos durables como si fueran municiones', () => {
  let state = applyCommand(buy(), cmd('load', { itemId: 'launcher-example', quantity: 1 }));
  state = applyCommand(state, cmd('activate'));
  assert.throws(() => applyCommand(state, cmd('consume', { itemId: 'launcher-example', quantity: 1 })));
});

test('rechaza un mismo recurso descrito como durable y consumible', () => {
  const input = fixture(); const second = structuredClone(input.offers[0]); second.id = 'kit-two';
  second.bundle[0].kind = 'consumable'; input.offers.push(second);
  assert.throws(() => createPlan(input));
});

test('cancelar equipo ya cargado exige descargarlo durante preparación', () => {
  let state = applyCommand(buy(), cmd('load', { itemId: 'round-example', quantity: 1 }));
  assert.throws(() => applyCommand(state, cmd('cancel', { orderId: 'order-one' })));
  state = applyCommand(state, cmd('unload', { itemId: 'round-example', quantity: 1 }));
  state = applyCommand(state, cmd('cancel', { orderId: 'order-one' }));
  conserved(state); assert.equal(state.balance, 100);
});

test('no compra, cancela ni mueve stock después de activar', () => {
  const state = applyCommand(buy(), cmd('activate'));
  for (const command of [cmd('cancel', { orderId: 'order-one' }),
    cmd('unload', { itemId: 'round-example', quantity: 1 }),
    cmd('buy', { commandId: 'buy-two', orderId: 'order-two', offerId: 'kit', quantity: 1 })]) {
    assert.throws(() => applyCommand(state, command));
  }
});

test('otro bando no puede operar este libro de recursos', () => {
  assert.throws(() => applyCommand(createPlan(fixture()), { ...cmd('activate'), sideId: 'red' }));
});

test('finalización bloquea nuevos consumos y se puede repetir la entrega del comando', () => {
  const finish = cmd('finish');
  const state = applyCommand(applyCommand(buy(), cmd('activate')), finish);
  assert.equal(state.phase, 'completed'); assert.equal(applyCommand(state, finish), state);
  assert.throws(() => applyCommand(state, cmd('consume', { itemId: 'round-example', quantity: 1 })));
});

test('guardar/cargar reproduce estado por eventos sin depender de snapshots', () => {
  let state = buy(); state = applyCommand(state, cmd('load', { itemId: 'round-example', quantity: 2 }));
  state = applyCommand(state, cmd('activate'));
  state = applyCommand(state, cmd('consume', { itemId: 'round-example', quantity: 1 }));
  const saved = savePlan(state); const restored = loadPlan(saved);
  assert.deepEqual(JSON.parse(savePlan(restored)), JSON.parse(saved));
  assert.deepEqual(restored.inventory, state.inventory); assert.equal(restored.balance, state.balance); conserved(restored);
});

test('replay rechaza secuencias imposibles y versiones incorrectas', () => {
  const raw = JSON.parse(savePlan(createPlan(fixture())));
  raw.commands = [cmd('activate'), cmd('consume', { itemId: 'round-example', quantity: 1 })];
  assert.throws(() => loadPlan(JSON.stringify(raw)));
  raw.version = 2; assert.throws(() => loadPlan(JSON.stringify(raw)));
  assert.throws(() => loadPlan('no json'));
  assert.throws(() => loadPlan(' '.repeat(2 * 1024 * 1024 + 1)));
});

test('estado y cotizaciones son inmutables y no conservan aliases del input', () => {
  const input = fixture(); const state = createPlan(input); input.offers[0].price = 0;
  assert.equal(state.offers[0].price, 20);
  assert.throws(() => { state.balance = 999; }, TypeError);
  assert.throws(() => { state.offers[0].price = 0; }, TypeError);
  assert.throws(() => applyCommand({ ...state, balance: 999 }, cmd('activate')));
});

test('no mezcla monedas ni presenta costos ficticios como precios reales', () => {
  const input = fixture(); input.offers[0].unit = 'USD-2025-minor';
  assert.throws(() => createPlan(input));
  input.unit = 'USD-2025-minor'; assert.throws(() => createPlan(input));
  input.offers[0].costBasis = { kind: 'documented', note: 'Cotización de prueba, no precio real', sourceIds: ['source-example'] };
  assert.equal(createPlan(input).unit, 'USD-2025-minor');
});

test('cantidades inválidas, campos extras y IDs no admitidos se rechazan', () => {
  const initial = createPlan(fixture());
  for (const quantity of [0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => buy(initial, { quantity }));
  }
  assert.throws(() => buy(initial, { itemId: '__proto__' }));
  assert.throws(() => buy(initial, { orderId: '__proto__' }));
  assert.throws(() => applyCommand(initial, { ...cmd('activate'), balance: 999 }));
  assert.throws(() => applyCommand(initial, { ...cmd('activate'), kind: 'constructor' }));
});

test('rechaza desbordamientos y ofertas sin paquetes o repetidas', () => {
  const input = fixture(); input.offers[0].price = Number.MAX_SAFE_INTEGER;
  const state = createPlan(input); assert.throws(() => buy(state, { quantity: 2 }));
  input.offers[0].bundle = []; assert.throws(() => createPlan(input));
  const duplicate = fixture(); duplicate.offers.push(structuredClone(duplicate.offers[0]));
  assert.throws(() => createPlan(duplicate));
});

test('conservación exhaustiva para varias compras, cargas, descargas y consumos', () => {
  for (let purchased = 1; purchased <= 3; purchased++) {
    for (let loaded = 1; loaded <= purchased * 4; loaded++) {
      for (let consumed = 1; consumed <= loaded; consumed++) {
        let state = buy(undefined, { quantity: purchased }); conserved(state);
        state = applyCommand(state, cmd('load', { itemId: 'round-example', quantity: loaded })); conserved(state);
        state = applyCommand(state, cmd('activate')); conserved(state);
        state = applyCommand(state, cmd('consume', { itemId: 'round-example', quantity: consumed })); conserved(state);
        state = loadPlan(savePlan(state)); conserved(state);
      }
    }
  }
});
