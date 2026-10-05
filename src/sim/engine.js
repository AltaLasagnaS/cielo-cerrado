// @ts-check
// ---------------- SIMULACIÓN ----------------
// Bucle de paso fijo: la interfaz llama a step(dt) con dt ≤ 0,25 s de tiempo simulado.
// Cada paso: lanzamientos → movimiento/señuelos/GNSS → barridos de sensores → decisiones de tiro
// → resolución de interceptores → fin de corrida. Ver docs/ARQUITECTURA.md.
import { D, JAMMERS, JAM_MODES, TARGET_STATUS, UNIT_TARGET, UNIT_DAMAGE, UNIT_COMP_AT, datalinksOf } from '../data/index.js';
import { classify, classifyGain, classifyTau } from '../physics/decoys.js';
import { money } from '../util/format.js';
import { nextId } from '../util/ids.js';
import { rnd } from '../util/rng.js';
import { surf, los, MAP } from '../physics/terrain.js';
import { antZ, aspectCos, belowCeiling, detR, inSector, jamJ, pdScan, PD_CUTOFF, confirms, scanHistory, falseTracks } from '../physics/radar.js';
import { buildThreat, posAt, speedAt } from '../physics/kinematics.js';
import { trackVel, predictAt } from '../physics/track.js';
import { gnssNavError, crpaOverwhelmed } from '../physics/navigation.js';
import { profileOf, timeTo } from '../physics/interceptor.js';
import { RADAR_GUID, isTBM, trackOK, reactionStart, solve, arrivalReach, trackKeys, ownKey, calcPk, effectiveC2, unitC2, netPk, cpOf, netKey } from '../physics/engagement.js';
import { C2_LEVELS } from '../data/index.js';
import { damageAt, targetStatus } from '../physics/damage.js';
import { azOf } from '../util/math.js';
import { S, newStats } from './state.js';
import { hooks } from './hooks.js';
import { log, event, label, uLabel, pista } from './log.js';
import { recReset, recUnit, recObj } from './replay.js';
import { ewStep } from './ew.js';
import { wxNow, wxReset, wxStep } from './weather-now.js';
import { noteSeen, noteObs, emitting, isEmitter } from './contacts.js';

/** Arma la corrida a partir de S.setup: copia unidades y jammers y programa todos los lanzamientos. */
export function startSim() {
  S.units = S.setup.defs.map(d => ({ ...d, alive: true, hp: UNIT_TARGET.hp, dmgRadar: false, dmgLauncher: false, magLeft: d.mag, reserveLeft: d.reserve ?? 0, reloadUntil: null, nextScan: rnd() * 2, avail: {}, active: 0, nextEval: 0 }));
  S.jamsLive = S.setup.jams.map(j => ({ ...j, _losMap: {}, hp: UNIT_TARGET.hp })); S.hoj = []; S.ewNext = 0; wxReset();
  S.objs = S.setup.objs.map(g => ({ ...g, hp: g.maxHp, status: 'operational', hits: 0, dmgBy: {} }));
  S.threats = []; S.ints = []; S.fx = []; S.impacts = []; S.stats = newStats(); S.log = []; S.events = []; S.arrivals = [];
  S.pending = []; recReset();
  for (const sv of S.setup.salvos) {
    let t0 = sv.tStart || 0;
    if (sv.sync) { const probe = buildThreat(sv, 0, 0, S.wind); t0 = Math.max(0, (sv.tArrive || 0) - probe.ft); }
    for (let k = 0; k < sv.count; k++) S.pending.push(buildThreat(sv, k, t0 + k * (sv.interval || 0), S.wind));
  }
  S.pending.sort((a, b) => a.tLaunch - b.tLaunch);
  S.t = 0; S.started = true;
  log('d', 'Inicio de la simulación: ' + S.pending.length + ' amenazas programadas, ' + S.units.length + ' unidades de defensa.');
}

/** Vuelve al modo edición: descarta la corrida (el setup queda intacto). */
export function resetState() { S.rec = null; S.replay = null; S.autoPhase = 'calm'; S.running = false; S.started = false; S.t = 0; S.units = []; S.jamsLive = []; S.hoj = []; S.ewNext = 0; S.wxLive = null; S.wxIdx = 0; S.objs = []; S.events = []; S.arrivals = []; S.pending = []; S.threats = []; S.ints = []; S.fx = []; S.impacts = []; S.stats = newStats(); S.log = []; }

