'use strict';
// ---------------- SIMULACIÓN ----------------
function log(cls, msg) { S.log.unshift({ t: S.t, cls, msg }); if (S.log.length > 300) S.log.pop(); logDirty = true; }
function label(th) { return (th.isDecoyChild ? 'Señuelo de ' : '') + th.T.short + ' #' + th.id; }
function uLabel(u) { return u.name || D(u).short; }

function startSim() {
  S.units = S.setup.defs.map(d => ({ ...d, alive: true, magLeft: d.mag, nextScan: rnd() * 2, avail: {}, active: 0, nextEval: 0 }));
  S.jamsLive = S.setup.jams.map(j => ({ ...j, _losMap: {} }));
  S.threats = []; S.ints = []; S.fx = []; S.impacts = []; S.stats = newStats(); S.log = [];
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
function resetSim() { S.running = false; S.started = false; S.t = 0; S.units = []; S.threats = []; S.ints = []; S.fx = []; S.impacts = []; S.stats = newStats(); S.log = []; logDirty = true; updatePlay(); schedCov(); renderSel(); }

const RADAR_GUID = ['TVM', 'SARH', 'mando', 'cañón'];
function step(dt) {
  const t0 = S.t, t = S.t + dt; S.t = t;
  // lanzamientos
  while (S.pending.length && S.pending[0].tLaunch <= t) {
    const th = S.pending.shift(); th.alive = true; S.threats.push(th);
    S.stats.launched++; if (th.isDecoy) S.stats.decoys++; S.stats.atkCost += th.T.cost;
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
        const dc = { ...th, fly: [], id: uid++, parent: th, isDecoy: true, isDecoyChild: true, decoyRel: 0, sRel: p.s, off: [Math.cos(ang) * dist, Math.sin(ang) * dist], det: {}, trail: [], lastNet: -1e9, firstDet: null, alive: true, targetUnit: null };
        S.threats.push(dc); S.stats.decoys++; S.stats.launched++;
      }
      log('w', label(th) + ' libera ' + th.decoyRel + ' señuelos a ' + p.rem.toFixed(0) + ' km del blanco.');
    }
    if (!th.gnssHit && th.T.gnss < 1) {
      for (const j of S.jamsLive) { const J = JAMMERS[j.type]; if (!J.gnssJam || !j.on) continue; if (Math.hypot(p.x - j.x, p.y - j.y) <= J.radius) { th.gnssHit = true; th.navErr = (1 - th.T.gnss) * (300 + rnd() * 1500); if (th.navErr > 150) log('w', label(th) + ' entra en zona anti-GNSS: error de navegación ≈' + Math.round(th.navErr) + ' m.'); break; } }
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
        const pd = rr < 0.8 * R ? 0.95 : 0.95 - (rr - 0.8 * R) / (0.2 * R) * 0.65;
        if (rnd() > pd) continue;
        ok = los(u.x, u.y, uz, p.x, p.y, p.z);
      }
      if (ok) {
        th.det[u.id] = t; th.lastNet = t;
        if (th.firstDet === null) { th.firstDet = t; log('l', 'Primera detección: ' + label(th) + ' por ' + uLabel(u) + ' a ' + Math.hypot(p.x - u.x, p.y - u.y).toFixed(1) + ' km, ' + Math.round(p.z - surf(p.x, p.y)) + ' m AGL.'); }
      }
    }
  }
  // enfrentamientos (cada 1 s simulado por unidad)
  for (const u of S.units) {
    if (!u.alive || !D(u).sam || u.magLeft <= 0) continue;
    if (t < u.nextEval) continue; u.nextEval = t + 1;
    engage(u, t);
  }
  // interceptores
  for (const it of S.ints) {
    if (it.done || t < it.tH) continue;
    it.done = true; const u = it.u; u.active = Math.max(0, u.active - 1);
    const th = it.th;
    if (!th.alive) { log('d', it.shot + ' de ' + uLabel(u) + ': blanco ya destruido, autodestrucción.'); continue; }
    const pk = calcPk(u, th, t);
    if (rnd() < pk) {
      th.alive = false; th.killed = true; S.stats.killed++; if (th.isDecoy) S.stats.decoysKilled++;
      if (th.isDecoy && th.decoyRel === 0 && th.isDecoyChild) {}
      const p = th.p || it; S.fx.push({ x: p.x, y: p.y, rt: performance.now(), c: '#6fd08c' });
      log('k', uLabel(u) + ' derriba ' + label(th) + (th.isDecoy ? ' (era señuelo)' : '') + ' — Pk ' + Math.round(pk * 100) + '%.');
    } else {
      log('x', it.shot + ' de ' + uLabel(u) + ' falla contra ' + label(th) + ' (Pk ' + Math.round(pk * 100) + '%).');
      S.fx.push({ x: it.px, y: it.py, rt: performance.now(), c: '#8a9aac' });
    }
  }
  if (S.ints.length > 400) S.ints = S.ints.filter(i => !i.done || t - i.tH < 3);
  // fin
  if (!S.pending.length && S.threats.every(th => !th.alive) && S.ints.every(i => i.done) && S.started) {
    if (S.running) { S.running = false; updatePlay(); const st = S.stats; log('d', `Fin: ${st.killed} derribos, ${st.hits} impactos en blanco, ${st.misses} fuera de blanco. Costo defensa ${money(st.defCost)} vs ataque ${money(st.atkCost)}.`); }
  }
}
function trackOK(u, th, t) {
  const d = D(u), own = d.radar ? (t - (th.det[u.id] ?? -1e9)) <= d.radar.scan * 2 + 0.6 : false;
  const netT = S.net && (t - th.lastNet) <= 12;
  if (RADAR_GUID.includes(d.sam.guid)) return own;
  if (d.sam.guid === 'operador') return netT;
  return own || netT;
}
function engage(u, t) {
  const d = D(u), sm = d.sam; const ch = sm.ch;
  if (u.active >= ch) return;
  const cand = [];
  for (const th of S.threats) {
    if (!th.alive || !th.p || th.firstDet === null) continue;
    const dh = Math.hypot(th.p.x - u.x, th.p.y - u.y);
    const maxR = (th.cls === 'balistico' || th.cls === 'hiper') ? sm.maxRtbm : sm.maxR; if (!maxR) continue;
    if (u.noDrones && th.cls === 'dron') continue;
    if (dh > maxR + 120) continue;
    if (!trackOK(u, th, t)) { delete u.avail[th.id]; continue; }
    if (u.avail[th.id] === undefined) u.avail[th.id] = t;
    if (t - u.avail[th.id] < sm.react) continue;
    // coordinación
    const flying = (th.fly || []).filter(i => !i.done);
    if (S.net ? flying.length : flying.some(i => i.u === u)) continue;
    cand.push([th, th.p.rem / Math.max(1, th.T.v) ]);
  }
  cand.sort((a, b) => a[1] - b[1]);
  for (const [th] of cand) {
    if (u.active >= ch || u.magLeft <= 0) break;
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
    log('l', uLabel(u) + ' dispara ' + n + '× ' + sm.shot + ' contra ' + (th.isDecoy && document.getElementById('defView').checked ? 'pista #' + th.id : label(th)) + ' — intercepción a ' + sol.r.toFixed(1) + ' km en ' + sol.tau.toFixed(0) + ' s.');
  }
}
function solve(u, th, t) {
  const sm = D(u).sam, tbm = th.cls === 'balistico' || th.cls === 'hiper';
  const maxR = tbm ? sm.maxRtbm : sm.maxR; const lz = surf(u.x, u.y) + 2;
  const tEnd = th.tLaunch + th.ft - 0.5;
  let tau = 0.5;
  while (t + tau < tEnd && tau < 400) {
    const p = posAt(th, t + tau); if (!p) break;
    const dh = Math.hypot(p.x - u.x, p.y - u.y), r = Math.hypot(dh, (p.z - lz) / 1000);
    const agl = p.z - surf(p.x, p.y);
    if (r <= maxR && r >= sm.minR && agl >= sm.altMin && p.z <= sm.altMax) {
      const tf = r * 1000 / sm.vInt;
      if (tf <= tau) return (tau - tf <= 3) ? { tau, p, r } : null;
    }
    tau += tau < 30 ? 0.5 : 2;
  }
  return null;
}
function calcPk(u, th, t) {
  const sm = D(u).sam; let pk = sm.pk[th.cls] || 0;
  const p = th.p; if (!p) return 0;
  if (th.maneuver && p.rem < termZone(th)) pk *= sm.guid === 'cañón' ? 0.85 : (th.T.manPk ?? 0.7);
  if (th.T.ir && (sm.guid === 'IR')) pk *= 0.85;
  if (th.T.lo && sm.guid !== 'IR' && sm.guid !== 'cañón') pk *= sm.guid === 'activo' ? 0.85 : 0.75;
  if (RADAR_GUID.includes(sm.guid) || sm.guid === 'activo') { const J = jamJ(u, azOf(p.x - u.x, p.y - u.y), S.jamsLive); if (J > 1) pk *= Math.max(0.5, 1 / (1 + 0.08 * J)); }
  const v = speedAt(th, t); if (v > 0.8 * sm.vmaxT) pk *= 0.8;
  return clamp(pk, 0, 0.98);
}
function impact(th) {
  th.alive = false; th.done = true;
  const tg = th.pts[th.pts.length - 1];
  let x = tg[0], y = tg[1];
  if (th.parent) { x += th.off[0]; y += th.off[1]; }
  const sig = (th.T.cep || 10) / 1.1774; const ang = rnd() * 6.28;
  const r = sig * Math.sqrt(-2 * Math.log(1 - rnd() * 0.999)) + th.navErr;
  x += Math.cos(ang) * r / 1000; y += Math.sin(ang) * r / 1000;
  if (th.isDecoy) { S.impacts.push({ x, y, k: 'decoy' }); log('d', label(th) + ' cae sin efecto.'); return; }
  const hit = r <= (th.T.hitR || (th.cls === 'dron' ? 20 : 50));
  if (hit) {
    S.stats.hits++; S.impacts.push({ x, y, k: 'hit' });
    S.fx.push({ x, y, rt: performance.now(), c: '#ff5b4d', big: true });
    let msg = label(th) + ' impacta en el blanco';
    if (th.targetUnit) { const u = S.units.find(v => v.id === th.targetUnit && v.alive); if (u) { u.alive = false; S.stats.lost++; msg += ' y destruye ' + uLabel(u); schedCov(); } }
    log('x', msg + '.');
  } else {
    S.stats.misses++; S.impacts.push({ x, y, k: 'miss' });
    log('w', label(th) + ' cae a ' + Math.round(r) + ' m del blanco' + (th.navErr > 150 ? ' (desviado por interferencia GNSS)' : '') + '.');
  }
}
