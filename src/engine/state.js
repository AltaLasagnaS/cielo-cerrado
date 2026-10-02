'use strict';
// ---------------- ESTADO ----------------
let uid = 1;
const S = {
  setup: { defs: [], salvos: [], jams: [] },
  net: true, doctrine: 'salva', showCov: true, covRef: 'kh101', covAgl: 50, strobes: true,
  t: 0, running: false, started: false, speed: 15,
  units: [], threats: [], ints: [], fx: [], impacts: [], log: [], stats: null,
  sel: null, mode: 'select', placeType: null, route: null, atk: null
};
function newStats() { return { launched: 0, killed: 0, hits: 0, misses: 0, decoys: 0, decoysKilled: 0, shots: 0, defCost: 0, atkCost: 0, lost: 0, byUnit: {} }; }
S.stats = newStats();
