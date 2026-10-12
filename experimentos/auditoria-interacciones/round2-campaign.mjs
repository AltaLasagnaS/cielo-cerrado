// Cada caso se ejecuta en un proceso independiente: el puente posee un singleton
// y un fallo no debe contaminar otros diagnósticos.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { moduleOf, save, provenance } from './context.mjs';
const { S } = await moduleOf('src/sim/state.js');
const { addJam, addSalvo } = await moduleOf('src/sim/setup.js');
const { buildThreat } = await moduleOf('src/physics/kinematics.js');
const { contactOf } = await moduleOf('src/sim/contacts.js');
const { UNIT_TARGET } = await moduleOf('src/data/index.js');
const { portCampaignDefinition } = await moduleOf('experimentos/catalogo-presupuesto/data/port-campaign.mjs');
const { createOperations, applyOperationResourceCommand, saveOperations } = await moduleOf('experimentos/catalogo-presupuesto/lib/operations.mjs');
const { startPortCombat } = await moduleOf('experimentos/catalogo-presupuesto/lib/port-combat.mjs');

function fixture(two = false, quantity = 4) {
  // Plantilla del libro, copiada. Las identidades de munición son aliases del
  // fixture: no se cargan misiles Buk/S-125 en NASAMS ni se agrega un catálogo.
  const rename = v => typeof v === 'string' ? v.replaceAll('buk', 'audit-a').replaceAll('s125', 'audit-b')
    : Array.isArray(v) ? v.map(rename) : v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, rename(x)])) : v;
  const def = rename(portCampaignDefinition(two ? ['buk', 's125'] : ['buk']));
  for (const a of def.assets.filter(a => a.kind === 'unit')) {
    a.engineType = 'nasams'; a.engineName = `FIXTURE-${a.id}`;
    a.x = two ? (a.id === 'audit-a' ? 30 : 50) : 40; a.y = two ? 10 : 40; a.az = 0;
  }
  for (const c of def.resourceInitial.inventory.configurations) c.basis.note =
    'Fixture de auditoría del libro. Aliases abstractos de rondas; no configuración ni munición militar certificadas.';
  let op = createOperations(def), seq = 0;
  const command = (kind, atSeconds, rest = {}) => {
    op = applyOperationResourceCommand(op, { commandId: `fixture-${++seq}`, sideId: 'ua', kind, atSeconds, ...rest });
  };
  for (const id of two ? ['audit-a', 'audit-b'] : ['audit-a']) command('order', 0,
    { jobId: `supply-${id}`, quoteId: `${id}-supply`, quantity });
  command('advance', 120);
  for (const id of two ? ['audit-a', 'audit-b'] : ['audit-a']) command('transfer', 120,
    { jobId: `load-${id}`, serviceId: `${id}-reload`, ammunitionId: `legacy-${id}`, quantity: Math.min(4, quantity) });
  command('advance', 1800);
  return { op, battle: startPortCombat(op, 7) };
}
function finish(battle) { let n = 0; while (battle.step()) { if (++n > 40000) throw Error('Puente no termina en 10.000 s'); } }
function noisy(mode, two = false, quantity = 4, delayed = false) {
  const f = fixture(two, quantity); S.pending = [];
  const j = addJam('soj', 40, two ? 30 : 10, { alt: 8000, mode });
  S.jamsLive = [{ ...j, hp: UNIT_TARGET.hp, _losMap: {} }];
  if (delayed) {
    const sv = addSalvo({ type: 'shahed', tStart: 850, pts: [[5, 5], [5, 5.1]], agl: 50 });
    S.pending = [buildThreat(sv, 0, 850, S.wind)];
  }
  return f;
}
const rows = {
  'campaign-hoj-ui-progress': () => {
    const { battle } = noisy('barrage', true); S.running = true;
    const more = battle.step(); assert(S.hoj.length > 0, 'HOJ genuino debe lanzar');
    const initial = { bridgeHasMore: more, engineRunning: S.running, viewFinished: battle.view().finished,
      pendingHoj: S.hoj.filter(h => !h.done).length, time: S.t, arrival: S.hoj[0].tH };
    finish(battle);
    return { holds: !more || initial.engineRunning, priority: 'P1', audit: 'F05-campaña', observed: { initial, manuallyCompletedAt: S.t } };
  },
  'campaign-hoj-ammunition': () => {
    const { op, battle } = noisy('barrage', true); finish(battle);
    const out = battle.getOperation(), totals = out.resources.inventory.totals;
    const observed = { engineShots: S.stats.shots, hojShots: S.hoj.length,
      expended: totals.reduce((n, t) => n + t.expended, 0), balances: { before: op.resources.balance, after: out.resources.balance }, totals };
    assert(observed.hojShots > 0, 'control exige HOJ real');
    return { holds: observed.engineShots === observed.expended && observed.expended === observed.hojShots
      && observed.balances.before === observed.balances.after, audit: 'contabilidad-control', priority: 'CONTROL', observed };
  },
  'campaign-drfm-reload-ammunition': () => {
    const { op, battle } = noisy('drfm', false, 8, true); finish(battle);
    const out = battle.getOperation(), totals = out.resources.inventory.totals;
    const phantom = S.rec.ints.filter(i => i.phantom).length;
    assert(phantom > 4, 'debe disparar tras completar al menos una recarga del libro');
    const observed = { phantomShots: phantom, engineShots: S.stats.shots, expended: totals.reduce((n,t)=>n+t.expended,0),
      beforeBalance: op.resources.balance, afterBalance: out.resources.balance,
      jobs: out.resources.jobs.map(j => ({ kind: j.kind, serviceId: j.serviceId, status: j.status })), totals };
    return { holds: observed.expended === observed.engineShots && observed.engineShots === phantom
      && observed.expended === 8 && observed.beforeBalance === observed.afterBalance, audit: 'contabilidad-control', priority: 'CONTROL', observed };
  },
  'campaign-observation-equality': () => {
    const op = createOperations(portCampaignDefinition(['radar'])), battle = startPortCombat(op, 7);
    const th = S.pending[0]; S.pending = []; S.threats = [th]; S.t = 11;
    th.alive = true; th.seenPrev = { x: 1,y: 1,z: 50,t: 9 }; th.seen = { x: 2,y: 1,z: 50,t: 10,by: S.units[0].id };
    const a = battle.view().contacts, engineA = contactOf(th, 11);
    th.alive = false; const b = battle.view().contacts, engineB = contactOf(th, 11); finish(battle);
    return { holds: JSON.stringify(a) === JSON.stringify(b), audit: 'F08-control', priority: 'CONTROL',
      observed: { campaignAliveWorld: a, campaignDeadWorld: b, engineAliveWorld: engineA, engineDeadWorld: engineB } };
  }
};
const id = process.argv.find(a => a.startsWith('--case='))?.slice(7);
if (process.argv.includes('--fixture')) {
  const { op } = fixture(true, 4); process.stdout.write(saveOperations(op));
} else if (id) {
  const t = performance.now();
  try { assert(rows[id], 'caso desconocido'); const r = rows[id]();
    console.log(JSON.stringify({ id, ...r, status: r.holds ? 'HOLDS' : 'VIOLATED', milliseconds: performance.now()-t }));
    process.exitCode=r.holds?0:2;
  } catch(e) { console.log(JSON.stringify({ id, status:'ERROR', error:e.stack }));process.exitCode=1; }
} else {
  const cases = Object.keys(rows).map(id => {
    try {
      const r=spawnSync(process.execPath,[fileURLToPath(import.meta.url),`--case=${id}`],{encoding:'utf8',timeout:20000});
      if(r.error||r.signal)throw r.error||Error(r.signal);
      const row=JSON.parse(r.stdout);assert(r.status===(row.status==='ERROR'?1:row.status==='VIOLATED'?2:0),'salida incoherente');return row;
    }
    catch(e) { return { id,status:'ERROR',error:e.message }; }
  });
  const summary = Object.fromEntries(['HOLDS','VIOLATED','ERROR'].map(s=>[s,cases.filter(r=>r.status===s).length]));
  save('round2-campaign.json',{provenance:provenance(),fixtureScope:'Operación sintética con aliases genéricos de munición, NASAMS del catálogo sin cambios y stock/servicios del libro real. No reconstrucción de Odesa ni nueva configuración real.',summary,cases});
  for(const c of cases)console.log(`${c.status} ${c.id}`);
  console.log(JSON.stringify(summary));process.exitCode=summary.ERROR?1:summary.VIOLATED?2:0;
}
