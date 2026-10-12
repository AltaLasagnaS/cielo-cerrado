import { moduleOf, provenance, save } from './context.mjs';
const { S } = await moduleOf('src/sim/state.js');
const { startSim, step } = await moduleOf('src/sim/engine.js');
const { addDef, addSalvo } = await moduleOf('src/sim/setup.js');
const { coverageGrid } = await moduleOf('src/physics/coverage.js');
const { THREATS } = await moduleOf('src/data/index.js');
const { flatMap, setMap } = await moduleOf('src/physics/terrain.js');
const { setRandom, seeded } = await moduleOf('src/util/rng.js');
const { clearSetup, useMap } = await moduleOf('tests/helpers.js');
const quantile = (a, q) => [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(q * a.length))];
const rows = [];
for (const count of [10, 100, 1000]) {
  useMap('monterey', { flat: true }); clearSetup(); setRandom(seeded(7));
  addDef('nasams', 40, 40); addDef('ewr', 40, 30);
  addSalvo({ type: 'shahed', count, interval: 0, pts: [[40, 10], [40, 40]], agl: 50 });
  const heapBefore = process.memoryUsage().heapUsed, began = performance.now(); startSim();
  const initializationMs = performance.now() - began, times = [];
  for (let n = 0; n < 80; n++) { const t = performance.now(); step(0.25); times.push(performance.now() - t); }
  rows.push({ count, steps: 80, simulationSeconds: S.t, initializationMs,
    stepMedianMs: quantile(times, 0.5), stepP95Ms: quantile(times, 0.95), stepMaxMs: Math.max(...times),
    heapDeltaBytes: process.memoryUsage().heapUsed - heapBefore,
    recordedEvents: S.rec.units.length + S.rec.objs.length + S.rec.ints.length + S.rec.log.length,
    historyProjectionJsonBytes: Buffer.byteLength(JSON.stringify({
      units: S.rec.units, objectives: S.rec.objs, log: S.rec.log,
      interceptors: S.rec.ints.map(i => ({ tL: i.tL, tH: i.tH, unitId: i.u.id, threatId: i.th?.id, done: i.done })),
      threats: S.threats.map(t => ({ trail: t.trail, obs: t.obs })) })) });
  setRandom(null);
}
const coverage = [];
for (const size of [100, 250]) {
  setMap(flatMap(size, size, 200)); const u = { ...S.units[0], x: 10, y: 10 };
  const t = performance.now(); const cells = coverageGrid([u], [], THREATS.shahed, 50);
  coverage.push({ W: size, H: size, cellMetres: 200, units: 1, milliseconds: performance.now() - t, allocatedGridBytes: cells.byteLength });
}
save('performance.json', { provenance: provenance(), method: 'Una ejecución local por tamaño, valores probables, semilla 7, 80 pasos de 0,25 s. Incluye barridos; no representa 250000 amenazas ni un límite seguro. Heap no es memoria retenida: GC/JIT pueden alterar diferencias.', steps: rows, coverage });
console.log(JSON.stringify({ steps: rows, coverage }, null, 2));
