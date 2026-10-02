// Modelo de daño y objetivos: propiedades que tiene que cumplir (ver docs/FISICA.md §10).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THREATS, TARGET_TYPES } from '../src/data/index.js';
import { damageAt, directDamage, radius50, targetStatus, warheadKg } from '../src/physics/damage.js';
import { S } from '../src/sim/state.js';
import { runScenario } from './helpers.js';

test('más ojiva → más daño y mayor radio', () => {
  assert.ok(directDamage(THREATS.kh101) > directDamage(THREATS.shahed));
  assert.ok(radius50(THREATS.flamingo) > radius50(THREATS.zircon));
  assert.equal(warheadKg(THREATS.kh101), THREATS.kh101.info.warheadKg);   // única fuente: el catálogo
});

test('impacto directo (dentro de la huella) = daño completo; cerca = menos; lejos = nada', () => {
  const T = THREATS.kh101, full = directDamage(T) * TARGET_TYPES.storage.vuln;
  assert.equal(damageAt(T, 'storage', 10).dmg, full);
  const r50 = TARGET_TYPES.storage.radius + radius50(T);
  assert.ok(Math.abs(damageAt(T, 'storage', r50).dmg - full / 2) < 1e-6);
  assert.equal(damageAt(T, 'storage', 2000).dmg, 0);
});

test('los señuelos sin ojiva no dañan', () => {
  assert.equal(damageAt(THREATS.gerbera, 'fuel', 0).dmg, 0);
});

test('estados: operativo → dañado (≥ 20%) → destruido', () => {
  assert.equal(targetStatus(1000, 1000), 'operational');
  assert.equal(targetStatus(810, 1000), 'operational');
  assert.equal(targetStatus(800, 1000), 'damaged');
  assert.equal(targetStatus(0, 1000), 'destroyed');
});

test('una corrida sin defensas destruye el objetivo y registra la línea de tiempo', () => {
  runScenario('mb_noche', { seed: 5, prep: s => { s.setup.defs = []; s.setup.jams = []; } });
  const g = S.objs.find(o => o.name === 'Depósito de combustible Salinas');
  assert.equal(g.status, 'destroyed');
  assert.equal(g.hp, 0);
  assert.ok(S.stats.damage > 0 && S.stats.objsDestroyed >= 1);
  assert.ok(S.events.some(e => e.key === 'destroyed:' + g.id));
  assert.ok(S.arrivals.length > 0);
  assert.equal(S.stats.dmgByWeapon.Shahed > 0, true);
});

test('debrief: metas evaluadas y explicaciones coherentes con la corrida', async () => {
  const { buildDebrief } = await import('../src/sim/debrief.js');
  runScenario('mb_noche', { seed: 5, prep: s => { s.setup.defs = s.setup.defs.filter(d => d.name === 'Patriot-1'); s.setup.jams = []; } });
  const d = buildDebrief(S);
  const destroy = d.goals.find(g => g.kind === 'destroy');
  assert.equal(destroy.met, S.objs[0].status === 'destroyed');
  assert.equal(d.outcome.side, 'defensa');
  assert.ok(['exito', 'parcial', 'fracaso'].includes(d.outcome.result));
  assert.equal(d.attack.real + d.attack.decoys, d.attack.launched);
  assert.ok(d.why.length > 0);
  assert.ok(d.timeline.every((e, i, a) => !i || a[i - 1].t <= e.t));
});
