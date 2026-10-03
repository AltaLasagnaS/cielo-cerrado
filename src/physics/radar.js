// ---------------- RADAR / DETECCIÓN ----------------
// Ecuación del radar simplificada (R ∝ σ^¼), sectores de antena, horizonte e interferencia de ruido.
// Ver docs/FISICA.md §2–§4.
import { BANDS, JAMMERS, D } from '../data/index.js';
import { angDiff, azOf } from '../util/math.js';
import { HORIZON_K } from './constants.js';
import { surf, los } from './terrain.js';

/**
 * RCS (m²) de una amenaza en una banda, vista con aspecto ca (ver aspectFactor; 1 = de frente).
 * th.rcs = frontal en X/S; las reglas por banda están en data/bands.js (BANDS[band].rcs) y se
 * aplican sobre el frente; después se multiplica por el factor de aspecto. Ver docs/FISICA.md §3.
 */
export function rcsAt(th, band, ca = 1) {
  return rcsFront(th, band) * aspectFactor(th, band, ca);
}

/** RCS frontal en la banda (reglas de BANDS[band].rcs). */
function rcsFront(th, band) {
  const b = th.rcs, m = BANDS[band]?.rcs;
  if (!m) return b;
  if (m.own && th[m.own] != null) return th[m.own];
  if (m.lo && th.lo) return b * m.lo;
  if (m.dron && th.cls === 'dron') return b * m.dron;
  if (m.smallBelow && b < m.smallBelow) return b * m.small;
  return b * (m.other ?? 1);
}

/**
 * Cuánto cambia la RCS respecto del frente según el aspecto. ca = coseno del ángulo θ entre la
 * velocidad del blanco y la línea blanco → radar: 1 de frente, 0 de costado, −1 de cola.
 * Interpola en decibeles (la RCS cambia órdenes de magnitud):
 *   ln σ(θ) = cos²θ · ln σ_frente|cola + sin²θ · ln σ_costado
 * con rcsSide y rcsRear del catálogo (si faltan, valen lo mismo que el frente). En bandas bajas
 * (BANDS[band].low: VHF, L) el contraste se reduce a la mitad en dB: cerca de la resonancia la
 * forma pesa menos.
 */
export function aspectFactor(th, band, ca = 1) {
  if (!(ca < 1)) return 1;
  const f = th.rcs, side = th.rcsSide ?? f, rear = th.rcsRear ?? f, c2 = ca * ca;
  const ln = c2 * (ca >= 0 ? 0 : Math.log(rear / f)) + (1 - c2) * Math.log(side / f);
  return Math.exp(BANDS[band]?.low ? ln / 2 : ln);
}

/**
 * Coseno del aspecto con que el radar (en ux, uy km; uz m) ve a la amenaza th: usa th.vel, la
 * velocidad 3D (m/s) que guarda la simulación en cada paso. Sin velocidad conocida → 1 (frente).
 */
export function aspectCos(th, ux, uy, uz) {
  const v = th.vel, p = th.p; if (!v || !p) return 1;
  const lx = (ux - p.x) * 1000, ly = (uy - p.y) * 1000, lz = uz - p.z;
  const nv = Math.hypot(v[0], v[1], v[2]), nl = Math.hypot(lx, ly, lz);
  if (nv < 1e-6 || nl < 1e-6) return 1;
  return Math.max(-1, Math.min(1, (v[0] * lx + v[1] * ly + v[2] * lz) / (nv * nl)));
}

/** Altura de la antena sobre el nivel del mar (m): terreno + mástil, o altitud de vuelo si es AEW. */
export function antZ(u) { const d = D(u); if (d.kind === 'aew') return u.alt; return surf(u.x, u.y) + (u.mast ?? (d.radar ? d.radar.mast : 2)); }

/**
 * ¿El azimut az cae dentro del sector que barre el radar de u?
 * Radares de antena lateral (AEW tipo Erieye) ven dos sectores a ±90° del rumbo.
 */
export function inSector(u, az) {
  const r = D(u).radar; if (!r || r.sector >= 360) return true;
  if (r.side) { return angDiff(az, (u.az + 90) % 360) <= r.sector / 2 || angDiff(az, (u.az + 270) % 360) <= r.sector / 2; }
  return angDiff(az, u.az) <= r.sector / 2;
}

/** Posición [x km, y km, z m] de la antena de un interferidor. */
export function jamPos(j) { const J = JAMMERS[j.type]; return [j.x, j.y, J.air ? j.alt : surf(j.x, j.y) + J.mast]; }

/**
 * Relación interferencia/ruido (J/N, adimensional) que recibe el radar de u mirando hacia az.
 * Suma los interferidores activos de la misma banda con línea de vista:
 *   J = Σ P · G(ángulo) / d²   con G = 1 en el lóbulo principal, 0,05 en los primeros lóbulos
 *   laterales (≤ 3 anchos de haz) y 0,003 fuera; ×0,1 extra si el jammer está fuera del sector.
 * El resultado se atenúa por el margen ECCM del radar (dB).
 * La línea de vista radar-jammer se cachea en j._losMap (depende solo de las posiciones).
 */
export function jamJ(u, az, list) {
  const r = D(u).radar; if (!r || r.band === 'ACU' || r.band === 'OPT') return 0;
  let J = 0; const bw = BANDS[r.band].bw, uz = antZ(u);
  for (const j of list) {
    const JJ = JAMMERS[j.type]; if (!j.on || j.dead || JJ.gnssJam || !JJ.bands.includes(r.band)) continue;
    const key = u.id + '|' + u.x.toFixed(2) + '|' + u.y.toFixed(2) + '|' + j.x.toFixed(2) + '|' + j.y.toFixed(2) + '|' + (u.mast || 0) + '|' + (u.alt || 0) + '|' + (j.alt || 0);
    j._losMap = j._losMap || {};
    if (j._losMap[key] === undefined) { const p = jamPos(j); j._losMap[key] = los(p[0], p[1], p[2], u.x, u.y, uz); }
    if (!j._losMap[key]) continue;
    const p = jamPos(j); const dkm = Math.hypot(p[0] - u.x, p[1] - u.y, (p[2] - uz) / 1000) + 1;
    const jaz = azOf(p[0] - u.x, p[1] - u.y), dd = angDiff(jaz, az);
    let G = dd <= bw ? 1 : dd <= 3 * bw ? 0.05 : 0.003;
    if (!inSector(u, jaz)) G *= 0.1;
    J += JJ.P * G / (dkm * dkm);
  }
  return J * Math.pow(10, -(r.eccm || 0) / 10);
}

/**
 * Alcance de detección (km) del radar de u contra la amenaza th con interferencia J/N = J, vista
 * con aspecto ca (1 = de frente, el peor caso, que usan la cobertura y las fichas):
 *   R = R1 · σ(banda, aspecto)^¼ · (1 / (1 + J))^¼
 * R1 es el alcance contra 1 m². Sensores acústicos y ópticos usan R1 fijo (no dependen del RCS).
 */
export function detR(u, th, J, ca = 1) {
  const r = D(u).radar; if (r.band === 'ACU' || r.band === 'OPT') return r.R1;
  return r.R1 * Math.pow(rcsAt(th.T || th, r.band, ca), 0.25) * Math.pow(1 / (1 + J), 0.25);
}

/** Horizonte de radar (km) entre una antena a hr metros y un blanco a ht metros, Tierra 4/3. */
export function horizon(hr, ht) { return HORIZON_K * (Math.sqrt(Math.max(0, hr)) + Math.sqrt(Math.max(0, ht))); }
