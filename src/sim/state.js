// ---------------- ESTADO ----------------
// Estado único y mutable del juego. Se separa en dos partes:
//   setup   → lo que arma el jugador (defensas, salvas, jammers). Es lo que se guarda y carga.
//   corrida → copias "vivas" creadas por startSim (units, threats, ints...) que la simulación modifica.

export const S = {
  // escenario armado por el jugador
  setup: { defs: [], salvos: [], jams: [] },
  // opciones de mando y de visualización
  net: true, doctrine: 'salva', showCov: true, covRef: 'kh101', covAgl: 50, strobes: true, relief: 'normal',
  // reloj y control de la corrida
  t: 0, running: false, started: false, speed: 15,
  // corrida en curso
  units: [], jamsLive: [], pending: [], threats: [], ints: [], fx: [], impacts: [], log: [], stats: null,
  // interfaz: selección, modo de edición, ruta en trazado y salva en preparación
  sel: null, mode: 'select', placeType: null, route: null, atk: null,
  // última cobertura calculada (grilla y % del mapa cubierto)
  _cov: null, covStat: null
};

/** Contadores de resultado de una corrida. Costos en millones de US$. */
export function newStats() { return { launched: 0, killed: 0, hits: 0, misses: 0, decoys: 0, decoysKilled: 0, shots: 0, defCost: 0, atkCost: 0, lost: 0, byUnit: {} }; }
S.stats = newStats();
