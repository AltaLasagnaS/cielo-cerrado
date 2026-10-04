// Daño funcional de las unidades (sim/engine.js#damageUnits, docs/FISICA.md §10): una explosión
// cercana daña sin destruir; un radar dañado ve menos y reacciona más lento; un lanzador dañado no lanza.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THREATS, UNIT_TARGET, UNIT_DAMAGE, UNIT_COMP_AT } from '../src/data/index.js';
import { damageAt } from '../src/physics/damage.js';
import { detR } from '../src/physics/radar.js';
import { S } from '../src/sim/state.js';
import { addDef, addSalvo } from '../src/sim/setup.js';
import { startSim, step, damageUnits } from '../src/sim/engine.js';
import { setRandom, seeded } from '../src/util/rng.js';
import { useMap, clearSetup, runCurrent } from './helpers.js';

/** Una batería sola en un mapa plano, ya en corrida. */
function one(type = 'nasams') {
  useMap('monterey', { flat: true }); clearSetup();
  addDef(type, 40, 40, { name: 'U' });
  setRandom(seeded(1)); startSim(); setRandom(null);
  return S.units[0];
}
/** Distancia (m) a la que una caída de T le saca a la unidad la fracción frac de la vida. */
function distFor(T, frac) {
  let lo = 0, hi = 2000;
  for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (damageAt(T, UNIT_TARGET, m).dmg > frac * UNIT_TARGET.hp) lo = m; else hi = m; }
  return lo;
}

test('damageAt acepta un objetivo genérico { radius, vuln } y cae con la distancia', () => {
  const T = THREATS.kh101;
  assert.ok(damageAt(T, UNIT_TARGET, 0).dmg > damageAt(T, UNIT_TARGET, 80).dmg);
  assert.equal(damageAt(T, UNIT_TARGET, 5000).dmg, 0);
  assert.equal(damageAt(T, 'radar', 10).dmg, damageAt(T, { radius: 25, vuln: 1.2 }, 10).dmg);
});

test('una explosión cercana daña sin destruir y se lleva un componente; más daño, el otro', () => {
  const T = THREATS.kh101, u = one('nasams');
  const d1 = distFor(T, UNIT_COMP_AT[0] + 0.05);
  setRandom(seeded(3)); damageUnits(T, 40 + d1 / 1000, 40); setRandom(null);
  assert.ok(u.alive, 'sigue viva');
  assert.ok(u.hp < UNIT_TARGET.hp && u.hp > 0);
  assert.equal(Number(u.dmgRadar) + Number(u.dmgLauncher), 1, 'perdió un solo componente');
  assert.equal(S.stats.unitsDamaged, 1);
  // una segunda explosión parecida la pasa del 50%: pierde el otro componente
  setRandom(seeded(4)); damageUnits(T, 40 + d1 / 1000, 40); setRandom(null);
  assert.ok(u.alive && u.hp > 0);
  assert.ok(u.dmgRadar && u.dmgLauncher); assert.equal(S.stats.unitsDamaged, 2);
});

test('una explosión lejana no hace nada y una encima destruye', () => {
  const T = THREATS.kh101, u = one('irist');
  damageUnits(T, 45, 40);
  assert.equal(u.hp, UNIT_TARGET.hp); assert.ok(!u.dmgRadar && !u.dmgLauncher);
  damageUnits(T, 40, 40); damageUnits(T, 40, 40);
  assert.equal(u.alive, false); assert.equal(S.stats.lost, 1);
});

test('radar dañado: alcance ×radarR (también ópticos y acústicos)', () => {
  for (const type of ['nasams', 'mfg', 'acoustic']) {
    const u = one(type), th = { T: THREATS.shahed }, R = detR(u, th, 0, 1);
    u.dmgRadar = true;
    assert.ok(Math.abs(detR(u, th, 0, 1) - R * UNIT_DAMAGE.radarR) < 1e-9, type);
  }
});

/** Shahed que pasan por encima de una batería; prep(u) daña la unidad apenas arranca la corrida. */
function shots(prep) {
  useMap('monterey', { flat: true }); clearSetup();
  addDef('nasams', 45, 60, { name: 'N' });
  addSalvo({ type: 'shahed', count: 4, interval: 30, agl: 500, pts: [[0, 60], [70, 60]] });
  runCurrent(2, prep ? () => prep(S.units[0]) : null);
  const fired = S.log.filter(l => / dispara /.test(l.msg)).map(l => l.t);
  return { n: S.stats.byUnit.N || 0, first: fired.length ? Math.min(...fired) : null };
}

test('lanzador dañado: no dispara aunque tenga misiles; radar dañado: dispara más tarde', () => {
  const ok = shots(null), noLaunch = shots(u => { u.dmgLauncher = true; }), slow = shots(u => { u.dmgRadar = true; });
  assert.ok(ok.n > 0, 'sana tira');
  assert.equal(noLaunch.n, 0, 'con el lanzador dañado no tira');
  assert.ok(slow.n > 0, 'con el radar dañado todavía tira');
  assert.ok(slow.first > ok.first, `primer tiro ${slow.first} vs ${ok.first}`);
});

/** Dispara type contra 4 Kalibr, destruye la batería apenas lanza y deja terminar la corrida. */
function shootThenDie(type) {
  useMap('monterey', { flat: true }); clearSetup();
  addDef(type, 40, 40, { name: 'U' });
  addSalvo({ type: 'kalibr', count: 4, interval: 20, agl: 500, pts: [[5, 40], [80, 40]] });
  setRandom(seeded(2)); startSim();
  try {
    for (let n = 0; n < 20000 && !S.ints.length; n++) step(0.25);
    S.units[0].alive = false;
    for (let n = 0; n < 20000 && S.ints.some(i => !i.done); n++) step(0.25);
  } finally { setRandom(null); }
  return S;
}

test('una batería destruida deja sin guía a sus misiles guiados por radar (TVM, SARH, mando)', () => {
  const s = shootThenDie('patriot2');   // PAC-2 GEM-T, guiado TVM
  assert.ok(s.ints.length > 0, 'llegó a disparar');
  assert.equal(s.stats.killed, 0, 'sin el radar de la batería no hay derribo');
  assert.ok(s.log.some(l => /pierde la guía/.test(l.msg)));
  // un buscador activo (NASAMS) sigue solo después del lanzamiento
  assert.ok(shootThenDie('nasams').stats.killed > 0, 'el AMRAAM no depende de la batería');
});
