import test from 'node:test';
import assert from 'node:assert/strict';
import { portCampaignDefinition } from '../data/port-campaign.mjs';
import { createOperations, applyOperationResourceCommand, activateOperationMission, operationScenario, completeMissionReport,
  continueOperations, loadOperations, saveOperations } from '../lib/operations.mjs';
import { attachMission } from '../lib/mission-adapter.mjs';

function ready() {
  let op=createOperations(portCampaignDefinition(['buk','vhf']));
  const cmd=(commandId,atSeconds,kind,rest={})=>{op=applyOperationResourceCommand(op,{commandId,atSeconds,kind,sideId:'ua',...rest});};
  cmd('order',0,'order',{jobId:'supply',quoteId:'buk-supply',quantity:4});cmd('wait',120,'advance');
  cmd('load',120,'transfer',{jobId:'loaded',serviceId:'buk-reload',ammunitionId:'legacy-buk',quantity:4});cmd('wait-loaded',900,'advance');
  return op;
}
function template(op) { return { format:'cielo-cerrado/escenario',version:1,map:{key:'odesa'},scenario:{base:'od_puertos',name:'Puerto de prueba',player:'defensa',goals:[]},
  setup:{defs:[{id:10,type:'buk',name:'Buk-1',mag:16,reserve:200}],objs:op.assets.filter(a=>a.kind==='objective'&&op.definition.missions[0].allowedAssetIds.includes(a.id))
    .map((a,i)=>({id:i+1,type:a.engineType,name:a.engineName,x:a.x,y:a.y})),salvos:[],jams:[]},rules:{} }; }
function ended() {
  let op=ready();const {scenario,bindings}=operationScenario(op,template(op));op=activateOperationMission(op,'mission-start');
  const session=attachMission(op.resources,{sideId:'ua',bindings});const buk=bindings[0];
  session.fire({requestId:'shot',missionSeconds:1,unitId:buk.unitId,ammunitionId:'legacy-buk',quantity:1});
  session.damage({requestId:'damage',missionSeconds:2,componentId:'buk-sensor',condition:'degraded'});
  session.finish({requestId:'finish',missionSeconds:10});
  const report={version:1,scenario:scenario.scenario.name,t:10,side:'defensa',outcome:'parcial',goals:[],
    assets:{units:scenario.setup.defs.map(u=>({id:u.id,name:u.name,type:u.type,x:u.x,y:u.y,alive:true,hp:250,dmgRadar:u.type==='buk',dmgLauncher:false,
      magLeft:u.type==='buk'?3:null,reserveLeft:u.type==='buk'?0:null,located:false})),objectives:scenario.setup.objs.map(g=>({id:g.id,name:g.name,type:g.type,hp:Math.max(0,g.maxHp-100),maxHp:g.maxHp,status:'operativo'})),jammers:[]},
    reports:[{t:5,cls:'info',text:'Pista observada por nuestros sensores'}],spent:{interceptors:1,cost:0,reloads:0}};
  return {op,input:{requestId:'report-one',report,resources:session.getCampaign(),scenarioName:scenario.scenario.name}};
}
test('report v1 continues physical ammunition, damage and friendly HP; scenario counters are derived',()=>{
  let {op,input}=ended();op=completeMissionReport(op,input);
  assert.equal(op.phase,'debrief');assert.equal(op.assets.find(a=>a.id==='buk').hp,250);
  assert.equal(op.intelligence[0].observedAtSeconds,905);assert.equal(op.intelligence[0].confidence,'unconfirmed');
  assert.equal(op.resources.inventory.totals.find(t=>t.ammunitionId==='legacy-buk').expended,1);
  assert.deepEqual(loadOperations(saveOperations(op),'ua').assets,op.assets);
  assert.equal(completeMissionReport(op,input),op);
  op=continueOperations(op,'next');const nextTemplate=template(op);nextTemplate.scenario.base='od_corredor';
  assert.equal(completeMissionReport(op,input),op,'retry remains idempotent after progression');
  nextTemplate.setup.objs=op.assets.filter(a=>a.kind==='objective'&&op.definition.missions[1].allowedAssetIds.includes(a.id)).map((a,i)=>({id:i+1,type:a.engineType,name:a.engineName,x:a.x,y:a.y}));
  const next=operationScenario(op,nextTemplate);const buk=next.scenario.setup.defs.find(u=>u.type==='buk');
  assert.equal(buk.mag,3);assert.equal(buk.reserve,0);assert.equal(buk.hp,250);assert.equal(buk.dmgRadar,true);
  const before=JSON.stringify(nextTemplate);operationScenario(op,nextTemplate);assert.equal(JSON.stringify(nextTemplate),before,'template never mutated');
});
test('reject incompatible side/version, unrecorded ammunition/damage, foreign assets and time',()=>{
  const {op,input}=ended();
  for(const mutate of [r=>{r.version=2;},r=>{r.side='ataque';},r=>{r.t=11;},r=>{r.assets.units.find(u=>u.type==='buk').magLeft=4;},r=>{r.assets.units.find(u=>u.type==='buk').reserveLeft=1;},r=>{r.assets.units[0].name='Unidad ajena';},r=>{r.spent.interceptors=2;},r=>{r.assets.jammers=[{id:5}];}]){
    const report=structuredClone(input.report);mutate(report);assert.throws(()=>completeMissionReport(op,{...input,report}));assert.equal(op.phase,'active');
  }
  assert.throws(()=>completeMissionReport(op,{...input,resources:structuredClone(input.resources)}),/ajena/);
});
test('scenario assembly fails closed on wrong stage and hostile targeting of an absent unit',()=>{
  const op=ready(),t=template(op);t.scenario.base='kv_energia';assert.throws(()=>operationScenario(op,t),/Plantilla/);
  t.scenario.base='od_puertos';t.setup.salvos=[{id:30,targetUnit:200}];assert.throws(()=>operationScenario(op,t),/contingencia/);
});
