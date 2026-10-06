// @ts-check
// ---------------- ESTADO ----------------
// Estado único y mutable del juego. Se separa en dos partes:
//   setup   → lo que arma el jugador (objetivos, defensas, salvas, jammers). Es lo que se guarda y carga.
//   corrida → copias "vivas" creadas por startSim (units, threats, ints...) que la simulación modifica.

export const S = {
  // escenario armado por el jugador
  setup: { objs: /** @type {any[]} */ ([]), defs: /** @type {any[]} */ ([]), salvos: /** @type {any[]} */ ([]), jams: /** @type {any[]} */ ([]) },
  // escenario cargado (data/scenarios.js) o null si es un relieve importado
  scen: /** @type {any} */ (null),
  // opciones de mando (c2 = nivel de integración, ver data/c2.js; fireRange = disparar dentro de esa
  // fracción del alcance efectivo), clima (data/weather.js) y de visualización
  c2: 'coordinada', doctrine: 'salva', fireRange: 1, weather: 'despejado', tod: 'noche', wxPlan: /** @type {any[]} */ ([]), gateways: /** @type {any[]} */ ([]), wind: { v: 0, from: 0 }, ignoreDecoys: false, showCov: true, covRef: 'kh101', covAgl: 50, strobes: true, relief: 'normal',
  // reloj y control de la corrida
  t: 0, running: false, started: false, speed: 15, auto: true, autoPhase: 'calm',
  // corrida en curso
  units: /** @type {any[]} */ ([]), jamsLive: /** @type {any[]} */ ([]), hoj: /** @type {any[]} */ ([]), ewNext: 0, wxLive: /** @type {any} */ (null), wxIdx: 0, objs: /** @type {any[]} */ ([]), pending: /** @type {any[]} */ ([]), threats: /** @type {any[]} */ ([]), ints: /** @type {any[]} */ ([]), fx: /** @type {any[]} */ ([]), impacts: /** @type {any[]} */ ([]), log: /** @type {any[]} */ ([]), stats: /** @type {any} */ (null),
  // eventos clave para la línea de tiempo del debrief y detalle de cada arma que llegó al blanco
  events: /** @type {any[]} */ ([]), arrivals: /** @type {any[]} */ ([]),
  // interfaz: selección, modo de edición, ruta en trazado y salva en preparación
  sel: /** @type {any} */ (null), multi: /** @type {any[]} */ ([]), mode: 'select', placeType: /** @type {any} */ (null), route: /** @type {any} */ (null), atk: /** @type {any} */ (null), measure: /** @type {any} */ (null), relocate: /** @type {any} */ (null), box: /** @type {any} */ (null),
  // última cobertura calculada (grilla y % del mapa cubierto)
  _cov: /** @type {any} */ (null), covStat: /** @type {any} */ (null)
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
