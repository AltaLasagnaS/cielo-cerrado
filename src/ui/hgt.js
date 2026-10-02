'use strict';
// ---------------- IMPORT .HGT ----------------
$('#hgt').onchange = async e => {
  const f = e.target.files[0]; if (!f) return; e.target.value = '';
  const m = /([NS])(\d{1,2})([EW])(\d{1,3})/i.exec(f.name);
  if (!m) { toast('El nombre del archivo tiene que ser tipo N50E030.hgt'); return; }
  const buf = await f.arrayBuffer(); const n = Math.round(Math.sqrt(buf.byteLength / 2));
  if (n * n * 2 !== buf.byteLength || (n !== 1201 && n !== 3601)) { toast('Formato no reconocido: se esperan 1201² o 3601² muestras.'); return; }
  const dv = new DataView(buf);
  const lat0 = (m[1].toUpperCase() === 'N' ? 1 : -1) * +m[2], lon0 = (m[3].toUpperCase() === 'E' ? 1 : -1) * +m[4];
  const latc = lat0 + 0.5, kmx = 111.32 * Math.cos(latc * Math.PI / 180), kmy = 111;
  const cell = 200, W = Math.round(kmx * 1000 / cell), H = Math.round(kmy * 1000 / cell);
  const data = new Int16Array(W * H);
  for (let i = 0; i < H; i++) for (let j = 0; j < W; j++) {
    const sy = (i + 0.5) / H * (n - 1), sx = (j + 0.5) / W * (n - 1); const a = Math.floor(sy), b = Math.floor(sx);
    let v = dv.getInt16((a * n + b) * 2, false); if (v < -1000) v = 0; data[i * W + j] = v <= 0 ? -5 : v;
  }
  resetSim(); S.setup = { defs: [], salvos: [], jams: [] }; S.sel = null;
  setMap({ key: 'hgt', name: f.name, W, H, cell, latN: lat0 + 1, lonW: lon0, dlat: 1 / H, dlon: 1 / W, places: [], data });
  const sc = $('#scenario'); if (![...sc.options].some(o => o.value === 'hgt')) sc.insertAdjacentHTML('beforeend', '<option value="hgt">Relieve cargado: ' + esc(f.name) + '</option>'); sc.value = 'hgt';
  renderAll(); schedCov(); log('d', 'Relieve cargado: ' + f.name + ' (' + (kmx).toFixed(0) + ' × ' + kmy + ' km). Escenario vacío.');
  renderLog();
};
