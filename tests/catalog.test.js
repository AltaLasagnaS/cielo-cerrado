// Integridad del catálogo: atrapa errores de tipeo al agregar armas, fuentes o escenarios.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THREATS, DEFENSES, JAMMERS, BANDS, CLS_NAME, UNC, OBS, SRC, SCENARIOS, TERRAIN, PL, TARGET_TYPES, C2_LEVELS, applySample, applyProbable } from '../src/data/index.js';

const PROFILES = ['drone', 'cruise', 'bunt', 'ballistic', 'highdive', 'hilo', 'glide'];

test('amenazas: campos obligatorios y perfiles válidos', () => {
  for (const [k, t] of Object.entries(THREATS)) {
    for (const f of ['name', 'short', 'side', 'cls', 'prof', 'v', 'rcs', 'cep', 'cost', 'sources']) assert.ok(t[f] !== undefined, `${k}.${f}`);
    assert.ok(CLS_NAME[t.cls], `${k}: clase ${t.cls}`);
    assert.ok(PROFILES.includes(t.prof), `${k}: perfil ${t.prof}`);
    if (['ballistic'].includes(t.prof)) assert.ok(t.apogee && t.launchDist, `${k}: apogee/launchDist`);
    if (['highdive', 'hilo', 'glide'].includes(t.prof)) assert.ok(t.cruiseAlt && t.launchDist, `${k}: cruiseAlt/launchDist`);
    if (['drone', 'cruise', 'bunt'].includes(t.prof)) assert.ok(t.agl !== undefined, `${k}: agl`);
  }
});

test('defensas: bandas existentes y Pk para todas las clases', () => {
  for (const [k, d] of Object.entries(DEFENSES)) {
    if (d.radar) assert.ok(BANDS[d.radar.band], `${k}: banda ${d.radar.band}`);
    if (d.sam) for (const c of Object.keys(CLS_NAME)) assert.ok(d.sam.pk[c] !== undefined, `${k}: pk.${c}`);
    assert.ok(d.radar || d.sam, `${k}: sin sensor ni arma`);
  }
});

test('jammers: bandas existentes', () => {
  for (const [k, j] of Object.entries(JAMMERS)) if (j.bands) for (const b of j.bands) assert.ok(BANDS[b], `${k}: banda ${b}`);
});

test('incertidumbre: rangos ordenados, confianza válida, etiquetas y fuentes existentes', () => {
  const CAT = { thr: THREATS, def: DEFENSES, jam: JAMMERS, c2: C2_LEVELS };
  for (const [kind, set] of Object.entries(UNC)) for (const [k, params] of Object.entries(set)) {
    assert.ok(CAT[kind][k], `UNC.${kind}.${k} no existe en el catálogo`);
    for (const [path, u] of Object.entries(params)) {
      assert.ok(u.min <= u.p && u.p <= u.max, `${kind}.${k}.${path}: min ≤ p ≤ max`);
      assert.ok(['alta', 'media', 'baja'].includes(u.c), `${kind}.${k}.${path}: confianza`);
      assert.ok(PL[path], `${path}: falta etiqueta en PL`);
      for (const s of u.src) assert.ok(SRC[s] || s.startsWith('wp:'), `${kind}.${k}.${path}: fuente ${s}`);
    }
  }
});

test('tasas observadas: citan fuentes existentes', () => {
  for (const [k, rows] of Object.entries(OBS)) {
    assert.ok(THREATS[k], `OBS.${k}`);
    for (const r of rows) assert.ok(SRC[r[4]], `OBS.${k}: fuente ${r[4]}`);
  }
});

test('escenarios: mapas, tipos y blancos válidos', () => {
  for (const [k, sc] of Object.entries(SCENARIOS)) {
    assert.ok(TERRAIN[sc.map], `${k}: mapa ${sc.map}`);
    const names = new Set(sc.defs.map(d => d.name));
    for (const d of sc.defs) assert.ok(DEFENSES[d.type], `${k}: defensa ${d.type}`);
    for (const s of sc.salvos) {
      assert.ok(THREATS[s.type], `${k}: amenaza ${s.type}`);
      assert.ok(s.pts.length >= 2, `${k}: ruta de ${s.type}`);
      if (s.targetUnit) assert.ok(names.has(s.targetUnit), `${k}: blanco ${s.targetUnit}`);
    }
    for (const j of sc.jams) assert.ok(JAMMERS[j.type], `${k}: jammer ${j.type}`);
  }
});

