import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const fonts = new URL('../src/assets/fonts/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', fonts), 'utf8'));
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

test('fuentes originales: integridad, firmas TTF y licencias OFL conservadas', async () => {
  for (const row of manifest.fonts) {
    const bytes = await readFile(new URL(row.file, fonts));
    assert.equal(bytes.length, row.bytes, row.file);
    assert.equal(sha256(bytes), row.sha256, row.file);
    assert.equal(bytes.readUInt32BE(0), 0x00010000, `TTF válido: ${row.file}`);
    assert.ok(row.url.includes(manifest.revision), 'procedencia fijada a un commit');
    assert.ok(manifest.licenses.some(license => license.family === row.family));
  }
  for (const row of manifest.licenses) {
    const bytes = await readFile(new URL(row.file, fonts));
    assert.equal(sha256(bytes), row.sha256, row.file);
    assert.match(bytes.toString('utf8'), /SIL OPEN FONT LICENSE Version 1\.1/);
  }
});

test('el HTML distribuido lleva todos los archivos de fuente y sus avisos, sin dependencias externas', async () => {
  const css = html.match(/<style>\n([\s\S]*?)<\/style>/)?.[1];
  assert.ok(css);
  const embedded = [...css.matchAll(/url\("data:font\/ttf;base64,([^"\s]+)"\)/g)];
  assert.equal(embedded.length, manifest.fonts.length);
  const hashes = embedded.map(match => sha256(Buffer.from(match[1], 'base64'))).sort();
  assert.deepEqual(hashes, manifest.fonts.map(row => row.sha256).sort());
  assert.doesNotMatch(css, /url\([^)]*(?:https?:|assets\/fonts)|@import/i);
  assert.doesNotMatch(html, /<link[^>]+(?:fonts\.googleapis|fonts\.gstatic)/i);
  const notices = html.match(/<script id="font-licenses" type="text\/plain">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(notices);
  for (const { file } of manifest.licenses) {
    assert.ok(notices.includes(await readFile(new URL(file, fonts), 'utf8')), `Aviso OFL completo: ${file}`);
  }
});
