// @ts-check
// ---------------- ARMADO DEL ESCENARIO ----------------
// Funciones para agregar defensas, salvas y jammers a S.setup (antes de iniciar la corrida).
import { DEFENSES, THREATS, JAMMERS, TARGET_TYPES, C2_LEVELS, c2FromNet, WEATHER, WEATHER_DEFAULT } from '../data/index.js';
import { azOf } from '../util/math.js';
import { nextId } from '../util/ids.js';
import { S } from './state.js';

/** Despliega una defensa del tipo dado en (x, y) km. o = { name?, az? }. */
export function addDef(type, x, y, o = {}) {
  const d = DEFENSES[type];
  const u = { id: nextId(), type, x, y, az: o.az ?? defaultAz(x, y), mast: d.radar ? (d.kind === 'aew' ? 0 : d.radar.mast) : 2, alt: d.alt, mag: d.sam ? d.sam.mag : 0, reserve: d.sam ? (o.reserve ?? d.sam.reserve ?? 0) : 0, salvo: d.sam ? d.sam.salvo : 0, noDrones: d.sam ? !!d.sam.noDrones : false, link: o.link ?? true, name: o.name || nextName(type) };
  S.setup.defs.push(u); return u;
}

/** Nombre automático: "Patriot-2", "Gepard-3"... */
export function nextName(type) { const n = S.setup.defs.filter(u => u.type === type).length + 1; return DEFENSES[type].short + '-' + n; }

/** Orientación por defecto de un radar sectorial: hacia el origen de la primera salva (o al oeste). */
export function defaultAz(x, y) {
  const sv = S.setup.salvos[0]; if (sv) { const p = sv.pts[0]; return Math.round(azOf(p[0] - x, p[1] - y)); }
  return Math.round(azOf(-1, 0));
}

/**
 * Programa una salva. Si o.targetUnit es el nombre de una defensa (o o.targetObj el de un objetivo),
 * la ruta termina sobre ella. También se aceptan ids numéricos (lo que usa la interfaz).
 */
export function addSalvo(o) {
  const T = THREATS[o.type];
  const sv = { id: nextId(), type: o.type, count: o.count || 1, interval: o.interval ?? 20, tStart: o.tStart || 0, sync: !!o.sync, tArrive: o.tArrive || 0, agl: o.agl ?? T.agl, launchDist: o.launchDist ?? T.launchDist, maneuver: o.maneuver ?? T.maneuver, decoys: !!o.decoys, link: !!o.link, crpa: o.crpa ?? 0, pts: o.pts, targetUnit: null, targetObj: null };
  const find = (list, ref) => list.find(v => v.name === ref || v.id === ref);
  if (o.targetUnit) { const u = find(S.setup.defs, o.targetUnit); if (u) { sv.targetUnit = u.id; sv.pts[sv.pts.length - 1] = [u.x, u.y]; } }
  else if (o.targetObj) { const g = find(S.setup.objs, o.targetObj); if (g) { sv.targetObj = g.id; sv.pts[sv.pts.length - 1] = [g.x, g.y]; } }
  S.setup.salvos.push(sv); return sv;
}

/** Ubica un objetivo. o = { name?, short?, hp?, desc? }. */
export function addObj(type, x, y, o = {}) {
  const tt = TARGET_TYPES[type];
  const n = S.setup.objs.filter(g => g.type === type).length + 1;
  const g = { id: nextId(), type, x, y, name: o.name || tt.name + ' ' + n, short: o.short || '', maxHp: o.hp || tt.hp, desc: o.desc || '' };
  S.setup.objs.push(g); return g;
}

/** Nombre de un objetivo o defensa por id (para listas y rutas). */
export const targetName = sv => sv.targetUnit ? S.setup.defs.find(u => u.id === sv.targetUnit)?.name : sv.targetObj ? S.setup.objs.find(g => g.id === sv.targetObj)?.name : null;

/**
 * Despliega un interferidor. o = { alt? (aéreos), mode? ('barrage' | 'spot', data/jammers.js#JAM_MODES),
 * target? (ruido puntual: nombre o id de la defensa cuyo radar interfiere) }.
 */
export function addJam(type, x, y, o = {}) {
  const J = JAMMERS[type], u = o.target != null ? S.setup.defs.find(v => v.name === o.target || v.id === o.target) : null;
  const j = { id: nextId(), type, x, y, alt: o.alt ?? J.alt, on: true };
  if (J.bands) { j.mode = o.mode === 'spot' ? 'spot' : 'barrage'; j.target = u ? u.id : null; }
  S.setup.jams.push(j); return j;
}

/**
 * Despliega un escenario declarativo (ver data/scenarios.js) sobre el setup actual y aplica sus
 * reglas. Se clona para que las ediciones del jugador no modifiquen los datos originales.
 */
export function applyScenario(sc) {
  const { objectives = [], defs = [], salvos = [], jams = [] } = structuredClone({ objectives: sc.objectives, defs: sc.defs, salvos: sc.salvos, jams: sc.jams });
  for (const g of objectives) addObj(g.type, g.x, g.y, g);
  for (const d of defs) addDef(d.type, d.x, d.y, d);
  for (const o of salvos) addSalvo(o);
  for (const j of jams) addJam(j.type, j.x, j.y, j);
  if (sc.rules) {
    if (sc.rules.c2 && C2_LEVELS[sc.rules.c2]) S.c2 = sc.rules.c2; else if (sc.rules.net !== undefined) S.c2 = c2FromNet(sc.rules.net);   // net: formato viejo
    if (sc.rules.doctrine) S.doctrine = sc.rules.doctrine;
  }
  S.weather = WEATHER[sc.rules?.weather] ? sc.rules.weather : WEATHER_DEFAULT;
  S.wind = { v: sc.rules?.wind?.v ?? 0, from: sc.rules?.wind?.from ?? 0 };   // viento del escenario: sin dato, calma
  S.ignoreDecoys = !!sc.rules?.ignoreDecoys;   // el clima es del escenario: sin dato, despejado
  S.fireRange = sc.rules?.fireRange ?? 1;   // doctrina de alcance del escenario: sin dato, todo el alcance
  S.scen = sc;
}
