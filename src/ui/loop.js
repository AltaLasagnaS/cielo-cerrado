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
  if (++uiTick % 10 === 0) { renderStats(); renderLogIfDirty(); if (S.sel && S.started) renderSel(true); if (S.started && S.objs.length) renderScenario(); }
  requestAnimationFrame(loop);
}

export function startLoop() { requestAnimationFrame(loop); }
