// Clima (data/weather.js, physics/weather.js): atenuación por lluvia ITU-R P.838-3, sensores ópticos y
// acústicos, techo de nubes, y que el clima despejado no cambie nada. Ver docs/FISICA.md §2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WEATHER, SCENARIOS } from '../src/data/index.js';
import { rainCoef, rainGamma, rainRange } from '../src/physics/weather.js';
import { detR, belowCeiling } from '../src/physics/radar.js';
import { S } from '../src/sim/state.js';
import { addDef, addSalvo, applyScenario } from '../src/sim/setup.js';
import { exportScenario, validateScenario, loadScenarioData } from '../src/sim/scenario-io.js';
import { useMap, clearSetup, runCurrent } from './helpers.js';

const close = (a, b, rel) => Math.abs(a - b) <= rel * Math.abs(b);

test('P.838-3: coeficientes de la tabla de la Recomendación (polarización horizontal)', () => {
  // valores tabulados en la Rec. ITU-R P.838-3: 3 GHz k=0,0001390 α=1,2322; 10 GHz k=0,01217 α=1,2571
  let [k, a] = rainCoef(3); assert.ok(close(k, 0.0001390, 0.02) && close(a, 1.2322, 0.01), `${k} ${a}`);
  [k, a] = rainCoef(10); assert.ok(close(k, 0.01217, 0.02) && close(a, 1.2571, 0.01), `${k} ${a}`);
});

test('la atenuación crece con la frecuencia y es nula en VHF', () => {
  const g = ['L', 'S', 'C', 'X', 'Ku'].map(b => rainGamma(b, 4));
  for (let i = 1; i < g.length; i++) assert.ok(g[i] > g[i - 1]);
  assert.equal(rainGamma('VHF', 25), 0);
  assert.equal(rainGamma('X', 0), 0);
});

test('alcance con lluvia: cumple la ecuación del radar y nunca supera al alcance sin lluvia', () => {
  for (const [R0, g, L] of [[100, 0.06, 30], [30, 0.6, 15], [12, 1.7, 15], [200, 0.001, 30]]) {
    const R = rainRange(R0, g, L);
    assert.ok(R <= R0 && R > 0);
    assert.ok(close(R, R0 * Math.pow(10, -g * Math.min(R, L) / 20), 1e-9), `${R0} ${g} ${L} → ${R}`);
  }
  assert.equal(rainRange(80, 0, 30), 80);
});

test('detR: lluvia sobre radar X; ópticos y acústicos por factor; techo de nubes para ópticos', () => {
  const T = { rcs: 1, cls: 'crucero' };
  const pat = { id: 1, type: 'patriot', x: 0, y: 0 }, s300 = { id: 2, type: 's300', x: 0, y: 0 }, mfg = { id: 3, type: 'mfg', x: 0, y: 0 }, ac = { id: 4, type: 'acoustic', x: 0, y: 0 };
  const W = WEATHER.tormenta;
  assert.ok(detR(s300, T, 0, 1, W) < 0.7 * detR(s300, T, 0, 1));        // banda X en tormenta
  assert.ok(detR(pat, T, 0, 1, W) > 0.8 * detR(pat, T, 0, 1));          // banda C: pierde poco
  assert.equal(detR(mfg, T, 0, 1, W), detR(mfg, T, 0, 1) * W.opt);
  assert.equal(detR(ac, T, 0, 1, W), detR(ac, T, 0, 1) * W.acu);
  for (const k of Object.keys(WEATHER)) assert.ok(detR(pat, T, 0, 1, WEATHER[k]) <= detR(pat, T, 0, 1));
  const opt = { band: 'OPT' }, rad = { band: 'X' };
  assert.equal(belowCeiling(opt, WEATHER.nubes, 1500), false);
  assert.equal(belowCeiling(opt, WEATHER.nubes, 300), true);
  assert.equal(belowCeiling(rad, WEATHER.nubes, 1500), true);
  assert.equal(belowCeiling(opt, WEATHER.despejado, 9000), true);
});

test('corrida: con techo de nubes los grupos móviles no derriban Shahed que vuelan por encima', () => {
  const kills = wx => {
    useMap('monterey', { flat: true }); clearSetup(); S.weather = wx;
    addDef('mfg', 45, 60, { name: 'G' });
    // a 1.000 m: por encima del techo de nubes (≈600 m) y dentro del alcance efectivo del grupo móvil
    // (a 1.500 m queda fuera una vez que el alcance depende del aspecto: physics/engagement.js#rangeFactor)
    addSalvo({ type: 'shahed', count: 6, interval: 20, agl: 1000, pts: [[20, 60], [70, 60]] });
    runCurrent(4); return S.stats.byUnit.G || 0;
  };
  assert.ok(kills('despejado') > 0, 'despejado: tendría que tirar');
  assert.equal(kills('nubes'), 0);
});

test('el clima del escenario se aplica al cargarlo y se guarda en el archivo', () => {
  useMap('monterey'); clearSetup(); applyScenario({ ...SCENARIOS.mb_noche, rules: { ...SCENARIOS.mb_noche.rules, weather: 'lluvia' } });
  assert.equal(S.weather, 'lluvia');
  const file = JSON.parse(JSON.stringify(exportScenario(new Date(0))));
  assert.equal(file.rules.weather, 'lluvia');
  clearSetup(); const res = validateScenario(file); assert.ok(res.ok, res.errors.join('\n'));
  loadScenarioData(res.data); assert.equal(S.weather, 'lluvia');
  file.rules.weather = 'granizo'; assert.match(validateScenario(file).errors.join('\n'), /rules.weather/);
  clearSetup(); applyScenario(SCENARIOS.mb_vacio); assert.equal(S.weather, 'despejado');
});
