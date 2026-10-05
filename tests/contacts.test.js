// Contactos de la defensa (sim/contacts.js): lo que sabe la defensa, sin la verdad.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { noteSeen, contactOf, attackerKnows, TRACK_AGE, LOST_AGE } from '../src/sim/contacts.js';
import { DEFENSES } from '../src/data/index.js';
import { runScenario } from './helpers.js';

test('contacto: posición estimada por estima mientras vive la pista y último reporte cuando se pierde', () => {
  const th = { alive: true, p: { x: 10, y: 10, z: 500 } };
  noteSeen(th, 100, 1); th.p = { x: 11, y: 10, z: 500 }; noteSeen(th, 110, 1);   // 0,1 km/s al este
  const c = contactOf(th, 115);
  assert.ok(Math.abs(c.x - 11.5) < 1e-9 && c.y === 10 && !c.lost, 'estima 5 s hacia adelante');
  assert.ok(Math.abs(c.v - 100) < 1e-9, '100 m/s');
  const lost = contactOf(th, 110 + TRACK_AGE + 1);
  assert.equal(lost.lost, true); assert.equal(lost.x, 11, 'perdida: queda donde se la vio');
  assert.equal(contactOf(th, 110 + LOST_AGE + 1), null, 'muy vieja: se olvida');
  assert.equal(contactOf({ alive: true }, 0), null, 'nunca vista');
});

test('contacto: no depende de la posición real después de la última detección', () => {
  const th = { alive: true, p: { x: 0, y: 0, z: 100 } };
  noteSeen(th, 0, 1); th.p = { x: 1, y: 0, z: 100 }; noteSeen(th, 10, 1);
  const a = contactOf(th, 12);
  th.p = { x: 50, y: 50, z: 9000 };   // la verdad cambia, la defensa no lo vio
  assert.deepEqual(contactOf(th, 12), a);
});

test('contacto: anotar detecciones no cambia los resultados (mismo escenario, mismas golden)', () => {
  const S = runScenario('mb_noche', { seed: 1 });
  assert.ok(S.threats.some(t => t.seen), 'el motor anota detecciones');
});

test('vista del atacante: conoce las defensas con radar desde el principio; las demás, desde que disparan', () => {
  const S = runScenario('gb_refineria', { seed: 1 });
  const radar = S.units.filter(u => { const r = DEFENSES[u.type].radar; return r && r.band !== 'ACU' && r.band !== 'OPT'; });
  const quiet = S.units.filter(u => !radar.includes(u));
  assert.ok(radar.length && quiet.length, 'el escenario tiene de las dos');
  for (const u of radar) assert.ok(attackerKnows(u, 0), u.type + ': emite, el atacante la ubica');
  for (const u of quiet) {
    assert.equal(attackerKnows(u, 0), false, u.type + ': antes de disparar no se la conoce');
    if (u.revealed != null) assert.ok(attackerKnows(u, u.revealed) && !attackerKnows(u, u.revealed - 1), u.type + ': desde su primer disparo');
  }
  assert.ok(quiet.some(u => u.revealed != null), 'alguna sin radar disparó');
});
