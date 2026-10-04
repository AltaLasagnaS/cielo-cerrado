// Perfil de velocidad del interceptor (physics/interceptor.js, docs/FISICA.md §6): motor y planeo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFENSES, UNC } from '../src/data/index.js';
import { distAt, velAt, timeTo, solveTd, profileOf, hasProfile, energyAt } from '../src/physics/interceptor.js';
import { setMap, flatMap } from '../src/physics/terrain.js';
import { buildThreat } from '../src/physics/kinematics.js';
import { solve } from '../src/physics/engagement.js';

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('perfil: timeTo es la inversa de distAt y la velocidad es la derivada de la distancia', () => {
  const P = { tb: 8, vmax: 1400, td: 30 };
  for (const t of [0.5, 4, 8, 12, 40, 120]) {
    close(timeTo(P, distAt(P, t)), t, 1e-9, `t = ${t}`);
    const h = 1e-4; close((distAt(P, t + h) - distAt(P, t - h)) / (2 * h), velAt(P, t), 1e-2, `v(${t})`);
  }
  assert.equal(velAt(P, 8), 1400, 'velocidad máxima al apagarse el motor');
  assert.ok(velAt(P, 60) < velAt(P, 20), 'pierde velocidad planeando');
});

test('perfil: con τd infinito y tb = 0 es la velocidad constante de antes', () => {
  const P = { tb: 0, vmax: 900, td: Infinity };
  for (const d of [1000, 10000, 35000]) close(timeTo(P, d), d / 900, 1e-12, `d = ${d}`);
  const sm = DEFENSES.hawk.sam;   // sin vmax ni tb
  assert.ok(!hasProfile(sm));
  close(timeTo(profileOf(sm), 30000), 30000 / sm.vInt, 1e-12, 'Hawk');
});

test('perfil: el tiempo de vuelo crece más rápido que lineal en el planeo', () => {
  const P = profileOf(DEFENSES.nasams.sam), sb = P.vmax * P.tb / 2;
  let prev = null;
  for (let d = sb + 2000; d < 35000; d += 3000) {
    const step = timeTo(P, d + 3000) - timeTo(P, d);
    if (prev !== null) assert.ok(step > prev, `d = ${d}`);
    prev = step;
  }
});

test('catálogo: cada perfil llega al alcance máximo en maxR / vInt, con vmax > vInt y rango en UNC', () => {
  let n = 0;
  for (const [k, d] of Object.entries(DEFENSES)) {
    const sm = d.sam; if (!sm || !hasProfile(sm)) continue;
    n++;
    assert.ok(sm.vmax > sm.vInt, `${k}: vmax ${sm.vmax} ≤ vInt ${sm.vInt}`);
    const P = profileOf(sm);
    assert.ok(Number.isFinite(P.td) && P.td > 0, `${k}: τd ${P.td}`);
    const T = sm.maxR * 1000 / sm.vInt;
    close(timeTo(P, sm.maxR * 1000), T, 1e-6 * T, k);
    assert.ok(energyAt(P, sm.maxR * 1000) < 1, `${k}: llega al borde planeando`);
    assert.ok(UNC.def[k]?.['sam.vmax'] && UNC.def[k]?.['sam.tb'], `${k}: vmax y tb con rango en UNC`);
  }
  assert.ok(n >= 10, `${n} perfiles`);
});

test('solveTd: sin solución (vmax demasiado baja) vuela sin frenar', () => {
  assert.equal(solveTd(10, 500, 40000, 40000 / 600), Infinity);
  assert.equal(solveTd(60, 2000, 40000, 40000 / 900), Infinity, 'motor encendido todo el vuelo hasta R');
  const td = solveTd(10, 1400, 40000, 40000 / 900);
  close(distAt({ tb: 10, vmax: 1400, td }, 40000 / 900), 40000, 1e-6, 'llega a R en T');
});

test('solve: contra un blanco que se aleja el encuentro queda más cerca que contra uno que se acerca', () => {
  setMap(flatMap(400, 400, 200));
  const u = { id: 1, type: 'nasams', x: 40, y: 40, az: 0, mast: 2 };
  const kal = (a, b) => buildThreat({ id: 9, type: 'kalibr', count: 1, pts: [a, b], agl: 50 }, 0, 0);
  const first = th => { for (let t = 0; t < th.ft; t++) { const s = solve(u, th, t); if (s) return s; } return null; };
  const head = first(kal([0, 40], [40, 40])), tail = first(kal([39, 40], [79, 40]));
  assert.ok(head && tail);
  assert.ok(tail.r < head.r, `de cola ${tail.r} km, de frente ${head.r} km`);
});
