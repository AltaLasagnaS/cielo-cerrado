import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaign, applyCampaignCommand, saveCampaign, loadCampaign } from '../lib/logistics.mjs';
import { demoCampaign } from '../data/demo-campaign.mjs';

let seq = 0;
const apply = (state, kind, properties = {}) => applyCampaignCommand(state, {
  commandId: `test-${++seq}`, sideId: state.sideId, atSeconds: state.clockSeconds, kind, ...properties
});
const qty = (state, locationId, ammunitionId = 'alpha') => state.inventory.stock.find(row => row.locationId === locationId && row.ammunitionId === ammunitionId)?.quantity ?? 0;
const component = (state, componentId = 'radar') => state.inventory.components.find(row => row.id === componentId);
function invariant(state) {
  for (const total of state.inventory.totals) {
    const initial = state.initial.inventory.stock.filter(row => row.ammunitionId === total.ammunitionId).reduce((sum, row) => sum + row.quantity, 0);
    const stock = state.inventory.stock.filter(row => row.ammunitionId === total.ammunitionId).reduce((sum, row) => sum + row.quantity, 0);
    assert.equal(stock + total.expended + total.lost, initial + total.acquired);
  }
  const paid = state.jobs.reduce((sum, job) => sum + (job.kind === 'delivery' && job.status === 'cancelled' ? 0 : job.paid), 0);
  assert.equal(state.balance + paid, state.initial.budget);
}
function ready() {
  let state = createCampaign(demoCampaign());
  state = apply(state, 'transfer', { jobId: 'load-one', serviceId: 'reload', ammunitionId: 'alpha', quantity: 4 });
  state = apply(state, 'advance', { atSeconds: 60 });
  return apply(state, 'activate');
}

test('delivery pays once, consumes quote availability, and arrives only after its deadline', () => {
  let state = createCampaign(demoCampaign());
  const command = { commandId: 'purchase', sideId: 'blue', atSeconds: 0, kind: 'order', jobId: 'supply', quoteId: 'alpha-supply', quantity: 4 };
  state = applyCampaignCommand(state, command);
  assert.equal(state.balance, 1100); assert.equal(state.quotes[0].remaining, 16);
  assert.equal(qty(state, 'depot'), 12); assert.equal(state.inventory.totals[0].acquired, 0);
  state = apply(state, 'advance', { atSeconds: 299 }); assert.equal(qty(state, 'depot'), 12);
  state = apply(state, 'advance', { atSeconds: 300 }); assert.equal(qty(state, 'depot'), 16);
  assert.equal(applyCampaignCommand(state, command), state);
  assert.deepEqual(loadCampaign(saveCampaign(state)), state); invariant(state);
});

test('quote cancellation policy is explicit; completed deliveries cannot refund', () => {
  let state = createCampaign(demoCampaign());
  state = apply(state, 'order', { jobId: 'supply', quoteId: 'alpha-supply', quantity: 4 });
  state = apply(state, 'cancel', { jobId: 'supply' });
  assert.equal(state.balance, 1200); assert.equal(state.quotes[0].remaining, 20);
  state = apply(state, 'order', { jobId: 'committed', quoteId: 'beta-supply', quantity: 1 });
  assert.throws(() => apply(state, 'cancel', { jobId: 'committed' }), /no admite/);
  state = apply(state, 'advance', { atSeconds: 180 });
  assert.throws(() => apply(state, 'cancel', { jobId: 'committed' }), /no cancelable/);
  invariant(state);
});

test('reload reserves physical cargo, takes time and cannot duplicate a service or stock', () => {
  let state = createCampaign(demoCampaign());
  state = apply(state, 'transfer', { jobId: 'load', serviceId: 'reload', ammunitionId: 'alpha', quantity: 4 });
  assert.equal(qty(state, 'depot'), 8); assert.equal(qty(state, 'cargo'), 4); assert.equal(qty(state, 'launcher-stock'), 0);
  assert.throws(() => apply(state, 'transfer', { jobId: 'duplicate', serviceId: 'reload', ammunitionId: 'alpha', quantity: 4 }), /ocupado/);
  state = apply(state, 'advance', { atSeconds: 59 }); assert.equal(qty(state, 'launcher-stock'), 0);
  state = apply(state, 'advance', { atSeconds: 60 }); assert.equal(qty(state, 'launcher-stock'), 4);
  state = apply(state, 'activate');
  state = apply(state, 'outcome', { outcome: { kind: 'expend', fromId: 'launcher-stock', ammunitionId: 'alpha', quantity: 1 } });
  assert.equal(state.balance, 1190); assert.equal(qty(state, 'launcher-stock'), 3); invariant(state);
});

