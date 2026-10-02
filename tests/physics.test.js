// Pruebas de los modelos físicos: cada una verifica una propiedad que el modelo debe cumplir
// (no un número mágico), así sirven de documentación ejecutable de docs/FISICA.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THREATS, DEFENSES, UNC, sampleU } from '../src/data/index.js';
import { KR, HORIZON_K } from '../src/physics/constants.js';
import { setMap, flatMap, elev, los, MAP } from '../src/physics/terrain.js';
import { rcsAt, detR, horizon, jamJ, inSector } from '../src/physics/radar.js';
import { buildThreat, posAt, sAt } from '../src/physics/kinematics.js';
import { solve, calcPk } from '../src/physics/engagement.js';
import { seeded } from '../src/util/rng.js';
import { azOf, angDiff } from '../src/util/math.js';

setMap(flatMap(400, 400, 200)); // 80 × 80 km a nivel del mar
const unit = (type, x, y, o = {}) => ({ id: 1, type, x, y, az: 0, mast: DEFENSES[type].radar?.mast ?? 2, alt: DEFENSES[type].alt, ...o });

test('geometría: azimut 0° = norte y horario', () => {
  assert.equal(azOf(0, -1), 0);   // y crece hacia el sur
  assert.equal(azOf(1, 0), 90);
  assert.equal(azOf(0, 1), 180);
  assert.equal(azOf(-1, 0), 270);
  assert.equal(angDiff(350, 10), 20);
});

test('horizonte: coeficiente coherente con la Tierra 4/3', () => {
  assert.ok(Math.abs(HORIZON_K - Math.sqrt(2 * KR) / 1000) < 0.01);
  // mástil de 10 m contra blanco a 50 m: ≈ 42 km (lo que dice la ficha del Kh-101)
  assert.ok(Math.abs(horizon(10, 50) - 42.1) < 0.2);
});

test('línea de vista sobre mar plano: corta justo en el horizonte (con margen de 4 m)', () => {
  // radar a 10 m, blanco a 50 m: el horizonte geométrico con margen de 4 m sobre la superficie
  const hz = HORIZON_K * (Math.sqrt(10 - 4) + Math.sqrt(50 - 4));
  assert.equal(los(5, 40, 10, 5 + hz * 0.95, 40, 50), true);
  assert.equal(los(5, 40, 10, 5 + Math.min(hz * 1.1, 74), 40, 50), false);
});

test('terreno: interpolación bilineal y mar fuera del mapa', () => {
  const m = flatMap(10, 10, 1000); m.data[5 * 10 + 5] = 100; setMap(m);
  assert.equal(elev(5.5, 5.5), 100);           // centro de la celda
  assert.equal(elev(6, 5.5), 50);               // a mitad de camino hacia la vecina
  assert.equal(elev(-1, 5), -10);               // fuera del mapa
  setMap(flatMap(400, 400, 200));
  assert.equal(MAP.wKm, 80);
});

test('radar: R ∝ σ^¼ (16 veces más RCS → el doble de alcance)', () => {
  const u = unit('ewr', 10, 10);
  const r1 = detR(u, { rcs: 0.1, cls: 'crucero' }, 0);
  const r16 = detR(u, { rcs: 1.6, cls: 'crucero' }, 0);
  assert.ok(Math.abs(r16 / r1 - 2) < 1e-9);
  assert.equal(detR(u, { rcs: 1, cls: 'crucero' }, 0), DEFENSES.ewr.radar.R1);
});

test('radar: la interferencia reduce el alcance como (1/(1+J))^¼', () => {
  const u = unit('ewr', 10, 10), th = { rcs: 1, cls: 'crucero' };
  assert.ok(Math.abs(detR(u, th, 15) / detR(u, th, 0) - 0.5) < 1e-9);
});

test('RCS por banda: VHF agranda blancos furtivos, el resto respeta el frontal', () => {
  const kh = THREATS.kh101;
  assert.equal(rcsAt(kh, 'X'), kh.rcs);
  assert.equal(rcsAt(kh, 'S'), kh.rcs);
  assert.ok(rcsAt(kh, 'VHF') > 10 * rcsAt(kh, 'X'));
  assert.equal(rcsAt({ rcs: 0.1, lo: true }, 'VHF'), 0.1 * 12); // regla genérica sin rcsVHF
});

