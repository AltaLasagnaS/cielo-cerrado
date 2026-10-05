// @ts-check
// ---------------- ATMÓSFERA ESTÁNDAR (ISA) ----------------
// Densidad del aire relativa al nivel del mar, σ = ρ(h)/ρ0, según la Atmósfera Estándar Internacional
// (ISO 2533; igual a la US Standard Atmosphere 1976 hasta 32 km). Ver docs/FISICA.md §7.
//   troposfera (h ≤ 11 km):  σ = (1 − 2,25577·10⁻⁵·h)^4,2559     (gradiente −6,5 K/km)
//   11–20 km (isoterma 216,65 K):  σ = σ11 · exp(−(h − 11.000) / 6.341,6)
//   20–32 km (+1 K/km):  σ = σ20 · (1 + (h − 20.000)/216.650)^(−35,1632)
// Por encima de 32 km se sigue con la última capa (error de pocos % hasta 40 km).

const S11 = Math.pow(1 - 2.25577e-5 * 11000, 4.2559);
const S20 = S11 * Math.exp(-9000 / 6341.6);

/** Densidad relativa σ (0–1) a h metros sobre el nivel del mar. */
export function isaSigma(h) {
  if (h <= 11000) return Math.pow(1 - 2.25577e-5 * Math.max(h, -500), 4.2559);
  if (h <= 20000) return S11 * Math.exp(-(h - 11000) / 6341.6);
  return S20 * Math.pow(1 + (h - 20000) / 216650, -35.1632);
}
