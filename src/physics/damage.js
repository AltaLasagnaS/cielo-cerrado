// ---------------- DAÑO ----------------
// Modelo simple y parametrizable: más ojiva → más daño y mayor radio; impacto directo → daño
// completo; impacto cercano → daño que cae con el cuadrado de la distancia escalada.
// Ver data/targets.js (parámetros) y docs/FISICA.md §10.
import { TARGET_TYPES, DAMAGE, DAMAGED_AT } from '../data/targets.js';

/** Ojiva en kg de una amenaza (dato del catálogo, con su rango y fuentes en UNC). */
export const warheadKg = T => T.info?.warheadKg ?? 0;

/** Daño de un impacto directo de T contra un objetivo de vulnerabilidad 1. */
export const directDamage = T => DAMAGE.K * Math.pow(warheadKg(T), DAMAGE.EXP) * (T.dmgMult ?? 1);

/** Distancia (m) a la que el daño cae a la mitad. */
export const radius50 = T => DAMAGE.R50K * Math.cbrt(warheadKg(T));

/**
 * Daño que causa T al caer a dist metros del centro de un objetivo de tipo type (clave de
 * TARGET_TYPES, o un objeto { radius, vuln } como data/targets.js#UNIT_TARGET).
 * → { dmg, factor, edge } con edge = distancia fuera de la huella (0 = impacto directo).
 */
export function damageAt(T, type, dist) {
  const tt = typeof type === 'string' ? TARGET_TYPES[type] : type, W = warheadKg(T);
  if (!W || !tt) return { dmg: 0, factor: 0, edge: dist };
  const edge = Math.max(0, dist - tt.radius);
  const factor = 1 / (1 + (edge / radius50(T)) ** 2);
  if (factor < DAMAGE.CUTOFF) return { dmg: 0, factor: 0, edge };
  return { dmg: directDamage(T) * tt.vuln * factor, factor, edge };
}

/** Estado según la vida restante: 'operational' | 'damaged' | 'destroyed'. */
export function targetStatus(hp, maxHp) {
  if (hp <= 0) return 'destroyed';
  return (maxHp - hp) / maxHp >= DAMAGED_AT ? 'damaged' : 'operational';
}
