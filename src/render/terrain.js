// @ts-check
// ---------------- RELIEVE ----------------
// Dibujo del terreno en cuatro modos de lectura (S.relief):
//   normal    tintas hipsométricas + sombreado suave + curvas maestras discretas
//   peaks     igual que normal + marcadores "▲ 842 m" de los puntos altos relevantes
//   contours  base apagada + curvas de nivel nítidas (cada 5ª más gruesa)
//   shade     sombreado de relieve (hillshade) multidireccional, casi sin color
//
// Calidad: el raster se genera a k× la resolución de la grilla con interpolación bilineal (la misma
// que usa elev()) y se dibuja con suavizado, así que no aparecen bloques al acercar. No se inventa
// detalle: entre muestras solo se interpola. Costa, curvas y marcadores son vectores, nítidos a
// cualquier zoom y en pantallas de alta densidad (devicePixelRatio).
import { clamp } from '../util/math.js';
import { MAP } from '../physics/terrain.js';
import { analysis, contourLines } from '../physics/terrain-analysis.js';

export const RELIEF_MODES = { normal: 'Normal', peaks: 'Puntos altos', contours: 'Curvas de nivel', shade: 'Sombreado' };

/** Máximo de píxeles del raster de relieve (memoria y tiempo de cálculo acotados). */
const MAX_PX = 3.2e6;
const rasters = {};
let paths = null;

/** Prepara un mapa recién activado: invalida rásters y vectores y precalcula el análisis. */
export function buildBase() {
  for (const k in rasters) delete rasters[k];
  paths = null;
  analysis();
}

/** @type {Array<[number, number[]]>} */
const STOPS = [[0, [64, 78, 62]], [0.15, [86, 98, 70]], [0.35, [118, 112, 80]], [0.6, [140, 122, 96]], [0.85, [160, 150, 136]], [1, [196, 196, 192]]];
const tint = t => { for (let i = 1; i < STOPS.length; i++) if (t <= STOPS[i][0]) { const a = STOPS[i - 1], b = STOPS[i], f = (t - a[0]) / (b[0] - a[0]); return a[1].map((v, k) => v + (b[1][k] - v) * f); } return STOPS[STOPS.length - 1][1]; };

/**
 * Iluminación de Lambert (0–1): normal del terreno · dirección del sol.
 * gx = ∂z/∂x (hacia el este), gy = ∂z/∂y (hacia el sur), en m/m. Sol en azimut az y altura alt (°).
 * Terreno plano → sin(alt).
 */
function lambert(gx, gy, az, alt) {
  const a = az * Math.PI / 180, h = alt * Math.PI / 180;
  const lx = Math.sin(a) * Math.cos(h), ly = Math.cos(a) * Math.cos(h), lz = Math.sin(h);
  const nx = -gx, ny = gy, n = Math.hypot(nx, ny, 1);   // normal en ejes (este, norte, arriba)
  return Math.max(0, (nx * lx + ny * ly + lz) / n);
}

function buildRaster(mode) {
  const { W, H, data } = MAP;
  const k = clamp(Math.floor(Math.sqrt(MAX_PX / (W * H))), 1, 4), RW = W * k, RH = H * k;
  // 1) elevación interpolada en la grilla fina (centros de celda como en elev())
  const E = new Float32Array(RW * RH);
  for (let py = 0; py < RH; py++) {
    const fy = clamp((py + 0.5) / k - 0.5, 0, H - 1.001), i = fy | 0, ty = fy - i;
    for (let px = 0; px < RW; px++) {
      const fx = clamp((px + 0.5) / k - 0.5, 0, W - 1.001), j = fx | 0, tx = fx - j, q = i * W + j;
      E[py * RW + px] = (data[q] * (1 - tx) + data[q + 1] * tx) * (1 - ty) + (data[q + W] * (1 - tx) + data[q + W + 1] * tx) * ty;
    }
  }
  // 2) color + sombreado
  const cv = document.createElement('canvas'); cv.width = RW; cv.height = RH;
  const cx = cv.getContext('2d'), img = cx.createImageData(RW, RH), px = img.data;
  // escala de tintas desde la tierra más baja del mapa (en mapas sin mar, como Kiev, todo está a
  // 80–200 m: sin esto saldría casi de un solo color). Con mar, la base es 0 m como siempre.
  const base = Math.max(0, MAP.min), maxE = Math.max(base + 50, MAP.max), step = MAP.cell / k, zf = mode === 'shade' ? 3 : 2;
  const water = MAP.water;
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const o = y * RW + x, e = E[o];
    let r, g, b;
    // máscara de ríos y lagos (solo dibujo): celda de la grilla que contiene al píxel
    const wet = water && water[Math.min(H - 1, (y / k) | 0) * W + Math.min(W - 1, (x / k) | 0)] === 1;
    if (e <= 0 || wet) {
      const t = wet ? 0.05 : clamp(-e / 2500, 0, 1); r = 22 - 12 * t; g = 44 - 22 * t; b = 62 - 22 * t;
      if (wet) { r += 8; g += 14; b += 22; }
      if (mode === 'shade' || mode === 'contours') { r *= 0.8; g *= 0.8; b *= 0.85; }
    } else {
      const eL = Math.max(0, E[o - (x > 0 ? 1 : 0)]), eR = Math.max(0, E[o + (x < RW - 1 ? 1 : 0)]);
      const eU = Math.max(0, E[o - (y > 0 ? RW : 0)]), eD = Math.max(0, E[o + (y < RH - 1 ? RW : 0)]);
      const gx = zf * (eR - eL) / (2 * step), gy = zf * (eD - eU) / (2 * step);
      const c = tint(Math.pow(clamp((e - base) / (maxE - base), 0, 1), 0.7));
      if (mode === 'shade') {
        // multidireccional (NO, O, N) para no esconder laderas orientadas al sol
        const hs = 0.6 * lambert(gx, gy, 315, 40) + 0.25 * lambert(gx, gy, 270, 40) + 0.15 * lambert(gx, gy, 0, 40);
        const f = 0.15 + 0.95 * hs, gray = 168;
        r = (gray * 0.75 + c[0] * 0.25) * f; g = (gray * 0.75 + c[1] * 0.25) * f; b = (gray * 0.78 + c[2] * 0.22) * f;
      } else {
        const hs = lambert(gx, gy, 315, 45) / Math.SQRT1_2;   // 1 = terreno plano
        const f = 0.78 * (0.55 + 0.45 * hs);
        const mute = mode === 'contours' ? 0.62 : 1;
        r = c[0] * f * mute; g = c[1] * f * mute; b = c[2] * f * mute;
      }
    }
    const p = o * 4; px[p] = r; px[p + 1] = g; px[p + 2] = b; px[p + 3] = 255;
  }
  cx.putImageData(img, 0, 0);
  return cv;
}