test('escenarios: objetivos, posiciones dentro del mapa, blancos de las salvas y metas válidas', () => {
  const KINDS = ['destroy', 'damage', 'protect', 'survive', 'killUnit', 'keepUnit'];
  for (const [k, sc] of Object.entries(SCENARIOS)) {
    const t = TERRAIN[sc.map], wKm = t.W * t.cell / 1000, hKm = t.H * t.cell / 1000;
    const inMap = (x, y, what) => assert.ok(x >= 0 && y >= 0 && x <= wKm && y <= hKm, `${k}: ${what} (${x}, ${y}) fuera del mapa ${wKm}×${hKm} km`);
    const objNames = new Set(sc.objectives.map(o => o.name)), defNames = new Set(sc.defs.map(d => d.name));
    assert.equal(objNames.size, sc.objectives.length, `${k}: nombres de objetivo repetidos`);
    for (const o of sc.objectives) { assert.ok(TARGET_TYPES[o.type], `${k}: tipo de objetivo ${o.type}`); inMap(o.x, o.y, o.name); }
    for (const d of sc.defs) inMap(d.x, d.y, d.name || d.type);
    for (const j of sc.jams) inMap(j.x, j.y, j.type);
    for (const s of sc.salvos) {
      for (const p of s.pts) inMap(p[0], p[1], `ruta de ${s.type}`);
      if (s.targetObj) assert.ok(objNames.has(s.targetObj), `${k}: blanco ${s.targetObj}`);
    }
    for (const g of sc.goals) {
      assert.ok(['ataque', 'defensa'].includes(g.side), `${k}: bando de "${g.text}"`);
      assert.ok(KINDS.includes(g.kind), `${k}: tipo de meta ${g.kind}`);
      const pool = ['killUnit', 'keepUnit'].includes(g.kind) ? defNames : objNames;
      assert.ok(pool.has(g.target), `${k}: la meta "${g.text}" apunta a "${g.target}", que no existe`);
      assert.ok(g.text, `${k}: meta sin texto`);
    }
  }
});

test('escenarios jugables: briefing completo y al menos una meta principal por bando', () => {
  for (const [k, sc] of Object.entries(SCENARIOS)) {
    if (!sc.salvos.length) continue;   // los mapas vacíos son para armar a mano
    for (const f of ['name', 'player', 'time', 'description', 'conditions', 'success', 'failure']) assert.ok(sc[f], `${k}: falta ${f}`);
    assert.ok(sc.forces?.defensa && sc.forces?.ataque, `${k}: faltan las fuerzas`);
    assert.ok(sc.rulesText?.length, `${k}: faltan las reglas especiales`);
    assert.ok(sc.objectives.length, `${k}: sin objetivos`);
    for (const side of ['ataque', 'defensa']) assert.ok(sc.goals.some(g => g.side === side && g.primary), `${k}: sin meta principal para ${side}`);
  }
});

test('relieves: tamaño de la grilla coherente con los datos', () => {
  for (const [k, t] of Object.entries(TERRAIN)) {
    assert.equal(atob(t.b64).length, t.W * t.H * 2, k);
    if (t.water) assert.equal(atob(t.water).length, Math.ceil(t.W * t.H / 8), k + ': máscara de agua');
  }
});

test('los valores escritos en el catálogo coinciden con el probable de UNC (lectura cómoda)', async () => {
  // Se importan los módulos crudos en un proceso aparte para ver los literales antes de applyProbable().
  const { execFileSync } = await import('node:child_process');
  const out = execFileSync(process.execPath, ['--input-type=module', '-e', `
    const { THREATS } = await import('./src/data/threats.js'); const { DEFENSES } = await import('./src/data/defenses.js'); const { JAMMERS } = await import('./src/data/jammers.js'); const { C2_LEVELS } = await import('./src/data/c2.js');
    console.log(JSON.stringify({ thr: THREATS, def: DEFENSES, jam: JAMMERS, c2: C2_LEVELS }));`], { encoding: 'utf8' });
  const raw = JSON.parse(out), get = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
  for (const [kind, set] of Object.entries(UNC)) for (const [k, params] of Object.entries(set)) for (const [path, u] of Object.entries(params)) {
    if (path.startsWith('info.')) continue;
    const v = get(raw[kind][k], path);
    if (v !== undefined) assert.equal(v, u.p, `${kind}.${k}.${path}: literal ${v} ≠ probable ${u.p}`);
  }
});

test('remotePk de la C2 coordinada tiene rango en UNC y el sorteo lo mueve', () => {
  const u = UNC.c2.coordinada.remotePk;
  assert.equal(C2_LEVELS.coordinada.remotePk, u.p);
  const seen = new Set(); let x = 0.1;
  try { for (let k = 0; k < 20; k++) { applySample(() => (x = (x * 9301 + 0.49297) % 1)); seen.add(C2_LEVELS.coordinada.remotePk); assert.ok(C2_LEVELS.coordinada.remotePk >= u.min && C2_LEVELS.coordinada.remotePk <= u.max); } } finally { applyProbable(); }
  assert.ok(seen.size > 5, 'varía entre corridas');
  assert.equal(C2_LEVELS.coordinada.remotePk, u.p, 'applyProbable lo repone');
});
