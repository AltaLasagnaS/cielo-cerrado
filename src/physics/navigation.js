// ---------------- NAVEGACIÓN BAJO GUERRA ELECTRÓNICA GNSS ----------------
// Error de navegación de un arma que entra en el radio de un anti-GNSS. Ver docs/FISICA.md §4 (GNSS).
//
//   1. Sin satélite, el arma sigue con su inercial: error = (1 − gnss)·(300 + U·1.500) m.
//   2. Engaño (spoofing, J.spoofKm): la arrastra hacia una posición falsa, (1 − gnss)·spoofKm·(0,5 + U) km,
//      SALVO que tenga una corrección independiente del satélite (T.navFix: correlación del terreno u
//      óptica) o un enlace de datos activo (link: módem 4G/mesh o Starlink, el operador ve dónde está
//      de verdad). Esas armas descartan el engaño y siguen como en 1.
//   3. Buscador terminal (T.seekerKm): si el error queda dentro de lo que el buscador alcanza a revisar
//      al final, encuentra el blanco con probabilidad SEEKER_ACQ y el error se anula.
// Cada llamada consume un número al azar, y uno más solo si el buscador entra en juego (reproducibilidad).
import { rnd } from '../util/rng.js';

/** Probabilidad de que el buscador terminal reconozca el blanco si el error está dentro de su alcance (est). */
export const SEEKER_ACQ = 0.9;

/**
 * T: amenaza del catálogo · J: anti-GNSS del catálogo · link: el arma tiene enlace de datos activo.
 * → { err (m), spoofed: el engaño la arrastró, rejected: descartó el engaño, corrected: el buscador la corrigió }
 */
export function gnssNavError(T, J, link = false) {
  const dep = 1 - T.gnss, u = rnd();
  const fix = !!(T.navFix || link);
  const rejected = !!(J.spoofKm && fix);
  const spoofed = !!(J.spoofKm && !fix);
  let err = dep * (spoofed ? J.spoofKm * 1000 * (0.5 + u) : 300 + u * 1500);
  let corrected = false;
  if (err > 0 && T.seekerKm && err <= T.seekerKm * 1000 && rnd() < SEEKER_ACQ) { err = 0; corrected = true; }
  return { err, spoofed, rejected, corrected };
}
