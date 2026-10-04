// ---------------- AMENAZAS: CINEMÁTICA ----------------
// Las amenazas siguen una ruta poligonal en planta con velocidad constante por fase. La altura sale
// del perfil de vuelo (T.prof). No se integran fuerzas: es un modelo cinemático guiado por datos,
// suficiente para tiempos de vuelo, geometría de intercepción y horizonte de radar. Ver docs/FISICA.md §5.
//
// Perfiles (T.prof):
//   drone     altura fija sobre el terreno (mira 0,4–0,9 km adelante), picada en los últimos 2 km
//   cruise    rasante siguiendo el relieve (mira hasta 1,5 km adelante), baja al blanco en 0,5 km
//   bunt      rasante y "pop-up" de 1.500 m entre 8 y 3 km del blanco, luego picada (Storm Shadow)
//   ballistic parábola con apogeo T.apogee (km), lanzado desde fuera del mapa
//   highdive  crucero alto (T.cruiseAlt) y picada final en los últimos T.diveDist km
//   hilo      crucero alto, transición entre 60 y 40 km del blanco y tramo final rasante
//   glide     bomba planeadora: se suelta fuera del mapa a T.cruiseAlt y baja sin motor hasta el blanco,
//             primero suave y al final más empinada: z = suelo + (cruiseAlt − suelo)·(rem/L)^0,7
import { THREATS } from '../data/index.js';
import { clamp } from '../util/math.js';
import { nextId } from '../util/ids.js';
import { rnd } from '../util/rng.js';
import { surf } from './terrain.js';

/** Perfiles que se lanzan desde fuera del mapa: la ruta es solo dirección + blanco. */
export const OFFMAP_PROFILES = ['ballistic', 'highdive', 'hilo', 'glide'];
export const isOffmap = T => OFFMAP_PROFILES.includes(T.prof);

/**
 * Crea la amenaza número k de la salva sv, lanzada en el instante tLaunch (s).
 * Precalcula la ruta (pts), las distancias acumuladas (cum, km), el largo total (L, km) y las
 * fases de velocidad (ph: tramos [s0, s1] km a v m/s que empiezan en t0 s). ft = tiempo de vuelo.
 */
export function buildThreat(sv, k, tLaunch) {
  const T = THREATS[sv.type];
  let pts = sv.pts.map(p => [p[0], p[1]]);
  const offmap = isOffmap(T);
  if (offmap) { const tg = pts[pts.length - 1], a = pts[0]; const dx = a[0] - tg[0], dy = a[1] - tg[1], n = Math.hypot(dx, dy) || 1; const L = sv.launchDist || T.launchDist; pts = [[tg[0] + dx / n * L, tg[1] + dy / n * L], tg]; }
  // dispersión lateral entre misiles de la misma salva (no apilar)
  if (sv.count > 1 && !offmap) { const sp = (k - (sv.count - 1) / 2) * 0.25; pts = pts.map((p, i) => i === 0 || i === pts.length - 1 ? p : [p[0] + sp, p[1] + sp * 0.5]); if (pts.length > 1) { pts[0] = [pts[0][0] + sp, pts[0][1] - sp]; } }
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[cum.length - 1];
  let ph;
  if (T.prof === 'highdive') ph = [[0, Math.max(0, L - T.diveDist), T.v], [Math.max(0, L - T.diveDist), L, T.vDive]];
  else if (T.prof === 'hilo') ph = [[0, Math.max(0, L - 60), T.v], [Math.max(0, L - 60), L, T.vLow]];
  else ph = [[0, L, T.v]];
  let acc = 0; ph = ph.map(p => { const o = { s0: p[0], s1: p[1], v: p[2], t0: acc }; acc += (p[1] - p[0]) * 1000 / p[2]; return o; });
  const tg = pts[pts.length - 1];
  return {
    id: nextId(), type: sv.type, T, sv: sv.id, n: k + 1, tLaunch, pts, cum, L, ph, ft: acc, gT: surf(tg[0], tg[1]),
    agl: sv.agl ?? T.agl, maneuver: !!sv.maneuver, link: !!(sv.link && T.datalink), crpa: sv.crpa ?? 0, decoyRel: sv.decoys ? (T.decoys || 0) : 0, released: false,
    alive: false, done: false, det: {}, net: {}, lastNet: -1e9, firstDet: null, cueFirst: null, netFirst: null, clsT: 0, clsTau: null, clsAs: null, trail: [], navErr: 0, gnssHit: false,
    targetUnit: sv.targetUnit ?? null, targetObj: sv.targetObj ?? null, cls: T.cls, isDecoy: !!T.decoy, phase: rnd() * 6.28
  };
}

