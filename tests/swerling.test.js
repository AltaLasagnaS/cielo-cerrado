// Fluctuación de la RCS (physics/radar.js, docs/FISICA.md §2): las fórmulas cerradas de Swerling 1 y 3
// (un pulso, detector de ley cuadrática) se verifican contra una integración numérica independiente.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THREATS } from '../src/data/index.js';
import { PFA, THRESH, SNR50, SNR50_3, pdSwerling1, pdSwerling3, pdRel, swerlingOf } from '../src/physics/radar.js';

/** Marcum Q₁(a, b) por la serie de Poisson (independiente de las fórmulas del motor). */
function Q1(a, b) {
  const x = a * a / 2, y = b * b / 2; let s = 0, pk = Math.exp(-x), cdf = 0, pj = Math.exp(-y);
  for (let k = 0; k < 4000; k++) { cdf += pj; s += pk * cdf; pk *= x / (k + 1); pj *= y / (k + 1); if (k > x + 60 && pk < 1e-18) break; }
  return Math.min(1, s);
}
/** Pd de un blanco fijo con SNR s y umbral T = −ln(PFA). */
const pdFixed = s => Q1(Math.sqrt(2 * s), Math.sqrt(2 * THRESH));
/** ∫ Pd(s)·pdf(s) ds con la regla del trapecio en [0, 30·S]. */
function average(pdf, S, N = 3000) {
  const h = 30 * S / N; let acc = 0;
  for (let i = 0; i <= N; i++) acc += (i === 0 || i === N ? 0.5 : 1) * pdFixed(i * h) * pdf(i * h, S);
  return acc * h;
}
const chi2 = (s, S) => Math.exp(-s / S) / S;                       // Swerling 1: χ² de 2 g. l.
const chi4 = (s, S) => 4 * s / (S * S) * Math.exp(-2 * s / S);    // Swerling 3: χ² de 4 g. l.

test('Swerling 1 y 3: la fórmula cerrada coincide con la integración numérica', () => {
  assert.equal(THRESH, -Math.log(PFA));
  for (const S of [2, 8, 15, 30, 60]) {
    assert.ok(Math.abs(pdSwerling1(S) - average(chi2, S)) < 1e-3, `Swerling 1, SNR ${S}`);
    assert.ok(Math.abs(pdSwerling3(S) - average(chi4, S)) < 1e-3, `Swerling 3, SNR ${S}`);
  }
});

test('el alcance del catálogo es el de Pd 50% en los dos modelos', () => {
  assert.ok(Math.abs(pdSwerling1(SNR50) - 0.5) < 1e-9);
  assert.ok(Math.abs(pdSwerling3(SNR50_3) - 0.5) < 1e-9);
  assert.equal(pdRel(1, 1).toFixed(6), '0.500000'); assert.equal(pdRel(3, 1).toFixed(6), '0.500000');
});

test('Swerling 3 titila menos: mejor de cerca, peor de lejos', () => {
  for (const q of [0.3, 0.5, 0.8]) assert.ok(pdRel(3, q ** -4) > pdRel(1, q ** -4), `r/R = ${q}`);
  assert.ok(pdRel(3, 1.2 ** -4) < pdRel(1, 1.2 ** -4));
  for (let q = 0.3; q < 1.5; q += 0.05) assert.ok(pdRel(3, q ** -4) >= pdRel(3, (q + 0.05) ** -4), 'decreciente con la distancia');
});

test('los balísticos usan Swerling 3; el resto, Swerling 1', () => {
  for (const [k, T] of Object.entries(THREATS)) {
    const want = T.cls === 'balistico' || T.cls === 'hiper' ? 3 : 1;
    assert.equal(swerlingOf({ T }), want, k);
  }
});
