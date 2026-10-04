// Unidades nuevas: bomba planeadora (perfil glide) y defensas viejas que usa Ucrania (Hawk, S-125,
// S-200). Ver docs/FISICA.md §5 y docs/CATALOGO.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THREATS } from '../src/data/index.js';
import { buildThreat, posAt } from '../src/physics/kinematics.js';
import { calcPk } from '../src/physics/engagement.js';
import { S } from '../src/sim/state.js';
import { addDef, addSalvo } from '../src/sim/setup.js';
import { useMap, clearSetup, runCurrent } from './helpers.js';

test('planeadora: se suelta a su altura fuera del mapa y baja sin subir nunca hasta el suelo', () => {
  useMap('monterey', { flat: true }); clearSetup();
  const sv = addSalvo({ type: 'kab', count: 1, pts: [[50, 0], [50, 60]] });
  const th = buildThreat(sv, 0, 0);
  assert.ok(th.L > 55, `ruta ${th.L} km (lanzada desde fuera del mapa)`);
  let prev = Infinity;
  for (let t = 0; t < th.ft; t += 5) { const p = posAt(th, t); if (!p) break; assert.ok(p.z <= prev + 1e-6, `sube en t=${t}`); prev = p.z; }
  assert.ok(Math.abs(posAt(th, 0.01).z - THREATS.kab.cruiseAlt) < 50);
  assert.ok(posAt(th, th.ft - 0.5).z < 200);
  assert.ok(Math.abs(th.ft - th.L * 1000 / THREATS.kab.v) < 1, 'velocidad constante');
});

/** Tres noches (semillas 3–5) de una defensa contra una salva; suma disparos y derribos. */
const fight = (def, threat, opts) => {
  let shots = 0, killed = 0;
  for (const seed of [3, 4, 5]) {
    useMap('monterey', { flat: true }); clearSetup();
    addDef(def, 50, 60, { name: 'D', az: 0 }); addDef('ewr', 50, 58, { name: 'R' });
    addSalvo({ type: threat, count: 3, interval: 40, pts: [[50, 0], [50, 61]], ...opts });
    runCurrent(seed); shots += S.stats.byUnit.D || 0; killed += S.stats.killed;
  }
  return { shots, killed };
};

test('Hawk y S-125 enfrentan misiles de crucero; el S-200 no baja de 300 m', () => {
  assert.equal(fight('hawk', 'kalibr', { agl: 50 }).shots, 0);    // piso del Hawk: 60 m (CMO)
  assert.ok(fight('hawk', 'kalibr', { agl: 120 }).shots > 0);
  assert.ok(fight('s125', 'kalibr').shots > 0);
  assert.equal(fight('s200', 'kalibr', { agl: 50 }).shots, 0);
  assert.ok(fight('s200', 'shahed', { agl: 2500 }).shots > 0);
});

test('Patriot puede interceptar una planeadora; para un buscador IR es un blanco frío', () => {
  assert.ok(fight('patriot', 'kab').shots > 0);
  useMap('monterey', { flat: true }); clearSetup();
  const th = buildThreat(addSalvo({ type: 'kab', count: 1, pts: [[50, 0], [50, 61]] }), 0, 0); th.p = posAt(th, th.ft - 5);
  const u = { id: 9, type: 'manpads', x: 50, y: 60 };
  const cold = calcPk(u, th, 0, []), warm = calcPk(u, { ...th, T: { ...THREATS.kab, cold: false } }, 0, []);
  assert.ok(Math.abs(cold - warm * 0.3) < 1e-9, `${cold} vs ${warm}`);
});
