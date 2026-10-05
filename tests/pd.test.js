// Probabilidad de detección por SNR con Swerling 1, clutter y notch Doppler (physics/radar.js).
// Ver docs/FISICA.md §2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pdSwerling1, pdScan, inNotch, SNR50, PFA, PD_CUTOFF } from '../src/physics/radar.js';
import { clutterRcs, seaSigma0Db, improvement, rainEta } from '../src/physics/clutter.js';
import { DEFENSES, WEATHER } from '../src/data/index.js';
import { surf } from '../src/physics/terrain.js';
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

test('clutter de mar NRL: coincide con la tabla de Barton (±4 dB) y crece con el estado del mar y el ángulo', () => {
  // Barton (Radar Handbook, tabla 15.2): estado 4, banda X, 1° → −42,5 dB
  assert.ok(Math.abs(seaSigma0Db(9.5, 1, 4) - -42.5) < 4, String(seaSigma0Db(9.5, 1, 4)));
  assert.ok(seaSigma0Db(9.5, 1, 5) > seaSigma0Db(9.5, 1, 3));
  assert.ok(seaSigma0Db(9.5, 3, 3) > seaSigma0Db(9.5, 0.3, 3));
});

test('clutter de mar NRL: el punto publicado por MathWorks (H, estado 2, 30 GHz, 10°) da −36,6645 dB', () => {
  assert.ok(Math.abs(seaSigma0Db(30, 10, 2, 'H') - -36.6644895) < 1e-6, String(seaSigma0Db(30, 10, 2, 'H')));
});

test('lluvia: η de Barton a 4 mm/h coincide con su tabla (banda X ≈ 5·10⁻⁷ m⁻¹)', () => {
  const e = rainEta(4, 0.032); assert.ok(e > 4e-7 && e < 6.5e-7, String(e));
  assert.equal(rainEta(0, 0.032), 0);
});

test('factor de mejora: sin filtro 1; el MTI rinde menos contra mar y lluvia que contra suelo; PD el techo', () => {
  const buk = DEFENSES.buk.radar;
  assert.equal(improvement({ mti: 'none', band: 'X' }, 0.1), 1);
  assert.ok(improvement(buk, 0.1) > improvement(buk, 0.9) && improvement(buk, 0.9) > improvement(buk, 2));
  assert.ok(improvement(DEFENSES.patriot.radar, 2) >= improvement(buk, 0.1));
});

test('clutter de superficie: solo rasante, solo si el radar ve el suelo, y menos con pulso-Doppler', () => {
  useMap('monterey', { flat: true });
  const none = { band: 'X', mti: 'none' }, pd = { band: 'X', mti: 'pd' };
  const low = clutterRcs(none, 0, 0, 10, 4, 20, 4, 0, WEATHER.despejado).surface;
  assert.ok(low > 0);
  assert.equal(clutterRcs(none, 0, 0, 10, 4, 3000, 4, 0, WEATHER.despejado).surface, 0, 'alto: fuera del haz');
  assert.equal(clutterRcs(none, 0, 0, 10, 30, 20, 30, 0, WEATHER.despejado).surface, 0, 'suelo detrás del horizonte');
  assert.ok(clutterRcs(pd, 0, 0, 10, 4, 20, 4, 0, WEATHER.despejado).surface < low / 1e4);
  assert.ok(clutterRcs(none, 0, 0, 10, 4, 1500, 4, 0, WEATHER.tormenta).rain > 0, 'la lluvia rodea al blanco aunque vuele fuera del clutter de suelo');
  assert.equal(clutterRcs(none, 0, 0, 10, 4, 5000, 4, 0, WEATHER.tormenta).rain, 0, 'arriba de la lluvia');
});

test('clutter de suelo: con un mástil de 10 m el radar ve buena parte del suelo cercano (la línea de vista llega a árboles y edificios)', () => {
  // Con el rayo apuntado a 2 m del suelo, el margen de la línea de vista (LOS_MARGIN = 4 m) lo tapaba casi
  // siempre: 37 de 624 celdas en vez de 114. La prueba fija el criterio correcto.
  useMap('kyiv');
  const uz = surf(40, 60) + 10; let seen = 0;
  for (let x = 34; x <= 46; x += 0.5) for (let y = 54; y <= 66; y += 0.5) {
    const rr = Math.hypot(x - 40, y - 60); if (rr < 0.3 || surf(x, y) <= 0) continue;
    if (clutterRcs({ band: 'X', mti: 'none' }, 40, 60, uz, rr, 5, x, y, WEATHER.despejado).surface > 0) seen++;
  }
  assert.ok(seen >= 90, 'celdas con clutter de suelo: ' + seen);
});

test('notch Doppler: de costado lo pierde un radar pulso-Doppler, no uno sin filtro', () => {
  const th = { vel: [100, 0, 0] };
  assert.equal(inNotch({ mti: 'pd' }, th, 0), true);
  assert.equal(inNotch({ mti: 'pd' }, th, 0.5), false);
  assert.equal(inNotch({ mti: 'none' }, th, 0), false);
});

test('pdScan: corta más allá de PD_CUTOFF·R (rendimiento) y aplica notch y clutter', () => {
  useMap('monterey', { flat: true });
  const u = { id: 1, type: 'patriot', x: 0, y: 0 }, th = { vel: [200, 0, 0] };
  assert.equal(pdScan(u, th, PD_CUTOFF * 50 + 0.1, 50, 5000, 10, 10, 1), 0);
  assert.equal(pdScan(u, th, 20, 50, 5000, 10, 10, 0), 0);            // notch
  const t1 = { ...th, rcs: 0.01 };
  assert.ok(pdScan(u, t1, 5, 50, 10, 3, 4, 1) < pdScan(u, t1, 5, 50, 5000, 3, 4, 1));   // clutter
});
