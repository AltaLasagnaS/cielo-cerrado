'use strict';
// ---------------- RADAR / DETECCIÓN ----------------
// RCS por banda. th.rcs = frontal en X/S. En VHF se usa th.rcsVHF (estimación por resonancia);
// si falta, se aplica el multiplicador genérico. El aspecto (frente/costado) está en UNC (rcsSide) pero el motor usa el frontal.
function rcsAt(th, band) {
  const b = th.rcs;
  if (band === 'VHF') return th.rcsVHF ?? b * (th.lo ? 12 : (b < 0.05 ? 4 : 2));
  if (band === 'L') return b * (th.lo ? 3 : 1.4);
  if (band === 'Ku') return b * (th.cls === 'dron' ? 1.6 : 1);
  return b;
}
const D = u => DEFENSES[u.type];
function antZ(u) { const d = D(u); if (d.kind === 'aew') return u.alt; return surf(u.x, u.y) + (u.mast ?? (d.radar ? d.radar.mast : 2)); }
function inSector(u, az) {
  const r = D(u).radar; if (!r || r.sector >= 360) return true;
  if (r.side) { return angDiff(az, (u.az + 90) % 360) <= r.sector / 2 || angDiff(az, (u.az + 270) % 360) <= r.sector / 2; }
  return angDiff(az, u.az) <= r.sector / 2;
}
function jamPos(j) { const J = JAMMERS[j.type]; return [j.x, j.y, J.air ? j.alt : surf(j.x, j.y) + J.mast]; }
function jamJ(u, az, list) {
  const r = D(u).radar; if (!r || r.band === 'ACU' || r.band === 'OPT') return 0;
  let J = 0; const bw = BANDS[r.band].bw, uz = antZ(u);
  for (const j of list) {
    const JJ = JAMMERS[j.type]; if (!j.on || j.dead || JJ.gnssJam || !JJ.bands.includes(r.band)) continue;
    const key = u.id + '|' + u.x.toFixed(2) + '|' + u.y.toFixed(2) + '|' + j.x.toFixed(2) + '|' + j.y.toFixed(2) + '|' + (u.mast || 0) + '|' + (u.alt || 0) + '|' + (j.alt || 0);
    j._losMap = j._losMap || {};
    if (j._losMap[key] === undefined) { const p = jamPos(j); j._losMap[key] = los(p[0], p[1], p[2], u.x, u.y, uz); }
    if (!j._losMap[key]) continue;
    const p = jamPos(j); const dkm = Math.hypot(p[0] - u.x, p[1] - u.y, (p[2] - uz) / 1000) + 1;
    const jaz = azOf(p[0] - u.x, p[1] - u.y), dd = angDiff(jaz, az);
    let G = dd <= bw ? 1 : dd <= 3 * bw ? 0.05 : 0.003;
    if (!inSector(u, jaz)) G *= 0.1;
    J += JJ.P * G / (dkm * dkm);
  }
  return J * Math.pow(10, -(r.eccm || 0) / 10);
}
function detR(u, th, J) {
  const r = D(u).radar; if (r.band === 'ACU' || r.band === 'OPT') return r.R1;
  return r.R1 * Math.pow(rcsAt(th.T || th, r.band), 0.25) * Math.pow(1 / (1 + J), 0.25);
}
