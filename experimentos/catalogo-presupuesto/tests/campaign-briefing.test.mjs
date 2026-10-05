import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaign, applyCampaignCommand } from '../lib/logistics.mjs';
import { buildCampaignBriefing } from '../lib/campaign-briefing.mjs';
import { demoCampaign } from '../data/demo-campaign.mjs';

function report() {
  return { sideId: 'blue', missionId: 'port-one', role: 'defence', title: 'Puerto · ejercicio ficticio',
    issuedAtSeconds: 0, objectives: [{ id: 'port', text: 'Mantener operativa la instalación durante la misión.', deadlineSeconds: 3600 }],
    intelligence: [{ id: 'warning', text: 'Posible ataque: composición desconocida.', confidence: 'unconfirmed',
      sourceLabel: 'Informe ficticio', observedAtSeconds: -600, receivedAtSeconds: -120 }] };
}
test('campaign briefing shows own resources and ages reports from observation, without an enemy plan', () => {
  const state = createCampaign(demoCampaign()), input = report();
  const briefing = buildCampaignBriefing(state, input);
  assert.equal(briefing.resources.balance, 1200); assert.equal(briefing.intelligence[0].ageSeconds, 600);
  assert.equal(briefing.intelligence[0].deliveryDelaySeconds, 480);
  assert.equal(Object.hasOwn(briefing, 'enemy'), false); assert.equal(Object.hasOwn(briefing.resources, 'quotes'), false);
  input.intelligence[0].text = 'Texto posterior';
  assert.equal(briefing.intelligence[0].text, 'Posible ataque: composición desconocida.');
  assert.ok(Object.isFrozen(briefing.resources.stock));
});
test('campaign briefing rejects future/foreign/extra information and combat phases', () => {
  let state = createCampaign(demoCampaign());
  assert.throws(() => buildCampaignBriefing(state, { ...report(), sideId: 'red' }), /otro bando/);
  assert.throws(() => buildCampaignBriefing(state, { ...report(), issuedAtSeconds: 1 }), /reloj/);
  assert.throws(() => buildCampaignBriefing(state, { ...report(), enemyLaunches: [] }), /campos/);
  state = applyCampaignCommand(state, { commandId: 'start', sideId: 'blue', atSeconds: 0, kind: 'activate' });
  assert.throws(() => buildCampaignBriefing(state, report()), /preparación/);
});
