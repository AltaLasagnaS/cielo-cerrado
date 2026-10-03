// Guardar y cargar escenarios (sim/scenario-io.js): ida y vuelta sin pérdidas y validación al cargar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIOS } from '../src/data/index.js';
import { S } from '../src/sim/state.js';
import { applyScenario } from '../src/sim/setup.js';
import { exportScenario, exportFileName, validateScenario, loadScenarioData } from '../src/sim/scenario-io.js';
import { useMap, clearSetup, runCurrent, runScenario } from './helpers.js';

/** Exporta un escenario incluido pasando por texto JSON, como hace el botón Guardar. */
function exported(key, prep) {
  useMap(SCENARIOS[key].map); clearSetup(); applyScenario(SCENARIOS[key]);
  if (prep) prep(S);
  return JSON.parse(JSON.stringify(exportScenario(new Date(0))));
}
const summary = S => JSON.parse(JSON.stringify({ t: S.t, stats: S.stats, impacts: S.impacts, units: S.units.map(u => [u.name, u.alive, u.magLeft]), objs: S.objs.map(o => [o.name, o.hp, o.status]) }));

for (const key of ['mb_noche', 'gb_ruso']) {
  test(`guardar y cargar ${key}: la corrida es idéntica a la del escenario original`, () => {
    const file = exported(key);
    const ref = summary(runScenario(key, { seed: 7 }));
    clearSetup();
    const res = validateScenario(file);
    assert.ok(res.ok, res.errors.join('\n'));
    assert.deepEqual(res.warnings, []);
    loadScenarioData(res.data);
    assert.equal(S.scen.name, SCENARIOS[key].name);
    assert.equal(S.scen.base, key);
    assert.equal(S.scen.goals.length, SCENARIOS[key].goals.length);
    assert.deepEqual(summary(runCurrent(7)), ref);
  });
}

test('guardar y cargar conserva lo que edita el jugador (mástil, munición, reglas, jammer apagado)', () => {
  const file = exported('mb_noche', S => {
    const u = S.setup.defs.find(d => d.name === 'Patriot-1'); u.mast = 30; u.mag = 4; u.az = 10; u.noDrones = true;
    S.setup.objs[0].maxHp = 1234; S.setup.jams[0].on = false; S.net = false; S.doctrine = 'sls';
  });
  clearSetup();
  const res = validateScenario(file); assert.ok(res.ok, res.errors.join('\n'));
  loadScenarioData(res.data);
  const u = S.setup.defs.find(d => d.name === 'Patriot-1');
  assert.deepEqual([u.mast, u.mag, u.az, u.noDrones], [30, 4, 10, true]);
  assert.equal(S.setup.objs[0].maxHp, 1234);
  assert.equal(S.setup.jams[0].on, false);
  assert.equal(S.net, false); assert.equal(S.doctrine, 'sls');
  // las salvas siguen apuntando a la misma defensa aunque los ids cambien
  const isk = S.setup.salvos.find(sv => sv.type === 'isk_m');
  assert.equal(S.setup.defs.find(d => d.id === isk.targetUnit).name, 'Patriot-1');
});

test('nombre de archivo sin acentos ni símbolos', () => {
  exported('mb_noche');
  assert.match(exportFileName(), /^cielo-cerrado-[a-z0-9-]+\.json$/);
});

test('validación: rechaza lo que no es un escenario o es de otra versión', () => {
  for (const bad of [null, [], 'hola', {}, { format: 'otra-cosa', version: 1 }]) assert.equal(validateScenario(bad).ok, false);
  const file = exported('mb_noche'); file.version = 99;
  assert.match(validateScenario(file).errors[0], /Versión/);
});

test('validación: mapa desconocido o relieve importado que no está cargado', () => {
  let file = exported('mb_noche'); file.map.key = 'odesa';
  assert.match(validateScenario(file).errors[0], /Mapa desconocido/);
  file = exported('mb_noche'); file.map = { key: 'hgt', name: 'N50E030.hgt', latN: 51, lonW: 30, wKm: 70, hKm: 111 };
  assert.match(validateScenario(file).errors[0], /relieve importado/);
});

test('validación: tipos inexistentes de defensa, arma, jammer y objetivo', () => {
  const file = exported('mb_noche');
  file.setup.defs[0].type = 'iron_dome_9000'; file.setup.salvos[0].type = 'tomahawk_x'; file.setup.jams[0].type = 'zzz'; file.setup.objs[0].type = 'castillo';
  const res = validateScenario(file);
  assert.equal(res.ok, false);
  for (const re of [/defensa desconocido "iron_dome_9000"/, /arma desconocida "tomahawk_x"/, /Interferidor 1: tipo desconocido/, /tipo de objetivo desconocido "castillo"/]) assert.ok(res.errors.some(e => re.test(e)), re + '\n' + res.errors.join('\n'));
});

test('validación: posiciones fuera del mapa (Gotemburgo mide 60 km de ancho)', () => {
  const file = exported('gb_ruso'); file.setup.defs[0].x = 85;
  const res = validateScenario(file);
  assert.equal(res.ok, false); assert.match(res.errors.join('\n'), /fuera del mapa/);
});

test('validación: números inválidos, blancos inexistentes e ids repetidos', () => {
  const file = exported('mb_noche');
  file.setup.salvos[0].count = -3; file.setup.defs[1].mag = 'muchos'; file.setup.salvos[5].targetUnit = 99999; file.setup.objs[1].id = file.setup.objs[0].id;
  file.rules.doctrine = 'a lo loco';
  const e = validateScenario(file).errors.join('\n');
  for (const re of [/count: -3/, /mag: "muchos"/, /id 99999/, /repetido/, /rules.doctrine/]) assert.match(e, re);
});

test('validación: una meta sobre algo que ya no existe es un aviso, no un error', () => {
  const file = exported('mb_noche', S => { S.setup.defs = S.setup.defs.filter(d => d.name !== 'Patriot-1'); S.setup.salvos = S.setup.salvos.filter(sv => sv.type !== 'isk_m'); });
  const res = validateScenario(file);
  assert.ok(res.ok, res.errors.join('\n'));
  assert.ok(res.warnings.some(w => w.includes('Patriot-1')));
});

test('validación: no copia campos desconocidos', () => {
  const file = exported('mb_noche'); file.setup.defs[0].__proto__polluted = 1; file.setup.defs[0].hack = '<script>';
  const res = validateScenario(file); assert.ok(res.ok);
  assert.equal(res.data.setup.defs[0].hack, undefined);
});
