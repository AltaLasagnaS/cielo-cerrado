// @ts-check
// ---------------- ENFRENTAMIENTO ----------------
// Seguimiento, solución de tiro y probabilidad de derribo (Pk). Ver docs/FISICA.md §6–§7.
import { D, C2_LEVELS, C2_ORDER, C2_NODES, datalinksOf, gatewaysInto } from '../data/index.js';
import { azOf, clamp } from '../util/math.js';
import { surf } from './terrain.js';
import { jamJ } from './radar.js';
import { posAt, speedAt, termZone } from './kinematics.js';
import { profileOf, hasProfile, timeTo, energyAt } from './interceptor.js';
import { isaSigma } from './atmosphere.js';
import { trackVel, predictAt } from './track.js';

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
export function trackOK(u, th, t, c2, gws = []) {
  const d = D(u), L = C2_LEVELS[c2], own = d.radar ? (t - (th.det[u.id] ?? -1e9)) <= d.radar.scan * 2 + 0.6 : false;
  const compatible = netPk(u, th, t, c2, gws) > 0;
  // Fallback para pistas creadas por escenarios/archivos de la versión anterior al desglose por red.
  const legacy = !th.net && th.netFirst != null && t - th.netFirst >= L.lag && t - th.lastNet <= L.window;
  const netT = u.link !== false && (L.share === 'track' || L.share === 'fire') && (compatible || legacy);
  if (d.sam.guid === 'cañón') return own;
  if (RADAR_GUID.includes(d.sam.guid)) return own || (L.share === 'fire' && netT);
  if (d.sam.guid === 'operador') return netT;
  return own || netT;
}

/** Clave de la pista propia del radar de u en th.obs (physics/track.js). */
export const ownKey = u => 'u' + u.id;

/**
 * Pistas (claves de th.obs) con las que u puede apuntar a th: las mismas reglas que trackOK (la propia,
 * la de cada red compatible de su puesto y la que llega por una pasarela habilitada). La solución de tiro
 * mide la velocidad del blanco solo con estas: una pista que no le llega no le sirve.
 */
export function trackKeys(u, th, t, c2, gws = []) {
  const d = D(u), L = C2_LEVELS[c2], g = d.sam.guid, keys = [];
  const own = d.radar ? (t - (th.det[u.id] ?? -1e9)) <= d.radar.scan * 2 + 0.6 : false;
  if (own && g !== 'operador') keys.push(ownKey(u));
  const netOK = u.link !== false && g !== 'cañón' && (L.share === 'fire' || (L.share === 'track' && !RADAR_GUID.includes(g)));
  if (!netOK) return keys;
  const fresh = (n, lag) => n && n.first != null && t - n.first >= L.lag + lag && t - n.last <= L.window;
  const cp = cpOf(u);
  for (const key of datalinksOf(d)) {
    if (fresh(th.net?.[netKey(key, cp)], 0)) keys.push(netKey(key, cp));
    for (const { from, G, id } of gatewaysInto(key)) if (gws.includes(id) && fresh(th.net?.[netKey(from, cp)], G.gwLag)) keys.push(netKey(from, cp));
  }
  return keys;
}

/**
 * Pista de red utilizable por u contra th (docs/FISICA.md §6, "Enlaces"): 1 si llega por una red propia
 * (después de la demora del nivel de C2 y mientras siga fresca), gwPk si solo llega a través de una
 * pasarela habilitada en el escenario (gws: ids de data/datalinks.js#GATEWAYS, con gwLag de demora extra),
 * 0 si no hay. No mira u.link ni el nivel de C2 (lo hace trackOK).
 */
export function netPk(u, th, t, c2, gws = []) {
  const L = C2_LEVELS[c2]; let best = 0;
  const fresh = (n, lag) => n && n.first != null && t - n.first >= L.lag + lag && t - n.last <= L.window;
  const cp = cpOf(u);
  for (const key of datalinksOf(D(u))) {
    if (fresh(th.net?.[netKey(key, cp)], 0)) return 1;
    for (const { from, G, id } of gatewaysInto(key)) if (gws.includes(id) && fresh(th.net?.[netKey(from, cp)], G.gwLag)) best = Math.max(best, G.gwPk);
  }
  return best;
}

/**
 * Puestos de mando (docs/FISICA.md §6): cada unidad pertenece a uno (u.cp; '' = el principal). Las pistas,
 * las alertas, el reparto de blancos y la triangulación solo circulan dentro de un puesto.
 */
