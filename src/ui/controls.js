'use strict';
// ---------------- LOOP ----------------
let last = performance.now(), logDirty = true, uiTick = 0;
function loop(now) {
  const dtr = Math.min(0.1, (now - last) / 1000); last = now;
  if (S.running) {
    let adv = dtr * S.speed; const h = 0.25;
    while (adv > 0) { const d = Math.min(h, adv); step(d); adv -= d; if (!S.running) break; }
    $('#clock').textContent = fmtT(S.t);
  }
  draw();
  if (++uiTick % 10 === 0) { renderStats(); if (logDirty) renderLog(); if (S.sel && S.started) renderSel(true); }
  requestAnimationFrame(loop);
}

// ---------------- CONTROLES SIM ----------------
const SPEEDS = [1, 5, 15, 30, 60];
$('#speeds').innerHTML = SPEEDS.map(s => `<button data-s="${s}">${s}×</button>`).join('');
$('#speeds').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.speed = +b.dataset.s; updatePlay(); };
function togglePlay() {
  if (!S.started) { if (!S.setup.salvos.length) { toast('Agregá al menos un ataque en la pestaña Ataque.'); return; } setMode('select'); startSim(); S.running = true; schedCov(); }
  else if (!S.pending.length && S.threats.every(t => !t.alive)) { resetSim(); return; }
  else S.running = !S.running;
  updatePlay();
}
function updatePlay() {
  $('#play').textContent = S.running ? '❚❚ Pausa' : (S.started ? (S.pending.length || S.threats.some(t => t.alive) ? '▶ Seguir' : '↺ Nueva corrida') : '▶ Iniciar');
  for (const b of $('#speeds').children) b.classList.toggle('act', +b.dataset.s === S.speed);
  $('#clock').textContent = fmtT(S.t);
}
$('#play').onclick = togglePlay;
$('#reset').onclick = () => { resetSim(); renderAll(); };
$('#defView').onchange = draw;
