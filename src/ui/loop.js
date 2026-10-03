// ---------------- BUCLE PRINCIPAL ----------------
// Un cuadro por requestAnimationFrame: avanza la simulación (tiempo real × velocidad, en pasos de
// 0,25 s simulados), redibuja el mapa y, cada 10 cuadros, refresca los paneles.
import { fmtT } from '../util/format.js';
import { S } from '../sim/state.js';
import { step } from '../sim/engine.js';
import { draw } from '../render/draw.js';
import { $ } from './dom.js';
import { renderStats, renderLogIfDirty } from './panels/results.js';
import { renderSel } from './panels/selection.js';
import { renderScenario } from './panels/scenario.js';
import { autoPhase, AUTO_PHASES } from '../sim/pace.js';
import { currentSpeed, renderTimeScale } from './controls.js';

/** Paso máximo de simulación (s). Más chico = más preciso y más lento. */
const STEP = 0.25;
let last = performance.now(), uiTick = 0, holdUntil = 0;

/** Modo Auto: baja la velocidad apenas hay acción y la sube recién tras 2,5 s reales de calma. */
function updateAutoPhase(now) {
  const want = autoPhase(S);
  if (want === S.autoPhase) { holdUntil = now + 2500; return; }
  if (AUTO_PHASES[want].speed < AUTO_PHASES[S.autoPhase].speed || now >= holdUntil) { S.autoPhase = want; holdUntil = now + 2500; renderTimeScale(); }
}

function loop(now) {
  const dtr = Math.min(0.1, (now - last) / 1000); last = now;
  if (S.running) {
    if (S.auto) updateAutoPhase(now);
    let adv = dtr * currentSpeed();
    while (adv > 0) { const d = Math.min(STEP, adv); step(d); adv -= d; if (!S.running) break; }
    $('#clock').textContent = fmtT(S.t);
  }
  draw();
  // refresco de paneles cada 10 cuadros, salvo el panel que tiene un botón apretado: si el botón se
  // reemplaza entre que se aprieta y se suelta, el clic se pierde (Ficha, Ver debrief, Briefing)
  if (++uiTick % 10 === 0) {
    const free = id => !(pressedBtn && document.querySelector(id)?.contains(pressedBtn));
    if (free('#stats')) renderStats();
    renderLogIfDirty();
    if (S.sel && S.started && free('#selCard')) renderSel(true);
    if (S.started && S.objs.length && free('#scenCard')) renderScenario();
  }
  requestAnimationFrame(loop);
}

// Botón apretado (entre pointerdown y el clic). Se suelta en la tarea siguiente al pointerup para que
// el clic, que llega justo después, todavía encuentre el botón. A diferencia de :hover, no queda
// "pegado" en pantallas táctiles después del toque.
let pressedBtn = null;
const release = () => setTimeout(() => { pressedBtn = null; }, 0);

export function startLoop() {
  document.addEventListener('pointerdown', e => { pressedBtn = e.target.closest?.('button') || null; }, true);
  document.addEventListener('pointerup', release, true);
  document.addEventListener('pointercancel', release, true);
  requestAnimationFrame(loop);
}
