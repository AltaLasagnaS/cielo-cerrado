// @ts-check
// ---------------- TERRENO ----------------
// Grilla de elevaciones (m) en celdas cuadradas de MAP.cell metros. Coordenadas de mundo en km
// desde la esquina noroeste: x hacia el este, y hacia el sur. Elevación negativa = mar.
import { KR, LOS_MARGIN } from './constants.js';
import { TERRAIN } from '../data/index.js';

/**
 * Mapa activo (live binding: los módulos que lo importan ven siempre el actual).
 * Campos: key, name, W, H (celdas), cell (m), cellKm, wKm, hKm, latN, lonW, dlat, dlon,
 * places, data (Int16Array W×H), min, max.
 */
export let MAP = null;

/** Decodifica la grilla base64 (int16 little-endian) de los mapas incluidos. */
export function decodeB64(b64) { const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return new Int16Array(u8.buffer); }

/** Activa un mapa y calcula sus campos derivados (tamaño en km, elevación mínima y máxima). */
export function setMap(m) {
  MAP = m; MAP.cellKm = m.cell / 1000; MAP.wKm = m.W * MAP.cellKm; MAP.hKm = m.H * MAP.cellKm;
  let mx = -1e9, mn = 1e9; for (let i = 0; i < m.data.length; i++) { const v = m.data[i]; if (v > mx) mx = v; if (v < mn) mn = v; }
  MAP.max = mx; MAP.min = mn;
  return MAP;
}

/** Decodifica una máscara de 1 bit por celda en base64 → Uint8Array (0/1) de n celdas. */
export function decodeBits(b64, n) { const bin = atob(b64), out = new Uint8Array(n); for (let q = 0; q < n; q++) out[q] = (bin.charCodeAt(q >> 3) >> (q & 7)) & 1; return out; }

/**
 * Arma el objeto de mapa de uno de los relieves incluidos (sin activarlo). water = máscara de ríos
 * y lagos (si el relieve la trae): solo para el dibujo y la lectura del terreno, no para la física.
 */
export function builtinMap(key) { const t = TERRAIN[key]; return { key, name: t.name, W: t.W, H: t.H, cell: t.cell, latN: t.latN, lonW: t.lonW, dlat: t.dlat, dlon: t.dlon, places: t.places.filter(p => p[1] >= 0 && p[1] <= t.W * t.cell / 1000 && p[2] >= 0 && p[2] <= t.H * t.cell / 1000), data: decodeB64(t.b64), water: t.water ? decodeBits(t.water, t.W * t.H) : null }; }

/** ¿La celda de (x, y) km es río o lago según la máscara del relieve? (false si no hay máscara). */
export function isWater(x, y) {
  const w = MAP?.water; if (!w) return false;
  const j = Math.floor(x / MAP.cellKm), i = Math.floor(y / MAP.cellKm);
  return i >= 0 && j >= 0 && i < MAP.H && j < MAP.W && w[i * MAP.W + j] === 1;
}

/** Mapa plano a nivel 0 (útil para tests y para aislar la física del relieve). */
export function flatMap(W = 450, H = 555, cell = 200) { return { key: 'flat', name: 'Plano', W, H, cell, latN: 0, lonW: 0, dlat: cell / 111000, dlon: cell / 111000, places: [], data: new Int16Array(W * H) }; }

/** Elevación en metros en (x, y) km, con interpolación bilineal. Fuera del mapa: -10 (mar). */
export function elev(x, y) {
  const c = MAP.cellKm, fx = x / c - 0.5, fy = y / c - 0.5;
  if (fx < 0 || fy < 0 || fx >= MAP.W - 1 || fy >= MAP.H - 1) return -10;
  const j = fx | 0, i = fy | 0, tx = fx - j, ty = fy - i, W = MAP.W, d = MAP.data, k = i * W + j;
  return (d[k] * (1 - tx) + d[k + 1] * tx) * (1 - ty) + (d[k + W] * (1 - tx) + d[k + W + 1] * tx) * ty;
}

/** Altura de la superficie (el mar cuenta como 0 m). */
export const surf = (x, y) => Math.max(0, elev(x, y));

/**
 * Línea de vista entre A y B (x, y en km; z en metros sobre el nivel del mar).
 * Muestrea el segmento una vez por celda (máx. 700 muestras) y compara la altura del rayo con
 * el relieve + LOS_MARGIN + el abultamiento de la Tierra curva (modelo 4/3):
 * b = d₁·d₂ / (2·KR), donde d₁ y d₂ son las distancias a cada extremo.
 */
export function los(ax, ay, az, bx, by, bz) {
  const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy); if (d < 0.05) return true;
  const n = Math.min(700, Math.ceil(d / MAP.cellKm)), D = d * 1000;
  for (let i = 1; i < n; i++) { const f = i / n; const lz = az + (bz - az) * f; const b = (f * D) * ((1 - f) * D) / (2 * KR); if (surf(ax + dx * f, ay + dy * f) + LOS_MARGIN + b > lz) return false; }
  return true;
}

/** Coordenadas de mapa (km) → [latitud, longitud] aproximadas. */
export const latlon = (x, y) => [MAP.latN - (y / MAP.cellKm) * MAP.dlat, MAP.lonW + (x / MAP.cellKm) * MAP.dlon];

// ---------------- IMPORTACIÓN SRTM (.hgt) ----------------

/** Interpreta el nombre de un tile SRTM ("N50E030.hgt") → { lat0, lon0 } o null. */
export function parseHgtName(name) {
  const m = /([NS])(\d{1,2})([EW])(\d{1,3})/i.exec(name);
  if (!m) return null;
  return { lat0: (m[1].toUpperCase() === 'N' ? 1 : -1) * +m[2], lon0: (m[3].toUpperCase() === 'E' ? 1 : -1) * +m[4] };
}

/**
 * Convierte un tile SRTM descomprimido (1201² o 3601² muestras int16 big-endian) a un mapa
 * del juego con celdas de 200 m. Devuelve { map, kmx, kmy } o null si el tamaño no es válido.
 */
export function hgtToMap(buf, tile, fileName) {
  const n = Math.round(Math.sqrt(buf.byteLength / 2));
  if (n * n * 2 !== buf.byteLength || (n !== 1201 && n !== 3601)) return null;
  const dv = new DataView(buf);
  const { lat0, lon0 } = tile;
  const latc = lat0 + 0.5, kmx = 111.32 * Math.cos(latc * Math.PI / 180), kmy = 111;
  const cell = 200, W = Math.round(kmx * 1000 / cell), H = Math.round(kmy * 1000 / cell);
  const data = new Int16Array(W * H);
  for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) {
    const sy = (i + 0.5) / H * (n - 1), sx = (j + 0.5) / W * (n - 1); const a = Math.floor(sy), b = Math.floor(sx);
    let v = dv.getInt16((a * n + b) * 2, false); if (v < -1000) v = 0; data[i * W + j] = v <= 0 ? -5 : v;
  }
  return { map: { key: 'hgt', name: fileName, W, H, cell, latN: lat0 + 1, lonW: lon0, dlat: 1 / H, dlon: 1 / W, places: [], data }, kmx, kmy };
}
