// @ts-check
// ---------------- MONTE CARLO (ventanas) ----------------
// Configuración, progreso y debrief de una serie Monte Carlo (la lógica está en sim/montecarlo.js).
// La serie corre en tramos de ~40 ms entre cuadros para que la página no se congele; cerrar la
// ventana o tocar "Cancelar" la corta y muestra lo que haya alcanzado a correr.
import { esc, money } from '../util/format.js';
import { S } from '../sim/state.js';
import { createMonteCarlo, aggregate } from '../sim/montecarlo.js';
import { $ } from './dom.js';
import { resetSim } from './app.js';
import { openModal, closeModal } from './fichas.js';
import { toast } from './modes.js';
import { renderAll } from './panels/index.js';
import { campaignBlocks } from './campaign.js';

const RUNS = [10, 20, 50, 100];
const SIDE = { ataque: 'Ataque', defensa: 'Defensa' };
let last = { runs: 20, sample: true, seed: 1 };

/** Ventana de configuración. */
export function openMonteCarlo() {
  if (campaignBlocks('Monte Carlo')) return;
  if (!S.setup.salvos.length) { toast('Agregá al menos un ataque en la pestaña Ataque.'); return; }
  openModal(`<header><div><span class="chip">${esc(S.scen?.name || 'Escenario libre')}</span><h2>Monte Carlo</h2></div><button class="btn x">Cerrar</button></header><div class="bd">
    <p>Corre <b>la misma situación</b> muchas veces con semillas distintas y muestra qué tan probable es cada resultado. Una sola corrida puede ser suerte; cien corridas muestran la tendencia.</p>
    <div class="field"><label for="mcRuns">Cantidad de corridas</label><select id="mcRuns" class="sel">${RUNS.map(n => `<option value="${n}" ${n === last.runs ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
    <label class="check"><input type="checkbox" id="mcSample" ${last.sample ? 'checked' : ''}> Sortear los parámetros dentro de su rango de incertidumbre (RCS, Pk, velocidades, alcances, CEP…)</label>
    <p class="hint">Sin sorteo, solo cambia el azar de cada corrida (detección, Pk, dispersión) con los valores probables del catálogo. Con sorteo, además, cada corrida usa un catálogo distinto tomado de los rangos mín–probable–máx de cada ficha. Lo que elegiste vos (posiciones, munición, mástiles, rutas, alturas) no se sortea.</p>
    <div class="field"><label for="mcSeed">Primera semilla</label><input id="mcSeed" class="inp" type="number" min="1" max="1000000" value="${last.seed}"></div>
    <p class="hint">La corrida <i>i</i> usa la semilla <i>primera + i</i>: con los mismos datos, la serie se puede repetir exacta. Una corrida del escenario de Monterey tarda 1–2 s, así que 50 corridas llevan alrededor de un minuto.</p>
    <div class="row"><button class="btn pri" id="mcGo">Correr</button></div>
  </div>`, openMonteCarlo);
  $('#mcGo').onclick = () => {
    if (!$('#mcSeed').reportValidity() || !Number.isFinite($('#mcSeed').valueAsNumber)) return;
    last = { runs: +$('#mcRuns').value, sample: $('#mcSample').checked, seed: $('#mcSeed').valueAsNumber };
    run(last);
  };
}

/** Corre la serie con barra de progreso y al final abre el debrief Monte Carlo. */
function run(opts) {
  if (campaignBlocks('Monte Carlo')) return;
  resetSim();
  const mc = createMonteCarlo(opts), t0 = performance.now();
  openModal(`<header><h2>Monte Carlo en curso</h2></header><div class="bd">
    <p id="mcTxt">Preparando…</p><div class="mcprog"><i id="mcBar" style="width:0%"></i></div>
    <p class="hint" id="mcEta">&nbsp;</p><div class="row"><button class="btn" id="mcStop">Cancelar</button></div></div>`);
  $('#mcStop').onclick = () => mc.cancel();
  const frame = () => {
    // cerrar la ventana (clic afuera) también corta la serie
    if ($('#modal').hidden && !mc.done) mc.cancel();
    try { mc.tick(40); } catch (error) {
      resetSim(); renderAll();
      openModal(`<header><h2>Monte Carlo detenido</h2><button class="btn x">Cerrar</button></header><div class="bd"><p>${esc(error.message)}</p><p>La serie quedó incompleta. Revisá las rutas y los horarios antes de volver a correrla.</p></div>`);
      return;
    }
    const k = mc.results.length, el = (performance.now() - t0) / 1000;
    if (!mc.done) {
      $('#mcTxt').textContent = `Corrida ${Math.min(k + 1, opts.runs)} de ${opts.runs}`;
      $('#mcBar').style.width = (100 * k / opts.runs).toFixed(1) + '%';
      if (k) $('#mcEta').textContent = `Faltan unos ${Math.ceil(el / k * (opts.runs - k))} s`;
      setTimeout(frame, 0); return;
    }
    resetSim(); renderAll();
    if (!k) { closeModal(); toast('Monte Carlo cancelado.'); return; }
    openMcDebrief(aggregate(mc.results, S.scen, opts), mc.cancelled);
  };
  setTimeout(frame, 0);
}

// ---------------- DEBRIEF MONTE CARLO ----------------
const pct = v => v == null ? '—' : Math.round(v * 100) + '%';
const ci = p => `${pct(p.lo)}–${pct(p.hi)}`;
const num = (v, d = 0) => v == null ? '—' : v.toLocaleString('es-AR', { maximumFractionDigits: d, minimumFractionDigits: d });
/** Barra de probabilidad con el intervalo de confianza del 95% como franja más clara. */
const pbar = p => `<div class="pbar" title="${pct(p.p)} (${p.k} de ${p.n}); IC 95%: ${ci(p)}"><span class="ci" style="left:${(100 * p.lo).toFixed(1)}%;width:${(100 * (p.hi - p.lo)).toFixed(1)}%"></span><i style="width:${(100 * p.p).toFixed(1)}%"></i></div>`;
const pcell = p => `<td class="pc">${pbar(p)}<b>${pct(p.p)}</b> <span class="dim">${ci(p)}</span></td>`;

export function openMcDebrief(a, cancelled = false) {
  const o = a.outcome, side = a.player;
  const resTxt = o.none.k === a.n ? 'Sin metas definidas' : `Éxito ${pct(o.exito.p)} · parcial ${pct(o.parcial.p)} · fracaso ${pct(o.fracaso.p)}`;
  const objRows = a.objectives.map(x => `<tr><td>${esc(x.name)}</td>${pcell(x.survive)}${pcell(x.operational)}<td>${pct(x.dmgFrac.mean)}</td><td>${pct(x.dmgFrac.p10)}–${pct(x.dmgFrac.p90)}</td></tr>`).join('');
  const goalRows = a.goals.map(g => `<tr><td class="nt">${g.primary ? '<b>Principal:</b> ' : ''}${esc(g.text)}</td><td>${SIDE[g.side]}${g.side === side ? ' (vos)' : ''}</td>${pcell(g.met)}</tr>`).join('');
  const unitRows = a.unitsLost.map(u => `<tr><td>${esc(u.name)}</td>${pcell(u.lost)}</tr>`).join('');
  const m = a.metrics;
  const mrow = (lab, d, f = v => num(v)) => `<tr><td>${lab}</td><td>${f(d.mean)}</td><td>${f(d.p10)}</td><td>${f(d.p50)}</td><td>${f(d.p90)}</td><td>${f(d.min)}–${f(d.max)}</td></tr>`;
  const hmax = Math.max(1, ...a.interceptHist.map(h => h.n));
  const hist = a.interceptHist.map(h => `<div class="hb" title="${pct(h.from)}–${pct(h.to)} interceptadas: ${h.n} corrida(s)"><i style="height:${(100 * h.n / hmax).toFixed(1)}%"></i>${h.n ? `<span>${h.n}</span>` : ''}</div>`).join('');
  openModal(`<header><div><span class="chip">${esc(a.scen?.name || 'Escenario libre')}</span><h2>Debrief Monte Carlo</h2></div><button class="btn x">Cerrar</button></header><div class="bd debrief">
    <div class="dbres"><b>${side ? esc(SIDE[side]) + ': ' : ''}${resTxt}</b><span>${a.n} corridas${cancelled ? ' (cancelado antes de terminar)' : ''} · ${a.sample ? 'parámetros sorteados en su rango' : 'valores probables del catálogo'} · semillas ${a.seed}–${a.seed + a.n - 1}</span></div>
    ${a.objectives.length ? `<div><h3>Objetivos: probabilidad de que sobrevivan</h3><div class="tblwrap"><table class="t mc"><thead><tr><th>Objetivo</th><th>No destruido</th><th>Operativo</th><th>Daño medio</th><th>Daño p10–p90</th></tr></thead><tbody>${objRows}</tbody></table></div></div>` : ''}
    ${goalRows ? `<div><h3>Metas: probabilidad de cumplirlas</h3><div class="tblwrap"><table class="t mc"><thead><tr><th>Meta</th><th>Bando</th><th>Se cumple</th></tr></thead><tbody>${goalRows}</tbody></table></div></div>` : ''}
    ${unitRows ? `<div><h3>Unidades de defensa perdidas</h3><div class="tblwrap"><table class="t mc"><thead><tr><th>Unidad</th><th>Probabilidad de perderla</th></tr></thead><tbody>${unitRows}</tbody></table></div></div>` : ''}
    <div><h3>Armas reales interceptadas (% por corrida)</h3><div class="hist" role="img" aria-label="Histograma del porcentaje de armas reales interceptadas en cada corrida">${hist}</div><div class="histx"><span>0%</span><span>50%</span><span>100%</span></div><p class="hint">Cada barra cuenta cuántas corridas terminaron con ese porcentaje de interceptación (pasá el mouse para ver el detalle).</p></div>
    <div><h3>Dispersión de resultados</h3><div class="tblwrap"><table class="t"><thead><tr><th>Medida</th><th>Media</th><th>p10</th><th>Mediana</th><th>p90</th><th>Mín–máx</th></tr></thead><tbody>
      ${mrow('Armas reales interceptadas', m.interceptRate, pct)}${mrow('Interceptadas (cantidad)', m.intercepted)}${mrow('Impactos en el blanco', m.impacts)}${mrow('Daño total (HP)', m.damage)}${mrow('Interceptores lanzados', m.shots)}${mrow('Gasto de la defensa', m.defCost, v => v == null ? '—' : money(v))}${mrow('Costo del ataque', m.atkCost, v => v == null ? '—' : money(v))}
    </tbody></table></div></div>
    <div><h3>Cómo leerlo</h3><ul class="why">
      <li><b>Probabilidad</b> = corridas en las que pasó ÷ corridas totales. La franja clara de cada barra es el <b>intervalo de confianza del 95%</b> (Wilson): con pocas corridas es ancho; para afinarlo hacen falta más corridas (el ancho baja con √N).</li>
      <li><b>p10 / p90</b>: el 10% de las corridas dio menos que p10 y el 10% dio más que p90. Es el rango "típico" sin los extremos.</li>
      <li>${a.sample ? 'Cada corrida sorteó RCS, Pk, velocidades, alcances, CEP y costos dentro de los rangos del catálogo (fichas → "Confianza de los datos"): la dispersión mezcla el azar del combate con lo que no sabemos de cada sistema.' : 'Todas las corridas usaron los valores probables del catálogo: la dispersión es solo el azar del combate (detección, Pk, dispersión de impactos).'}</li>
      <li>Es un modelo con datos públicos aproximados: compará disposiciones entre sí más que leer los porcentajes como predicción.</li></ul></div>
    <div class="row"><button class="btn" id="mcAgain">Otra serie</button></div>
  </div>`, () => openMcDebrief(a, cancelled));
  $('#mcAgain').onclick = openMonteCarlo;
}
