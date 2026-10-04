// Referencia externa SciPy + experimento I/Q independiente de la mezcla Gamma del motor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFENSES } from '../src/data/index.js';
import { PFA, MAX_INTEGRATION_PULSES, integrationThreshold, noncoherentPd, integratedSnr50 } from '../src/physics/pulse-integration.js';
import { pdRel, pdScan, pdSwerling1, pdSwerling3, SNR50, SNR50_3, detR, PD_CUTOFF } from '../src/physics/radar.js';
import { setRandom, seeded, rnd } from '../src/util/rng.js';
import { S } from '../src/sim/state.js';
import { addDef, addSalvo } from '../src/sim/setup.js';
import { useMap, clearSetup, runCurrent } from './helpers.js';

const reference = JSON.parse(readFileSync(new URL('./fixtures/pulse-integration.json', import.meta.url), 'utf8'));
const near = (a, b, tolerance, label) => assert.ok(Math.abs(a - b) < tolerance, `${label}: ${a} vs ${b}`);

test('integración: 96 probabilidades, umbrales y anclas coinciden con SciPy independiente', () => {
  assert.equal(PFA, reference.pfa);
  for (const [n, t] of reference.thresholds) near(integrationThreshold(n), t, 2e-10, `T_${n}`);
  for (const [n, m, s] of reference.anchors) near(integratedSnr50(n, m), s, 2e-9, `SNR50 ${n}/${m}`);
  for (const [n, m, s, p] of reference.cases) near(noncoherentPd(s, n, m), p, 2e-10, `Pd ${n}/${m}/${s}`);
});

test('un pulso conserva las fórmulas y la curva histórica exactamente', () => {
  for (const k of [0, 1e-4, 0.1, 0.5, 1, 2, 10, 1000]) {
    assert.equal(pdRel(1, k), pdSwerling1(SNR50 * k));
    assert.equal(pdRel(3, k, 1), pdSwerling3(SNR50_3 * k));
  }
  for (const s of [0.01, 1, 10, 100]) {
    near(noncoherentPd(s, 1, 1), pdSwerling1(s), 1e-14, 'Swerling 1');
    near(noncoherentPd(s, 1, 3), pdSwerling3(s), 1e-14, 'Swerling 3');
  }
  assert.equal(noncoherentPd(0), PFA, 'detector matemático sin señal');
  assert.equal(pdRel(1, 0, 8), 0, 'el motor no crea falsas pistas');
});

test('dominio 1–128: ruido, monotonicidad, saturación y alcance anclado sin doble ganancia', () => {
  for (let n = 1; n <= MAX_INTEGRATION_PULSES; n++) {
    for (const m of [1, 3]) {
      let previous = 0;
      for (const s of [0, 1e-10, 0.01, 0.1, 1, 10, 100, 1e10, 1e308, Infinity]) {
        const p = noncoherentPd(s, n, m);
        assert.ok(Number.isFinite(p) && p >= previous - 1e-12 && p <= 1, `${n}/${m}/${s}: ${p}`);
        previous = p;
      }
      near(pdRel(m, 1, n), 0.5, 2e-12, `R1 con N=${n}, m=${m}`);
      assert.ok(pdRel(m, PD_CUTOFF ** -4, n) < 1e-4, 'el corte de rendimiento sigue siendo despreciable');
    }
  }
  for (const m of [1, 3]) {
    assert.ok(noncoherentPd(3, 8, m) > noncoherentPd(3, 1, m), 'misma SNR por pulso: integrar ayuda');
    assert.notEqual(pdRel(m, 0.5, 8), pdRel(m, 0.5, 1), 'alcance anclado: cambia la curva');
    assert.ok(integratedSnr50(8, m) < integratedSnr50(1, m));
  }
});

test('pulsos fraccionarios, nulos, fuera de dominio y SNR/modelos inválidos se rechazan', () => {
  for (const n of [null, 0, -1, 1.5, 129, Infinity, NaN, '8']) {
    assert.throws(() => noncoherentPd(1, n), RangeError);
    assert.throws(() => integratedSnr50(n), RangeError);
    assert.throws(() => pdRel(1, 1, n), RangeError);
  }
  for (const s of [-1, NaN, null, '3']) assert.throws(() => noncoherentPd(s, 8), RangeError);
  for (const m of [0, 2, 4, null]) assert.throws(() => noncoherentPd(1, 8, m), RangeError);
});

