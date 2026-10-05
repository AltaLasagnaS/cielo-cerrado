// Energía del interceptor (physics/engagement.js, docs/FISICA.md §6–§7): alcance efectivo según el
// aspecto del blanco, Pk según la fracción del alcance y la doctrina "disparar dentro del X%".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFENSES, SCENARIOS } from '../src/data/index.js';
import { setMap, flatMap } from '../src/physics/terrain.js';
import { buildThreat, posAt } from '../src/physics/kinematics.js';
import { solve, calcPk, rangeFactor, energy, energyPk, ENERGY_REF } from '../src/physics/engagement.js';
import { S } from '../src/sim/state.js';
import { applyScenario } from '../src/sim/setup.js';
import { exportScenario, validateScenario, loadScenarioData } from '../src/sim/scenario-io.js';
import { useMap, clearSetup, seeTrack } from './helpers.js';

const unit = (type, x, y) => ({ id: 1, type, x, y, az: 0, mast: DEFENSES[type].radar?.mast ?? 2, alt: DEFENSES[type].alt });
const flat = () => setMap(flatMap(400, 400, 200));   // 80 × 80 km a nivel del mar
/** Kalibr a 50 m en línea recta de a → b. */
const kalibr = (a, b) => buildThreat({ id: 9, type: 'kalibr', count: 1, pts: [a, b], agl: 50 }, 0, 0);
/** Primera solución de tiro probando cada 1 s, como hace el motor (engage corre una vez por segundo). */
function firstSol(u, th, pct = 1) {
  for (let t = 0; t < th.ft; t++) { const sol = solve(u, seeTrack(th, t), t, pct); if (sol) return { ...sol, t }; }
  return null;
}

test('rangeFactor: ×1 de frente, ×0,8 de costado, ×0,6 de cola y creciente con el coseno', () => {
  assert.equal(rangeFactor(1), 1);
  assert.ok(Math.abs(rangeFactor(0) - 0.8) < 1e-12);
  assert.ok(Math.abs(rangeFactor(-1) - 0.6) < 1e-12);
  for (let i = 0; i < 20; i++) assert.ok(rangeFactor(-1 + (i + 1) / 10) > rangeFactor(-1 + i / 10));
});

test('energía por tramos (misiles sin perfil): entera hasta el 75% del alcance, mitad en el borde; energyPk relativa al tiro típico', () => {
  const sm = DEFENSES.hawk.sam;   // sin vmax ni tb
  assert.equal(energy(0.5), 1); assert.equal(energy(0.75), 1);
  assert.ok(Math.abs(energy(1) - 0.5) < 1e-12);
  assert.ok(Math.abs(energyPk(sm, ENERGY_REF) - 1) < 1e-12, 'el tiro típico (90%) no cambia la Pk calibrada');
  assert.equal(energyPk(sm, 0.3), 1.25, 'un tiro corto sube la Pk, con tope ×1,25');
  // decreciente cerca del borde
  for (let f = 0.8; f < 1; f += 0.02) assert.ok(energyPk(sm, f + 0.02) < energyPk(sm, f), `f = ${f.toFixed(2)}`);
  assert.ok(energyPk(sm, 1) < 0.75);
});

test('energía con perfil de motor y planeo: ×1 en el tiro típico, tope ×1,25, decreciente en el planeo', () => {
  for (const k of ['patriot', 'nasams', 's300', 'pantsir']) {
    const sm = DEFENSES[k].sam;
    assert.ok(Math.abs(energyPk(sm, ENERGY_REF) - 1) < 1e-12, k);
    assert.equal(energyPk(sm, 0.05), 1.25, `${k}: con el motor encendido, energía entera`);
    for (let f = 0.8; f < 1; f += 0.02) assert.ok(energyPk(sm, f + 0.02) < energyPk(sm, f), `${k} f = ${f.toFixed(2)}`);
    assert.ok(energyPk(sm, 1) < 1, k);
  }
});

