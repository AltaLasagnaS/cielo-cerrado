// @ts-check
// Clima vigente durante la corrida: el estado elegido (o el que dejó el último cambio del plan,
// S.wxPlan) con el factor del momento del día sobre los sensores ópticos. Ver docs/FISICA.md §2 ("Clima").
import { WEATHER, ENV } from '../data/index.js';
import { chordKm } from '../physics/weather.js';
import { S } from './state.js';
import { log } from './log.js';

/** Un estado del tiempo con el alcance óptico corregido si es de día. */
const withTod = W => S.tod === 'dia' ? { ...W, opt: W.opt * ENV.modelo.optDay } : W;

/** Clima vigente de fondo (objeto de data/weather.js), con el alcance óptico corregido si es de día. */
export function wxNow() {
  return withTod(WEATHER[S.wxLive ?? S.weather] || WEATHER.despejado);
}

/** Zonas de clima del escenario: [{ x, y, r (km), weather }] (rules.wxZones). Adentro manda la zona. */
const zones = () => (S.wxZones || []).filter(z => WEATHER[z.weather]);

/** Clima en el punto (x, y): el de la última zona que lo contiene, o el de fondo. */
export function wxAt(x, y) {
  let W = null;
  for (const z of zones()) if (Math.hypot(x - z.x, y - z.y) <= z.r) W = WEATHER[z.weather];
  return W ? withTod(W) : wxNow();
}

/**
 * Clima que afecta al camino de un sensor en (ax, ay) hacia un blanco en (bx, by) (docs/FISICA.md §2,
 * "Clima por zonas"). Sin zonas es el de fondo (el mismo objeto: las golden no cambian). Con zonas:
 *   - lluvia: la que más atenúa entre la de fondo (con su rainKm) y la de cada zona que cruza el camino,
 *     con el largo del tramo que la atraviesa (rain × km);
 *   - óptica y techo de nubes: lo peor entre el lugar del sensor y el del blanco (niebla o lluvia en
 *     cualquiera de las dos puntas tapan la vista);
 *   - acústica: la del lugar del sensor (el ruido de la lluvia y el viento está donde escucha);
 *   - lluvia, mar, nieve y niebla para el clutter: los del lugar del blanco (rainAt; la celda de
 *     resolución está ahí).
 */
export function wxPath(ax, ay, bx, by) {
  const zs = zones(); if (!zs.length) return wxNow();
  const base = wxNow(), atS = wxAt(ax, ay), atT = wxAt(bx, by);
  const L = Math.hypot(bx - ax, by - ay);
  // lluvia de fondo: cubre el camino que no está dentro de una zona, hasta su rainKm
  let inZones = 0; for (const z of zs) inZones += chordKm(ax, ay, bx, by, z.x, z.y, z.r);
  let rain = base.rain || 0, rainKm = rain ? Math.min(base.rainKm, Math.max(0, L - inZones)) : 0;
  for (const z of zs) {
    const W = WEATHER[z.weather]; if (!W.rain) continue;
    const km = Math.min(W.rainKm || Infinity, chordKm(ax, ay, bx, by, z.x, z.y, z.r));
    if (km > 0 && W.rain * km > rain * rainKm) { rain = W.rain; rainKm = km; }
  }
  const ceil = [atS.ceiling, atT.ceiling].filter(c => c != null);
  return {
    ...atT, rain: rainKm > 0 ? rain : 0, rainKm, rainAt: atT.rain || 0,
    opt: Math.min(atS.opt, atT.opt), ceiling: ceil.length ? Math.min(...ceil) : null, acu: atS.acu
  };
}

/** Empieza una corrida con el clima elegido (startSim). */
export function wxReset() { S.wxLive = S.weather; S.wxIdx = 0; }

/** Aplica los cambios de tiempo del plan que ya llegaron (lo llama sim/engine.js#step). */
export function wxStep(t) {
  const plan = S.wxPlan || [];
  while (S.wxIdx < plan.length && t >= plan[S.wxIdx].t) {
    const c = plan[S.wxIdx++]; if (!WEATHER[c.weather] || c.weather === S.wxLive) continue;
    S.wxLive = c.weather; log('w', 'Cambia el tiempo: ' + WEATHER[c.weather].name + '.');
  }
}
