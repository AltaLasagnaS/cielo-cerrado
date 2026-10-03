// ---------------- RADAR / DETECCIÓN ----------------
// Ecuación del radar simplificada (R ∝ σ^¼), sectores de antena, horizonte e interferencia de ruido.
// Ver docs/FISICA.md §2–§4.
import { BANDS, JAMMERS, JAM_MODES, D, UNIT_DAMAGE } from '../data/index.js';
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

/** Ganancia de los lóbulos laterales (cerca: hasta 3 anchos de haz; lejos: más afuera). */
export const SIDELOBES = { near: 0.05, far: 0.003 };
/** Antena de lóbulos bajos (radar.lowSL): −20 dB cerca y −30 dB lejos. */
export const LOW_SIDELOBES = { near: 0.01, far: 0.001 };
/** Lo que queda de un jammer anulado por un cancelador de lóbulos laterales (−15 dB). */
export const SLC_RESIDUAL = 0.03;

/**
 * J/N de UN jammer de potencia P a dkm km de un radar r, sin relieve (fichas y Academia).
 * lobe: 'main' | 'near' | 'far' (por dónde entra); mg = factor del modo (barrera 1, puntual 10 o 0,1).
 * Aplica los lóbulos del radar, un cancelador si tiene (solo por los laterales) y su eccm.
 */
export function singleJam(r, P, dkm, lobe, mg = 1) {
  const sl = r.lowSL ? LOW_SIDELOBES : SIDELOBES;
  let G = lobe === 'main' ? 1 : sl[lobe];
  if (lobe !== 'main' && r.slc) G *= SLC_RESIDUAL;
  return P * G * mg / ((dkm + 1) ** 2) * Math.pow(10, -(r.eccm || 0) / 10);
}

/** Alcance (km) de un radar contra 1 m² con interferencia J/N = J (distancia de quemado contra ese jammer). */
export const burnThrough = (r, J) => r.R1 * Math.pow(1 / (1 + J), 0.25);

/** Factor del modo del jammer j (data/jammers.js#JAM_MODES) contra el radar r de la unidad u. */
export function modeGain(j, u, r) {
  const M = JAM_MODES[j.mode] || JAM_MODES.barrage; if (!M.agileGain) return M.gain;
  if (j.target !== u.id) return 0;   // ruido puntual: solo en la frecuencia del radar elegido
  return r.agile ? M.agileGain : M.gain;
}

/**
 * Relación interferencia/ruido (J/N, adimensional) que recibe el radar de u mirando hacia az.
 * Suma los interferidores activos de la misma banda con línea de vista:
 *   J = Σ P · G(ángulo) · modo / d²   con G = 1 en el lóbulo principal y la de los lóbulos laterales
 *   (SIDELOBES, o LOW_SIDELOBES si radar.lowSL) hasta 3 anchos de haz y más afuera; ×0,1 extra si el
 *   jammer está fuera del sector. modo = modeGain (barrera o puntual, con agilidad de frecuencia).
 * ECCM (docs/FISICA.md §4): un cancelador de lóbulos laterales (radar.slc = N) anula los N jammers
 * más fuertes que entran por los lóbulos laterales (×SLC_RESIDUAL); contra uno en el lóbulo principal
 * no puede. El resultado se atenúa por el margen ECCM restante del radar (radar.eccm, dB:
 * procesamiento, compresión de pulso, operador).
 * La línea de vista radar-jammer se cachea en j._losMap (depende solo de las posiciones).
 */
