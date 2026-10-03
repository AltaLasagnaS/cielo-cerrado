// ---------------- ACADEMIA ----------------
// Conceptos físicos y de radar que usa el motor, explicados de forma breve pero correcta, con una
// sección "En el simulador" que muestra las variables y funciones reales y números calculados en vivo
// desde el catálogo (no hay valores copiados a mano: si cambia un dato, cambia la explicación).
//
// Cada concepto: { id, group, title, body() → HTML, engine() → HTML, widget? { html(), mount(el) } }
import { BANDS, THREATS, DEFENSES, JAMMERS, UNC, CLS_NAME, TARGET_TYPES, DAMAGE, C2_LEVELS } from '../data/index.js';
import { esc, kmh } from '../util/format.js';
import { KR, HORIZON_K, LOS_MARGIN } from '../physics/constants.js';
import { rcsAt, horizon } from '../physics/radar.js';
import { directDamage, radius50, warheadKg } from '../physics/damage.js';
import { RELIEF_RADIUS_KM } from '../physics/terrain-analysis.js';
import { AUTO_PHASES } from '../sim/pace.js';

export const CONCEPT_GROUPS = ['Radar y bandas', 'Detección y terreno', 'Guerra electrónica', 'Enfrentamiento'];

const code = s => `<code>${esc(s)}</code>`;
const n = (v, d = 0) => (+v).toLocaleString('es-AR', { maximumFractionDigits: d, minimumFractionDigits: d });
const lambdaTxt = ([a, b]) => { const f = v => v >= 1 ? n(v, 1) + ' m' : v >= 0.01 ? n(v * 100, 1) + ' cm' : v >= 1e-3 ? n(v * 1000, 1) + ' mm' : n(v * 1e6, 1) + ' µm'; return f(a) + ' – ' + f(b); };
const radarBands = ['VHF', 'L', 'S', 'C', 'X', 'Ku'];
const rcsTxt = v => v < 0.1 ? n(v, 3) : n(v, 2);

function bandConcept(k) {
  const B = BANDS[k];
  return {
    id: 'band:' + k, group: 'Radar y bandas', title: B.name, band: k,
    body: () => `<div class="specs">${[['Frecuencia', B.freq], ['Longitud de onda', lambdaTxt(B.lambda)], ['Ancho de haz típico', B.bw >= 360 ? 'omnidireccional' : '~' + n(B.bw, 1) + '°'], ['Resolución', B.res]].map(([a, b]) => `<div class="spec"><small>${a}</small><b>${esc(b)}</b></div>`).join('')}</div>
      <p><b>Usos:</b> ${esc(B.uses)}</p><p><b>Ventajas:</b> ${esc(B.pros)}</p><p><b>Limitaciones:</b> ${esc(B.cons)}</p>
      <h3>Cómo cambia la RCS en esta banda</h3><p>${esc(B.rcsWhy)}</p>`,
    engine: () => {
      const sensors = Object.values(DEFENSES).filter(d => d.radar && d.radar.band === k).map(d => esc(d.short)).join(', ') || 'ninguno';
      const jams = Object.values(JAMMERS).filter(j => j.bands && j.bands.includes(k)).map(j => esc(j.short)).join(', ') || 'ninguno';
      const rows = radarBands.includes(k) ? Object.values(THREATS).map(t => `<tr><td>${esc(t.short)}</td><td>${rcsTxt(t.rcs)}</td><td><b>${rcsTxt(rcsAt(t, k))}</b></td></tr>`).join('') : '';
      return `<p>Sensores del catálogo en esta banda: <b>${sensors}</b>. Interferidores que la atacan: <b>${jams}</b>.</p>
        <p>${code('BANDS.' + k + '.bw')} = ${B.bw}° define qué tan alineado tiene que estar un jammer para entrar en el lóbulo principal (ver "Lóbulos"). ${B.rcs ? code('BANDS.' + k + '.rcs') + ' define cómo ' + code('rcsAt()') + ' ajusta la RCS.' : 'La RCS se usa tal cual.'}</p>
        ${rows ? `<div class="tblwrap"><table class="t"><thead><tr><th>Amenaza</th><th>RCS frontal X/S (m²)</th><th>RCS en ${k} (m²)</th></tr></thead><tbody>${rows}</tbody></table></div><p class="hint">Estimaciones simplificadas del juego: un número por banda, visto de frente. No son valores universales del blanco.</p>` : ''}`;
    }
  };
}

const THREAT_EX = ['shahed', 'kh101', 'isk_m'];

