// @ts-check
// ---------------- CONTROLES DE SIMULACIÓN ----------------
// Barra sobre el mapa: iniciar/pausar, reiniciar, velocidad y vista del defensor.
import { fmtT } from '../util/format.js';
import { S } from '../sim/state.js';
import { startSim } from '../sim/engine.js';
import { isMonteCarloRunning } from '../sim/montecarlo.js';
import { draw } from '../render/draw.js';
import { $ } from './dom.js';
import { resetSim } from './app.js';
import { schedCov } from './coverage.js';
import { setMode, toast } from './modes.js';
import { renderAll } from './panels/index.js';
import { campaignBattle, campaignBlocks } from './campaign.js';
import { renderStats, renderLog } from './panels/results.js';
import { renderScenario } from './panels/scenario.js';
import { AUTO_PHASES } from '../sim/pace.js';

/** Multiplicadores de tiempo (1× = tiempo real; un Shahed tarda ~20 min en cruzar 60 km). */
const SPEEDS = [1, 5, 15, 30, 60];

export function initControls() {
  $('#speeds').innerHTML = `<button data-s="auto" title="Rápido cuando no pasa nada, lento cuando hay combate">Auto</button>` + SPEEDS.map(s => `<button data-s="${s}">${s}×</button>`).join('');
  $('#speeds').onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.s === 'auto') S.auto = true; else { S.auto = false; S.speed = +b.dataset.s; } updatePlay(); };
  $('#play').onclick = togglePlay;
  $('#reset').onclick = () => { if (campaignBlocks('reiniciar')) return; resetSim(); renderAll(); };
  $('#view').onchange = e => {
    // en la guardia se juega como el defensor: sin vista de la verdad ni del atacante
    if (campaignBattle() && e.target.value !== 'def') { e.target.value = 'def'; campaignBlocks('cambiar de vista'); }
    renderAll(); renderStats(); renderLog(); renderScenario(); draw(); };
}

/** Iniciar → pausar → seguir; al terminar, "nueva corrida" vuelve al modo edición. */
export function togglePlay() {
  if (isMonteCarloRunning()) return;
  // en una guardia, el botón solo pausa y sigue: la corrida la arma y la cierra la campaña
  if (campaignBattle()) { S.running = !S.running; updatePlay(); return; }
  if (!S.started) { if (!S.setup.salvos.length) { toast('Agregá al menos un ataque en la pestaña Ataque.'); return; } setMode('select'); startSim(); S.running = true; schedCov(); }
  else if (!S.pending.length && S.threats.every(t => !t.alive)) { resetSim(); return; }
  else S.running = !S.running;
  updatePlay();
}

/** Refresca el botón principal, la velocidad marcada y el reloj. */
export function updatePlay() {
  $('#play').textContent = S.running ? '❚❚ Pausa' : (S.started ? (campaignBattle() || S.pending.length || S.threats.some(t => t.alive) ? '▶ Seguir' : '↺ Nueva corrida') : '▶ Iniciar');
  for (const b of $('#speeds').children) b.classList.toggle('act', S.auto ? b.dataset.s === 'auto' : +b.dataset.s === S.speed);
  $('#clock').textContent = fmtT(S.t);
  renderTimeScale();
}

/** Velocidad efectiva actual (× tiempo real). */
export const currentSpeed = () => S.auto ? AUTO_PHASES[S.autoPhase].speed : S.speed;

const span = s => s < 60 ? s + ' s' : (s / 60) + ' min';
/** Texto que explica la escala de tiempo: "15× · 1 s real = 15 s simulados". */
export function renderTimeScale() {
  const sp = currentSpeed();
  $('#tscale').textContent = (S.auto ? 'Auto ' + sp + '× (' + AUTO_PHASES[S.autoPhase].text + ')' : sp + '×') + ' · 1 s real = ' + span(sp) + (sp === 1 ? ' (tiempo real)' : ' simulados');
}
