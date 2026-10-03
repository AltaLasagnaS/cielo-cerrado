// ---------------- FICHAS ----------------
// Ventanas modales: ficha de cada arma/defensa/jammer (datos, notas, quién lo detecta, tasas reales,
// confianza de los datos y fuentes), comparativas y calibración de Pk.
import { BANDS, CLS_NAME, THREATS, DEFENSES, JAMMERS, OBS, UNC, PL, CAL, SRC_REF, JAM_MODES } from '../data/index.js';
import { esc, kmh, mach, money } from '../util/format.js';
import { rcsAt, horizon, singleJam, burnThrough } from '../physics/radar.js';
import { $ } from './dom.js';
import { infoBtn, bandChip } from './academy.js';

/** Sensores de referencia para la tabla "¿Quién lo ve y desde dónde?". */
const REF_RADARS = ['ewr', 'p18', 'patriot', 'irist', 'nasams', 'gepard', 's400', 'pantsir', 'aew_s340'];
// Historial de ventanas: abrir un concepto desde una ficha permite volver a la ficha.
// Cada ventana registra cómo volver a abrirse (reopen); el historial guarda esas funciones.
let current = null; const history = [];
/** Abre la ventana. reopen = función que la vuelve a abrir (para el botón "Volver"). */
export function openModal(html, reopen = null) { $('#sheet').innerHTML = html; $('#modal').hidden = false; $('#sheet').scrollTop = 0; current = reopen; const x = $('#sheet .x'); if (x) x.onclick = closeModal; const bk = $('#sheet .back'); if (bk) bk.onclick = goBack; }
/** Abre una ventana "encima" de la actual, guardando la actual para volver. */
export function pushModal(html, reopen) { if (!$('#modal').hidden && current) history.push(current); openModal(html, reopen); }
/** Abre otra ventana guardando la actual para poder volver. */
export function pushModalFn(open) { if (!$('#modal').hidden && current) { const prev = current; open(); history.push(prev); addBack(); } else open(); }
function addBack() { const h = $('#sheet header'); if (h && !h.querySelector('.back')) { h.insertAdjacentHTML('afterbegin', '<button class="btn sm back">← Volver</button>'); $('#sheet .back').onclick = goBack; } }
export const canGoBack = () => !$('#modal').hidden && !!current;
function goBack() { const f = history.pop(); if (f) f(); else closeModal(); }
export function closeModal() { $('#modal').hidden = true; history.length = 0; current = null; }
export function initModal() {
  $('#modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
}
const spec = (k, v) => `<div class="spec"><small>${k}</small><b>${v}</b></div>`;
const srcs = list => `<div class="src"><h3>Fuentes</h3><ul>${list.map(s => `<li><a href="${s[1]}" target="_blank" rel="noopener">${esc(s[0])}</a></li>`).join('')}</ul></div>`;
const CONF_CLS = { alta: 'ok', media: 'mid', baja: 'low' };
export function fmtU(v, unit) {
  if (v == null || Number.isNaN(v)) return '—';
  if (unit === 'M US$') return money(v);
  if (unit === '' && v <= 1 && v > 0 && !Number.isInteger(v)) return Math.round(v * 100) + '%';
  if (Math.abs(v) >= 1e5) return v.toExponential(0);
  if (Math.abs(v) >= 100) return Math.round(v).toLocaleString('es-AR');
  return (+v.toPrecision(3)).toLocaleString('es-AR');
}
/** Tabla "Confianza de los datos" de una ficha (rangos, confianza y fuentes numeradas). */
export function confTable(kind, k) {
  const P = UNC[kind] && UNC[kind][k]; if (!P) return '';
  const used = []; const ref = id => { let i = used.indexOf(id); if (i < 0) { used.push(id); i = used.length - 1; } return i + 1; };
  const rows = Object.entries(P).map(([path, u]) => { const [lab, unit] = PL[path] || [path, '']; const sr = u.src.length ? `<sup>[${u.src.map(ref).join(',')}]</sup>` : ''; return `<tr><td>${esc(lab)}${unit && unit !== 'M US$' && !(unit === '' ) ? ' <span class="dim">(' + esc(unit) + ')</span>' : ''}</td><td>${fmtU(u.min, unit)}</td><td><b>${fmtU(u.p, unit)}</b></td><td>${fmtU(u.max, unit)}</td><td><span class="conf ${CONF_CLS[u.c]}">${u.c}</span></td><td class="nt">${sr}${u.nota ? ' ' + esc(u.nota) : (u.src.length ? '' : '—')}</td></tr>`; }).join('');
  const refs = used.map((id, i) => { const s = SRC_REF(id); return `<li value="${i + 1}">${s[1] ? `<a href="${s[1]}" target="_blank" rel="noopener">${esc(s[0])}</a>` : esc(s[0])}</li>`; }).join('');
  return `<div class="conf-sec"><h3>Confianza de los datos</h3><p class="hint">El valor <b>probable</b> es el que usa la simulación; mínimo y máximo son el rango para el modo Monte Carlo. "est" = estimación propia (física o sistemas análogos) donde no hay dato público.</p><div class="tblwrap"><table class="t ct"><thead><tr><th>Parámetro</th><th>Mín</th><th>Probable</th><th>Máx</th><th>Confianza</th><th>Fuente / razonamiento</th></tr></thead><tbody>${rows}</tbody></table></div>${refs ? `<ol class="refs">${refs}</ol>` : ''}</div>`;
}
/** Tabla de tasas de intercepción observadas en Ucrania. */
export function obsTable(k) {
  const L = OBS[k]; if (!L || !L.length) return '';
  const n = v => v == null ? '—' : v.toLocaleString('es-AR');
  return `<div><h3>Tasas de intercepción reportadas</h3><div class="tblwrap"><table class="t"><thead><tr><th>Período</th><th>Lanzados</th><th>Derribados</th><th>Tasa</th><th>Nota</th></tr></thead><tbody>${L.map(o => { const s = SRC_REF(o[4]); return `<tr><td>${esc(o[0])}</td><td>${n(o[1])}</td><td>${n(o[2])}</td><td><b>${esc(o[3])}</b></td><td class="nt">${esc(o[5] || '')} <a href="${s[1]}" target="_blank" rel="noopener" title="${esc(s[0])}">fuente</a></td></tr>`; }).join('')}</tbody></table></div><p class="hint">Son tasas nacionales: mezclan la Pk real con la cobertura (cuántos blancos pasan por zonas defendidas), la munición disponible y la saturación. Ver "Calibración de Pk".</p></div>`;
}
/** Ventana "Calibración de Pk". */
export function openCal() {
  const pc = v => Math.round(v * 100) + '%';
  const rows = CAL.map(c => `<tr><td class="nt">${esc(c.caso)}</td><td class="nt">${esc(c.real)}</td><td>${esc(c.obj)}</td><td><b>${pc(c.sim)}</b></td><td>${pc(c.lo)}–${pc(c.hi)}</td><td>${c.ok == null ? '<span class="conf">control</span>' : `<span class="conf ${c.ok ? 'ok' : 'low'}">${c.ok ? 'dentro' : 'fuera'}</span>`}</td></tr>`).join('');
  openModal(`<header><h2>Calibración de Pk</h2><button class="btn x">Cerrar</button></header><div class="bd">
    <p>Las tasas que publica Ucrania no son una Pk: son el resultado de todo el sistema. Una forma simple de leerlas:</p>
    <p class="formula">tasa observada ≈ C × [1 − (1 − Pk·m)<sup>n</sup>]</p>
    <ul><li><b>C</b>: fracción de blancos que pasa por una zona defendida con munición y tiempo para enfrentarlos (cobertura).</li><li><b>Pk</b>: probabilidad de que un interceptor destruya el blanco (lo que carga el catálogo).</li><li><b>m</b>: modificadores (maniobra terminal, bengalas, baja firma, interferencia, velocidad).</li><li><b>n</b>: interceptores por blanco (salva).</li></ul>
    <p>Por eso no se calibró contra el promedio nacional (por ejemplo 0,55% contra Kh-22 o 4,5% contra balísticos hasta 2024, dominados por C≈0), sino contra episodios donde el blanco cayó dentro de la cobertura de un sistema capaz: Kyiv con Patriot, ataques masivos de crucero sobre zonas con IRIS-T/NASAMS, oleadas de Shahed sobre la defensa por capas. Después se corrieron esos casos en el motor del simulador (Monte Carlo) y se ajustaron las Pk hasta que la tasa simulada cayera dentro del rango objetivo.</p>
    <div class="tblwrap"><table class="t ct"><thead><tr><th>Caso de prueba (motor)</th><th>Dato real</th><th>Objetivo</th><th>Simulado (Pk probable)</th><th>Con Pk mín–máx</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="hint">40 corridas por caso con el motor de esta página, relieve plano, red integrada y doctrina de salva (2 interceptores por blanco donde corresponde). "Simulado" es la tasa de derribo de blancos reales, sin contar señuelos. La columna mín–máx repite el caso con las Pk de esa defensa en el extremo de su rango: muestra cuánto pesa la Pk frente a la geometría, la saturación y la munición. El objetivo para muestras chicas es el intervalo de confianza del 95% (Wilson).</p>
    <h3>Qué se ajustó</h3>
    <ul><li>Patriot MSE vs supersónicos: 0,6 para que 12 Kh-22 contra 16 interceptores den ≈60–75% (dato real 9 de 12).</li><li>Iskander-M: maniobra terminal 2025 ×0,6 y 6 señuelos. Los señuelos le hacen gastar al Patriot ~4 interceptores por ataque: el mismo caso con 2 señuelos da ≈57%.</li><li>IRIS-T vs supersónicos: bajada a 0,2; capacidad antibalística quitada por falta de datos.</li><li>Crucero: el modificador por baja firma ahora es ×0,85 con buscador activo y ×0,75 con guiado desde tierra.</li><li>Kh-22 contra IRIS-T/NASAMS da 0% sin tocar Pk: la picada a ≈1.100 m/s desde 27 km deja una ventana de enfrentamiento de pocos segundos. Coincide con los 3 derribos en más de 400 lanzamientos.</li><li>Oniks: dentro de una defensa de punto se derriba bastante. El 5,7% real se explica por cobertura: tramo final a 10–15 m que solo se ve a ~20–25 km del radar.</li></ul>
    <div class="warn">Lo que esta calibración no captura: la discriminación de señuelos por parte del radar, la escasez de munición real (2025–2026: se dispara 1 PAC-3 por blanco en vez de 2–3), y que las tasas ucranianas no tienen auditoría independiente.</div>
  </div>`, openCal);
}
/** Ficha de una amenaza (kind = thr), defensa (def) o jammer (jam). */
export function openFicha(kind, k) {
  if (kind === 'thr') {
    const t = THREATS[k];
    const alt = t.agl ? t.agl + ' m AGL (ajustable ' + (t.aglRange ? t.aglRange.join('–') : '') + ')' : t.cruiseAlt ? (t.cruiseAlt / 1000) + ' km crucero' : 'apogeo ≈' + t.apogee + ' km';
    const rows = REF_RADARS.map(rk => { const d = DEFENSES[rk], r = d.radar; const rc = rcsAt(t, r.band); const R = r.band === 'OPT' ? r.R1 : r.R1 * Math.pow(rc, 0.25); const Rs = r.band === 'OPT' ? r.R1 : r.R1 * Math.pow(rcsAt(t, r.band, 0), 0.25); const ht = t.agl ?? (t.cruiseAlt || t.apogee * 1000); const hz = d.kind === 'aew' ? horizon(d.alt, ht) : horizon(r.mast, ht); return `<tr><td>${esc(d.short)} ${bandChip(r.band)}</td><td>${rc < 0.1 ? rc.toFixed(3) : rc.toFixed(2)}</td><td>${R.toFixed(0)} km</td><td>${Rs.toFixed(0)} km</td><td>${hz.toFixed(0)} km</td><td><b>${Math.min(R, hz).toFixed(0)} km</b></td></tr>`; }).join('');
    openModal(`<header><div><span class="chip ${t.side === 'RU' ? 'ru' : 'ua'}">${t.side === 'RU' ? 'Rusia' : 'Ucrania / OTAN'}</span> <span class="chip">${esc(CLS_NAME[t.cls])}</span><h2>${esc(t.name)}</h2></div><button class="btn x">Cerrar</button></header>
      <div class="bd">
        <div class="specs">${spec('Velocidad', kmh(t.v) + ' · ' + mach(t.v))}${t.vDive ? spec('Velocidad en picada', kmh(t.vDive) + ' · ' + mach(t.vDive)) : ''}${spec('Perfil de altura', alt)}${spec('Alcance real', esc(t.range))}${spec('RCS estimada X/S: frente · costado · cola ' + infoBtn('aspect'), t.rcs + ' · ' + t.rcsSide + ' · ' + t.rcsRear + ' m²' + (t.lo ? ' · forma furtiva' : ''))}${spec('RCS en VHF (frente) ' + infoBtn('rcs'), rcsAt(t, 'VHF') + ' m²')}${spec('Fluctuación de la RCS ' + infoBtn('radarEq'), t.swerling === 3 ? 'Swerling 3 (un reflector dominante)' : 'Swerling 1 (muchos reflectores)')}${spec('Ojiva', esc(t.warhead))}${spec('Precisión (CEP) ' + infoBtn('damage'), t.cep + ' m')}${spec('Guiado', esc(t.guidance))}${spec('Propulsión', esc(t.engine))}${spec('Costo estimado', money(t.cost))}</div>
        <p>${esc(t.profile)}</p>
        <div><h3>En la guerra de Ucrania</h3><ul>${t.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>
        <div><h3>¿Quién lo ve y desde dónde? ${infoBtn('horizon')}</h3><p class="hint">Alcance de detección por RCS (ecuación del radar, R ∝ σ<sup>¼</sup>) y horizonte de radar con curvatura 4/3 para la altura típica de vuelo. Lo que manda es el menor de los dos. "Por señal" y "Detección" son de frente, el peor caso; la columna "De costado" muestra cuánto más lejos lo ve un radar que lo mira de costado. Sin interferencia ni relieve.</p>
          <div class="tblwrap"><table class="t"><thead><tr><th>Sensor</th><th>RCS de frente en su banda (m²)</th><th>Por señal</th><th>De costado</th><th>Por horizonte</th><th>Detección</th></tr></thead><tbody>${rows}</tbody></table></div></div>
        ${obsTable(k)}
        <div class="warn">Costo: ${esc(t.costNote)}. RCS y probabilidades de derribo son estimaciones: los valores reales son secretos y dependen del ángulo, la banda y el clima.</div>
        ${confTable('thr', k)}
        ${srcs(t.sources)}
      </div>`, () => openFicha(kind, k));
  } else if (kind === 'def') {
    const d = DEFENSES[k], r = d.radar, s = d.sam;
    let h = `<header><div><span class="chip ${d.side === 'RU' ? 'ru' : d.side === 'UA' ? 'ua' : ''}">${d.side === 'RU' ? 'Rusia' : d.side === 'UA' ? 'Ucrania / OTAN' : 'Ambos bandos'}</span><h2>${esc(d.name)}</h2></div><button class="btn x">Cerrar</button></header><div class="bd"><div class="specs">`;
    if (s) h += spec('Alcance', s.maxR + ' km' + (s.maxRtbm ? ' · vs balísticos ' + s.maxRtbm + ' km' : ' · sin capacidad antibalística')) + spec('Techo / piso', (s.altMax / 1000) + ' km / ' + s.altMin + ' m') + spec('Interceptor', esc(s.shot) + ' · ' + kmh(s.vInt) + ' prom.') + spec('Guiado', s.guid) + spec('Blanco más rápido', kmh(s.vmaxT)) + spec('Tiempo de reacción', s.react + ' s') + spec('Canales simultáneos', s.ch) + spec('Munición típica', s.mag) + spec('Costo por disparo', money(s.cost));
    if (r) h += spec('Sensor', esc(r.name)) + spec('Banda', esc(BANDS[r.band].name) + ' ' + infoBtn('band:' + r.band)) + spec('Alcance (1 m²) ' + infoBtn('radarEq'), r.R1 + ' km') + spec('Cobertura ' + infoBtn('sector'), r.sector >= 360 ? '360°' : (r.side ? '2 × ' + r.sector + '° laterales' : r.sector + '° (sector)')) + spec('Altura antena', d.kind === 'aew' ? d.alt + ' m (vuelo)' : r.mast + ' m') + spec('Margen ECCM ' + infoBtn('eccm'), r.eccm >= 99 ? 'inmune' : r.eccm + ' dB');
    h += `</div><p>${esc(d.range || '')}${d.interceptor ? ' · ' + esc(d.interceptor) : ''}</p>`;
    if (r) h += `<p class="hint">${esc(BANDS[r.band].note)}</p>`;
    h += `<div><h3>Notas</h3><ul>${d.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>`;
    if (s) h += `<div><h3>Pk por clase de blanco (modelo del simulador) ${infoBtn('pk')}</h3><div class="tblwrap"><table class="t"><thead><tr><th>Clase</th><th>Pk base</th></tr></thead><tbody>${Object.entries(s.pk).map(([c, v]) => `<tr><td>${esc(CLS_NAME[c])}</td><td>${Math.round(v * 100)}%</td></tr>`).join('')}</tbody></table></div><p class="hint">Es la Pk de un interceptor que llega al punto de encuentro. Se reduce con maniobra terminal (×0,6–0,85 según el arma; ×0,85 para cañones), bengalas contra IR (×0,85), blancos furtivos (×0,85 con buscador activo, ×0,75 con mando/TVM/semiactivo), interferencia sobre su radar y blancos cerca de su velocidad máxima. <button class="btn sm" id="fCal">Ver calibración</button></p></div>`;
    if (r && r.band !== 'ACU') { h += `<div><h3>Detección de cada amenaza por este sensor</h3><div class="tblwrap"><table class="t"><thead><tr><th>Amenaza</th><th>RCS de frente en ${r.band}</th><th>Por señal</th><th>De costado</th><th>Horizonte</th><th>Detección</th></tr></thead><tbody>${Object.values(THREATS).map(t => { const rc = rcsAt(t, r.band), R = r.band === 'OPT' ? r.R1 : r.R1 * Math.pow(rc, 0.25), Rs = r.band === 'OPT' ? r.R1 : r.R1 * Math.pow(rcsAt(t, r.band, 0), 0.25), ht = t.agl ?? (t.cruiseAlt || t.apogee * 1000), hz = horizon(d.kind === 'aew' ? d.alt : r.mast, ht); return `<tr><td>${esc(t.short)}</td><td>${rc < 0.1 ? rc.toFixed(3) : rc.toFixed(2)}</td><td>${R.toFixed(0)} km</td><td>${Rs.toFixed(0)} km</td><td>${hz.toFixed(0)} km</td><td><b>${Math.min(R, hz).toFixed(0)} km</b></td></tr>`; }).join('')}</tbody></table></div><p class="hint">"Por señal" y "Detección" son de frente (peor caso); "De costado" es el alcance por señal si el blanco pasa de costado a este radar.</p></div>`; }
    h += `<div class="warn">Parámetros aproximados a partir de fuentes abiertas. Pk, RCS y alcances de radar contra blancos chicos son estimaciones calibradas, no datos oficiales.</div>${confTable('def', k)}${srcs(d.sources)}</div>`;
    openModal(h, () => openFicha(kind, k)); if ($('#fCal')) $('#fCal').onclick = () => pushModalFn(openCal);
  } else {
    const j = JAMMERS[k];
    openModal(`<header><div><span class="chip ew">Guerra electrónica</span><h2>${esc(j.name)}</h2></div><button class="btn x">Cerrar</button></header><div class="bd"><div class="specs">${j.gnssJam ? spec('Efecto ' + infoBtn('gnss'), j.spoofKm ? 'Engaño GNSS (spoofing)' : 'Interferencia GNSS') + spec('Radio', j.radius + ' km') + (j.spoofKm ? spec('Desvío típico', j.spoofKm + ' km') : '') + spec('Rol', 'Defensor: desvía armas atacantes') : spec('Bandas', j.bands.join(', ')) + spec('Plataforma', j.air ? 'Aérea, ' + j.alt + ' m' : 'Terrestre, mástil ' + j.mast + ' m') + spec('Potencia relativa', j.P.toExponential(0))}</div><ul>${j.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>${j.bands ? jamTable(j) : ''}${confTable('jam', k)}${srcs(j.sources)}</div>`, () => openFicha(kind, k));
  }
}
export function cmpThreats() {
  openModal(`<header><h2>Comparar amenazas</h2><button class="btn x">Cerrar</button></header><div class="bd"><div class="tblwrap"><table class="t"><thead><tr><th>Arma</th><th>Bando</th><th>Clase</th><th>Velocidad</th><th>Mach</th><th>Altura</th><th>RCS frente</th><th>RCS costado</th><th>RCS VHF</th><th>Alcance</th><th>Costo</th></tr></thead><tbody>${Object.values(THREATS).map(t => `<tr><td>${esc(t.name)}</td><td>${t.side}</td><td>${t.cls}</td><td>${kmh(t.v)}</td><td>${(t.v / 340).toFixed(1)}</td><td>${t.agl ? t.agl + ' m AGL' : t.cruiseAlt ? t.cruiseAlt / 1000 + ' km' : t.apogee + ' km apog.'}</td><td>${t.rcs}</td><td>${t.rcsSide}</td><td>${rcsAt(t, 'VHF').toFixed(2)}</td><td>${esc(t.range)}</td><td>${money(t.cost)}</td></tr>`).join('')}</tbody></table></div><p class="hint">RCS estimadas en m² (bandas X/S; frente y costado). La columna VHF muestra cómo crecen los blancos chicos o furtivos frente a radares de onda métrica (modelo simplificado).</p></div>`, cmpThreats);
}
export function cmpDefs() {
  openModal(`<header><h2>Comparar defensas</h2><button class="btn x">Cerrar</button></header><div class="bd"><div class="tblwrap"><table class="t"><thead><tr><th>Sistema</th><th>Bando</th><th>Alcance</th><th>Anti-TBM</th><th>Techo</th><th>Guiado</th><th>Radar</th><th>1 m² a</th><th>Canales</th><th>US$/disparo</th><th>Pk crucero</th><th>Pk balíst.</th></tr></thead><tbody>${Object.values(DEFENSES).filter(d => d.sam).map(d => `<tr><td>${esc(d.name)}</td><td>${d.side}</td><td>${d.sam.maxR} km</td><td>${d.sam.maxRtbm ? d.sam.maxRtbm + ' km' : '—'}</td><td>${d.sam.altMax / 1000} km</td><td>${d.sam.guid}</td><td>${d.radar ? d.radar.band : 'red'}</td><td>${d.radar ? d.radar.R1 + ' km' : '—'}</td><td>${d.sam.ch}</td><td>${money(d.sam.cost)}</td><td>${Math.round(d.sam.pk.crucero * 100)}%</td><td>${Math.round(d.sam.pk.balistico * 100)}%</td></tr>`).join('')}</tbody></table></div></div>`, cmpDefs);
}

/**
 * Qué le hace un jammer de radar a cada radar de sus bandas: alcance contra 1 m² (Pd 50%) sin
 * interferencia y con el jammer a JAM_TABLE_KM, según el modo y el lóbulo por el que entra
 * (physics/radar.js#singleJam). Ese alcance es la distancia de "quemado": más cerca, el eco gana.
 */
const JAM_TABLE_KM = 100;
function jamTable(j) {
  const seen = new Set(), rows = [];
  for (const d of Object.values(DEFENSES)) {
    const r = d.radar; if (!r || !j.bands.includes(r.band) || seen.has(r.name)) continue; seen.add(r.name);
    const R = (lobe, mg) => burnThrough(r, singleJam(r, j.P, JAM_TABLE_KM, lobe, mg)).toFixed(0) + ' km';
    const ec = [r.agile ? 'agilidad' : '', r.lowSL ? 'lóbulos bajos' : '', r.slc ? r.slc + ' SLC' : ''].filter(Boolean).join(', ') || '—';
    rows.push(`<tr><td>${esc(d.short)} · ${esc(r.name)} (${r.band})</td><td>${ec}</td><td>${r.R1} km</td><td>${R('main', JAM_MODES.barrage.gain)}</td><td>${R('near', JAM_MODES.barrage.gain)}</td><td>${R('main', r.agile ? JAM_MODES.spot.agileGain : JAM_MODES.spot.gain)}</td></tr>`);
  }
  return `<div><h3>Qué le hace a cada radar ${infoBtn('eccm')} ${infoBtn('noise')}</h3><p class="hint">Alcance contra 1 m² con este jammer a ${JAM_TABLE_KM} km, sin relieve. Es la distancia de <b>quemado</b>: más cerca de eso, el eco del blanco le gana al ruido. "De frente": el jammer está alineado con los blancos (lóbulo principal); "de costado": entra por los primeros lóbulos laterales, donde pesan los lóbulos bajos y los canceladores (SLC).</p>
    <div class="tblwrap"><table class="t"><thead><tr><th>Radar</th><th>ECCM</th><th>Sin jammer</th><th>Barrera, de frente</th><th>Barrera, de costado</th><th>Puntual, de frente</th></tr></thead><tbody>${rows.join('')}</tbody></table></div></div>`;
}
