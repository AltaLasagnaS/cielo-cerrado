// ---------------- SIMULACIÓN ----------------
// Bucle de paso fijo: la interfaz llama a step(dt) con dt ≤ 0,25 s de tiempo simulado.
// Cada paso: lanzamientos → movimiento/señuelos/GNSS → barridos de sensores → decisiones de tiro
// → resolución de interceptores → fin de corrida. Ver docs/ARQUITECTURA.md.
import { D, JAMMERS, TARGET_STATUS } from '../data/index.js';
import { money } from '../util/format.js';
import { nextId } from '../util/ids.js';
import { rnd } from '../util/rng.js';
import { surf, los } from '../physics/terrain.js';
import { antZ, detR, inSector, jamJ } from '../physics/radar.js';
import { buildThreat, posAt, speedAt } from '../physics/kinematics.js';
import { RADAR_GUID, isTBM, trackOK, solve, calcPk } from '../physics/engagement.js';
import { damageAt, targetStatus } from '../physics/damage.js';
import { azOf } from '../util/math.js';
import { S, newStats } from './state.js';
import { hooks } from './hooks.js';
import { log, event, label, uLabel } from './log.js';

/** Arma la corrida a partir de S.setup: copia unidades y jammers y programa todos los lanzamientos. */
export function startSim() {
  S.units = S.setup.defs.map(d => ({ ...d, alive: true, magLeft: d.mag, nextScan: rnd() * 2, avail: {}, active: 0, nextEval: 0 }));
  S.jamsLive = S.setup.jams.map(j => ({ ...j, _losMap: {} }));
  S.objs = S.setup.objs.map(g => ({ ...g, hp: g.maxHp, status: 'operational', hits: 0, dmgBy: {} }));
  S.threats = []; S.ints = []; S.fx = []; S.impacts = []; S.stats = newStats(); S.log = []; S.events = []; S.arrivals = [];
  S.pending = [];
  for (const sv of S.setup.salvos) {
    let t0 = sv.tStart || 0;
    if (sv.sync) { const probe = buildThreat(sv, 0, 0); t0 = Math.max(0, (sv.tArrive || 0) - probe.ft); }
    for (let k = 0; k < sv.count; k++) S.pending.push(buildThreat(sv, k, t0 + k * (sv.interval || 0)));
  }
  S.pending.sort((a, b) => a.tLaunch - b.tLaunch);
  S.t = 0; S.started = true;
  log('d', 'Inicio de la simulación: ' + S.pending.length + ' amenazas programadas, ' + S.units.length + ' unidades de defensa.');
}

/** Vuelve al modo edición: descarta la corrida (el setup queda intacto). */
export function resetState() { S.autoPhase = 'calm'; S.running = false; S.started = false; S.t = 0; S.units = []; S.jamsLive = []; S.objs = []; S.events = []; S.arrivals = []; S.pending = []; S.threats = []; S.ints = []; S.fx = []; S.impacts = []; S.stats = newStats(); S.log = []; }