/** Avanza la simulación dt segundos. */
export function step(dt) {
  const t = S.t + dt; S.t = t;
  wxStep(t);
  // lanzamientos
  while (S.pending.length && S.pending[0].tLaunch <= t) {
    const th = S.pending.shift(); th.alive = true; S.threats.push(th);
    S.stats.launched++; if (th.isDecoy) S.stats.decoys++; S.stats.atkCost += th.T.cost;
    event('Primer lanzamiento: ' + label(th), 'launch');
  }
  // movimiento, impactos, señuelos, GNSS
  for (const th of S.threats) {
    if (!th.alive) continue;
    const p = posAt(th, t);
    if (!p) { impact(th); continue; }
    // velocidad 3D (m/s) del último paso: la usa el aspecto de la RCS (physics/radar.js#aspectCos)
    if (th.p && dt > 0) th.vel = [(p.x - th.p.x) * 1000 / dt, (p.y - th.p.y) * 1000 / dt, (p.z - th.p.z) / dt];
    th.p = p;
    if (!th.trail.length || t - th.trail[th.trail.length - 1][2] > 3) { th.trail.push([p.x, p.y, t]); if (th.trail.length > 80) th.trail.shift(); }
    if (th.decoyRel && !th.released && p.rem < 40) {
      th.released = true;
      for (let k = 0; k < th.decoyRel; k++) {
        const ang = rnd() * 6.28, dist = 1 + rnd() * 2.5;
        const dc = { ...th, fly: [], id: nextId(), parent: th, tBorn: t, isDecoy: true, isDecoyChild: true, decoyRel: 0, sRel: p.s, off: [Math.cos(ang) * dist, Math.sin(ang) * dist], det: {}, mn: {}, mnT: {}, net: {}, obs: {}, seen: null, seenPrev: null, trail: [], lastNet: -1e9, firstDet: null, cueFirst: null, netFirst: null, clsT: 0, clsTau: null, clsAs: null, phase: th.phase + (k + 1) * 1.6180339, alive: true, targetUnit: null };
        S.threats.push(dc); S.stats.decoys++; S.stats.launched++;
      }
      log('w', label(th) + ' libera ' + th.decoyRel + ' señuelos a ' + p.rem.toFixed(0) + ' km del blanco.', 'atk');
      event(label(th) + ' libera señuelos', 'decoys');
    }
    if (!th.gnssHit && th.T.gnss < 1) {
      // fuentes anti-GNSS que cubren el punto; una antena CRPA de N elementos anula hasta N − 1 (por dirección)
      const srcs = S.jamsLive.filter(j => JAMMERS[j.type].gnssJam && j.on && !j.dead && Math.hypot(p.x - j.x, p.y - j.y) <= JAMMERS[j.type].radius);
      const held = th.crpa > 0 && srcs.length > 0 && !crpaOverwhelmed(th.crpa, p.x, p.y, srcs);
      if (held && !th.crpaHeld) { th.crpaHeld = true; log('d', label(th) + ': su antena CRPA de ' + th.crpa + ' elementos anula la interferencia GNSS (' + srcs.length + ' fuente' + (srcs.length > 1 ? 's' : '') + ').', 'atk'); }
      for (const j of held ? [] : srcs) {
        const J = JAMMERS[j.type];
        if (J.side !== 'both' && th.T.side !== 'both' && J.side === th.T.side) continue;
        const link = th.link && !S.jamsLive.some(k => JAMMERS[k.type].linkJam && k.on && !k.dead && Math.hypot(p.x - k.x, p.y - k.y) <= JAMMERS[k.type].radius);   // un antidrón le corta el enlace
        const n = gnssNavError(th.T, J, link); th.gnssHit = true; th.navErr = n.err;
        if (n.corrected) log('w', label(th) + ' pierde el GNSS en la zona de ' + J.short + (n.rejected ? ' y descarta el engaño' : '') + ', pero su buscador terminal encuentra el blanco.', 'atk');
        else if (th.navErr > 150) { log('w', label(th) + (n.spoofed ? ' es engañada por ' + J.short + ' (spoofing GNSS): desvío ≈' + (th.navErr / 1000).toFixed(1) + ' km.' : (n.rejected ? ' descarta el engaño de ' + J.short + (link && !th.T.navFix ? ' gracias a su enlace de datos' : ' con su corrección de terreno') + '; sigue con inercial: error ≈' : ' entra en zona anti-GNSS: error de navegación ≈') + Math.round(th.navErr) + ' m.'), 'atk'); event('Primera arma desviada por interferencia GNSS', 'gnss'); }
        break;
      }
    }
  }
  // sensores
  for (const u of S.units) {
    if (!u.alive) continue; const d = D(u); if (!d.radar) continue;
    if (!emitting(u, t)) continue;   // control de emisiones: un radar apagado no ve (ni se delata)
    if (t < u.nextScan) continue; u.nextScan = t + d.radar.scan;
    if (isEmitter(d.radar)) u.emitFrom ??= t;   // desde acá el atacante lo puede ubicar por su emisión
    const r = d.radar, uz = antZ(u), wx = wxNow();
    // capacidad de seguimiento (radar.tracks): pistas abiertas + falsos blancos DRFM; una pista nueva no
    // entra si está lleno (las abiertas se mantienen)
    const keep = r.scan * 2 + 0.6, cap = r.tracks ?? Infinity, fake = falseTracks(u, S.jamsLive);
    u.fake = fake;   // falsos blancos DRFM de este barrido: ocupan capacidad y pueden atraer disparos (engage)
    let held = 0;
    if (cap < Infinity) for (const th of S.threats) if (th.alive && t - (th.det[u.id] ?? -1e9) <= keep) held++;
    for (const th of S.threats) {
      if (!th.alive || !th.p) continue; const p = th.p;
      const dx = p.x - u.x, dy = p.y - u.y, dh = Math.hypot(dx, dy);
      let ok = false;
      if (r.band === 'ACU') { ok = th.cls === 'dron' && dh <= detR(u, th, 0, 1, wx) && (p.z - surf(p.x, p.y)) <= (r.altMax || 3000); }
      else {
        const az = azOf(dx, dy); if (!inSector(u, az)) continue;
        const rr = Math.hypot(dh, (p.z - uz) / 1000);
        // primero el alcance sin interferencia (cota superior, barata) y recién después la interferencia
        const ca = aspectCos(th, u.x, u.y, uz), agl = p.z - surf(p.x, p.y);
        if (rr > PD_CUTOFF * detR(u, th, 0, ca, wx) || !belowCeiling(r, wx, agl)) continue;
        const J = jamJ(u, az, S.jamsLive); const R = detR(u, th, J, ca, wx);
        // probabilidad de detección del barrido: SNR con fluctuación Swerling, clutter (suelo, mar, lluvia) y notch Doppler
        const pd = pdScan(u, th, rr, R, agl, p.x, p.y, ca, wx);
        const hit = pd > 0 && rnd() <= pd && los(u.x, u.y, uz, p.x, p.y, p.z);
        if (r.band === 'OPT') ok = hit;
        else {
          // confirmación "M de N": abrir una pista exige TRACK_M ecos en los últimos TRACK_N barridos;
          // una pista ya abierta (vista en los últimos 2 barridos) se mantiene con uno solo
          // los barridos en que el blanco no llegó a sortearse (fuera del sector o muy lejos) cuentan como "no visto"
          const mnT = th.mnT || (th.mnT = {});
          const bits = scanHistory(th.mn[u.id] ?? 0, mnT[u.id], t, r.scan, hit); th.mn[u.id] = bits; mnT[u.id] = t;
          const open = t - (th.det[u.id] ?? -1e9) <= keep;
          ok = hit && (open || confirms(bits));
          if (ok && !open && cap < Infinity) {
            if (held + fake >= cap) { ok = false; if (!u.satLog) { u.satLog = true; log('w', uLabel(u) + ' no puede abrir más pistas: ' + held + ' reales' + (fake ? ' y ' + fake + ' falsas (engaño DRFM)' : '') + ' llenan su capacidad de ' + cap + '.', 'def', uLabel(u) + ' no puede abrir más pistas: ' + (held + fake) + ' llenan su capacidad de ' + cap + '.'); } }
            else held++;
          }
        }
      }
      if (ok) {
        th.det[u.id] = t; noteSeen(th, t, u.id); noteObs(th, ownKey(u), t);
        const g = classifyGain(r);   // seguimiento con radar de tiro: aprende a distinguir señuelos
        if (g) { th.clsT = (th.clsT || 0) + g; th.clsTau = Math.min(th.clsTau ?? Infinity, classifyTau(r)); const c = classify(th); if (c && !th.clsAs) { th.clsAs = c; if (c === 'señuelo' && S.ignoreDecoys) log('d', 'Pista #' + th.id + ' clasificada como señuelo por ' + uLabel(u) + (th.isDecoy ? '.' : ' (¡error: era ' + th.T.short + '!).'), 'def', 'Pista #' + th.id + ' clasificada como señuelo por ' + uLabel(u) + '.'); } }
        // La coordinación C2 puede repartir una alerta aun cuando el datalink de tiro esté apagado; una
        // unidad asignada a "desconectada" (u.c2) no avisa ni publica.
        const inNet = u.c2 !== 'desconectada';
        const cp = cpOf(u);
        if (inNet) { if (!cp) { if (th.cueFirst === null) th.cueFirst = t; } else { const m = th.cueCp || (th.cueCp = {}); if (m[cp] == null) m[cp] = t; } }
        // Una pista de tiro solo entra a la red por un transporte compatible y encendido.
        if (u.link !== false && inNet) for (const key of datalinksOf(D(u))) {
          const nk = netKey(key, cp), n = th.net[nk] || (th.net[nk] = { first: null, last: -1e9 });
          if (n.first === null) n.first = t;
          n.last = t; noteObs(th, nk, t);
          th.lastNet = t; if (th.netFirst === null) th.netFirst = t;
        }
        if (th.firstDet === null) { th.firstDet = t; th.detKm = p.rem; { const where = ' por ' + uLabel(u) + ' a ' + Math.hypot(p.x - u.x, p.y - u.y).toFixed(1) + ' km, ' + Math.round(p.z - surf(p.x, p.y)) + ' m AGL.'; log('l', 'Primera detección: ' + label(th) + where, 'def', 'Primera detección: pista #' + th.id + where); } event('Primera detección: ' + label(th) + ' por ' + uLabel(u), 'firstDet'); }
      }
    }
  }
  // recarga: una batería vacía con reserva recarga en sam.reloadS; si hay depósitos de munición en el
  // mapa, necesita uno en pie a menos de RESUPPLY_KM (destruirlos corta la recarga)
  for (const u of S.units) {
    if (!u.alive || !D(u).sam) continue;
    if (u.reloadUntil !== null && t >= u.reloadUntil) {
      const n = Math.min(u.mag, u.reserveLeft); u.magLeft += n; u.reserveLeft -= n; u.reloadUntil = null; S.stats.reloads++; recUnit(u);
      log('l', uLabel(u) + ' termina de recargar: ' + n + ' listos, quedan ' + u.reserveLeft + ' en reserva.', 'def');
    } else if (u.reloadUntil === null && u.magLeft === 0 && u.active === 0 && u.reserveLeft > 0 && canResupply(u)) {
      u.reloadUntil = t + D(u).sam.reloadS;
      log('w', uLabel(u) + ' empieza a recargar (' + Math.round(D(u).sam.reloadS / 60) + ' min).', 'def');
    }
  }
  // guerra electrónica de la defensa: triangulación de jammers y disparos home-on-jam
  ewStep(t);
  // enfrentamientos (cada 1 s simulado por unidad)
  for (const u of S.units) {
    if (!u.alive || !D(u).sam || u.dmgLauncher || u.magLeft <= 0) continue;
    if (t < u.nextEval) continue; u.nextEval = t + 1;
    engage(u, t);
  }
  // interceptores que llegan al punto de encuentro
  for (const it of S.ints) {
    if (it.done || t < it.tH) continue;
    it.done = true; const u = it.u; u.active = Math.max(0, u.active - 1);
    if (it.phantom) { log('x', it.shot + ' de ' + uLabel(u) + ' no encuentra nada: era un falso blanco.', 'def'); continue; }
    const th = it.th;
    if (!th.alive) { log('d', it.shot + ' de ' + uLabel(u) + ': blanco ya destruido, autodestrucción.', 'def'); continue; }
    // guiado por el radar de la batería (SARH, TVM, mando): si la batería cayó, el misil queda sin guía
    if (!u.alive && RADAR_GUID.includes(D(u).sam.guid)) { log('x', it.shot + ' de ' + uLabel(u) + ' pierde la guía: su batería fue destruida.', 'def'); continue; }
    // salió hacia el punto previsto: si el blanco cambió de rumbo o de altura más de lo que cubre su energía, no llega
    const reach = arrivalReach(u, th, t, it.kin ?? null);
    if (!reach.ok) { log('x', it.shot + ' de ' + uLabel(u) + ' no alcanza a ' + label(th) + ': el blanco no estaba donde se lo esperaba.', 'def', it.shot + ' de ' + uLabel(u) + ' no alcanza a la ' + pista(th) + ': no estaba donde se la esperaba.'); S.fx.push({ x: it.px, y: it.py, rt: performance.now(), c: '#8a9aac' }); continue; }
    const pk = calcPk(u, th, t, S.jamsLive, it.f == null ? null : reach.f) * (it.remote ? C2_LEVELS[it.c2].remotePk * (it.gw ?? 1) : 1);   // error de posición de la pista de red (y de la pasarela)
    if (rnd() < pk) {
      th.alive = false; th.killed = true; th.tEnd = t; S.stats.killed++; if (th.isDecoy) S.stats.decoysKilled++;
      const p = th.p || it; S.fx.push({ x: p.x, y: p.y, rt: performance.now(), c: '#6fd08c' });
      log('k', uLabel(u) + ' derriba ' + label(th) + (th.isDecoy ? ' (era señuelo)' : '') + ' — Pk ' + Math.round(pk * 100) + '%.', 'def', uLabel(u) + ' derriba la ' + pista(th) + ' — Pk ' + Math.round(pk * 100) + '%.');
      event('Primer derribo: ' + uLabel(u) + ' derriba ' + label(th), 'firstKill');
    } else {
      log('x', it.shot + ' de ' + uLabel(u) + ' falla contra ' + label(th) + ' (Pk ' + Math.round(pk * 100) + '%).', 'def', it.shot + ' de ' + uLabel(u) + ' falla contra la ' + pista(th) + ' (Pk ' + Math.round(pk * 100) + '%).');
      S.fx.push({ x: it.px, y: it.py, rt: performance.now(), c: '#8a9aac' });
    }
  }
  if (S.ints.length > 400) S.ints = S.ints.filter(i => !i.done || t - i.tH < 3);
  // fin
  if (!S.pending.length && S.threats.every(th => !th.alive) && S.ints.every(i => i.done) && S.started) {
    event('Fin: no quedan amenazas en vuelo', 'end');
    if (S.running) { S.running = false; hooks.onEnd(); const st = S.stats; log('d', `Fin: ${st.killed} derribos, ${st.hits} impactos en blanco, ${st.misses} fuera de blanco. Costo defensa ${money(st.defCost)} vs ataque ${money(st.atkCost)}.`); }
  }
}

