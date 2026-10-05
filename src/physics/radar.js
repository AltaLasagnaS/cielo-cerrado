// @ts-check
// ---------------- RADAR / DETECCIÓN ----------------
// Ecuación del radar simplificada (R ∝ σ^¼), sectores de antena, horizonte e interferencia de ruido.
// Ver docs/FISICA.md §2–§4.
import { BANDS, JAMMERS, JAM_MODES, D, UNIT_DAMAGE } from '../data/index.js';
import { angDiff, azOf } from '../util/math.js';
import { HORIZON_K } from './constants.js';
import { surf, los } from './terrain.js';
import { rainGamma, rainRange, fogGamma } from './weather.js';
import { PFA, noncoherentPd, integratedSnr50 } from './pulse-integration.js';
import { clutterRcs } from './clutter.js';

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
    const JJ = JAMMERS[j.type]; if (!j.on || j.dead || JJ.gnssJam || !JJ.bands.includes(r.band) || JAM_MODES[j.mode]?.coherent) continue;
    // Un interferidor de un bando no degrada sus propios radares. `both` queda reservado para
    // equipos cuyo rol puede cambiar; no asumimos fratricidio como efecto normal.
    if (JJ.side !== 'both' && D(u).side !== 'both' && JJ.side === D(u).side) continue;
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
 * Relación de una copia DRFM del jammer j con el ruido del radar de u (sin eccm): P / d². Positiva si el
 * jammer está en el sector del radar (le entra por el lóbulo principal al barrer), negativa si está fuera
 * (solo podría entrar por los laterales), null sin línea de vista. uz: altura de la antena.
 */
export function drfmJ(u, j, uz = antZ(u)) {
  const p = jamPos(j); if (!los(p[0], p[1], p[2], u.x, u.y, uz)) return null;
  const d = Math.hypot(p[0] - u.x, p[1] - u.y, (p[2] - uz) / 1000) + 1, J = JAMMERS[j.type].P / (d * d);
  return inSector(u, azOf(p[0] - u.x, p[1] - u.y)) ? J : -J;
}

/**
 * Falsos blancos que los interferidores DRFM (modo 'drfm', data/jammers.js#JAM_MODES) le meten por barrido
 * al radar de u. Una copia coherente recibe toda la ganancia de procesamiento, así que su relación con el
 * ruido es J = P · G / d² sin el descuento de eccm, y el radar la toma por un blanco si J ≥ SNR50:
 *   lóbulo principal (el haz pasa por el jammer si está en su sector): G = 1;
 *   lóbulos laterales cercanos: G = SIDELOBES.near (o LOW_SIDELOBES), salvo blanqueo (radar.slb).
 * Cada jammer que pasa el umbral suma JAM_MODES.drfm.falseTargets. El cancelador (slc) no sirve: está
 * hecho para ruido continuo, no para pulsos sueltos.
 */
export function falseTracks(u, list) {
  const r = D(u).radar; if (!r || r.band === 'ACU' || r.band === 'OPT') return 0;
  const M = JAM_MODES.drfm, uz = antZ(u), sl = r.lowSL ? LOW_SIDELOBES : SIDELOBES; let n = 0;
  for (const j of list) {
    const JJ = JAMMERS[j.type]; if (j.mode !== 'drfm' || !j.on || j.dead || JJ.gnssJam || !JJ.bands.includes(r.band)) continue;
    if (JJ.side !== 'both' && D(u).side !== 'both' && JJ.side === D(u).side) continue;
    const base = drfmJ(u, j, uz); if (base === null) continue;
    const main = base > 0 && base >= SNR50;
    const side = !r.slb && Math.abs(base) * sl.near >= SNR50;
    if (main || side) n += M.falseTargets;
  }
  return n;
}

/**
 * Alcance de detección (km) del radar de u contra la amenaza th con interferencia J/N = J, vista
 * con aspecto ca (1 = de frente, el peor caso, que usan la cobertura y las fichas):
 *   R = R1 · σ(banda, aspecto)^¼ · (1 / (1 + J))^¼
 * R1 es el alcance contra 1 m². Sensores acústicos y ópticos usan R1 fijo (no dependen del RCS).
 * wx (data/weather.js, opcional): la lluvia y la niebla atenúan el radar (physics/weather.js#rainRange) y el
 * clima achica los alcances ópticos (wx.opt) y acústicos (wx.acu). El techo de nubes (wx.ceiling)
 * lo aplican quienes conocen la altura del blanco (sim/engine.js, physics/coverage.js).
 * Un sensor dañado durante la corrida (u.dmgRadar, daño funcional) ve ×UNIT_DAMAGE.radarR.
 */
