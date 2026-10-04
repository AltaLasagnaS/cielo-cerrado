import assert from 'node:assert/strict';
import { createPlan, applyCommand, savePlan, loadPlan } from '../lib/budget.mjs';
import { buildPreparationBriefing } from '../lib/briefing.mjs';

// Fictional allocation exercise, not a combat scenario or operational plan.
let plan = createPlan({ sideId: 'blue', missionId: 'first', budget: 100, unit: 'credits', offers: [
  { id: 'example-kit', price: 20, unit: 'credits', quantityLimit: 3,
    costBasis: { kind: 'fictional', note: 'Créditos de demostración', sourceIds: [] },
    bundle: [{ itemId: 'example-equipment', kind: 'durable', quantity: 1 },
      { itemId: 'example-supply', kind: 'consumable', quantity: 4 }] }
] });
const commands = [
  { kind: 'buy', orderId: 'order-first', offerId: 'example-kit', quantity: 1 },
  { kind: 'load', itemId: 'example-supply', quantity: 3 },
  { kind: 'activate' }, { kind: 'consume', itemId: 'example-supply', quantity: 2 },
  { kind: 'finish' }, { kind: 'begin-mission', missionId: 'second', elapsedSeconds: 3600 }
];
for (const [index, command] of commands.entries()) plan = applyCommand(plan,
  { commandId: `example-${index}`, sideId: 'blue', ...command });
plan = loadPlan(savePlan(plan));
const briefing = buildPreparationBriefing(plan, { sideId: 'blue', missionId: 'second', role: 'defence',
  title: 'Segunda etapa ficticia', issuedAtSeconds: 4200,
  objectives: [{ id: 'task-second', text: 'Revisar existencias antes de otra misión de prueba', deadlineSeconds: null }],
  intelligence: [{ id: 'report-first', text: 'Informe del ejercicio anterior; no revela un plan enemigo',
    sourceLabel: 'Autor del ejercicio', confidence: 'unconfirmed', observedAtSeconds: 300, receivedAtSeconds: 600 }] });
assert.equal(plan.balance, 80);
assert.equal(plan.offers[0].remaining, 2);
assert.deepEqual(plan.inventory['example-supply'], { reserve: 1, ready: 1, consumed: 2 });
assert.equal(briefing.intelligence[0].ageSeconds, 3900);
assert.equal(plan.missions.length, 2);
console.log('Dos etapas ficticias: saldo 80, un consumible en reserva, uno listo y dos usados.');
console.log('No se restaura presupuesto ni munición; los 3.600 s entre etapas no reparan ni recargan.');
console.log('Briefing propio: antigüedad del reporte 3.900 s, sin verdad enemiga. Guardado/replay verificado.');
