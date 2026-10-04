import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { startSourceServer } from './serve.mjs';

const packageRoot = fileURLToPath(new URL('./', import.meta.url));
const repoRoot = resolve(packageRoot, '../..');
const artifactRoot = process.env.BROWSER_ARTIFACTS || join(packageRoot, 'artifacts');
await mkdir(artifactRoot, { recursive: true });
const artifacts = await mkdtemp(join(artifactRoot, 'run-'));
const playwrightModule = process.env.PLAYWRIGHT_MODULE || fileURLToPath(new URL('./node_modules/playwright/index.mjs', import.meta.url));
const env = { ...process.env, PLAYWRIGHT_MODULE: playwrightModule, BROWSER_ARTIFACTS: artifacts };
let server;

async function run(script, extraEnv, name) {
  let output = '';
  let timedOut = false;
  const code = await new Promise((accept, reject) => {
    const child = spawn(process.execPath, [script], { cwd: repoRoot, env: { ...env, ...extraEnv }, stdio: ['ignore', 'pipe', 'pipe'] });
    const timeout = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, 120000);
    const collect = chunk => {
      const text = chunk.toString(); output = (output + text).slice(-1024 * 1024);
      process.stdout.write(text);
    };
    child.stdout.on('data', collect); child.stderr.on('data', collect);
    child.once('error', error => { clearTimeout(timeout); reject(error); });
    child.once('close', (exitCode, signal) => {
      clearTimeout(timeout); accept({ exitCode, signal });
    });
  });
  await writeFile(join(artifacts, name + '.log'), output);
  if (timedOut || code.exitCode !== 0) throw new Error(`${name}: prueba fallida (${timedOut ? 'timeout' : code.exitCode ?? code.signal})`);
}

try {
  // Reutiliza la prueba existente sin cambiarla: sus imports nativos usan el mismo S del juego.
  server = await startSourceServer(repoRoot);
  await run(join(repoRoot, 'tests/ui.browser.mjs'), { TEST_URL: server.url }, 'ui-native');
  // El archivo descargable no puede usar imports /sim; se prueba por separado como file://.
  await run(join(packageRoot, 'standalone.browser.mjs'), process.env.STANDALONE_HTTP === '1'
    ? { STANDALONE_URL: server.url + '/__bundle__.html' } : {}, 'standalone');
  console.log('Navegador: suites nativa y autocontenida completadas.');
} catch (error) {
  console.error(error.message); process.exitCode = 1;
} finally {
  if (server) await server.close();
}
