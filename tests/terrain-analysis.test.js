// Lectura del relieve: puntos altos, relieve relativo y curvas sobre un terreno sintético.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setMap, flatMap, surf } from '../src/physics/terrain.js';
import { analysis, relativeRelief, terrainClass, contourLines, findPeaks } from '../src/physics/terrain-analysis.js';
import { builtinMap } from '../src/physics/terrain.js';

// Dos cerros gaussianos: uno de 800 m en (10, 10) km y otro de 300 m en (30, 25) km.
function hills() {
  const m = flatMap(200, 200, 200);
  for (let i = 0; i < 200; i++) for (let j = 0; j < 200; j++) {
    const x = (j + 0.5) * 0.2, y = (i + 0.5) * 0.2;
    m.data[i * 200 + j] = Math.round(10 + 800 * Math.exp(-((x - 10) ** 2 + (y - 10) ** 2) / 8) + 300 * Math.exp(-((x - 30) ** 2 + (y - 25) ** 2) / 6));
  }
  return setMap(m);
}

test('puntos altos: encuentra las dos cimas, ordenadas por dominancia', () => {
  hills();
  const p = analysis().peaks;
  assert.ok(p.length >= 2);
  assert.ok(Math.hypot(p[0].x - 10, p[0].y - 10) < 0.3 && p[0].e > 790);
  assert.ok(Math.hypot(p[1].x - 30, p[1].y - 25) < 0.3 && p[1].e > 290);
});

test('relieve relativo: positivo en la cima, negativo al pie, y lectura coherente', () => {
  hills();
  assert.ok(relativeRelief(10, 10) > 300);
  assert.ok(relativeRelief(16, 10) < 0);                 // pie del cerro: más bajo que su entorno
  assert.equal(terrainClass(10, 10), 'Cota dominante');
  assert.equal(terrainClass(13.5, 10), 'Ladera');       // pendiente ≈ 15%
  assert.equal(terrainClass(38, 38), 'Llano');
});

test('la lectura del relieve no modifica el terreno físico', () => {
  const m = hills(); const before = m.data.slice();
  analysis(); contourLines(); relativeRelief(5, 5);
  assert.deepEqual(m.data, before);
  assert.equal(surf(10.1, 10.1) > 790, true);
});

test('curvas de nivel: segmentos cerrados alrededor de la cima', () => {
  hills();
  const c = contourLines();
  assert.equal(c.interval, 100);
  assert.ok(c.minor.length > 0 && c.index.length > 0);
  // todos los vértices de la curva de 500 m (índice) quedan a la distancia esperada del centro
  const r500 = Math.sqrt(-8 * Math.log((500 - 10) / 800));
  for (let i = 0; i < c.index.length; i += 2) {
    const d = Math.hypot(c.index[i] - 10, c.index[i + 1] - 10);
    if (d < 6) assert.ok(Math.abs(d - r500) < 0.3, `vértice a ${d.toFixed(2)} km`);
  }
});

test('mapas incluidos: puntos altos razonables y separados', () => {
  for (const k of ['monterey', 'goteborg']) {
    const m = setMap(builtinMap(k)), p = findPeaks(m);
    assert.ok(p.length > 10, k);
    assert.ok(p.every(a => a.e > 0 && a.e <= m.max));
    for (let i = 0; i < Math.min(p.length, 60); i++) for (let j = 0; j < i; j++) assert.ok(Math.hypot(p[i].x - p[j].x, p[i].y - p[j].y) >= 1.5);
  }
});

test('Kiev: el Dniéper y el embalse están en la máscara de agua; las centrales, en tierra', async () => {
  const { setMap, builtinMap, isWater } = await import('../src/physics/terrain.js');
  const { terrainClass } = await import('../src/physics/terrain-analysis.js');
  setMap(builtinMap('kyiv'));
  assert.ok(isWater(40, 62), 'Dniéper frente al centro');
  assert.ok(isWater(34, 20), 'embalse de Kiev');
  assert.equal(terrainClass(40, 62), 'Río o lago');
  for (const [x, y] of [[40.3, 67.4], [46.9, 52], [37.1, 61]]) assert.ok(!isWater(x, y), `(${x}, ${y}) en tierra`);
});
