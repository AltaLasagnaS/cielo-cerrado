// @ts-check
// ---------------- UBICACIÓN DE INTERFERIDORES (TRIANGULACIÓN) ----------------
// Un radar interferido ve la dirección del jammer (el "strobe"), pero no la distancia. Dos radares que
// comparten sus marcaciones por la red lo ubican donde se cruzan. Ver docs/FISICA.md §4.
//   error angular de cada marcación (monopulso):  σθ = θ3 / (km · √(2·J/N)),  km ≈ 1,6
//   error de la posición:  e = √((d1·σ1)² + (d2·σ2)²) / sin Δ     (Δ = ángulo entre las marcaciones)
// Con marcaciones casi paralelas (Δ chico) el cruce se estira y el error crece sin límite.

/** J/N mínima para que un radar marque la dirección de un jammer (0 dB). */
export const STROBE_J = 1;
/** Ángulo mínimo entre dos marcaciones para aceptar el cruce (°). Est: por debajo el cruce es una franja. */
export const MIN_CROSS = 10;
/** Error máximo (km) para dar al jammer por ubicado (alcanza para guiar un misil a mitad de camino). Est. */
export const FIX_MAX_KM = 5;
/** Pendiente del monopulso (km ≈ 1,6; Skolnik, Introduction to Radar Systems). */
const KM = 1.6;
/** Piso del error angular (°): calibración, desalineación y propagación. Est. */
const SIGMA_MIN = 0.05;

/** Error angular (°) de la marcación de un radar con haz bwDeg sobre un jammer que le llega con J/N = J. */
export const bearingSigma = (bwDeg, J) => Math.max(SIGMA_MIN, bwDeg / (KM * Math.sqrt(2 * Math.max(J, 1e-9))));

/**
 * Error (km) del cruce de dos marcaciones: a y b = { x, y (km), sigma (°) } desde cada radar hacia el
 * jammer en (jx, jy). Infinity si las marcaciones forman menos de MIN_CROSS grados.
 */
export function fixError(a, b, jx, jy) {
  const ax = jx - a.x, ay = jy - a.y, bx = jx - b.x, by = jy - b.y;
  const d1 = Math.hypot(ax, ay), d2 = Math.hypot(bx, by); if (d1 < 1e-6 || d2 < 1e-6) return 0;
  const sin = Math.abs(ax * by - ay * bx) / (d1 * d2);
  if (sin < Math.sin(MIN_CROSS * Math.PI / 180)) return Infinity;
  const r = Math.PI / 180;
  return Math.hypot(d1 * a.sigma * r, d2 * b.sigma * r) / sin;
}
