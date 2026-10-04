// Barra de repetición sobre el mapa (se abre desde el debrief). Mueve S.replay.t; el mapa dibuja el
// cuadro reconstruido de ese instante (sim/replay.js#frameAt, render/draw.js).
import { esc, fmtT } from '../util/format.js';
import { S } from '../sim/state.js';
import { frameAt, canReplay, replayEnd } from '../sim/replay.js';
import { $ } from './dom.js';
import { closeModal } from './fichas.js';
import { toast } from './modes.js';

/** Velocidades de la repetición (× tiempo real). */
const SPEEDS = [5, 30, 120];

/** Abre la repetición desde el principio (o desde t), reproduciendo. */
export function openReplay(t = 0) {
  if (!canReplay()) { toast('Primero corré el escenario hasta el final.'); return; }
  closeModal();
  S.running = false;
  S.replay = { t, playing: true, speed: 30 };
  renderReplayBar();
}

/** Cierra la repetición y vuelve al estado final de la corrida. */
export function closeReplay() { S.replay = null; renderReplayBar(); }

/** Dibuja (o esconde) la barra según S.replay. */
export function renderReplayBar() {
  const el = $('#replayBar'); if (!el) return;
  if (!S.replay) { el.hidden = true; el.innerHTML = ''; return; }
  const end = Math.ceil(replayEnd());
  el.hidden = false;
  el.innerHTML = `<button class="btn pri sm" id="rpPlay"></button>
    <input type="range" id="rpT" min="0" max="${end}" step="1" value="${Math.round(S.replay.t)}" aria-label="Instante de la repetición">
    <span class="clock" id="rpClock"></span>
    <div class="speeds">${SPEEDS.map(s => `<button data-s="${s}" class="${s === S.replay.speed ? 'act' : ''}">${s}×</button>`).join('')}</div>
    <button class="btn sm" id="rpExit">Salir</button>
    <ol class="rplog" id="rpLog" aria-live="polite"></ol>`;
  $('#rpPlay').onclick = () => { const R = S.replay; if (R.t >= end) R.t = 0; R.playing = !R.playing; updateReplayBar(); };
  $('#rpT').oninput = e => { S.replay.t = +e.target.value; S.replay.playing = false; updateReplayBar(); };
  el.querySelector('.speeds').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.replay.speed = +b.dataset.s; for (const c of b.parentNode.children) c.classList.toggle('act', c === b); };
  $('#rpExit').onclick = closeReplay;
  updateReplayBar();
}

/** Refresca reloj, deslizador, botón y las últimas líneas del registro de ese instante. */
export function updateReplayBar() {
  const R = S.replay; if (!R || !$('#rpPlay')) return;
  $('#rpPlay').textContent = R.playing ? '❚❚' : '▶';
  $('#rpT').value = Math.round(R.t);
  $('#rpClock').textContent = 'Repetición ' + fmtT(R.t);
  const log = frameAt(R.t).log.slice(-4).reverse();
  $('#rpLog').innerHTML = log.map(l => `<li class="${esc(l.cls)}"><time>${fmtT(l.t)}</time> ${esc(l.msg)}</li>`).join('');
}

/** Avanza la repetición dtr segundos reales (lo llama el bucle principal). */
export function tickReplay(dtr) {
  const R = S.replay; if (!R?.playing) return;
  const end = replayEnd();
  R.t = Math.min(end, R.t + dtr * R.speed);
  if (R.t >= end) R.playing = false;
  updateReplayBar();
}
