// @ts-check
// ---------------- MOVILIDAD ----------------
// Traslado de una unidad terrestre en fases explícitas (etapa 5 del plan de Codex, docs/FISICA.md §12):
//   operativa → replegando (mob.stowS) → en tránsito → desplegando (mob.deployS) → operativa.
// Los tiempos y la velocidad máxima en ruta (mob.vmax, la del vehículo más lento de la unidad) salen de la
// ficha (D(u).mob, con incertidumbre en UNC); sin esos datos la unidad no se puede mover: no se inventa un
// valor. La velocidad de marcha la elige quien da la orden (escenario o jugador), con tope en mob.vmax: la
// velocidad media de un convoy no es una prestación publicada (Codex, #72). Mientras no está desplegada no detecta, no emite, no
// dispara, no recarga y no publica en la red. La ruta la da el escenario o el jugador (no hay red vial).
// Todo corre en tiempo simulado: cada fase termina en un instante fijo, sin importar el tamaño del paso.
import { D } from '../data/index.js';
import { S } from './state.js';
import { log } from './log.js';
import { recUnit } from './replay.js';

/** Nombre de cada fase del traslado (u.mob.phase). */
export const MOB_PHASE = { stow: 'replegando', move: 'en tránsito', deploy: 'desplegando' };

/** ¿La unidad está fuera de servicio por un traslado (en cualquiera de sus fases)? */
export const moving = u => !!u.mob;

/** ¿v es un número finito ≥ lo? (sin coerción: null, '', '5' o Infinity no cuentan como dato) */
const finite = (v, lo) => typeof v === 'number' && Number.isFinite(v) && v >= lo;

/** Datos de movilidad completos de la ficha de u, o null (un hueco null de la investigación no es un cero). */
export function mobData(u) {
  const m = D(u).mob;
  return m && finite(m.stowS, 0) && finite(m.deployS, 0) && finite(m.vmax, 1e-9) ? m : null;
}

/** Por qué u no puede empezar un traslado ahora, o null si puede. */
export function cantMove(u) {
  if (!u.alive) return 'está destruida';
  if (D(u).kind === 'aew') return 'es una plataforma aérea';
  if (!mobData(u)) return 'no hay datos de despliegue y repliegue para ' + D(u).short;
  if (u.mob) return 'ya se está trasladando';
  if (u.active > 0) return 'tiene misiles en vuelo que guía';
  return null;
}

/** Largo (km) de una ruta [[x, y], …]. */
const routeKm = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };

/** Punto a d km del inicio de la ruta. */
function along(pts, d) {
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay);
    if (d <= L && L > 0) return [ax + (bx - ax) * d / L, ay + (by - ay) * d / L];
    d -= L;
  }
  return pts[pts.length - 1];
}

/**
 * Ordena a u trasladarse por los puntos pts (km; el último es el destino) a kmh de marcha (con tope en la
 * velocidad máxima de su ficha) desde el instante t. → null si empezó, o el motivo por el que no puede.
 */
export function orderMove(u, pts, kmh, t = S.t) {
  const why = cantMove(u); if (why) return why;
  if (!Array.isArray(pts) || !pts.length) return 'la ruta está vacía';
  if (!finite(kmh, 1e-9)) return 'falta la velocidad de marcha';
  const m = /** @type {any} */ (mobData(u)), route = [[u.x, u.y], ...pts.map(p => [+p[0], +p[1]])], v = Math.min(kmh, m.vmax);
  const L = routeKm(route), tMove = t + m.stowS, tDeploy = tMove + L / v * 3600;
  u.mob = { phase: 'stow', route, km: L, kmh: v, tMove, tDeploy, tReady: tDeploy + m.deployS };
  u.reloadUntil = null;   // una recarga en curso se interrumpe: la munición que faltaba sigue en reserva
  recUnit(u);
  log('l', `${u.name} se repliega para trasladarse ${L.toFixed(1)} km a ${Math.round(v)} km/h (listo en ${Math.round((u.mob.tReady - t) / 60)} min).`, 'def');
  return null;
}

/** Avanza el traslado de u hasta t. → true si terminó en este paso. */
function advance(u, t) {
  const m = u.mob; if (!m) return false;
  if (m.phase === 'stow' && t >= m.tMove) { m.phase = 'move'; recUnit(u); }
  if (m.phase === 'move') {
    const [x, y] = along(m.route, Math.min(m.km, (Math.min(t, m.tDeploy) - m.tMove) / 3600 * m.kmh));
    u.x = x; u.y = y;
    if (t - (m.rec ?? -1e9) >= 5) { m.rec = t; recUnit(u); }   // la repetición dibuja el trayecto
    if (t >= m.tDeploy) { const end = m.route[m.route.length - 1]; u.x = end[0]; u.y = end[1]; m.phase = 'deploy'; recUnit(u); }
  }
  if (m.phase === 'deploy' && t >= m.tReady) {
    u.freeAt = m.tReady; u.mob = null; u.nextScan = t; recUnit(u);
    log('l', `${u.name} queda desplegada en su nueva posición.`, 'def');
    return true;
  }
  return false;
}

/**
 * Avanza los traslados en curso y da las órdenes programadas por el escenario (u.moves). Una orden
 * programada mientras la unidad todavía se trasladaba espera: empieza cuando la unidad queda libre
 * (u.freeAt), nunca antes, así que no cuenta marcha hecha mientras estaba ocupada. Con un paso largo
 * pueden encadenarse varias órdenes en el mismo paso; los instantes son los mismos que con pasos cortos.
 */
export function mobStep(t) {
  for (const u of S.units) {
    if (!u.alive) { if (u.mob) u.mob = null; continue; }
    for (let k = 0; k < 25; k++) {
      advance(u, t);
      const plan = u.moves;
      if (u.mob || !plan || !plan.length || plan[0].t > t) break;
      const mv = plan.shift(), why = orderMove(u, mv.pts, mv.kmh, Math.max(mv.t, u.freeAt ?? -Infinity));
      if (why) log('w', `${u.name} no puede cumplir el traslado programado: ${why}.`, 'def');
    }
  }
}
