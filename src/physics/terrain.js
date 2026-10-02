'use strict';
// ---------------- TERRENO ----------------
let MAP = null;
function decodeB64(b64) { const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return new Int16Array(u8.buffer); }
function setMap(m) {
  MAP = m; MAP.cellKm = m.cell / 1000; MAP.wKm = m.W * MAP.cellKm; MAP.hKm = m.H * MAP.cellKm;
  let mx = -1e9, mn = 1e9; for (let i = 0; i < m.data.length; i++) { const v = m.data[i]; if (v > mx) mx = v; if (v < mn) mn = v; }
  MAP.max = mx; MAP.min = mn;
  buildBase(); fitView();
}
function loadBuiltin(key) { const t = TERRAIN[key]; setMap({ key, name: t.name, W: t.W, H: t.H, cell: t.cell, latN: t.latN, lonW: t.lonW, dlat: t.dlat, dlon: t.dlon, places: t.places.filter(p => p[1] >= 0 && p[1] <= t.W * t.cell / 1000 && p[2] >= 0 && p[2] <= t.H * t.cell / 1000), data: decodeB64(t.b64) }); }
function elev(x, y) { // bilinear, km
  const c = MAP.cellKm, fx = x / c - 0.5, fy = y / c - 0.5;
  if (fx < 0 || fy < 0 || fx >= MAP.W - 1 || fy >= MAP.H - 1) return -10;
  const j = fx | 0, i = fy | 0, tx = fx - j, ty = fy - i, W = MAP.W, d = MAP.data, k = i * W + j;
  return (d[k] * (1 - tx) + d[k + 1] * tx) * (1 - ty) + (d[k + W] * (1 - tx) + d[k + W + 1] * tx) * ty;
}
const surf = (x, y) => Math.max(0, elev(x, y));
function los(ax, ay, az, bx, by, bz) {
  const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy); if (d < 0.05) return true;
  const n = Math.min(700, Math.ceil(d / MAP.cellKm)), D = d * 1000;
  for (let i = 1; i < n; i++) { const f = i / n; const lz = az + (bz - az) * f; const b = (f * D) * ((1 - f) * D) / (2 * KR); if (surf(ax + dx * f, ay + dy * f) + 4 + b > lz) return false; }
  return true;
}
const latlon = (x, y) => [MAP.latN - (y / MAP.cellKm) * MAP.dlat, MAP.lonW + (x / MAP.cellKm) * MAP.dlon];
