// @ts-check
// Contactos: lo que la defensa sabe de cada amenaza (perspectiva del defensor, docs/ARQUITECTURA.md).
// El motor anota la última detección (th.seen) y la anterior (th.seenPrev); de ahí sale la posición
// estimada por estima (posición + velocidad · edad) mientras la pista sigue viva, y el último reporte
// fechado cuando se pierde. Nunca mira la posición real ni la ruta futura. Anotar no consume azar.
// Del lado del atacante, attackerKnows dice qué unidades de la defensa conoce.
import { D } from '../data/index.js';
import { S } from './state.js';

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

/** Anota una detección en la pista key de th (th.obs: 'u' + id del radar, o la clave de una red; physics/track.js). */
export function noteObs(th, key, t) {
  const p = th.p; if (!p) return;
  const m = th.obs || (th.obs = {}), o = m[key] || (m[key] = { s: null, q: null });
  if (o.s && t - o.s.t > 0.5) o.q = o.s;
  o.s = { x: p.x, y: p.y, z: p.z, t };
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
 *   - desde que su radar emitió por primera vez (u.emitFrom, lo anota el motor; también el AEW): lo
 *     ubica la inteligencia de señales (ELINT); con control de emisiones (u.emcon) puede no emitir nunca;
 *   - si no emitió (sin radar, sensor pasivo o radar en silencio): solo desde su primer disparo
 *     (u.revealed), por el destello y la estela del lanzamiento.
 * No dice si está viva, dañada ni cuánta munición le queda.
 */
export function attackerKnows(u, t) {
  if (attackerPos(u, t)) return true;
  if (u.emitFrom != null && u.emitFrom <= t) return true;
  return u.revealed != null && u.revealed <= t;
}

/**
 * Anota que el atacante ubicó a u en t en su posición actual (emitió o disparó). Solo agrega una entrada
 * cuando la posición cambió: una unidad que se trasladó (sim/mobility.js) vuelve a quedar ubicada recién
 * cuando emite o dispara desde el lugar nuevo.
 */
export function noteFix(u, t) {
  const f = u.fixes || (u.fixes = []), l = f[f.length - 1];
  if (!l || l.x !== u.x || l.y !== u.y) f.push({ t, x: u.x, y: u.y });
}

/** Dónde cree el atacante que está u en t (su última ubicación conocida), o null si no la ubicó. */
export function attackerPos(u, t) {
  let p = null; for (const f of u.fixes || []) if (f.t <= t) p = f;
  return p;
}

/** u como la ve el atacante en t: en su última ubicación conocida, o null si no la ubicó. */
export function asAttackerSees(u, t) {
  if (!attackerKnows(u, t)) return null;
  const p = attackerPos(u, t);
  return p ? { ...u, x: p.x, y: p.y } : u;
}

/** Fase del traslado de u (sim/mobility.js) para mostrar, o null. En la repetición es el nombre. */
export const mobPhaseOf = u => typeof u.mob === 'string' ? u.mob : u.mob?.phase ?? null;

/** ¿El sensor r emite? (los acústicos y ópticos escuchan o miran: son pasivos). */
export const isEmitter = r => !!r && r.band !== 'ACU' && r.band !== 'OPT';

/** Modos de control de emisiones de un radar (u.emcon): sin dato, emite siempre. */
export const EMCON = { siempre: 'Emite siempre', alerta: 'Se enciende con la primera alerta de la red', silencio: 'En silencio (solo pistas de la red)' };

/**
 * ¿Está emitiendo el radar de u en t? (control de emisiones, docs/FISICA.md §6). 'siempre' (o sin dato): sí.
 * 'silencio': nunca; la unidad depende de las pistas de la red. 'alerta': desde la primera alerta que
 * recibe su puesto de mando (la de un sensor de la red; si ninguno avisa, no se enciende). Los sensores
 * pasivos (acústicos, ópticos) no emiten y no se apagan.
 */
export function emitting(u, t) {
  if (u.mob) return false;   // trasladándose (sim/mobility.js): radar plegado
  const m = u.emcon; if (!m || m === 'siempre' || !isEmitter(D(u).radar)) return true;
  if (m === 'silencio') return false;
  if (u.c2 === 'desconectada') return false;   // aislada: no le llegan alertas
  const cp = u.cp || '';
  return S.threats.some(th => { const c = cp ? th.cueCp?.[cp] : th.cueFirst; return c != null && c <= t; });
}
