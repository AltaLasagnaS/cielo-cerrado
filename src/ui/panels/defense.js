// @ts-check
// Pestaña "Defensa": catálogo de sistemas para ubicar, mando y control, y opciones de cobertura.
import { DEFENSES, THREATS, C2_LEVELS, WEATHER, TIMES_OF_DAY, GATEWAYS } from '../../data/index.js';
import { esc } from '../../util/format.js';
import { S } from '../../sim/state.js';
import { draw } from '../../render/draw.js';
import { $ } from '../dom.js';
import { schedCov } from '../coverage.js';
import { setMode, toast } from '../modes.js';
import { openFicha } from '../fichas.js';
import { infoBtn } from '../academy.js';
import { renderSel } from './selection.js';

/** Direcciones de donde sopla el viento (rosa de 8). */
const WIND_DIRS = [['Norte', 0], ['Noreste', 45], ['Este', 90], ['Sudeste', 135], ['Sur', 180], ['Sudoeste', 225], ['Oeste', 270], ['Noroeste', 315]];
const windTxt = () => S.wind.v ? `${S.wind.v} m/s (${Math.round(S.wind.v * 3.6)} km/h) desde ${String((WIND_DIRS.find(([, a]) => a === S.wind.from) || [S.wind.from + '°'])[0]).toLowerCase()}` : 'calma';

