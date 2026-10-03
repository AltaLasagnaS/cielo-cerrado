// ---------------- GUARDAR Y CARGAR ESCENARIOS ----------------
// Convierte el escenario armado por el jugador (S.setup + reglas + metas) en un objeto JSON y lo
// vuelve a desplegar. Es puro (no toca el DOM): la interfaz (ui/scenario-file.js) se ocupa de
// descargar y leer el archivo y de cambiar de mapa.
//
// Al cargar, todo se valida antes de tocar el estado: tipos de armas, defensas, jammers y
// objetivos que existan en el catálogo, mapa conocido, posiciones dentro del mapa, números
// finitos y en rango, y blancos de las salvas que existan. Solo se copian los campos conocidos.
// Formato: ver docs/ARQUITECTURA.md § "Archivo de escenario".
import { DEFENSES, THREATS, JAMMERS, TARGET_TYPES, TERRAIN, SCENARIOS, C2_LEVELS, c2FromNet } from '../data/index.js';
import { MAP } from '../physics/terrain.js';
import { S } from './state.js';
import { addObj, addDef, addSalvo, addJam } from './setup.js';

export const FORMAT = 'cielo-cerrado/escenario';
export const VERSION = 1;
/** Tolerancia para posiciones apenas fuera del borde del mapa (km). */
const EDGE_KM = 1;
/** Tope de elementos por lista, para no colgar el navegador con un archivo absurdo. */
const MAX_ITEMS = 500;
const SIDES = ['ataque', 'defensa'];
const GOAL_KINDS = ['destroy', 'damage', 'protect', 'survive', 'killUnit', 'keepUnit'];
const DOCTRINES = ['salva', 'sls'];

const pick = (o, keys) => { const r = {}; for (const k of keys) if (o[k] !== undefined) r[k] = structuredClone(o[k]); return r; };
const OBJ_KEYS = ['id', 'type', 'x', 'y', 'name', 'short', 'maxHp', 'desc'];
const DEF_KEYS = ['id', 'type', 'x', 'y', 'name', 'az', 'mast', 'alt', 'mag', 'salvo', 'noDrones'];
const SALVO_KEYS = ['id', 'type', 'count', 'interval', 'tStart', 'sync', 'tArrive', 'agl', 'launchDist', 'maneuver', 'decoys', 'pts', 'targetUnit', 'targetObj'];
const JAM_KEYS = ['id', 'type', 'x', 'y', 'alt', 'on'];
const META_KEYS = ['name', 'player', 'time', 'description', 'forces', 'conditions', 'rulesText', 'goals', 'success', 'failure'];

/** Clave del escenario incluido del que salió sc (o null si no es uno de ellos). */
const baseKey = sc => sc ? (sc.base ?? Object.keys(SCENARIOS).find(k => SCENARIOS[k] === sc) ?? null) : null;

/** Referencia al mapa activo: los incluidos por clave; un relieve importado, por nombre y esquina. */
function mapRef() {
  if (TERRAIN[MAP.key]) return { key: MAP.key, name: MAP.name };
  return { key: MAP.key, name: MAP.name, latN: MAP.latN, lonW: MAP.lonW, wKm: +MAP.wKm.toFixed(3), hKm: +MAP.hKm.toFixed(3) };
}

/** Escenario actual (lo que armó el jugador, no la corrida) como objeto listo para JSON.stringify. */
export function exportScenario(now = new Date()) {
  const s = S.setup;
  return {
    format: FORMAT, version: VERSION, saved: now.toISOString(),
    map: mapRef(),
    rules: { c2: S.c2, doctrine: S.doctrine },
    scenario: S.scen ? { base: baseKey(S.scen), ...pick(S.scen, META_KEYS) } : null,
    setup: {
      objs: s.objs.map(g => pick(g, OBJ_KEYS)),
      defs: s.defs.map(u => pick(u, DEF_KEYS)),
      salvos: s.salvos.map(sv => pick(sv, SALVO_KEYS)),
      jams: s.jams.map(j => pick(j, JAM_KEYS))
    }
  };
}

