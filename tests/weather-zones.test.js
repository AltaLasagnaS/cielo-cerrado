// Clima por zonas (sim/weather-now.js#wxAt, #wxPath; docs/FISICA.md §2): una celda de lluvia atenúa solo
// el tramo del camino que la cruza; la óptica sufre la niebla de cualquiera de las dos puntas; sin zonas,
// todo queda como antes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFENSES, THREATS } from '../src/data/index.js';
import { setMap, flatMap } from '../src/physics/terrain.js';
import { chordKm } from '../src/physics/weather.js';
import { detR, belowCeiling } from '../src/physics/radar.js';
import { S } from '../src/sim/state.js';
import { wxNow, wxAt, wxPath } from '../src/sim/weather-now.js';
import { validateScenario, exportScenario } from '../src/sim/scenario-io.js';
import { addDef } from '../src/sim/setup.js';
import { clearSetup, useMap } from './helpers.js';

test('chordKm: tramo de un segmento dentro de un círculo', () => {
  assert.equal(chordKm(0, 0, 10, 0, 5, 0, 2), 4, 'lo cruza entero');
  assert.equal(chordKm(0, 0, 10, 0, 5, 5, 2), 0, 'pasa por afuera');
  assert.equal(chordKm(0, 0, 5, 0, 5, 0, 2), 2, 'termina en el centro');
  assert.equal(chordKm(5, 0, 6, 0, 5, 0, 2), 1, 'todo adentro');
  assert.ok(Math.abs(chordKm(0, 0, 10, 0, 5, 1, 2) - 2 * Math.sqrt(3)) < 1e-12, 'cuerda a 1 km del centro');
});

test('sin zonas, wxPath es el clima de fondo (el mismo objeto: las corridas no cambian)', () => {
  clearSetup(); S.weather = 'lluvia'; S.wxLive = 'lluvia';
  assert.equal(wxPath(0, 0, 50, 0), wxNow());
  assert.equal(wxAt(10, 10), wxNow());
});

const nasams = { id: 1, type: 'nasams', x: 0, y: 50, az: 0, mast: 4 };
const kal = { T: THREATS.kalibr, rcs: THREATS.kalibr.rcs, cls: THREATS.kalibr.cls };

test('una tormenta en el camino achica el alcance del radar en X; la misma tormenta al costado, no', () => {
  setMap(flatMap(1000, 1000, 200)); clearSetup(); S.weather = 'despejado'; S.wxLive = 'despejado';
  const clear = detR(nasams, kal, 0, 1, wxPath(0, 50, 40, 50));
  S.wxZones = [{ x: 20, y: 50, r: 7.5, weather: 'tormenta' }];
  const across = wxPath(0, 50, 40, 50), aside = wxPath(0, 50, 40, 90);
  assert.equal(across.rain, 25); assert.equal(across.rainKm, 15, 'cruza la celda de 15 km de diámetro');
  assert.equal(aside.rain, 0, 'el camino no toca la celda');
  assert.equal(across.rainAt, 0, 'el blanco está fuera de la celda: sin eco de lluvia en su celda');
  assert.equal(wxPath(0, 50, 20, 50).rainAt, 25, 'blanco dentro de la tormenta: eco de lluvia');
  assert.ok(detR(nasams, kal, 0, 1, across) < clear * 0.95, 'la lluvia atenúa el radar en X');
  assert.equal(detR(nasams, kal, 0, 1, aside), clear);
  // radar en S (Patriot es C; el 36D6 es S): casi no la nota
  const ewr = { ...nasams, type: 'ewr' };
  assert.ok(detR(ewr, kal, 0, 1, across) > detR(ewr, kal, 0, 1, wxPath(0, 50, 40, 90)) * 0.97);
});

test('lluvia de fondo con un claro: dentro del claro no llueve; el camino de afuera sí', () => {
  setMap(flatMap(1000, 1000, 200)); clearSetup(); S.weather = 'lluvia'; S.wxLive = 'lluvia';
  S.wxZones = [{ x: 0, y: 50, r: 30, weather: 'despejado' }];
  assert.equal(wxPath(0, 50, 20, 50).rain, 0, 'todo el camino dentro del claro');
  const out = wxPath(0, 50, 50, 50);
  assert.equal(out.rain, 4); assert.ok(Math.abs(out.rainKm - 20) < 1e-9, 'solo los 20 km de afuera del claro');
});

test('óptica: la niebla en el lugar del sensor o del blanco tapa; techo de nubes, el más bajo', () => {
  setMap(flatMap(1000, 1000, 200)); clearSetup(); S.weather = 'despejado'; S.wxLive = 'despejado';
  S.wxZones = [{ x: 10, y: 10, r: 3, weather: 'niebla' }];
  const mfg = DEFENSES.mfg.radar;
  assert.equal(wxPath(10, 10, 30, 30).opt, 0.1, 'sensor en la niebla');
  assert.equal(wxPath(30, 30, 10, 10).opt, 0.1, 'blanco en la niebla');
  assert.equal(wxPath(30, 30, 40, 40).opt, 1, 'lejos de la niebla');
  assert.equal(belowCeiling(mfg, wxPath(10, 10, 30, 30), 500), false, 'techo de 200 m: un dron a 500 m no se ve');
  assert.equal(wxAt(10, 11).ceiling, 200);
});

test('scenario-io: las zonas se validan y viajan con el escenario', () => {
  useMap('odesa'); clearSetup(); addDef('nasams', 50, 50);
  S.wxZones = [{ x: 40, y: 60, r: 10, weather: 'tormenta' }];
  const ok = JSON.parse(JSON.stringify(exportScenario()));
  const r = validateScenario(ok);
  assert.ok(r.ok, JSON.stringify(r.errors));
  assert.deepEqual(r.data.rules.wxZones, [{ x: 40, y: 60, r: 10, weather: 'tormenta' }]);
  ok.rules.wxZones = [{ x: 40, y: 60, r: 0, weather: 'granizo' }];
  const bad = validateScenario(ok);
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some(e => /granizo/.test(e)) && bad.errors.some(e => /\.r/.test(e)), bad.errors.join(' | '));
});

test('en una corrida: una tormenta entre el radar y la ruta retrasa la primera detección', async () => {
  const { addSalvo } = await import('../src/sim/setup.js');
  const { runCurrent } = await import('./helpers.js');
  const run = zones => {
    setMap(flatMap(1000, 1000, 200)); clearSetup(); S.wxZones = zones;
    addDef('nasams', 100, 100, { name: 'N' });
    addSalvo({ type: 'kalibr', count: 1, tStart: 0, pts: [[100, 199], [100, 101]], agl: 200 });
    return runCurrent(5, s => { s.units[0].emcon = 'siempre'; }).threats[0].detKm;
  };
  const clear = run([]), storm = run([{ x: 100, y: 125, r: 10, weather: 'tormenta' }]);
  assert.ok(clear != null && storm != null, 'en los dos casos lo detecta');
  assert.ok(storm < clear, `con tormenta lo ve más cerca: ${storm.toFixed(1)} km vs ${clear.toFixed(1)} km`);
});
