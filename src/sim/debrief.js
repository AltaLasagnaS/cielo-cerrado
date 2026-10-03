// ---------------- DEBRIEF ----------------
// Análisis de una corrida terminada: qué pasó con cada objetivo, el ataque, el daño, la defensa,
// una línea de tiempo y, sobre todo, POR QUÉ pasó (detección tardía, saturación, señuelos, Pk...).
// Es puro: arma un objeto de datos a partir de S; la ventana está en ui/debrief.js.
import { THREATS, DEFENSES } from '../data/index.js';
import { evaluateGoals } from './goals.js';

const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);

/** Desvío a partir del cual un arma cuenta como "perdida localmente" (m). */
export const LOST_M = 2000;

export function buildDebrief(S) {
  const st = S.stats, real = S.threats.filter(t => !t.isDecoy), decoys = S.threats.filter(t => t.isDecoy);
  const arrivals = S.arrivals;
  const { goals, outcome } = evaluateGoals(S.scen, S);

  // por tipo de arma
  const byType = {};
  for (const t of S.threats) {
    const k = t.isDecoyChild ? t.T.short + ' (señuelo)' : t.T.short;
    const b = byType[k] ||= { launched: 0, killed: 0, arrived: 0, shotsAt: 0 };
    b.launched++; if (t.killed) b.killed++; else if (t.done) b.arrived++; b.shotsAt += (t.fly || []).length;
  }

  const objectives = S.objs.map(o => ({ name: o.name, type: o.type, status: o.status, dmg: o.maxHp - o.hp, maxHp: o.maxHp, hits: o.hits, dmgBy: o.dmgBy }));
  const dmgSorted = Object.entries(st.dmgByWeapon).sort((a, b) => b[1] - a[1]);
  const magTotal = sum(S.units, u => u.mag || 0), magLeft = sum(S.units, u => DEFENSES[u.type].sam ? u.magLeft : 0);
  const lost = S.units.filter(u => !u.alive).map(u => u.name);
  const detected = real.filter(t => t.firstDet !== null && t.detKm != null);

  const attack = {
    launched: st.launched, real: real.length, decoys: st.decoys,
    intercepted: st.killed - st.decoysKilled, decoysKilled: st.decoysKilled,
    impacts: st.hits, misses: st.misses, lostLocally: arrivals.filter(a => a.nav > LOST_M).length, byType
  };
  const damage = {
    total: st.damage, byWeapon: dmgSorted, top: dmgSorted[0] || null,
    avgMiss: st.missN ? st.missSum / st.missN : null, objsDestroyed: st.objsDestroyed,
    objsSurviving: S.objs.filter(o => o.status !== 'destroyed').length
  };
  const defense = {
    shots: st.shots, magLeft, magTotal, defCost: st.defCost, atkCost: st.atkCost, lost, byUnit: st.byUnit,
    perKill: st.killed ? st.shots / st.killed : null,
    avgDetKm: detected.length ? sum(detected, t => t.detKm) / detected.length : null
  };
  const timeline = [...S.events].sort((a, b) => a.t - b.t);
  return { scen: S.scen, t: S.t, goals, outcome, objectives, attack, damage, defense, timeline, why: explain(S, arrivals, decoys) };
}

