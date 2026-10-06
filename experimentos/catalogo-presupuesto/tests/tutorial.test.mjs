import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, createTutorial, advanceTutorial, tutorialStep, saveTutorial, loadTutorial } from '../lib/tutorial.mjs';
import { applyCommand } from '../lib/budget.mjs';

test('the lesson only completes after real ledger operations and preserves resources between stages', () => {
  let plan = createTutorial();
  for (const lesson of LESSONS) {
    plan = advanceTutorial(plan, lesson.action, lesson.action === 'load' ? 2 : 1);
    const restored = loadTutorial(saveTutorial(plan));
    assert.equal(tutorialStep(restored), tutorialStep(plan));
    assert.deepEqual(restored, plan);
  }
  assert.equal(tutorialStep(plan), 6); assert.equal(plan.balance, 80);
  assert.deepEqual(plan.inventory['training-round'], { reserve: 2, ready: 1, consumed: 1 });
  assert.deepEqual(plan.inventory['training-equipment'], { reserve: 1, ready: 0, consumed: 0 });
  assert.equal(plan.offers[0].remaining, 2); assert.equal(plan.elapsedSeconds, 900);
});
test('fractions and incorrect lesson actions cannot change the state or progress', () => {
  const first = createTutorial();
  assert.throws(() => advanceTutorial(first, 'activate'), /paso/);
  const purchased = advanceTutorial(first, 'buy');
  const saved = saveTutorial(purchased);
  for (const value of [1.5, NaN, 0, 3]) assert.throws(() => advanceTutorial(purchased, 'load', value));
  assert.equal(saveTutorial(purchased), saved); assert.equal(tutorialStep(purchased), 1);
});
test('valid ledger files from other exercises do not forge tutorial completion', () => {
  const plan = applyCommand(createTutorial(), { commandId: 'other', sideId: 'blue', kind: 'buy', orderId: 'other-order', offerId: 'training-kit', quantity: 2 });
  assert.throws(() => tutorialStep(plan), /pasos/);
  const forged = JSON.parse(saveTutorial(createTutorial())); forged.initial.budget = 999;
  assert.throws(() => loadTutorial(JSON.stringify(forged)), /ajeno/);
});