/**
 * ¿Puede u enfrentar a th ahora? Revisa pista (propia o de red), tiempo de reacción, coordinación,
 * solución de tiro, velocidad máxima y, para los guiados por radar, que su radar cubra el punto de
 * encuentro. probe = true: consulta sin efectos (para el reparto "mejor tirador"), no anota la hora
 * de inicio de la reacción. → { sol, remote } o null.
 */
function canEngage(u, th, t, c2, probe) {
  const d = D(u), sm = d.sam;
  if (!u.alive || !sm || u.dmgLauncher || u.magLeft <= 0 || u.active >= sm.ch) return null;   // lanzador dañado: no lanza
  if (!th.alive || !th.p || th.firstDet === null) return null;
  const maxR = isTBM(th) ? sm.maxRtbm : sm.maxR; if (!maxR) return null;
  if (u.noDrones && th.cls === 'dron') return null;
  const sn = th.seen ?? th.p; if (Math.hypot(sn.x - u.x, sn.y - u.y) > maxR + 120) return null;   // filtro grueso con la última posición vista
  if (!trackOK(u, th, t, c2, S.gateways)) { if (!probe) delete u.avail[th.id]; return null; }
  let av = u.avail[th.id];
  if (av === undefined) { av = reactionStart(th, t, c2, u); if (!probe) u.avail[th.id] = av; }
  if (t - av < sm.react * (u.dmgRadar ? UNIT_DAMAGE.react : 1)) return null;   // radar de tiro dañado: reacción más lenta
  const flying = (th.fly || []).filter(i => !i.done);
  if (C2_LEVELS[c2].deconf ? flying.some(i => cpOf(i.u) === cpOf(u)) : flying.some(i => i.u === u)) return null;   // la coordinación es dentro del puesto de mando
  // doctrina de señuelos: la de la unidad (u.decoyDoc) o, si hereda, la general; decide con la clasificación
  // conocida (th.clsAs), no con la identidad real
  const ign = u.decoyDoc === 'ignorar' ? true : u.decoyDoc === 'tirar' ? false : S.ignoreDecoys;
  if (ign && th.clsAs === 'señuelo') return null;
  return { pre: true };
}

