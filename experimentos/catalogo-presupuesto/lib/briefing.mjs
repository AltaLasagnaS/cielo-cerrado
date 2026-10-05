import { deepFreeze, id, integer, seconds } from './common.mjs';
import { savePlan } from './budget.mjs';

// Preparation-only projection, not a sensor fusion engine or a security boundary.
// Caller supplies explicitly authorized reports, NEVER the complete enemy state.
function record(value, keys, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).some(key => !keys.includes(key))) throw new Error(`${name}: campos no admitidos`);
  return value;
}

function text(value, name) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2000) throw new Error(`${name}: texto inválido`);
  return value;
}

function signedTime(value, name) {
  if (!Number.isSafeInteger(value)) throw new Error(`${name}: segundos enteros requeridos`);
  return value;
}

function uniqueList(rows, name, normalize) {
  if (!Array.isArray(rows) || rows.length > 100) throw new Error(`${name}: lista inválida`);
  const ids = new Set();
  return rows.map(row => {
    const normalized = normalize(row);
    if (ids.has(normalized.id)) throw new Error(`${name}: ID duplicado`);
    ids.add(normalized.id);
    return normalized;
  });
}

export function buildPreparationBriefing(plan, input) {
  savePlan(plan); // Verify it is a state produced by the allocation ledger.
  if (plan.phase !== 'planning') throw new Error('El briefing de preparación requiere fase planning');
  const briefing = normalizePreparationBriefing(input, { sideId: plan.sideId, missionId: plan.missions.at(-1).id });
  return deepFreeze({
    format: 'cielo-cerrado/preparation-briefing-prototype', version: 1, ...briefing,
    resources: {
      unit: plan.unit, balance: plan.balance,
      inventory: Object.entries(plan.inventory).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
        .map(([itemId, stock]) => ({ itemId, reserve: stock.reserve, ready: stock.ready, consumed: stock.consumed }))
    }
  });
}

// Shared report/objective validation. Resource owners verify their own state
// and phase before calling; this function never reads world truth.
export function normalizePreparationBriefing(input, context, { fractionalTime = false } = {}) {
  const time = fractionalTime ? seconds : integer;
  const signed = fractionalTime ? (value, name) => seconds(value, name, true) : signedTime;
  record(input, ['sideId', 'missionId', 'role', 'title', 'issuedAtSeconds', 'objectives', 'intelligence'], 'briefing');
  const sideId = id(input.sideId, 'sideId');
  const missionId = id(input.missionId, 'missionId');
  if (sideId !== context.sideId || missionId !== context.missionId) throw new Error('Briefing de otro bando o misión');
  if (!['attack', 'defence'].includes(input.role)) throw new Error('Rol de misión inválido');
  const issuedAtSeconds = time(input.issuedAtSeconds, 'issuedAtSeconds');
  const objectives = uniqueList(input.objectives, 'objetivos', row => {
    record(row, ['id', 'text', 'deadlineSeconds'], 'objetivo');
    return { id: id(row.id), text: text(row.text, 'objetivo'),
      deadlineSeconds: row.deadlineSeconds === null ? null : time(row.deadlineSeconds, 'deadlineSeconds') };
  });
  if (!objectives.length) throw new Error('El briefing necesita al menos un objetivo');
  const intelligence = uniqueList(input.intelligence, 'inteligencia', row => {
    record(row, ['id', 'text', 'confidence', 'sourceLabel', 'observedAtSeconds', 'receivedAtSeconds'], 'reporte');
    if (!['confirmed', 'probable', 'unconfirmed'].includes(row.confidence)) throw new Error('Confianza de reporte inválida');
    const observedAtSeconds = signed(row.observedAtSeconds, 'observedAtSeconds');
    const receivedAtSeconds = signed(row.receivedAtSeconds, 'receivedAtSeconds');
    if (observedAtSeconds > receivedAtSeconds || receivedAtSeconds > issuedAtSeconds) throw new Error('Cronología de reporte inválida');
    return { id: id(row.id), text: text(row.text, 'reporte'), confidence: row.confidence,
      sourceLabel: text(row.sourceLabel, 'sourceLabel'), observedAtSeconds, receivedAtSeconds,
      ageSeconds: time(issuedAtSeconds - observedAtSeconds, 'antigüedad'),
      deliveryDelaySeconds: time(receivedAtSeconds - observedAtSeconds, 'demora') };
  });
  return deepFreeze({
    sideId, missionId, role: input.role, title: text(input.title, 'title'), issuedAtSeconds,
    objectives, intelligence
  });
}
