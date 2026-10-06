// Observa candidatos sin modificar reacción, pistas, RNG ni reglas de coordinación.
// Las unidades admitidas aquí usan IR: el motor no les exige LOS de guiado radar adicional.
export function createWindowProbe({ S, D, eng, C2_LEVELS, UNIT_DAMAGE, speedAt, onFailure }) {
  const watched = { gb_refineria: ['RBS 70-1'], kv_energia: ['IRIS-T-1'] };
  const targetTypes = { gb_refineria: ['kalibr'], kv_energia: ['kh101'] };
  let output, seed, key, active;
  const outcomes = new WeakMap();
  const pending = new Set();

  function begin(scenario, runSeed) {
    key = scenario; seed = runSeed; active = new Map();
    output = { seed, units: {}, episodes: [] };
    for (const name of watched[key] ?? []) {
      const u = S.units.find(u => u.name === name);
      if (!u || D(u).sam.guid !== 'IR') throw Error('La sonda sólo verifica las configuraciones IR acordadas');
      output.units[name] = {};
    }
  }
  function count(unit, reason) {
    const c = output.units[unit]; c[reason] = (c[reason] || 0) + 1;
  }
  function endEpisode(pair) {
    const e = active.get(pair); if (e) output.episodes.push(e);
    active.delete(pair);
  }
  function observe() {
    if (S.t % 1 !== 0) return;
    const current = new Set();
    for (const name of watched[key] ?? []) {
      const u = S.units.find(u => u.name === name), sm = D(u).sam;
      const c2 = eng.unitC2(u, eng.effectiveC2(S.c2, S.objs, eng.cpOf(u))), L = C2_LEVELS[c2];
      for (const th of S.threats) {
        if (!th.alive || !th.p || !targetTypes[key].includes(th.type) || th.firstDet === null || Math.hypot(th.p.x - u.x, th.p.y - u.y) > sm.maxR + 120) continue;
        const pair = name + '/' + th.id;
        count(name, 'queries');
        let reason = 'ready';
        if (!u.alive || u.dmgLauncher) reason = 'unitUnavailable';
        else if (u.magLeft <= 0) reason = 'empty';
        else if (u.active >= sm.ch) reason = 'channels';
        else if (!eng.trackOK(u, th, S.t, c2, S.gateways)) reason = 'track';
        else {
          const av = u.avail[th.id] ?? eng.reactionStart(th, S.t, c2, u);
          if (S.t - av < sm.react * (u.dmgRadar ? UNIT_DAMAGE.react : 1)) reason = 'reaction';
          else {
            const ignore = u.decoyDoc === 'ignorar' ? true : u.decoyDoc === 'tirar' ? false : S.ignoreDecoys;
            const ks = eng.trackKeys?.(u, th, S.t, c2, S.gateways);
            const sol = ignore && th.clsAs === 'señuelo' ? null : eng.solve(u, th, S.t, S.fireRange ?? 1, ks);
            if (!sol) reason = 'noSolution';
            else if ((sol.v ?? speedAt(th, S.t + sol.tau)) > sm.vmaxT) reason = 'speed';
            else {
              const flying = (th.fly ?? []).filter(i => !i.done);
              if (flying.some(i => i.u === u)) reason = 'ownPending';
              else if (L.deconf && flying.some(i => eng.cpOf(i.u) === eng.cpOf(u))) reason = 'blockedOther';
              if (reason === 'blockedOther') {
                current.add(pair);
                const blockers = flying.filter(i => eng.cpOf(i.u) === eng.cpOf(u));
                let e = active.get(pair);
                const signature = blockers.map(i => `${i.u.name}/${i.tL}`).join(',');
                if (e && e.signature !== signature) { endEpisode(pair); e = null; }
                if (!e) {
                  e = { seed, unit: name, threat: th.type, n: th.n, wave: S.setup.salvos.findIndex(s => s.id === th.sv),
                    first: S.t, last: S.t, samples: 0, signature, blockers: [], predictedTau: sol.tau };
                  for (const it of blockers) {
                    const b = { unit: it.u.name, tL: it.tL, tH: it.tH, outcome: 'pending' };
                    e.blockers.push(b);
                    const records = outcomes.get(it) ?? []; records.push(b); outcomes.set(it, records); pending.add(it);
                  }
                  active.set(pair, e);
                }
                e.last = S.t; e.samples++;
              }
            }
          }
        }
        count(name, reason);
        if (reason !== 'blockedOther') endEpisode(pair);
      }
    }
    for (const pair of active.keys()) if (!current.has(pair)) endEpisode(pair);
    for (const it of pending) if (it.done) {
      for (const b of outcomes.get(it) ?? []) if (b.outcome === 'pending') b.outcome = 'other';
      pending.delete(it);
    }
  }
  function arrival(it, result) {
    for (const b of outcomes.get(it) ?? []) b.outcome = result;
    if (result === 'noReach') onFailure?.(it);
  }
  function finish() {
    for (const pair of active.keys()) endEpisode(pair);
    for (const it of pending) if (it.done) {
      for (const b of outcomes.get(it) ?? []) if (b.outcome === 'pending') b.outcome = 'other';
      pending.delete(it);
    }
    if (pending.size) throw Error('Quedaron interceptores de la sonda sin terminar');
    return output;
  }
  return { begin, observe, arrival, finish };
}
