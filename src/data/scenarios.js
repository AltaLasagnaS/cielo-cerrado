// Escenarios incluidos. Son datos puros: sim/setup.js#applyScenario los despliega en este orden:
// primero las defensas, después las salvas y al final los interferidores (el orden define los ids).
//
// Coordenadas en km desde la esquina noroeste del mapa (x hacia el este, y hacia el sur).
// Defensa:  { type, x, y, name?, az? }                 (type = clave de DEFENSES)
// Salva:    { type, count, interval, tStart?, sync?, tArrive?, agl?, launchDist?, maneuver?, decoys?,
//             pts: [[x, y], ...] (el último punto es el blanco), targetUnit?: nombre de una defensa }
// Jammer:   { type, x, y, alt? }                         (type = clave de JAMMERS)

export const SCENARIOS = {
  mb_noche: {
    map: 'monterey', name: 'Monterey · noche de ataque combinado (defensa ucraniana)',
    defs: [
      { type: 'ewr', x: 85.4, y: 53.2, name: 'Radar 3D (cerro Gabilan)' },
      { type: 'p18', x: 70, y: 40, name: 'Radar VHF' },
      { type: 'patriot', x: 58, y: 58, az: 320, name: 'Patriot-1' },
      { type: 'irist', x: 44, y: 67, name: 'IRIS-T-1' },
      { type: 'nasams', x: 56, y: 62, name: 'NASAMS-1' },
      { type: 'gepard', x: 40, y: 62, name: 'Gepard-1' },
      { type: 'gepard', x: 64, y: 57, name: 'Gepard-2' },
      { type: 'mfg', x: 52, y: 47, name: 'Grupo móvil 1' },
      { type: 'mfg', x: 66, y: 62, name: 'Grupo móvil 2' },
      { type: 'mfg', x: 47, y: 64, name: 'Grupo móvil 3' },
      { type: 'acoustic', x: 50, y: 50, name: 'Acústico 1' },
      { type: 'acoustic', x: 60, y: 52, name: 'Acústico 2' },
      { type: 'acoustic', x: 44, y: 61, name: 'Acústico 3' },
      { type: 'intdrone', x: 60, y: 54, name: 'Interceptores-1' }
    ],
    salvos: [
      { type: 'shahed', count: 14, interval: 25, tStart: 0, agl: 800, pts: [[2, 28], [34, 44], [63.5, 55.8]] },
      { type: 'gerbera', count: 8, interval: 30, tStart: 60, agl: 900, pts: [[2, 36], [36, 50], [62, 56]] },
      { type: 'shahed', count: 6, interval: 40, tStart: 200, agl: 2200, pts: [[88, 108], [70, 70], [63.5, 55.8]] },
      { type: 'kh101', count: 4, interval: 15, sync: true, tArrive: 1500, agl: 40, pts: [[88, 110], [80, 85], [73, 70], [63.5, 55.8]] },
      { type: 'kalibr', count: 3, interval: 10, sync: true, tArrive: 1480, agl: 25, pts: [[0, 75], [30, 70], [42.2, 64.3]] },
      { type: 'isk_m', count: 2, interval: 20, sync: true, tArrive: 1530, launchDist: 300, maneuver: true, decoys: true, pts: [[60, 0], [58.2, 58]], targetUnit: 'Patriot-1' }
    ],
    jams: [
      { type: 'soj', x: 4, y: 18, alt: 8000 }
    ]
  },
  gb_ruso: {
    map: 'goteborg', name: 'Gotemburgo · ataque ucraniano contra base con defensa rusa',
    defs: [
      { type: 's400', x: 52, y: 28, az: 240, name: 'S-400' },
      { type: 'pantsir', x: 54, y: 30, name: 'Pantsir-1' },
      { type: 'pantsir', x: 55, y: 22, name: 'Pantsir-2' },
      { type: 'tor', x: 56, y: 38, name: 'Tor-M2' },
      { type: 'buk', x: 48, y: 20, name: 'Buk-M1' },
      { type: 'p18', x: 58, y: 14, name: 'Radar VHF' }
    ],
    salvos: [
      { type: 'storm', count: 6, interval: 6, sync: true, tArrive: 1480, agl: 35, pts: [[0, 60], [30, 46], [44, 38], [57.8, 32.5]] },
      { type: 'neptune', count: 2, interval: 10, sync: true, tArrive: 1485, agl: 12, pts: [[0, 20], [36, 30], [52.5, 28]], targetUnit: 'S-400' },
      { type: 'lyutyi', count: 16, interval: 6, sync: true, tArrive: 1440, agl: 200, pts: [[40, 110.8], [50, 70], [57.8, 32.5]] },
      { type: 'atacms', count: 4, interval: 6, sync: true, tArrive: 1490, launchDist: 220, pts: [[40, 111], [52.2, 28]], targetUnit: 'S-400' }
    ],
    jams: [
      { type: 'gnss', x: 56, y: 30 }
    ]
  },
  mb_vacio: { map: 'monterey', name: 'Monterey · vacío', defs: [], salvos: [], jams: [] },
  gb_vacio: { map: 'goteborg', name: 'Gotemburgo · vacío', defs: [], salvos: [], jams: [] }
};
