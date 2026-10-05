// Informe de fin de misión y continuidad de la campaña (sim/mission.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UNIT_TARGET } from '../src/data/index.js';
import { S } from '../src/sim/state.js';
import { addDef, addObj } from '../src/sim/setup.js';
import { startSim } from '../src/sim/engine.js';
import { exportScenario, validateScenario, loadScenarioData } from '../src/sim/scenario-io.js';
import { missionReport, MISSION_REPORT_VERSION } from '../src/sim/mission.js';
import { runScenario, useMap, clearSetup } from './helpers.js';

test('informe de la defensa: metas, medios propios, reportes sin la verdad y gasto', () => {
  runScenario('kv_energia', { seed: 1 });
  const r = missionReport('defensa');
  assert.equal(r.version, MISSION_REPORT_VERSION);
  assert.equal(r.side, 'defensa');
  assert.ok(['exito', 'parcial', 'fracaso'].includes(r.outcome));
  assert.ok(r.goals.length && r.goals.every(g => typeof g.met === 'boolean'));
  assert.equal(r.assets.units.length, S.units.length);
  const p = r.assets.units.find(u => u.type === 'patriot');
  assert.ok(p && Number.isInteger(p.magLeft) && typeof p.located === 'boolean');
  assert.equal(r.assets.objectives.length, S.objs.length);
  assert.equal(r.spent.interceptors, S.stats.shots);
  assert.ok(r.reports.length > 10);
  assert.ok(!r.reports.some(e => /Kh-101 #|Shahed #|Kalibr #/.test(e.text)), 'la defensa no nombra el tipo real de las armas');
  assert.ok(!r.reports.some(e => /libera .* señuelos|GNSS/.test(e.text)), 'ni ve lo que solo sabe el atacante');
});

test('informe del atacante: sin unidades enemigas ni reportes de la defensa', () => {
  runScenario('kv_energia', { seed: 1 });
  const r = missionReport('ataque');
  assert.equal(r.assets.units, undefined, 'no recibe las defensas');
  assert.ok(r.spent.weapons > 0);
  assert.ok(!r.reports.some(e => / derriba | dispara /.test(e.text)), 'no ve los disparos ni derribos de la defensa');
});

test('continuidad: una misión empieza con unidades dañadas, munición y objetivos con la vida que dejaron', () => {
  useMap('monterey'); clearSetup();
  addDef('patriot', 40, 40, { name: 'P', hp: 120, dmgRadar: true, mag: 5 });
  addObj('fuel', 45, 45, { name: 'D', hp: 800, hpNow: 300 });
  const file = JSON.parse(JSON.stringify(exportScenario(new Date(0))));
  assert.equal(file.setup.defs[0].hp, 120); assert.equal(file.setup.defs[0].dmgRadar, true); assert.equal(file.setup.objs[0].hpNow, 300);
  const v = validateScenario(file); assert.ok(v.ok, v.errors.join('\n'));
  clearSetup(); loadScenarioData(v.data); startSim();
  const u = S.units[0], g = S.objs[0];
  assert.equal(u.hp, 120); assert.equal(u.dmgRadar, true); assert.equal(u.dmgLauncher, false); assert.equal(u.magLeft, 5);
  assert.equal(g.hp, 300); assert.notEqual(g.status, 'operational', 'con 300/800 ya está dañado');
  file.setup.defs[0].hp = UNIT_TARGET.hp + 1;
  assert.match(validateScenario(file).errors.join('\n'), /hp/);
});
