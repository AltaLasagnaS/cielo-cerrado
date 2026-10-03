// ---------------- LECTURA DEL RELIEVE ----------------
// Análisis visual/educativo del terreno: puntos altos, relieve relativo, pendiente y curvas de nivel.
// Usa exactamente la misma grilla que surf() y los cálculos de línea de vista, pero NO modifica el
// relieve físico: solo deriva información para mostrar. Ver docs/FISICA.md §9.
import { clamp } from '../util/math.js';
import { MAP, surf } from './terrain.js';

/** Radio (km) del entorno contra el que se mide el "relieve relativo". */
export const RELIEF_RADIUS_KM = 5;

const cache = new WeakMap();

/** Análisis del mapa activo (se calcula una vez por mapa y se cachea). */
export function analysis(map = MAP) {
  let a = cache.get(map);
  if (!a || a.data !== map.data) { a = analyze(map); cache.set(map, a); }
  return a;
}

function analyze(map) {
  const { W, H, data } = map;
  // Imagen integral de la superficie (mar = 0) para promedios en ventana en O(1).
  const I = new Float64Array((W + 1) * (H + 1));
  for (let i = 0; i < H; i++) {
    let row = 0;
    for (let j = 0; j < W; j++) { row += Math.max(0, data[i * W + j]); I[(i + 1) * (W + 1) + j + 1] = I[i * (W + 1) + j + 1] + row; }
  }
  const R = Math.max(1, Math.round(RELIEF_RADIUS_KM / map.cellKm));
  const mean = new Float32Array(W * H);
  for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) {
    const i0 = Math.max(0, i - R), i1 = Math.min(H, i + R + 1), j0 = Math.max(0, j - R), j1 = Math.min(W, j + R + 1);
    const s = I[i1 * (W + 1) + j1] - I[i0 * (W + 1) + j1] - I[i1 * (W + 1) + j0] + I[i0 * (W + 1) + j0];
    mean[i * W + j] = s / ((i1 - i0) * (j1 - j0));
  }
  return { data: map.data, mean, peaks: findPeaks(map), contours: null };
}

/** Interpola una grilla por celda en (x, y) km con la misma convención de centros que elev(). */
function sampleGrid(map, g, x, y) {
  const c = map.cellKm, fx = clamp(x / c - 0.5, 0, map.W - 1.001), fy = clamp(y / c - 0.5, 0, map.H - 1.001);
  const j = fx | 0, i = fy | 0, tx = fx - j, ty = fy - i, W = map.W, k = i * W + j;
  return (g[k] * (1 - tx) + g[k + 1] * tx) * (1 - ty) + (g[k + W] * (1 - tx) + g[k + W + 1] * tx) * ty;
}

/** Elevación del punto menos el promedio del terreno en RELIEF_RADIUS_KM a la redonda (m). */
export function relativeRelief(x, y) { return surf(x, y) - sampleGrid(MAP, analysis().mean, x, y); }

/** Pendiente en % (diferencias centradas a ± una celda). */
export function slopeAt(x, y) {
  const c = MAP.cellKm, m = c * 2000;
  return 100 * Math.hypot((surf(x + c, y) - surf(x - c, y)) / m, (surf(x, y + c) - surf(x, y - c)) / m);
}

/** Lectura táctica simple del punto: cota dominante, ladera, valle, llano o mar. */
export function terrainClass(x, y) {
  if (surf(x, y) <= 0) return 'Mar';
  const rel = relativeRelief(x, y), sl = slopeAt(x, y);
  if (rel >= 80) return sl < 15 ? 'Cota dominante' : 'Ladera alta';
  if (rel <= -60) return 'Valle / hondonada';
  if (sl >= 12) return 'Ladera';
  return Math.abs(rel) > 25 ? 'Terreno ondulado' : 'Llano';
}

/**
 * Puntos altos relevantes: máximos locales que dominan su entorno de ~1 km y sobresalen al menos
 * minRelief metros sobre lo más bajo en ~3 km. Se ordenan por "dominancia" (cuánto sobresalen) y se
 * ralean para que queden al menos 1,5 km entre sí. Devuelve [{ x, y (km), e (m), relief (m) }].
 */