export function jamJ(u, az, list) {
  const r = D(u).radar; if (!r || r.band === 'ACU' || r.band === 'OPT') return 0;
  let J = 0; const bw = BANDS[r.band].bw, uz = antZ(u), sl = r.lowSL ? LOW_SIDELOBES : SIDELOBES, side = r.slc ? [] : null;
  for (const j of list) {
    const JJ = JAMMERS[j.type]; if (!j.on || j.dead || JJ.gnssJam || !JJ.bands.includes(r.band)) continue;
    const key = u.id + '|' + u.x.toFixed(2) + '|' + u.y.toFixed(2) + '|' + j.x.toFixed(2) + '|' + j.y.toFixed(2) + '|' + (u.mast || 0) + '|' + (u.alt || 0) + '|' + (j.alt || 0);
    j._losMap = j._losMap || {};
    if (j._losMap[key] === undefined) { const p = jamPos(j); j._losMap[key] = los(p[0], p[1], p[2], u.x, u.y, uz); }
    if (!j._losMap[key]) continue;
    const p = jamPos(j); const dkm = Math.hypot(p[0] - u.x, p[1] - u.y, (p[2] - uz) / 1000) + 1;
    const jaz = azOf(p[0] - u.x, p[1] - u.y), dd = angDiff(jaz, az);
    const main = dd <= bw;
    let G = main ? 1 : dd <= 3 * bw ? sl.near : sl.far;
    if (!inSector(u, jaz)) G *= 0.1;
    const v = JJ.P * G * modeGain(j, u, r) / (dkm * dkm);
    if (side && !main) side.push(v); else J += v;
  }
  if (side) { side.sort((a, b) => b - a); side.forEach((v, k) => { J += k < r.slc ? v * SLC_RESIDUAL : v; }); }
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
 * Un sensor dañado durante la corrida (u.dmgRadar, daño funcional) ve ×UNIT_DAMAGE.radarR.
 */
export function detR(u, th, J, ca = 1, wx = null) {
  const r = D(u).radar, dmg = u.dmgRadar ? UNIT_DAMAGE.radarR : 1;
  if (r.band === 'ACU') return r.R1 * (wx ? wx.acu : 1) * dmg;
  if (r.band === 'OPT') return r.R1 * (wx ? wx.opt : 1) * dmg;
  const R = r.R1 * Math.pow(rcsAt(th.T || th, r.band, ca), 0.25) * Math.pow(1 / (1 + J), 0.25) * dmg;
  return wx && wx.rain ? rainRange(R, rainGamma(r.band, wx.rain), wx.rainKm) : R;
}

/** ¿El techo de nubes o niebla de wx le tapa a un sensor óptico en tierra un blanco a agl m? */
export const belowCeiling = (r, wx, agl) => !(r.band === 'OPT' && wx && wx.ceiling != null && agl > wx.ceiling);

// ---------------- PROBABILIDAD DE DETECCIÓN (SNR, Swerling 1 y 3) ----------------
// El alcance del catálogo (detR) es el de Pd = 50% en un barrido con probabilidad de falsa alarma
// PFA. La relación señal/ruido cae con r⁴: SNR(r) = SNR50 · (R/r)⁴ · pérdidas. La RCS "titila" de
// barrido a barrido; cómo titila depende de la forma (T.swerling, por defecto 1):
//   Swerling 1: muchos reflectores parecidos (drones, misiles de crucero) → Pd = PFA^(1/(1+SNR));
//   Swerling 3: un reflector dominante más otros chicos (balísticos) → fórmula de pdSwerling3.
// Las dos fórmulas son de un pulso con detector de ley cuadrática y están verificadas contra una
// integración numérica independiente en tests/swerling.test.js. Ver docs/FISICA.md §2.

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

/** Umbral de detección con el ruido normalizado a 1: T = −ln(PFA) ≈ 13,8. */
export const THRESH = -Math.log(PFA);
/**
 * Pd de un barrido, Swerling 3 (RCS con distribución χ² de 4 grados de libertad):
 *   Pd = (1 + 2·SNR·T / (2 + SNR)²) · exp(−2T / (2 + SNR))
 * Contra Swerling 1 con la misma SNR media: algo peor con señal débil, bastante mejor con señal
 * fuerte (titila menos: es raro que el reflector dominante "desaparezca").
 */
export const pdSwerling3 = snr => (snr > 0 ? (1 + 2 * snr * THRESH / ((2 + snr) ** 2)) * Math.exp(-2 * THRESH / (2 + snr)) : 0);

/** SNR que da Pd = 50% con Swerling 3 y PFA (bisección; ≈15,7, 12,0 dB). */
export const SNR50_3 = (() => { let lo = 0.1, hi = 1000; for (let k = 0; k < 100; k++) { const m = (lo + hi) / 2; if (pdSwerling3(m) < 0.5) lo = m; else hi = m; } return (lo + hi) / 2; })();

/** Modelo de fluctuación de la amenaza (1 o 3). */
export const swerlingOf = th => ((th.T || th).swerling === 3 ? 3 : 1);

/** Pd de un barrido para el modelo m (1 o 3) con SNR relativa k = SNR / SNR50 (k = 1 → 50%). */
export const pdRel = (m, k) => (m === 3 ? pdSwerling3(SNR50_3 * k) : pdSwerling1(SNR50 * k));

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
  return pdRel(swerlingOf(th), Math.pow(R / Math.max(rr, 1e-3), 4) / Math.pow(10, loss / 10));
}

/** Horizonte de radar (km) entre una antena a hr metros y un blanco a ht metros, Tierra 4/3. */
export function horizon(hr, ht) { return HORIZON_K * (Math.sqrt(Math.max(0, hr)) + Math.sqrt(Math.max(0, ht))); }
