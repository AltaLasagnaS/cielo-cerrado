// Escenarios incluidos. Son datos puros: sim/setup.js#applyScenario los despliega en este orden:
// objetivos, defensas, salvas e interferidores (el orden define los ids).
//
// Coordenadas en km desde la esquina noroeste del mapa (x hacia el este, y hacia el sur).
// Objetivo: { type, name, short?, x, y, hp?, desc? }       (type = clave de TARGET_TYPES; short = etiqueta del mapa)
// Defensa:  { type, x, y, name?, az? }                      (type = clave de DEFENSES)
// Salva:    { type, count, interval, tStart?, sync?, tArrive?, agl?, launchDist?, maneuver?, decoys?,
//             pts: [[x, y], ...] (el último punto es el blanco),
//             targetObj?: nombre de un objetivo | targetUnit?: nombre de una defensa }
// Jammer:   { type, x, y, alt? }                            (type = clave de JAMMERS)
//
// Metas (goals): { side: 'ataque'|'defensa', primary, kind, target, min?, text }
//   kind: destroy (objetivo destruido) · damage (daño ≥ min, por defecto 20%) ·
//         protect (objetivo operativo) · survive (objetivo no destruido) ·
//         killUnit (defensa destruida) · keepUnit (defensa sobrevive)
// rules: opciones del motor que el escenario fija al cargarse (S.net, S.doctrine).

