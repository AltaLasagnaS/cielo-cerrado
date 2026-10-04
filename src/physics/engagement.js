// @ts-check
// ---------------- ENFRENTAMIENTO ----------------
// Seguimiento, solución de tiro y probabilidad de derribo (Pk). Ver docs/FISICA.md §6–§7.
import { D, C2_LEVELS, C2_ORDER, C2_NODES, datalinksOf } from '../data/index.js';
import { azOf, clamp } from '../util/math.js';
import { surf } from './terrain.js';
import { jamJ } from './radar.js';
import { posAt, speedAt, termZone } from './kinematics.js';
import { profileOf, hasProfile, timeTo, energyAt } from './interceptor.js';

/** Guiados que necesitan que el radar PROPIO de la batería vea el blanco hasta el final. */
export const RADAR_GUID = ['TVM', 'SARH', 'mando', 'cañón'];

/** ¿El blanco es balístico o hipersónico (usa el alcance anti-TBM de la defensa)? */
export const isTBM = th => th.cls === 'balistico' || th.cls === 'hiper';

/**
 * ¿La unidad u tiene una pista utilizable de th en el instante t, con el nivel de C2 c2 (data/c2.js)?
 * - Pista propia: su radar la vio en los últimos 2 barridos (+0,6 s).
 * - Pista de red (niveles 'track' y 'fire'): algún sensor con enlace la vio en los últimos L.window s
 *   y ya pasó la demora L.lag desde la primera detección de la red (th.netFirst). Una unidad sin
 *   enlace de datos (u.link === false) no recibe pistas de red.
 * Guiado por radar propio exige pista propia, salvo con C2 integrada ('fire': lanzamiento con pista
 * ajena, y el motor exige además que su radar cubra el punto de encuentro); los cañones apuntan
 * siempre con su propio sensor; drones interceptores (operador) usan la de red; misiles activos/IR
 * aceptan cualquiera.
 */
export function trackOK(u, th, t, c2) {
  const d = D(u), L = C2_LEVELS[c2], own = d.radar ? (t - (th.det[u.id] ?? -1e9)) <= d.radar.scan * 2 + 0.6 : false;
  const compatible = datalinksOf(d).some(key => {
    const n = th.net?.[key];
    return n && n.first != null && t - n.first >= L.lag && t - n.last <= L.window;
  });
  // Fallback para pistas creadas por escenarios/archivos de la versión anterior al desglose por red.
  const legacy = !th.net && th.netFirst != null && t - th.netFirst >= L.lag && t - th.lastNet <= L.window;
  const netT = u.link !== false && (L.share === 'track' || L.share === 'fire') && (compatible || legacy);
  if (d.sam.guid === 'cañón') return own;
  if (RADAR_GUID.includes(d.sam.guid)) return own || (L.share === 'fire' && netT);
  if (d.sam.guid === 'operador') return netT;
  return own || netT;
}

/**
 * Desde cuándo cuenta el tiempo de reacción de u contra th: normalmente desde que tiene pista; con
 * alerta de la red (todos los niveles salvo 'desconectada' y 'coordinada', que conserva el
 * comportamiento histórico) desde que llegó la alerta, si fue antes.
 */
export function reactionStart(th, t, c2, u = null) {
  const L = C2_LEVELS[c2];
  if ((L.share === 'cue' || L.share === 'fire') && th.cueFirst != null) return Math.min(t, th.cueFirst + L.lag);
  // Compatibilidad con objetos de pruebas y escenarios guardados anteriores.
  if ((L.share === 'cue' || L.share === 'fire') && th.cueFirst == null && th.netFirst != null && u?.link !== false) return Math.min(t, th.netFirst + L.lag);
  return t;
}

/**
 * Nivel de C2 efectivo: el elegido (c2) menos lo que se perdió con los objetivos de C2 destruidos
 * (data/c2.js#C2_NODES): un puesto de mando destruido deja la defensa desconectada y cada sitio de
 * comunicaciones destruido la baja un nivel.
 */
export function effectiveC2(c2, objs) {
  let i = C2_ORDER.indexOf(c2);
  for (const g of objs) {
    const n = g.status === 'destroyed' && C2_NODES[g.type]; if (!n) continue;
    i = n === 'all' ? 0 : i - n;
  }
  return C2_ORDER[Math.max(0, i)];
}

