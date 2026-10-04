// ECM y ECCM contra radares (physics/radar.js#jamJ, docs/FISICA.md §4): ruido de barrera o puntual,
// agilidad de frecuencia, lóbulos laterales bajos y canceladores de lóbulos laterales (SLC).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFENSES, JAMMERS, JAM_MODES, SCENARIOS } from '../src/data/index.js';
import { setMap, flatMap } from '../src/physics/terrain.js';
import { jamJ, singleJam, burnThrough, SIDELOBES, LOW_SIDELOBES, SLC_RESIDUAL } from '../src/physics/radar.js';
import { S } from '../src/sim/state.js';
import { applyScenario, addJam } from '../src/sim/setup.js';
import { exportScenario, validateScenario, loadScenarioData } from '../src/sim/scenario-io.js';
import { useMap, clearSetup } from './helpers.js';

setMap(flatMap(400, 400, 200));
let nid = 100;
const unit = (type, x = 40, y = 40) => ({ id: ++nid, type, x, y, az: 0, mast: DEFENSES[type].radar.mast, alt: DEFENSES[type].alt });
/** Avión de interferencia a 8.000 m en el acimut az (° desde el norte) y a dist km de la unidad. */
const soj = (u, az, dist, o = {}) => ({ id: ++nid, type: 'soj', x: u.x + dist * Math.sin(az * Math.PI / 180), y: u.y - dist * Math.cos(az * Math.PI / 180), alt: 8000, on: true, mode: 'barrage', target: null, ...o });

test('barrera: con un radar sin ECCM nuevas da lo mismo que la fórmula de siempre', () => {
  const u = unit('s125'), r = DEFENSES.s125.radar, j = soj(u, 0, 50);
  const d = Math.hypot(50, (8000 - (r.mast)) / 1000) + 1;
  const old = JAMMERS.soj.P * 1 / (d * d) * Math.pow(10, -r.eccm / 10);
  assert.ok(Math.abs(jamJ(u, 0, [j]) / old - 1) < 1e-3);
});

test('ECM: un jammer no degrada un radar del mismo bando', () => {
  const ua = unit('patriot'), ru = { ...unit('s400'), type: 's400' }, j = soj(ua, 0, 50);
  assert.ok(jamJ(ua, 0, [j]) > 0, 'un jammer ruso sí afecta al radar ucraniano');
  assert.equal(jamJ(ru, 0, [j]), 0, 'el mismo jammer no afecta al radar ruso');
});

test('ruido puntual: ×10 contra el radar elegido sin agilidad, nada contra los demás, ×0,1 contra uno ágil', () => {
  const s125 = unit('s125'), pat = unit('patriot'), ewr = unit('ewr');
  for (const [u, want] of [[s125, JAM_MODES.spot.gain], [pat, JAM_MODES.spot.agileGain], [ewr, JAM_MODES.spot.gain]]) {
    const bar = jamJ(u, 0, [soj(u, 0, 60)]), spot = jamJ(u, 0, [soj(u, 0, 60, { mode: 'spot', target: u.id })]);
    assert.ok(Math.abs(spot / bar - want) < 1e-6, `${u.type}: ${spot / bar}`);
    assert.equal(jamJ(u, 0, [soj(u, 0, 60, { mode: 'spot', target: -1 })]), 0, 'puntual contra otro radar: no lo toca');
  }
  assert.ok(DEFENSES.patriot.radar.agile && !DEFENSES.s125.radar.agile);
});

test('lóbulos bajos: menos interferencia por los costados, igual de frente', () => {
  assert.ok(LOW_SIDELOBES.near < SIDELOBES.near && LOW_SIDELOBES.far < SIDELOBES.far);
  const lo = { ...DEFENSES.s300.radar }, hi = { ...lo, lowSL: false };
  assert.equal(singleJam(lo, 1e5, 80, 'main'), singleJam(hi, 1e5, 80, 'main'));
  assert.ok(singleJam(lo, 1e5, 80, 'near') < singleJam(hi, 1e5, 80, 'near'));
});

test('cancelador de lóbulos laterales: anula los N más fuertes de costado, nunca el del lóbulo principal', () => {
  const u = unit('ewr');   // 36D6: 2 SLC
  const N = DEFENSES.ewr.radar.slc; assert.equal(N, 2);
  const front = soj(u, 0, 60), sides = [soj(u, 30, 40), soj(u, 60, 50), soj(u, 120, 70)];
  const one = j => jamJ({ ...u, type: 'ewr' }, 0, [j]);
  // de frente: igual con o sin cancelador
  const noSlc = { ...DEFENSES.ewr, radar: { ...DEFENSES.ewr.radar, slc: 0 } };
  DEFENSES.__tmp = noSlc;
  try {
    const plain = j => jamJ({ ...u, type: '__tmp' }, 0, [j]);
    assert.ok(Math.abs(one(front) - plain(front)) < 1e-12, 'el lóbulo principal no se cancela');
    for (const j of sides) assert.ok(Math.abs(one(j) - plain(j) * SLC_RESIDUAL) < 1e-12, 'uno solo de costado: cancelado');
    // tres de costado con 2 SLC: los dos más fuertes cancelados, el más débil pasa entero
    const vals = sides.map(plain).sort((a, b) => b - a);
    const want = vals[0] * SLC_RESIDUAL + vals[1] * SLC_RESIDUAL + vals[2];
    assert.ok(Math.abs(jamJ({ ...u, type: 'ewr' }, 0, sides) - want) / want < 1e-9);
  } finally { delete DEFENSES.__tmp; }
});

test('quemado: más interferencia, menos alcance; sin interferencia, el del catálogo', () => {
  const r = DEFENSES.patriot.radar;
  assert.equal(burnThrough(r, 0), r.R1);
  assert.ok(burnThrough(r, 10) < burnThrough(r, 1));
  assert.ok(Math.abs(burnThrough(r, 15) - r.R1 / 2) < 1e-9, 'J/N = 15 → la mitad del alcance');
});

test('el modo y el radar elegido se guardan, se cargan (con ids nuevos) y se validan', () => {
  useMap('monterey'); clearSetup(); applyScenario(SCENARIOS.mb_noche);
  const tgt = S.setup.defs.find(u => DEFENSES[u.type].radar && JAMMERS.soj.bands.includes(DEFENSES[u.type].radar.band));
  const j = addJam('soj', 5, 20, { mode: 'spot', target: tgt.name });
  assert.equal(j.mode, 'spot'); assert.equal(j.target, tgt.id);
  assert.equal(S.setup.jams[0].mode, 'barrage', 'por defecto, barrera');
  const file = JSON.parse(JSON.stringify(exportScenario(new Date(0))));
  clearSetup(); const res = validateScenario(file); assert.ok(res.ok, res.errors.join('\n'));
  loadScenarioData(res.data);
  const back = S.setup.jams.find(v => v.mode === 'spot');
  assert.equal(S.setup.defs.find(u => u.id === back.target).name, tgt.name);
  const bad = structuredClone(file); bad.setup.jams.at(-1).mode = 'láser';
  assert.match(validateScenario(bad).errors.join('\n'), /mode/);
  const bad2 = structuredClone(file); bad2.setup.jams.at(-1).target = 99999;
  assert.match(validateScenario(bad2).errors.join('\n'), /ruido puntual/);
});