/** Segunda mitad de canEngage (lo caro): solución de tiro y cobertura del punto de encuentro. */
function solveFor(u, th, t, c2) {
  const sm = D(u).sam, r = D(u).radar;
  const sol = solve(u, th, t, S.fireRange ?? 1, trackKeys(u, th, t, c2, S.gateways)); if (!sol) return null;
  if ((sol.v ?? speedAt(th, t + sol.tau)) > sm.vmaxT) return null;   // velocidad medida (la verdadera solo en balísticos)
  const remote = !(r && t - (th.det[u.id] ?? -1e9) <= r.scan * 2 + 0.6);
  if (RADAR_GUID.includes(sm.guid) && sm.guid !== 'cañón') {
    if (!los(u.x, u.y, antZ(u), sol.p.x, sol.p.y, sol.p.z)) return null;
    // con pista ajena (C2 integrada), su radar tiene que cubrir el punto de encuentro: sector y alcance
    if (remote) {
      const az = azOf(sol.p.x - u.x, sol.p.y - u.y), dk = Math.hypot(sol.p.x - u.x, sol.p.y - u.y, (sol.p.z - antZ(u)) / 1000);
      if (!inSector(u, az) || dk > detR(u, th, jamJ(u, az, S.jamsLive), 1, wxNow())) return null;
    }
  }
  return { sol, remote };
}