/**
 * Factor de alcance por geometría (docs/FISICA.md §6): el interceptor llega más lejos contra un blanco
 * que viene de frente que contra uno que se aleja, porque en el segundo caso tiene que alcanzarlo.
 * ca = coseno entre la dirección de vuelo del blanco y la línea blanco→lanzador
 * (1 = viene directo al lanzador, 0 = pasa de costado, −1 = se aleja). → 0,6 a 1.
 */
export const rangeFactor = ca => 0.8 + 0.2 * clamp(ca, -1, 1);

/**
 * Energía por tramos (paso A), para los misiles sin perfil de motor y planeo en el catálogo: según la
 * fracción f = r / alcance efectivo cinemático (maxR × rangeFactor), entera hasta el 75% del alcance y
 * después baja lineal hasta la mitad en el borde.
 */
export const energy = f => f <= 0.75 ? 1 : Math.max(0.5, 1 - 2 * (f - 0.75));

/** Fracción del alcance del "tiro típico" con el que están calibradas las Pk del catálogo. */
export const ENERGY_REF = 0.9;

/**
 * Factor de Pk por energía, RELATIVO al tiro típico: las Pk de data/calibration.js salen de episodios
 * reales con tiros cerca del alcance máximo, así que un tiro al 90% vale ×1 y uno corto hasta ×1,25.
 * (Una versión absoluta bajaba todas las Pk y Kiev caía de ≈70% a ≈25%.)
 * Con perfil de motor y planeo (physics/interceptor.js), la energía es la del misil después de recorrer
 * f × alcance (el de balísticos contra balísticos): contra un blanco que se aleja f es mayor que r/maxR,
 * porque tiene que alcanzarlo. Sin perfil, la energía por tramos.
 */
export function energyPk(sm, f, tbm = false) {
  if (!hasProfile(sm)) return Math.min(1.25, energy(f) / energy(ENERGY_REF));
  const P = profileOf(sm), R = (tbm ? sm.maxRtbm : sm.maxR) * 1000;
  return Math.min(1.25, energyAt(P, f * R) / energyAt(P, ENERGY_REF * R));
}

/** ¿El guiado depende de la energía de un misil? Los cañones y los drones interceptores (con motor todo el vuelo) no. */
export const usesEnergy = guid => guid !== 'cañón' && guid !== 'operador';

/**
 * Coseno de aspecto para el alcance efectivo: dirección de vuelo del blanco en el instante tt
 * (diferencia con 0,5 s antes, o después al principio de la trayectoria) contra la línea blanco→(x, y, z).
 */
function closingCos(th, tt, p, x, y, z) {
  let q = posAt(th, tt - 0.5), a = q, b = p;
  if (!q || tt - 0.5 < th.tLaunch) { q = posAt(th, tt + 0.5); a = p; b = q; }
  if (!a || !b) return 1;
  const vx = b.x - a.x, vy = b.y - a.y, vz = (b.z - a.z) / 1000, lx = x - p.x, ly = y - p.y, lzk = (z - p.z) / 1000;
  const nv = Math.hypot(vx, vy, vz), nl = Math.hypot(lx, ly, lzk);
  return nv && nl ? (vx * lx + vy * ly + vz * lzk) / (nv * nl) : 1;
}

/**
 * Busca el primer punto de intercepción posible: recorre la trayectoria futura del blanco
 * (pasos de 0,5 s hasta 30 s y luego de 2 s, hasta 400 s) y devuelve el primer instante tau en que
 * el blanco está dentro de la envolvente (alcance, alcance mínimo, piso y techo) y el interceptor,
 * volando en línea recta con su perfil de motor y planeo (physics/interceptor.js; a sam.vInt constante
 * si no tiene perfil), llega a tiempo (con ≤ 3 s de holgura).
 * El alcance es el efectivo: maxR × rangeFactor(aspecto) × pct, con pct la doctrina "disparar dentro
 * del X% del alcance" (S.fireRange, 1 = todo el alcance).
 * → { tau (s desde t), p (posición del blanco), r (km), f (r / alcance cinemático, para energyPk) } o null.
 */
