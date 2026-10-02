// ---------------- ENFRENTAMIENTO ----------------
// Seguimiento, solución de tiro y probabilidad de derribo (Pk). Ver docs/FISICA.md §6–§7.
import { D } from '../data/index.js';
import { azOf, clamp } from '../util/math.js';
import { surf } from './terrain.js';
import { jamJ } from './radar.js';
import { posAt, speedAt, termZone } from './kinematics.js';

/** Guiados que necesitan que el radar PROPIO de la batería vea el blanco hasta el final. */
export const RADAR_GUID = ['TVM', 'SARH', 'mando', 'cañón'];

/** ¿El blanco es balístico o hipersónico (usa el alcance anti-TBM de la defensa)? */
export const isTBM = th => th.cls === 'balistico' || th.cls === 'hiper';

/**
 * ¿La unidad u tiene una pista utilizable de th en el instante t?
 * - Pista propia: su radar la vio en los últimos 2 barridos (+0,6 s).
 * - Pista de red: algún sensor la vio en los últimos 12 s y la red integrada está activa (net).
 * Guiado por radar propio exige pista propia; drones interceptores (operador) usan la de red;
 * misiles activos/IR aceptan cualquiera de las dos.
 */
export function trackOK(u, th, t, net) {
  const d = D(u), own = d.radar ? (t - (th.det[u.id] ?? -1e9)) <= d.radar.scan * 2 + 0.6 : false;
  const netT = net && (t - th.lastNet) <= 12;
  if (RADAR_GUID.includes(d.sam.guid)) return own;
  if (d.sam.guid === 'operador') return netT;
  return own || netT;
}

/**
 * Busca el primer punto de intercepción posible: recorre la trayectoria futura del blanco
 * (pasos de 0,5 s hasta 30 s y luego de 2 s, hasta 400 s) y devuelve el primer instante tau en que
 * el blanco está dentro de la envolvente (alcance, alcance mínimo, piso y techo) y el interceptor,
 * volando a sam.vInt en línea recta, llega a tiempo (con ≤ 3 s de holgura).
 * → { tau (s desde t), p (posición del blanco), r (km) } o null.
 */
export function solve(u, th, t) {
  const sm = D(u).sam, tbm = isTBM(th);
  const maxR = tbm ? sm.maxRtbm : sm.maxR; const lz = surf(u.x, u.y) + 2;
  const tEnd = th.tLaunch + th.ft - 0.5;
  let tau = 0.5;
  while (t + tau < tEnd && tau < 400) {
    const p = posAt(th, t + tau); if (!p) break;
    const dh = Math.hypot(p.x - u.x, p.y - u.y), r = Math.hypot(dh, (p.z - lz) / 1000);
    const agl = p.z - surf(p.x, p.y);
    if (r <= maxR && r >= sm.minR && agl >= sm.altMin && p.z <= sm.altMax) {
      const tf = r * 1000 / sm.vInt;
      if (tf <= tau) return (tau - tf <= 3) ? { tau, p, r } : null;
    }
    tau += tau < 30 ? 0.5 : 2;
  }
  return null;
}

/**
 * Probabilidad de derribo de un interceptor de u contra th en el instante t:
 *   Pk = Pk_base[clase] × modificadores, acotada a [0, 0,98]
 * Modificadores: maniobra terminal (×manPk del blanco, ×0,85 contra cañones), bengalas contra IR
 * (×0,85), baja firma (×0,85 buscador activo, ×0,75 guiado desde tierra), interferencia sobre el
 * radar de la batería (×1/(1+0,08·J), mín. ×0,5) y blanco a más del 80% de vmaxT (×0,8).
 * jams = interferidores activos de la corrida.
 */
export function calcPk(u, th, t, jams) {
  const sm = D(u).sam; let pk = sm.pk[th.cls] || 0;
  const p = th.p; if (!p) return 0;
  if (th.maneuver && p.rem < termZone(th)) pk *= sm.guid === 'cañón' ? 0.85 : (th.T.manPk ?? 0.7);
  if (th.T.ir && (sm.guid === 'IR')) pk *= 0.85;
  if (th.T.lo && sm.guid !== 'IR' && sm.guid !== 'cañón') pk *= sm.guid === 'activo' ? 0.85 : 0.75;
  if (RADAR_GUID.includes(sm.guid) || sm.guid === 'activo') { const J = jamJ(u, azOf(p.x - u.x, p.y - u.y), jams); if (J > 1) pk *= Math.max(0.5, 1 / (1 + 0.08 * J)); }
  const v = speedAt(th, t); if (v > 0.8 * sm.vmaxT) pk *= 0.8;
  return clamp(pk, 0, 0.98);
}
