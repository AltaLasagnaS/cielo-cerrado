import test from 'node:test';
import assert from 'node:assert/strict';
import { portCampaignDefinition, PORT_BUDGET, PORT_CHOICES } from '../data/port-campaign.mjs';
import { createOperations, applyOperationResourceCommand, continueOperations, saveOperations, loadOperations, operationView } from '../lib/operations.mjs';
import { startPortCombat } from '../lib/port-combat.mjs';

test('two actual engine missions conserve typed ammunition, budget and damaged friendly infrastructure', () => {
  let op = createOperations(portCampaignDefinition(['buk', 'vhf', 'iris']));
  const beginBalance = op.resources.balance;
  assert.equal(beginBalance, PORT_BUDGET - PORT_CHOICES.filter(c => ['buk','vhf','iris'].includes(c.id)).reduce((s,c) => s+c.cost,0));
  assert.throws(() => applyOperationResourceCommand(op, { commandId: 'early-iris', sideId: 'ua', atSeconds: 0,
    kind: 'order', jobId: 'iris', quoteId: 'iris-supply', quantity: 1 }), /disponible/);
  const command = (commandId, atSeconds, kind, rest = {}) => { op = applyOperationResourceCommand(op, { commandId, sideId: 'ua', atSeconds, kind, ...rest }); };
  command('order',0,'order',{jobId:'supply',quoteId:'buk-supply',quantity:4});
  command('wait',120,'advance');
  command('load',120,'transfer',{jobId:'load-job',serviceId:'buk-reload',ammunitionId:'legacy-buk',quantity:4});
  command('ready',900,'advance');
  let combat = startPortCombat(op,1), ticks=0;
  const firstView = combat.view(); assert.equal(firstView.contacts.length,0,'undetected attacks never appear at start');
  assert.equal(Object.hasOwn(firstView,'threats'),false); assert.equal(Object.hasOwn(firstView,'pending'),false);
  assert.equal(firstView.units.some(u=>u.id==='iris'),false,'Western unit is reserved until later assignment');
  assert.throws(() => startPortCombat(op,1),/activo/);
  while(combat.step()){if(++ticks>20000)throw Error('Battle did not end');}
  op = combat.getOperation();
  assert.equal(op.resources.inventory.totals.find(t=>t.ammunitionId==='legacy-buk').expended,4);
  assert.equal(op.resources.balance,beginBalance-40,'firing does not charge ammunition twice');
  assert.ok(op.assets.some(a=>a.kind==='objective'&&a.hp<a.maxHp),'real engine damage is persisted');
  const afterFirst = op.assets.filter(a=>a.kind==='objective').map(a=>({id:a.id,hp:a.hp}));
  op=loadOperations(saveOperations(op),'ua');op=continueOperations(op,'second-night');
  assert.equal(operationView(op).resources.quotes.some(q=>q.id==='iris-supply'),true);
  for(const a of afterFirst)assert.equal(op.assets.find(b=>b.id===a.id).hp,a.hp);
  combat=startPortCombat(op,2);ticks=0;
  while(combat.step()){if(++ticks>20000)throw Error('Second battle did not end');}
  op=combat.getOperation();
  assert.equal(op.resources.inventory.totals.find(t=>t.ammunitionId==='legacy-buk').expended,4,'next battle never refills empty battery');
  assert.equal(op.resources.balance,beginBalance-40);
  op=continueOperations(op,'end-campaign');assert.equal(op.phase,'finished');
  assert.equal(loadOperations(saveOperations(op),'ua').phase,'finished');
});