export const SCENARIOS = {
  mb_noche: {
    map: 'monterey', name: 'Monterey · noche de ataque combinado (defensa ucraniana)',
    player: 'defensa',
    time: '02:40 hora local · noche',
    description: 'Una oleada combinada al estilo de las que sufre Ucrania: drones Shahed y señuelos Gerbera abren el ataque para saturar la defensa y gastar munición; detrás llegan misiles de crucero rasantes y dos Iskander-M con maniobra terminal y señuelos contra la batería Patriot. El blanco principal es el depósito de combustible de Salinas.',
    forces: {
      defensa: 'Defensa por capas: radar 3D y VHF de alerta, Patriot (sector orientado al noroeste), IRIS-T, NASAMS, dos Gepard, grupos móviles, red acústica y drones interceptores. Red de mando integrada.',
      ataque: '20 Shahed, 8 Gerbera, 4 Kh-101, 3 Kalibr y 2 Iskander-M. Un avión de interferencia stand-off acompaña desde el noroeste.'
    },
    conditions: 'Noche despejada. El motor no modela clima ni luz: la noche solo explica por qué los grupos móviles dependen de la alerta acústica.',
    rules: { net: true, doctrine: 'salva' },
    rulesText: ['Red integrada activa y doctrina de salva.', 'No hay recarga: cada unidad cuenta solo con la munición inicial.', 'Los Kh-101, Kalibr e Iskander están sincronizados para llegar casi juntos (T+24:40 a T+25:30).'],
    objectives: [
      { type: 'fuel', name: 'Depósito de combustible Salinas', short: 'Combustible Salinas', x: 63.5, y: 55.8, desc: 'Abastece a la región: es el blanco principal del ataque.' },
      { type: 'infra', name: 'Puerto de Monterey', short: 'Puerto Monterey', x: 42.2, y: 64.3, desc: 'Terminal portuaria, blanco de los Kalibr lanzados desde el mar.' },
      { type: 'airbase', name: 'Aeródromo de Marina', short: 'Aeródromo Marina', x: 51.5, y: 55.5, desc: 'Base de la aviación de defensa. No está atacada al comienzo: protegela si agregás ataques.' }
    ],
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
      { type: 'shahed', count: 14, interval: 25, tStart: 0, agl: 800, pts: [[2, 28], [34, 44], [63.5, 55.8]], targetObj: 'Depósito de combustible Salinas' },
      { type: 'gerbera', count: 8, interval: 30, tStart: 60, agl: 900, pts: [[2, 36], [36, 50], [62, 56]] },
      { type: 'shahed', count: 6, interval: 40, tStart: 200, agl: 2200, pts: [[88, 108], [70, 70], [63.5, 55.8]], targetObj: 'Depósito de combustible Salinas' },
      { type: 'kh101', count: 4, interval: 15, sync: true, tArrive: 1500, agl: 40, pts: [[88, 110], [80, 85], [73, 70], [63.5, 55.8]], targetObj: 'Depósito de combustible Salinas' },
      { type: 'kalibr', count: 3, interval: 10, sync: true, tArrive: 1480, agl: 25, pts: [[0, 75], [30, 70], [42.2, 64.3]], targetObj: 'Puerto de Monterey' },
      { type: 'isk_m', count: 2, interval: 20, sync: true, tArrive: 1530, launchDist: 300, maneuver: true, decoys: true, pts: [[60, 0], [58.2, 58]], targetUnit: 'Patriot-1' }
    ],
    jams: [
      { type: 'soj', x: 4, y: 18, alt: 8000 }
    ],
    goals: [
      { side: 'ataque', primary: true, kind: 'destroy', target: 'Depósito de combustible Salinas', text: 'Destruir el depósito de combustible de Salinas' },
      { side: 'ataque', primary: false, kind: 'damage', target: 'Puerto de Monterey', min: 0.3, text: 'Degradar el puerto de Monterey (≥ 30% de daño)' },
      { side: 'ataque', primary: false, kind: 'killUnit', target: 'Patriot-1', text: 'Destruir la batería Patriot-1' },
      { side: 'defensa', primary: true, kind: 'survive', target: 'Depósito de combustible Salinas', text: 'Que el depósito de combustible no sea destruido' },
      { side: 'defensa', primary: false, kind: 'keepUnit', target: 'Patriot-1', text: 'Conservar la batería Patriot-1' },
      { side: 'defensa', primary: false, kind: 'protect', target: 'Aeródromo de Marina', text: 'Mantener operativo el aeródromo de Marina' }
    ],
    success: 'Defensa: el depósito sigue en pie al terminar la oleada.',
    failure: 'Defensa: el depósito de combustible queda destruido.'
  },
  gb_ruso: {
    map: 'goteborg', name: 'Gotemburgo · ataque ucraniano contra base con defensa rusa',
    player: 'ataque',
    time: '04:15 hora local · antes del amanecer',
    description: 'Ataque de largo alcance contra una base defendida por una batería S-400 y defensas de punto. Storm Shadow y drones Liutyi van contra el depósito de munición; Neptune y ATACMS buscan destruir la S-400. Un supresor GNSS ruso protege la base.',
    forces: {
      defensa: 'S-400 (sector hacia el sudoeste), dos Pantsir, Tor-M2, Buk-M1 y un radar VHF de alerta.',
      ataque: '6 Storm Shadow, 16 Liutyi, 2 Neptune y 4 ATACMS lanzados desde 220 km, todo sincronizado para llegar en menos de un minuto.'
    },
    conditions: 'Despejado. El motor no modela clima ni luz.',
    rules: { net: true, doctrine: 'salva' },
    rulesText: ['Red integrada activa y doctrina de salva para la defensa rusa.', 'El supresor GNSS desvía a las armas que dependen del satélite (los ATACMS y los Liutyi son los más sensibles).', 'Llegada sincronizada entre T+24:00 y T+24:50 para saturar canales de tiro.'],
    objectives: [
      { type: 'ammo', name: 'Depósito de munición', short: 'Depósito munición', x: 57.8, y: 32.5, desc: 'Arsenal de la base: blanco principal.' },
      { type: 'airbase', name: 'Base aérea de Säve', short: 'Base Säve', x: 52, y: 25, desc: 'Aeródromo cercano: objetivo secundario si querés agregar ataques.' }
    ],
    defs: [
      { type: 's400', x: 52, y: 28, az: 240, name: 'S-400' },
      { type: 'pantsir', x: 54, y: 30, name: 'Pantsir-1' },
      { type: 'pantsir', x: 55, y: 22, name: 'Pantsir-2' },
      { type: 'tor', x: 56, y: 38, name: 'Tor-M2' },
      { type: 'buk', x: 48, y: 20, name: 'Buk-M1' },
      { type: 'p18', x: 58, y: 14, name: 'Radar VHF' }
    ],
    salvos: [
      { type: 'storm', count: 6, interval: 6, sync: true, tArrive: 1480, agl: 35, pts: [[0, 60], [30, 46], [44, 38], [57.8, 32.5]], targetObj: 'Depósito de munición' },
      { type: 'neptune', count: 2, interval: 10, sync: true, tArrive: 1485, agl: 12, pts: [[0, 20], [36, 30], [52.5, 28]], targetUnit: 'S-400' },
      { type: 'lyutyi', count: 16, interval: 6, sync: true, tArrive: 1440, agl: 200, pts: [[40, 110.8], [50, 70], [57.8, 32.5]], targetObj: 'Depósito de munición' },
      { type: 'atacms', count: 4, interval: 6, sync: true, tArrive: 1490, launchDist: 220, pts: [[40, 111], [52.2, 28]], targetUnit: 'S-400' }
    ],
    jams: [
      { type: 'gnss', x: 56, y: 30 }
    ],
    goals: [
      { side: 'ataque', primary: true, kind: 'destroy', target: 'Depósito de munición', text: 'Destruir el depósito de munición' },
      { side: 'ataque', primary: false, kind: 'killUnit', target: 'S-400', text: 'Destruir la batería S-400' },
      { side: 'ataque', primary: false, kind: 'damage', target: 'Base aérea de Säve', min: 0.3, text: 'Degradar la base aérea de Säve (≥ 30% de daño)' },
      { side: 'defensa', primary: true, kind: 'survive', target: 'Depósito de munición', text: 'Que el depósito de munición no sea destruido' },
      { side: 'defensa', primary: true, kind: 'keepUnit', target: 'S-400', text: 'Conservar la batería S-400' }
    ],
    success: 'Ataque: el depósito de munición queda destruido.',
    failure: 'Ataque: el depósito sigue en pie al terminar la oleada.'
  },
  mb_vacio: { map: 'monterey', name: 'Monterey · vacío', player: 'defensa', description: 'Mapa libre para armar tu propio escenario: ubicá objetivos, defensas, ataques y guerra electrónica.', objectives: [], defs: [], salvos: [], jams: [], goals: [] },
  gb_vacio: { map: 'goteborg', name: 'Gotemburgo · vacío', player: 'defensa', description: 'Mapa libre para armar tu propio escenario: ubicá objetivos, defensas, ataques y guerra electrónica.', objectives: [], defs: [], salvos: [], jams: [], goals: [] }
};
