// Arnés de calibración (scripts/calibrar.mjs): cada caso tiene geometría válida y su fila en CAL.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAL_CASES } from '../src/data/calibration-cases.js';
import { CAL, DEFENSES, THREATS } from '../src/data/index.js';

test('calibración: casos con tipos existentes, posiciones en el mapa y objetivo ordenado', () => {
  const ids = new Set();
  for (const c of CAL_CASES) {
    assert.ok(!ids.has(c.id), 'id repetido ' + c.id); ids.add(c.id);
    for (const [type, x, y] of c.defs) { assert.ok(DEFENSES[type], c.id + ': ' + type); assert.ok(x >= 0 && x <= 89 && y >= 0 && y <= 111, c.id + ': posición'); }
    for (const s of c.salvos) assert.ok(THREATS[s.type], c.id + ': ' + s.type);
    if (c.obj) assert.ok(c.obj[0] <= c.obj[1]);
  }
});

test('calibración: CAL es la salida de npm run calibrar para todos los casos, en orden', () => {
  assert.deepEqual(CAL.map(c => c.id), CAL_CASES.map(c => c.id));
  for (const r of CAL) {
    assert.ok(r.lo <= r.hi, r.id + ': lo ≤ hi');
    const c = CAL_CASES.find(k => k.id === r.id);
    assert.equal(r.ok, c.obj ? r.sim >= c.obj[0] && r.sim <= c.obj[1] : null, r.id + ': ok coherente con obj');
  }
});
