// ===================== CATÁLOGO =====================
// Punto de entrada único a los datos del juego. Todo lo demás importa desde acá.
//
// Revisión OSINT oct-2026. Cada parámetro numérico relevante tiene un rango en UNC
// {min, p (probable), max, c (confianza), src, nota}. El valor "p" es el que usa la simulación:
// applyProbable() lo escribe sobre THREATS/DEFENSES/JAMMERS al importar este módulo.
// min/max los usa el modo Monte Carlo (applySample, ver sim/montecarlo.js).
// RCS y Pk siguen siendo estimaciones: no hay mediciones públicas confiables (ver notas de cada parámetro).
import { THREATS } from './threats.js';
import { DEFENSES } from './defenses.js';
import { JAMMERS } from './jammers.js';
import { UNC } from './uncertainty.js';

export { WP, SRC, S_, SRC_REF } from './sources.js';
export { BANDS } from './bands.js';
export { CLS_NAME, THREATS } from './threats.js';
export { OBS } from './observed.js';
export { DEFENSES } from './defenses.js';
export { JAMMERS } from './jammers.js';
export { U, PL, RCS_NOTE, VHF_NOTE, PK_NOTE, UNC } from './uncertainty.js';
export { CAL } from './calibration.js';
export { SCENARIOS } from './scenarios.js';
export { C2_LEVELS, C2_DEFAULT, c2FromNet } from './c2.js';
export { TARGET_TYPES, TARGET_STATUS, DAMAGED_AT, DAMAGE } from './targets.js';
export { TERRAIN } from './terrain/index.js';

/** Ficha de catálogo de una unidad desplegada (u.type → DEFENSES[u.type]). */
export const D = u => DEFENSES[u.type];

/** Lee una propiedad anidada por ruta con puntos ('sam.pk.dron'). */
export function getPath(o, path) { return path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o); }
/** Escribe una propiedad anidada por ruta con puntos, creando los objetos intermedios. */
export function setPath(o, path, v) { const ks = path.split('.'); let a = o; for (let i = 0; i < ks.length - 1; i++) { if (a[ks[i]] == null) a[ks[i]] = {}; a = a[ks[i]]; } a[ks[ks.length - 1]] = v; }

/** Qué catálogo corresponde a cada sección de UNC. */
export const CAT_OF = { thr: THREATS, def: DEFENSES, jam: JAMMERS };

/** Escribe el valor probable (u.p) de cada parámetro con incertidumbre sobre el catálogo. */
export function applyProbable() {
  for (const [kind, set] of Object.entries(UNC)) for (const [k, params] of Object.entries(set)) {
    const obj = CAT_OF[kind][k]; if (!obj) continue;
    for (const [path, u] of Object.entries(params)) {
      if (path === 'alt' && kind === 'def') { obj.alt = u.p; continue; }
      setPath(obj, path, u.p);
    }
  }
}

/**
 * Muestreo triangular (min, moda = probable, max) de un parámetro con incertidumbre.
 * La usa el modo Monte Carlo (sim/montecarlo.js) a través de applySample.
 */
export function sampleU(u, rng = Math.random) {
  const a = u.min, b = u.max, c = u.p; if (b <= a) return c;
  const r = rng(), f = (c - a) / (b - a);
  return r < f ? a + Math.sqrt(r * (b - a) * (c - a)) : b - Math.sqrt((1 - r) * (b - a) * (b - c));
}

/** Sortea todos los parámetros del catálogo dentro de su rango (los enteros se redondean). */
export function applySample(rng = Math.random) {
  for (const [kind, set] of Object.entries(UNC)) for (const [k, params] of Object.entries(set)) {
    const obj = CAT_OF[kind][k]; if (!obj) continue;
    for (const [path, u] of Object.entries(params)) { if (path.startsWith('info.')) continue; let v = sampleU(u, rng); if (/(\.ch|\.mag|decoys)$/.test(path)) v = Math.round(v); setPath(obj, path, v); }
  }
}

applyProbable();
