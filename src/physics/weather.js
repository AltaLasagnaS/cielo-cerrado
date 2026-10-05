// @ts-check
// ---------------- CLIMA ----------------
// Atenuación del radar por lluvia (Rec. ITU-R P.838-3) y su efecto en el alcance de detección.
// Ver docs/FISICA.md §2 ("Clima") y data/weather.js.
import { BANDS, ENV } from '../data/index.js';

// Constantes de la Rec. ITU-R P.838-3 (2005) para polarización horizontal: k y α en función de la
// frecuencia f (GHz), válidas de 1 a 1.000 GHz. γ = k · R^α  (dB/km, R en mm/h).
const KH = { a: [-5.33980, -0.35351, -0.23789, -0.94158], b: [-0.10008, 1.2697, 0.86036, 0.64552], c: [1.13098, 0.454, 0.15354, 0.16817], m: -0.18961, k: 0.71147 };
const AH = { a: [-0.14318, 0.29591, 0.32177, -5.37610, 16.1721], b: [1.82442, 0.77564, 0.63773, -0.96230, -3.29980], c: [-0.55187, 0.19822, 0.13164, 1.47828, 3.4399], m: 0.67849, k: -1.95537 };
const gauss = (lf, T) => T.a.reduce((s, a, j) => s + a * Math.exp(-(((lf - T.b[j]) / T.c[j]) ** 2)), 0);

/** Coeficientes [k, α] de P.838-3 a f GHz (polarización horizontal, haz casi horizontal). */
export function rainCoef(f) {
  const lf = Math.log10(f);
  return [Math.pow(10, gauss(lf, KH) + KH.m * lf + KH.k), gauss(lf, AH) + AH.m * lf + AH.k];
}

/** Atenuación específica de ida (dB/km) en la banda con lluvia de R mm/h. Debajo de 1 GHz se toma 0. */
export function rainGamma(band, R) {
  const f = BANDS[band]?.ghz; if (!R || !f || f < 1) return 0;
  const [k, a] = rainCoef(f); return k * Math.pow(R, a);
}

/**
 * Alcance con lluvia. Sin lluvia el radar llega a R0; con atenuación de ida γ (dB/km) sobre un camino
 * de hasta L km dentro de la lluvia, la ecuación del radar (R⁴ ∝ señal) pide:
 *   R⁴ · 10^(2γ·min(R, L)/10) = R0⁴   →   R = R0 · 10^(−γ·min(R, L)/20)
 * Si el resultado supera L, la pérdida es fija (todo el camino de lluvia); si no, se resuelve
 * ln R + c·R = ln R0 (c = γ·ln10/20) con Newton, que converge en pocas vueltas.
 */
export function rainRange(R0, gamma, L) {
  if (!(gamma > 0) || !(L > 0) || !(R0 > 0)) return R0;
  const Rf = R0 * Math.pow(10, -gamma * L / 20); if (Rf >= L) return Rf;
  const c = gamma * Math.LN10 / 20, l0 = Math.log(R0);
  let R = Math.min(R0, L);
  for (let i = 0; i < 8; i++) R -= (Math.log(R) + c * R - l0) / (1 / R + c);
  return R;
}

/**
 * Cómo crece el viento por encima de la capa límite: cociente entre la norma del viento medio a cada
 * altura y la de 1 km, de la climatología de radiosondeos de Kiev (NOAA IGRA v2.2, estación UPM00033345,
 * 00 UTC, 1991–2020, 337 meses; cálculo de docs/investigacion/datos-fisica-clima.md): 2,52 m/s a 1 km,
 * 4,75 a 3 km, 6,67 a 5 km y 10,90 a 10 km. Es la norma del vector medio, no la velocidad media (los
 * vientos opuestos se cancelan): sirve para la FORMA del perfil, no para su valor.
 */
const ALOFT = [[1000, 1], [3000, 4.753 / 2.519], [5000, 6.669 / 2.519], [10000, 10.900 / 2.519]];
const aloft = h => {
  if (h <= ALOFT[0][0]) return 1;
  for (let i = 1; i < ALOFT.length; i++) if (h <= ALOFT[i][0]) { const [h0, r0] = ALOFT[i - 1], [h1, r1] = ALOFT[i]; return r0 + (r1 - r0) * (h - h0) / (h1 - h0); }
  return ALOFT[ALOFT.length - 1][1];
};

/**
 * Viento a h metros sobre el suelo a partir del de superficie v10 (a 10 m, el que dan los partes): ley de
 * potencia v(h) = v10 · (h/10)^α hasta el tope de la capa límite (ENV.modelo.windTop); más arriba sigue
 * creciendo con la forma del perfil de Kiev (ALOFT) y desde 10 km queda constante. Con α = 1/7, a 1.000 m
 * sopla ≈1,9 veces más que en superficie, y a 3.000 m ≈3,6 veces. Ver docs/FISICA.md §5.
 */
export function windAt(v10, h) {
  const M = ENV.modelo, top = M.windTop;
  const bl = v10 * Math.pow(Math.min(Math.max(h, 10), top) / 10, M.windAlpha);
  return h <= top ? bl : bl * aloft(h) / aloft(top);
}

/**
 * Atenuación específica de nubes y niebla (ITU-R P.840-9, anexo 1, ec. 2–10; aproximación de Rayleigh para
 * gotas chicas de agua líquida): γ = K_l(f, T) · ρ_l, en dB/km, con f en GHz, T en kelvin y ρ_l en g/m³.
 * Verificada contra la tabla calculada de docs/investigacion/datos-fisica-clima.md (0 °C).
 */
export function cloudKl(f, T = 273.15) {
  const th = 300 / T - 1, e0 = 77.66 + 103.3 * th, e1 = 0.0671 * e0, e2 = 3.52;
  const fp = 20.20 - 146 * th + 316 * th * th, fs = 39.8 * fp;
  const re = (e0 - e1) / (1 + (f / fp) ** 2) + (e1 - e2) / (1 + (f / fs) ** 2) + e2;
  const im = f * (e0 - e1) / (fp * (1 + (f / fp) ** 2)) + f * (e1 - e2) / (fs * (1 + (f / fs) ** 2));
  const eta = (2 + re) / im;
  return 0.819 * f / (im * (1 + eta * eta));
}

/** Atenuación de ida (dB/km) por niebla de lwc g/m³ en la banda (0 debajo de 1 GHz, fuera del dominio de P.840). */
export function fogGamma(band, lwc) {
  const f = BANDS[band]?.ghz; if (!lwc || !f || f < 1) return 0;
  return cloudKl(f) * lwc;
}

/**
 * Reflectividad de volumen de la nieve η (m²/m³) con s mm/h de agua equivalente y longitud de onda λ (m):
 * Rayleigh como la lluvia, con la reflectividad equivalente de Sekhon y Srivastava (1970), la que usa el
 * servicio meteorológico de Canadá: Zes = 1780·s^2,23 con el factor dieléctrico del hielo; con el del
 * agua (convención del radar) Ze = Zes − 6,5 dB. η = π⁵·0,93·Ze·10⁻¹⁸ / λ⁴.
 */
export const snowEta = (s, lambda) => (s > 0 ? Math.pow(Math.PI, 5) * 0.93 * 1780 * Math.pow(s, 2.23) * Math.pow(10, -0.65) * 1e-18 / Math.pow(lambda, 4) : 0);
