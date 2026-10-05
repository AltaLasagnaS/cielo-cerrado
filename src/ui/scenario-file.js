// @ts-check
// ---------------- GUARDAR / CARGAR ESCENARIO (archivo JSON) ----------------
// Botones "Guardar" y "Cargar" de la barra superior. El formato y la validación están en
// sim/scenario-io.js; acá solo se descarga y se lee el archivo y se cambia de mapa si hace falta.
import { esc } from '../util/format.js';
import { builtinMap, MAP } from '../physics/terrain.js';
import { S } from '../sim/state.js';
import { log } from '../sim/log.js';
import { exportScenario, exportFileName, validateScenario, loadScenarioData } from '../sim/scenario-io.js';
import { $ } from './dom.js';
import { applyMap, resetSim } from './app.js';
import { schedCov } from './coverage.js';
import { openModal } from './fichas.js';
import { toast } from './modes.js';
import { renderAll } from './panels/index.js';
import { renderLog } from './panels/results.js';

/** Tamaño máximo del archivo (los escenarios ocupan unos pocos KB). */
const MAX_BYTES = 2 * 1024 * 1024;

export function initScenarioFile() {
  $('#saveScen').onclick = saveScenario;
  $('#loadScen').onchange = async e => {
    const f = e.target.files[0]; if (!f) return; e.target.value = '';
    if (f.size > MAX_BYTES) { showErrors(f.name, ['El archivo pesa más de 2 MB: no parece un escenario.']); return; }
    let raw;
    try { raw = JSON.parse(await f.text()); } catch (x) { showErrors(f.name, ['No es un JSON válido: ' + x.message]); return; }
    loadFromObject(raw, f.name);
  };
}

/** Descarga el escenario actual como .json. */
export function saveScenario() {
  const json = JSON.stringify(exportScenario(), null, 1);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  a.download = exportFileName();
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Escenario guardado: ' + a.download);
}

/** Valida y despliega un escenario leído de un archivo. Devuelve el resultado de la validación. */
export function loadFromObject(raw, fileName = 'archivo') {
  const res = validateScenario(raw);
  if (!res.ok) { showErrors(fileName, res.errors); return res; }
  const { data } = res;
  resetSim();
  if (data.map.builtin && MAP?.key !== data.map.key) applyMap(builtinMap(data.map.key));
  loadScenarioData(data);
  const sc = $('#scenario');
  sc.querySelector('option[value="file"]')?.remove();
  const short = fileName.length > 40 ? fileName.slice(0, 37) + '…' : fileName;
  sc.insertAdjacentHTML('beforeend', `<option value="file" title="${esc(fileName)}">Archivo: ${esc(short)}</option>`); sc.value = 'file';
  renderAll(); schedCov();
  const s = S.setup;
  log('d', `Escenario cargado desde ${fileName}: ${s.objs.length} objetivos, ${s.defs.length} defensas, ${s.salvos.length} salvas, ${s.jams.length} interferidores.`);
  for (const w of res.warnings) log('w', w);
  renderLog();
  if (res.warnings.length) openModal(`<header><h2>Escenario cargado con avisos</h2><button class="btn x">Cerrar</button></header><div class="bd"><p>Se cargó <b>${esc(fileName)}</b>, pero conviene revisar:</p><ul>${res.warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul></div>`);
  else toast('Escenario cargado: ' + fileName);
  return res;
}

function showErrors(fileName, errors) {
  openModal(`<header><h2>No se pudo cargar el escenario</h2><button class="btn x">Cerrar</button></header><div class="bd">
    <p>El archivo <b>${esc(fileName)}</b> tiene problemas. No se cambió nada de lo que tenías armado.</p>
    <ul>${errors.map(e => `<li>${esc(e)}</li>`).join('')}</ul>
    <p class="hint">Los archivos válidos se generan con el botón "Guardar". Si lo editaste a mano, revisá los tipos con la pestaña Catálogo.</p></div>`);
}
