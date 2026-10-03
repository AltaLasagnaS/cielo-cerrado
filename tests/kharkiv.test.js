// Relieve de Járkov (scripts/gen-terrain.mjs, ventana 49,5–50,5° N armada con dos tiles SRTM) y su
// escenario de bombas planeadoras.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS } from '../src/data/index.js';
import { builtinMap, setMap, elev } from '../src/physics/terrain.js';

test('Járkov: la ventana va de 49,5° a 50,5° N y la ciudad cae donde corresponde', () => {
  const m = builtinMap('kharkiv');
  assert.equal(m.latN, 50.5); assert.equal(m.lonW, 36);
  assert.ok(Math.abs(m.H * m.dlat - 1) < 1e-9 && Math.abs(m.W * m.dlon - 1) < 1e-9, '1° × 1°');
  const c = m.places.find(p => p[0] === 'Járkov (centro)');
  // 49,9925° N, 36,2311° E → ≈56 km desde el borde norte y ≈16 km desde el oeste
  assert.ok(Math.abs(c[2] - (50.5 - 49.9925) * 111) < 0.5 && Math.abs(c[1] - 0.2311 * m.W * 0.2) < 0.5);
});

test('Járkov: la costura entre los dos tiles (50° N) no deja un escalón', () => {
  const m = builtinMap('kharkiv'); setMap(m);
  const yS = (50.5 - 50) * 111;   // km desde el norte
  const step = (y0, y1) => { let s = 0, n = 0; for (let x = 1; x < m.W * 0.2 - 1; x += 0.5) { s += Math.abs(elev(x, y1) - elev(x, y0)); n++; } return s / n; };
  const seam = step(yS - 0.2, yS + 0.2);
  const ref = (step(30 - 0.2, 30 + 0.2) + step(80 - 0.2, 80 + 0.2)) / 2;
  assert.ok(seam < 2 * ref + 1, `salto medio en la costura ${seam.toFixed(1)} m vs ${ref.toFixed(1)} m en otras filas`);
  // el terreno es la llanura de Járkov: nada de mar ni montañas
  let lo = 1e9, hi = -1e9; for (const v of m.data) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  assert.ok(lo > 50 && hi < 300, `${lo}–${hi} m`);
});

test('escenario de Járkov: las bombas traen CRPA de 12 y caen sobre blancos del mapa', () => {
  const sc = SCENARIOS.kh_umpk;
  assert.equal(sc.map, 'kharkiv');
  const kab = sc.salvos.filter(s => s.type === 'kab');
  assert.ok(kab.length > 0 && kab.every(s => s.crpa === 12));
  const names = new Set(sc.objectives.map(o => o.name));
  for (const s of sc.salvos) assert.ok(names.has(s.targetObj), s.targetObj);
  for (const g of sc.goals) assert.ok(names.has(g.target) || sc.defs.some(d => d.name === g.target), g.target);
});
