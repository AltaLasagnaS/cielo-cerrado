// @ts-check
// ---------------- CLASIFICACIÓN DE SEÑUELOS ----------------
// Un radar de tiro (bandas con BANDS[b].decoyTau) que sigue una pista aprende con el tiempo si es
// un arma o un señuelo: por cómo se mueve, cómo cambia su eco y cómo frena. La probabilidad de haberla
// clasificado tras t segundos de seguimiento acumulado es 1 − exp(−t/τ), con τ = decoyTau de la banda
// × la dificultad del blanco (DECOY_HARD: los señuelos del Iskander acompañan al misil y cuestan
// mucho más que un Gerbera de espuma). Con probabilidad MISCLASS un arma real se toma por señuelo.
//
// Para no alterar la secuencia de números al azar (ni los resultados de siempre), el umbral de cada
// pista sale de th.phase, que ya se sorteó al crear el arma. Ver docs/FISICA.md §6.
import { BANDS } from '../data/index.js';

/** Dificultad relativa: señuelos que acompañan a un balístico (se separan en la fase final). */
export const DECOY_HARD = 4;
/** Probabilidad de tomar un arma real por señuelo (est). */
export const MISCLASS = 0.03;

const frac = x => x - Math.floor(x);

/**
 * τ de clasificación de un radar (s): el de su banda dividido por radar.discrim, la capacidad propia de
 * discriminación (un radar de arreglo de fase con modos dedicados clasifica más rápido que uno genérico
 * de la misma banda). Sin discrim, ×1.
 */
export const classifyTau = r => BANDS[r.band].decoyTau / (r.discrim || 1);

/** Segundos de seguimiento que suma un barrido de este radar a la clasificación (0 si no clasifica). */
export const classifyGain = r => (BANDS[r.band]?.decoyTau ? r.scan : 0);

/**
 * Estado de clasificación de la pista th tras th.clsT segundos de seguimiento con radares de tiro.
 * τ efectivo: el promedio de las bandas no se guarda; se usa el τ más rápido que la siguió (th.clsTau).
 * → null (sin clasificar), 'arma' o 'señuelo'.
 */
export function classify(th) {
  if (!th.clsT || !th.clsTau) return null;
  const tau = th.clsTau * (th.isDecoyChild ? DECOY_HARD : 1);
  const u = frac(th.phase * 977.13);                         // umbral uniforme, fijo para cada pista
  if (1 - Math.exp(-th.clsT / tau) < u) return null;
  if (th.isDecoy) return 'señuelo';
  return frac(th.phase * 7919.7) < MISCLASS ? 'señuelo' : 'arma';
}