function toPath(segs) { const p = new Path2D(); for (let i = 0; i < segs.length; i += 4) { p.moveTo(segs[i], segs[i + 1]); p.lineTo(segs[i + 2], segs[i + 3]); } return p; }
function getPaths() {
  if (!paths) { const c = contourLines(); paths = { interval: c.interval, coast: toPath(c.coast), minor: toPath(c.minor), index: toPath(c.index) }; }
  return paths;
}

/**
 * Dibuja el relieve. view = { ctx, dpr, s (px/km), ox, oy (px de la esquina NO del mapa), w, h }.
 * Devuelve la equidistancia de curvas dibujada (o null).
 */
export function drawTerrain(view, mode = 'normal') {
  const { ctx, dpr, s, ox, oy } = view;
  const ras = rasters[mode === 'peaks' ? 'normal' : mode] ||= buildRaster(mode === 'peaks' ? 'normal' : mode);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(ras, ox, oy, MAP.wKm * s, MAP.hKm * s);
  // vectores en km → pantalla
  const P = getPaths();
  ctx.save();
  ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
  const lw = px => px / s;
  ctx.lineJoin = 'round';
  if (mode === 'contours') {
    ctx.strokeStyle = 'rgba(232,214,170,.38)'; ctx.lineWidth = lw(0.8); ctx.stroke(P.minor);
    ctx.strokeStyle = 'rgba(240,222,176,.8)'; ctx.lineWidth = lw(1.4); ctx.stroke(P.index);
  } else if (mode !== 'shade') {
    if (s > 9) { ctx.strokeStyle = 'rgba(20,24,18,.18)'; ctx.lineWidth = lw(0.7); ctx.stroke(P.minor); }
    ctx.strokeStyle = 'rgba(20,24,18,.3)'; ctx.lineWidth = lw(0.9); ctx.stroke(P.index);
  }
  ctx.strokeStyle = 'rgba(150,182,194,.85)'; ctx.lineWidth = lw(1.1); ctx.stroke(P.coast);
  ctx.restore();
  return mode === 'contours' ? P.interval : null;
}

/**
 * Marcadores de puntos altos con separación mínima en pantalla (más puntos al acercar).
 * toS = proyección mundo → pantalla. Devuelve los puntos dibujados.
 */
export function drawPeaks(ctx, toS, w, h) {
  const shown = [], MIN = 74, MAXN = 45;
  for (const p of analysis().peaks) {
    const [sx, sy] = toS(p.x, p.y);
    if (sx < -20 || sy < -20 || sx > w + 20 || sy > h + 20) continue;
    if (shown.some(q => Math.abs(q[0] - sx) < MIN && Math.abs(q[1] - sy) < MIN * 0.45)) continue;
    shown.push([sx, sy, p]); if (shown.length >= MAXN) break;
  }
  ctx.font = '600 11px "IBM Plex Mono", monospace';
  for (const [sx, sy, p] of shown) {
    const txt = Math.round(p.e).toLocaleString('es-AR') + ' m', tw = ctx.measureText(txt).width;
    ctx.fillStyle = 'rgba(8,12,18,.72)'; ctx.fillRect(sx + 6, sy - 8, tw + 6, 15);
    ctx.beginPath(); ctx.moveTo(sx, sy - 6); ctx.lineTo(sx + 5.2, sy + 3); ctx.lineTo(sx - 5.2, sy + 3); ctx.closePath();
    ctx.fillStyle = '#f2d48a'; ctx.strokeStyle = '#1b1305'; ctx.lineWidth = 1.2; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f6e7c1'; ctx.fillText(txt, sx + 9, sy + 3.5);
  }
  return shown.map(q => q[2]);
}
