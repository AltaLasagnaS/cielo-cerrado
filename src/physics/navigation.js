// @ts-check
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

// ---------------- ANTENA CRPA CONTRA VARIAS FUENTES ----------------
// Una antena CRPA (Controlled Reception Pattern Antenna, como la "Kometa" rusa) de N elementos puede
// apuntar un "nulo" de su diagrama hacia cada interferidor: anula hasta N − 1 fuentes que lleguen desde
// direcciones distintas. Con más fuentes, el arma pierde el GNSS. Dos estaciones casi en la misma
// dirección (menos de CRPA_SEP_DEG vistas desde el arma) caen en el mismo nulo y cuentan como una.
// Ver docs/FISICA.md §4 (CRPA).

/** Separación angular mínima (°) para que dos fuentes ocupen nulos distintos (estimación de juego). */
export const CRPA_SEP_DEG = 10;

/** Cantidad de interferidores que una CRPA de n elementos puede anular (0 si no tiene CRPA). */
export const crpaNulls = n => Math.max(0, (n || 0) - 1);

/**
 * Direcciones distintas de las fuentes que cubren el punto (x, y): agrupa los acimuts (°) que
 * caen a menos de CRPA_SEP_DEG entre sí. srcs = [{ x, y }] (km). → cantidad de direcciones.
 */
export function distinctDirections(x, y, srcs) {
  const az = srcs.map(s => (Math.atan2(s.x - x, -(s.y - y)) * 180 / Math.PI + 360) % 360).sort((a, b) => a - b);
  if (az.length <= 1) return az.length;
  let n = 1;
  for (let i = 1; i < az.length; i++) if (az[i] - az[i - 1] >= CRPA_SEP_DEG) n++;
  if (n > 1 && az[0] + 360 - az[az.length - 1] < CRPA_SEP_DEG) n--;   // el primero y el último, del otro lado del norte
  return n;
}

/** ¿Una CRPA de n elementos pierde el GNSS frente a srcs fuentes vistas desde (x, y)? */
export const crpaOverwhelmed = (n, x, y, srcs) => srcs.length > 0 && distinctDirections(x, y, srcs) > crpaNulls(n);
