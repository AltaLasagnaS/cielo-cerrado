// Repetición de la corrida (línea de tiempo navegable en el debrief).
//
// No se graban fotos del estado: las trayectorias de las amenazas son deterministas (posAt), así que
// alcanza con anotar CUÁNDO cambia cada cosa y reconstruir el mapa en cualquier instante T:
//   - cada amenaza guarda th.tEnd (derribo o llegada) y cada señuelo th.tBorn (cuando lo suelta su misil);
//   - S.rec.ints: todos los interceptores (S.ints se poda durante la corrida);
//   - S.rec.units / S.rec.objs: el estado de unidades y objetivos después de cada cambio;
//   - S.rec.log: el registro completo (S.log guarda solo las últimas 300 líneas);
//   - S.impacts lleva el instante t de cada caída.
// Anotar no consume números al azar ni cambia resultados. Ver docs/ARQUITECTURA.md.
import { S } from './state.js';
import { posAt } from '../physics/kinematics.js';

/** Empieza a grabar una corrida nueva (startSim). */
export function recReset() { S.rec = { ints: [], units: [], objs: [], log: [] }; }

/** Anota el estado de una unidad después de un cambio (disparo, recarga, daño o pérdida). */
export function recUnit(u) { S.rec?.units.push({ t: S.t, id: u.id, alive: u.alive, dmgRadar: u.dmgRadar, dmgLauncher: u.dmgLauncher, magLeft: u.magLeft }); }

/** Anota el estado de un objetivo después de recibir daño. */
export function recObj(g) { S.rec?.objs.push({ t: S.t, id: g.id, hp: g.hp, status: g.status, hits: g.hits }); }

/** ¿Hay una corrida grabada para repetir? */
export const canReplay = () => !!(S.rec && S.started && S.threats.length);

/** Último estado anotado de cada id hasta el instante T, aplicado sobre una copia de base. */
function stateAt(base, events, T) {
  const out = base.map(o => ({ ...o })), byId = new Map(out.map(o => [o.id, o]));
  for (const e of events) { if (e.t > T) break; const o = byId.get(e.id); if (o) Object.assign(o, e); }
  return out;
}

/** Puntos de la estela de una amenaza: cada 3 s durante los últimos 4 minutos antes de T. */
function trailAt(th, T) {
  const tr = [];
  for (let t = Math.max(th.tBorn ?? th.tLaunch, T - 240); t < T; t += 3) { const p = posAt(th, t); if (p) tr.push([p.x, p.y, t]); }
  return tr;
}

/**
 * Cuadro de la corrida en el instante T (s): lo que dibuja render/draw.js en modo repetición.
 * Muestra la verdad (todas las amenazas en vuelo, como el debrief), no solo lo que veía la defensa.
 * → { t, threats, ints, units, objs, impacts, log }
 */
export function frameAt(T) {
  const threats = [];
  for (const th of S.threats) {
    // T = 0 es antes del primer paso: todavía no salió nada; los señuelos nacen cuando el misil los suelta
    if (T <= 0 || (th.tBorn ?? th.tLaunch) > T || (th.tEnd ?? Infinity) <= T) continue;
    const p = posAt(th, T); if (!p) continue;
    threats.push({ ...th, p, trail: trailAt(th, T), alive: true, lastNet: T });
  }
  const ints = S.rec.ints.filter(it => it.tL <= T && T < it.tH).map(it => ({ ...it, done: false }));
  const units = stateAt(S.setup.defs.map(d => ({ ...d, alive: true, dmgRadar: false, dmgLauncher: false, magLeft: d.mag })), S.rec.units, T);
  const objs = stateAt(S.setup.objs.map(g => ({ ...g, hp: g.maxHp, status: 'operational', hits: 0 })), S.rec.objs, T);
  const impacts = S.impacts.filter(im => (im.t ?? 0) <= T);
  const log = S.rec.log.filter(l => l.t <= T);
  return { t: T, threats, ints, units, objs, impacts, log };
}

/** Duración de la corrida grabada (s): el instante del último evento. */
export const replayEnd = () => S.t;
