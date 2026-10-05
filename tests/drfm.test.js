// Engaño DRFM, blanqueo de lóbulos laterales y capacidad de seguimiento (physics/radar.js#falseTracks,
// sim/engine.js). Ver docs/FISICA.md §4.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { falseTracks, jamJ } from '../src/physics/radar.js';
import { JAM_MODES, DEFENSES } from '../src/data/index.js';
import { useMap } from './helpers.js';

const N = JAM_MODES.drfm.falseTargets;
const soj = (x, y, mode = 'drfm') => ({ type: 'soj', x, y, alt: 8000, on: true, mode });

test('DRFM: no mete ruido, pero sus copias aparecen como falsos blancos por el lóbulo principal', () => {
  useMap('monterey', { flat: true });
  const u = { id: 1, type: 'patriot', x: 10, y: 10, az: 0 };   // C, sector 90° hacia el norte (az 0)
  const front = soj(10, 10 - 60);                                  // 60 km al norte, en el sector
  assert.equal(jamJ(u, 0, [front]), 0, 'el modo DRFM no suma ruido');
  assert.ok(jamJ(u, 0, [soj(10, 10 - 60, 'barrage')]) > 0, 'el mismo jammer con ruido sí');
  assert.equal(falseTracks(u, [front]), N);
  assert.equal(falseTracks(u, [{ ...front, on: false }]), 0);
});

test('DRFM: por los lóbulos laterales solo entra si es fuerte, y el blanqueo (slb) lo borra', () => {
  useMap('monterey', { flat: true });
  const behind = soj(10, 10 + 15);                                 // 15 km al sur: fuera del sector del Patriot
  const pat = { id: 1, type: 'patriot', x: 10, y: 10, az: 0 };
  assert.equal(DEFENSES.patriot.radar.slb, true);
  assert.equal(falseTracks(pat, [behind]), 0, 'Patriot: blanqueo');
  DEFENSES.__noslb = { ...DEFENSES.patriot, radar: { ...DEFENSES.patriot.radar, slb: false } };
  try {
    assert.equal(falseTracks({ ...pat, type: '__noslb' }, [behind]), N, 'sin blanqueo entran por los costados');
    assert.equal(falseTracks({ ...pat, type: '__noslb' }, [soj(10, 10 + 150)]), 0, 'lejos, por los costados no alcanza');
  } finally { delete DEFENSES.__noslb; }
});

test('DRFM: no afecta radares de otra banda ni sensores ópticos', () => {
  useMap('monterey', { flat: true });
  assert.equal(falseTracks({ id: 1, type: 'p18', x: 10, y: 10 }, [soj(10, 40)]), 0, 'VHF fuera de las bandas del jammer');
  assert.equal(falseTracks({ id: 1, type: 'mfg', x: 10, y: 10 }, [soj(10, 40)]), 0);
});