test('solve: de frente el alcance efectivo es el del catálogo; contra un blanco que se aleja, ≈60%', () => {
  flat();
  const u = unit('nasams', 40, 40), maxR = DEFENSES.nasams.sam.maxR;
  const head = firstSol(u, kalibr([0, 40], [40, 40]));
  assert.ok(head, 'de frente tiene que haber solución');
  const kinHead = head.r / head.f;
  assert.ok(kinHead > 0.99 * maxR && kinHead <= maxR + 1e-9, `alcance efectivo de frente ${kinHead}`);
  // blanco que pasa por encima de la batería y se aleja hacia el este
  const tail = firstSol(u, kalibr([39, 40], [79, 40]));
  assert.ok(tail, 'de cola tiene que haber solución');
  const kinTail = tail.r / tail.f;
  assert.ok(kinTail < 0.62 * maxR, `alcance efectivo de cola ${kinTail}`);
  assert.ok(tail.r <= kinTail + 1e-9);
});

test('solve: la doctrina "disparar dentro del X%" acorta el tiro y sube la Pk', () => {
  flat();
  const u = unit('nasams', 40, 40), th = kalibr([0, 40], [40, 40]);
  const full = firstSol(u, th), half = firstSol(u, th, 0.5);
  assert.ok(full && half);
  const launchR = Math.hypot(posAt(th, half.t).x - u.x, posAt(th, half.t).y - u.y);
  assert.ok(launchR <= 0.5 * DEFENSES.nasams.sam.maxR + 1e-9, 'la doctrina retiene el lanzamiento hasta entrar en el umbral');
  assert.ok(half.t > full.t, 'esperar la distancia elegida retrasa el lanzamiento');
  assert.ok(half.r <= 0.5 * (half.r / half.f) + 1e-9, 'el encuentro queda dentro de la mitad del alcance');
  assert.ok(half.t + half.tau > full.t + full.tau, 'se espera a que el blanco se acerque');
  const pkAt = sol => { const tt = sol.t + sol.tau; th.p = posAt(th, tt); return calcPk(u, th, tt, [], sol.f); };
  assert.ok(pkAt(half) > pkAt(full), 'más cerca, más energía');
});

test('calcPk: la energía cuenta para misiles, no para cañones; sin f no cambia nada', () => {
  flat();
  const th = kalibr([0, 40], [40, 40]); th.p = posAt(th, 100);
  const m = unit('nasams', 40, 40), g = unit('gepard', 40, 40);
  assert.ok(calcPk(m, th, 100, [], 0.98) < calcPk(m, th, 100, [], 0.8));
  assert.equal(calcPk(m, th, 100, [], ENERGY_REF), calcPk(m, th, 100, []));
  assert.equal(calcPk(g, th, 100, [], 0.98), calcPk(g, th, 100, [], 0.5));
});

test('rules.fireRange: se guarda, se carga y se valida entre 0,3 y 1', () => {
  useMap('monterey'); clearSetup(); applyScenario(SCENARIOS.mb_noche);
  assert.equal(S.fireRange, 1, 'sin dato en el escenario: todo el alcance');
  S.fireRange = 0.7;
  const file = JSON.parse(JSON.stringify(exportScenario(new Date(0))));
  assert.equal(file.rules.fireRange, 0.7);
  clearSetup(); assert.equal(S.fireRange, 1);
  const res = validateScenario(file); assert.ok(res.ok, res.errors.join('\n'));
  loadScenarioData(res.data); assert.equal(S.fireRange, 0.7);
  file.rules.fireRange = 0.2;
  assert.match(validateScenario(file).errors.join('\n'), /rules.fireRange/);
  clearSetup(); applyScenario({ ...SCENARIOS.mb_noche, rules: { ...SCENARIOS.mb_noche.rules, fireRange: 0.8 } });
  assert.equal(S.fireRange, 0.8);
});
