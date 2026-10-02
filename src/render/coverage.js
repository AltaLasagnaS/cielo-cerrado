// Capa de cobertura: turquesa donde algún sensor ve el blanco de referencia (más intenso con 2+),
// oscuro en los huecos. 1 píxel por celda; draw() la escala sobre el mapa.
export const covCanvas = document.createElement('canvas');

export function paintCoverage(cov, W, H) {
  covCanvas.width = W; covCanvas.height = H;
  const cx = covCanvas.getContext('2d'), img = cx.createImageData(W, H), px = img.data;
  for (let k = 0; k < W * H; k++) {
    const v = cov[k], o = k * 4;
    if (v === 0) { px[o] = 10; px[o + 1] = 4; px[o + 2] = 12; px[o + 3] = 150; }
    else { px[o] = 79; px[o + 1] = 209; px[o + 2] = 197; px[o + 3] = v === 1 ? 62 : 105; }
  }
  cx.putImageData(img, 0, 0);
}