test('detector I/Q con RCS constante por barrido confirma la Pd sin usar la mezcla del motor', () => {
  setRandom(seeded(20261004));
  // Box–Muller: cada cuadratura tiene varianza 1/2; potencia media del ruido = 1.
  const noise = () => {
    const radius = Math.sqrt(-Math.log(Math.max(rnd(), 1e-15))), angle = 2 * Math.PI * rnd();
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
  };
  try {
    for (const n of [2, 8, 32]) for (const m of [1, 3]) {
      const a = m === 3 ? 2 : 1, snr = 3, threshold = integrationThreshold(n), samples = 20000;
      let hits = 0;
      for (let j = 0; j < samples; j++) {
        let signal = 0;
        for (let k = 0; k < a; k++) signal -= snr / a * Math.log(Math.max(rnd(), 1e-15));
        const amplitude = Math.sqrt(signal); let power = 0;
        for (let k = 0; k < n; k++) { const [i, q] = noise(); power += (amplitude + i) ** 2 + q ** 2; }
        if (power > threshold) hits++;
      }
      near(hits / samples, noncoherentPd(snr, n, m), 0.012, `I/Q ${n}/${m}`);
    }
  } finally { setRandom(null); }
});

test('pdScan usa N del radar, conserva detR y excluye sensores ópticos/acústicos', () => {
  useMap('monterey', { flat: true });
  const radar = { ...DEFENSES.patriot.radar, integrationPulses: 8 };
  DEFENSES.__pulses = { ...DEFENSES.patriot, radar };
  const u = { type: '__pulses', x: 0, y: 0 }, th = { rcs: 1, swerling: 3, vel: [200, 0, 0] };
  try {
    const R = detR(u, th, 0);
    assert.equal(R, detR({ ...u, type: 'patriot' }, th, 0), 'R1 no crece al integrar');
    near(pdScan(u, th, R, R, 5000, 10, 10, 1), 0.5, 1e-12, 'borde');
    assert.equal(pdScan(u, th, R * 1.2, R, 5000, 10, 10, 1), pdRel(3, (R / (R * 1.2)) ** 4, 8));
    assert.equal(pdScan(u, th, R * 3, R, 5000, 10, 10, 1), 0, 'corte de rendimiento');
    assert.equal(pdScan(u, th, R / 2, R, 5000, 10, 10, 0), 0, 'notch');
    assert.ok(pdScan(u, th, R, R, 20, 10, 10, 1) < 0.5, 'clutter sigue aplicado');
    for (const band of ['OPT', 'ACU']) {
      radar.band = band;
      assert.equal(pdScan(u, th, R * 1.2, R, 5000, 10, 10, 0), pdRel(3, (R / (R * 1.2)) ** 4), band);
    }
    radar.band = 'C'; radar.integrationPulses = 1.5;
    assert.throws(() => pdScan(u, th, R, R, 5000, 10, 10, 1), RangeError);
  } finally { delete DEFENSES.__pulses; }
});

test('el catálogo queda sin números de pulsos inventados', () => {
  for (const [key, d] of Object.entries(DEFENSES))
    assert.equal(d.radar?.integrationPulses, undefined, key);
});

test('corrida: el sensor consume N del radar y sigue confirmando pistas entre barridos', () => {
  useMap('monterey', { flat: true }); clearSetup();
  let reads = 0;
  DEFENSES.__pulses = { ...DEFENSES.ewr, radar: {
    ...DEFENSES.ewr.radar, get integrationPulses() { reads++; return 8; }
  } };
  try {
    addDef('__pulses', 50, 60, { name: 'Radar hipotético' });
    addSalvo({ type: 'shahed', count: 2, interval: 30, agl: 1500, pts: [[0, 60], [70, 60]] });
    runCurrent(2);
    assert.ok(reads > 2, 'el bucle de sensores lee la integración en cada decisión');
    for (const th of S.threats) {
      assert.notEqual(th.firstDet, null, 'pista confirmada');
      assert.equal(typeof th.mn[S.units[0].id], 'number', 'historia por barridos intacta');
    }
  } finally { delete DEFENSES.__pulses; clearSetup(); }
});
