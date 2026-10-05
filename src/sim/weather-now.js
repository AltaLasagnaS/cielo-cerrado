// @ts-check
// Clima vigente durante la corrida: el estado elegido (o el que dejó el último cambio del plan,
// S.wxPlan) con el factor del momento del día sobre los sensores ópticos. Ver docs/FISICA.md §2 ("Clima").
import { WEATHER, ENV } from '../data/index.js';
import { S } from './state.js';
import { log } from './log.js';

/** Clima vigente (objeto de data/weather.js), con el alcance óptico corregido si es de día. */
export function wxNow() {
  const W = WEATHER[S.wxLive ?? S.weather] || WEATHER.despejado;
  return S.tod === 'dia' ? { ...W, opt: W.opt * ENV.modelo.optDay } : W;
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
