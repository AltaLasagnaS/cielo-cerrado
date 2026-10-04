// @ts-check
// ---------------- CLIMA ----------------
// Atenuación del radar por lluvia (Rec. ITU-R P.838-3) y su efecto en el alcance de detección.
// Ver docs/FISICA.md §2 ("Clima") y data/weather.js.
import { BANDS } from '../data/index.js';

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
