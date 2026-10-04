// @ts-check
// Fuente de azar de la simulación. Por defecto usa Math.random; los tests y el modo
// Monte Carlo (sim/montecarlo.js) la reemplazan por un generador con semilla para que las corridas sean reproducibles.
let source = null;

/** Número aleatorio uniforme en [0, 1). */
export const rnd = () => (source || Math.random)();

/** Reemplaza la fuente de azar (null vuelve a Math.random). */
export function setRandom(fn) { source = fn; }

/** Generador con semilla (mulberry32): rápido, 32 bits, suficiente para un juego. */
export function seeded(seed) {
  let s = seed >>> 0;
  return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