export const cpOf = u => (u?.cp || '');
/** Clave de red de una familia de enlace dentro de un puesto de mando. */
export const netKey = (key, cp) => (cp ? key + '@' + cp : key);
/** Primera alerta que tuvo el puesto cp sobre th (null si ninguna). */
export const cueOf = (th, cp) => (cp ? (th.cueCp?.[cp] ?? null) : th.cueFirst);

/** Nivel de C2 de una unidad: el de la red (c2), salvo que la unidad esté asignada a uno menor (u.c2). */
export const unitC2 = (u, c2) => (u.c2 && C2_ORDER.indexOf(u.c2) >= 0 && C2_ORDER.indexOf(u.c2) < C2_ORDER.indexOf(c2) ? u.c2 : c2);

/**
 * Desde cuándo cuenta el tiempo de reacción de u contra th: normalmente desde que tiene pista; con
 * alerta de la red (todos los niveles salvo 'desconectada' y 'coordinada', que conserva el
 * comportamiento histórico) desde que llegó la alerta, si fue antes.
 */
/** @param {any} [u] */
export function reactionStart(th, t, c2, u = null) {
  const L = C2_LEVELS[c2];
  const cue = cueOf(th, cpOf(u));
  if ((L.share === 'cue' || L.share === 'fire') && cue != null) return Math.min(t, cue + L.lag);
  // Compatibilidad con objetos de pruebas y escenarios guardados anteriores.
  if ((L.share === 'cue' || L.share === 'fire') && cue == null && !cpOf(u) && th.netFirst != null && u?.link !== false) return Math.min(t, th.netFirst + L.lag);
  return t;
}

/**
 * Nivel de C2 efectivo: el elegido (c2) menos lo que se perdió con los objetivos de C2 destruidos
 * (data/c2.js#C2_NODES): un puesto de mando destruido deja la defensa desconectada y cada sitio de
 * comunicaciones destruido la baja un nivel. Con varios puestos de mando (u.cp), un nodo con g.cp solo afecta
 * a las unidades de ese puesto; uno sin cp, a todas.
 */
