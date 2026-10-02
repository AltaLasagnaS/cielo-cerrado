// ---------------- IMPORTAR RELIEVE .HGT ----------------
// Carga un tile SRTM descomprimido elegido por el jugador y arranca un escenario vacío sobre él.
import { esc } from '../util/format.js';
import { parseHgtName, hgtToMap } from '../physics/terrain.js';
import { S } from '../sim/state.js';
import { log } from '../sim/log.js';
import { $ } from './dom.js';
import { applyMap, resetSim } from './app.js';
import { schedCov } from './coverage.js';
import { toast } from './modes.js';
import { renderAll } from './panels/index.js';
import { renderLog } from './panels/results.js';

export function initHgtImport() {
  $('#hgt').onchange = async e => {
    const f = e.target.files[0]; if (!f) return; e.target.value = '';
    const tile = parseHgtName(f.name);
    if (!tile) { toast('El nombre del archivo tiene que ser tipo N50E030.hgt'); return; }
    const res = hgtToMap(await f.arrayBuffer(), tile, f.name);
    if (!res) { toast('Formato no reconocido: se esperan 1201² o 3601² muestras.'); return; }
    const { map, kmx, kmy } = res;
    resetSim(); S.setup = { defs: [], salvos: [], jams: [] }; S.sel = null;
    applyMap(map);
    const sc = $('#scenario'); if (![...sc.options].some(o => o.value === 'hgt')) sc.insertAdjacentHTML('beforeend', '<option value="hgt">Relieve cargado: ' + esc(f.name) + '</option>'); sc.value = 'hgt';
    renderAll(); schedCov(); log('d', 'Relieve cargado: ' + f.name + ' (' + (kmx).toFixed(0) + ' × ' + kmy + ' km). Escenario vacío.');
    renderLog();
  };
}
