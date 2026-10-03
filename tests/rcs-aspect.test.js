// RCS según el aspecto (physics/radar.js#aspectFactor, aspectCos): propiedades del modelo y su efecto
// en una corrida. Ver docs/FISICA.md §3.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THREATS, DEFENSES, UNC } from '../src/data/index.js';
import { rcsAt, aspectFactor, aspectCos, detR } from '../src/physics/radar.js';
import { S } from '../src/sim/state.js';
import { addDef, addSalvo } from '../src/sim/setup.js';
import { useMap, clearSetup, runCurrent } from './helpers.js';

const T = { rcs: 0.05, rcsSide: 1, rcsRear: 0.1, cls: 'dron' };
const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(b));

test('aspecto: de frente, de costado y de cola dan exactamente los valores del catálogo', () => {
  for (const band of ['S', 'C', 'X']) {
    assert.equal(rcsAt(T, band, 1), T.rcs);
    assert.ok(close(rcsAt(T, band, 0), T.rcsSide));
    assert.ok(close(rcsAt(T, band, -1), T.rcsRear));
  }
});

test('aspecto: sin datos de costado ni de cola no cambia nada (neutralidad)', () => {
  const plain = { rcs: 0.3, cls: 'crucero' };
  for (const ca of [1, 0.7, 0, -0.4, -1]) for (const band of ['VHF', 'L', 'S', 'X', 'Ku']) assert.equal(rcsAt(plain, band, ca), rcsAt(plain, band));
});

test('aspecto: entre el frente y el costado la RCS crece de forma monótona', () => {
  let prev = 0;
  for (let deg = 0; deg <= 90; deg += 5) {
    const v = rcsAt(T, 'X', Math.cos(deg * Math.PI / 180));
    assert.ok(v >= prev - 1e-12, `${deg}°`); prev = v;
  }
});

test('aspecto: en bandas bajas (VHF, L) el contraste es la mitad en decibeles', () => {
  const hi = aspectFactor(T, 'X', 0), lo = aspectFactor(T, 'VHF', 0);
  assert.ok(close(lo, Math.sqrt(hi)));
  assert.ok(close(aspectFactor(T, 'L', -1), Math.sqrt(aspectFactor(T, 'C', -1))));
});

test('aspecto: de costado un radar detecta más lejos (R ∝ σ^¼)', () => {
  const u = { id: 1, type: 'pantsir', x: 0, y: 0, mast: 10 };
  const front = detR(u, T, 0, 1), side = detR(u, T, 0, 0);
  assert.ok(close(side / front, Math.pow(T.rcsSide / T.rcs, 0.25)));
  assert.equal(front, DEFENSES.pantsir.radar.R1 * Math.pow(T.rcs, 0.25));
});

test('aspecto: el coseno sale de la velocidad del blanco y la línea hacia el radar', () => {
  const th = { p: { x: 10, y: 10, z: 1000 }, vel: [100, 0, 0] };          // vuela hacia el este
  assert.ok(close(aspectCos(th, 20, 10, 1000), 1));                      // radar adelante: de frente
  assert.ok(close(aspectCos(th, 0, 10, 1000), -1));                      // radar atrás: de cola
  assert.ok(Math.abs(aspectCos(th, 10, 0, 1000)) < 1e-12);                // radar al norte: de costado
  assert.equal(aspectCos({ p: th.p }, 0, 0, 0), 1);                       // sin velocidad: frente
});

test('catálogo: cada amenaza tiene frente, costado y cola con rango y fuente o razonamiento', () => {
  for (const [k, t] of Object.entries(THREATS)) {
    for (const f of ['rcs', 'rcsSide', 'rcsRear', 'rcsVHF']) {
      assert.ok(t[f] > 0, `${k}.${f}`);
      const u = UNC.thr[k][f]; assert.ok(u, `UNC.thr.${k}.${f}`);
      assert.ok(u.src.length || u.nota, `${k}.${f}: sin fuente ni razonamiento`);
    }
  }
});

test('corrida: un radar al costado de la ruta detecta antes que si la RCS fuera solo la frontal', () => {
  // Pantsir (S, 30 km contra 1 m²) a 9 km al costado de una ruta recta de Shahed sobre mar plano
  const firstDet = sideOn => {
    const t0 = [];
    for (let seed = 1; seed <= 6; seed++) {
      useMap('monterey', { flat: true }); clearSetup();
      addDef('pantsir', 45, 69, { name: 'P' });
      addSalvo({ type: 'shahed', count: 1, interval: 0, agl: 1500, pts: [[5, 60], [85, 60]] });
      const saved = { ...THREATS.shahed };
      if (!sideOn) Object.assign(THREATS.shahed, { rcsSide: THREATS.shahed.rcs, rcsRear: THREATS.shahed.rcs });
      try { runCurrent(seed); } finally { Object.assign(THREATS.shahed, saved); }
      const th = S.threats.find(t => t.type === 'shahed'); assert.ok(th.firstDet !== null, 'nunca detectado');
      t0.push(th.firstDet);
    }
    return t0.reduce((a, b) => a + b, 0) / t0.length;
  };
  const withAspect = firstDet(true), frontOnly = firstDet(false);
  assert.ok(withAspect < frontOnly - 30, `con aspecto ${withAspect.toFixed(0)} s, solo frente ${frontOnly.toFixed(0)} s`);
});
