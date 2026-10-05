import test from 'node:test';
import assert from 'node:assert/strict';
import { demoOperations } from '../data/demo-operations.mjs';
import { createOperations, applyOperationResourceCommand, activateOperationMission, syncOperationResources,
  completeOperationMission, continueOperations, operationView, operationMission, saveOperations, loadOperations } from '../lib/operations.mjs';
import { attachMission } from '../lib/mission-adapter.mjs';

const binding = { unitId: 7, readyLocationId: 'launcher-stock', reserveLocationId: 'depot', ammunitionIds: ['alpha'], reloadServiceId: 'reload' };
function ready() {
  let op = createOperations(demoOperations());
  op = applyOperationResourceCommand(op, { commandId: 'load', sideId: 'blue', atSeconds: 0, kind: 'transfer',
    jobId: 'load-job', serviceId: 'reload', ammunitionId: 'alpha', quantity: 4 });
  op = applyOperationResourceCommand(op, { commandId: 'wait-load', sideId: 'blue', atSeconds: 60, kind: 'advance' });
  op = activateOperationMission(op, 'launch-mission');
  return { op, session: attachMission(op.resources, { sideId: 'blue', bindings: [binding] }) };
}
const outcomes = (batteryHp = 80, portHp = 700) => [
  { id: 'battery', hp: batteryHp, x: 11, y: 10, mapKey: 'fixture', restoredByJobId: null },
  { id: 'port', hp: portHp, x: 12, y: 12, mapKey: 'fixture', restoredByJobId: null }
];
const intel = [{ id: 'report-one', text: 'Actividad aérea al este, sin cantidad confirmada', confidence: 'probable',
  sourceLabel: 'Reporte autorizado', observedAtSeconds: 50, receivedAtSeconds: 60 }];
function finished(damage = false) {
  let { op, session } = ready();
  session.fire({ requestId: 'shot', missionSeconds: 0.25, unitId: 7, ammunitionId: 'alpha', quantity: 2 });
  session.order({ requestId: 'supply', missionSeconds: 1, quoteId: 'alpha-supply', quantity: 2 });
  if (damage) session.damage({ requestId: 'damaged-radar', missionSeconds: 1.25, componentId: 'radar', condition: 'degraded' });
  session.finish({ requestId: 'end-battle', missionSeconds: 30.5 });
  const input = { requestId: 'debrief-one', resources: session.getCampaign(), result: 'parcial',
    assetOutcomes: outcomes(), intelligence: intel, summary: 'Puerto dañado; quedan medios propios.' };
  op = completeOperationMission(op, input);
  return { op, input };
}

test('continuity preserves typed stock, damage, position, budget and delayed supply across nights', () => {
  let { op } = finished();
  const balance = op.resources.balance, used = op.resources.inventory.totals[0].expended;
  assert.equal(op.resources.jobs.find(j => j.id === 'supply').status, 'pending');
  op = continueOperations(op, 'next-night');
  assert.equal(op.currentMissionId, 'port-two'); assert.equal(op.resources.clockSeconds, 86490.5);
  assert.equal(op.assets.find(a => a.id === 'port').hp, 700);
  assert.equal(op.assets.find(a => a.id === 'battery').x, 11);
  assert.equal(op.resources.balance, balance); assert.equal(used, 2);
  assert.equal(op.resources.inventory.totals[0].expended, used);
  assert.equal(op.resources.jobs.find(j => j.id === 'supply').status, 'completed');
  assert.equal(op.resources.inventory.stock.find(s => s.locationId === 'launcher-stock' && s.ammunitionId === 'alpha').quantity, 2);
  const view = operationView(op);
  assert.equal(view.briefing.intelligence[0].ageSeconds, 86440.5, 'age keeps original observation time');
  assert.equal(view.briefing.intelligence[0].deliveryDelaySeconds, 10);
  assert.equal(Object.hasOwn(view, 'definition'), false);
  assert.equal(Object.hasOwn(view, 'scenarioKey'), false);
  assert.equal(saveOperations(loadOperations(saveOperations(op), 'blue')), saveOperations(op));
});

test('restore active mission preserves authentic resource events; caller must finalize before debrief', () => {
  let { op, session } = ready();
  session.fire({ requestId: 'shot', missionSeconds: 0.25, unitId: 7, ammunitionId: 'alpha', quantity: 1 });
  op = syncOperationResources(op, session.getCampaign(), 'checkpoint-one');
  const restored = loadOperations(saveOperations(op), 'blue');
  assert.equal(restored.phase, 'active'); assert.equal(restored.resources.inventory.totals[0].expended, 1);
  assert.equal(restored.resources.clockSeconds, 60.25);
  assert.throws(() => completeOperationMission(op, { requestId: 'bad-finish', resources: op.resources,
    result: 'exito', assetOutcomes: outcomes(), intelligence: [], summary: 'Terminado' }), /finalizar/);
  assert.throws(() => continueOperations(op, 'skip'), /Terminar/);
});

test('debrief is idempotent after continuation; changed outcome under same ID rejected', () => {
  const { op, input } = finished();
  assert.equal(completeOperationMission(op, input), op);
  const later = continueOperations(op, 'next-night');
  assert.equal(completeOperationMission(later, input), later);
  assert.throws(() => completeOperationMission(later, { ...input, result: 'exito' }), /reutilizado/);
});

