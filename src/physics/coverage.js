// ---------------- COBERTURA ----------------
// Mapa de cobertura: en qué celdas al menos un sensor ve a un blanco de referencia volando a una
// altura fija sobre el terreno. Considera relieve, curvatura 4/3, RCS por banda, sectores e
// interferencia. Ver docs/FISICA.md §8.
import { D } from '../data/index.js';
import { clamp } from '../util/math.js';
import { KR, LOS_MARGIN } from './constants.js';
import { MAP } from './terrain.js';
import { antZ, detR, inSector, jamJ } from './radar.js';

/**
 * Calcula la grilla de cobertura sobre el mapa activo.
 * @param units  unidades desplegadas (solo cuentan las que tienen sensor)
 * @param jams   interferidores
 * @param ref    ficha de la amenaza de referencia (THREATS[k])
 * @param agl    altura del blanco sobre el terreno (m)
 * @returns Uint8Array W×H con la cantidad de sensores que ven cada celda.
 *
 * Método: para cada sensor se lanzan N rayos radiales (N ≥ 360, según el alcance) y se recorre cada
 * rayo guardando el máximo ángulo de elevación del relieve visto hasta ahí ("horizonte acumulado"):
 * una celda es visible si el ángulo hacia el blanco supera a ese máximo. Es el algoritmo clásico de
 * viewshed radial, O(rayos × pasos) en vez de O(celdas × pasos).
 */
export function coverageGrid(units, jams, ref, agl) {
  const W = MAP.W, H = MAP.H, c = MAP.cellKm, data = MAP.data;
  const cov = new Uint8Array(W * H), stamp = new Int32Array(W * H).fill(-1);
  let ri = 0;
  for (const u of units) {
    const d = D(u), r = d.radar; if (!r) continue; ri++;
    if (r.band === 'ACU') {
      if (ref.cls !== 'dron' || agl > (r.altMax || 3000)) continue;
      const R = r.R1, i0 = Math.max(0, ((u.y - R) / c) | 0), i1 = Math.min(H - 1, ((u.y + R) / c) | 0), j0 = Math.max(0, ((u.x - R) / c) | 0), j1 = Math.min(W - 1, ((u.x + R) / c) | 0);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k = i * W + j; if (stamp[k] !== ri && Math.hypot((j + .5) * c - u.x, (i + .5) * c - u.y) <= R) { stamp[k] = ri; cov[k]++; } }
      continue;
    }
    const hr = antZ(u), st = c * 0.6;
    const Rmax = r.band === 'OPT' ? r.R1 : detR(u, ref, 0);
    const N = clamp(Math.ceil(2 * Math.PI * Math.min(Rmax, MAP.wKm + MAP.hKm) / (c * 0.7)), 360, 6000);
    for (let a = 0; a < N; a++) {
      const az = a * 360 / N; if (!inSector(u, az)) continue;
      const J = jamJ(u, az, jams); const R = r.band === 'OPT' ? r.R1 : detR(u, ref, J);
      const dx = Math.sin(az * Math.PI / 180), dy = -Math.cos(az * Math.PI / 180);
      // intersección rayo-caja
      let tmin = 0, tmax = R;
      for (const [o, dd, lo, hi] of [[u.x, dx, 0, MAP.wKm], [u.y, dy, 0, MAP.hKm]]) {
        if (Math.abs(dd) < 1e-9) { if (o < lo || o > hi) { tmax = -1; } continue; }
        let t1 = (lo - o) / dd, t2 = (hi - o) / dd; if (t1 > t2) [t1, t2] = [t2, t1]; tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      }
      if (tmax <= tmin) continue;
      let maxS = -Infinity;
      // pre-pasada fuera del mapa (sobre el mar, elevación 0)
      for (let dist = st; dist <= tmax; dist += st) {
        const x = u.x + dx * dist, y = u.y + dy * dist, dm = dist * 1000, curv = dm * dm / (2 * KR);
        let e = 0, k = -1;
        if (dist >= tmin) { const j = (x / c) | 0, i = (y / c) | 0; if (j >= 0 && i >= 0 && j < W && i < H) { k = i * W + j; e = Math.max(0, data[k]); } }
        const tS = (e + LOS_MARGIN - curv - hr) / dm, gS = (e + agl - curv - hr) / dm;
        if (k >= 0 && gS >= maxS && stamp[k] !== ri) { stamp[k] = ri; cov[k]++; }
        if (tS > maxS) maxS = tS;
      }
    }
  }
  return cov;
}
