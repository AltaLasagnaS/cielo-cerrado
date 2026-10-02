'use strict';
// ---------------- INICIO ----------------
const sc = $('#scenario');
sc.innerHTML = Object.entries(SCEN).map(([k, s]) => `<option value="${k}">${esc(s.name)}</option>`).join('');
sc.onchange = e => { if (e.target.value !== 'hgt') loadScenario(e.target.value); };
let fitted = false;
new ResizeObserver(() => { resize(); if (!fitted) { fitView(); fitted = true; } }).observe($('#mapwrap'));
loadScenario('mb_noche');
resize(); fitView();
requestAnimationFrame(loop);
window.__S = S; window.__dbg = { flat: () => { MAP.data = new Int16Array(MAP.data.length); MAP.key = 'flat'; MAP.max = 0; MAP.min = 0; }, computeCov, draw, addDef, addSalvo, addJam, startSim, step, resetSim, loadScenario, renderAll };
