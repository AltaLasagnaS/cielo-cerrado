// @ts-check
// ---------------- PISTA OBSERVADA ----------------
// Lo que la defensa sabe del movimiento de una amenaza: las dos últimas detecciones (th.seen y
// th.seenPrev, las anota sim/contacts.js#noteSeen). De ahí sale la velocidad medida y la posición
// extrapolada en línea recta, que usan el contacto del mapa y la solución de tiro (physics/engagement.js#solve).
// Ver docs/FISICA.md §6 ("Tiro sin omnisciencia"). Nunca mira la posición real ni la ruta futura.
import { surf } from './terrain.js';

/** Hueco máximo (s) entre dos detecciones para medir la velocidad: más viejo, la pista se reinicia. */
export const VEL_GAP = 12;
/** Altura mínima (m sobre el terreno) de un punto extrapolado: una pista que baja no se predice bajo tierra. */
export const PRED_FLOOR = 5;

/**
 * Velocidad medida entre las dos últimas detecciones de th:
 *   { s (última detección), vx, vy (km/s), vAgl (m/s, cambio de altura sobre el terreno), v (m/s) } o
 *   null si hay una sola o están separadas más de VEL_GAP (sin velocidad no hay predicción).
 * La altura se extrapola sobre el terreno y no sobre el mar: un crucero que sigue el relieve mantiene su
 * altura AGL; uno en picada la pierde.
 */
export function trackVel(th) {
  const s = th.seen, q = th.seenPrev; if (!s || !q) return null;
  const dt = s.t - q.t; if (!(dt > 0) || dt > VEL_GAP) return null;
  const vx = (s.x - q.x) / dt, vy = (s.y - q.y) / dt;
  const vAgl = ((s.z - surf(s.x, s.y)) - (q.z - surf(q.x, q.y))) / dt;
  return { s, vx, vy, vAgl, v: Math.hypot(vx * 1000, vy * 1000, (s.z - q.z) / dt) };
}

/**
 * Posición predicha de th en el instante tt a partir de la pista (velocidad constante en línea recta,
 * altura AGL con su ritmo medido, nunca debajo de PRED_FLOOR). vel = trackVel(th), o null.
 * → { x, y, z, agl } o null.
 */
export function predictAt(vel, tt) {
  if (!vel) return null;
  const { s } = vel, k = tt - s.t, x = s.x + vel.vx * k, y = s.y + vel.vy * k;
  const g = surf(x, y), agl = Math.max(PRED_FLOOR, s.z - surf(s.x, s.y) + vel.vAgl * k);
  return { x, y, z: g + agl, agl };
}
