// ---------------- MAPA BASE ----------------
// Pinta el relieve una sola vez en un canvas fuera de pantalla (1 píxel por celda): tintas
// hipsométricas, sombreado por pendiente, curvas de nivel y batimetría.
import { clamp } from '../util/math.js';
import { MAP } from '../physics/terrain.js';

export const baseCanvas = document.createElement('canvas');

export function buildBase() {
  const W = MAP.W, H = MAP.H, d = MAP.data;
  baseCanvas.width = W; baseCanvas.height = H;
  const cx = baseCanvas.getContext('2d'), img = cx.createImageData(W, H), px = img.data;
  const maxE = Math.max(50, MAP.max), ci = maxE > 600 ? 100 : maxE > 200 ? 50 : 20;
  const stops = [[0, [64, 78, 62]], [0.15, [86, 98, 70]], [0.35, [118, 112, 80]], [0.6, [140, 122, 96]], [0.85, [160, 150, 136]], [1, [196, 196, 192]]];
  const col = t => { for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const a = stops[i - 1], b = stops[i], f = (t - a[0]) / (b[0] - a[0]); return a[1].map((v, k) => v + (b[1][k] - v) * f); } return stops[stops.length - 1][1]; };
  const cell = MAP.cell;
  for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) {
    const k = i * W + j, e = d[k], o = k * 4;
    const eL = d[i * W + Math.max(0, j - 1)], eR = d[i * W + Math.min(W - 1, j + 1)], eU = d[Math.max(0, i - 1) * W + j], eD = d[Math.min(H - 1, i + 1) * W + j];
    let r, g, b;
    if (e <= 0) {
      const t = clamp(-e / 2500, 0, 1); r = 22 - 12 * t; g = 44 - 22 * t; b = 62 - 22 * t;
      if (eL > 0 || eR > 0 || eU > 0 || eD > 0) { r = 140; g = 170; b = 180; }
    } else {
      const c = col(Math.pow(e / maxE, 0.7));
      const sx = (Math.max(0, eR) - Math.max(0, eL)) / (2 * cell), sy = (Math.max(0, eD) - Math.max(0, eU)) / (2 * cell);
      const sh = clamp(1 - (sx - sy) * 1.6 * 0.7, 0.45, 1.35);
      r = c[0] * sh * 0.78; g = c[1] * sh * 0.78; b = c[2] * sh * 0.78;
      const q = Math.floor(e / ci);
      if (Math.floor(Math.max(0, eR) / ci) !== q || Math.floor(Math.max(0, eD) / ci) !== q) { const strong = (q % 5 === 0); r *= strong ? 0.62 : 0.8; g *= strong ? 0.62 : 0.8; b *= strong ? 0.62 : 0.8; }
    }
    px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;
  }
  cx.putImageData(img, 0, 0);
  MAP.ci = ci;
}
