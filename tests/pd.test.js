// Probabilidad de detección por SNR con Swerling 1, clutter y notch Doppler (physics/radar.js).
// Ver docs/FISICA.md §2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pdSwerling1, pdScan, clutterLossDb, inNotch, SNR50, PFA, PD_CUTOFF } from '../src/physics/radar.js';
import { setRandom, seeded, rnd } from '../src/util/rng.js';
import { useMap } from './helpers.js';

const pdAt = f => pdSwerling1(SNR50 / Math.pow(f, 4));   // Pd a r = f·R sin pérdidas

test('Swerling 1: Pd = 50% en el alcance del catálogo, monótona, 1 cerca y 0 lejos', () => {
  assert.ok(Math.abs(pdAt(1) - 0.5) < 1e-12);
  let prev = 1;
  for (let f = 0.1; f <= 2; f += 0.05) { const p = pdAt(f); assert.ok(p <= prev + 1e-12); prev = p; }
  assert.ok(pdAt(0.3) > 0.98 && pdAt(3) < 0.01);
  assert.ok(Math.abs(pdAt(0.8) - 0.75) < 0.02 && Math.abs(pdAt(1.2) - 0.26) < 0.02);
  assert.ok(Math.pow(PFA * 0.01, 1 / (1 + SNR50)) < 0.5, 'con PFA más chica, menos Pd');
});

test('Swerling 1: en 10.000 sorteos con semilla, la frecuencia a r = R está entre 48% y 52%', () => {
  setRandom(seeded(11)); let k = 0;
  try { for (let i = 0; i < 10000; i++) if (rnd() < pdAt(1)) k++; } finally { setRandom(null); }
  assert.ok(k > 4800 && k < 5200, String(k));
});

test('clutter: nada a 5.000 m; rasante pierde más sin filtro que con pulso-Doppler y más en terreno quebrado', () => {
  useMap('kyiv');
  const none = { mti: 'none' }, pd = { mti: 'pd' };
  assert.equal(clutterLossDb(pd, 5000, 40, 60), 0);
  assert.ok(clutterLossDb(none, 30, 40, 60) > clutterLossDb(pd, 30, 40, 60));
  assert.ok(clutterLossDb(none, 30, 40, 60) > clutterLossDb(none, 250, 40, 60));
  useMap('monterey', { flat: true });
  const flat = clutterLossDb(none, 30, 40, 60);
  assert.ok(flat > 0 && flat <= 20);
});

test('notch Doppler: de costado lo pierde un radar pulso-Doppler, no uno sin filtro', () => {
  const th = { vel: [100, 0, 0] };
  assert.equal(inNotch({ mti: 'pd' }, th, 0), true);
  assert.equal(inNotch({ mti: 'pd' }, th, 0.5), false);
  assert.equal(inNotch({ mti: 'none' }, th, 0), false);
});

test('pdScan: corta más allá de 1,2·R y aplica notch y clutter', () => {
  useMap('monterey', { flat: true });
  const u = { id: 1, type: 'patriot', x: 0, y: 0 }, th = { vel: [200, 0, 0] };
  assert.equal(pdScan(u, th, PD_CUTOFF * 50 + 0.1, 50, 5000, 10, 10, 1), 0);
  assert.equal(pdScan(u, th, 20, 50, 5000, 10, 10, 0), 0);            // notch
  assert.ok(pdScan(u, th, 45, 50, 20, 10, 10, 1) < pdScan(u, th, 45, 50, 5000, 10, 10, 1));   // clutter
});
