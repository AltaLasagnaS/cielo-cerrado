// Acciones de alto nivel que combinan simulación, dibujo e interfaz.
import { SCENARIOS } from '../data/index.js';
import { setMap, builtinMap, MAP } from '../physics/terrain.js';
import { S } from '../sim/state.js';
import { resetState } from '../sim/engine.js';
import { applyScenario } from '../sim/setup.js';
import { buildBase } from '../render/terrain.js';
import { fitView } from '../render/view.js';
import { schedCov } from './coverage.js';
import { updatePlay } from './controls.js';
import { renderAll } from './panels/index.js';
import { renderSel } from './panels/selection.js';
import { markLogDirty } from './panels/results.js';
import { renderReplayBar } from './replay.js';

/** Activa un mapa: lo carga en la física, pinta el relieve y lo encuadra. */
export function applyMap(m) { setMap(m); buildBase(); fitView(); }

/** Descarta la corrida y vuelve al modo edición. */
export function resetSim() { resetState(); renderReplayBar(); markLogDirty(); updatePlay(); schedCov(); renderSel(); }

/** Carga uno de los escenarios incluidos (data/scenarios.js). */
export function loadScenario(key) {
  resetSim();
  const sc = SCENARIOS[key]; if (MAP?.key !== sc.map) applyMap(builtinMap(sc.map));
  S.setup = { objs: [], defs: [], salvos: [], jams: [] }; S.sel = null; S.mode = 'select';
  applyScenario(sc); renderAll(); schedCov();
}
