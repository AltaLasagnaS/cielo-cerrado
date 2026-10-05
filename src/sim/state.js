// @ts-check
// ---------------- ESTADO ----------------
// Estado único y mutable del juego. Se separa en dos partes:
//   setup   → lo que arma el jugador (objetivos, defensas, salvas, jammers). Es lo que se guarda y carga.
//   corrida → copias "vivas" creadas por startSim (units, threats, ints...) que la simulación modifica.

export const S = {
  // escenario armado por el jugador
  setup: { objs: [], defs: [], salvos: [], jams: [] },
  // escenario cargado (data/scenarios.js) o null si es un relieve importado
  scen: null,
  // opciones de mando (c2 = nivel de integración, ver data/c2.js; fireRange = disparar dentro de esa
  // fracción del alcance efectivo), clima (data/weather.js) y de visualización
  c2: 'coordinada', doctrine: 'salva', fireRange: 1, weather: 'despejado', tod: 'noche', wxPlan: [], gateways: [], wind: { v: 0, from: 0 }, ignoreDecoys: false, showCov: true, covRef: 'kh101', covAgl: 50, strobes: true, relief: 'normal',
  // reloj y control de la corrida
  t: 0, running: false, started: false, speed: 15, auto: true, autoPhase: 'calm',
  // corrida en curso
  units: [], jamsLive: [], hoj: [], ewNext: 0, wxLive: null, wxIdx: 0, objs: [], pending: [], threats: [], ints: [], fx: [], impacts: [], log: [], stats: null,
  // eventos clave para la línea de tiempo del debrief y detalle de cada arma que llegó al blanco
  events: [], arrivals: [],
  // interfaz: selección, modo de edición, ruta en trazado y salva en preparación
  sel: null, mode: 'select', placeType: null, route: null, atk: null,
  // última cobertura calculada (grilla y % del mapa cubierto)
  _cov: null, covStat: null
};

/** Contadores de resultado de una corrida. Costos en millones de US$. */
export function newStats() {
  return {
    launched: 0, killed: 0, hits: 0, misses: 0, decoys: 0, decoysKilled: 0, shots: 0, defCost: 0, atkCost: 0, lost: 0, byUnit: {},
    // daño a objetivos
    damage: 0, dmgByWeapon: {}, missSum: 0, missN: 0, objsDestroyed: 0,
    // saturación: veces que una unidad tenía blancos pero no le quedaban canales o munición
    satChannels: {}, satMag: {},
    // recargas completadas y componentes de unidades dañados (daño funcional)
    reloads: 0, unitsDamaged: 0
  };
}
S.stats = newStats();
