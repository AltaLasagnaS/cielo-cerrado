// Clima, segunda parte: día y noche, nieve, viento con la altura (en tests/wind.test.js) y cambios de
// tiempo durante la corrida (sim/weather-now.js). Ver docs/FISICA.md §2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WEATHER, ENV } from '../src/data/index.js';
import { snowEta } from '../src/physics/weather.js';
import { clutterRcs, rainEta } from '../src/physics/clutter.js';
import { S } from '../src/sim/state.js';
import { wxNow, wxReset, wxStep } from '../src/sim/weather-now.js';
import { exportScenario, validateScenario, loadScenarioData } from '../src/sim/scenario-io.js';
import { addDef } from '../src/sim/setup.js';
import { useMap, clearSetup } from './helpers.js';

test('nieve: reflectividad de Sekhon y Srivastava; 2 mm/h de nieve en X ≈ un orden menos que 4 mm/h de lluvia', () => {
  const e = snowEta(2, 0.032), r = rainEta(4, 0.032);
  assert.ok(e > 0 && e < r, `${e} < ${r}`);
  assert.equal(snowEta(0, 0.032), 0);
  // Ze (agua) = 1780·2^2,23 / 10^0,65 ≈ 1.856 mm⁶/m³ → η = π⁵·0,93·Ze·10⁻¹⁸/λ⁴
  const Ze = 1780 * Math.pow(2, 2.23) / Math.pow(10, 0.65);
  assert.ok(Math.abs(e / (Math.pow(Math.PI, 5) * 0.93 * Ze * 1e-18 / Math.pow(0.032, 4)) - 1) < 1e-12);
});

test('nieve: el clima "nieve" suma eco de volumen y no atenúa', () => {
  useMap('monterey', { flat: true });
  const r = { band: 'X', mti: 'none' };
  assert.ok(clutterRcs(r, 0, 0, 10, 20, 1500, 20, 0, WEATHER.nieve).rain > 0);
  assert.equal(WEATHER.nieve.rain, 0, 'sin atenuación por lluvia');
});

test('día y noche: de día los sensores ópticos llegan más lejos; los radares no cambian', () => {
  clearSetup(); S.weather = 'despejado';
  S.tod = 'noche'; assert.equal(wxNow().opt, 1);
  S.tod = 'dia'; assert.equal(wxNow().opt, ENV.modelo.optDay);
  assert.equal(wxNow().rain, 0);
  S.tod = 'noche';
});

test('plan de clima: el tiempo cambia a la hora indicada y deja anotado el cambio', () => {
  clearSetup(); S.weather = 'despejado'; S.wxPlan = [{ t: 600, weather: 'tormenta' }];
  wxReset();
  wxStep(599); assert.equal(wxNow().name, WEATHER.despejado.name);
  wxStep(600); assert.equal(wxNow().name, WEATHER.tormenta.name);
  assert.ok(S.log.some(l => /Cambia el tiempo/.test(l.msg)));
  assert.equal(S.weather, 'despejado', 'el clima elegido del escenario no se pisa');
});

test('archivo: el momento del día y el plan de clima se guardan, se validan y se recuperan', () => {
  useMap('monterey'); clearSetup(); addDef('patriot', 40, 40);
  S.tod = 'dia'; S.wxPlan = [{ t: 900, weather: 'nieve' }];
  const data = exportScenario();
  const v = validateScenario(JSON.parse(JSON.stringify(data)));
  assert.equal(v.errors.length, 0, v.errors.join('; '));
  clearSetup(); loadScenarioData(v.data);
  assert.equal(S.tod, 'dia'); assert.deepEqual(S.wxPlan, [{ t: 900, weather: 'nieve' }]);
  const bad = validateScenario({ ...JSON.parse(JSON.stringify(data)), rules: { tod: 'tarde', wxPlan: [{ t: 10, weather: 'granizo' }] } });
  assert.ok(bad.errors.length >= 2, bad.errors.join('; '));
});

test('niebla: ITU-R P.840 reproduce la tabla calculada (0 °C) y atenúa casi nada', async () => {
  const { cloudKl, fogGamma } = await import('../src/physics/weather.js');
  for (const [f, kl] of [[3, 0.00840753], [6, 0.0335369], [10, 0.0925504], [15, 0.205626]]) assert.ok(Math.abs(cloudKl(f) / kl - 1) < 1e-5, `${f} GHz: ${cloudKl(f)}`);
  assert.ok(fogGamma('X', 0.05) < 0.01);
  assert.equal(fogGamma('VHF', 0.05), 0, 'fuera del dominio de P.840');
});

test('viento por encima de la capa límite: sigue creciendo con la forma del perfil de Kiev', async () => {
  const { windAt } = await import('../src/physics/weather.js');
  assert.ok(windAt(10, 3000) / windAt(10, 1000) > 1.85 && windAt(10, 3000) / windAt(10, 1000) < 1.92);
  assert.equal(windAt(10, 15000), windAt(10, 10000), 'arriba de 10 km, constante');
});
