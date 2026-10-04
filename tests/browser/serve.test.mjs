import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { startSourceServer } from './serve.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));

test('servidor de pruebas usa puerto propio y sirve fuentes y bundle exactos', async t => {
  const server = await startSourceServer(root); t.after(() => server.close());
  assert.match(server.url, /^http:\/\/127\.0\.0\.1:\d+$/);
  const source = await fetch(server.url + '/');
  assert.equal(source.status, 200); assert.match(source.headers.get('content-type'), /text\/html/);
  assert.equal(await source.text(), await readFile(new URL('../../src/index.html', import.meta.url), 'utf8'));
  const main = await fetch(server.url + '/main.js'); assert.equal(main.status, 200);
  assert.match(main.headers.get('content-type'), /javascript/);
  const bundle = await fetch(server.url + '/__bundle__.html'); assert.equal(bundle.status, 200);
  assert.equal(await bundle.text(), await readFile(new URL('../../index.html', import.meta.url), 'utf8'));
});

test('no expone directorios ni archivos de la raíz o por traversal', async t => {
  const server = await startSourceServer(root); t.after(() => server.close());
  for (const path of ['/package.json', '/sim/', '/.git/config', '/%2e%2e%2fpackage.json', '/%2e%2e%2f.git/config', '/%ZZ']) {
    const response = await fetch(server.url + path);
    assert.ok(response.status === 403 || response.status === 404, `${path}: no debe exponer archivos`);
  }
});

test('dos runners no comparten puerto ni cierran el servidor ajeno', async () => {
  const one = await startSourceServer(root); const two = await startSourceServer(root);
  try {
    assert.notEqual(one.url, two.url);
    await one.close();
    assert.equal((await fetch(two.url + '/main.js')).status, 200);
    await assert.rejects(() => fetch(one.url + '/main.js'));
  } finally { await two.close(); }
});
