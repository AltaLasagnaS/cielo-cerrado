// Integridad del catálogo: atrapa errores de tipeo al agregar armas, fuentes o escenarios.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { THREATS, DEFENSES, JAMMERS, BANDS, CLS_NAME, UNC, OBS, SRC, SCENARIOS, TERRAIN, PL } from '../src/data/index.js';

const PROFILES = ['drone', 'cruise', 'bunt', 'ballistic', 'highdive', 'hilo'];

test('amenazas: campos obligatorios y perfiles válidos', () => {
  for (const [k, t] of Object.entries(THREATS)) {
    for (const f of ['name', 'short', 'side', 'cls', 'prof', 'v', 'rcs', 'cep', 'cost', 'sources']) assert.ok(t[f] !== undefined, `${k}.${f}`);
    assert.ok(CLS_NAME[t.cls], `${k}: clase ${t.cls}`);
    assert.ok(PROFILES.includes(t.prof), `${k}: perfil ${t.prof}`);
    if (['ballistic'].includes(t.prof)) assert.ok(t.apogee && t.launchDist, `${k}: apogee/launchDist`);
    if (['highdive', 'hilo'].includes(t.prof)) assert.ok(t.cruiseAlt && t.launchDist, `${k}: cruiseAlt/launchDist`);
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
  const CAT = { thr: THREATS, def: DEFENSES, jam: JAMMERS };
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

test('relieves: tamaño de la grilla coherente con los datos', () => {
  for (const [k, t] of Object.entries(TERRAIN)) assert.equal(atob(t.b64).length, t.W * t.H * 2, k);
});