/** Avanza la simulación dt segundos. */
export function step(dt) {
  const t = S.t + dt; S.t = t;
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
    th.p = p;
    if (!th.trail.length || t - th.trail[th.trail.length - 1][2] > 3) { th.trail.push([p.x, p.y, t]); if (th.trail.length > 80) th.trail.shift(); }
    if (th.decoyRel && !th.released && p.rem < 40) {
      th.released = true;
      for (let k = 0; k < th.decoyRel; k++) {
        const ang = rnd() * 6.28, dist = 1 + rnd() * 2.5;
        const dc = { ...th, fly: [], id: nextId(), parent: th, isDecoy: true, isDecoyChild: true, decoyRel: 0, sRel: p.s, off: [Math.cos(ang) * dist, Math.sin(ang) * dist], det: {}, trail: [], lastNet: -1e9, firstDet: null, alive: true, targetUnit: null };
        S.threats.push(dc); S.stats.decoys++; S.stats.launched++;
      }
      log('w', label(th) + ' libera ' + th.decoyRel + ' señuelos a ' + p.rem.toFixed(0) + ' km del blanco.');
      event(label(th) + ' libera señuelos', 'decoys');
    }
    if (!th.gnssHit && th.T.gnss < 1) {
      for (const j of S.jamsLive) { const J = JAMMERS[j.type]; if (!J.gnssJam || !j.on) continue; if (Math.hypot(p.x - j.x, p.y - j.y) <= J.radius) { th.gnssHit = true; th.navErr = (1 - th.T.gnss) * (J.spoofKm ? J.spoofKm * 1000 * (0.5 + rnd()) : 300 + rnd() * 1500); if (th.navErr > 150) { log('w', label(th) + (J.spoofKm ? ' es engañada por ' + J.short + ' (spoofing GNSS): desvío ≈' + (th.navErr / 1000).toFixed(1) + ' km.' : ' entra en zona anti-GNSS: error de navegación ≈' + Math.round(th.navErr) + ' m.')); event('Primera arma desviada por interferencia GNSS', 'gnss'); } break; } }
    }
  }
  // sensores
  for (const u of S.units) {
    if (!u.alive) continue; const d = D(u); if (!d.radar) continue;
    if (t < u.nextScan) continue; u.nextScan = t + d.radar.scan;
    const r = d.radar, uz = antZ(u);
    for (const th of S.threats) {
      if (!th.alive || !th.p) continue; const p = th.p;
      const dx = p.x - u.x, dy = p.y - u.y, dh = Math.hypot(dx, dy);
      let ok = false;
      if (r.band === 'ACU') { ok = th.cls === 'dron' && dh <= r.R1 && (p.z - surf(p.x, p.y)) <= (r.altMax || 3000); }
      else {
        const az = azOf(dx, dy); if (!inSector(u, az)) continue;
        const rr = Math.hypot(dh, (p.z - uz) / 1000);
        if (rr > r.R1 * 1.2) continue;
        const J = jamJ(u, az, S.jamsLive); const R = detR(u, th, J);
        if (rr > R) continue;
        // probabilidad de detección por barrido: 95% hasta el 80% del alcance, cae a 30% en el límite
        const pd = rr < 0.8 * R ? 0.95 : 0.95 - (rr - 0.8 * R) / (0.2 * R) * 0.65;
        if (rnd() > pd) continue;
        ok = los(u.x, u.y, uz, p.x, p.y, p.z);
      }
      if (ok) {
        th.det[u.id] = t; th.lastNet = t;
        if (th.firstDet === null) { th.firstDet = t; th.detKm = p.rem; log('l', 'Primera detección: ' + label(th) + ' por ' + uLabel(u) + ' a ' + Math.hypot(p.x - u.x, p.y - u.y).toFixed(1) + ' km, ' + Math.round(p.z - surf(p.x, p.y)) + ' m AGL.'); event('Primera detección: ' + label(th) + ' por ' + uLabel(u), 'firstDet'); }
      }
    }
  }
  // enfrentamientos (cada 1 s simulado por unidad)
  for (const u of S.units) {
    if (!u.alive || !D(u).sam || u.magLeft <= 0) continue;
    if (t < u.nextEval) continue; u.nextEval = t + 1;
    engage(u, t);
  }
  // interceptores que llegan al punto de encuentro
  for (const it of S.ints) {
    if (it.done || t < it.tH) continue;
    it.done = true; const u = it.u; u.active = Math.max(0, u.active - 1);
    const th = it.th;
    if (!th.alive) { log('d', it.shot + ' de ' + uLabel(u) + ': blanco ya destruido, autodestrucción.'); continue; }
    const pk = calcPk(u, th, t, S.jamsLive);
    if (rnd() < pk) {
      th.alive = false; th.killed = true; S.stats.killed++; if (th.isDecoy) S.stats.decoysKilled++;
      const p = th.p || it; S.fx.push({ x: p.x, y: p.y, rt: performance.now(), c: '#6fd08c' });
      log('k', uLabel(u) + ' derriba ' + label(th) + (th.isDecoy ? ' (era señuelo)' : '') + ' — Pk ' + Math.round(pk * 100) + '%.');
      event('Primer derribo: ' + uLabel(u) + ' derriba ' + label(th), 'firstKill');
    } else {
      log('x', it.shot + ' de ' + uLabel(u) + ' falla contra ' + label(th) + ' (Pk ' + Math.round(pk * 100) + '%).');
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
 * Decisión de tiro de la unidad u: arma la lista de blancos con pista, fuera del tiempo de reacción
 * y no enfrentados por otra batería (con red) o por ella misma (sin red), los ordena por tiempo
 * restante hasta el blanco y dispara mientras tenga canales y munición.
 */
export function engage(u, t) {
  const d = D(u), sm = d.sam; const ch = sm.ch;
  if (u.active >= ch) return;
  const cand = [];
  for (const th of S.threats) {
    if (!th.alive || !th.p || th.firstDet === null) continue;
    const dh = Math.hypot(th.p.x - u.x, th.p.y - u.y);
    const maxR = isTBM(th) ? sm.maxRtbm : sm.maxR; if (!maxR) continue;
    if (u.noDrones && th.cls === 'dron') continue;
    if (dh > maxR + 120) continue;
    if (!trackOK(u, th, t, S.net)) { delete u.avail[th.id]; continue; }
    if (u.avail[th.id] === undefined) u.avail[th.id] = t;
    if (t - u.avail[th.id] < sm.react) continue;
    // coordinación
    const flying = (th.fly || []).filter(i => !i.done);
    if (S.net ? flying.length : flying.some(i => i.u === u)) continue;
    cand.push([th, th.p.rem / Math.max(1, th.T.v)]);
  }
  cand.sort((a, b) => a[1] - b[1]);
  for (const [th] of cand) {
    if (u.active >= ch || u.magLeft <= 0) { const k = uLabel(u), sat = u.magLeft <= 0 ? S.stats.satMag : S.stats.satChannels; sat[k] = (sat[k] || 0) + 1; break; }
    const sol = solve(u, th, t); if (!sol) continue;
    const v = speedAt(th, t + sol.tau); if (v > sm.vmaxT) continue;
    if (RADAR_GUID.includes(sm.guid) && sm.guid !== 'cañón' && !los(u.x, u.y, antZ(u), sol.p.x, sol.p.y, sol.p.z)) continue;
    const n = Math.min(S.doctrine === 'salva' ? (u.salvo || sm.salvo) : 1, u.magLeft, ch - u.active);
    for (let k = 0; k < n; k++) {
      const it = { u, th, x0: u.x, y0: u.y, px: sol.p.x, py: sol.p.y, tL: t + k * 0.6, tH: t + sol.tau + k * 0.6, shot: sm.shot, done: false };
      S.ints.push(it); (th.fly = th.fly || []).push(it);
      u.magLeft--; u.active++; S.stats.shots++; S.stats.defCost += sm.cost;
      S.stats.byUnit[uLabel(u)] = (S.stats.byUnit[uLabel(u)] || 0) + 1;
    }
    event('Primer interceptor lanzado: ' + uLabel(u) + ' contra ' + label(th), 'firstShot');
    if (u.magLeft === 0) { log('w', uLabel(u) + ' se queda sin munición.'); event(uLabel(u) + ' se queda sin munición', 'empty:' + u.id); }
    log('l', uLabel(u) + ' dispara ' + n + '× ' + sm.shot + ' contra ' + (th.isDecoy && hooks.defenderView() ? 'pista #' + th.id : label(th)) + ' — intercepción a ' + sol.r.toFixed(1) + ' km en ' + sol.tau.toFixed(0) + ' s.');
  }
}

/**
 * Llegada al blanco: punto de caída con dispersión circular normal (CEP → σ = CEP / 1,1774) más el
 * error de navegación por interferencia GNSS. Cuenta como impacto en el blanco si cae a menos de
 * 20 m (drones) o 50 m (misiles) del punto apuntado. Además, cada objetivo cercano recibe daño
 * según la distancia y la ojiva (physics/damage.js), haya sido "impacto" o no.
 */
export function impact(th) {
  th.alive = false; th.done = true;
  const tg = th.pts[th.pts.length - 1];
  let x = tg[0], y = tg[1];
  if (th.parent) { x += th.off[0]; y += th.off[1]; }
  const sig = (th.T.cep || 10) / 1.1774; const ang = rnd() * 6.28;
  const r = sig * Math.sqrt(-2 * Math.log(1 - rnd() * 0.999)) + th.navErr;
  x += Math.cos(ang) * r / 1000; y += Math.sin(ang) * r / 1000;
  if (th.isDecoy) { S.impacts.push({ x, y, k: 'decoy' }); log('d', label(th) + ' cae sin efecto.'); return; }
  const hit = r <= (th.T.hitR || (th.cls === 'dron' ? 20 : 50));
  const dmg = applyDamage(th, x, y), total = dmg.reduce((a, d) => a + d.dmg, 0);
  S.stats.missSum += r; S.stats.missN++;
  S.arrivals.push({ t: S.t, id: th.id, type: th.type, name: label(th), cls: th.cls, det: th.firstDet, detKm: th.detKm ?? null, shots: (th.fly || []).length, miss: r, hit, dmg: total, nav: th.navErr, target: dmg[0]?.g.name ?? null });
  const dtxt = dmg.map(d => ` · −${d.dmg} HP a ${d.g.name} (${Math.max(0, d.g.hp)}/${d.g.maxHp})`).join('');
  if (hit) {
    S.stats.hits++; S.impacts.push({ x, y, k: 'hit' });
    S.fx.push({ x, y, rt: performance.now(), c: '#ff5b4d', big: true });
    let msg = label(th) + ' impacta en el blanco';
    if (th.targetUnit) { const u = S.units.find(v => v.id === th.targetUnit && v.alive); if (u) { u.alive = false; S.stats.lost++; msg += ' y destruye ' + uLabel(u); hooks.onUnitLost(); event(uLabel(u) + ' destruida por ' + label(th), 'lost:' + u.id); } }
    log('x', msg + dtxt + '.');
  } else {
    S.stats.misses++; S.impacts.push({ x, y, k: 'miss' });
    log('w', label(th) + ' cae a ' + Math.round(r) + ' m del blanco' + (th.navErr > 150 ? ' (desviado por interferencia GNSS)' : '') + dtxt + '.');
  }
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
    g.hp -= dmg; g.hits++; g.dmgBy[th.T.short] = (g.dmgBy[th.T.short] || 0) + dmg; g.status = targetStatus(g.hp, g.maxHp);
    S.stats.damage += dmg; S.stats.dmgByWeapon[th.T.short] = (S.stats.dmgByWeapon[th.T.short] || 0) + dmg;
    out.push({ g, dmg, dist, before });
  }
  return out;
}
