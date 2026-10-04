// Línea de base: ambos modos de Monte Carlo, semillas explícitas y resultados por corrida.
// npm run baseline -- --runs 40 --seed 1 --jobs 2 --out docs/mediciones/baseline.json
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { readFile, readdir, mkdir, writeFile, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENARIOS } from '../src/data/index.js';
import { applyScenario } from '../src/sim/setup.js';
import { createMonteCarlo, aggregate, MC_STEP } from '../src/sim/montecarlo.js';
import { S } from '../src/sim/state.js';
import { useMap, clearSetup } from '../tests/helpers.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const PLAYABLE = Object.keys(SCENARIOS).filter(key => SCENARIOS[key].goals?.length);

export function parseArgs(args) {
  const config = { runs: 40, seed: 1, jobs: 2, out: 'docs/mediciones/baseline.json', scenarios: [...PLAYABLE] };
  for (let i = 0; i < args.length; i++) {
    const flag = args[i], value = args[++i];
    if (!['--runs', '--seed', '--jobs', '--out', '--scenarios'].includes(flag) || !value) throw new Error(`Opción inválida o sin valor: ${flag}`);
    if (flag === '--out') config.out = value;
    else if (flag === '--scenarios') config.scenarios = value.split(',');
    else config[flag.slice(2)] = Number(value);
  }
  if (!Number.isSafeInteger(config.runs) || config.runs < 1) throw new Error('--runs debe ser un entero positivo.');
  if (!Number.isSafeInteger(config.seed) || config.seed < 1 || config.seed + config.runs - 1 > 0xffffffff) throw new Error('Las semillas deben estar entre 1 y 2^32−1, sin repetirse.');
  if (!Number.isInteger(config.jobs) || config.jobs < 1 || config.jobs > 4) throw new Error('--jobs debe estar entre 1 y 4.');
  if (!config.scenarios.length || new Set(config.scenarios).size !== config.scenarios.length || config.scenarios.some(key => !PLAYABLE.includes(key))) throw new Error('--scenarios debe listar escenarios jugables distintos, separados por comas.');
  return config;
}

export function runCase({ key, runs, seed, sample }, progress = () => {}) {
  const sc = SCENARIOS[key];
  useMap(sc.map); clearSetup(); applyScenario(sc);
  const rules = { c2: S.c2, doctrine: S.doctrine, weather: S.weather, fireRange: S.fireRange, ignoreDecoys: S.ignoreDecoys };
  const mc = createMonteCarlo({ runs, seed, sample });
  let reported = 0;
  while (!mc.done) {
    mc.tick(100);
    if (mc.results.length >= reported + 10 || mc.done) { reported = mc.results.length; progress(reported); }
  }
  if (mc.cancelled || mc.results.length !== runs) throw new Error(`Serie incompleta: ${key}`);
  const { scen, ...summary } = aggregate(mc.results, sc, { seed, sample });
  return { key, name: scen.name, mode: sample ? 'sampled' : 'probable', rules, summary, runs: mc.results };
}

async function sourceHash() {
  const hash = createHash('sha256');
  async function visit(relative) {
    const entries = await readdir(join(ROOT, relative), { withFileTypes: true });
    entries.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    for (const entry of entries) {
      const path = relative + '/' + entry.name;
      if (entry.isDirectory()) await visit(path);
      else { hash.update(path + '\0'); hash.update(await readFile(join(ROOT, path))); hash.update('\0'); }
    }
  }
  await visit('src');
  for (const path of ['tests/helpers.js', 'package-lock.json']) { hash.update(path + '\0'); hash.update(await readFile(join(ROOT, path))); hash.update('\0'); }
  return hash.digest('hex');
}

export async function collect(config, progress = () => {}) {
  const tasks = config.scenarios.flatMap(key => [false, true].map(sample => ({ key, runs: config.runs, seed: config.seed, sample })));
  const results = new Array(tasks.length), live = new Set();
  let next = 0;
  async function lane() {
    while (next < tasks.length) {
      const index = next++, task = tasks[index];
      results[index] = await new Promise((resolveTask, reject) => {
        const worker = new Worker(new URL(import.meta.url), { workerData: task }); live.add(worker);
        let result;
        worker.on('message', message => {
          if (message.type === 'result') result = message.result;
          else progress(task, message.completed);
        });
        worker.on('error', reject);
        worker.on('exit', code => {
          live.delete(worker);
          if (code || !result) reject(new Error(`No se completó ${task.key} (${task.sample ? 'sorteo' : 'probables'}).`));
          else resolveTask(result);
        });
      });
    }
  }
  try { await Promise.all(Array.from({ length: Math.min(config.jobs, tasks.length) }, lane)); }
  catch (error) { next = tasks.length; await Promise.all([...live].map(worker => worker.terminate())); throw error; }
  return results;
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  const hash = await sourceHash();
  const runnerHash = createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).digest('hex');
  const source = { commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(), sha256: hash, runnerSha256: runnerHash, node: process.version };
  const cases = await collect(config, (task, n) => console.log(`${task.key} · ${task.sample ? 'con sorteo' : 'probables'}: ${n}/${task.runs}`));
  if (await sourceHash() !== hash) throw new Error('Cambió el código durante la medición; no se guardaron resultados.');
  const report = { schemaVersion: 1, source, protocol: { runs: config.runs, firstSeed: config.seed, lastSeed: config.seed + config.runs - 1, stepSeconds: MC_STEP, scenarios: config.scenarios, modes: ['probable', 'sampled'] }, cases };
  const out = resolve(config.out); await mkdir(dirname(out), { recursive: true });
  await writeFile(out + '.tmp', JSON.stringify(report, null, 2) + '\n'); await rename(out + '.tmp', out);
  console.log(`Guardado: ${out} (${cases.length * config.runs} corridas completas)`);
}

if (!isMainThread) {
  const result = runCase(workerData, completed => parentPort.postMessage({ type: 'progress', completed }));
  parentPort.postMessage({ type: 'result', result });
} else if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