test('mixed-load rejection leaves cargo in transit and return also requires time and payment', () => {
  let state = ready();
  state = apply(state, 'transfer', { jobId: 'wrong-mix', serviceId: 'reload', ammunitionId: 'beta', quantity: 2 });
  state = apply(state, 'advance', { atSeconds: 120 });
  assert.equal(state.jobs.at(-1).status, 'interrupted'); assert.equal(qty(state, 'cargo', 'beta'), 2);
  assert.equal(qty(state, 'launcher-stock', 'beta'), 0);
  state = apply(state, 'cancel', { jobId: 'wrong-mix' });
  assert.equal(qty(state, 'depot', 'beta'), 6); assert.equal(state.balance, 1170);
  assert.throws(() => apply(state, 'cancel', { jobId: 'wrong-mix' }), /Retorno/);
  state = apply(state, 'advance', { atSeconds: 180 });
  assert.equal(qty(state, 'depot', 'beta'), 8); assert.equal(state.jobs.at(-1).status, 'returned'); invariant(state);
});

test('cargo losses and a destroyed destination never replenish a launcher', () => {
  let state = createCampaign(demoCampaign());
  state = apply(state, 'transfer', { jobId: 'load', serviceId: 'reload', ammunitionId: 'alpha', quantity: 4 });
  state = apply(state, 'advance', { atSeconds: 30 });
  state = apply(state, 'outcome', { outcome: { kind: 'loss', fromId: 'cargo', ammunitionId: 'alpha', quantity: 2 } });
  state = apply(state, 'outcome', { outcome: { kind: 'condition', componentId: 'launcher', condition: 'destroyed' } });
  state = apply(state, 'advance', { atSeconds: 60 });
  assert.equal(state.jobs[0].status, 'interrupted'); assert.equal(qty(state, 'launcher-stock'), 0);
  state = apply(state, 'cancel', { jobId: 'load' });
  state = apply(state, 'advance', { atSeconds: 120 });
  assert.equal(qty(state, 'depot'), 10); assert.equal(state.inventory.totals[0].lost, 2); invariant(state);
});

test('repair spends finite spares and money, restores after its deadline, and cannot resurrect destruction', () => {
  let state = ready();
  state = apply(state, 'outcome', { outcome: { kind: 'condition', componentId: 'radar', condition: 'disabled' } });
  state = apply(state, 'repair', { jobId: 'repair-one', serviceId: 'workshop', componentId: 'radar' });
  assert.equal(state.spares[0].quantity, 2); assert.equal(state.balance, 1140);
  assert.throws(() => apply(state, 'outcome', { outcome: { kind: 'condition', componentId: 'radar', condition: 'operational' } }), /requiere reparación/);
  assert.throws(() => apply(state, 'outcome', { outcome: { kind: 'expend', fromId: 'launcher-stock', ammunitionId: 'alpha', quantity: 1 } }), /no operativa/);
  state = apply(state, 'advance', { atSeconds: 299 }); assert.equal(component(state).condition, 'disabled');
  state = apply(state, 'advance', { atSeconds: 300 }); assert.equal(component(state).condition, 'operational');
  state = apply(state, 'outcome', { outcome: { kind: 'condition', componentId: 'radar', condition: 'disabled' } });
  state = apply(state, 'repair', { jobId: 'repair-two', serviceId: 'workshop', componentId: 'radar' });
  state = apply(state, 'outcome', { outcome: { kind: 'condition', componentId: 'radar', condition: 'destroyed' } });
  state = apply(state, 'advance', { atSeconds: 540 });
  assert.equal(state.jobs.at(-1).status, 'failed'); assert.equal(component(state).condition, 'destroyed');
  assert.throws(() => apply(state, 'repair', { jobId: 'impossible', serviceId: 'workshop', componentId: 'radar' }), /no reparable/);
  assert.deepEqual(loadCampaign(saveCampaign(state)), state); invariant(state);
});

