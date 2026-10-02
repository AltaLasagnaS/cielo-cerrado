// Orquesta el cálculo de cobertura: se programa con un pequeño retardo (120 ms) para no recalcular
// en cada movimiento de un control, calcula la grilla, la pinta y actualiza el panel.
import { THREATS } from '../data/index.js';
import { MAP } from '../physics/terrain.js';
import { coverageGrid } from '../physics/coverage.js';
import { S } from '../sim/state.js';
import { paintCoverage } from '../render/coverage.js';
import { draw } from '../render/draw.js';
import { renderCovInfo } from './panels/defense.js';

let covTimer = null;

/** Pide recalcular la cobertura (se agrupan los pedidos seguidos). */
export function schedCov() { clearTimeout(covTimer); covTimer = setTimeout(computeCov, 120); }

/** Recalcula la cobertura ya mismo. */
export function computeCov() {
  if (!MAP) return;
  const units = S.started ? S.units.filter(u => u.alive) : S.setup.defs;
  const jams = S.started ? S.jamsLive : S.setup.jams;
  const cov = coverageGrid(units, jams, THREATS[S.covRef], S.covAgl);
  paintCoverage(cov, MAP.W, MAP.H);
  S._cov = cov; S.covStat = { pct: Math.round(100 * cov.reduce((a, v) => a + (v > 0), 0) / (MAP.W * MAP.H)) };
  draw(); renderCovInfo();
}