test('sectores: Patriot ve 90° hacia su orientación; AEW lateral ve los costados', () => {
  const p = unit('patriot', 0, 0, { az: 0 });
  assert.equal(inSector(p, 40), true);
  assert.equal(inSector(p, 60), false);
  const aew = unit('aew_s340', 0, 0, { az: 0 });      // vuela hacia el norte
  assert.equal(inSector(aew, 90), true);               // costado derecho
  assert.equal(inSector(aew, 0), false);               // proa: zona ciega
});

test('interferencia: el lóbulo principal pega mucho más que los laterales', () => {
  const u = unit('ewr', 40, 40);
  const jam = [{ type: 'krasukha2', x: 40, y: 25, on: true }];   // 15 km al norte, banda S
  const main = jamJ(u, 0, jam), side = jamJ(u, 90, jam);
  assert.ok(main > 0 && main / side > 100);
  assert.equal(jamJ(unit('acoustic', 40, 40), 0, jam), 0);      // acústico: inmune
});

test('interferencia: un jammer terrestre detrás del horizonte no afecta', () => {
  // mástiles de 10 m (radar) y 6 m (jammer): horizonte ≈ 4,12·(√10+√6) ≈ 23 km
  const u = unit('ewr', 40, 40);
  assert.equal(jamJ(u, 0, [{ type: 'krasukha2', x: 40, y: 10, on: true }]), 0);   // a 30 km
});

test('cinemática: el balístico pasa por su apogeo a mitad de camino y llega al blanco', () => {
  const sv = { id: 1, type: 'isk_m', count: 1, pts: [[40, 0], [40, 40]], launchDist: 300 };
  const th = buildThreat(sv, 0, 0);
  assert.ok(Math.abs(th.L - 300) < 1e-9);
  const tMid = th.ft / 2;
  assert.ok(Math.abs(sAt(th, tMid) - 150) < 1e-6);
  assert.ok(Math.abs(posAt(th, tMid).z - THREATS.isk_m.apogee * 1000) < 1);
  assert.equal(posAt(th, th.ft + 1), null);
  assert.ok(Math.abs(th.ft - 300000 / THREATS.isk_m.v) < 1e-6);
});

test('intercepción: el interceptor llega al punto de encuentro a tiempo y dentro de la envolvente', () => {
  const u = unit('nasams', 40, 40);
  const sv = { id: 2, type: 'kalibr', count: 1, pts: [[0, 40], [40, 40]], agl: 50 };
  const th = buildThreat(sv, 0, 0);
  const sol = solve(u, th, 0);
  assert.ok(sol, 'tiene que haber solución');
  assert.ok(sol.r <= DEFENSES.nasams.sam.maxR && sol.r >= DEFENSES.nasams.sam.minR);
  assert.ok(sol.r * 1000 / DEFENSES.nasams.sam.vInt <= sol.tau);
});

test('Pk: maniobra terminal y baja firma la reducen; nunca supera 0,98', () => {
  const u = unit('patriot', 40, 40);
  const sv = { id: 3, type: 'isk_m', count: 1, pts: [[40, 0], [40, 40]], launchDist: 300, maneuver: true };
  const th = buildThreat(sv, 0, 0);
  const tLate = th.ft - 5; th.p = posAt(th, tLate);
  const pkMan = calcPk(u, th, tLate, []);
  th.maneuver = false;
  const pkFlat = calcPk(u, th, tLate, []);
  assert.ok(pkMan < pkFlat);
  assert.ok(pkFlat <= 0.98);
});

test('incertidumbre: el muestreo triangular queda en [min, max] y su moda es el probable', () => {
  const rng = seeded(7), u = UNC.thr.shahed.rcs;
  const xs = Array.from({ length: 4000 }, () => sampleU(u, rng));
  assert.ok(xs.every(x => x >= u.min && x <= u.max));
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  assert.ok(Math.abs(mean - (u.min + u.p + u.max) / 3) < 0.005);   // media de la triangular
});