/** Nombre de archivo sugerido: "cielo-cerrado-monterey-noche-de-ataque.json". */
export function exportFileName() {
  const base = (S.scen?.name || MAP.name || 'escenario').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return 'cielo-cerrado-' + (base || 'escenario') + '.json';
}

/**
 * Valida un objeto leído de un archivo de escenario. No modifica nada.
 * → { ok, errors: [texto], warnings: [texto], data } (data = versión normalizada, solo si ok)
 */
export function validateScenario(raw) {
  const errors = [], warnings = [];
  // un valor fuera de los límites reales (p. ej. de una versión vieja) se acomoda al borde, con aviso
  const inLimits = (w, v, lim, what) => {
    if (typeof v !== 'number' || !lim) return v;
    const c = Math.min(lim[1], Math.max(lim[0], v));
    if (c !== v) warnings.push(`${w}: ${v} m está fuera de ${what} (${lim[0]}–${lim[1]} m); se usa ${c} m.`);
    return c;
  };
  const err = m => { if (errors.length < 30) errors.push(m); };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, errors: ['El archivo no contiene un objeto JSON.'], warnings };
  if (raw.format !== FORMAT) return { ok: false, errors: [`No es un archivo de escenario de Cielo Cerrado (falta "format": "${FORMAT}").`], warnings };
  if (raw.version !== VERSION) return { ok: false, errors: [`Versión de archivo ${raw.version} no soportada (esta versión del juego lee la ${VERSION}).`], warnings };

  // mapa
  const m = raw.map;
  let wKm, hKm, map = null;
  if (!m || typeof m.key !== 'string') err('Falta el mapa ("map.key").');
  else if (TERRAIN[m.key]) { const t = TERRAIN[m.key]; map = { key: m.key, builtin: true }; wKm = t.W * t.cell / 1000; hKm = t.H * t.cell / 1000; }
  else if (m.key === 'hgt') {
    // relieve importado: no viaja en el archivo, tiene que estar cargado y ser el mismo
    if (MAP?.key !== 'hgt' || MAP.name !== m.name || Math.abs(MAP.latN - m.latN) > 1e-6 || Math.abs(MAP.lonW - m.lonW) > 1e-6) err(`El escenario usa el relieve importado "${String(m.name)}". Cargalo primero con "Cargar relieve .hgt" y después el escenario.`);
    else { map = { key: 'hgt', builtin: false }; wKm = MAP.wKm; hKm = MAP.hKm; }
  } else err(`Mapa desconocido: "${String(m.key)}". Los incluidos son: ${Object.keys(TERRAIN).join(', ')}.`);
  if (errors.length) return { ok: false, errors, warnings };

  // ayudantes de validación
  const isNum = v => typeof v === 'number' && Number.isFinite(v);
  const num = (where, v, lo, hi, { int = false, opt = false } = {}) => {
    if (v === undefined || v === null) { if (!opt) err(`${where}: falta el valor.`); return undefined; }
    if (!isNum(v) || v < lo || v > hi || (int && !Number.isInteger(v))) { err(`${where}: ${JSON.stringify(v)} no es ${int ? 'un entero' : 'un número'} entre ${lo} y ${hi}.`); return undefined; }
    return v;
  };
  const bool = (where, v) => { if (v === undefined) return undefined; if (typeof v !== 'boolean') { err(`${where}: tiene que ser true o false.`); return undefined; } return v; };
  const str = (where, v, max, opt = true) => {
    if (v === undefined || v === null) { if (!opt) err(`${where}: falta el texto.`); return undefined; }
    if (typeof v !== 'string' || v.length > max) { err(`${where}: tiene que ser un texto de hasta ${max} caracteres.`); return undefined; }
    return v;
  };
  const pos = (where, x, y) => {
    const ok = isNum(x) && isNum(y) && x >= -EDGE_KM && y >= -EDGE_KM && x <= wKm + EDGE_KM && y <= hKm + EDGE_KM;
    if (!ok) err(`${where}: la posición (${JSON.stringify(x)}, ${JSON.stringify(y)}) está fuera del mapa (${wKm.toFixed(0)} × ${hKm.toFixed(0)} km).`);
    return ok;
  };
  const list = (name, v) => {
    if (v === undefined) return [];
    if (!Array.isArray(v)) { err(`setup.${name} tiene que ser una lista.`); return []; }
    if (v.length > MAX_ITEMS) { err(`setup.${name}: más de ${MAX_ITEMS} elementos.`); return []; }
    return v.filter((x, i) => { if (!x || typeof x !== 'object') { err(`setup.${name}[${i}] no es un objeto.`); return false; } return true; });
  };
  const ids = new Set();
  const id = (where, v) => { if (!Number.isInteger(v) || ids.has(v)) { err(`${where}: "id" ausente o repetido.`); return null; } ids.add(v); return v; };

  const setup = raw.setup;
  if (!setup || typeof setup !== 'object') return { ok: false, errors: ['Falta la sección "setup" con objetivos, defensas, salvas y jammers.'], warnings };

  // objetivos
  const objs = list('objs', setup.objs).map((g, i) => {
    const w = `Objetivo ${i + 1}${typeof g.name === 'string' ? ' (' + g.name + ')' : ''}`;
    if (!TARGET_TYPES[g.type]) { err(`${w}: tipo de objetivo desconocido "${String(g.type)}". Válidos: ${Object.keys(TARGET_TYPES).join(', ')}.`); return { id: id(w, g.id) }; }   // el id sigue contando para no sumar errores en cascada
    pos(w, g.x, g.y);
    return { id: id(w, g.id), type: g.type, x: g.x, y: g.y, name: str(w + ' · name', g.name, 120, false), short: str(w + ' · short', g.short, 60), maxHp: num(w + ' · maxHp', g.maxHp, 1, 100000, { opt: true }), desc: str(w + ' · desc', g.desc, 1000) };
  });
  // defensas
  const defs = list('defs', setup.defs).map((u, i) => {
    const w = `Defensa ${i + 1}${typeof u.name === 'string' ? ' (' + u.name + ')' : ''}`;
    if (!DEFENSES[u.type]) { err(`${w}: tipo de defensa desconocido "${String(u.type)}". Mirá la pestaña Catálogo para ver los disponibles.`); return { id: id(w, u.id) }; }
    pos(w, u.x, u.y);
    return {
      id: id(w, u.id), type: u.type, x: u.x, y: u.y, name: str(w + ' · name', u.name, 120),
      az: num(w + ' · az', u.az, 0, 360, { opt: true }), mast: inLimits(w + ' · mast', num(w + ' · mast', u.mast, 0, 200, { opt: true }), DEFENSES[u.type].radar?.mastRange, 'la altura real de su antena'), alt: num(w + ' · alt', u.alt, 0, 20000, { opt: true }),
      mag: num(w + ' · mag', u.mag, 0, 1000, { int: true, opt: true }), salvo: num(w + ' · salvo', u.salvo, 0, 10, { int: true, opt: true }), noDrones: bool(w + ' · noDrones', u.noDrones)
    };
  });
  const objIds = new Set(objs.filter(Boolean).map(g => g.id)), defIds = new Set(defs.filter(Boolean).map(u => u.id));
  // salvas
  const salvos = list('salvos', setup.salvos).map((sv, i) => {
    const w = `Salva ${i + 1}${typeof sv.type === 'string' ? ' (' + sv.type + ')' : ''}`;
    if (!THREATS[sv.type]) { err(`${w}: arma desconocida "${String(sv.type)}". Mirá la pestaña Catálogo para ver las disponibles.`); return null; }
    if (!Array.isArray(sv.pts) || sv.pts.length < 2 || sv.pts.length > 100) { err(`${w}: la ruta ("pts") necesita entre 2 y 100 puntos.`); return null; }
    const pts = sv.pts.map((p, k) => Array.isArray(p) && pos(`${w}, punto ${k + 1}`, p[0], p[1]) ? [p[0], p[1]] : null);
    if (sv.targetUnit != null && !defIds.has(sv.targetUnit)) err(`${w}: apunta a la defensa con id ${JSON.stringify(sv.targetUnit)}, que no está en el archivo.`);
    if (sv.targetObj != null && !objIds.has(sv.targetObj)) err(`${w}: apunta al objetivo con id ${JSON.stringify(sv.targetObj)}, que no está en el archivo.`);
    const T = 36000;   // 10 h de tiempo simulado
    return {
      id: id(w, sv.id), type: sv.type, pts, targetUnit: sv.targetUnit ?? null, targetObj: sv.targetObj ?? null,
      count: num(w + ' · count', sv.count, 1, 500, { int: true }), interval: num(w + ' · interval', sv.interval, 0, T, { opt: true }),
      tStart: num(w + ' · tStart', sv.tStart, 0, T, { opt: true }), sync: bool(w + ' · sync', sv.sync), tArrive: num(w + ' · tArrive', sv.tArrive, 0, T, { opt: true }),
      agl: inLimits(w + ' · agl', num(w + ' · agl', sv.agl, 0, 30000, { opt: true }), THREATS[sv.type].aglRange, 'sus límites reales de vuelo'), launchDist: num(w + ' · launchDist', sv.launchDist, 1, 5000, { opt: true }),
      maneuver: bool(w + ' · maneuver', sv.maneuver), decoys: bool(w + ' · decoys', sv.decoys)
    };
  });
  // interferidores
  const jams = list('jams', setup.jams).map((j, i) => {
    const w = `Interferidor ${i + 1}`;
    if (!JAMMERS[j.type]) { err(`${w}: tipo desconocido "${String(j.type)}". Válidos: ${Object.keys(JAMMERS).join(', ')}.`); return null; }
    pos(w, j.x, j.y);
    return { id: id(w, j.id), type: j.type, x: j.x, y: j.y, alt: num(w + ' · alt', j.alt, 0, 20000, { opt: true }), on: bool(w + ' · on', j.on) };
  });

  // reglas
  const r = raw.rules || {};
  // c2 = nivel de integración (data/c2.js); net = formato viejo (true = coordinada, false = desconectada)
  const net = bool('rules.net', r.net);
  const rules = { c2: r.c2 ?? (net === undefined ? undefined : c2FromNet(net)), doctrine: r.doctrine };
  if (r.c2 !== undefined && !C2_LEVELS[r.c2]) err(`rules.c2: "${String(r.c2)}" no es un nivel de mando y control válido (${Object.keys(C2_LEVELS).join(', ')}).`);
  if (r.doctrine !== undefined && !DOCTRINES.includes(r.doctrine)) err(`rules.doctrine: "${String(r.doctrine)}" no es ${DOCTRINES.join(' ni ')}.`);

  // datos del escenario (briefing y metas)
  let scenario = null;
  if (raw.scenario != null) {
    const sc = raw.scenario;
    if (typeof sc !== 'object') err('"scenario" tiene que ser un objeto.');
    else {
      scenario = { base: typeof sc.base === 'string' && SCENARIOS[sc.base] ? sc.base : null, name: str('scenario.name', sc.name, 200) || 'Escenario cargado', player: sc.player ?? 'defensa' };
      if (!SIDES.includes(scenario.player)) err(`scenario.player: "${String(sc.player)}" no es "ataque" ni "defensa".`);
      for (const k of ['time', 'conditions', 'success', 'failure']) scenario[k] = str('scenario.' + k, sc[k], 1000);
      scenario.description = str('scenario.description', sc.description, 5000);
      if (sc.forces != null) scenario.forces = { defensa: str('scenario.forces.defensa', sc.forces.defensa, 2000) || '', ataque: str('scenario.forces.ataque', sc.forces.ataque, 2000) || '' };
      if (sc.rulesText != null) scenario.rulesText = Array.isArray(sc.rulesText) ? sc.rulesText.slice(0, 30).map((t, i) => str(`scenario.rulesText[${i}]`, t, 1000) || '') : (err('scenario.rulesText tiene que ser una lista de textos.'), []);
      const goals = sc.goals == null ? [] : Array.isArray(sc.goals) ? sc.goals.slice(0, 50) : (err('scenario.goals tiene que ser una lista.'), []);
      const names = new Set([...objs, ...defs].filter(Boolean).map(x => x.name).filter(Boolean));
      scenario.goals = goals.map((g, i) => {
        const w = `Meta ${i + 1}`;
        if (!g || typeof g !== 'object') { err(`${w}: no es un objeto.`); return null; }
        if (!SIDES.includes(g.side)) err(`${w}: "side" tiene que ser "ataque" o "defensa".`);
        if (!GOAL_KINDS.includes(g.kind)) err(`${w}: tipo "${String(g.kind)}" desconocido. Válidos: ${GOAL_KINDS.join(', ')}.`);
        const target = str(w + ' · target', g.target, 120, false);
        if (target && !names.has(target)) warnings.push(`${w} ("${g.text || target}"): no hay ningún objetivo ni defensa llamado "${target}"; no se va a poder cumplir.`);
        return { side: g.side, primary: !!g.primary, kind: g.kind, target, min: num(w + ' · min', g.min, 0, 1, { opt: true }), text: str(w + ' · text', g.text, 300) || target || '' };
      }).filter(Boolean);
    }
  }

  if (errors.length) return { ok: false, errors, warnings };
  const clean = o => { for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k]; return o; };
  const data = {
    map, rules: clean(rules), scenario: scenario && clean(scenario),
    setup: { objs: objs.map(clean), defs: defs.map(clean), salvos: salvos.map(clean), jams: jams.map(clean) }
  };
  if (!objs.length && !defs.length && !salvos.length && !jams.length) warnings.push('El archivo no tiene objetivos, defensas, salvas ni jammers: el mapa queda vacío.');
  return { ok: true, errors, warnings, data };
}

