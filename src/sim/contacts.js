// @ts-check
// Contactos: lo que la defensa sabe de cada amenaza (perspectiva del defensor, docs/ARQUITECTURA.md).
// El motor anota la última detección (th.seen) y la anterior (th.seenPrev); de ahí sale la posición
// estimada por estima (posición + velocidad · edad) mientras la pista sigue viva, y el último reporte
// fechado cuando se pierde. Nunca mira la posición real ni la ruta futura. Anotar no consume azar.
// Del lado del atacante, attackerKnows dice qué unidades de la defensa conoce.
import { D } from '../data/index.js';

/** Edad máxima (s) de una pista que se sigue dibujando como viva (la misma ventana de la red). */
export const TRACK_AGE = 12;
/** Edad máxima (s) de un contacto perdido que se sigue mostrando como "último reporte". */
export const LOST_AGE = 90;

/** Anota una detección de la defensa (sim/engine.js). */
export function noteSeen(th, t, by) {
  const p = th.p; if (!p) return;
  if (th.seen && t - th.seen.t > 0.5) th.seenPrev = th.seen;
  th.seen = { x: p.x, y: p.y, z: p.z, t, by };
}

/**
 * Contacto de la defensa sobre th en el instante t:
 *   { x, y, z (estimados), vx, vy (km/s), v (m/s), age (s), lost (bool), by } o null si nunca se vio o
 *   el último reporte es más viejo que LOST_AGE. La velocidad sale de las dos últimas detecciones.
 */
export function contactOf(th, t) {
  const s = th.seen; if (!s) return null;
  const age = t - s.t; if (age < 0 || age > LOST_AGE) return null;
  const q = th.seenPrev, dt = q ? s.t - q.t : 0;
  const vx = dt > 0 ? (s.x - q.x) / dt : 0, vy = dt > 0 ? (s.y - q.y) / dt : 0, vz = dt > 0 ? (s.z - q.z) / dt : 0;
  const lost = age > TRACK_AGE || !th.alive;
  const k = lost ? 0 : age;   // pista viva: estima; perdida: queda donde se la vio por última vez
  return { x: s.x + vx * k, y: s.y + vy * k, z: s.z + vz * k, vx, vy, v: Math.hypot(vx, vy) * 1000, age, lost, by: s.by };
}

/**
 * ¿Sabe el atacante dónde está la unidad u en t? (vista del atacante, docs/ARQUITECTURA.md)
 *   - con radar que emite (no acústico ni óptico, también el AEW): sí, lo ubica la inteligencia de
 *     señales (ELINT) por su emisión; no se modela el control de emisiones;
 *   - sin radar emisor (cañones y MANPADS sin radar propio, sensores pasivos): solo desde su primer
 *     disparo (u.revealed, lo anota el motor), por el destello y la estela del lanzamiento.
 * No dice si está viva, dañada ni cuánta munición le queda.
 */
export function attackerKnows(u, t) {
  const r = D(u).radar;
  if (r && r.band !== 'ACU' && r.band !== 'OPT') return true;
  return u.revealed != null && u.revealed <= t;
}