test('next mission preserves clock, damage, acquisitions, finite offers, running jobs and expenditure', () => {
  let state = ready();
  state = apply(state, 'order', { jobId: 'supply', quoteId: 'alpha-supply', quantity: 4 });
  state = apply(state, 'outcome', { outcome: { kind: 'expend', fromId: 'launcher-stock', ammunitionId: 'alpha', quantity: 2 } });
  state = apply(state, 'outcome', { outcome: { kind: 'condition', componentId: 'control', condition: 'disabled' } });
  state = apply(state, 'finish'); state = apply(state, 'advance', { atSeconds: 100 });
  state = apply(state, 'begin-mission', { missionId: 'port-two' });
  assert.equal(qty(state, 'launcher-stock'), 2); assert.equal(component(state, 'control').condition, 'disabled');
  assert.equal(state.jobs.at(-1).status, 'pending'); assert.equal(state.balance, 1090);
  assert.equal(state.clockSeconds, 100); assert.equal(state.quotes[0].remaining, 16);
  state = apply(state, 'advance', { atSeconds: 360 }); assert.equal(qty(state, 'depot'), 12);
  assert.equal(state.inventory.totals[0].expended, 2); assert.equal(state.inventory.totals[0].acquired, 4);
  assert.deepEqual(loadCampaign(saveCampaign(state)), state); invariant(state);
});

test('failed orders, services, invalid clocks and foreign commands are atomic', () => {
  const state = createCampaign(demoCampaign()), saved = saveCampaign(state);
  assert.throws(() => apply(state, 'order', { jobId: 'too-many', quoteId: 'alpha-supply', quantity: 21 }), /disponibilidad/);
  assert.throws(() => apply(state, 'transfer', { jobId: 'too-many', serviceId: 'reload', ammunitionId: 'alpha', quantity: 13 }), /insuficientes/);
  assert.throws(() => apply(state, 'order', { jobId: 'fraction', quoteId: 'alpha-supply', quantity: 1.5 }), /entero/);
  assert.throws(() => apply(state, 'order', { jobId: 'future', quoteId: 'alpha-supply', quantity: 1, atSeconds: 1 }), /reloj/);
  assert.throws(() => apply(state, 'activate', { sideId: 'red' }), /otro bando/);
  assert.throws(() => apply(state, 'outcome', { outcome: { kind: 'receipt', toId: 'depot', ammunitionId: 'alpha', quantity: 1 } }), /inválido/);
  assert.throws(() => apply(state, 'outcome', { outcome: { kind: 'expend', fromId: 'launcher-stock', ammunitionId: 'alpha', quantity: 1 } }), /activa/);
  assert.equal(saveCampaign(state), saved);
  let raw = demoCampaign(); raw.unit = 'USD-2026-minor';
  assert.throws(() => createCampaign(raw), /fuentes/);
  raw = demoCampaign(); raw.services[0].durationSeconds = 0;
  assert.throws(() => createCampaign(raw), /positiva/);
  raw = demoCampaign(); raw.spares[0].quantity = 0;
  let noSpares = createCampaign(raw);
  noSpares = apply(noSpares, 'outcome', { outcome: { kind: 'condition', componentId: 'radar', condition: 'disabled' } });
  assert.throws(() => apply(noSpares, 'repair', { jobId: 'no-parts', serviceId: 'workshop', componentId: 'radar' }), /Repuestos/);
});

test('orders reject an overflow in future receipts before charging the player', () => {
  const raw = demoCampaign(); raw.inventory.stock[0].quantity = Number.MAX_SAFE_INTEGER - 1;
  let state = createCampaign(raw);
  state = apply(state, 'order', { jobId: 'last-safe', quoteId: 'alpha-supply', quantity: 1 });
  const saved = saveCampaign(state);
  assert.throws(() => apply(state, 'order', { jobId: 'overflow', quoteId: 'alpha-supply', quantity: 1 }), /entero/);
  assert.equal(saveCampaign(state), saved);
  state = apply(state, 'advance', { atSeconds: 300 });
  assert.equal(qty(state, 'depot'), Number.MAX_SAFE_INTEGER);
});