/**
 * Despliega un escenario ya validado (data de validateScenario) sobre el mapa activo, que tiene que
 * ser data.map.key. Reemplaza S.setup, las reglas y S.scen. Las salvas apuntan a los mismos
 * objetivos y defensas que en el archivo (los ids se renumeran).
 */
export function loadScenarioData(data) {
  if (MAP?.key !== data.map.key) throw new Error(`loadScenarioData: el mapa activo es ${MAP?.key}, el escenario es de ${data.map.key}`);
  S.setup = { objs: [], defs: [], salvos: [], jams: [] }; S.sel = null; S.mode = 'select';
  const objId = new Map(), defId = new Map();
  for (const g of data.setup.objs) objId.set(g.id, addObj(g.type, g.x, g.y, { name: g.name, short: g.short, hp: g.maxHp, desc: g.desc }).id);
  for (const d of data.setup.defs) {
    const u = addDef(d.type, d.x, d.y, { name: d.name, az: d.az });
    for (const k of ['mast', 'alt', 'mag', 'salvo', 'noDrones']) if (d[k] !== undefined) u[k] = d[k];
    defId.set(d.id, u.id);
  }
  for (const sv of data.setup.salvos) {
    const o = structuredClone(sv); delete o.id;
    addSalvo({ ...o, targetUnit: sv.targetUnit != null ? defId.get(sv.targetUnit) : null, targetObj: sv.targetObj != null ? objId.get(sv.targetObj) : null });
  }
  for (const j of data.setup.jams) { const jj = addJam(j.type, j.x, j.y, { alt: j.alt }); if (j.on !== undefined) jj.on = j.on; }
  if (data.rules.c2) S.c2 = data.rules.c2;
  if (data.rules.doctrine) S.doctrine = data.rules.doctrine;
  S.scen = data.scenario ? {
    ...data.scenario, map: data.map.key,
    // el briefing lista los objetivos del escenario: son los del archivo
    objectives: S.setup.objs.map(g => ({ type: g.type, name: g.name, short: g.short, x: g.x, y: g.y, hp: g.maxHp, desc: g.desc })),
    defs: [], salvos: [], jams: []
  } : null;
}