/** Distancia recorrida (km) a los tau segundos del lanzamiento. Pasado el final devuelve L + ε. */
export function sAt(th, tau) {
  if (tau <= 0) return 0;
  for (const p of th.ph) { const dur = (p.s1 - p.s0) * 1000 / p.v; if (tau <= p.t0 + dur) return p.s0 + (tau - p.t0) * p.v / 1000; }
  return th.L + 1e-6;
}

/** Punto de la ruta a s km del inicio → [x, y, ux, uy] (posición y dirección unitaria del tramo). */
export function xyAt(th, s) {
  const c = th.cum, P = th.pts; let i = 1; while (i < c.length - 1 && c[i] < s) i++;
  const seg = c[i] - c[i - 1] || 1e-6, f = clamp((s - c[i - 1]) / seg, 0, 1);
  const dx = P[i][0] - P[i - 1][0], dy = P[i][1] - P[i - 1][1];
  return [P[i - 1][0] + dx * f, P[i - 1][1] + dy * f, dx / seg, dy / seg];
}

/** Distancia al blanco (km) a partir de la cual empieza la maniobra terminal. */
export const termZone = th => ({ ballistic: 25, hilo: 15, highdive: 15 }[th.T.prof] || 10);

/**
 * Posición de la amenaza en el instante Tm (s de simulación) → { x, y (km), z (m s.n.m.), s, rem (km) }
 * o null si ya llegó al blanco. Incluye la maniobra evasiva terminal (senoide lateral).
 */
export function posAt(th, Tm) {
  if (th.parent) return decoyPos(th, Tm);
  const tau = Tm - th.tLaunch; const s = sAt(th, tau); if (s >= th.L) return null;
  let [x, y, ux, uy] = xyAt(th, s); const T = th.T, L = th.L, rem = L - s;
  if (th.maneuver && rem < termZone(th)) { const A = T.prof === 'ballistic' ? 0.4 : 0.15; const off = A * Math.sin(2 * Math.PI * (rem / 5) + th.phase) * Math.min(1, rem / 1.5); x += -uy * off; y += ux * off; }
  let z;
  const ahead = (k) => { let m = 0; for (const d of k) { const q = xyAt(th, Math.min(L, s + d)); m = Math.max(m, surf(q[0], q[1])); } return m; };
  switch (T.prof) {
    case 'drone': { const base = ahead([0, 0.4, 0.9]) + th.agl; z = rem < 2 ? th.gT + (base - th.gT) * rem / 2 : base; break; }
    case 'cruise': { const base = ahead([0, 0.4, 0.8, 1.5]) + th.agl; z = rem < 0.5 ? th.gT + (base - th.gT) * rem / 0.5 : base; break; }
    case 'bunt': { const base = ahead([0, 0.4, 0.8, 1.5]) + th.agl; if (rem > 8) z = base; else if (rem > 3) z = base + (8 - rem) / 5 * 1500; else z = th.gT + (base + 1500 - th.gT) * rem / 3; break; }
    case 'ballistic': { const f = s / L; z = 4 * T.apogee * 1000 * f * (1 - f) + th.gT * f; break; }
    case 'highdive': { const dd = Math.min(T.diveDist, L); z = rem > dd ? T.cruiseAlt : th.gT + (T.cruiseAlt - th.gT) * rem / dd; break; }
    case 'glide': { z = th.gT + (T.cruiseAlt - th.gT) * Math.pow(rem / L, 0.7); break; }
    case 'hilo': { const low = ahead([0, 0.5, 1]) + th.agl; z = rem > 60 ? T.cruiseAlt : rem > 40 ? low + (T.cruiseAlt - low) * (rem - 40) / 20 : low; break; }
  }
  return { x, y, z, s, rem };
}

/** Posición de un señuelo: se abre desde su misil padre hasta un desvío fijo y sube hasta 300 m. */
export function decoyPos(th, Tm) {
  const p = posAt(th.parent, Tm); if (!p) { // el padre ya impactó: el señuelo sigue un instante
    return null;
  }
  const f = clamp((th.parent.L - p.rem - th.sRel) / Math.max(1, th.parent.L - th.sRel), 0, 1);
  return { x: p.x + th.off[0] * f, y: p.y + th.off[1] * f, z: p.z + 300 * f, s: p.s, rem: p.rem };
}

/** Velocidad 3D (m/s) por diferencia centrada de ±0,5 s; si no hay datos, la de la última fase. */
export function speedAt(th, Tm) { const a = posAt(th, Tm - 0.5), b = posAt(th, Tm + 0.5); if (!a || !b) return th.T.vDive || th.T.vLow || th.T.v; return Math.hypot((b.x - a.x) * 1000, (b.y - a.y) * 1000, b.z - a.z); }
