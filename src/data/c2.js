// Niveles de integración del mando y control (C2) de la defensa aérea: cómo circula la información
// entre sensores y baterías de un mismo bando. Lo usa physics/engagement.js#trackOK y sim/engine.js.
//
//   share   'none'  cada batería usa solo su radar
//           'cue'   solo alerta: avisa que viene algo (con demora) y la batería arranca antes su
//                   tiempo de reacción, pero necesita su propia pista para disparar
//           'track' imagen común: misiles activos/IR y drones interceptores pueden disparar con
//                   pista ajena; los guiados por radar propio, no
//           'fire'  pista de calidad de tiro: también los guiados por radar pueden lanzar con pista
//                   ajena ("engage-on-remote") si su radar ve el punto de encuentro
//   lag     demora (s) desde la primera detección de la red hasta que la información llega
//   window  cuánto tiempo (s) sigue sirviendo una pista de red sin nuevas detecciones
//   deconf  true = una batería no le tira a un blanco que ya tiene interceptores de otra en vuelo
//
// "coordinada" y "desconectada" reproducen exactamente el viejo interruptor "red integrada"
// (encendido y apagado). Las demoras son estimaciones de juego (no hay datos públicos): ver
// docs/investigacion/mejoras-fisica.md §C.4 y la Academia, concepto "Mando y control".
export const C2_LEVELS = {
  desconectada: {
    name: 'Desconectada', share: 'none', lag: 0, window: 0, deconf: false,
    desc: 'Cada batería pelea sola con su radar. Nadie avisa ni reparte blancos: dos baterías pueden gastar misiles en el mismo blanco.'
  },
  descoordinada: {
    name: 'Descoordinada (solo alerta)', share: 'cue', lag: 45, window: 12, deconf: false,
    desc: 'Llegan alertas por voz o tableta con ~45 s de demora: la batería se prepara antes (arranca su tiempo de reacción), pero necesita su propia pista para disparar y no hay reparto de blancos.'
  },
  coordinada: {
    name: 'Coordinada (imagen común)', share: 'track', lag: 0, window: 12, deconf: true,
    desc: 'Imagen aérea común: los misiles activos o IR y los drones interceptores pueden disparar con la pista de otro sensor, y una batería no repite un blanco que otra ya está enfrentando.'
  },
  integrada: {
    name: 'Integrada (calidad de tiro)', share: 'fire', lag: 2, window: 12, deconf: true,
    desc: 'Pista compuesta de calidad de tiro (tipo IBCS o CEC): además, los sistemas guiados por radar pueden lanzar con la pista de otro sensor si su radar ve el punto de encuentro, y la alerta llega casi sin demora.'
  }
};

/** Nivel por defecto (el comportamiento histórico con "red integrada" encendida). */
export const C2_DEFAULT = 'coordinada';

/** Traduce el viejo interruptor booleano "red integrada" a un nivel de C2. */
export const c2FromNet = net => (net ? 'coordinada' : 'desconectada');
