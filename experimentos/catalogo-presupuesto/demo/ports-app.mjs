import { PORT_CHOICES, PORT_BUDGET, portCampaignDefinition } from '../data/port-campaign.mjs';
import { createOperations, operationView, applyOperationResourceCommand, continueOperations, saveOperations, loadOperations } from '../lib/operations.mjs';
import { startPortCombat } from '../lib/port-combat.mjs';
import { builtinMap } from '../../../src/physics/terrain.js';

const $ = id => document.getElementById(id);
let operation = null, combat = null, paused = false, serial = 0, previousFrame = 0, accumulator = 0;
const nextId = prefix => `${prefix}-${Date.now()}-${++serial}`;
const map = builtinMap('odesa'), wKm = map.W * map.cell / 1000, hKm = map.H * map.cell / 1000;
const terrain = document.createElement('canvas'); terrain.width = map.W; terrain.height = map.H;
const tc = terrain.getContext('2d'), image = tc.createImageData(map.W, map.H);
for (let i = 0; i < map.data.length; i++) {
  const z = map.data[i], water = z < 0 || map.water?.[i];
  image.data.set(water ? [22, 49, 64, 255] : [45 + Math.min(80, Math.max(0,z)/3), 62, 55, 255], i * 4);
}
tc.putImageData(image, 0, 0);
const ctx = $('map').getContext('2d');
const secondsText = n => `${Math.floor(n / 3600)} h ${Math.floor(n % 3600 / 60)} min ${Math.floor(n % 60)} s`;
function action(fn) { try { fn(); $('status').textContent = ''; render(); } catch (error) { $('status').textContent = error.message; } }
function number(input) {
  const raw = input.value.trim(), n = Number(raw);
  if (!raw || !Number.isSafeInteger(n) || n <= 0) throw Error('La cantidad debe ser un entero positivo; no se redondea.');
  return n;
}
function button(label, fn, disabled = false) { const b = document.createElement('button'); b.textContent = label; b.disabled = disabled; b.onclick = () => action(fn); return b; }
function line(parent, text) { const li = document.createElement('li'); li.textContent = text; parent.append(li); }
function stock(locationId, ammunitionId) { return operation.resources.inventory.stock.find(s => s.locationId === locationId && s.ammunitionId === ammunitionId)?.quantity ?? 0; }
function command(kind, extra, atSeconds = operation.resources.clockSeconds) {
  operation = applyOperationResourceCommand(operation, { commandId: nextId(kind), sideId: 'ua', atSeconds, kind, ...extra });
}
for (const choice of PORT_CHOICES) {
  const label = document.createElement('label'); label.className = 'card';
  const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.value = choice.id; checkbox.id = `choice-${choice.id}`;
  checkbox.checked = ['radar','vhf','s125','buk','mobile'].includes(choice.id); checkbox.onchange = allocation;
  label.append(checkbox, document.createTextNode(` ${choice.name}: ${choice.cost} créditos${choice.later ? ' · disponible desde segunda guardia' : ''}`)); $('choices').append(label);
}
function selection() { return [...$('choices').querySelectorAll('input:checked')].map(i => i.value); }
function allocation() {
  const spent = PORT_CHOICES.filter(c => selection().includes(c.id)).reduce((n,c) => n+c.cost, 0);
  $('allocation-total').textContent = `Asignados: ${spent}. Quedan ${PORT_BUDGET-spent} créditos para munición y servicios.`;
  $('create').disabled = !selection().length || spent > PORT_BUDGET;
}
function draw(view) {
  const canvas = $('map'), sx = canvas.width / wKm, sy = canvas.height / hKm;
  ctx.drawImage(terrain, 0, 0, canvas.width, canvas.height);
  ctx.font = '12px system-ui';
  for (const g of view.objectives ?? []) { ctx.fillStyle = g.hp > 0 ? '#72db99' : '#888'; ctx.fillRect(g.x*sx-4,g.y*sy-4,8,8); ctx.fillText(g.name,g.x*sx+6,g.y*sy); }
  for (const u of view.units ?? []) { ctx.fillStyle = u.hp > 0 ? '#75cafa' : '#888'; ctx.beginPath();ctx.arc(u.x*sx,u.y*sy,4,0,Math.PI*2);ctx.fill();ctx.fillText(u.name,u.x*sx+6,u.y*sy); }
  for (const c of view.contacts ?? []) { ctx.fillStyle = c.lost ? '#aab0b6' : '#ffd86d';ctx.beginPath();ctx.arc(c.x*sx,c.y*sy,3,0,Math.PI*2);ctx.fill(); }
}
function renderPlanning(v) {
  $('supplies').replaceChildren(); $('repairs').replaceChildren(); $('jobs').replaceChildren();
  for (const q of v.resources.quotes) {
    const assetId = q.id.replace(/-supply$/, ''), asset = v.assets.find(a => a.id === assetId);
    if (!asset) continue;
    const row = document.createElement('div'); row.className = 'row';
    const label = document.createElement('label'); label.textContent = `${asset.engineName} · ${q.price} créditos/disparo · disponibles ${q.remaining}. Depósito ${stock('depot',q.ammunitionId)}, listos ${stock(`${assetId}-ready`,q.ammunitionId)} `;
    const input = document.createElement('input'); input.type = 'number'; input.min = '1'; input.step = '1'; input.value = '4'; input.id = `quantity-${assetId}`; label.append(input);
    row.append(label, button('Pedir', () => command('order', { jobId: nextId('delivery'),quoteId:q.id,quantity:number(input) }), q.remaining===0 || asset.hp===0),
      button('Cargar', () => command('transfer', { jobId:nextId('load'),serviceId:`${assetId}-reload`,ammunitionId:q.ammunitionId,quantity:number(input) }), asset.hp===0));
    row.querySelectorAll('button')[0].id = `order-${assetId}`; row.querySelectorAll('button')[1].id = `load-${assetId}`; $('supplies').append(row);
  }
  for (const asset of v.assets.filter(a => a.kind==='unit')) for (const id of asset.componentIds) {
    const c = operation.resources.inventory.components.find(c => c.id===id), row = document.createElement('p');
    row.textContent = `${asset.engineName} · ${c.kind}: ${c.condition} `;
    if (['degraded','disabled'].includes(c.condition)) row.append(button('Reparar (50 créditos + 1 repuesto)', () => command('repair',{jobId:nextId('repair'),serviceId:`${asset.id}-repair`,componentId:id})));
    $('repairs').append(row);
  }
  for (const job of v.resources.jobs.filter(j => ['pending','interrupted'].includes(j.status))) {
    const li = document.createElement('li'); li.textContent = `${job.kind}: ${job.status} · termina ${secondsText(job.dueAtSeconds)} `;
    li.append(button('Cancelar / devolver',()=>command('cancel',{jobId:job.id})));$('jobs').append(li);
  }
  $('wait').disabled = !v.resources.jobs.some(j=>j.status==='pending'&&j.dueAtSeconds<=v.preparationEndsAtSeconds);
}
function render() {
  $('allocation').hidden = !!operation; $('campaign').hidden = !operation; if (!operation) return;
  const v = operationView(operation), live = combat?.view();
  $('title').textContent = v.title; $('phase').textContent = ({planning:'Preparación',active:'Guardia en curso',debrief:'Debrief',finished:'Campaña terminada'})[v.phase];
  $('balance').textContent = v.resources.balance; $('clock').textContent = secondsText(v.atSeconds); $('goals').replaceChildren();for(const g of v.briefing.objectives)line($('goals'),g.text);
  $('preparation').hidden=v.phase!=='planning';if(v.phase==='planning')renderPlanning(v);
  $('start').disabled=v.phase!=='planning';$('pause').disabled=v.phase!=='active';$('pause').textContent=paused?'Reanudar':'Pausar';
  for(const id of ['save','download','restore'])$(id).disabled=v.phase==='active';
  $('debrief').hidden=!v.debrief;if(v.debrief){$('result').textContent=`Resultado: ${v.debrief.result}`;$('summary').textContent=v.debrief.summary;$('damage').replaceChildren();for(const a of v.assets)line($('damage'),`${a.engineName}: ${a.hp}/${a.maxHp} HP`);}
  $('next').disabled=v.phase!=='debrief';
  const view=live??{units:v.assets.filter(a=>a.kind==='unit').map(a=>({id:a.id,name:a.engineName,x:a.x,y:a.y,hp:a.hp,ready:stock(`${a.id}-ready`,`legacy-${a.id}`)})),objectives:v.assets.filter(a=>a.kind==='objective').map(a=>({name:a.engineName,x:a.x,y:a.y,hp:a.hp})),contacts:[]};
  $('battle-clock').textContent=live?`T+ ${secondsText(live.seconds)} · ${live.shots} disparos propios`:'';
  $('units').replaceChildren();for(const u of view.units){const tr=document.createElement('tr');for(const value of [u.name,u.hp,u.ready??'—']){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('units').append(tr);}draw(view);
}
$('create').onclick=()=>action(()=>{operation=createOperations(portCampaignDefinition(selection()));});
$('wait').onclick=()=>action(()=>{const v=operationView(operation),due=Math.min(...v.resources.jobs.filter(j=>j.status==='pending').map(j=>j.dueAtSeconds));if(!Number.isFinite(due))throw Error('No hay trabajos pendientes');command('advance',{},due);});
$('start').onclick=()=>action(()=>{combat=startPortCombat(operation,operation.history.length+1);operation=combat.getOperation();paused=false;accumulator=0;});
$('pause').onclick=()=>action(()=>{paused=!paused;});
$('next').onclick=()=>action(()=>{operation=continueOperations(operation,nextId('continue'));combat=null;});
function save() { if(operation.phase==='active')throw Error('La guardia debe terminar antes de guardar');$('saved').value=saveOperations(operation); }
$('save').onclick=()=>action(save);
$('download').onclick=()=>action(()=>{save();const url=URL.createObjectURL(new Blob([$('saved').value],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='cielo-campana-odesa.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
$('restore').onclick=()=>action(()=>{if(operation?.phase==='active')throw Error('Terminar la guardia antes de restaurar');const restored=loadOperations($('saved').value,'ua');if(restored.phase==='active')throw Error('Esta pantalla no restaura vuelos en curso');if(restored.definition.id!=='odessa-resource-campaign')throw Error('Esta pantalla admite la campaña de Odesa');operation=restored;combat=null;paused=false;});
function frame(now) {
  if(combat&&!paused&&operation.phase==='active') {
    accumulator+=Math.min((now-previousFrame)/1000,.1)*Number($('speed').value);
    const deadline=performance.now()+10;
    try { while(accumulator>=.25&&performance.now()<deadline){accumulator-=.25;if(!combat.step()){accumulator=0;break;}}operation=combat.getOperation();render(); }
    catch(error){paused=true;$('status').textContent=error.message;}
  }
  previousFrame=now;requestAnimationFrame(frame);
}
window.__portsDemo=Object.freeze({view:()=>operation?operationView(operation):null,combatView:()=>combat?.view()??null});
allocation();requestAnimationFrame(frame);