/**
 * Puntaje para el reparto "mejor tirador" (mayor = mejor): contra drones, el menor costo esperado por
 * derribo (costo del disparo / Pk); contra el resto, la mayor Pk. f = fracción del alcance del tiro
 * (solve), para contar la energía del misil.
 */
/** @param {number | null} [f] */
function shooterScore(u, th, t, f = null) {
  const pk = Math.max(0.01, calcPk(u, th, t, S.jamsLive, f, true));   // lo que estima la defensa, no la verdad
  return th.cls === 'dron' ? -D(u).sam.cost / pk : pk;
}

/** Distancia máxima (km) a un depósito de munición para poder recargar. */
export const RESUPPLY_KM = 30;

/**
 * ¿Puede recargar u? Sin depósitos de munición en el mapa, sí (vehículos propios de la batería); con
 * depósitos, solo si alguno sigue en pie a menos de RESUPPLY_KM.
 */
export function canResupply(u) {
  const dumps = S.objs.filter(g => g.type === 'ammo'); if (!dumps.length) return true;
  return dumps.some(g => g.status !== 'destroyed' && Math.hypot(g.x - u.x, g.y - u.y) <= RESUPPLY_KM);
}

/** Costo esperado por derribo de u contra th (costo del disparo / Pk). */
const costPerKill = (u, th, t) => D(u).sam.cost / Math.max(0.01, calcPk(u, th, t, S.jamsLive, null, true));

/**
 * ¿La trayectoria prevista de th (con las pistas de quien decide; hasta que sale del mapa) pasa por la envolvente de v (90% del
 * alcance, entre su piso y su techo)? Muestrea cada 2 s. Sirve para dejarle un dron a una capa más barata.
 */
/** @param {string[]} keys pistas de quien decide (trackKeys) */
function reaches(v, th, t, keys) {
  // con la trayectoria que se puede prever con esas pistas (la verdadera solo en balísticos), no con la ruta real
  const sm = D(v).sam, lz = surf(v.x, v.y) + 2, tbm = isTBM(th), vel = tbm ? null : trackVel(th, keys);
  if (!tbm && !vel) return false;
  const tEnd = tbm ? th.tLaunch + th.ft - 1 : t + 3600;
  for (let tt = t + 2; tt < tEnd; tt += 2) {
    const p = tbm ? posAt(th, tt) : predictAt(vel, tt); if (!p || p.x < 0 || p.y < 0 || p.x > MAP.wKm || p.y > MAP.hKm) break;   // la línea prevista hasta que sale del mapa
    if (Math.hypot(p.x - v.x, p.y - v.y) <= sm.maxR * 0.9 && p.z - lz <= sm.altMax && p.z - surf(p.x, p.y) >= sm.altMin) return true;
  }
  return false;
}