test('campaign ending follows result branch; losing does not automatically refill or repair', () => {
  const raw = demoOperations(); raw.missions[0].next.fracaso = null;
  let op = createOperations(raw); op = activateOperationMission(op, 'start');
  const session = attachMission(op.resources, { sideId: 'blue', bindings: [binding] });
  session.damage({ requestId: 'lost-radar', missionSeconds: 0.25, componentId: 'radar', condition: 'destroyed' });
  session.finish({ requestId: 'finish', missionSeconds: 1 });
  op = completeOperationMission(op, { requestId: 'report', resources: session.getCampaign(), result: 'fracaso',
    assetOutcomes: outcomes(0, 0), intelligence: [], summary: 'Se perdió el sector.' });
  op = continueOperations(op, 'stop'); assert.equal(op.phase, 'finished');
  assert.equal(op.assets[0].hp, 0); assert.equal(op.resources.inventory.components.find(c => c.id === 'radar').condition, 'destroyed');
  assert.equal(op.resources.inventory.totals[0].acquired, 0);
  assert.equal(loadOperations(saveOperations(op), 'blue').phase, 'finished');
});

test('restrictions reject unavailable supply, future reports, foreign assets and incomplete outcomes atomically', () => {
  const initial = createOperations(demoOperations()), before = saveOperations(initial);
  assert.throws(() => applyOperationResourceCommand(initial, { commandId: 'forbidden', sideId: 'blue', atSeconds: 0,
    kind: 'order', jobId: 'hidden-job', quoteId: 'beta-supply', quantity: 1 }), /disponible/);
  assert.throws(() => applyOperationResourceCommand(initial, { commandId: 'late', sideId: 'blue', atSeconds: 301, kind: 'advance' }), /ventana/);
  assert.equal(saveOperations(initial), before);
  const { op, input } = finished();
  assert.throws(() => completeOperationMission(op, { ...input, assetOutcomes: [{ ...input.assetOutcomes[0], id: 'enemy' }] }), /reutilizado/);
  const a = ready(); a.session.finish({ requestId: 'end', missionSeconds: 1 });
  const finish = { requestId: 'first', resources: a.session.getCampaign(), result: 'parcial', assetOutcomes: outcomes(), intelligence: [], summary: 'Misión.' };
  const snapshot = saveOperations(a.op);
  assert.throws(() => completeOperationMission(a.op, { ...finish, assetOutcomes: outcomes().slice(0, 1) }), /Falta estado/);
  assert.throws(() => completeOperationMission(a.op, { ...finish, intelligence: [{ ...intel[0], receivedAtSeconds: 62 }] }), /Cronología/);
  assert.throws(() => completeOperationMission(a.op, { ...finish, assetOutcomes: [{ ...outcomes()[0], id: 'enemy' }, outcomes()[1]] }), /pertenece/);
  assert.equal(saveOperations(a.op), snapshot);
});

test('no free health restoration; paid completed repair applies once to its own asset', () => {
  const normal = continueOperations(finished().op, 'next');
  assert.throws(() => applyOperationResourceCommand(normal, { commandId: 'unneeded', sideId: 'blue', atSeconds: normal.resources.clockSeconds,
    kind: 'repair', jobId: 'unneeded-job', serviceId: 'workshop', componentId: 'radar' }), /no reparable/);
  let { op } = finished(true); op = continueOperations(op, 'next');
  const before = op.resources.balance, start = op.resources.clockSeconds;
  op = applyOperationResourceCommand(op, { commandId: 'repair', sideId: 'blue', atSeconds: op.resources.clockSeconds,
    kind: 'repair', jobId: 'repair-job', serviceId: 'workshop', componentId: 'radar' });
  assert.equal(op.resources.balance, before - 50);
  op = applyOperationResourceCommand(op, { commandId: 'wait-repair', sideId: 'blue', atSeconds: start + 240, kind: 'advance' });
  op = activateOperationMission(op, 'start-second');
  const session = attachMission(op.resources, { sideId: 'blue', bindings: [binding] });
  session.finish({ requestId: 'finish-second', missionSeconds: 0.25 });
  const input = { requestId: 'second-debrief', resources: session.getCampaign(), result: 'exito',
    assetOutcomes: outcomes(100, 650), intelligence: [], summary: 'Radar reparado; puerto sigue dañado.' };
  assert.throws(() => completeOperationMission(op, input), /Recuperación sin trabajo/);
  input.assetOutcomes[0].restoredByJobId = 'repair-job';
  const complete = completeOperationMission(op, input);
  assert.equal(complete.assets[0].hp, 100); assert.equal(complete.assets[1].hp, 650);
  assert.deepEqual(complete.usedRecoveryJobs, ['repair-job']);
  assert.equal(saveOperations(loadOperations(saveOperations(complete), 'blue')), saveOperations(complete));
});

test('invalid graph, unknown state snapshots and altered replay rejected', () => {
  let raw = demoOperations(); raw.missions[1].next.exito = 'port-one';
  assert.throws(() => createOperations(raw), /cíclica/);
  raw = demoOperations(); raw.assets[0].enemySalvos = [];
  assert.throws(() => createOperations(raw), /campos/);
  const { op } = finished();
  assert.throws(() => operationView(structuredClone(op)), /ajena/);
  assert.throws(() => loadOperations(saveOperations(op), 'red'), /otro bando/);
  const saved = JSON.parse(saveOperations(op)); saved.events.at(-1).debrief.result = 'unknown';
  assert.throws(() => loadOperations(JSON.stringify(saved), 'blue'), /Resultado/);
  const malformed = JSON.parse(saveOperations(op));
  const shot = malformed.resources.commands.find(c => c.commandId === 'shot');
  malformed.resources.commands.push({ ...shot, outcome: { ...shot.outcome, quantity: 1 } });
  assert.throws(() => loadOperations(JSON.stringify(malformed), 'blue'));
  assert.equal(operationMission(op).assets.length, 2);
});
