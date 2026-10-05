// @ts-check
// Informe de fin de misión para la campaña (experimentos/catalogo-presupuesto, contrato en #62): lo que
// el comandante de un bando sabe al terminar la noche y el estado de sus propios medios, para continuar
// en la misión siguiente. No incluye planes ni medios enemigos que el bando no conoce: los reportes
// salen del registro filtrado por bando (log.js#logFor) y los activos son solo los propios.
// La continuidad entra por el armado: defs[].hp, dmgRadar, dmgLauncher, mag, reserve y objectives
// hpNow (sim/setup.js, sim/scenario-io.js).
import { D, JAMMERS, sideOf } from '../data/index.js';
import { S } from './state.js';
import { evaluateGoals } from './goals.js';
import { logFor } from './log.js';

/** Versión del contrato: subirla si cambian los campos. */
export const MISSION_REPORT_VERSION = 1;

/**
 * Informe del bando side ('defensa' | 'ataque'; sin dato, el del jugador) al terminar la corrida actual.
 *   { version, scenario, t, side, outcome, goals, assets, reports, spent }
 * outcome/goals: evaluación de las metas de ese bando (el debrief, autorizado al terminar).
 * assets: los medios propios. Defensa: unidades (posición, vida, componentes, munición, si el enemigo
 *   la ubicó), objetivos que defiende (vida y estado) y jammers. Ataque: jammers propios.
 * reports: el registro de la noche como lo conoce ese bando (con hora).
 * spent: lo gastado (defensa: interceptores y costo; ataque: armas lanzadas y costo).
 * @param {'defensa' | 'ataque' | null} [side]
 */
export function missionReport(side = null) {
  const sc = S.scen, me = side || sc?.player || 'defensa', view = me === 'defensa' ? 'def' : 'atk';
  const { goals, outcome } = evaluateGoals(sc ? { ...sc, player: me } : null, S);
  const st = S.stats;
  // jammers propios: la defensa opera los terrestres de su bando; el atacante, los del otro (aéreos o no)
  const defSide = S.units[0] ? sideOf(S.units[0]) : 'UA';
  const jamSide = j => j.owner || JAMMERS[j.type].side;   // 'both': lo opera quien lo puso, se toma como del bando defensor
  const ownJam = j => (jamSide(j) === defSide || jamSide(j) === 'both') === (me === 'defensa');
  const jams = S.jamsLive.filter(ownJam).map(j => ({ id: j.id, type: j.type, name: JAMMERS[j.type].short, x: j.x, y: j.y, alive: !j.dead, hp: j.hp ?? null }));
  const assets = me === 'defensa'
    ? {
      units: S.units.map(u => ({
        id: u.id, name: u.name, type: u.type, x: u.x, y: u.y, alive: u.alive, hp: Math.max(0, u.hp),
        dmgRadar: !!u.dmgRadar, dmgLauncher: !!u.dmgLauncher,
        magLeft: D(u).sam ? u.magLeft : null, reserveLeft: D(u).sam ? u.reserveLeft : null,
        located: u.emitFrom != null || u.revealed != null   // el enemigo pudo ubicarla (emitió o disparó)
      })),
      objectives: S.objs.map(g => ({ id: g.id, name: g.name, type: g.type, hp: Math.max(0, g.hp), maxHp: g.maxHp, status: g.status })),
      jammers: jams
    }
    : { jammers: jams };
  const spent = me === 'defensa'
    ? { interceptors: st.shots, cost: st.defCost, reloads: st.reloads ?? 0 }
    : { weapons: st.launched, decoys: st.decoys, cost: st.atkCost };
  const reports = logFor([...(S.rec?.log ?? [...S.log].reverse())], view).map(e => ({ t: e.t, cls: e.cls, text: e.text }));
  return {
    version: MISSION_REPORT_VERSION, scenario: sc?.name ?? null, t: S.t, side: me,
    outcome: outcome.result, goals: goals.filter(g => g.side === me).map(g => ({ text: g.text, kind: g.kind, target: g.target, primary: !!g.primary, met: g.met })),
    assets, reports, spent
  };
}
