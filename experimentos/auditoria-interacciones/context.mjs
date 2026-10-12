import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import os from 'node:os';

export const folder = dirname(fileURLToPath(import.meta.url));
export const root = resolve(process.env.AUDIT_REPO_ROOT || join(folder, '../..'));
export const moduleOf = path => import(pathToFileURL(join(root, path)).href);
export const output = resolve(process.env.AUDIT_OUTPUT || join(folder, 'results-local'));
export function save(name, value) {
  mkdirSync(output, { recursive: true });
  writeFileSync(join(output, name), JSON.stringify(value, null, 2) + '\n');
}
export function provenance() {
  const paths = ['src/sim/engine.js', 'src/sim/ew.js', 'src/sim/replay.js', 'src/sim/contacts.js',
    'src/sim/scenario-io.js', 'src/physics/engagement.js', 'src/physics/coverage.js', 'src/render/draw.js'];
  return { targetSha: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    node: process.version, platform: `${os.platform()} ${os.release()}`, cpu: os.cpus()[0]?.model,
    logicalCpus: os.cpus().length, ramBytes: os.totalmem(),
    sources: Object.fromEntries(paths.map(p => [p, createHash('sha256').update(readFileSync(join(root, p))).digest('hex')])) };
}
