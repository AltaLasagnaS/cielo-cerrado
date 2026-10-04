import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
async function markdown(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdown(path));
    else if (entry.name.endsWith('.md')) files.push(path);
  }
  return files;
}

test('el índice y los documentos preservados tienen enlaces locales válidos', async () => {
  const files = [join(root, 'README.md'), ...await markdown(join(root, 'docs'))];
  let checked = 0;
  for (const file of files) {
    const body = await readFile(file, 'utf8');
    for (const match of body.matchAll(/\]\(([^)]+)\)/g)) {
      const target = match[1];
      if (/^https?:\/\//.test(target) || target.startsWith('#')) continue;
      assert.ok(!target.startsWith('/') && !target.includes('://'), `${file}: enlace no portable ${target}`);
      const path = resolve(dirname(file), decodeURIComponent(target.split('#')[0]));
      assert.ok(path.startsWith(root), `${file}: enlace fuera del paquete`);
      assert.ok((await stat(path)).isFile(), `${file}: archivo ausente ${target}`);
      checked++;
    }
  }
  assert.ok(checked >= 35, 'verifica los enlaces reales del plan y archivo, no una lista vacía');
});
