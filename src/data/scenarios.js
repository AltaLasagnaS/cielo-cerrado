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
// rules: opciones del motor que el escenario fija al cargarse: c2 (nivel de integración del mando y
//   control, ver data/c2.js), doctrine y weather (clima fijo, ver data/weather.js; sin dato, despejado). Se acepta net: true|false (formato viejo).

export const SCENARIOS = {
  mb_noche: {
    map: 'monterey', name: 'Monterey · noche de ataque combinado (defensa ucraniana)',
    player: 'defensa',
    time: '02:40 hora local · noche',
    description: 'Una oleada combinada al estilo de las que sufre Ucrania: drones Shahed y señuelos Gerbera abren el ataque para saturar la defensa y gastar munición; detrás llegan misiles de crucero rasantes y dos Iskander-M con maniobra terminal y señuelos contra la batería Patriot. El blanco principal es el depósito de combustible de Salinas.',
    forces: {
      defensa: 'Defensa por capas: radar 3D y VHF de alerta, Patriot (sector orientado al noroeste), IRIS-T, NASAMS, dos Gepard, grupos móviles, red acústica y drones interceptores. Red de mando integrada.',
      ataque: '20 Shahed, 8 Gerbera, 8 Kh-101, 3 Kalibr y 2 Iskander-M. Un avión de interferencia stand-off acompaña desde el noroeste.'
    },
    conditions: 'Noche despejada (clima: despejado). El motor no modela la luz: la noche solo explica por qué los grupos móviles dependen de la alerta acústica. Probá cambiar el clima en la pestaña Defensa.',
    rules: { c2: 'coordinada', doctrine: 'salva', weather: 'despejado' },
    rulesText: ['Red integrada activa y doctrina de salva.', 'Cada batería recarga desde su reserva cuando se vacía, pero una recarga lleva de 2 min (grupos móviles) a 40 min (Patriot): en el pico del ataque cuenta la munición lista.', 'Doctrina de alcance al 100% (pestaña Defensa): probá tirar más cerca, dentro del 90% o del 80% del alcance.', 'Los Kh-101, Kalibr e Iskander están sincronizados para llegar casi juntos (T+24:40 a T+26:00).'],
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
      { type: 'kh101', count: 8, interval: 8, sync: true, tArrive: 1500, agl: 40, pts: [[88, 110], [80, 85], [73, 70], [63.5, 55.8]], targetObj: 'Depósito de combustible Salinas' },
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
      ataque: '16 Storm Shadow, 16 Liutyi, 2 Neptune y 4 ATACMS lanzados desde 220 km, todo sincronizado para llegar en poco más de dos minutos.'
    },
    conditions: 'Despejado. El motor no modela la luz. Probá cambiar el clima en la pestaña Defensa.',
    rules: { c2: 'coordinada', doctrine: 'salva', weather: 'despejado' },
    rulesText: ['Red integrada activa y doctrina de salva para la defensa rusa.', 'El supresor GNSS desvía a las armas que dependen del satélite (los ATACMS y los Liutyi son los más sensibles).', 'Llegada sincronizada entre T+24:00 y T+26:10 para saturar canales de tiro.'],
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
      { type: 'storm', count: 16, interval: 6, sync: true, tArrive: 1480, agl: 35, pts: [[0, 60], [30, 46], [44, 38], [57.8, 32.5]], targetObj: 'Depósito de munición' },
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
  gb_refineria: {
    map: 'goteborg', name: 'Gotemburgo · defensa de la refinería de Hisingen',
    player: 'defensa',
    time: '03:10 hora local · noche',
    description: 'Ejercicio hipotético: una oleada al estilo de las campañas rusas contra la energía ucraniana cae sobre la refinería de la isla de Hisingen, en la desembocadura del Göta älv. Los drones Shahed y los señuelos Gerbera llegan desde el mar para gastar munición; detrás vienen misiles de crucero Kalibr rasantes sobre el agua, Kh-101 desde el norte y dos Kinzhal contra el puerto. La refinería es lo único que importa: sin ella no hay combustible para la región.',
    forces: {
      defensa: 'Defensa por capas con material sueco y donado: radar 3D sobre las colinas de Hisingen, un avión Saab AEW patrullando sobre el mar, Patriot (sector hacia el oeste), IRIS-T, NASAMS, dos puestos RBS 70 (MANPADS), dos grupos móviles, red acústica y drones interceptores. Red de mando integrada.',
      ataque: '16 Shahed, 8 Gerbera, 4 Geran-3 (a reacción), 4 Kalibr, 2 Kh-101 y 2 Kinzhal, con un avión de interferencia stand-off sobre el Kattegat.'
    },
    conditions: 'Noche despejada sobre el mar (clima: despejado). El motor no modela la luz: la noche solo explica por qué los grupos móviles dependen de la alerta acústica y del radar.',
    rules: { c2: 'coordinada', doctrine: 'salva', weather: 'despejado' },
    rulesText: ['Red integrada activa y doctrina de salva.', 'Cada batería recarga desde su reserva cuando se vacía, pero una recarga lleva de 2 min (grupos móviles) a 40 min (Patriot): en el pico del ataque cuenta la munición lista.', 'Doctrina de alcance al 100% (pestaña Defensa): probá tirar más cerca, dentro del 90% o del 80% del alcance.', 'Los Kalibr y los Kh-101 llegan casi juntos (T+25:00 a T+25:10); los Kinzhal, medio minuto después.', 'El Patriot mira al oeste: lo que entra por el norte lo tienen que resolver el IRIS-T y la defensa de punto.'],
    objectives: [
      { type: 'fuel', name: 'Refinería de Hisingen', short: 'Refinería', x: 51.1, y: 34.4, hp: 1600, desc: 'Torres de destilación, tanques y cañerías sobre la costa norte del Göta älv. Blanco principal.' },
      { type: 'fuel', name: 'Terminal petrolera de Skarvik', short: 'Terminal Skarvik', x: 54.1, y: 34.0, desc: 'Tanques de almacenamiento y muelles de carga de combustible.' },
      { type: 'infra', name: 'Puerto de Gotemburgo', short: 'Puerto', x: 55.6, y: 33.9, desc: 'Terminales de contenedores: blanco de los Kinzhal.' }
    ],
    defs: [
      { type: 'ewr', x: 53, y: 29.5, name: 'Radar 3D (Hisingen)' },
      { type: 'aew_s340', x: 30, y: 50, az: 0, name: 'Saab AEW' },
      { type: 'patriot', x: 55, y: 32, az: 260, name: 'Patriot-1' },
      { type: 'irist', x: 49.5, y: 33, name: 'IRIS-T-1' },
      { type: 'nasams', x: 48, y: 32.5, name: 'NASAMS-1' },
      { type: 'manpads', x: 50.6, y: 34, name: 'RBS 70-1' },
      { type: 'manpads', x: 54.4, y: 33.6, name: 'RBS 70-2' },
      { type: 'mfg', x: 47, y: 31, name: 'Grupo móvil 1' },
      { type: 'mfg', x: 52.5, y: 35.2, name: 'Grupo móvil 2' },
      { type: 'acoustic', x: 46, y: 33, name: 'Acústico 1' },
      { type: 'acoustic', x: 50, y: 30, name: 'Acústico 2' },
      { type: 'intdrone', x: 51.5, y: 32.5, name: 'Interceptores-1' }
    ],
    salvos: [
      { type: 'shahed', count: 16, interval: 20, tStart: 0, agl: 1500, pts: [[0, 28], [30, 33], [51.1, 34.4]], targetObj: 'Refinería de Hisingen' },
      { type: 'gerbera', count: 8, interval: 25, tStart: 60, agl: 900, pts: [[0, 42], [30, 38], [51, 34.6]] },
      { type: 'geran3', count: 4, interval: 30, tStart: 400, agl: 800, pts: [[30, 0], [45, 20], [54.1, 34.0]], targetObj: 'Terminal petrolera de Skarvik' },
      { type: 'kalibr', count: 4, interval: 8, sync: true, tArrive: 1500, agl: 20, pts: [[0, 75], [32, 44], [51.1, 34.4]], targetObj: 'Refinería de Hisingen' },
      { type: 'kh101', count: 2, interval: 15, sync: true, tArrive: 1510, agl: 40, pts: [[20, 0], [42, 18], [51.1, 34.4]], targetObj: 'Refinería de Hisingen' },
      { type: 'kinzhal', count: 2, interval: 15, sync: true, tArrive: 1540, launchDist: 450, pts: [[59, 111], [55.6, 33.9]], targetObj: 'Puerto de Gotemburgo' }
    ],
    jams: [
      { type: 'soj', x: 4, y: 20, alt: 8000 }
    ],
    goals: [
      { side: 'ataque', primary: true, kind: 'destroy', target: 'Refinería de Hisingen', text: 'Destruir la refinería de Hisingen' },
      { side: 'ataque', primary: false, kind: 'damage', target: 'Terminal petrolera de Skarvik', min: 0.3, text: 'Dañar la terminal de Skarvik (≥ 30%)' },
      { side: 'ataque', primary: false, kind: 'damage', target: 'Puerto de Gotemburgo', min: 0.2, text: 'Dañar el puerto (≥ 20%)' },
      { side: 'defensa', primary: true, kind: 'survive', target: 'Refinería de Hisingen', text: 'Que la refinería no sea destruida' },
      { side: 'defensa', primary: false, kind: 'protect', target: 'Terminal petrolera de Skarvik', text: 'Mantener operativa la terminal de Skarvik' },
      { side: 'defensa', primary: false, kind: 'keepUnit', target: 'Patriot-1', text: 'Conservar la batería Patriot-1' }
    ],
    success: 'Defensa: la refinería sigue en pie al terminar la oleada.',
    failure: 'Defensa: la refinería queda destruida.'
  },
  mb_puente: {
    map: 'monterey', name: 'Monterey · ataque al puente de Moss Landing',
    player: 'ataque',
    time: '05:20 hora local · antes del amanecer',
    description: 'Ejercicio hipotético inspirado en los ataques ucranianos a los puentes de Chonhar y Crimea: la autopista 1 cruza el estero Elkhorn en Moss Landing por un puente costero, con un puente ferroviario al lado. Por ahí pasa toda la logística del frente. Una defensa rusa con S-400, Pantsir, Tor y Buk lo protege. Tu tarea: cortar el puente carretero.',
    forces: {
      defensa: 'S-400 sobre las lomas del este (sector hacia el sudoeste), dos Pantsir y un Tor junto a los puentes, un Buk-M1, radar 3D y radar VHF de alerta. Red integrada.',
      ataque: '10 Storm Shadow y 2 Flamingo contra el puente carretero, 4 ATACMS contra el puente ferroviario, 2 Neptune contra el S-400 y 30 drones Liutyi contra la central eléctrica, que llegan un par de minutos antes para gastar la munición de la defensa de punto.'
    },
    conditions: 'Despejado. El motor no modela la luz. Probá cambiar el clima en la pestaña Defensa.',
    rules: { c2: 'coordinada', doctrine: 'salva', weather: 'despejado' },
    rulesText: ['Red integrada activa y doctrina de salva para la defensa rusa.', 'Un puente es un blanco duro y angosto: hace falta acertar varias ojivas grandes (la huella de "Infraestructura" es de 60 m).', 'Sin guerra electrónica al empezar. Probá agregar un supresor GNSS Pole-21 junto al puente (pestaña EW) y repetir con Monte Carlo: con un desvío de 100–500 m casi ninguna ojiva acierta un blanco tan angosto.', 'Los Liutyi llegan entre T+21:00 y T+23:00; los misiles, sincronizados entre T+24:40 y T+25:10.'],
    objectives: [
      { type: 'infra', name: 'Puente de la autopista 1', short: 'Puente Hwy 1', x: 51.8, y: 40.9, hp: 1200, desc: 'Puente carretero sobre la boca del estero Elkhorn. Blanco principal.' },
      { type: 'infra', name: 'Puente ferroviario del estero Elkhorn', short: 'Puente ferroviario', x: 52.4, y: 40.7, hp: 1000, desc: 'Vía férrea paralela: la alternativa para la logística pesada.' },
      { type: 'infra', name: 'Central eléctrica de Moss Landing', short: 'Central eléctrica', x: 52.2, y: 41.6, hp: 2000, desc: 'Gran central térmica junto al puerto. Blanco de los drones.' }
    ],
    defs: [
      { type: 's400', x: 62, y: 48, az: 240, name: 'S-400' },
      { type: 'pantsir', x: 52.8, y: 41.3, name: 'Pantsir-1' },
      { type: 'pantsir', x: 51, y: 39.5, name: 'Pantsir-2' },
      { type: 'tor', x: 53.5, y: 40, name: 'Tor-M2' },
      { type: 'buk', x: 56, y: 44, name: 'Buk-M1' },
      { type: 'ewr', x: 61, y: 40, name: 'Radar 3D' },
      { type: 'p18', x: 58, y: 40, name: 'Radar VHF' }
    ],
    salvos: [
      { type: 'storm', count: 10, interval: 5, sync: true, tArrive: 1500, agl: 35, pts: [[0, 58], [30, 52], [44, 45], [51.8, 40.9]], targetObj: 'Puente de la autopista 1' },
      { type: 'flamingo', count: 2, interval: 10, sync: true, tArrive: 1510, agl: 35, pts: [[0, 30], [35, 37], [51.8, 40.9]], targetObj: 'Puente de la autopista 1' },
      { type: 'atacms', count: 4, interval: 6, sync: true, tArrive: 1490, launchDist: 250, pts: [[52, 111], [52.4, 40.7]], targetObj: 'Puente ferroviario del estero Elkhorn' },
      { type: 'neptune', count: 2, interval: 10, sync: true, tArrive: 1480, agl: 12, pts: [[0, 66], [40, 58], [62, 48]], targetUnit: 'S-400' },
      { type: 'lyutyi', count: 30, interval: 4, sync: true, tArrive: 1380, agl: 300, pts: [[89, 100], [70, 62], [52.2, 41.6]], targetObj: 'Central eléctrica de Moss Landing' }
    ],
    jams: [],
    goals: [
      { side: 'ataque', primary: true, kind: 'destroy', target: 'Puente de la autopista 1', text: 'Destruir el puente de la autopista 1' },
      { side: 'ataque', primary: false, kind: 'damage', target: 'Puente ferroviario del estero Elkhorn', min: 0.3, text: 'Dañar el puente ferroviario (≥ 30%)' },
      { side: 'ataque', primary: false, kind: 'killUnit', target: 'S-400', text: 'Destruir la batería S-400' },
      { side: 'ataque', primary: false, kind: 'damage', target: 'Central eléctrica de Moss Landing', min: 0.2, text: 'Dañar la central eléctrica (≥ 20%)' },
      { side: 'defensa', primary: true, kind: 'survive', target: 'Puente de la autopista 1', text: 'Que el puente carretero no sea destruido' },
      { side: 'defensa', primary: false, kind: 'keepUnit', target: 'S-400', text: 'Conservar la batería S-400' }
    ],
    success: 'Ataque: el puente de la autopista 1 queda destruido.',
    failure: 'Ataque: el puente sigue en pie al terminar la oleada.'
  },
  kv_energia: {
    map: 'kyiv', name: 'Kiev · noche contra la energía (defensa ucraniana)',
    player: 'defensa',
    time: '01:30 hora local · invierno',
    description: 'Una noche típica de la campaña rusa contra la energía ucraniana: oleadas de Shahed desde el norte y el este, señuelos Gerbera para gastar munición, misiles de crucero Kh-101 y Kalibr, y balísticos Iskander-M y Kinzhal al final, todo para llegar casi junto. Los blancos son las centrales de cogeneración que dan luz y calefacción a la ciudad y la represa de Kiev. Las posiciones de la defensa son ilustrativas, no las reales.',
    forces: {
      defensa: 'Defensa por capas de la capital: radar 3D y radar VHF de alerta, Patriot (sector hacia el noreste), NASAMS, IRIS-T, dos Gepard junto a las centrales, tres grupos móviles, red acústica, drones interceptores y la red anti-GNSS Pokrova sobre la ciudad. Red de mando integrada.',
      ataque: '24 Shahed en dos oleadas, 10 Gerbera, 7 Kh-101, 6 Kalibr, 3 Iskander-M con señuelos y 2 Kinzhal.'
    },
    conditions: 'Noche de invierno, despejada. El motor no modela la luz: la noche solo explica por qué los grupos móviles dependen de la alerta acústica y del radar. Probá un techo de nubes bajo (pestaña Defensa): los grupos móviles dejan de ver a los Shahed que vuelan arriba.',
    rules: { c2: 'coordinada', doctrine: 'salva', weather: 'despejado' },
    rulesText: ['Red integrada activa y doctrina de salva.', 'Cada batería recarga desde su reserva cuando se vacía, pero una recarga lleva de 2 min (grupos móviles) a 40 min (Patriot): en el pico del ataque cuenta la munición lista.', 'Doctrina de alcance al 100% (pestaña Defensa): probá tirar más cerca, dentro del 90% o del 80% del alcance.', 'Los misiles de crucero y los balísticos llegan casi juntos (T+24:50 a T+25:30), después de una hora de drones.', 'Pokrova engaña al GNSS de los Shahed y los Gerbera sobre la ciudad. Los Kh-101 y Kalibr la descartan con su corrección de terreno, y los misiles con buscador terminal corrigen al final: apagala (pestaña EW) y compará con Monte Carlo.'],
    objectives: [
      { type: 'infra', name: 'Central CHP-5', short: 'CHP-5', x: 40.3, y: 67.4, hp: 1500, desc: 'Central de cogeneración de ~700 MW: luz y calefacción para buena parte de la margen derecha y de Darnytsia.' },
      { type: 'infra', name: 'Central CHP-6', short: 'CHP-6', x: 46.9, y: 52, hp: 1500, desc: 'Central de cogeneración de ~500 MW en Troieshchyna, margen izquierda.' },
      { type: 'infra', name: 'Represa de Kiev', short: 'Represa', x: 36.3, y: 45.7, hp: 2500, desc: 'Central hidroeléctrica de Vyshhorod, al pie del embalse de Kiev.' }
    ],
    defs: [
      { type: 'ewr', x: 30, y: 72, name: 'Radar 3D' },
      { type: 'p18', x: 52, y: 60, name: 'Radar VHF' },
      { type: 'patriot', x: 33, y: 60, az: 40, name: 'Patriot-1' },
      { type: 'nasams', x: 44, y: 58, name: 'NASAMS-1' },
      { type: 'irist', x: 34, y: 67, name: 'IRIS-T-1' },
      { type: 'gepard', x: 42, y: 69, name: 'Gepard-1' },
      { type: 'gepard', x: 48, y: 53, name: 'Gepard-2' },
      { type: 'mfg', x: 36, y: 48, name: 'Grupo móvil 1' },
      { type: 'mfg', x: 55, y: 48, name: 'Grupo móvil 2' },
      { type: 'mfg', x: 28, y: 55, name: 'Grupo móvil 3' },
      { type: 'acoustic', x: 38, y: 40, name: 'Acústico 1' },
      { type: 'acoustic', x: 58, y: 45, name: 'Acústico 2' },
      { type: 'acoustic', x: 30, y: 50, name: 'Acústico 3' },
      { type: 'intdrone', x: 44, y: 63, name: 'Interceptores-1' }
    ],
    salvos: [
      { type: 'shahed', count: 18, interval: 20, tStart: 0, agl: 1500, pts: [[40, 0], [42, 30], [46.9, 52]], targetObj: 'Central CHP-6' },
      { type: 'gerbera', count: 10, interval: 25, tStart: 60, agl: 900, pts: [[70, 5], [50, 30], [44, 55]] },
      { type: 'shahed', count: 6, interval: 30, tStart: 120, agl: 2000, pts: [[70, 40], [55, 55], [40.3, 67.4]], targetObj: 'Central CHP-5' },
      { type: 'kh101', count: 7, interval: 10, sync: true, tArrive: 1500, agl: 40, pts: [[0, 30], [20, 50], [40.3, 67.4]], targetObj: 'Central CHP-5' },
      { type: 'kalibr', count: 6, interval: 8, sync: true, tArrive: 1490, agl: 50, pts: [[45, 111], [42, 90], [40.3, 67.4]], targetObj: 'Central CHP-5' },
      { type: 'isk_m', count: 3, interval: 15, sync: true, tArrive: 1520, launchDist: 400, maneuver: true, decoys: true, pts: [[70, 0], [46.9, 52]], targetObj: 'Central CHP-6' },
      { type: 'kinzhal', count: 2, interval: 15, sync: true, tArrive: 1530, launchDist: 450, pts: [[70, 20], [36.3, 45.7]], targetObj: 'Represa de Kiev' }
    ],
    jams: [
      { type: 'pokrova', x: 42, y: 58 }
    ],
    goals: [
      { side: 'ataque', primary: true, kind: 'destroy', target: 'Central CHP-5', text: 'Destruir la central CHP-5' },
      { side: 'ataque', primary: true, kind: 'destroy', target: 'Central CHP-6', text: 'Destruir la central CHP-6' },
      { side: 'ataque', primary: false, kind: 'damage', target: 'Represa de Kiev', min: 0.3, text: 'Dañar la represa (≥ 30%)' },
      { side: 'defensa', primary: true, kind: 'survive', target: 'Central CHP-5', text: 'Que la central CHP-5 no sea destruida' },
      { side: 'defensa', primary: true, kind: 'survive', target: 'Central CHP-6', text: 'Que la central CHP-6 no sea destruida' },
      { side: 'defensa', primary: false, kind: 'protect', target: 'Represa de Kiev', text: 'Mantener operativa la represa' },
      { side: 'defensa', primary: false, kind: 'keepUnit', target: 'Patriot-1', text: 'Conservar la batería Patriot-1' }
    ],
    success: 'Defensa: las dos centrales siguen en pie al terminar la noche.',
    failure: 'Defensa: alguna de las centrales queda destruida.'
  },
  kh_umpk: {
    map: 'kharkiv', name: 'Járkov · bombas planeadoras (defensa ucraniana)',
    player: 'defensa',
    time: '06:10 hora local · madrugada',
    description: 'Járkov está a 30 km de la frontera rusa: los Su-34 sueltan bombas FAB-500 con kit UMPK desde Belgorod, a 9–12 km de altura y a 50–70 km del blanco, sin entrar al alcance de casi ninguna defensa. Las bombas planean sin motor, casi no tienen firma infrarroja y llegan muchas juntas. Esta mañana van contra la central CHP-5 de Podvirky (ya dañada en marzo de 2024) y el centro de la ciudad, mezcladas con Shahed para gastar munición. Las bombas traen antenas CRPA Kometa de 12 elementos: las dos estaciones Lima de la ciudad no les alcanzan. Las posiciones de las defensas son ilustrativas.',
    forces: {
      defensa: 'Radar 3D y radar VHF de alerta, una batería Patriot al sur de la ciudad (sector hacia el norte), IRIS-T junto a la CHP-5, NASAMS, un Gepard, dos grupos móviles, red acústica y dos estaciones anti-GNSS Lima. Red de mando coordinada.',
      ataque: '30 bombas UMPK en tres oleadas de 10 (CRPA Kometa de 12 elementos) y 12 Shahed.'
    },
    conditions: 'Madrugada despejada. Para probar la guerra electrónica: en la pestaña Ataque, sin CRPA las bombas se desvían por las dos estaciones Lima; una CRPA de 4 elementos anula hasta 3 y todavía alcanza, pero no contra 4 estaciones repartidas alrededor de la ciudad (pestaña EW). Contra la de 12 harían falta 12 direcciones distintas. También probá la doctrina de alcance (pestaña Defensa).',
    rules: { c2: 'coordinada', doctrine: 'salva', weather: 'despejado' },
    rulesText: ['Red coordinada y doctrina de salva.', 'Cada batería recarga desde su reserva cuando se vacía, pero una recarga lleva de 2 min (grupos móviles) a 40 min (Patriot).', 'Las bombas se sueltan fuera del mapa, al norte, a ≈60 km del blanco: no hay forma de tocar al avión en este escenario.', 'Interceptar una bomba de US$30 mil con un misil Patriot de US$4 M es posible pero caro: mirá el costo en el debrief.'],
    objectives: [
      { type: 'infra', name: 'Central CHP-5', short: 'CHP-5', x: 7.2, y: 58.7, hp: 1500, desc: 'Central de cogeneración de 540 MW en Podvirky, al oeste de la ciudad (Global Energy Monitor). Gravemente dañada el 22 de marzo de 2024.' },
      { type: 'infra', name: 'Centro de Járkov', short: 'Centro', x: 16.5, y: 56.3, hp: 2500, desc: 'Edificios administrativos, oficinas y viviendas del distrito Shevchenkivskyi.' },
      { type: 'infra', name: 'Central de Zmiiv', short: 'Zmiiv', x: 38, y: 101.3, hp: 2000, desc: 'Central térmica de Zmiiv (Slobozhanske), al sur. Destruida en marzo de 2024; acá está en pie y no la atacan esta mañana.' }
    ],
    defs: [
      { type: 'ewr', x: 22, y: 66, name: 'Radar 3D' },
      { type: 'p18', x: 30, y: 60, name: 'Radar VHF' },
      { type: 'patriot', x: 14, y: 68, az: 0, name: 'Patriot-1' },
      { type: 'irist', x: 9, y: 61, name: 'IRIS-T-1' },
      { type: 'nasams', x: 19, y: 59, name: 'NASAMS-1' },
      { type: 'gepard', x: 8, y: 57, name: 'Gepard-1' },
      { type: 'mfg', x: 18, y: 48, name: 'Grupo móvil 1' },
      { type: 'mfg', x: 28, y: 52, name: 'Grupo móvil 2' },
      { type: 'acoustic', x: 20, y: 40, name: 'Acústico 1' },
      { type: 'acoustic', x: 34, y: 45, name: 'Acústico 2' }
    ],
    salvos: [
      { type: 'shahed', count: 12, interval: 25, tStart: 0, agl: 1500, pts: [[60, 0], [40, 30], [16.5, 56.3]], targetObj: 'Centro de Járkov' },
      { type: 'kab', count: 10, interval: 4, sync: true, tArrive: 600, crpa: 12, pts: [[8, 0], [7.2, 58.7]], targetObj: 'Central CHP-5' },
      { type: 'kab', count: 10, interval: 4, sync: true, tArrive: 900, crpa: 12, pts: [[20, 0], [16.5, 56.3]], targetObj: 'Centro de Járkov' },
      { type: 'kab', count: 10, interval: 4, sync: true, tArrive: 1200, crpa: 12, pts: [[12, 0], [7.2, 58.7]], targetObj: 'Central CHP-5' }
    ],
    jams: [
      { type: 'lima', x: 12, y: 54 },
      { type: 'lima', x: 22, y: 60 }
    ],
    goals: [
      { side: 'ataque', primary: true, kind: 'destroy', target: 'Central CHP-5', text: 'Destruir la central CHP-5' },
      { side: 'ataque', primary: false, kind: 'damage', target: 'Centro de Járkov', min: 0.3, text: 'Dañar el centro de la ciudad (≥ 30%)' },
      { side: 'defensa', primary: true, kind: 'survive', target: 'Central CHP-5', text: 'Que la central CHP-5 no sea destruida' },
      { side: 'defensa', primary: false, kind: 'protect', target: 'Centro de Járkov', text: 'Mantener operativo el centro de la ciudad' },
      { side: 'defensa', primary: false, kind: 'keepUnit', target: 'Patriot-1', text: 'Conservar la batería Patriot-1' }
    ],
    success: 'Defensa: la central CHP-5 sigue en pie al terminar el ataque.',
    failure: 'Defensa: la central CHP-5 queda destruida.'
  },
  kh_vacio: { map: 'kharkiv', name: 'Járkov · vacío', player: 'defensa', description: 'Mapa libre sobre el relieve real de Járkov (SRTM): ubicá objetivos, defensas, ataques y guerra electrónica.', objectives: [], defs: [], salvos: [], jams: [], goals: [] },
  kv_vacio: { map: 'kyiv', name: 'Kiev · vacío', player: 'defensa', description: 'Mapa libre sobre el relieve real de Kiev (SRTM): ubicá objetivos, defensas, ataques y guerra electrónica.', objectives: [], defs: [], salvos: [], jams: [], goals: [] },
  mb_vacio: { map: 'monterey', name: 'Monterey · vacío', player: 'defensa', description: 'Mapa libre para armar tu propio escenario: ubicá objetivos, defensas, ataques y guerra electrónica.', objectives: [], defs: [], salvos: [], jams: [], goals: [] },
  gb_vacio: { map: 'goteborg', name: 'Gotemburgo · vacío', player: 'defensa', description: 'Mapa libre para armar tu propio escenario: ubicá objetivos, defensas, ataques y guerra electrónica.', objectives: [], defs: [], salvos: [], jams: [], goals: [] }
};
