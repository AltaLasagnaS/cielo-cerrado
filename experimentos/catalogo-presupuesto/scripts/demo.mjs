import assert from 'node:assert/strict';
import { createPlan, applyCommand, savePlan, loadPlan } from '../lib/budget.mjs';

// Generic educational example: neither weapon prices nor a real scenario.
let state = createPlan({ sideId: 'blue', budget: 100, unit: 'credits', offers: [
  { id: 'example-kit', price: 20, unit: 'credits', quantityLimit: 3,
    costBasis: { kind: 'fictional', note: 'Créditos didácticos; no precio militar real', sourceIds: [] },
    bundle: [
      { itemId: 'example-equipment', kind: 'durable', quantity: 1 },
      { itemId: 'example-supply', kind: 'consumable', quantity: 4 }
    ] }
] });
const commands = [
  { kind: 'buy', orderId: 'order-one', offerId: 'example-kit', quantity: 2 },
  { kind: 'load', itemId: 'example-supply', quantity: 6 },
  { kind: 'activate' },
  { kind: 'consume', itemId: 'example-supply', quantity: 2 }
];
for (const [index, command] of commands.entries()) state = applyCommand(state,
  { commandId: `example-${index}`, sideId: 'blue', ...command });
const restored = loadPlan(savePlan(state));
assert.deepEqual(restored.inventory, state.inventory);
assert.equal(restored.balance, state.balance);
console.log('Ejemplo ficticio: 100 créditos iniciales, dos paquetes de 20; saldo final 60.');
console.log('Existencias consumibles:', state.inventory['example-supply']);
console.log('Consumir no vuelve a cobrar lo adquirido. Guardar/cargar conserva el estado.');
