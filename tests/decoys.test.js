// Clasificación de señuelos (physics/decoys.js) y doctrina "no tirarle a pistas clasificadas como
// señuelo". Ver docs/FISICA.md §6.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify, classifyGain, DECOY_HARD } from '../src/physics/decoys.js';
import { S } from '../src/sim/state.js';
import { addDef, addSalvo } from '../src/sim/setup.js';
import { useMap, clearSetup, runCurrent } from './helpers.js';

test('sin seguimiento no clasifica; un radar VHF o L nunca suma', () => {
  assert.equal(classify({ clsT: 0, clsTau: 18, phase: 1 }), null);
  assert.equal(classifyGain({ band: 'VHF', scan: 6 }), 0);
  assert.equal(classifyGain({ band: 'L', scan: 4 }), 0);
  assert.equal(classifyGain({ band: 'X', scan: 2 }), 2);
});

test('la fracción de pistas clasificadas crece con el tiempo de seguimiento; los señuelos del Iskander cuestan más', () => {
  const frac = (t, child) => {
    let k = 0; for (let i = 0; i < 2000; i++) if (classify({ clsT: t, clsTau: 18, phase: i * 0.0031, isDecoy: true, isDecoyChild: child })) k++;
    return k / 2000;
  };
  assert.ok(frac(5, false) < frac(20, false) && frac(20, false) < frac(60, false));
  assert.ok(Math.abs(frac(18, false) - (1 - Math.exp(-1))) < 0.05);
  assert.ok(frac(18 * DECOY_HARD, true) > 0.55 && frac(18, true) < frac(18, false));
});

test('un señuelo se clasifica como señuelo; un arma real casi siempre como arma (≈3% de error)', () => {
  let wrong = 0, n = 0;
  for (let i = 0; i < 3000; i++) {
    const c = classify({ clsT: 1000, clsTau: 18, phase: i * 0.0021 }); if (c) { n++; if (c === 'señuelo') wrong++; }
    assert.equal(classify({ clsT: 1000, clsTau: 18, phase: i * 0.0021, isDecoy: true }), 'señuelo');
  }
  assert.ok(wrong / n > 0.01 && wrong / n < 0.06, String(wrong / n));
});

test('doctrina: con "no tirarle a señuelos" se gastan menos interceptores en Gerbera', () => {
  const run = ignore => {
    useMap('monterey', { flat: true }); clearSetup(); S.ignoreDecoys = ignore;
    addDef('irist', 50, 60, { name: 'I' }); addDef('ewr', 50, 58, { name: 'R' });
    addSalvo({ type: 'gerbera', count: 10, interval: 15, agl: 1000, pts: [[0, 60], [49, 60]] });
    runCurrent(4); return S.stats.byUnit.I || 0;
  };
  const a = run(false), b = run(true);
  assert.ok(b < a, `sin doctrina ${a}, con doctrina ${b}`);
});
