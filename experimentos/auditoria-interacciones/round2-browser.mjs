import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { moduleOf, root, save, output, provenance } from './context.mjs';
const fixture = execFileSync(process.execPath, [fileURLToPath(new URL('./round2-campaign.mjs', import.meta.url)), '--fixture']);
const { startSourceServer } = await moduleOf('tests/browser/serve.mjs');
const { THREATS, UNIT_TARGET } = await moduleOf('src/data/index.js');
const { damageAt } = await moduleOf('src/physics/damage.js');
let lo=0,hi=2000;
for(let n=0;n<60;n++){const mid=(lo+hi)/2;if(damageAt(THREATS.kh101,UNIT_TARGET,mid).dmg>UNIT_TARGET.hp*0.65)lo=mid;else hi=mid;}
const damageDistance=(lo+hi)/2;
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE || join(root,'tests/browser/node_modules/playwright/index.mjs')).href);
const server = await startSourceServer(root), browser = await chromium.launch({ headless:true,executablePath:process.env.CHROMIUM_PATH||undefined });
mkdirSync(output,{recursive:true}); const cases = [];
try {
  for (const mode of ['source','standalone-http']) {
    const page = await browser.newPage({viewport:{width:1440,height:900}}); const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
    await page.goto(server.url+(mode==='source'?'/':'/__bundle__.html'));
    await page.waitForFunction(()=>window.__dbg&&window.__S.setup.defs.length);
    await page.click('#campBtn');
    await page.locator('#cLoad').setInputFiles({name:'AUDIT-FIXTURE.json',mimeType:'application/json',buffer:fixture});
    await page.waitForSelector('#cStart');
    const result = await page.evaluate(async () => {
      const S=window.__S,dbg=window.__dbg;
      // Acción real del botón, pausada atómicamente antes del primer RAF para
      // instalar el estímulo explícito de jamming, no la cronología de Odesa.
      document.getElementById('cStart').click(); S.running=false; S.auto=false; S.speed=1;
      S.pending=[]; dbg.addJam('soj',40,30,{alt:8000});
      const j=S.setup.jams[S.setup.jams.length-1]; S.jamsLive=[{...j,hp:300,_losMap:{}}];
      S.running=true; const more=dbg.campaignStep();
      const initial={more,running:S.running,t:S.t,pendingHoj:S.hoj.filter(h=>!h.done).length,arrival:S.hoj[0]?.tH};
      await new Promise(resolve=>{let n=0;const f=()=>{if(++n>=12)resolve();else requestAnimationFrame(f);};requestAnimationFrame(f);});
      return {initial,afterFrames:{t:S.t,running:S.running,pendingHoj:S.hoj.filter(h=>!h.done).length}};
    });
    assert(result.initial.more&&result.initial.pendingHoj>0,'fixture nativo debe generar vuelo HOJ y guardia pendiente');
    const holds=result.afterFrames.running||result.afterFrames.t>result.initial.t;
    cases.push({id:'native-campaign-hoj-progress',mode,audit:'F05-campaña',status:holds?'HOLDS':'VIOLATED',observed:result});
    await page.screenshot({path:join(output,`${mode}-campaign-hoj-stalled.png`)});
    // Resolver por el API real del puente para liberar el singleton. Esta es
    // una comprobación, no la solución aplicada a producción.
    await page.evaluate(()=>{let n=0;while(window.__dbg.campaignStep())if(++n>40000)throw Error('No termina');});
    await page.close();

    const tipPage = await browser.newPage({viewport:{width:1440,height:900}}); const tipErrors=[];
    tipPage.on('pageerror',e=>tipErrors.push(e.message));
    await tipPage.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
    await tipPage.goto(server.url+(mode==='source'?'/':'/__bundle__.html'));
    await tipPage.waitForFunction(()=>window.__dbg&&window.__S.setup.defs.length);
    const point = await tipPage.evaluate(() => {
      const S=window.__S,dbg=window.__dbg;dbg.resetSim();dbg.flat();
      S.setup={defs:[],objs:[{id:900001,type:'fuel',name:'OBJETIVO-HISTÓRICO',short:'',desc:'',x:50,y:50,maxHp:800}],jams:[],salvos:[]};
      dbg.startSim();S.running=false;S.t=20;S.objs[0].hp=0;S.objs[0].status='destroyed';
      S.rec.objs.push({t:10,id:900001,hp:0,status:'destroyed',hits:1});S.replay={t:5};
      document.getElementById('view').value='all';
      const cv=document.querySelector('canvas'),ctx=cv.getContext('2d'),original=ctx.rect;let point=null;
      ctx.rect=function(x,y,w,h){if(w===16&&h===16)point=[x+8,y+8];return original.call(this,x,y,w,h);};
      dbg.draw();ctx.rect=original;
      if(!point)throw Error('No se dibujó objetivo del fixture');
      const box=cv.getBoundingClientRect();return {x:box.x+point[0],y:box.y+point[1]};
    });
    await tipPage.mouse.move(point.x,point.y);
    await tipPage.waitForFunction(()=>!document.getElementById('tip').hidden);
    const tip=await tipPage.locator('#tip').textContent();
    const tipHolds=/HP 800 \/ 800/.test(tip);
    cases.push({id:'historical-objective-tooltip',mode,audit:'F07-extensión',status:tipHolds?'HOLDS':'VIOLATED',expected:'A T=5 el objetivo tenía 800 HP; fue destruido a T=10.',observed:{tip,historyTime:5,finalTime:20}});
    await tipPage.screenshot({path:join(output,`${mode}-historical-tooltip.png`)});
    cases.push({id:'round2-browser-errors',mode,status:errors.length+tipErrors.length?'ERROR':'HOLDS',observed:{errors:[...errors,...tipErrors]}});
    await tipPage.close();
    const covPage=await browser.newPage({viewport:{width:1440,height:900}});const covErrors=[];
    covPage.on('pageerror',e=>covErrors.push(e.message));
    await covPage.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
    await covPage.goto(server.url+(mode==='source'?'/':'/__bundle__.html'));
    await covPage.waitForFunction(()=>window.__dbg&&window.__S.setup.defs.length);
    const covariance=await covPage.evaluate(async dist=>{
      const S=window.__S,dbg=window.__dbg;dbg.resetSim();dbg.flat();S.setup={defs:[],objs:[],jams:[],salvos:[]};
      dbg.addDef('nasams',40,40,{dmgLauncher:true,mag:0,reserve:0});
      dbg.addSalvo({type:'kh101',count:1,agl:50,maneuver:0,pts:[[40+dist/1000,39],[40+dist/1000,40]]});
      dbg.startSim();S.running=false;S.covRef='shahed';S.covAgl=50;
      // Dispersión controlada sólo en copia de amenaza del fixture: no en catálogo.
      S.pending[0].T={...S.pending[0].T,cep:0.001};
      await new Promise(r=>setTimeout(r,250));dbg.computeCov();
      const count=()=>S._cov.reduce((n,v)=>n+(v>0),0),before=count();
      for(let n=0;n<100;n++){dbg.step(0.25);if(!S.pending.length&&S.threats.every(t=>!t.alive))break;}
      const u=S.units[0];if(!u.alive||!u.dmgRadar)throw Error('El estímulo debe dañar radar sin destruir unidad');
      await new Promise(r=>setTimeout(r,250));const afterAutomatic=count();dbg.computeCov();const afterManual=count();
      return {before,afterAutomatic,afterManual,hp:u.hp,alive:u.alive,damagedRadar:u.dmgRadar};
    },damageDistance);
    assert(covariance.afterManual<covariance.before,'control debe reducir cobertura geométrica');
    cases.push({id:'partial-radar-damage-coverage-invalidation',mode,audit:'F10-extensión',status:covariance.afterAutomatic===covariance.afterManual?'HOLDS':'VIOLATED',observed:covariance});
    const historicalCoverage=await covPage.evaluate(()=>{
      const S=window.__S;S.replay={t:0.25};window.__dbg.computeCov();
      return {historyTime:S.replay.t,finalTime:S.t,cells:S._cov.reduce((n,v)=>n+(v>0),0)};
    });
    cases.push({id:'historical-coverage-time',mode,audit:'F07/F10-histórico',status:historicalCoverage.cells===covariance.before?'HOLDS':'VIOLATED',
      expected:'El radar estaba sano antes del impacto; cobertura histórica debe coincidir con control previo.',
      observed:{...historicalCoverage,expectedHealthyCells:covariance.before}});
    const jammerCov=await covPage.evaluate(async ()=>{
      const S=window.__S,dbg=window.__dbg;dbg.resetSim();dbg.flat();S.setup={defs:[],objs:[],jams:[],salvos:[]};
      dbg.addDef('nasams',40,40,{mag:0,reserve:0});dbg.addJam('krasukha4',40,35);
      dbg.addSalvo({type:'kh101',count:1,agl:50,maneuver:0,pts:[[40,34],[40,35]]});
      dbg.startSim();S.running=false;S.covRef='shahed';S.covAgl=50;S.pending[0].T={...S.pending[0].T,cep:0.001};
      await new Promise(r=>setTimeout(r,250));dbg.computeCov();
      const count=()=>S._cov.reduce((n,v)=>n+(v>0),0),before=count();
      for(let n=0;n<100;n++){dbg.step(0.25);if(!S.pending.length&&S.threats.every(t=>!t.alive))break;}
      if(!S.jamsLive[0].dead||!S.units[0].alive)throw Error('Debe destruir jammer y conservar radar');
      await new Promise(r=>setTimeout(r,250));const afterAutomatic=count();dbg.computeCov();const afterManual=count();
      return {before,afterAutomatic,afterManual,jammerDead:S.jamsLive[0].dead,unitHp:S.units[0].hp};
    });
    assert(jammerCov.afterManual>jammerCov.before,'el control debe eliminar interferencia de cobertura: '+JSON.stringify(jammerCov));
    cases.push({id:'jammer-loss-coverage-invalidation',mode,audit:'F10-extensión',status:jammerCov.afterAutomatic===jammerCov.afterManual?'HOLDS':'VIOLATED',observed:jammerCov});
    cases.push({id:'coverage-browser-errors',mode,status:covErrors.length?'ERROR':'HOLDS',observed:{errors:covErrors}});
    await covPage.close();
  }
} catch(e) {cases.push({id:'round2-execution',status:'ERROR',error:e.stack});console.error(e);}
finally {await browser.close();await server.close();}
const summary=Object.fromEntries(['HOLDS','VIOLATED','ERROR'].map(s=>[s,cases.filter(c=>c.status===s).length]));
save('round2-browser.json',{provenance:provenance(),transport:'fuente y bundle HTTP local, no file://',summary,cases});
for(const c of cases)console.log(`${c.status} ${c.mode||''} ${c.id}`);
console.log(JSON.stringify(summary));process.exitCode=summary.ERROR?1:summary.VIOLATED?2:0;
