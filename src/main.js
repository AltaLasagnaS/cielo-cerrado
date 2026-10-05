// @ts-check
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
import { buildBase } from './render/terrain.js';
import { $, isDefenderView } from './ui/dom.js';
import { loadScenario, resetSim } from './ui/app.js';
import { schedCov, computeCov } from './ui/coverage.js';
import { initControls, updatePlay } from './ui/controls.js';
import { initInput } from './ui/input.js';
import { initModal } from './ui/fichas.js';
import { initHelp } from './ui/help.js';
import { initHgtImport } from './ui/hgt.js';
import { initScenarioFile, loadFromObject, saveScenario } from './ui/scenario-file.js';
import { initRelief } from './ui/relief.js';
import { initAcademy } from './ui/academy.js';
import { initTabs, renderAll } from './ui/panels/index.js';
import { markLogDirty, renderStats } from './ui/panels/results.js';
import { openDebrief } from './ui/debrief.js';
import { openMonteCarlo } from './ui/montecarlo.js';
import { openBriefing } from './ui/panels/scenario.js';
import { startLoop } from './ui/loop.js';

// Acceso desde la consola del navegador (depuración y herramientas externas).
const W = /** @type {any} */ (window);
W.DEFENSES_REF = DEFENSES; W.CC_DATA = { SRC, UNC, OBS, CAL, PL, applyProbable, applySample, sampleU };

// La simulación avisa a la interfaz a través de estos enganches.
hooks.onLog = markLogDirty;
hooks.onEnd = () => { updatePlay(); renderStats(); openDebrief(); };
hooks.onUnitLost = schedCov;
hooks.defenderView = isDefenderView;

initView($('#map'));
initInput();
initControls();
initTabs();
initModal();
initHelp();
initHgtImport();
initScenarioFile();
initRelief();
initAcademy();
$('#mcBtn').onclick = openMonteCarlo;

const sc = $('#scenario');
sc.innerHTML = Object.entries(SCENARIOS).map(([k, s]) => `<option value="${k}">${esc(s.name)}</option>`).join('');
sc.onchange = e => { if (SCENARIOS[e.target.value]) { loadScenario(e.target.value); openBriefing(); } };
let fitted = false;
new ResizeObserver(() => { resize(); if (!fitted) { fitView(); fitted = true; } }).observe($('#mapwrap'));
// si cambia la densidad de píxeles (zoom del navegador, otro monitor) se rehace el canvas
const watchDpr = () => matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change', () => { resize(); watchDpr(); }, { once: true });
watchDpr();
loadScenario('mb_noche');
resize(); fitView();
startLoop();

W.__S = S; W.__dbg = { flat: () => { MAP.data = new Int16Array(MAP.data.length); MAP.key = 'flat'; MAP.max = 0; MAP.min = 0; buildBase(); }, computeCov, draw, addDef, addSalvo, addJam, startSim, step, resetSim, loadScenario, renderAll, openDebrief, openMonteCarlo, loadFromObject, saveScenario };