/** Botón de unidad con su "i" para abrir la ficha. */
export function unitBtn(key, def, act, cls) { return `<button class="ub ${cls} ${act ? 'act' : ''}" data-k="${key}" title="${esc(def.name)}"><span>${esc(def.short)}</span><i data-info="${key}" role="button" aria-label="Ficha">i</i></button>`; }
export function renderDef() {
  const el = $('#tab-def');
  const grp = (title, filter) => { const ks = Object.keys(DEFENSES).filter(k => filter(DEFENSES[k])); return `<div class="grp"><h3>${title}</h3><div class="unitgrid">${ks.map(k => unitBtn(k, DEFENSES[k], S.mode === 'placeDef' && S.placeType === k, DEFENSES[k].side === 'RU' ? 'ru' : '')).join('')}</div></div>`; };
  el.innerHTML = `
    ${grp('Ucrania / OTAN', d => (d.side === 'UA' || d.side === 'both') && d.kind !== 'sensor' && d.kind !== 'aew' && d.kind !== 'acoustic')}
    ${grp('Rusia', d => d.side === 'RU' && d.kind !== 'aew')}
    ${grp('Sensores', d => ['sensor', 'aew', 'acoustic'].includes(d.kind))}
    <div class="grp"><h3>Mando y control ${infoBtn('detect')} ${infoBtn('saturation')}</h3>
      <div class="field"><label for="optC2">Coordinación C2 (general) ${infoBtn('c2')}</label><select id="optC2" class="sel">${Object.entries(C2_LEVELS).map(([k, L]) => `<option value="${k}" ${S.c2 === k ? 'selected' : ''}>${esc(L.name)}</option>`).join('')}</select></div>
      <p class="hint" id="c2Info">${esc(C2_LEVELS[S.c2].desc)}</p>
      <p class="hint">Desconectada desactiva alertas, pistas de red y reparto de blancos. El enlace técnico de cada unidad se configura aparte en Selección y solo intercambia pistas con sistemas compatibles.</p>
      ${Object.entries(GATEWAYS).map(([k, G]) => `<label class="check" title="${esc(G.note)}"><input type="checkbox" class="optGw" data-gw="${k}" ${S.gateways.includes(k) ? 'checked' : ''}> ${esc(G.name)}: pistas de tiro entre las dos redes (+${G.gwLag} s, Pk ×${G.gwPk})</label>`).join('')}
      <p class="hint">Apagada por defecto: no hay fuente de que esas pistas sirvan para disparar (sí hay imagen común y alertas, que se comparten igual).</p>
      <div class="field"><label for="optDoc">Doctrina de tiro</label><select id="optDoc" class="sel"><option value="salva" ${S.doctrine === 'salva' ? 'selected' : ''}>Salva (según unidad)</option><option value="sls" ${S.doctrine === 'sls' ? 'selected' : ''}>Disparar-observar-disparar</option></select></div>
      <label class="check" title="Los radares de tiro (S, C, X, Ku) aprenden a distinguir señuelos con el tiempo de seguimiento. Con esta opción no se dispara a pistas clasificadas como señuelo: ahorra munición, pero a veces un arma real se clasifica mal."><input type="checkbox" id="optDecoy" ${S.ignoreDecoys ? 'checked' : ''}> No tirarle a pistas clasificadas como señuelo</label>
      <div class="field" title="Alcance efectivo = alcance máximo × geometría (menos contra un blanco que se aleja). Esperar a que el blanco se acerque deja menos tiempo para un segundo tiro, pero el misil llega con más energía y la Pk sube."><label for="optFR">Disparar dentro del ${'<span id="frVal">' + Math.round(S.fireRange * 100) + '%</span>'} del alcance ${infoBtn('energia')}</label><input type="range" id="optFR" min="50" max="100" step="5" value="${Math.round(S.fireRange * 100)}"></div>
    </div>
    <div class="grp"><h3>Clima ${infoBtn('clima')}</h3>
      <div class="field"><label for="optWx">Tiempo</label><select id="optWx" class="sel">${Object.entries(WEATHER).map(([k, W]) => `<option value="${k}" ${S.weather === k ? 'selected' : ''}>${esc(W.name)}</option>`).join('')}</select></div>
      <p class="hint" id="wxInfo">${esc(WEATHER[S.weather].desc)}</p>
      <div class="field"><label for="optTod">Momento</label><select id="optTod" class="sel">${Object.entries(TIMES_OF_DAY).map(([k, D]) => `<option value="${k}" ${S.tod === k ? 'selected' : ''}>${esc(D.name)}</option>`).join('')}</select></div>
      <p class="hint" id="todInfo">${esc(TIMES_OF_DAY[S.tod].desc)}</p>
      <div class="field" title="El tiempo puede cambiar durante la noche: a los minutos indicados pasa al estado elegido (por ejemplo, entra una tormenta)."><label for="optWx2">Después cambia a</label><select id="optWx2" class="sel"><option value="">(no cambia)</option>${Object.entries(WEATHER).map(([k, W]) => `<option value="${k}" ${S.wxPlan[0]?.weather === k ? 'selected' : ''}>${esc(W.name)}</option>`).join('')}</select></div>
      <div class="field"><label for="optWxT">A los (minutos)</label><input id="optWxT" class="inp" type="number" min="1" max="600" value="${Math.round((S.wxPlan[0]?.t ?? 1800) / 60)}"></div>
      <div class="field" title="Viento en superficie (a 10 m), igual en todo el mapa; arriba sopla más (≈1,9 veces a 1.000 m). Los drones y misiles de crucero vuelan a su velocidad respecto del aire: con viento de frente tardan más y con viento de cola llegan antes. A un Shahed (≈185 km/h) le pesa mucho; a un misil de crucero, poco. No afecta a balísticos ni planeadoras."><label for="optWind">Viento ${infoBtn('clima')}</label><span class="val" id="windVal">${windTxt()}</span><input type="range" id="optWind" min="0" max="30" step="1" value="${S.wind.v}"></div>
      <div class="field"><label for="optWindFrom">Sopla desde</label><select id="optWindFrom" class="sel">${WIND_DIRS.map(([n, a]) => `<option value="${a}" ${S.wind.from === a ? 'selected' : ''}>${n} (${a}°)</option>`).join('')}</select></div>
    </div>
    <div class="grp"><h3>Cobertura de radar ${infoBtn('horizon')} ${infoBtn('los')}</h3>
      <label class="check"><input type="checkbox" id="optCov" ${S.showCov ? 'checked' : ''}> Mostrar cobertura sobre el mapa</label>
      <div class="field"><label for="optRef">Contra</label><select id="optRef" class="sel">${Object.entries(THREATS).map(([k, t]) => `<option value="${k}" ${k === S.covRef ? 'selected' : ''}>${esc(t.short)} (RCS ${t.rcs} m²)</option>`).join('')}</select></div>
      <div class="field"><label for="optAgl">Altura del blanco sobre el terreno</label><span class="val" id="aglVal">${S.covAgl} m</span><input type="range" id="optAgl" min="10" max="10000" step="10" value="${S.covAgl}"></div>
      <p class="hint" id="covInfo"></p>
    </div>`;
  el.onclick = e => {
    const inf = e.target.closest('[data-info]'); if (inf) { e.stopPropagation(); openFicha('def', inf.dataset.info); return; }
    const b = e.target.closest('.ub'); if (!b) return; if (S.started) { toast('Reiniciá para editar el escenario.'); return; }
    if (S.mode === 'placeDef' && S.placeType === b.dataset.k) setMode('select'); else setMode('placeDef', b.dataset.k);
  };
  $('#optC2').onchange = e => { if (S.started) { toast('Reiniciá para cambiar el mando y control.'); e.target.value = S.c2; return; } S.c2 = e.target.value; $('#c2Info').textContent = C2_LEVELS[S.c2].desc; renderSel(); };
  for (const c of el.querySelectorAll('.optGw')) c.onchange = e => { if (S.started) { toast('Reiniciá para cambiar las pasarelas.'); e.target.checked = !e.target.checked; return; } const k = e.target.dataset.gw; S.gateways = e.target.checked ? [...new Set([...S.gateways, k])] : S.gateways.filter(x => x !== k); };
  $('#optDoc').onchange = e => { S.doctrine = e.target.value; };
  $('#optDecoy').onchange = e => { S.ignoreDecoys = e.target.checked; };
  $('#optFR').oninput = e => { S.fireRange = +e.target.value / 100; $('#frVal').textContent = e.target.value + '%'; };
  $('#optWx').onchange = e => { if (S.started) { toast('Reiniciá para cambiar el clima.'); e.target.value = S.weather; return; } S.weather = e.target.value; $('#wxInfo').textContent = WEATHER[S.weather].desc; schedCov(); };
  $('#optTod').onchange = e => { if (S.started) { toast('Reiniciá para cambiar el momento del día.'); e.target.value = S.tod; return; } S.tod = e.target.value; $('#todInfo').textContent = TIMES_OF_DAY[S.tod].desc; schedCov(); };
  const setPlan = () => { const w = $('#optWx2').value, m = +$('#optWxT').value; S.wxPlan = w && Number.isFinite(m) && m >= 1 && m <= 600 ? [{ t: Math.round(m * 60), weather: w }] : []; };
  $('#optWx2').onchange = e => { if (S.started) { toast('Reiniciá para cambiar el clima.'); e.target.value = S.wxPlan[0]?.weather ?? ''; return; } setPlan(); };
  $('#optWxT').onchange = e => { if (S.started) { toast('Reiniciá para cambiar el clima.'); return; } setPlan(); };
  const windLock = (e, v) => { if (!S.started) return false; toast('Reiniciá para cambiar el viento.'); e.target.value = v; return true; };
  $('#optWind').oninput = e => { if (windLock(e, S.wind.v)) return; S.wind = { ...S.wind, v: +e.target.value }; $('#windVal').textContent = windTxt(); };
  $('#optWindFrom').onchange = e => { if (windLock(e, S.wind.from)) return; S.wind = { ...S.wind, from: +e.target.value }; $('#windVal').textContent = windTxt(); };
  $('#optCov').onchange = e => { S.showCov = e.target.checked; draw(); };
  $('#optRef').onchange = e => { S.covRef = e.target.value; const T = THREATS[S.covRef]; S.covAgl = T.agl ?? (T.prof === 'ballistic' ? 10000 : (T.prof === 'hilo' ? 15 : 5000)); $('#optAgl').value = S.covAgl; $('#aglVal').textContent = S.covAgl + ' m'; schedCov(); };
  $('#optAgl').oninput = e => { S.covAgl = +e.target.value; $('#aglVal').textContent = S.covAgl + ' m'; schedCov(); };
  renderCovInfo();
}
/** Texto explicativo bajo las opciones de cobertura (incluye el % cubierto). */
export function renderCovInfo() { const el = $('#covInfo'); if (!el) return; const T = THREATS[S.covRef]; el.innerHTML = `Turquesa: al menos un sensor ve un <b>${esc(T.short)}</b> a <b>${S.covAgl} m</b> sobre el terreno (más intenso = 2+ sensores). Oscuro: hueco de cobertura. ${S.covStat ? 'Cubierto: <b>' + S.covStat.pct + '%</b> del mapa.' : ''}`; }