/** Explicaciones en lenguaje llano, derivadas de lo que registró el motor. */
function explain(S, arrivals, decoys) {
  const out = [], st = S.stats, list = a => [...new Set(a.map(x => THREATS[x.type].short))].join(', ');
  const real = arrivals;
  if (!S.threats.length) return ['No hubo ataques: agregá salvas en la pestaña Ataque.'];
  if (!real.length) out.push('Ninguna arma real llegó a su blanco: todas fueron derribadas o eran señuelos. La defensa por capas cubrió las rutas de ataque.');
  const never = real.filter(a => a.det === null);
  if (never.length) out.push(`${never.length} arma(s) llegaron sin haber sido detectadas nunca (${list(never)}). Típico de blancos rasantes: el horizonte de radar y el relieve los ocultan. Probá subir mástiles, sumar un AEW o ubicar sensores sobre cotas altas (capa "Puntos altos").`);
  const unengaged = real.filter(a => a.det !== null && a.shots === 0);
  if (unengaged.length) {
    const lead = unengaged.reduce((s, a) => s + (a.t - a.det), 0) / unengaged.length;
    out.push(`${unengaged.length} arma(s) fueron detectadas pero nadie les disparó (${list(unengaged)}), en promedio ${Math.round(lead)} s antes de llegar. Causas posibles: fuera del alcance o de la envolvente de altura, tiempo de reacción mayor que la ventana, clase no enfrentable (p. ej. IRIS-T o NASAMS contra balísticos), canales ocupados o sin munición.`);
  }
  const survived = real.filter(a => a.shots > 0);
  if (survived.length) out.push(`${survived.length} arma(s) sobrevivieron a ${survived.reduce((s, a) => s + a.shots, 0)} interceptor(es) disparados contra ellas (${list(survived)}): la Pk por disparo nunca es 100% y baja con maniobra terminal, baja firma, bengalas o interferencia.`);
  const decoyShots = decoys.reduce((s, t) => s + (t.fly || []).length, 0);
  const clsDecoys = decoys.filter(t => t.clsAs === 'señuelo').length, wrong = S.threats.filter(t => !t.isDecoy && t.clsAs === 'señuelo');
  if (clsDecoys) out.push(`Los radares de tiro reconocieron ${clsDecoys} de ${decoys.length} señuelo(s)${S.ignoreDecoys ? ' y dejaron de tirarles' : '; con la doctrina "no tirarle a pistas clasificadas como señuelo" se habrían ahorrado interceptores'}.`);
  if (wrong.length) out.push(`${wrong.length} arma(s) real(es) se clasificaron por error como señuelo (${wrong.map(t => t.T.short).join(', ')})${S.ignoreDecoys ? ' y no se les tiró' : ''}.`);
  if (decoyShots) out.push(`Los señuelos consumieron ${decoyShots} interceptor(es) que no se usaron contra armas reales. La "vista del defensor" muestra cómo los ve el operador: iguales a las armas.`);
  const empty = S.events.filter(e => e.key && e.key.startsWith('empty:'));
  if (empty.length) out.push(`Se quedaron sin munición: ${empty.map(e => e.text.replace(' se queda sin munición', '')).join(', ')}. Sin recarga, la saturación agota los cargadores antes de que llegue lo más peligroso.`);
  const sat = Object.entries(st.satChannels).sort((a, b) => b[1] - a[1]);
  if (sat.length) out.push(`Saturación de canales de tiro: ${sat.slice(0, 3).map(([k, v]) => `${k} (${v} s)`).join(', ')} tuvo más blancos que canales simultáneos.`);
  const gnss = real.filter(a => a.nav > 150 && a.nav <= LOST_M), lostL = real.filter(a => a.nav > LOST_M);
  if (gnss.length) out.push(`${gnss.length} arma(s) fueron desviadas por interferencia GNSS (${list(gnss)}).`);
  if (lostL.length) out.push(`${lostL.length} arma(s) quedaron "perdidas localmente": el engaño GNSS las desvió más de ${LOST_M / 1000} km (${list(lostL)}). Ojo al comparar con las cifras oficiales ucranianas: esa categoría real también incluye señuelos y fallas.`);
  if (S.units.some(u => !u.alive)) out.push(`Unidades perdidas: ${S.units.filter(u => !u.alive).map(u => u.name).join(', ')}. Una batería destruida deja un hueco de cobertura para lo que viene después.`);
  if (st.killed) out.push(`Economía: la defensa gastó US$${st.defCost.toFixed(1)} M y el ataque US$${st.atkCost.toFixed(1)} M. ${st.defCost > st.atkCost ? 'Defender costó más que atacar: es la lógica de los drones baratos y los señuelos.' : 'Defender costó menos que atacar.'}`);
  return out;
}
