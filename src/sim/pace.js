// Compresión de tiempo automática (estilo CMO): rápido cuando no pasa nada y lento cuando hay
// combate, para no perderse lo importante ni esperar minutos reales a que los drones crucen el mapa.

/** Velocidades de cada fase (× tiempo real) y su descripción. */
export const AUTO_PHASES = {
  calm: { speed: 60, text: 'calma' },
  approach: { speed: 30, text: 'amenazas en vuelo, sin detectar' },
  tracked: { speed: 15, text: 'pistas en seguimiento' },
  action: { speed: 5, text: 'combate' }
};

/** Segundos simulados antes de llegar al blanco en los que se considera "combate". */
export const ACTION_WINDOW = 90;

/** Fase según el estado de la corrida: 'calm' | 'approach' | 'tracked' | 'action'. */
export function autoPhase(S) {
  if (!S.started) return 'calm';
  if (S.ints.some(i => !i.done && S.t >= i.tL)) return 'action';
  const alive = S.threats.filter(t => t.alive && t.p);
  const eta = t => t.p.rem * 1000 / Math.max(1, t.T.vDive || t.T.vLow || t.T.v);
  if (alive.some(t => eta(t) < (t.firstDet !== null ? ACTION_WINDOW : ACTION_WINDOW / 2))) return 'action';
  if (alive.some(t => t.firstDet !== null)) return 'tracked';
  return alive.length ? 'approach' : 'calm';
}
