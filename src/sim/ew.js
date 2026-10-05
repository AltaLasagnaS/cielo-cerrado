// @ts-check
// Guerra electrónica de la defensa durante la corrida: ubicar interferidores por triangulación y
// dispararles con misiles que se guían a su ruido (home-on-jam). Ver docs/FISICA.md §4.
import { D, JAMMERS, BANDS, C2_LEVELS } from '../data/index.js';
import { rnd } from '../util/rng.js';
import { azOf } from '../util/math.js';
import { jamJ, jamPos, antZ, drfmJ } from '../physics/radar.js';
import { STROBE_J, FIX_MAX_KM, bearingSigma, fixError } from '../physics/jamloc.js';
import { effectiveC2, unitC2 } from '../physics/engagement.js';
import { profileOf, timeTo } from '../physics/interceptor.js';
import { S } from './state.js';
import { log, uLabel } from './log.js';
import { recUnit } from './replay.js';

/** Cada cuánto (s) se recalculan las marcaciones y los disparos home-on-jam. */
export const EW_DT = 5;

/** Marcaciones de los radares de la defensa sobre el jammer j: [{ u, x, y, sigma, J }]. */
function strobes(j) {
  const JJ = JAMMERS[j.type], out = [];
  for (const u of S.units) {
    const r = D(u).radar; if (!u.alive || !r || r.band === 'ACU' || r.band === 'OPT') continue;
    if (JJ.side !== 'both' && D(u).side === JJ.side) continue;
    // un DRFM no mete ruido, pero emite cuando el haz lo ilumina: se lo marca por su copia (lóbulo principal)
    const p = jamPos(j), J = j.mode === 'drfm' ? (JJ.bands.includes(r.band) ? Math.max(0, drfmJ(u, j) ?? 0) : 0) : jamJ(u, azOf(p[0] - u.x, p[1] - u.y), [j]);
    if (J >= STROBE_J) out.push({ u, x: u.x, y: u.y, sigma: bearingSigma(BANDS[r.band].bw, J), J });
  }
  return out;
}

/** Un paso de guerra electrónica de la defensa (lo llama sim/engine.js#step). */
export function ewStep(t) {
  // llegan los misiles home-on-jam
  for (const h of S.hoj) {
    if (h.done || t < h.tH) continue;
    h.done = true; h.j.hojBusy = false; h.u.active = Math.max(0, h.u.active - 1);
    const sm = D(h.u).sam, JJ = JAMMERS[h.j.type];
    if (h.j.dead) continue;
    if (rnd() < sm.pkHoj) { h.j.dead = true; log('k', uLabel(h.u) + ' derriba al ' + JJ.short + ' guiándose a su ruido (home-on-jam) — Pk ' + Math.round(sm.pkHoj * 100) + '%.'); }
    else log('x', 'El misil home-on-jam de ' + uLabel(h.u) + ' falla contra el ' + JJ.short + '.');
  }
  if (t < S.ewNext) return; S.ewNext = t + EW_DT;
  const c2g = effectiveC2(S.c2, S.objs), inNet = s => C2_LEVELS[unitC2(s.u, c2g)].share !== 'none';
  for (const j of S.jamsLive) {
    const JJ = JAMMERS[j.type]; if (JJ.gnssJam || !j.on || j.dead) continue;
    const st = strobes(j); if (!st.length) continue;
    // triangulación: hace falta compartir marcaciones entre unidades (cualquier C2 menos "desconectada")
    const net = st.filter(inNet);
    if (net.length >= 2) {
      let best = Infinity, pair = null;
      for (let a = 0; a < net.length; a++) for (let b = a + 1; b < net.length; b++) { const e = fixError(net[a], net[b], j.x, j.y); if (e < best) { best = e; pair = [net[a].u, net[b].u]; } }
      if (best <= FIX_MAX_KM && (!j.fix || best < j.fix.err)) {
        if (!j.fix) log('l', JJ.short + ' ubicado por triangulación entre ' + uLabel(pair[0]) + ' y ' + uLabel(pair[1]) + ': error ≈ ' + best.toFixed(1) + ' km.');
        j.fix = { t, err: best };
      }
    }
    // home-on-jam: contra jammers aéreos ubicados, desde unidades cuyo radar oye ese ruido
    if (!JJ.air || !j.fix || j.hojBusy) continue;
    for (const s of st) {
      const u = s.u, sm = D(u).sam;
      if (!sm?.hoj || u.dmgLauncher || u.magLeft <= 0 || u.reloadUntil !== null) continue;
      const p = jamPos(j), d = Math.hypot(p[0] - u.x, p[1] - u.y, (p[2] - antZ(u)) / 1000);
      if (d > sm.maxR || p[2] > sm.altMax) continue;
      u.magLeft--; u.active++; recUnit(u); S.stats.shots++; S.stats.defCost += sm.cost;
      S.hoj.push({ u, j, tH: t + timeTo(profileOf(sm), d * 1000) });
      j.hojBusy = true;
      log('l', uLabel(u) + ' dispara un misil home-on-jam contra el ' + JJ.short + ' a ' + d.toFixed(0) + ' km.');
      break;
    }
  }
}
