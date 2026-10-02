// ---------------- CONTROLES DE SIMULACIÓN ----------------
// Barra sobre el mapa: iniciar/pausar, reiniciar, velocidad y vista del defensor.
import { fmtT } from '../util/format.js';
import { S } from '../sim/state.js';
import { startSim } from '../sim/engine.js';
import { draw } from '../render/draw.js';
import { $ } from './dom.js';
import { resetSim } from './app.js';
import { schedCov } from './coverage.js';
import { setMode, toast } from './modes.js';
import { renderAll } from './panels/index.js';

/** Multiplicadores de tiempo disponibles. */
const SPEEDS = [1, 5, 15, 30, 60];

export function initControls() {
  $('#speeds').innerHTML = SPEEDS.map(s => `<button data-s="${s}">${s}×</button>`).join('');
  $('#speeds').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.speed = +b.dataset.s; updatePlay(); };
  $('#play').onclick = togglePlay;
  $('#reset').onclick = () => { resetSim(); renderAll(); };
  $('#defView').onchange = draw;
}

/** Iniciar → pausar → seguir; al terminar, "nueva corrida" vuelve al modo edición. */
export function togglePlay() {
  if (!S.started) { if (!S.setup.salvos.length) { toast('Agregá al menos un ataque en la pestaña Ataque.'); return; } setMode('select'); startSim(); S.running = true; schedCov(); }
  else if (!S.pending.length && S.threats.every(t => !t.alive)) { resetSim(); return; }
  else S.running = !S.running;
  updatePlay();
}

/** Refresca el botón principal, la velocidad marcada y el reloj. */
export function updatePlay() {
  $('#play').textContent = S.running ? '❚❚ Pausa' : (S.started ? (S.pending.length || S.threats.some(t => t.alive) ? '▶ Seguir' : '↺ Nueva corrida') : '▶ Iniciar');
  for (const b of $('#speeds').children) b.classList.toggle('act', +b.dataset.s === S.speed);
  $('#clock').textContent = fmtT(S.t);
}
