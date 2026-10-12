import { moduleOf, save, provenance } from './context.mjs';
const { S }=await moduleOf('src/sim/state.js');
const { startSim,step }=await moduleOf('src/sim/engine.js');
const { addDef,addSalvo }=await moduleOf('src/sim/setup.js');
const { setRandom,seeded }=await moduleOf('src/util/rng.js');
const { useMap,clearSetup }=await moduleOf('tests/helpers.js');
const median=a=>[...a].sort((x,y)=>x-y)[Math.floor(a.length/2)];
function sample(count){
  useMap('monterey',{flat:true});clearSetup();setRandom(seeded(7));
  addDef('nasams',40,40);addDef('ewr',40,30);
  addSalvo({type:'shahed',count,interval:0,agl:50,pts:[[40,10],[40,40]]});
  const begin=performance.now();startSim();const initializationMs=performance.now()-begin,times=[];
  try{for(let n=0;n<40;n++){const t=performance.now();step(0.25);times.push(performance.now()-t);}}finally{setRandom(null);}
  const sorted=[...times].sort((a,b)=>a-b);
  return {initializationMs,steps:40,simulationSeconds:S.t,medianStepMs:median(times),p95StepMs:sorted[Math.floor(sorted.length*.95)],maxStepMs:Math.max(...times),heapUsedBytes:process.memoryUsage().heapUsed};
}
const rows=[];
for(const count of [100,1000,3000]){
  sample(count);const samples=Array.from({length:5},()=>sample(count));
  rows.push({count,samples,medianOfStepMediansMs:median(samples.map(s=>s.medianStepMs)),medianOfP95Ms:median(samples.map(s=>s.p95StepMs)),largestStepMs:Math.max(...samples.map(s=>s.maxStepMs))});
}
save('round2-performance.json',{provenance:provenance(),method:'Un calentamiento y cinco ejecuciones por tamaño; mismos dos sensores, mapa plano, semilla 7 y 40 pasos de 0,25 s. Tamaño mayor acotado a 3000. Heap incluye GC/JIT; no memoria retenida ni umbral seguro.',measurements:rows});
console.log(JSON.stringify(rows.map(({samples,...r})=>r),null,2));
