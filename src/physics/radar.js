// ---------------- RADAR / DETECCIÓN ----------------
// Ecuación del radar simplificada (R ∝ σ^¼), sectores de antena, horizonte e interferencia de ruido.
// Ver docs/FISICA.md §2–§4.
import { BANDS, JAMMERS, D } from '../data/index.js';
import { angDiff, azOf } from '../util/math.js';
import { HORIZON_K } from './constants.js';
import { surf, los } from './terrain.js';
import { rainGamma, rainRange } from './weather.js';
import { slopeAt } from './terrain-analysis.js';
import { clamp } from '../util/math.js';

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
 * wx (data/weather.js, opcional): la lluvia atenúa el radar (physics/weather.js#rainRange) y el
 * clima achica los alcances ópticos (wx.opt) y acústicos (wx.acu). El techo de nubes (wx.ceiling)
 * lo aplican quienes conocen la altura del blanco (sim/engine.js, physics/coverage.js).
 */
export function detR(u, th, J, ca = 1, wx = null) {
  const r = D(u).radar;
  if (r.band === 'ACU') return r.R1 * (wx ? wx.acu : 1);
  if (r.band === 'OPT') return r.R1 * (wx ? wx.opt : 1);
  const R = r.R1 * Math.pow(rcsAt(th.T || th, r.band, ca), 0.25) * Math.pow(1 / (1 + J), 0.25);
  return wx && wx.rain ? rainRange(R, rainGamma(r.band, wx.rain), wx.rainKm) : R;
}

/** ¿El techo de nubes o niebla de wx le tapa a un sensor óptico en tierra un blanco a agl m? */
export const belowCeiling = (r, wx, agl) => !(r.band === 'OPT' && wx && wx.ceiling != null && agl > wx.ceiling);

// ---------------- PROBABILIDAD DE DETECCIÓN (SNR, Swerling 1) ----------------
// El alcance del catálogo (detR) es el de Pd = 50% en un barrido con probabilidad de falsa alarma
// PFA. La relación señal/ruido cae con r⁴: SNR(r) = SNR50 · (R/r)⁴ · pérdidas. Para un blanco que
// "titila" de barrido a barrido (Swerling 1: muchos reflectores parecidos, drones y misiles) la
// probabilidad de detectarlo en un barrido es Pd = PFA^(1/(1+SNR)). Ver docs/FISICA.md §2.

/** Probabilidad de falsa alarma de diseño (valor típico de libro). */
export const PFA = 1e-6;
/** SNR que da Pd = 50% con Swerling 1 y PFA: ln(PFA)/ln(0,5) − 1 ≈ 18,9 (12,8 dB). */
export const SNR50 = Math.log(PFA) / Math.log(0.5) - 1;
/**
 * Más allá de este múltiplo del alcance la Pd por barrido es < 26%: ecos sueltos que no alcanzan para
 * confirmar una pista (regla "M de N" de los extractores de pistas). No se sortea.
 */
export const PD_CUTOFF = 1.2;

/** Pd de un barrido, Swerling 1. */
export const pdSwerling1 = snr => (snr > 0 ? Math.pow(PFA, 1 / (1 + snr)) : 0);

/**
 * Clutter: un blanco a menos de CLUTTER_AGL m sobre el suelo se ve "contra el suelo" y compite con
 * su eco. Pérdida máxima (dB) según el procesamiento del radar (radar.mti): 'none' sin filtro de
 * blancos móviles, 'mti' filtro clásico, 'pd' pulso-Doppler. Escala con lo rasante del blanco y con
 * la rugosidad del suelo (pendiente local; el mar cuenta como moderado). Valores estimados.
 */
export const CLUTTER_DB = { none: 20, mti: 10, pd: 3 };
export const CLUTTER_AGL = 300;
/** Notch Doppler: velocidad radial (m/s) por debajo de la cual el filtro borra el blanco. */
export const NOTCH_MS = { mti: 15, pd: 8 };

export function clutterLossDb(r, agl, x, y) {
  const base = CLUTTER_DB[r.mti]; if (!base || agl >= CLUTTER_AGL) return 0;
  const rough = surf(x, y) <= 0 ? 0.7 : clamp(0.5 + slopeAt(x, y) / 10, 0.5, 1.5);
  return base * rough * (1 - Math.max(0, agl) / CLUTTER_AGL);
}

/** ¿El blanco cae en el notch Doppler del radar? (velocidad radial = |v|·cos del aspecto) */
export function inNotch(r, th, ca) {
  const thr = NOTCH_MS[r.mti], v = th.vel; if (!thr || !v) return false;
  return Math.hypot(v[0], v[1], v[2]) * Math.abs(ca) < thr;
}

/**
 * Pd de un barrido del radar de u contra th a distancia rr (km), con alcance R (detR, ya con
 * interferencia y clima), a agl m sobre el suelo en (x, y) y con aspecto ca.
 */
export function pdScan(u, th, rr, R, agl, x, y, ca) {
  const r = D(u).radar; if (rr > PD_CUTOFF * R) return 0;
  if (r.band !== 'OPT' && r.band !== 'ACU' && inNotch(r, th, ca)) return 0;
  const loss = r.band === 'OPT' || r.band === 'ACU' ? 0 : clutterLossDb(r, agl, x, y);
  return pdSwerling1(SNR50 * Math.pow(R / Math.max(rr, 1e-3), 4) / Math.pow(10, loss / 10));
}

/** Horizonte de radar (km) entre una antena a hr metros y un blanco a ht metros, Tierra 4/3. */
export function horizon(hr, ht) { return HORIZON_K * (Math.sqrt(Math.max(0, hr)) + Math.sqrt(Math.max(0, ht))); }
