// Regla de capas (docs/ARQUITECTURA.md): util → data → physics → sim → render → ui. Cada archivo de
// src/ solo puede importar de su capa o de las de la izquierda. edu/ va entre sim y render (textos de
// la Academia: lee datos y física, no toca el DOM).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';

const ORDER = ['util', 'data', 'physics', 'sim', 'edu', 'render', 'ui'];
const SRC = resolve('src');

function files(dir) {
  return readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : p.endsWith('.js') ? [p] : []; });
}
const layerOf = p => relative(SRC, p).split(/[\\/]/)[0];

test('capas: ningún módulo importa de una capa a su derecha', () => {
  const bad = [];
  for (const f of files(SRC)) {
    const from = ORDER.indexOf(layerOf(f)); if (from < 0) continue;   // main.js y types.js conectan todo
    for (const m of readFileSync(f, 'utf8').matchAll(/^\s*import\s[^'"]*['"](\.[^'"]+)['"]/gm)) {
      const to = ORDER.indexOf(layerOf(resolve(dirname(f), m[1])));
      if (to > from) bad.push(relative(SRC, f) + ' → ' + m[1]);
    }
  }
  assert.deepEqual(bad, []);
});