export function findPeaks(map) {
  const { W, H, data, cellKm: c } = map;
  let maxE = 0; for (let k = 0; k < data.length; k++) if (data[k] > maxE) maxE = data[k];
  const minRelief = Math.max(25, 0.04 * maxE);
  const rMax = Math.max(1, Math.round(1 / c)), rMin = Math.max(2, Math.round(3 / c));
  const cand = [];
  for (let i = 1; i < H - 1; i++) for (let j = 1; j < W - 1; j++) {
    const k = i * W + j, e = data[k]; if (e <= 0) continue;
    // máximo estricto respecto de vecinos "anteriores" y no estricto de los "posteriores" (desempata mesetas)
    let ok = true;
    for (let di = -1; di <= 1 && ok; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue; const n = data[k + di * W + dj];
      if (n > e || (n === e && (di < 0 || (di === 0 && dj < 0)))) { ok = false; break; }
    }
    if (ok) cand.push(k);
  }
  const peaks = [];
  for (const k of cand) {
    const i = (k / W) | 0, j = k - i * W, e = data[k];
    let dom = true;
    for (let di = -rMax; di <= rMax && dom; di++) for (let dj = -rMax; dj <= rMax; dj++) {
      const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= H || jj >= W) continue;
      if (data[ii * W + jj] > e) { dom = false; break; }
    }
    if (!dom) continue;
    let lo = e;
    for (let di = -rMin; di <= rMin; di++) for (let dj = -rMin; dj <= rMin; dj++) {
      const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= H || jj >= W) continue;
      const v = Math.max(0, data[ii * W + jj]); if (v < lo) lo = v;
    }
    if (e - lo >= minRelief) peaks.push({ x: (j + 0.5) * c, y: (i + 0.5) * c, e, relief: e - lo });
  }
  peaks.sort((a, b) => b.relief - a.relief || b.e - a.e);
  const out = [];
  for (const p of peaks) { if (out.every(q => Math.hypot(q.x - p.x, q.y - p.y) >= 1.5)) out.push(p); if (out.length >= 400) break; }
  return out;
}

/** Equidistancia de curvas según el desnivel del mapa (m). */
export const contourInterval = maxE => maxE > 600 ? 100 : maxE > 200 ? 50 : 20;

/**
 * Curvas de nivel por "marching squares" sobre los centros de celda. Devuelve, en km,
 * { interval, coast: [x1,y1,x2,y2,...], minor: [...], index: [...] } (index = cada 5 curvas).
 * La costa es la curva de 0 m.
 */
export function contourLines(map = MAP) {
  const a = analysis(map);
  if (a.contours) return a.contours;
  const { W, H, data, cellKm: c } = map;
  let maxE = 0; for (let k = 0; k < data.length; k++) if (data[k] > maxE) maxE = data[k];
  const interval = contourInterval(Math.max(50, maxE));
  const res = { interval, coast: [], minor: [], index: [] };
  const levels = [0.5];
  for (let L = interval; L < maxE; L += interval) levels.push(L);
  for (const L of levels) {
    const out = L === 0.5 ? res.coast : (Math.round(L / interval) % 5 === 0 ? res.index : res.minor);
    for (let i = 0; i < H - 1; i++) for (let j = 0; j < W - 1; j++) {
      const k = i * W + j;
      const v0 = data[k], v1 = data[k + 1], v2 = data[k + W + 1], v3 = data[k + W];
      const idx = (v0 > L ? 8 : 0) | (v1 > L ? 4 : 0) | (v2 > L ? 2 : 0) | (v3 > L ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      const x0 = (j + 0.5) * c, y0 = (i + 0.5) * c;
      const e = [ // puntos de cruce en cada lado: arriba, derecha, abajo, izquierda
        () => [x0 + c * (L - v0) / (v1 - v0), y0],
        () => [x0 + c, y0 + c * (L - v1) / (v2 - v1)],
        () => [x0 + c * (L - v3) / (v2 - v3), y0 + c],
        () => [x0, y0 + c * (L - v0) / (v3 - v0)]
      ];
      const seg = (p, q) => { const A = e[p](), B = e[q](); out.push(A[0], A[1], B[0], B[1]); };
      const mid = (v0 + v1 + v2 + v3) / 4 > L;
      switch (idx) {
        case 1: case 14: seg(3, 2); break;
        case 2: case 13: seg(2, 1); break;
        case 3: case 12: seg(3, 1); break;
        case 4: case 11: seg(0, 1); break;
        case 6: case 9: seg(0, 2); break;
        case 7: case 8: seg(3, 0); break;
        case 5: if (mid) { seg(3, 0); seg(2, 1); } else { seg(3, 2); seg(0, 1); } break;
        case 10: if (mid) { seg(0, 1); seg(3, 2); } else { seg(3, 0); seg(2, 1); } break;
      }
    }
  }
  a.contours = res;
  return res;
}
