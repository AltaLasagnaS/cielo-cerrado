import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, collect, PLAYABLE } from '../scripts/baseline.mjs';

test('baseline rechaza semillas que se repiten, conteos inválidos y escenarios desconocidos', () => {
  assert.equal(PLAYABLE.length, 8);
  assert.throws(() => parseArgs(['--runs', '0']), /entero positivo/);
  assert.throws(() => parseArgs(['--runs', '1.5']), /entero positivo/);
  assert.throws(() => parseArgs(['--seed', '4294967295', '--runs', '2']), /semillas/);
  assert.throws(() => parseArgs(['--jobs', '0']), /--jobs/);
  assert.throws(() => parseArgs(['--scenarios', 'mb_vacio']), /jugables/);
  assert.throws(() => parseArgs(['--scenarios', 'mb_noche,mb_noche']), /distintos/);
});

test('baseline conserva resultados y orden al variar el paralelismo; registra cada semilla y ambos modos', async () => {
  const config = parseArgs(['--runs', '2', '--seed', '17', '--scenarios', 'gb_ruso', '--jobs', '1']);
  const serial = await collect(config), parallel = await collect({ ...config, jobs: 2 });
  assert.deepEqual(serial, parallel);
  assert.deepEqual(serial.map(c => c.mode), ['probable', 'sampled']);
  for (const c of serial) {
    assert.deepEqual(c.runs.map(r => r.seed), [17, 18]);
    assert.equal(c.summary.n, 2);
    assert.equal(c.summary.outcome.exito.n, 2);
    assert.equal(c.summary.sample, c.mode === 'sampled');
    assert.ok(c.runs.every(r => r.real > 0 && r.t > 0));
  }
});
