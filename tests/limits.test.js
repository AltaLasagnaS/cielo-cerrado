// Límites reales: altura de vuelo de las amenazas (aglRange, aglModes) y altura de antena de los
// radares (mastRange). Lo que se puede elegir en la interfaz tiene que estar dentro de lo real.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THREATS, DEFENSES, SCENARIOS, UNC } from '../src/data/index.js';
import { addDef } from '../src/sim/setup.js';
import { useMap, clearSetup } from './helpers.js';

const inside = (v, [lo, hi]) => v >= lo && v <= hi;

test('amenazas: la altura por defecto es la típica (valor probable) y los límites cubren la incertidumbre', () => {
  for (const [k, t] of Object.entries(THREATS)) {
    if (!t.aglRange) continue;
    const u = UNC.thr[k].agl; assert.ok(u, `${k}: sin UNC.agl`);
    assert.equal(t.agl, u.p, `${k}: agl ≠ probable`);
    assert.ok(t.aglRange[0] <= u.min && t.aglRange[1] >= u.max, `${k}: límites ${t.aglRange} no cubren ${u.min}–${u.max}`);
    assert.ok(inside(t.agl, t.aglRange), k);
    assert.ok(t.aglNote, `${k}: falta aglNote`);
    for (const [n, h] of t.aglModes || []) assert.ok(inside(h, t.aglRange), `${k}: perfil "${n}" (${h} m) fuera de límites`);
  }
});

test('escenarios incluidos: cada salva vuela dentro de los límites reales de su arma', () => {
  for (const [key, sc] of Object.entries(SCENARIOS)) for (const sv of sc.salvos || []) {
    const r = THREATS[sv.type].aglRange; if (!r || sv.agl === undefined) continue;
    assert.ok(inside(sv.agl, r), `${key}: ${sv.type} a ${sv.agl} m`);
  }
});

test('radares: el mástil por defecto está dentro de lo real y cada radar dice si es fijo o regulable', () => {
  for (const [k, d] of Object.entries(DEFENSES)) {
    const r = d.radar; if (!r || d.kind === 'aew') continue;
    assert.ok(Array.isArray(r.mastRange) && r.mastRange[0] <= r.mastRange[1], `${k}: falta mastRange`);
    assert.ok(inside(r.mast, r.mastRange), `${k}: mast ${r.mast} fuera de ${r.mastRange}`);
    assert.ok(r.mastNote, `${k}: falta mastNote`);
  }
  // Patriot: radar fijo sobre el semirremolque; S-300/S-400: hasta la torre 40V6MD
  assert.deepEqual(DEFENSES.patriot.radar.mastRange, [4, 4]);
  assert.equal(DEFENSES.s400.radar.mastRange[1], 39);
  assert.equal(DEFENSES.irist.radar.mastRange[1], 12);
});

test('al ubicar una defensa nueva, el mástil arranca en el valor por defecto', () => {
  useMap('monterey', { flat: true }); clearSetup();
  for (const k of ['patriot', 'irist', 's300', 'ewr']) assert.equal(addDef(k, 40, 40).mast, DEFENSES[k].radar.mast);
});
