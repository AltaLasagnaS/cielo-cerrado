import test from 'node:test';
import assert from 'node:assert/strict';
import { portCampaignDefinition } from '../data/port-campaign.mjs';
import { extendedPortCampaignDefinition } from '../data/port-campaign-extended.mjs';
import { createOperations, applyOperationResourceCommand, continueOperations,
  operationView, saveOperations, loadOperations } from '../lib/operations.mjs';
import { startPortCombat } from '../lib/port-combat.mjs';

test('optional third watch preserves the original assignment and supply limits', () => {
  const selection = ['buk', 'vhf', 'iris'];
  const original = portCampaignDefinition(selection), extended = extendedPortCampaignDefinition(selection);
  assert.deepEqual(extended.resourceInitial, original.resourceInitial);
  assert.deepEqual(extended.assets, original.assets);
  assert.deepEqual(extended.missions[0], original.missions[0]);
  assert.equal(original.missions.length, 2);
  assert.deepEqual(original.missions[1].next, { exito: null, parcial: null, fracaso: null });
  assert.equal(extended.missions[2].allowedAssetIds.includes('iris'), true);
  assert.equal(extended.missions[0].allowedAssetIds.includes('iris'), false);
  const op = createOperations(extended);
  const visible = operationView(op);
  assert.equal(Object.hasOwn(visible, 'definition'), false);
  assert.equal(Object.hasOwn(visible, 'missions'), false);
  assert.equal(Object.hasOwn(visible, 'scenarioKey'), false);
  assert.equal(saveOperations(loadOperations(saveOperations(op), 'ua')), saveOperations(op));
});

test('three real engine battles preserve losses and never renew stock, funds or supply quotas', () => {
  let op = createOperations(extendedPortCampaignDefinition(['buk', 'vhf', 'iris']));
  const command = (id, atSeconds, kind, rest = {}) => {
    op = applyOperationResourceCommand(op, { commandId: id, sideId: 'ua', atSeconds, kind, ...rest });
  };
  command('order', 0, 'order', { jobId: 'supply', quoteId: 'buk-supply', quantity: 4 });
  command('wait', 120, 'advance');
  command('load', 120, 'transfer', { jobId: 'load-job', serviceId: 'buk-reload', ammunitionId: 'legacy-buk', quantity: 4 });
  command('ready', 900, 'advance');
  const balance = op.resources.balance;
  const quoteRemaining = op.resources.quotes.find(q => q.id === 'buk-supply').remaining;
  let priorAssets = null, priorTotals = null;
  for (let stage = 0; stage < 3; stage++) {
    const start = op.resources.clockSeconds;
    const combat = startPortCombat(op, stage + 1);
    assert.equal(combat.view().contacts.length, 0);
    assert.equal(combat.view().units.some(u => u.id === 'iris'), stage > 0);
    let ticks = 0;
    while (combat.step()) { if (++ticks > 30000) throw Error(`Guardia ${stage + 1} no termina`); }
    op = combat.getOperation();
    assert.equal(op.phase, 'debrief');
    assert.equal(op.resources.balance, balance);
    assert.equal(op.resources.quotes.find(q => q.id === 'buk-supply').remaining, quoteRemaining);
    if (priorAssets) for (const a of op.assets) {
      assert.ok(a.hp <= priorAssets.find(p => p.id === a.id).hp, 'el daño no se cura entre guardias');
    }
    if (priorTotals) assert.deepEqual(op.resources.inventory.totals, priorTotals,
      'una batería vacía no recibe disparos gratis en las guardias siguientes');
    assert.ok(op.resources.clockSeconds > start);
    priorAssets = structuredClone(op.assets);
    priorTotals = structuredClone(op.resources.inventory.totals);
    const completedAt = op.resources.clockSeconds;
    op = continueOperations(loadOperations(saveOperations(op), 'ua'), `continue-${stage}`);
    if (stage < 2) {
      assert.equal(op.phase, 'planning');
      assert.equal(op.resources.clockSeconds, completedAt + 86400);
      assert.deepEqual(op.assets, priorAssets);
      assert.deepEqual(op.resources.inventory.totals, priorTotals);
    }
  }
  assert.equal(op.phase, 'finished');
  assert.equal(op.history.length, 3);
  assert.equal(op.resources.inventory.totals.find(t => t.ammunitionId === 'legacy-buk').expended, 4);
  assert.equal(loadOperations(saveOperations(op), 'ua').phase, 'finished');
});
