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

/** Paso máximo de simulación (s). Más chico = más preciso y más lento. */
const STEP = 0.25;
let last = performance.now(), uiTick = 0;

function loop(now) {
  const dtr = Math.min(0.1, (now - last) / 1000); last = now;
  if (S.running) {
    let adv = dtr * S.speed;
    while (adv > 0) { const d = Math.min(STEP, adv); step(d); adv -= d; if (!S.running) break; }
    $('#clock').textContent = fmtT(S.t);
  }
  draw();
  if (++uiTick % 10 === 0) { renderStats(); renderLogIfDirty(); if (S.sel && S.started) renderSel(true); }
  requestAnimationFrame(loop);
}

export function startLoop() { requestAnimationFrame(loop); }