export const CONCEPTS = [
  {
    id: 'rcs', group: 'Radar y bandas', title: 'RCS (sección eficaz radar)',
    body: () => `<p>La <b>RCS</b> (σ, en m²) mide cuánta energía de radar devuelve un blanco hacia la antena. Se expresa como el área de una esfera metálica ideal que reflejaría lo mismo: no es el tamaño físico. Un misil furtivo de 7 m puede tener menos RCS que un dron de 2,5 m.</p>
      <p>Depende de la <b>forma</b> (superficies planas que reflejan hacia el radar, cavidades como tomas de aire), los <b>materiales</b> (metal, compuestos, pinturas absorbentes), el <b>aspecto</b> (desde qué ángulo se lo mira), la <b>polarización</b> y la <b>frecuencia</b> del radar.</p>`,
    engine: () => `<p>Cada amenaza tiene ${code('rcs')}, ${code('rcsSide')} y ${code('rcsRear')} = RCS <b>de frente, de costado y de cola estimadas en bandas X/S</b> (m²), más ${code('rcsVHF')} para las bandas métricas. ${code('rcsAt(th, banda, aspecto)')} ajusta según la banda (tabla de ${code('BANDS')}) y según desde dónde la mira cada radar (ver "La RCS depende del aspecto"). El valor probable, el rango mín–máx, la confianza y la justificación están en la ficha de cada arma → "Confianza de los datos".</p>
      <div class="tblwrap"><table class="t"><thead><tr><th>Amenaza</th><th>Mín</th><th>Probable</th><th>Máx</th><th>Confianza</th></tr></thead><tbody>${THREAT_EX.map(k => { const u = UNC.thr[k].rcs; return `<tr><td>${esc(THREATS[k].short)}</td><td>${u.min}</td><td><b>${u.p}</b></td><td>${u.max}</td><td>${u.c}</td></tr>`; }).join('')}</tbody></table></div>
      <div class="warn">La RCS del simulador es una <b>estimación simplificada</b>: frente, costado y cola, con reglas por banda. La RCS real cambia muchísimo con el ángulo exacto, la polarización y la frecuencia, y los valores medidos son secretos. Por eso cada número tiene un rango ancho: las fuentes públicas (OSINT) y la base de datos de <i>Command: Modern Operations</i> llegan a diferir en un orden de magnitud.</div>`
  },
  {
    id: 'freq', group: 'Radar y bandas', title: 'Frecuencia y longitud de onda',
    body: () => `<p>Un radar emite ondas electromagnéticas. Su <b>frecuencia</b> f y su <b>longitud de onda</b> λ se relacionan con la velocidad de la luz: <span class="formula">λ = c / f   (c ≈ 3·10⁸ m/s)</span></p>
      <p>Un radar VHF de 150 MHz trabaja con λ = 2 m; uno en banda X de 10 GHz, con λ = 3 cm. Para un mismo tamaño de antena D, el ancho del haz es aproximadamente θ ≈ 70°·λ/D: las <b>frecuencias bajas</b> necesitan antenas enormes y dan haces anchos (poca precisión, pero mucho alcance y menos atenuación); las <b>altas</b> dan haces finos y precisos con antenas chicas, a costa de alcance y de atenuación por lluvia.</p>`,
    engine: () => `<div class="tblwrap"><table class="t"><thead><tr><th>Banda</th><th>Frecuencia</th><th>λ</th><th>Haz (${code('bw')})</th></tr></thead><tbody>${Object.entries(BANDS).map(([k, B]) => `<tr><td><button class="lnk" data-concept="band:${k}">${esc(B.name)}</button></td><td>${esc(B.freq)}</td><td>${lambdaTxt(B.lambda)}</td><td>${B.bw >= 360 ? '—' : B.bw + '°'}</td></tr>`).join('')}</tbody></table></div><p class="hint">Fuente única: ${code('src/data/bands.js')}. Tocá una banda para ver su ficha.</p>`
  },
  ...Object.keys(BANDS).map(bandConcept),
  {
    id: 'bands', group: 'Radar y bandas', title: 'Por qué cada banda ve distinto un mismo blanco',
    body: () => `<p>La respuesta de un blanco depende de su tamaño comparado con la longitud de onda:</p>
      <ul><li><b>Rayleigh</b> (blanco mucho menor que λ): devuelve muy poco, σ crece como 1/λ⁴.</li>
      <li><b>Resonancia</b> (partes del blanco del orden de λ): aparecen picos; alas, aletas o el fuselaje entero "resuenan" y la RCS puede crecer mucho.</li>
      <li><b>Óptico</b> (blanco mucho mayor que λ): manda la forma. Acá funcionan el conformado furtivo y los materiales absorbentes.</li></ul>
      <p>Un dron de 2,5 m de envergadura frente a un radar VHF (λ ≈ 2 m) está en resonancia; frente a uno en banda X (λ ≈ 3 cm), en régimen óptico. Por eso los radares métricos se usan contra blancos furtivos, aunque no sirvan para guiar misiles.</p>`,
    engine: () => `<p>${code('rcsAt()')} aplica las reglas de ${code('BANDS[banda].rcs')}:</p><ul>${radarBands.map(k => `<li><b>${k}</b>: ${esc(BANDS[k].rcsWhy)}</li>`).join('')}</ul>`
  },
  {
    id: 'aspect', group: 'Radar y bandas', title: 'La RCS depende del aspecto',
    body: () => `<p>Un mismo blanco devuelve muy distinto según desde dónde se lo mire. De frente se ven la nariz y los bordes de ataque, muchas veces diseñados para desviar la energía; de costado, el fuselaje y las alas funcionan como espejos; de cola aparecen la tobera o la hélice. La diferencia frente/costado suele ser de 5 a 30 veces.</p>
      <p>Consecuencia táctica: un radar ubicado <b>al costado</b> de un corredor de ataque ve las armas más lejos que uno ubicado en la punta, donde lo enfrentan de frente. En bandas métricas (VHF) el efecto es menor, porque el blanco está cerca de la resonancia y la forma pesa menos.</p>`,
    engine: () => `<p>${code('aspectCos()')} calcula el ángulo θ entre la velocidad del arma (3D, la guarda la simulación en cada paso) y la línea arma → radar: θ = 0° de frente, 90° de costado, 180° de cola. ${code('aspectFactor()')} interpola <b>en decibeles</b>:</p>
      <p class="formula">ln σ(θ) = cos²θ · ln σ_frente (o σ_cola) + sin²θ · ln σ_costado</p>
      <p>En las bandas bajas (${code('BANDS[b].low')}: VHF y L) el contraste se reduce a la mitad en dB. La cobertura del mapa y las tablas de las fichas usan el frente, que es el peor caso para el defensor.</p>
      <p>Ejemplo, Shahed: frente <b>${THREATS.shahed.rcs}</b>, costado <b>${THREATS.shahed.rcsSide}</b> y cola <b>${THREATS.shahed.rcsRear}</b> m². Son la media geométrica entre el modelado de Járkov y la base de CMO, que difieren mucho; el rango completo está en su ficha.</p>`,
    widget: {
      html: () => `<div class="widget"><div class="field"><label for="aThr">Amenaza</label><select id="aThr" class="sel">${Object.entries(THREATS).map(([k, t]) => `<option value="${k}" ${k === 'shahed' ? 'selected' : ''}>${esc(t.short)}</option>`).join('')}</select></div>
        <div class="field"><label for="aRad">Radar</label><select id="aRad" class="sel">${Object.entries(DEFENSES).filter(([, d]) => d.radar && radarBands.includes(d.radar.band)).map(([k, d]) => `<option value="${k}" ${k === 'pantsir' ? 'selected' : ''}>${esc(d.short)} (${d.radar.band})</option>`).join('')}</select></div>
        <div class="field"><label for="aAng">Ángulo de aspecto (0° = de frente, 90° = de costado, 180° = de cola)</label><span class="val" id="aAngV"></span><input id="aAng" type="range" min="0" max="180" step="5" value="90"></div>
        <p class="wout" id="aOut"></p></div>`,
      mount: el => {
        const upd = () => {
          const t = THREATS[el.querySelector('#aThr').value], r = DEFENSES[el.querySelector('#aRad').value].radar, deg = +el.querySelector('#aAng').value;
          const ca = Math.cos(deg * Math.PI / 180), s0 = rcsAt(t, r.band), s = rcsAt(t, r.band, ca);
          el.querySelector('#aAngV').textContent = deg + '°';
          el.querySelector('#aOut').innerHTML = `RCS en ${r.band}: <b>${rcsTxt(s)} m²</b> (de frente ${rcsTxt(s0)}) · alcance por señal <b>${n(r.R1 * Math.pow(s, 0.25))} km</b> (de frente ${n(r.R1 * Math.pow(s0, 0.25))} km)`;
        };
        for (const id of ['#aThr', '#aRad']) el.querySelector(id).onchange = upd;
        el.querySelector('#aAng').oninput = upd; upd();
      }
    }
  },
  {
    id: 'radarEq', group: 'Radar y bandas', title: 'Ecuación del radar y R ∝ σ^¼',
    body: () => `<p>La potencia del eco que vuelve a la antena es</p><p class="formula">Pr = Pt · G² · λ² · σ / ((4π)³ · R⁴)</p>
      <p>Pt es la potencia transmitida, G la ganancia de la antena y R la distancia. La onda viaja de ida y de vuelta: por eso cae con <b>R⁴</b>. El radar detecta si Pr supera su sensibilidad mínima, así que el alcance máximo es</p><p class="formula">R_max ∝ σ^¼</p>
      <p>Hace falta <b>16 veces más RCS para duplicar el alcance</b>; con una RCS 10 veces menor, el alcance cae a 0,56 veces. Por eso la furtividad ayuda, pero no hace invisible: acorta la distancia de detección.</p>`,
    engine: () => `<p>${code('detR(u, th, J) = R1 · σ_banda^¼ · (1/(1+J))^¼')}, donde ${code('R1')} es el alcance del radar contra 1 m² (dato del catálogo, con rango y fuentes) y J la interferencia. En cada barrido la probabilidad de detección es 95% hasta el 80% de ese alcance y cae linealmente hasta 30% en el límite.</p>`,
    widget: {
      html: () => `<div class="widget"><div class="field"><label for="wRad">Radar</label><select id="wRad" class="sel">${Object.entries(DEFENSES).filter(([, d]) => d.radar && radarBands.includes(d.radar.band)).map(([k, d]) => `<option value="${k}" ${k === 'ewr' ? 'selected' : ''}>${esc(d.short)} (${d.radar.band}, ${d.radar.R1} km vs 1 m²)</option>`).join('')}</select></div>
        <div class="field"><label for="wSig">RCS del blanco en la banda del radar</label><span class="val" id="wSigV"></span><input id="wSig" type="range" min="-3" max="1" step="0.05" value="-1"></div>
        <p class="wout" id="wOut"></p><div class="tblwrap"><table class="t" id="wTbl"></table></div></div>`,
      mount: el => {
        const upd = () => {
          const d = DEFENSES[el.querySelector('#wRad').value], r = d.radar, s = Math.pow(10, +el.querySelector('#wSig').value);
          el.querySelector('#wSigV').textContent = rcsTxt(s) + ' m²';
          el.querySelector('#wOut').innerHTML = `Alcance por señal: <b>${n(r.R1 * Math.pow(s, 0.25))} km</b> (sin interferencia ni horizonte)`;
          el.querySelector('#wTbl').innerHTML = `<thead><tr><th>Amenaza</th><th>RCS en ${r.band}</th><th>Alcance por señal</th></tr></thead><tbody>${Object.values(THREATS).map(t => `<tr><td>${esc(t.short)}</td><td>${rcsTxt(rcsAt(t, r.band))}</td><td>${n(r.R1 * Math.pow(rcsAt(t, r.band), 0.25))} km</td></tr>`).join('')}</tbody>`;
        };
        el.querySelector('#wRad').onchange = upd; el.querySelector('#wSig').oninput = upd; upd();
      }
    }
  },
  {
    id: 'horizon', group: 'Detección y terreno', title: 'Horizonte de radar',
    body: () => `<p>Las ondas de radar viajan casi en línea recta y la Tierra es curva: más allá del horizonte un blanco bajo queda escondido, por más potente que sea el radar. La atmósfera curva un poco el haz hacia abajo; se modela con una Tierra "más grande", de radio 4/3 del real (≈ 8.500 km). Así:</p>
      <p class="formula">d ≈ ${HORIZON_K} · (√h_radar + √h_blanco)   [km, con alturas en m]</p>
      <p>Un mástil de 10 m contra un misil a 50 m ve hasta ~${n(horizon(10, 50))} km; un avión radar a 6.000 m, hasta ~${n(horizon(6000, 50))} km. Por eso los misiles de crucero vuelan bajo y por eso existen los AEW y los mástiles de 24–39 m.</p>`,
    engine: () => `<p>${code('horizon(hr, ht)')} (fichas, vista previa al ubicar, tarjeta de selección) y ${code('KR = ' + KR.toExponential(1) + ' m')} en ${code('los()')} y en la cobertura. ${code('HORIZON_K')} = √(2·KR)/1000.</p>`,
    widget: {
      html: () => `<div class="widget"><div class="field"><label for="wHr">Altura de la antena</label><span class="val" id="wHrV"></span><input id="wHr" type="range" min="0" max="4" step="0.02" value="1"></div>
        <div class="field"><label for="wHt">Altura del blanco</label><span class="val" id="wHtV"></span><input id="wHt" type="range" min="0.7" max="4.3" step="0.02" value="1.7"></div><p class="wout" id="wHo"></p></div>`,
      mount: el => {
        const upd = () => { const hr = Math.round(Math.pow(10, +el.querySelector('#wHr').value)), ht = Math.round(Math.pow(10, +el.querySelector('#wHt').value)); el.querySelector('#wHrV').textContent = n(hr) + ' m'; el.querySelector('#wHtV').textContent = n(ht) + ' m'; el.querySelector('#wHo').innerHTML = `Horizonte: <b>${n(horizon(hr, ht))} km</b> (${n(HORIZON_K * Math.sqrt(hr))} km por la antena + ${n(HORIZON_K * Math.sqrt(ht))} km por el blanco)`; };
        el.querySelector('#wHr').oninput = upd; el.querySelector('#wHt').oninput = upd; upd();
      }
    }
  },
  {
    id: 'curv', group: 'Detección y terreno', title: 'Curvatura terrestre',
    body: () => `<p>Entre dos puntos separados por d₁ + d₂, la superficie de la Tierra se "abulta" en el medio una altura</p><p class="formula">b = d₁ · d₂ / (2 · R_efectivo)</p>
      <p>Entre un radar y un blanco a 50 km, en el punto medio el bulto es de ~${n(25000 * 25000 / (2 * KR))} m (con la Tierra 4/3). A 100 km ya son ~${n(50000 * 50000 / (2 * KR))} m: más que la altura de vuelo de un misil de crucero.</p>`,
    engine: () => `<p>${code('los()')} suma ese bulto a la altura del relieve en cada muestra del rayo, con ${code('KR')} = ${n(KR / 1000)} km. La cobertura hace lo mismo con su barrido radial.</p>`
  },
  {
    id: 'los', group: 'Detección y terreno', title: 'Línea de vista y efecto del relieve',
    body: () => `<p>Para detectar, el radar tiene que "ver" al blanco: ningún cerro puede interponerse entre la antena y el blanco. Un misil de crucero que vuela a 30–70 m siguiendo valles aprovecha justamente eso: el relieve le hace de escudo hasta que aparece a pocos km.</p>
      <p>También vale al revés: un jammer terrestre detrás de una loma no puede interferir a un radar, y un sensor en una cota dominante ve mucho más lejos que uno en el fondo de un valle.</p>`,
    engine: () => `<p>${code('los(A, B)')} recorre el segmento muestreando una vez por celda de la grilla (200 m) y declara la vista tapada si en algún punto el relieve + ${LOS_MARGIN} m de margen (árboles, edificios) + el bulto de la curvatura supera la altura del rayo. Se usa para detectar, para la línea radar–jammer y para los guiados que dependen del radar propio. La capa de cobertura del mapa usa el mismo modelo.</p>`
  },
  {
    id: 'antenna', group: 'Detección y terreno', title: 'Altura de antena y del blanco',
    body: () => `<p>El horizonte crece con la <b>raíz cuadrada</b> de la altura: cuadruplicar el mástil apenas duplica su aporte. Pero contra blancos rasantes, cada metro cuenta. Por eso se usan torres (la 40V6M levanta la antena del S-300 a ~24 m) y por eso conviene poner el radar sobre una cota alta.</p>
      <p>La altura del blanco suma de la misma forma. Un Shahed a 2.000 m se ve desde muy lejos, mientras que un Kh-101 a 50 m aparece tarde. Un balístico, en cambio, sube a 40–50 km y se ve desde cientos de km: su problema es la velocidad, no la detección.</p>`,
    engine: () => `<p>${code('antZ(u)')} = elevación del terreno + mástil (${code('u.mast')}, ajustable en la tarjeta de selección), o la altitud de vuelo si es un AEW. La capa de relieve "Puntos altos" y el tooltip (elevación y relieve relativo) ayudan a elegir dónde ubicarlo.</p>`
  },
  {
    id: 'relief', group: 'Detección y terreno', title: 'Lectura del relieve',
    body: () => `<p>La capa "Puntos altos" marca las cotas que dominan su entorno: los máximos locales que sobresalen sobre lo más bajo de unos 3 km a la redonda. El tooltip muestra el <b>relieve relativo</b>: la elevación del punto menos el promedio del terreno en ${RELIEF_RADIUS_KM} km. Un valor positivo indica una cota y uno negativo, un valle o una hondonada.</p>`,
    engine: () => `<p>${code('physics/terrain-analysis.js')} calcula todo sobre la misma grilla que ${code('surf()')}, pero <b>solo para mostrar</b>: no modifica el relieve que usan la línea de vista ni la detección.</p>`
  },
  {
    id: 'sector', group: 'Detección y terreno', title: 'Sector de antena',
    body: () => `<p>Un radar giratorio barre 360°. Uno de antena fija en fase (por ejemplo el AN/MPQ-65 del Patriot) cubre un <b>sector</b>: busca en ~90° y hay que orientarlo hacia la amenaza. Los AEW de antena lateral, como el Erieye, ven a los costados y tienen zonas ciegas adelante y atrás.</p>`,
    engine: () => `<p>${code('radar.sector')} (°) y ${code('radar.side')}; ${code('inSector(u, az)')} decide si un azimut se ve. La orientación (${code('u.az')}) se ajusta en la tarjeta de selección. Fuera del sector no hay detección, y un jammer ubicado ahí pega ×0,1.</p>`
  },
  {
    id: 'lobes', group: 'Guerra electrónica', title: 'Lóbulos principal y laterales',
    body: () => `<p>Una antena no concentra toda su energía en el haz principal: también recibe por <b>lóbulos laterales</b>, decenas de dB más débiles. Un jammer alineado con los blancos (en el lóbulo principal) es mucho más efectivo que uno de costado: por eso los aviones de interferencia stand-off se ubican detrás de los atacantes.</p>`,
    engine: () => `<p>${code('jamJ()')} usa una ganancia G = 1 dentro de un ancho de haz (${code('BANDS[b].bw')}), 0,05 (−13 dB) hasta 3 anchos de haz y 0,003 (−25 dB) más afuera; ×0,1 más si el jammer está fuera del sector del radar. Las líneas violeta del mapa ("strobes") muestran qué radar está interferido.</p>`
  },
  {
    id: 'noise', group: 'Guerra electrónica', title: 'Interferencia de ruido',
    body: () => `<p>Un jammer de ruido emite energía en la banda del radar y le sube el piso de ruido: el radar necesita un eco más fuerte para detectar, así que detecta más cerca.</p><p>La señal del jammer viaja de ida (cae con 1/d²) y el eco del blanco, de ida y vuelta (cae con 1/R⁴). Cerca del radar el eco termina ganando: es la distancia de <b>quemado</b> (burn-through).</p>`,
    engine: () => `<p>${code('J = Σ P · G / d²')} sumado sobre los jammers activos de la misma banda con línea de vista, atenuado por el ECCM. El alcance queda ${code("R' = R · (1/(1+J))^¼")}. ${code('P')} es una potencia relativa de juego (los valores reales no son públicos): ${Object.values(JAMMERS).filter(j => j.P).map(j => esc(j.short) + ' ' + j.P.toExponential(0)).join(', ')}. La interferencia también baja la Pk de los misiles guiados por radar: ×1/(1+0,08·J), con un piso de ×0,5.</p>`
  },
  {
    id: 'eccm', group: 'Guerra electrónica', title: 'ECCM (contra-contramedidas)',
    body: () => `<p>Son las técnicas del radar para resistir la interferencia: agilidad de frecuencia, lóbulos laterales bajos, supresión de lóbulos laterales, antenas adaptativas que "apuntan un nulo" al jammer, y modos de seguir al propio jammer (home-on-jam). Los radares modernos AESA resisten mucho más que los soviéticos de los años 70.</p>`,
    engine: () => `<p>${code('radar.eccm')} en dB divide la interferencia por 10^(eccm/10): con 10 dB, el radar sufre una décima parte. Por ejemplo, Patriot ${DEFENSES.patriot.radar.eccm} dB, S-300P ${DEFENSES.s300.radar.eccm} dB y radar VHF ${DEFENSES.p18.radar.eccm} dB. Los sensores acústicos y ópticos son inmunes.</p>`
  },
  {
    id: 'gnss', group: 'Guerra electrónica', title: 'Interferencia y engaño GNSS',
    body: () => `<p>Las señales GPS/GLONASS llegan a la Tierra extremadamente débiles: un transmisor modesto cerca del arma las tapa (<b>interferencia</b>) o las falsifica (<b>engaño</b>, spoofing). Sin satélites, el arma navega solo con su sistema inercial (INS), que acumula error. Las antenas CRPA (como la Kometa de los Shahed) anulan la dirección del jammer, y la navegación por imagen del terreno no depende de los satélites.</p><p>Ucrania usa sobre todo <b>engaño</b> (Pokrova, Lima): el arma no "se pierde", cree estar en otro lugar y se desvía kilómetros. Rusia protege sus bases con supresores como el Pole-21.</p>`,
    engine: () => `<p>Los anti-GNSS (${code('gnssJam')}) no afectan radares y siempre juegan para el defensor: ${Object.values(JAMMERS).filter(j => j.gnssJam).map(j => esc(j.short) + ' ' + j.radius + ' km' + (j.spoofKm ? ' (engaño, ~' + j.spoofKm + ' km)' : '')).join(', ')}. Un arma con ${code('T.gnss')} &lt; 1 que entra en el radio suma un error a su caída: con interferencia, ${code('navErr = (1 − gnss) · (300 + azar·1500) m')}; con engaño, ${code('(1 − gnss) · spoofKm · (0,5 + azar)')} km. Si el desvío supera 2 km, el debrief la cuenta como "perdida localmente". Con ${code('gnss = 1')} (guiado por radar o por terreno) es inmune. Ejemplos: ${['shahed', 'kh101', 'atacms', 'kh22'].map(k => esc(THREATS[k].short) + ' ' + THREATS[k].gnss).join(', ')}.</p>`
  },
  {
    id: 'detect', group: 'Enfrentamiento', title: 'Detección, seguimiento e intercepción',
    body: () => `<p>Son tres pasos distintos. <b>Detectar</b> es que un sensor vea el blanco en un barrido. <b>Seguir</b> es mantener actualizaciones seguidas para conocer su trayectoria. <b>Interceptar</b> exige una solución de tiro, un canal libre, superar el tiempo de reacción y que el interceptor llegue al punto de encuentro antes que el blanco.</p><p>Muchos sistemas detectan lejos pero solo pueden guiar misiles con su radar propio.</p>`,
    engine: () => `<ul><li>Barridos cada ${code('radar.scan')} s; probabilidad de detección según la distancia.</li><li>Pista propia válida si el radar de la batería vio el blanco en los últimos 2 barridos; pista de red válida 12 s (${code('trackOK()')}).</li><li>Los guiados TVM, semiactivo, por mando y los cañones necesitan pista propia; los misiles activos e IR pueden usar la de la red; los drones interceptores, solo la de la red.</li><li>${code('sam.react')}: segundos desde que hay pista hasta el primer disparo.</li><li>${code('solve()')}: busca el primer punto de la trayectoria dentro de la envolvente al que el interceptor llega a tiempo.</li></ul>`
  },
  {
    id: 'pk', group: 'Enfrentamiento', title: 'Pk (probabilidad de derribo)',
    body: () => `<p>Es la probabilidad de que <b>un</b> interceptor que llega al punto de encuentro destruya el blanco. Por eso se dispara en salva: con n interceptores independientes,</p><p class="formula">P(derribo) = 1 − (1 − Pk)ⁿ</p><p>Con Pk 0,7 y 2 misiles: 1 − 0,3² = 0,91.</p><p>Las tasas que publican los gobiernos no son una Pk: mezclan cobertura, munición y saturación (ver "Calibración de Pk" en el Catálogo).</p>`,
    engine: () => `<p>${code('calcPk()')}: Pk base por clase (${Object.keys(CLS_NAME).join(', ')}) desde ${code('sam.pk')}, calibrada contra episodios reales. Se multiplica por la maniobra terminal (${code('T.manPk')}, o ×0,85 contra cañones), por las bengalas contra IR (×0,85), por la baja firma (×0,85 con buscador activo, ×0,75 con guiado desde tierra), por la interferencia y por blancos a más del 80% de ${code('vmaxT')} (×0,8). Tope 0,98.</p>`
  },
  {
    id: 'c2', group: 'Enfrentamiento', title: 'Mando y control: qué tan integrada está la defensa',
    body: () => `<p>Una batería sola ve lo que ve su radar. Integrada en una red, se entera antes de lo que viene, puede disparar con la pista de otro sensor y no le tira a lo que otra batería ya está enfrentando. Cuánto de eso funciona depende del <b>mando y control (C2)</b>: qué red hay, con qué demora llega la información y con qué calidad.</p>
      <p>En Ucrania conviven niveles muy distintos: sistemas occidentales con enlace Link 16 (Patriot, NASAMS), sistemas soviéticos que entran a la imagen aérea nacional mediante "cajas negras" de conversión y unidades que reciben la situación aérea en tabletas (Virazh-Planshet). Del lado ruso, puestos automatizados como Polyana-D4M1 integran brigadas de S-300, Buk, Tor y Pantsir.</p>`,
    engine: () => `<p>El nivel se elige en la pestaña Defensa (${code('S.c2')}) y lo usan ${code('trackOK()')} y ${code('reactionStart()')}:</p>
      <div class="tblwrap"><table class="t"><thead><tr><th>Nivel</th><th>Demora de la red</th><th>Tira con pista ajena</th><th>Reparto de blancos</th></tr></thead><tbody>${Object.values(C2_LEVELS).map(L => `<tr><td>${esc(L.name)}</td><td>${L.share === 'none' ? '—' : L.lag + ' s'}</td><td>${{ none: 'no', cue: 'no (solo alerta)', track: 'activos/IR e interceptores', fire: 'también guiados por radar' }[L.share]}</td><td>${L.deconf ? 'sí' : 'no'}</td></tr>`).join('')}</tbody></table></div>
      <p>"Coordinada" y "desconectada" son el viejo interruptor "red integrada" encendido y apagado. Las demoras son estimaciones de juego. Todavía no se modelan el error de posición de las pistas de red ni los enlaces por sistema (Link 16 vs. red nacional): ver ROADMAP.</p>`
  },
  {
    id: 'saturation', group: 'Enfrentamiento', title: 'Saturación y canales simultáneos',
    body: () => `<p>Cada batería puede guiar un número limitado de interceptores a la vez (<b>canales</b>), tiene una cantidad finita de misiles y necesita tiempo para reaccionar. Las oleadas sincronizadas, los señuelos y los drones baratos buscan justamente eso: llenar los canales y vaciar los cargadores antes de que llegue lo valioso.</p>`,
    engine: () => `<p>${code('sam.ch')} (canales), ${code('sam.mag')} (munición, sin recarga), ${code('u.active')} (interceptores en vuelo). Con red integrada, dos baterías no disparan al mismo blanco. El debrief cuenta los segundos con canales llenos (${code('stats.satChannels')}) y quién se quedó sin munición.</p>`
  },
  {
    id: 'window', group: 'Enfrentamiento', title: 'Alcance teórico vs ventana práctica',
    body: () => {
      const T = THREATS.kh22, s = DEFENSES.irist.sam, dd = T.diveDist, remAlt = dd * Math.min(1, s.altMax / T.cruiseAlt), tw = remAlt * 1000 / T.vDive;
      // mejor caso: batería sobre el blanco, reacción apenas el blanco baja del techo
      const r1 = Math.max(0, remAlt - T.vDive * s.react / 1000), x = r1 * s.vInt / (s.vInt + T.vDive);
      return `<p>El alcance del catálogo es el máximo contra un blanco ideal. La <b>ventana práctica</b> es el tiempo en que, a la vez, el blanco está dentro de la envolvente (alcances mínimo y máximo, piso y techo), está siendo seguido, ya pasó el tiempo de reacción y el interceptor puede llegar antes que él.</p>
      <p>Ejemplo con los datos del motor: un ${esc(T.short)} vuela a ${n(T.cruiseAlt / 1000)} km de altura y pica en los últimos ${dd} km a ${kmh(T.vDive)}. El IRIS-T tiene ${s.maxR} km de alcance, pero su techo es de ${n(s.altMax / 1000)} km y el blanco recién baja de esa altura en los últimos ~${n(remAlt, 1)} km: quedan <b>~${n(tw)} s</b>. Menos ${s.react} s de reacción, y con un interceptor que promedia ${kmh(s.vInt)} contra un blanco a ${kmh(T.vDive)}, en el mejor caso el encuentro sería a ~${n(x, 1)} km. Ahí la Pk contra supersónicos es ${Math.round(s.pk.supersonico * 100)}% y baja otro ×0,8 porque el blanco va cerca del máximo enfrentable (${kmh(s.vmaxT)}). Es una ventana de pocos segundos con poca probabilidad, aunque "el alcance alcance". Coincide con los 3 derribos en más de 400 lanzamientos fuera de la cobertura Patriot.</p>`;
    },
    engine: () => `<p>${code('solve()')} recorre la trayectoria futura del blanco y verifica ${code('minR ≤ r ≤ maxR')} (o ${code('maxRtbm')} para balísticos), ${code('altMin ≤ altura ≤ altMax')} y el tiempo de vuelo del interceptor (${code('vInt')}). ${code('engage()')} descarta además blancos más rápidos que ${code('vmaxT')} y sin línea de vista al punto de encuentro.</p>`
  },
  {
    id: 'damage', group: 'Enfrentamiento', title: 'Daño a objetivos',
    body: () => `<p>Cuando un arma llega, cae con dispersión alrededor del punto apuntado (CEP: el radio que contiene la mitad de los impactos). El daño depende de la ojiva y de la distancia: un impacto dentro de la huella del objetivo es directo; uno cercano hace menos daño, y la distancia de efecto crece con la raíz cúbica de la carga (ley de escala de Hopkinson-Cranz).</p>`,
    engine: () => `<p class="formula">daño = ${DAMAGE.K} · W^${DAMAGE.EXP} · vulnerabilidad · 1/(1 + (d/R50)²),  R50 = ${DAMAGE.R50K} · W^⅓ m</p><p>W = ojiva del catálogo (${code('info.warheadKg')}), d = distancia fuera de la huella. Ejemplos de impacto directo con vulnerabilidad 1: ${['shahed', 'kh101', 'flamingo'].map(k => `${esc(THREATS[k].short)} (${warheadKg(THREATS[k])} kg): ${n(directDamage(THREATS[k]))} HP, R50 ${n(radius50(THREATS[k]))} m`).join(' · ')}. Vida por tipo de objetivo: ${Object.values(TARGET_TYPES).map(t => esc(t.name) + ' ' + t.hp).join(', ')}.</p><div class="warn">Es un modelo de juego, simple y consistente: no representa estructuras, incendios ni penetración.</div>`
  },
  {
    id: 'time', group: 'Enfrentamiento', title: 'Escalas de tiempo y distancia',
    body: () => `<p>1× es tiempo real. Un ${esc(THREATS.shahed.short)} vuela a ${kmh(THREATS.shahed.v)}: tarda ~${n(60 / (THREATS.shahed.v * 3.6) * 60)} minutos en recorrer 60 km. Un ${esc(THREATS.kh101.short)} hace lo mismo en ~${n(60000 / THREATS.kh101.v / 60, 1)} minutos, y un balístico cae desde 300 km en pocos minutos.</p>`,
    engine: () => `<p>El modo <b>Auto</b> comprime el tiempo según la fase: ${Object.values(AUTO_PHASES).map(p => p.speed + '× ' + esc(p.text)).join(', ')}. La simulación avanza en pasos de 0,25 s simulados cualquiera sea la velocidad, así que el resultado no depende de la velocidad elegida.</p>`
  }
];

export const conceptById = id => CONCEPTS.find(c => c.id === id);
