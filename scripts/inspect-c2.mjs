// Diagnósticos sintéticos del modelo actual; no son criterios de corrección física.
// node scripts/inspect-c2.mjs
import { useMap, clearSetup, runCurrent } from '../tests/helpers.js';
import { addDef, addSalvo } from '../src/sim/setup.js';
import { S } from '../src/sim/state.js';
import { startSim, step } from '../src/sim/engine.js';
import { reactionStart, trackOK, effectiveC2 } from '../src/physics/engagement.js';
import { setRandom, seeded } from '../src/util/rng.js';

function disconnectedBatteries(c2) {
  useMap('monterey', { flat: true }); clearSetup(); S.c2 = c2;
  addDef('nasams', 50, 50, { name: 'A', link: false });
  addDef('nasams', 50, 50, { name: 'B', link: false });
  addSalvo({ type: 'shahed', count: 1, agl: 300, pts: [[10, 50], [50, 50]] });
  runCurrent(5);
  return { c2, seed: 5, shots: S.stats.shots };
}

function guidanceAfterLoss(destroy) {
  useMap('monterey', { flat: true }); clearSetup();
  addDef('s300', 50, 50, { name: 'S', az: 180 });
  addDef('ewr', 50, 52, { name: 'R' });
  addSalvo({ type: 'kh22', count: 1, pts: [[50, 110], [50, 52]] });
  let destroyedAt = null, complete = false;
  setRandom(seeded(4));
  try {
    startSim();
    for (let n = 0; n < 40000; n++) {
      step(0.25);
      const missile = S.ints.find(i => !i.done);
      if (destroy && destroyedAt === null && missile) {
        missile.u.alive = false; destroyedAt = S.t;
      }
      if (!S.pending.length && S.threats.every(t => !t.alive) && S.ints.every(i => i.done)) { complete = true; break; }
    }
    if (!complete) throw new Error('El diagnóstico de guía no terminó.');
    return { seed: 4, shots: S.stats.shots, killed: S.stats.killed, destroyedAt };
  } finally { setRandom(null); }
}

console.log(JSON.stringify({
  batteriesWithLinkOff: ['coordinada', 'desconectada'].map(disconnectedBatteries),
  guidance: { control: guidanceAfterLoss(false), destroyedAfterLaunch: guidanceAfterLoss(true) },
  staleWarningReactionStart: reactionStart({ netFirst: 0, lastNet: 0 }, 1000, 'descoordinada', { link: true }),
  immediateNetworkUpdateAccepted: trackOK({ id: 1, type: 'irist', link: true }, { det: {}, netFirst: 0, lastNet: 100 }, 100, 'integrada'),
  distantCommsLoss: effectiveC2('integrada', [{ type: 'comms', status: 'destroyed', x: 10000, y: 10000 }])
}, null, 2));
