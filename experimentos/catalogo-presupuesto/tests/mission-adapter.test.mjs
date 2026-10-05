import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaign, applyCampaignCommand } from '../lib/logistics.mjs';
import { attachMission, loadMission } from '../lib/mission-adapter.mjs';
import { demoCampaign } from '../data/demo-campaign.mjs';

const binding = () => ({ unitId: 7, readyLocationId: 'launcher-stock', reserveLocationId: 'depot',
  ammunitionIds: ['alpha', 'beta'], reloadServiceId: 'reload' });
function active() {
  let state = createCampaign(demoCampaign());
  state = applyCampaignCommand(state, { commandId: 'prep-clock', sideId: 'blue', atSeconds: 60, kind: 'advance' });
  return applyCampaignCommand(state, { commandId: 'activate', sideId: 'blue', atSeconds: 60, kind: 'activate' });
}
function adapter() { return attachMission(active(), { sideId: 'blue', bindings: [binding()] }); }
const stock = adapter => adapter.ammunition(7).find(row => row.ammunitionId === 'alpha');

test('engine quarter-second clock keeps its mission origin and ammunition stays in one authority', () => {
  const session = adapter();
  session.advance({ missionSeconds: 0.25 });
  assert.equal(session.getCampaign().clockSeconds, 60.25); assert.equal(session.getMissionSeconds(), 0.25);
  session.reload({ requestId: 'reload-one', missionSeconds: 0.25, unitId: 7, ammunitionId: 'alpha', quantity: 4 });
  assert.deepEqual(stock(session), { ammunitionId: 'alpha', ready: 0, reserve: 8 });
  session.advance({ missionSeconds: 60 }); assert.equal(stock(session).ready, 0);
  session.advance({ missionSeconds: 60.25 }); assert.equal(stock(session).ready, 4);
  session.fire({ requestId: 'shot-one', missionSeconds: 60.25, unitId: 7, ammunitionId: 'alpha', quantity: 1 });
  assert.equal(stock(session).ready, 3); assert.equal(session.getCampaign().inventory.totals[0].expended, 1);
  assert.equal(session.getCampaign().balance, 1190, 'firing does not charge again');
});

test('shot retry after later ticks or mission end does not consume twice', () => {
  const session = adapter();
  session.reload({ requestId: 'reload-one', missionSeconds: 0, unitId: 7, ammunitionId: 'alpha', quantity: 4 });
  const shot = { requestId: 'shot-one', missionSeconds: 60, unitId: 7, ammunitionId: 'alpha', quantity: 1 };
  session.fire(shot); session.advance({ missionSeconds: 60.5 }); session.fire(shot);
  assert.equal(stock(session).ready, 3);
  assert.throws(() => session.fire({ ...shot, quantity: 2 }), /reutilizado/);
  session.finish({ requestId: 'finish-one', missionSeconds: 61 }); session.fire(shot);
  assert.equal(stock(session).ready, 3); assert.equal(session.getCampaign().phase, 'completed');
  assert.throws(() => session.advance({ missionSeconds: 62 }), /terminó/);
});

test('failed engine operation does not commit even the proposed clock advancement', () => {
  const session = adapter(), initial = session.save();
  assert.throws(() => session.fire({ requestId: 'bad-shot', missionSeconds: 0.25, unitId: 7, ammunitionId: 'alpha', quantity: 1 }), /insuficientes/);
  assert.equal(session.save(), initial);
  assert.throws(() => session.reload({ requestId: 'bad-load', missionSeconds: 1, unitId: 7, ammunitionId: 'alpha', quantity: 1.5 }), /entero/);
  assert.equal(session.save(), initial);
  assert.throws(() => session.advance({ missionSeconds: NaN }), /finitos/);
  session.advance({ missionSeconds: 0.5 });
  assert.throws(() => session.advance({ missionSeconds: 0.25 }), /retrocede/);
});

test('degraded radar stays usable; disabled blocks; destroyed launcher loses its load', () => {
  const session = adapter();
  session.reload({ requestId: 'reload-one', missionSeconds: 0, unitId: 7, ammunitionId: 'alpha', quantity: 4 });
  session.advance({ missionSeconds: 60 });
  session.damage({ requestId: 'radar-degraded', missionSeconds: 60, componentId: 'radar', condition: 'degraded' });
  session.fire({ requestId: 'shot-one', missionSeconds: 60.25, unitId: 7, ammunitionId: 'alpha', quantity: 1 });
  session.damage({ requestId: 'radar-disabled', missionSeconds: 60.5, componentId: 'radar', condition: 'disabled' });
  assert.throws(() => session.fire({ requestId: 'blocked', missionSeconds: 60.75, unitId: 7, ammunitionId: 'alpha', quantity: 1 }), /no operativa/);
  session.damage({ requestId: 'launcher-destroyed', missionSeconds: 61, componentId: 'launcher', condition: 'destroyed' });
  assert.equal(stock(session).ready, 0); assert.equal(stock(session).reserve, 8);
  assert.equal(session.getCampaign().inventory.totals[0].lost, 3);
});

test('resume preserves origin, pending reload and typed inventory; next mission never restores stocks', () => {
  let session = adapter();
  session.reload({ requestId: 'reload-one', missionSeconds: 0.25, unitId: 7, ammunitionId: 'alpha', quantity: 4 });
  session.advance({ missionSeconds: 30.5 });
  const saved = session.save(), before = session.getCampaign();
  session = loadMission(saved, 'blue');
  assert.deepEqual(session.getCampaign(), before); assert.equal(session.getMissionSeconds(), 30.5);
  assert.throws(() => loadMission(saved, 'red'), /otro bando/);
  session.advance({ missionSeconds: 60.25 });
  session.fire({ requestId: 'shot-one', missionSeconds: 60.25, unitId: 7, ammunitionId: 'alpha', quantity: 2 });
  session.finish({ requestId: 'finish-one', missionSeconds: 60.5 });
  let campaign = session.getCampaign();
  campaign = applyCampaignCommand(campaign, { commandId: 'next', sideId: 'blue', atSeconds: 120.5, kind: 'begin-mission', missionId: 'second' });
  campaign = applyCampaignCommand(campaign, { commandId: 'activate-second', sideId: 'blue', atSeconds: 120.5, kind: 'activate' });
  const second = attachMission(campaign, { sideId: 'blue', bindings: [binding()] });
  assert.equal(second.getMissionSeconds(), 0); assert.equal(stock(second).ready, 2);
  assert.equal(second.getCampaign().inventory.totals[0].expended, 2);
});

test('bindings reject duplicate physical launchers, foreign side, unknown units/types and mismatched reload services', () => {
  const state = active();
  assert.throws(() => attachMission(state, { sideId: 'red', bindings: [binding()] }), /otro bando/);
  assert.throws(() => attachMission(state, { sideId: 'blue', bindings: [binding(), { ...binding(), unitId: 8 }] }), /dos veces/);
  assert.throws(() => attachMission(state, { sideId: 'blue', bindings: [{ ...binding(), ammunitionIds: ['unknown'] }] }), /no admitida/);
  assert.throws(() => attachMission(state, { sideId: 'blue', bindings: [{ ...binding(), reloadServiceId: 'workshop' }] }), /no corresponde/);
  assert.throws(() => adapter().ammunition(100), /sin asignación/);
  assert.throws(() => adapter().fire({ requestId: 'fake', missionSeconds: 0, unitId: 7, ammunitionId: 'unknown', quantity: 1 }), /ajena/);
  assert.throws(() => adapter().damage({ requestId: 'recover', missionSeconds: 0, componentId: 'radar', condition: 'operational' }), /requiere reparación/);
});