export function effectiveC2(c2, objs, cp = '') {
  let i = C2_ORDER.indexOf(c2);
  for (const g of objs) {
    if (g.cp && g.cp !== (cp || '')) continue;   // nodo de otro puesto de mando
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

/**
 * Fracción de su aceleración lateral máxima que necesita el interceptor (est, docs/FISICA.md §7): contra
 * un blanco que maniobra en su fase terminal, toda (la guía proporcional pide ≈3 veces la aceleración del
 * blanco); contra uno que no maniobra, un tercio (errores de rumbo y correcciones de la guía).
 */
export const NEED_MAN = 1, NEED_STRAIGHT = 1 / 3;

/**
 * Factor de Pk por maniobra en altura (docs/FISICA.md §7). La aceleración lateral aerodinámica es
 * proporcional a la presión dinámica ½ρv²; un misil la usa hasta su límite estructural (gmax). Se mide
 * en fracciones de gmax: a/gmax = min(1, σ(h)/σ(hFull) · E), con E = (v/vmax)² la energía en el punto de
 * encuentro (la misma de energyPk) y hFull (sam.hFull) la altura hasta la que a velocidad máxima todavía
 * llega a gmax. Con la fracción necesaria n (NEED_MAN o NEED_STRAIGHT), el factor de maniobra es
 * min(1, a/(n·gmax)). energyPk ya cuenta la parte de la velocidad, así que acá va solo lo que agrega la
 * altura: min(1, σ/σF·E/n) / min(1, E/n), nunca mayor que 1 (abajo de hFull no cambia nada: las Pk
 * calibradas quedan igual). Los misiles con empuje lateral directo (sam.dthrust: PAC-3, Aster) maniobran
 * con cohetes y no dependen del aire: ×1. Sin hFull, ×1.
 */
export function altitudePk(sm, f, tbm, z, maneuvering) {
  if (!sm.hFull || sm.dthrust || !usesEnergy(sm.guid)) return 1;
  const E = hasProfile(sm) ? energyAt(profileOf(sm), f * (tbm ? sm.maxRtbm : sm.maxR) * 1000) : energy(f);
  const n = maneuvering ? NEED_MAN : NEED_STRAIGHT, k = isaSigma(z) / isaSigma(sm.hFull);
  return Math.min(1, Math.min(1, k * E / n) / Math.min(1, E / n));
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
 * Busca el primer punto de intercepción posible: recorre la trayectoria futura del blanco tal como
 * la defensa la puede prever (balísticos: la verdadera, la fija la física; el resto: línea recta con la
 * velocidad medida por la pista, physics/track.js; sin dos detecciones no hay solución) (pasos de 0,5 s hasta 30 s y luego de 2 s, hasta 400 s) y devuelve el primer instante tau en que
 * el blanco está dentro de la envolvente (alcance, alcance mínimo, piso y techo) y el interceptor,
 * volando en línea recta con su perfil de motor y planeo (physics/interceptor.js; a sam.vInt constante
 * si no tiene perfil), llega a tiempo (con ≤ 3 s de holgura).
 * El alcance es el efectivo: maxR × rangeFactor(aspecto) × pct, con pct la doctrina "disparar dentro
 * del X% del alcance" (S.fireRange, 1 = todo el alcance).
 * → { tau (s desde t), p (posición prevista del blanco), r (km), f (r / alcance cinemático, para energyPk),
 *     v (m/s medida por la pista; null en balísticos) } o null. La llegada se verifica con arrivalReach.
 */
/** @param {string[] | null} [keys] pistas utilizables (trackKeys); sin ellas, la imagen de toda la defensa */
export function solve(u, th, t, pct = 1, keys = null) {
  const sm = D(u).sam, tbm = isTBM(th);
  const maxR = tbm ? sm.maxRtbm : sm.maxR; const lz = surf(u.x, u.y) + 2;
  const P = profileOf(sm);
  // Dónde va a estar el blanco: un balístico sigue una trayectoria que la física fija desde el
  // lanzamiento (la ruta es la verdadera); el resto se extrapola en línea recta desde la pista (track.js)
  const vel = tbm ? null : trackVel(th, keys); if (!tbm && !vel) return null;
  const at = tt => tbm ? posAt(th, tt) : predictAt(vel, tt);
  const cosAt = (tt, p) => tbm ? closingCos(th, tt, p, u.x, u.y, lz) : velCos(vel, p, u.x, u.y, lz);
  // Una doctrina menor que el 100% retiene el lanzamiento hasta que el blanco entra en su
  // envolvente de disparo. Antes solo se comprobaba el alcance en el punto futuro de encuentro:
  // el misil podía salir mientras el blanco todavía estaba fuera del porcentaje elegido, de modo
  // que "esperar" no tenía costo temporal. El 100% conserva el comportamiento histórico.
  if (pct < 1) {
    const p0 = at(t);
    if (!p0) return null;
    const r0 = Math.hypot(p0.x - u.x, p0.y - u.y, (p0.z - lz) / 1000);
    const ca0 = cosAt(t, p0);
    if (r0 > maxR * rangeFactor(ca0) * pct) return null;
  }
  // el fin del vuelo solo se conoce para el balístico; al resto se lo persigue hasta 400 s
  const tEnd = tbm ? th.tLaunch + th.ft - 0.5 : Infinity;
  let tau = 0.5;
  while (t + tau < tEnd && tau < 400) {
    const p = at(t + tau); if (!p) break;
    const dh = Math.hypot(p.x - u.x, p.y - u.y), r = Math.hypot(dh, (p.z - lz) / 1000);
    const agl = p.z - surf(p.x, p.y);
    // altMin: sobre el terreno bajo el blanco (el piso del radar); altMax: sobre el lanzador (techo del arma)
    if (r <= maxR * pct && r >= sm.minR && agl >= sm.altMin && p.z - lz <= sm.altMax) {
      const kin = maxR * rangeFactor(cosAt(t + tau, p));
      if (r <= kin * pct) {
        const tf = timeTo(P, r * 1000);
        if (tf <= tau) return (tau - tf <= 3) ? { tau, p, r, f: r / kin, v: vel ? vel.v : null } : null;
      }
    }
    tau += tau < 30 ? 0.5 : 2;
  }
  return null;
}

/** Coseno de acercamiento con la velocidad medida de la pista (vel = track.js#trackVel), en p. */
function velCos(vel, p, x, y, z) {
  const vx = vel.vx, vy = vel.vy, vz = vel.vAgl / 1000, lx = x - p.x, ly = y - p.y, lzk = (z - p.z) / 1000;
  const nv = Math.hypot(vx, vy, vz), nl = Math.hypot(lx, ly, lzk);
  return nv && nl ? (vx * lx + vy * ly + vz * lzk) / (nv * nl) : 1;
}

/**
 * Llegada del interceptor de u al blanco th en t, que salió hacia el punto predicho por solve(): el
 * buscador o la guía corrigen hacia la posición real, pero solo si le alcanza la energía. Mismo
 * criterio que solve y engage con la posición verdadera: r ≤ alcance cinemático (maxR × rangeFactor),
 * alcance mínimo, piso, techo y velocidad del blanco ≤ vmaxT (uno que aceleró en la picada se escapa). Si el blanco giró o cambió de altura más de lo que el misil cubre,
 * no lo alcanza. → { ok, f } (f = r / alcance, para la Pk como en solve).
 */
/** @param {number | null} [kinPlan] alcance efectivo (km) con el que se planeó el tiro (solve: r / f) */
export function arrivalReach(u, th, t, kinPlan = null) {
  const sm = D(u).sam, p = th.p; if (!p) return { ok: false, f: 1 };
  const maxR = isTBM(th) ? sm.maxRtbm : sm.maxR, lz = surf(u.x, u.y) + 2;
  const r = Math.hypot(p.x - u.x, p.y - u.y, (p.z - lz) / 1000);
  // el aspecto ya se usó al planear el vuelo (el misil voló esa trayectoria): se conserva su alcance
  // efectivo y solo cambia la distancia al blanco real; sin plan (pruebas, viejos), se recalcula
  const kin = kinPlan ?? maxR * rangeFactor(closingCos(th, t, p, u.x, u.y, lz));
  // un cañón no corrige en vuelo: su ráfaga llega en un par de segundos al punto apuntado y el acierto
  // ya está en su Pk; la cuenta de energía de un misil guiado no le corresponde (piso, techo y velocidad sí)
  const inRange = sm.guid === 'cañón' || (r <= kin && r >= sm.minR);
  const ok = inRange && p.z - surf(p.x, p.y) >= sm.altMin && p.z - lz <= sm.altMax && speedAt(th, t) <= sm.vmaxT;
  return { ok, f: r / kin };
}

/**
 * Probabilidad de derribo de un interceptor de u contra th en el instante t:
 *   Pk = Pk_base[clase] × modificadores, acotada a [0, 0,98]
 * Modificadores: maniobra terminal (×manPk del blanco, ×0,85 contra cañones), bengalas contra IR
 * (×0,85), blanco sin motor contra IR (×0,3, T.cold: planeadoras), baja firma (×0,85 buscador activo, ×0,75 guiado desde tierra), interferencia sobre el
 * radar de la batería (×1/(1+0,08·J), mín. ×0,5), blanco a más del 80% de vmaxT (×0,8) y energía
 * del misil en el punto de encuentro (×energyPk, solo si se pasa f = r / alcance cinemático de solve) y
 * maniobra en el aire fino de la altura (×altitudePk, misma condición).
 * jams = interferidores activos de la corrida. est = estimación de la defensa antes de disparar (reparto de
 * blancos): usa la última posición vista y la velocidad medida, y no sabe si el blanco va a estar en su
 * maniobra terminal (depende de la distancia a su blanco, que no conoce).
 */
/** @param {number | null} [f] @param {boolean} [est] */
export function calcPk(u, th, t, jams, f = null, est = false) {
  const sm = D(u).sam; let pk = sm.pk[th.cls] || 0;
  const p = est ? (th.seen ?? th.p) : th.p; if (!p) return 0;
  const man = !est && !!th.maneuver && th.p.rem < termZone(th);
  if (man) pk *= sm.guid === 'cañón' ? 0.85 : (th.T.manPk ?? 0.7);
  if (th.T.ir && (sm.guid === 'IR')) pk *= 0.85;
  if (th.T.cold && sm.guid === 'IR') pk *= 0.3;   // sin motor (planeadora): casi no hay calor para el buscador IR
  if (th.T.lo && sm.guid !== 'IR' && sm.guid !== 'cañón') pk *= sm.guid === 'activo' ? 0.85 : 0.75;
  if (RADAR_GUID.includes(sm.guid) || sm.guid === 'activo') { const J = jamJ(u, azOf(p.x - u.x, p.y - u.y), jams); if (J > 1) pk *= Math.max(0.5, 1 / (1 + 0.08 * J)); }
  const v = est ? (trackVel(th)?.v ?? speedAt(th, t)) : speedAt(th, t); if (v > 0.8 * sm.vmaxT) pk *= 0.8;
  if (f !== null && usesEnergy(sm.guid)) pk *= energyPk(sm, f, isTBM(th)) * altitudePk(sm, f, isTBM(th), p.z, man);
  return clamp(pk, 0, 0.98);
}