export function detR(u, th, J, ca = 1, wx = null) {
  const r = D(u).radar, dmg = u.dmgRadar ? UNIT_DAMAGE.radarR : 1;
  if (r.band === 'ACU') return r.R1 * (wx ? wx.acu : 1) * dmg;
  if (r.band === 'OPT') return r.R1 * (wx ? wx.opt : 1) * dmg;
  const R = r.R1 * Math.pow(rcsAt(th.T || th, r.band, ca), 0.25) * Math.pow(1 / (1 + J), 0.25) * dmg;
  const Rr = wx && wx.rain ? rainRange(R, rainGamma(r.band, wx.rain), wx.rainKm) : R;
  return wx && wx.lwc ? rainRange(Rr, fogGamma(r.band, wx.lwc), wx.fogKm) : Rr;   // niebla (ITU-R P.840): casi nada
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
// Opcional: radar.integrationPulses > 1 usa la suma no coherente de potencias para Swerling lento.
// El catálogo actual no asigna N por falta de datos; ausencia conserva la aproximación anterior.

/** Probabilidad de falsa alarma de diseño (valor típico de libro). */
export { PFA } from './pulse-integration.js';
/** SNR que da Pd = 50% con Swerling 1 y PFA: ln(PFA)/ln(0,5) − 1 ≈ 18,9 (12,8 dB). */
export const SNR50 = Math.log(PFA) / Math.log(0.5) - 1;
/**
 * Confirmación de pistas "M de N" (extractor de pistas): un radar abre una pista nueva cuando detecta el
 * blanco en TRACK_M de sus últimos TRACK_N barridos; una pista abierta se mantiene con una detección por
 * barrido (sim/engine.js#trackScan). Los sensores ópticos y acústicos confirman con un solo contacto.
 */
export const TRACK_M = 2, TRACK_N = 3;
/**
 * Corte de RENDIMIENTO (no físico): más allá de este múltiplo del alcance la Pd por barrido es menor que
 * 10⁻⁴ (Swerling 1) y no vale la pena calcular interferencia ni sortear.
 */
export const PD_CUTOFF = 2.5;

/** ¿Una historia de barridos (bits, el más nuevo en el bit 0) alcanza para abrir una pista? */
export const confirms = bits => { let n = 0; for (let k = 0; k < TRACK_N; k++) n += (bits >> k) & 1; return n >= TRACK_M; };

/**
 * Historia de barridos de un radar contra un blanco (bits, el más nuevo en el bit 0) después de un barrido
 * en t con resultado hit. last = hora del barrido anterior que lo sorteó (undefined si es el primero). Los
 * barridos del medio en que no se sorteó (fuera del sector, más allá de PD_CUTOFF) cuentan como "no visto".
 */
export function scanHistory(bits, last, t, scan, hit) {
  const shift = last === undefined ? 1 : Math.min(TRACK_N, Math.max(1, Math.round((t - last) / scan)));
  return ((bits << shift) | (hit ? 1 : 0)) & ((1 << TRACK_N) - 1);
}

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

/**
 * Pd con SNR relativa k; el alcance publicado conserva Pd=50% (k=1).
 * N=1 mantiene exactamente el modelo anterior. N>1 cambia la curva, sin aplicar otra ganancia
 * de alcance: R1 ya incluye el procesamiento. Ver docs/FISICA.md §2.
 */
export const pdRel = (m, k, pulses = 1) => {
  if (pulses === 1) return m === 3 ? pdSwerling3(SNR50_3 * k) : pdSwerling1(SNR50 * k);
  const anchor = integratedSnr50(pulses, m);
  return k > 0 ? noncoherentPd(anchor * k, pulses, m) : 0;
};

/** Notch Doppler: velocidad radial (m/s) por debajo de la cual el filtro borra el blanco. */
export const NOTCH_MS = { mti: 15, pd: 8 };

/** ¿El blanco cae en el notch Doppler del radar? (velocidad radial = |v|·cos del aspecto) */
export function inNotch(r, th, ca) {
  const thr = NOTCH_MS[r.mti], v = th.vel; if (!thr || !v) return false;
  return Math.hypot(v[0], v[1], v[2]) * Math.abs(ca) < thr;
}

/** SNR que da Pd = 50% (por pulso) con la fluctuación m y pulses pulsos integrados. */
const snr50Of = (m, pulses) => (pulses > 1 ? integratedSnr50(pulses, m) : m === 3 ? SNR50_3 : SNR50);

/**
 * Pd de un barrido del radar de u contra th a distancia rr (km), con alcance R (detR, ya con
 * interferencia y clima), a agl m sobre la superficie en (x, y) y con aspecto ca. wx: clima.
 * El clutter que sobrevive al filtro (physics/clutter.js) se suma al ruido:
 *   SINR = 1 / (1/SNR + C/σ)   con SNR = SNR50 · (R/rr)⁴ y C/σ = clutter residual / RCS del blanco.
 * El umbral de detección contra el residuo es el mismo que contra ruido (factor de visibilidad del
 * clutter = SNR50): se trata el residuo como ruido. Ver docs/FISICA.md §2.
 */
export function pdScan(u, th, rr, R, agl, x, y, ca, wx = null) {
  const r = D(u).radar; if (rr > PD_CUTOFF * R) return 0;
  const em = r.band !== 'OPT' && r.band !== 'ACU';
  if (em && inNotch(r, th, ca)) return 0;
  const pulses = em ? r.integrationPulses : 1, m = swerlingOf(th);
  let k = Math.pow(R / Math.max(rr, 1e-3), 4);
  if (em) {
    const c = clutterRcs(r, u.x, u.y, antZ(u), rr, agl, x, y, wx), C = c.surface + c.rain;
    const sig = rcsAt(th.T || th, r.band, ca);
    if (C > 0 && sig > 0) k = 1 / (1 / k + snr50Of(m, pulses ?? 1) * C / sig);
  }
  return pdRel(m, k, pulses);
}

/** Horizonte de radar (km) entre una antena a hr metros y un blanco a ht metros, Tierra 4/3. */
export function horizon(hr, ht) { return HORIZON_K * (Math.sqrt(Math.max(0, hr)) + Math.sqrt(Math.max(0, ht))); }
