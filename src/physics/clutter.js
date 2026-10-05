// @ts-check
// ---------------- CLUTTER ----------------
// Eco del suelo, del mar y de la lluvia que compite con el blanco en su misma celda de resolución.
// Ver docs/FISICA.md §2 ("Clutter") y data/clutter.js (parámetros con rango y fuentes en UNC.clu).
//
// El blanco y el clutter salen de la misma ecuación del radar, así que su cociente no depende de la
// potencia: SCR = σ_blanco / C, con C la RCS del clutter de la celda que sobrevive al filtro:
//   superficie  C = σ° · A · g²(Δ) / I        A = 0,75 · ΔR · R · θaz / cos ψ
//   lluvia      C = η · V / I                  V = 0,567 · ΔR · R² · θaz · θel
// ΔR resolución en distancia, R distancia, θ anchos de haz (rad), ψ ángulo rasante. 0,75 y 0,567 =
// π/(8·ln2) integran un haz gaussiano (de ida y vuelta) en lugar de uno rectangular.
// g²(Δ): ganancia de ida y vuelta hacia la superficie que está Δ = agl / R radianes debajo del blanco
// (el haz apunta al blanco). Más allá de 1,5 anchos de haz el suelo entra por lóbulos laterales a
// −50 dB o menos y se desprecia.
//   σ° suelo: σ°F⁴ de Billingsley a ángulos rasantes (≈ −30 dB, ya incluye la propagación), ± relieve.
//   σ° mar:   modelo NRL 2012 (Gregers-Hansen y Mital) según banda, ángulo rasante y estado del mar.
//   η lluvia: 6·10⁻¹⁴ · r^1,6 / λ⁴ (m⁻¹; Barton): Rayleigh con Z = 200·r^1,6 (Marshall–Palmer).
//   η nieve: physics/weather.js#snowEta (Sekhon y Srivastava). La nieve seca casi no atenúa microondas.
// I (factor de mejora): sin filtro 1; MTI con cancelador doble contra un espectro gaussiano
// I = 2·(PRF / (2π·σf))⁴, σf = 2·σv/λ, con techo mtiCap; pulso-Doppler pdCap.
import { BANDS, CLUTTER } from '../data/index.js';
import { surf, los, MAP } from './terrain.js';
import { slopeAt } from './terrain-analysis.js';
import { LOS_MARGIN } from './constants.js';
import { snowEta } from './weather.js';
import { clamp } from '../util/math.js';

const DEG = Math.PI / 180;
/** Radio efectivo de la Tierra (m) con refracción estándar (4/3). */
const KA = 4 / 3 * 6371e3;
/** Integrales de un haz gaussiano de ida y vuelta: en azimut √(π/(8·ln2)) ≈ 0,75; en volumen π/(8·ln2). */
const AZ_INT = 0.75, VOL_INT = Math.PI / (8 * Math.LN2);
/** Lluvia: hasta qué altura llena el haz (m). Por encima de la isoterma de 0 °C hay nieve y casi no refleja. */
export const RAIN_TOP = 3000;
/** Más allá de este múltiplo del ancho de haz en elevación el suelo ya no está en el lóbulo principal. */
const BEAM_EDGE = 1.5;

/**
 * Visibilidad del suelo desde una antena: el rayo tiene que llegar a lo que devuelve el eco (árboles,
 * edificios), apenas por encima del margen de la línea de vista (LOS_MARGIN). Cacheada por celda de 200 m y por mapa (el relieve no cambia en la corrida). */
let SEEN = new Map(), SEEN_MAP = null;
function landSeen(ux, uy, uz, x, y, zs) {
  if (SEEN_MAP !== MAP) { SEEN = new Map(); SEEN_MAP = MAP; }
  const key = ux.toFixed(2) + ',' + uy.toFixed(2) + ',' + uz.toFixed(0) + ',' + Math.round(x * 5) + ',' + Math.round(y * 5);
  let v = SEEN.get(key);
  if (v === undefined) { if (SEEN.size > 200000) SEEN.clear(); v = los(ux, uy, uz, x, y, zs + LOS_MARGIN + 1); SEEN.set(key, v); }
  return v;
}

/** Coeficientes del modelo NRL (polarización H y V): los del listado del apéndice B del informe (fig. 22). */
const NRL = { H: [-73.0, 20.781, 7.351, 25.65, 0.0054], V: [-50.796, 25.93, 0.7093, 21.588, 0.00211] };

/**
 * Reflectividad del mar σ° (dB) según el modelo NRL 2012: f en GHz, ψ en grados, estado del mar ss
 * (Douglas, 0–6). Ajustado entre 0,1° y 60° y entre 0,5 y 35 GHz; por debajo de 0,1° se extrapola
 * (sigue bajando con log sin ψ, como mide el modelo cerca de su borde).
 */
