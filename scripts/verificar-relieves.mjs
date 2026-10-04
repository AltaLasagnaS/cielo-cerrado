// Verifica el origen de los dos relieves incluidos que no se generaron con gen-terrain.mjs
// (Monterey y Gotemburgo) comparándolos contra las fuentes públicas candidatas. Baja los tiles de
// AWS (Terrain Tiles de Mapzen) a una carpeta temporal. Ver docs/DATOS-Y-FUENTES.md §6.
//
//   node scripts/verificar-relieves.mjs
//
// - Gotemburgo contra SRTM de 1″ (skadi, tile N57E011), promediando las muestras de cada celda.
// - Monterey contra "terrarium" al zoom 9 (SRTM/NED en tierra y batimetría en el mar).
import { gunzipSync, inflateSync } from 'node:zlib';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TERRAIN } from '../src/data/terrain/index.js';
import { decodeB64 } from '../src/physics/terrain.js';

const BASE = 'https://s3.amazonaws.com/elevation-tiles-prod', DIR = join(tmpdir(), 'cielo-relieves');

async function fetchCached(path) {
  const f = join(DIR, path.replace(/\//g, '_'));
  if (!existsSync(f)) {
    const r = await fetch(BASE + '/' + path); if (!r.ok) throw new Error(path + ': HTTP ' + r.status);
    await writeFile(f, Buffer.from(await r.arrayBuffer()));
  }
  return readFile(f);
}

/** PNG de 8 bits RGB/RGBA sin entrelazar → { bpp, px }. */
function readPng(b) {
  let p = 8, W, H, ct; const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), type = b.toString('ascii', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { W = d.readUInt32BE(0); H = d.readUInt32BE(4); ct = d[9]; }
    else if (type === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3, raw = inflateSync(Buffer.concat(idat)), st = W * bpp, out = Buffer.alloc(H * st);
  for (let y = 0; y < H; y++) {
    const f = raw[y * (st + 1)], o = y * (st + 1) + 1;
    for (let x = 0; x < st; x++) {
      const a = x >= bpp ? out[y * st + x - bpp] : 0, up = y ? out[(y - 1) * st + x] : 0, c = x >= bpp && y ? out[(y - 1) * st + x - bpp] : 0;
      let v = raw[o + x];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const q = a + up - c, pa = Math.abs(q - a), pb = Math.abs(q - up), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      out[y * st + x] = v & 255;
    }
  }
  return { bpp, px: out };
}

/** Compara la grilla del mapa m con f(lat, lon de la esquina NO de la celda) → estadísticas. */
function compare(m, f, onlyLand) {
  const a = decodeB64(m.b64); let n = 0, w3 = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0; const ds = [];
  for (let i = 0; i < m.H; i += 2) for (let j = 0; j < m.W; j += 2) {
    const x = a[i * m.W + j]; if (onlyLand && x <= 0) continue;
    const v = f(m.latN - i * m.dlat, m.lonW + j * m.dlon, m); if (v == null) continue;
    const d = Math.abs(v - x); n++; ds.push(d); if (d <= 3) w3++;
    sx += x; sy += v; sxx += x * x; syy += v * v; sxy += x * v;
  }
  ds.sort((p, q) => p - q);
  const r = (n * sxy - sx * sy) / Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
  return { celdas: n, correlacion: +r.toFixed(4), medianaM: ds[n >> 1], p90M: ds[Math.floor(n * 0.9)], dentroDe3m: (100 * w3 / n).toFixed(1) + '%' };
}

await mkdir(DIR, { recursive: true });

// Gotemburgo: promedio de las muestras de 1″ dentro de cada celda (mar = −5, como el importador .hgt)
const srtm = gunzipSync(await fetchCached('skadi/N57/N57E011.hgt.gz'));
const s1 = (lat, lon) => { const r = Math.round((58 - lat) * 3600), c = Math.round((lon - 11) * 3600); if (r < 0 || c < 0 || r > 3600 || c > 3600) return null; const v = srtm.readInt16BE((r * 3601 + c) * 2); return v < -1000 ? 0 : v; };
const cellMean = (lat, lon, m) => {
  let s = 0, k = 0;
  for (let di = 0; di < m.dlat * 3600; di++) for (let dj = 0; dj < m.dlon * 3600; dj++) { const v = s1(lat - di / 3600, lon + dj / 3600); if (v != null) { s += v; k++; } }
  if (!k) return null; const v = Math.round(s / k); return v <= 0 ? -5 : v;
};
console.log('Gotemburgo vs SRTM 1″ N57E011 (celdas de tierra):', compare(TERRAIN.goteborg, cellMean, true));

// Monterey: terrarium z9, centro de la celda
const Z = 9, N = 2 ** Z, tiles = {};
const tileXY = (lat, lon) => [(lon + 180) / 360 * N, (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * N];
const m = TERRAIN.monterey;
const [x0, y0] = tileXY(m.latN, m.lonW).map(Math.floor), [x1, y1] = tileXY(m.latN - m.H * m.dlat, m.lonW + m.W * m.dlon).map(Math.floor);
for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) tiles[x + '/' + y] = readPng(await fetchCached(`terrarium/${Z}/${x}/${y}.png`));
const terr = (lat, lon, mm) => {
  const [X, Y] = tileXY(lat - mm.dlat / 2, lon + mm.dlon / 2), t = tiles[Math.floor(X) + '/' + Math.floor(Y)]; if (!t) return null;
  const o = (Math.min(255, Math.floor((Y % 1) * 256)) * 256 + Math.min(255, Math.floor((X % 1) * 256))) * t.bpp;
  return t.px[o] * 256 + t.px[o + 1] + t.px[o + 2] / 256 - 32768;
};
console.log('Monterey vs terrarium z9 (tierra y mar):', compare(m, terr, false));