/**
 * Decisión de tiro de la unidad u: arma la lista de blancos con pista, fuera del tiempo de reacción
 * y no enfrentados por otra batería (con red) o por ella misma (sin red), los ordena por tiempo
 * restante hasta el blanco y dispara mientras tenga canales y munición. Con reparto "mejor tirador"
 * (C2 integrada), deja pasar un blanco si otra batería con enlace puede enfrentarlo ahora y es mejor.
 */
export function engage(u, t) {
  const d = D(u), sm = d.sam; const ch = sm.ch;
  if (u.active >= ch) return;
  const cp = cpOf(u), c2net = effectiveC2(S.c2, S.objs, cp), c2 = unitC2(u, c2net), L = C2_LEVELS[c2];
  const cand = [];
  // prioridad: el contacto que antes llega a la batería, según lo que ve la defensa (última posición y
  // velocidad medida); no el tiempo que le falta al arma hasta su blanco, que la defensa no conoce
  const eta = th => { const s = th.seen, v = trackVel(th); return s ? Math.hypot(s.x - u.x, s.y - u.y) * 1000 / Math.max(1, v ? v.v : 1) : Infinity; };
  for (const th of S.threats) if (canEngage(u, th, t, c2, false)) cand.push([th, eta(th)]);
  cand.sort((a, b) => a[1] - b[1]);
  // falsos blancos DRFM que pasan la clasificación (JAM_MODES.drfm.fooled): compiten con las pistas reales
  // por los disparos de esta evaluación; si sale uno, la batería gasta una salva en la nada
  const ph = Math.round((u.fake || 0) * JAM_MODES.drfm.fooled);
  if (ph > 0 && u.active < ch && u.magLeft > 0 && rnd() < ph / (ph + cand.length)) phantomShot(u, t);
  for (const [th] of cand) {
    if (u.active >= ch || u.magLeft <= 0) { const k = uLabel(u), sat = u.magLeft <= 0 ? S.stats.satMag : S.stats.satChannels; sat[k] = (sat[k] || 0) + 1; break; }
    const f = solveFor(u, th, t, c2); if (!f) continue;
    if (L.best && u.link !== false) {
      // mejor tirador ahora: otra batería con enlace que también puede tirar ya y es mejor
      const mine = shooterScore(u, th, t, f.sol.f);
      const better = S.units.some(v => { if (v === u || v.link === false || cpOf(v) !== cp || !canEngage(v, th, t, unitC2(v, c2net), true)) return false; const fv = solveFor(v, th, t, unitC2(v, c2net)); return !!fv && shooterScore(v, th, t, fv.sol.f) > mine * (th.cls === 'dron' ? 0.999 : 1.001); });
      if (better) continue;
      // defensa por capas: un dron se le deja a una capa al menos 2 veces más barata por derribo que
      // tenga munición y por cuya envolvente vaya a pasar antes de llegar
      if (th.cls === 'dron') {
        const cpk = costPerKill(u, th, t), keys = trackKeys(u, th, t, c2, S.gateways);   // la prevé quien decide, con sus pistas
        const layer = S.units.some(v => v !== u && v.alive && v.link !== false && cpOf(v) === cp && D(v).sam && v.magLeft > 0 && !v.noDrones && D(v).sam.maxR > 0 && costPerKill(v, th, t) * 2 <= cpk && reaches(v, th, t, keys));
        if (layer) continue;
      }
    }
    const { sol, remote } = f;
    const n = Math.min(S.doctrine === 'salva' ? (u.salvo || sm.salvo) : 1, u.magLeft, ch - u.active);
    for (let k = 0; k < n; k++) {
      const it = { u, th, x0: u.x, y0: u.y, px: sol.p.x, py: sol.p.y, tL: t + k * 0.6, tH: t + sol.tau + k * 0.6, shot: sm.shot, done: false, remote, c2, f: sol.f, kin: sol.f > 0 ? sol.r / sol.f : null, gw: remote ? (netPk(u, th, t, c2, S.gateways) || 1) : 1 };
      S.ints.push(it); (th.fly = th.fly || []).push(it);
      S.rec?.ints.push(it); u.magLeft--; u.active++; S.stats.shots++; S.stats.defCost += sm.cost; recUnit(u); u.revealed ??= t;   // el lanzamiento la delata (vista del atacante)
      S.stats.byUnit[uLabel(u)] = (S.stats.byUnit[uLabel(u)] || 0) + 1;
    }
    event('Primer interceptor lanzado: ' + uLabel(u) + ' contra ' + label(th), 'firstShot');
    if (u.magLeft === 0) { log('w', uLabel(u) + ' se queda sin munición.', 'def'); event(uLabel(u) + ' se queda sin munición', 'empty:' + u.id); }
    const how = ' — intercepción a ' + sol.r.toFixed(1) + ' km en ' + sol.tau.toFixed(0) + ' s' + (remote ? ' (con pista de la red)' : '') + '.';
    log('l', uLabel(u) + ' dispara ' + n + '× ' + sm.shot + ' contra ' + label(th) + how, 'def', uLabel(u) + ' dispara ' + n + '× ' + sm.shot + ' contra la ' + pista(th) + how);
  }
}

