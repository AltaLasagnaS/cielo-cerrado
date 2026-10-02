// Regresión "golden": corridas completas con semilla fija comparadas contra resultados guardados.
// Si cambiás la física o los datos A PROPÓSITO, estas pruebas van a fallar: revisá que el cambio
// tenga sentido, regenerá con  UPDATE_GOLDEN=1 npm test  y anotalo en el CHANGELOG.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { runScenario } from './helpers.js';

const FILE = new URL('./golden.json', import.meta.url);
const CASES = {
  mb_noche_s1: ['mb_noche', { seed: 1 }],
  mb_noche_s42: ['mb_noche', { seed: 42 }],
  mb_noche_sls_sin_red: ['mb_noche', { seed: 3, net: false, doctrine: 'sls' }],
  mb_noche_plano: ['mb_noche', { seed: 2, flat: true }],
  gb_ruso_s1: ['gb_ruso', { seed: 1 }],
  gb_ruso_s9: ['gb_ruso', { seed: 9 }]
};

const summarize = S => ({
  t: S.t,
  stats: S.stats,
  impacts: S.impacts.map(i => [+i.x.toFixed(4), +i.y.toFixed(4), i.k]),
  units: S.units.map(u => [u.name, u.alive, u.magLeft]),
  log: S.log.length
});

const update = process.env.UPDATE_GOLDEN === '1' || !existsSync(FILE);
const golden = update ? {} : JSON.parse(readFileSync(FILE, 'utf8'));

for (const [name, [key, opts]] of Object.entries(CASES)) {
  test(`golden: ${name}`, () => {
    const got = JSON.parse(JSON.stringify(summarize(runScenario(key, opts))));
    if (update) { golden[name] = got; return; }
    assert.deepEqual(got, golden[name]);
  });
}

test('golden: guardar', { skip: !update }, () => {
  writeFileSync(FILE, JSON.stringify(golden, null, 1) + '\n');
});
