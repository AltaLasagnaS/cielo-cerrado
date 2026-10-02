// ===================== CIELO CERRADO =====================
// Punto de entrada. Conecta las capas en este orden:
//   data (catálogo) → physics (modelos) → sim (estado y bucle) → render (canvas) → ui (paneles)
// Ver docs/ARQUITECTURA.md.
import { DEFENSES, SCENARIOS, SRC, UNC, OBS, CAL, PL, applyProbable, applySample, sampleU } from './data/index.js';
import { esc } from './util/format.js';
import { MAP } from './physics/terrain.js';
import { S } from './sim/state.js';
import { hooks } from './sim/hooks.js';
import { startSim, step } from './sim/engine.js';
import { addDef, addSalvo, addJam } from './sim/setup.js';
import { initView, resize, fitView } from './render/view.js';
import { draw } from './render/draw.js';
import { $, isDefenderView } from './ui/dom.js';
import { loadScenario, resetSim } from './ui/app.js';
import { schedCov, computeCov } from './ui/coverage.js';
import { initControls, updatePlay } from './ui/controls.js';
import { initInput } from './ui/input.js';
import { initModal } from './ui/fichas.js';
import { initHelp } from './ui/help.js';
import { initHgtImport } from './ui/hgt.js';
import { initTabs, renderAll } from './ui/panels/index.js';
import { markLogDirty } from './ui/panels/results.js';
import { startLoop } from './ui/loop.js';

// Acceso desde la consola del navegador (depuración y herramientas externas).
window.DEFENSES_REF = DEFENSES; window.CC_DATA = { SRC, UNC, OBS, CAL, PL, applyProbable, applySample, sampleU };

// La simulación avisa a la interfaz a través de estos enganches.
hooks.onLog = markLogDirty;
hooks.onEnd = updatePlay;
hooks.onUnitLost = schedCov;
hooks.defenderView = isDefenderView;

initView($('#map'));
initInput();
initControls();
initTabs();
initModal();
initHelp();
initHgtImport();

const sc = $('#scenario');
sc.innerHTML = Object.entries(SCENARIOS).map(([k, s]) => `<option value="${k}">${esc(s.name)}</option>`).join('');
sc.onchange = e => { if (e.target.value !== 'hgt') loadScenario(e.target.value); };
let fitted = false;
new ResizeObserver(() => { resize(); if (!fitted) { fitView(); fitted = true; } }).observe($('#mapwrap'));
loadScenario('mb_noche');
resize(); fitView();
startLoop();

window.__S = S; window.__dbg = { flat: () => { MAP.data = new Int16Array(MAP.data.length); MAP.key = 'flat'; MAP.max = 0; MAP.min = 0; }, computeCov, draw, addDef, addSalvo, addJam, startSim, step, resetSim, loadScenario, renderAll };