/** Salva contra un falso blanco DRFM: el misil vuela hacia el sector del radar y no encuentra nada. */
function phantomShot(u, t) {
  const sm = D(u).sam, n = Math.min(S.doctrine === 'salva' ? (u.salvo || sm.salvo) : 1, u.magLeft, sm.ch - u.active);
  const a = (u.az || 0) * Math.PI / 180, r = sm.maxR * 0.6, tau = timeTo(profileOf(sm), r * 1000);
  for (let k = 0; k < n; k++) {
    const it = { u, th: null, phantom: true, x0: u.x, y0: u.y, px: u.x + Math.sin(a) * r, py: u.y - Math.cos(a) * r, tL: t + k * 0.6, tH: t + tau + k * 0.6, shot: sm.shot, done: false };
    S.ints.push(it); S.rec?.ints.push(it); u.magLeft--; u.active++; S.stats.shots++; S.stats.defCost += sm.cost; recUnit(u); u.revealed ??= t;
  }
  log('w', uLabel(u) + ' dispara ' + n + '× ' + sm.shot + ' contra un falso blanco (engaño DRFM).', 'def', uLabel(u) + ' dispara ' + n + '× ' + sm.shot + ' contra una pista.');
  if (u.magLeft === 0) log('w', uLabel(u) + ' se queda sin munición.', 'def');
}

/**
 * Llegada al blanco: punto de caída con dispersión circular normal (CEP → σ = CEP / 1,1774) más el
 * error de navegación por interferencia GNSS. Cuenta como impacto en el blanco si cae a menos de
 * 20 m (drones) o 50 m (misiles) del punto apuntado. Además, cada objetivo cercano recibe daño
 * según la distancia y la ojiva (physics/damage.js), haya sido "impacto" o no.
 */
export function impact(th) {
  th.alive = false; th.done = true; th.tEnd = S.t;
  const tg = th.pts[th.pts.length - 1];
  let x = tg[0], y = tg[1];
  if (th.parent) { x += th.off[0]; y += th.off[1]; }
  const sig = (th.T.cep || 10) / 1.1774; const ang = rnd() * 6.28;
  const r = sig * Math.sqrt(-2 * Math.log(1 - rnd() * 0.999)) + th.navErr;
  x += Math.cos(ang) * r / 1000; y += Math.sin(ang) * r / 1000;
  if (th.isDecoy) { S.impacts.push({ x, y, k: 'decoy', t: S.t }); log('d', label(th) + ' cae sin efecto.', 'def', 'La ' + pista(th) + ' cae sin efecto.'); return; }
  const hit = r <= (th.T.hitR || (th.cls === 'dron' ? 20 : 50));
  const c2Before = effectiveC2(S.c2, S.objs);
  const dmg = applyDamage(th, x, y), total = dmg.reduce((a, d) => a + d.dmg, 0);
  const c2After = effectiveC2(S.c2, S.objs);
  if (c2After !== c2Before) { log('x', `La defensa pierde un nodo de mando y control: el C2 cae a "${C2_LEVELS[c2After].name}".`, 'def'); event('C2 degradado a ' + C2_LEVELS[c2After].name, 'c2:' + c2After); }
  S.stats.missSum += r; S.stats.missN++;
  S.arrivals.push({ t: S.t, id: th.id, type: th.type, name: label(th), cls: th.cls, det: th.firstDet, detKm: th.detKm ?? null, shots: (th.fly || []).length, miss: r, hit, dmg: total, nav: th.navErr, target: dmg[0]?.g.name ?? null });
  const dtxt = dmg.map(d => ` · −${d.dmg} HP a ${d.g.name} (${Math.max(0, d.g.hp)}/${d.g.maxHp})`).join('');
  if (hit) {
    S.stats.hits++; S.impacts.push({ x, y, k: 'hit', t: S.t });
    S.fx.push({ x, y, rt: performance.now(), c: '#ff5b4d', big: true });
    let msg = label(th) + ' impacta en el blanco', alt = 'Impacto' + (th.firstDet === null ? ' de un arma no detectada' : ' de la ' + pista(th));
    if (th.targetUnit) { const u = S.units.find(v => v.id === th.targetUnit && v.alive); if (u) { u.alive = false; recUnit(u); S.stats.lost++; msg += ' y destruye ' + uLabel(u); alt += ': ' + uLabel(u) + ' destruida'; hooks.onUnitLost(); event(uLabel(u) + ' destruida por ' + label(th), 'lost:' + u.id); } }
    log('x', msg + dtxt + '.', 'def', alt + dtxt + '.');
  } else {
    S.stats.misses++; S.impacts.push({ x, y, k: 'miss', t: S.t });
    log('w', label(th) + ' cae a ' + Math.round(r) + ' m del blanco' + (th.navErr > 150 ? ' (desviado por interferencia GNSS)' : '') + dtxt + '.', 'def', 'Cae ' + (th.firstDet === null ? 'un arma no detectada' : 'la ' + pista(th)) + ' sin dar en un objetivo' + dtxt + '.');
  }
  damageUnits(th.T, x, y); damageJammers(th.T, x, y);
  for (const d of dmg) {
    event('Primer impacto con daño: ' + label(th) + ' sobre ' + d.g.name, 'firstDmg');
    if (d.g.status !== d.before) {
      const st = TARGET_STATUS[d.g.status].toUpperCase();
      log(d.g.status === 'destroyed' ? 'x' : 'w', d.g.name + ': ' + st + '.');
      event(d.g.name + ' ' + st.toLowerCase(), d.g.status + ':' + d.g.id);
      if (d.g.status === 'destroyed') S.stats.objsDestroyed++;
    }
  }
}

