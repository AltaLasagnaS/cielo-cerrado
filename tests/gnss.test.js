// Navegación bajo guerra electrónica GNSS (physics/navigation.js): engaño, corrección por terreno y
// buscador terminal. Ver docs/FISICA.md §4.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THREATS, JAMMERS } from '../src/data/index.js';
import { gnssNavError } from '../src/physics/navigation.js';
import { setRandom, seeded } from '../src/util/rng.js';

const many = (T, J, n = 400) => { setRandom(seeded(5)); try { return Array.from({ length: n }, () => gnssNavError(T, J)); } finally { setRandom(null); } };
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;

test('el engaño (Pokrova) desvía kilómetros a un Shahed, que no tiene corrección ni buscador', () => {
  const r = many(THREATS.shahed, JAMMERS.pokrova);
  assert.ok(r.every(x => x.spoofed && !x.corrected));
  const km = mean(r.map(x => x.err)) / 1000;
  assert.ok(km > 2 && km < 3, `${km.toFixed(2)} km`);   // (1 − 0,5)·5·(0,5 + U) → media 2,5 km
});

test('el Kh-101 descarta el engaño con su corrección de terreno y casi siempre corrige con el buscador', () => {
  const r = many(THREATS.kh101, JAMMERS.pokrova);
  assert.ok(r.every(x => x.rejected && !x.spoofed));
  assert.ok(r.every(x => x.err <= (1 - THREATS.kh101.gnss) * 1800));
  const fixed = r.filter(x => x.corrected).length / r.length;
  assert.ok(fixed > 0.85 && fixed < 0.95, String(fixed));
});

test('sin buscador terminal ni corrección (ATACMS) la interferencia deja el error inercial', () => {
  const r = many(THREATS.atacms, JAMMERS.gnss);
  assert.ok(r.every(x => !x.corrected && !x.rejected && x.err >= 0.4 * 300 && x.err <= 0.4 * 1800));
});

test('un error más grande que la ventana del buscador no se corrige', () => {
  const T = { ...THREATS.isk_m, gnss: 0, seekerKm: 0.1 };      // error 300–1.800 m contra ventana de 100 m
  assert.ok(many(T, JAMMERS.gnss).every(x => !x.corrected && x.err >= 300));
});

test('reproducibilidad: un número al azar por arma, y otro solo si el buscador entra en juego', () => {
  let calls = 0; setRandom(() => { calls++; return 0.5; });
  try {
    gnssNavError(THREATS.shahed, JAMMERS.pokrova); assert.equal(calls, 1);
    gnssNavError(THREATS.kh101, JAMMERS.pokrova); assert.equal(calls, 3);
  } finally { setRandom(null); }
});