export function solve(u, th, t, pct = 1) {
  const sm = D(u).sam, tbm = isTBM(th);
  const maxR = tbm ? sm.maxRtbm : sm.maxR; const lz = surf(u.x, u.y) + 2;
  const P = profileOf(sm);
  // Una doctrina menor que el 100% retiene el lanzamiento hasta que el blanco entra en su
  // envolvente de disparo. Antes solo se comprobaba el alcance en el punto futuro de encuentro:
  // el misil podía salir mientras el blanco todavía estaba fuera del porcentaje elegido, de modo
  // que "esperar" no tenía costo temporal. El 100% conserva el comportamiento histórico.
  if (pct < 1) {
    const p0 = posAt(th, t);
    if (!p0) return null;
    const r0 = Math.hypot(p0.x - u.x, p0.y - u.y, (p0.z - lz) / 1000);
    const ca0 = closingCos(th, t, p0, u.x, u.y, lz);
    if (r0 > maxR * rangeFactor(ca0) * pct) return null;
  }
  const tEnd = th.tLaunch + th.ft - 0.5;
  let tau = 0.5;
  while (t + tau < tEnd && tau < 400) {
    const p = posAt(th, t + tau); if (!p) break;
    const dh = Math.hypot(p.x - u.x, p.y - u.y), r = Math.hypot(dh, (p.z - lz) / 1000);
    const agl = p.z - surf(p.x, p.y);
    // altMin: sobre el terreno bajo el blanco (el piso del radar); altMax: sobre el lanzador (techo del arma)
    if (r <= maxR * pct && r >= sm.minR && agl >= sm.altMin && p.z - lz <= sm.altMax) {
      const kin = maxR * rangeFactor(closingCos(th, t + tau, p, u.x, u.y, lz));
      if (r <= kin * pct) {
        const tf = timeTo(P, r * 1000);
        if (tf <= tau) return (tau - tf <= 3) ? { tau, p, r, f: r / kin } : null;
      }
    }
    tau += tau < 30 ? 0.5 : 2;
  }
  return null;
}

/**
 * Probabilidad de derribo de un interceptor de u contra th en el instante t:
 *   Pk = Pk_base[clase] × modificadores, acotada a [0, 0,98]
 * Modificadores: maniobra terminal (×manPk del blanco, ×0,85 contra cañones), bengalas contra IR
 * (×0,85), blanco sin motor contra IR (×0,3, T.cold: planeadoras), baja firma (×0,85 buscador activo, ×0,75 guiado desde tierra), interferencia sobre el
 * radar de la batería (×1/(1+0,08·J), mín. ×0,5), blanco a más del 80% de vmaxT (×0,8) y energía
 * del misil en el punto de encuentro (×energyPk, solo si se pasa f = r / alcance cinemático de solve).
 * jams = interferidores activos de la corrida.
 */
export function calcPk(u, th, t, jams, f = null) {
  const sm = D(u).sam; let pk = sm.pk[th.cls] || 0;
  const p = th.p; if (!p) return 0;
  if (th.maneuver && p.rem < termZone(th)) pk *= sm.guid === 'cañón' ? 0.85 : (th.T.manPk ?? 0.7);
  if (th.T.ir && (sm.guid === 'IR')) pk *= 0.85;
  if (th.T.cold && sm.guid === 'IR') pk *= 0.3;   // sin motor (planeadora): casi no hay calor para el buscador IR
  if (th.T.lo && sm.guid !== 'IR' && sm.guid !== 'cañón') pk *= sm.guid === 'activo' ? 0.85 : 0.75;
  if (RADAR_GUID.includes(sm.guid) || sm.guid === 'activo') { const J = jamJ(u, azOf(p.x - u.x, p.y - u.y), jams); if (J > 1) pk *= Math.max(0.5, 1 / (1 + 0.08 * J)); }
  const v = speedAt(th, t); if (v > 0.8 * sm.vmaxT) pk *= 0.8;
  if (f !== null && usesEnergy(sm.guid)) pk *= energyPk(sm, f, isTBM(th));
  return clamp(pk, 0, 0.98);
}
