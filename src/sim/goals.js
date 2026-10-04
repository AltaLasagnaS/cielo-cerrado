// @ts-check
// Evaluación de las metas de un escenario (data/scenarios.js → goals) al terminar una corrida.
import { DAMAGED_AT } from '../data/index.js';

/** ¿Se cumplió la meta g con el estado final S? */
export function goalMet(g, S) {
  const obj = S.objs.find(o => o.name === g.target), unit = S.units.find(u => u.name === g.target);
  const frac = obj ? (obj.maxHp - obj.hp) / obj.maxHp : 0;
  switch (g.kind) {
    case 'destroy': return !!obj && obj.status === 'destroyed';
    case 'damage': return !!obj && frac >= (g.min ?? DAMAGED_AT);
    case 'protect': return !!obj && obj.status === 'operational';
    case 'survive': return !!obj && obj.status !== 'destroyed';
    case 'killUnit': return !!unit && !unit.alive;
    case 'keepUnit': return !!unit && unit.alive;
    default: return false;
  }
}

/**
 * Evalúa todas las metas y el resultado para el bando del jugador.
 * → { goals: [{ ...g, met }], outcome: { side, result: 'exito'|'parcial'|'fracaso'|null, text } }
 */
export function evaluateGoals(sc, S) {
  const goals = (sc?.goals || []).map(g => ({ ...g, met: goalMet(g, S) }));
  const side = sc?.player || null, mine = goals.filter(g => g.side === side), prim = mine.filter(g => g.primary);
  let result = null;
  if (prim.length) { const n = prim.filter(g => g.met).length; result = n === prim.length ? 'exito' : n ? 'parcial' : 'fracaso'; }
  const sec = mine.filter(g => !g.primary);
  const text = result ? { exito: 'Éxito', parcial: 'Éxito parcial', fracaso: 'Fracaso' }[result] + (sec.length ? ` · secundarias ${sec.filter(g => g.met).length}/${sec.length}` : '') : 'Sin metas definidas';
  return { goals, outcome: { side, result, text } };
}
