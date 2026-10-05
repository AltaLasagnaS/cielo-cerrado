import { deepFreeze } from './common.mjs';
import { normalizePreparationBriefing } from './briefing.mjs';
import { saveCampaign } from './logistics.mjs';

// Preparation only. Input consists of already-authorized reports, not enemy
// plans or sensor truth. This is not the commander's live combat perspective.
export function buildCampaignBriefing(campaign, input) {
  saveCampaign(campaign);
  if (campaign.phase !== 'planning') throw Error('Briefing requiere preparación');
  const briefing = normalizePreparationBriefing(input, { sideId: campaign.sideId, missionId: campaign.missions.at(-1).id });
  if (briefing.issuedAtSeconds !== campaign.clockSeconds) throw Error('Briefing debe usar el reloj actual');
  return deepFreeze({ format: 'cielo-cerrado/campaign-preparation-briefing', version: 1, ...briefing,
    resources: { unit: campaign.unit, balance: campaign.balance,
      components: structuredClone(campaign.inventory.components), stock: structuredClone(campaign.inventory.stock),
      spares: structuredClone(campaign.spares), jobs: structuredClone(campaign.jobs),
      ammunitionTotals: structuredClone(campaign.inventory.totals) } });
}
