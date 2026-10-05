// @ts-check
// Capa de cobertura: turquesa donde algún sensor ve el blanco de referencia (más intenso con 2+),
// oscuro en los huecos. La grilla es por celda; acá se pinta a k× resolución interpolando
// bilinealmente "visible / no visible" y suavizando el borde, para que al acercar no aparezcan
// escalones. No cambia el resultado: el borde queda entre las mismas celdas que calculó la física.
import { clamp } from '../util/math.js';

export const covCanvas = document.createElement('canvas');
const MAX_PX = 2.4e6;
const smooth = f => { const t = clamp((f - 0.35) / 0.3, 0, 1); return t * t * (3 - 2 * t); };

export function paintCoverage(cov, W, H) {
  const k = clamp(Math.floor(Math.sqrt(MAX_PX / (W * H))), 1, 3), RW = W * k, RH = H * k;
  covCanvas.width = RW; covCanvas.height = RH;
  const cx = covCanvas.getContext('2d'), img = cx.createImageData(RW, RH), px = img.data;
  const at = (g, fx, fy) => {
    const j = fx | 0, i = fy | 0, tx = fx - j, ty = fy - i, q = i * W + j;
    return (g(q) * (1 - tx) + g(q + 1) * tx) * (1 - ty) + (g(q + W) * (1 - tx) + g(q + W + 1) * tx) * ty;
  };
  const one = q => cov[q] > 0 ? 1 : 0, two = q => cov[q] > 1 ? 1 : 0;
  for (let y = 0; y < RH; y++) {
    const fy = clamp((y + 0.5) / k - 0.5, 0, H - 1.001);
    for (let x = 0; x < RW; x++) {
      const fx = clamp((x + 0.5) / k - 0.5, 0, W - 1.001);
      const a1 = smooth(at(one, fx, fy)), a2 = smooth(at(two, fx, fy)), o = (y * RW + x) * 4;
      // mezcla entre "hueco" (10,4,12 α150) y "cubierto" (79,209,197 α62, o α105 con 2+ sensores)
      const aCov = 62 + 43 * a2;
      px[o] = 10 + 69 * a1; px[o + 1] = 4 + 205 * a1; px[o + 2] = 12 + 185 * a1; px[o + 3] = 150 + (aCov - 150) * a1;
    }
  }
  cx.putImageData(img, 0, 0);
}
