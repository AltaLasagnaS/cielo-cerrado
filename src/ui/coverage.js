'use strict';
// ---------------- COBERTURA ----------------
let covCanvas = document.createElement('canvas'), covTimer = null, covBusy = false;
function schedCov() { clearTimeout(covTimer); covTimer = setTimeout(computeCov, 120); }
function computeCov() {
  if (!MAP) return;
  const W = MAP.W, H = MAP.H, c = MAP.cellKm, data = MAP.data;
  const cov = new Uint8Array(W * H), stamp = new Int32Array(W * H).fill(-1);
  const ref = THREATS[S.covRef]; const agl = S.covAgl;
  const units = S.started ? S.units.filter(u => u.alive) : S.setup.defs;
  const jams = S.started ? S.jamsLive : S.setup.jams;
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
        const tS = (e + 4 - curv - hr) / dm, gS = (e + agl - curv - hr) / dm;
        if (k >= 0 && gS >= maxS && stamp[k] !== ri) { stamp[k] = ri; cov[k]++; }
        if (tS > maxS) maxS = tS;
      }
    }
  }
  covCanvas.width = W; covCanvas.height = H;
  const cx = covCanvas.getContext('2d'), img = cx.createImageData(W, H), px = img.data;
  for (let k = 0; k < W * H; k++) {
    const v = cov[k], o = k * 4;
    if (v === 0) { px[o] = 10; px[o + 1] = 4; px[o + 2] = 12; px[o + 3] = 150; }
    else { px[o] = 79; px[o + 1] = 209; px[o + 2] = 197; px[o + 3] = v === 1 ? 62 : 105; }
  }
  cx.putImageData(img, 0, 0);
  S._cov = cov; S.covStat = { pct: Math.round(100 * cov.reduce((a, v) => a + (v > 0), 0) / (W * H)) };
  draw(); renderCovInfo();
}