export function seaSigma0Db(f, psiDeg, ss, pol = 'H') {
  const [c1, c2, c3, c4, c5] = NRL[pol] || NRL.H, p = psiDeg;
  return c1 + c2 * Math.log10(Math.sin(p * DEG)) + (27.5 + c3 * p) * Math.log10(f) / (1 + 0.95 * p)
    + c4 * Math.pow(ss + 1, 1 / (2 + 0.085 * p + 0.033 * ss)) + c5 * p * p;
}

/** Reflectividad de volumen de la lluvia η (m²/m³) a r mm/h con longitud de onda λ (m). */
export const rainEta = (r, lambda) => (r > 0 ? 6e-14 * Math.pow(r, 1.6) / Math.pow(lambda, 4) : 0);

/** PRF (Hz) del radar r: la suya, o la de alcance sin ambigüedad ruK·R1. */
export const prfOf = r => r.prf || 3e8 / (2 * CLUTTER.modelo.ruK * r.R1 * 1000);

/**
 * Factor de mejora (lineal) del procesamiento del radar r contra clutter con dispersión de velocidad
 * sv (m/s). Sin filtro: 1. MTI: cancelador doble contra espectro gaussiano, con techo. Pulso-Doppler:
 * el techo de su banco de filtros (los blancos lentos ya los borra el notch, physics/radar.js#inNotch).
 */
export function improvement(r, sv) {
  const M = CLUTTER.modelo;
  if (r.mti === 'pd') return Math.pow(10, M.pdCap / 10);
  if (r.mti !== 'mti') return 1;
  const lambda = 0.3 / BANDS[r.band].ghz, sf = 2 * sv / lambda;
  return Math.min(Math.pow(10, M.mtiCap / 10), 2 * Math.pow(prfOf(r) / (2 * Math.PI * sf), 4));
}

/**
 * RCS (m²) del clutter que queda después del filtro, en la celda de un blanco a rr km (distancia
 * oblicua) y agl m sobre la superficie en (x, y), visto por el radar r con antena en (ux, uy) a uz m
 * sobre el nivel del mar. wx: clima (data/weather.js): rain mm/h y sea (estado del mar).
 * → { surface, rain } por separado (para explicar y probar), en m².
 */
export function clutterRcs(r, ux, uy, uz, rr, agl, x, y, wx) {
  const out = { surface: 0, rain: 0 }, B = BANDS[r.band]; if (!B?.ghz) return out;
  const M = CLUTTER.modelo, R = Math.max(rr, 0.05) * 1000, dR = r.res || M.res;
  const thAz = B.bw * DEG, thEl = (r.bwEl || B.bw) * DEG, lambda = 0.3 / B.ghz;
  // superficie: solo si la superficie bajo el blanco cae en el lóbulo principal y el radar la ve
  const delta = Math.max(0, agl) / R;
  if (delta < BEAM_EDGE * thEl) {
    const zs = surf(x, y), sea = zs <= 0;
    const dh = Math.hypot(x - ux, y - uy) * 1000;
    const psi = Math.atan2(uz - Math.max(zs, 0), Math.max(dh, 1)) - dh / (2 * KA);   // rasante sobre Tierra 4/3
    const seen = sea ? psi > 0 : landSeen(ux, uy, uz, x, y, zs);
    if (seen) {
      const g2 = Math.exp(-8 * Math.LN2 * (delta / thEl) ** 2);
      const A = AZ_INT * dR * R * thAz / Math.cos(Math.min(Math.abs(psi), 1.2));
      let s0;
      if (sea) s0 = Math.pow(10, seaSigma0Db(Math.min(35, Math.max(0.5, B.ghz)), Math.max(psi, 1e-4) / DEG, wx?.sea ?? 2, r.pol || 'H') / 10);   // fuera de 0,5–35 GHz (VHF) se usa el borde del ajuste
      else {
        const rough = clamp(0.5 + slopeAt(x, y) / 10, 0.5, 1.5);   // 0,5 llano … 1,5 quebrado (como el modelo anterior)
        s0 = Math.pow(10, (M.landDb + 2 * M.reliefDb * (rough - 1)) / 10);
      }
      out.surface = s0 * A * g2 / improvement(r, sea ? M.seaSv : M.landSv);
    }
  }
  // lluvia o nieve: llenan el haz hasta RAIN_TOP; el blanco está dentro si vuela debajo
  const rain = wx?.rain || 0, snow = wx?.snow || 0, zt = Math.max(0, surf(x, y)) + Math.max(0, agl);
  if ((rain > 0 || snow > 0) && zt < RAIN_TOP) {
    const fill = Math.min(1, RAIN_TOP / Math.max(1, R * thEl));
    out.rain = (rainEta(rain, lambda) + snowEta(snow, lambda)) * VOL_INT * dR * R * R * thAz * thEl * fill / improvement(r, M.rainSv);
  }
  return out;
}