/** Reparte el daño de un impacto en (x, y) km entre los objetivos alcanzados. */
function applyDamage(th, x, y) {
  const out = [];
  for (const g of S.objs) {
    if (g.status === 'destroyed') continue;
    const dist = Math.hypot(x - g.x, y - g.y) * 1000;
    const res = damageAt(th.T, g.type, dist); if (!res.dmg) continue;
    const before = g.status, dmg = Math.min(Math.round(res.dmg), g.hp);
    g.hp -= dmg; g.hits++; g.dmgBy[th.T.short] = (g.dmgBy[th.T.short] || 0) + dmg; g.status = targetStatus(g.hp, g.maxHp); recObj(g);
    S.stats.damage += dmg; S.stats.dmgByWeapon[th.T.short] = (S.stats.dmgByWeapon[th.T.short] || 0) + dmg;
    out.push({ g, dmg, dist, before });
  }
  return out;
}

/**
 * Jammers terrestres alcanzados por una caída en (x, y) km (docs/FISICA.md §10): pierden vida como una
 * unidad (UNIT_TARGET) y a 0 dejan de interferir. Los aéreos no (los derriba el home-on-jam, sim/ew.js).
 * Sin daño parcial: un jammer con vida sigue funcionando entero. Se puede apuntar una salva a un jammer.
 */
export function damageJammers(T, x, y) {
  for (const j of S.jamsLive) {
    if (j.dead || JAMMERS[j.type].air) continue;
    const res = damageAt(T, UNIT_TARGET, Math.hypot(x - j.x, y - j.y) * 1000); if (!res.dmg) continue;
    j.hp = (j.hp ?? UNIT_TARGET.hp) - Math.round(res.dmg);
    if (j.hp <= 0) {
      j.dead = true; S.stats.jamsLost = (S.stats.jamsLost || 0) + 1;
      // lo sabe quien lo opera; un jammer terrestre suele ser de la defensa (el atacante interfiere desde el aire)
      log('x', JAMMERS[j.type].short + ' queda destruido por la explosión de ' + T.short + ' a ' + Math.round(res.edge + UNIT_TARGET.radius) + ' m: deja de interferir.', 'def');
      event(JAMMERS[j.type].short + ' destruido por ' + T.short, 'jamLost:' + j.id);
    }
  }
}

/**
 * Daño funcional (docs/FISICA.md §10): cada unidad en tierra cerca de la caída (x, y) km pierde vida
 * como un objetivo UNIT_TARGET. A 0 queda destruida; al cruzar cada umbral de UNIT_COMP_AT pierde un
 * componente: el radar (alcance ×UNIT_DAMAGE.radarR, reacción ×UNIT_DAMAGE.react) o el lanzador (no
 * lanza). Si le quedan los dos, se sortea cuál (un número al azar solo en ese caso).
 */
export function damageUnits(T, x, y) {
  for (const u of S.units) {
    const d = D(u); if (!u.alive || d.kind === 'aew') continue;
    const res = damageAt(T, UNIT_TARGET, Math.hypot(x - u.x, y - u.y) * 1000); if (!res.dmg) continue;
    u.hp -= Math.round(res.dmg);
    if (u.hp <= 0) {
      u.alive = false; recUnit(u); S.stats.lost++; hooks.onUnitLost();
      log('x', uLabel(u) + ' queda destruida por la explosión de ' + T.short + ' a ' + Math.round(res.edge + UNIT_TARGET.radius) + ' m.', 'def');
      event(uLabel(u) + ' destruida por ' + T.short, 'lost:' + u.id);
      continue;
    }
    const frac = 1 - u.hp / UNIT_TARGET.hp;
    while ((u.dmgRadar ? 1 : 0) + (u.dmgLauncher ? 1 : 0) < UNIT_COMP_AT.filter(a => frac >= a).length) {
      const comps = [];
      if (d.radar && !u.dmgRadar) comps.push('radar');
      if (d.sam && !u.dmgLauncher) comps.push('launcher');
      if (!comps.length) break;
      const c = comps.length > 1 ? comps[rnd() < 0.5 ? 0 : 1] : comps[0];
      if (c === 'radar') { u.dmgRadar = true; log('w', uLabel(u) + ' dañada: el radar pierde alcance (×' + UNIT_DAMAGE.radarR + ') y reacciona más lento.', 'def'); }
      else { u.dmgLauncher = true; log('w', uLabel(u) + ' dañada: el lanzador queda fuera de servicio.', 'def'); }
      S.stats.unitsDamaged++; event(uLabel(u) + ' dañada por ' + T.short, 'dmgUnit:' + u.id + ':' + c); recUnit(u);
    }
  }
}
