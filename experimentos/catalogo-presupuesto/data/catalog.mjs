import { deepFreeze } from '../lib/common.mjs';

// Original reference records, not extracted commercial database content.
// No physical values are inferred from names, family membership or game IDs.
const evidence = (status, value, ...sourceIds) => ({ status, value, sourceIds });
const unknown = () => evidence('unknown', null);

export const PARAMETER_UNITS = deepFreeze({
  maxR: 'km', maxRtbm: 'km', minR: 'km', altMin: 'm', altMax: 'm',
  vInt: 'm/s', vmax: 'm/s', tb: 's', vmaxT: 'm/s'
});

const emptyModel = () => Object.fromEntries(
  Object.entries(PARAMETER_UNITS).map(([key, unit]) => [key, { unit, ...unknown() }])
);

const weapon = (id, familyId, name, identity, note, guidance = unknown()) => ({
  id, familyId, name, identity, guidance, model: emptyModel(),
  note, price: unknown(), readiness: 'research-only'
});

const component = (id, familyId, name, kind, identity) => ({
  id, familyId, name, kind, identity, physicalCapacity: unknown()
});

const candidate = (id, familyId, weaponId, componentIds, relation) => ({
  id, familyId, weaponIds: [weaponId], componentIds,
  readiness: 'research-only', relation,
  operatorAvailability: unknown(), nativeDatalink: unknown(),
  remoteCueing: unknown(), remoteLaunch: unknown(), remoteGuidance: unknown(),
  note: 'Candidato de investigación; no autoriza despliegue, carga mixta ni empleo remoto.'
});

export const CATALOG = deepFreeze({
  format: 'cielo-cerrado/reference-catalog', version: 1,
  localBaseline: 'bb0d718', reviewedOn: '2026-10-04',
  sources: [
    { id: 'rtx-gemt', role: 'primary', access: 'reviewed',
      url: 'https://www.rtx.com/raytheon/what-we-do/integrated-air-and-missile-defense/guidance-enhanced-missile',
      scope: 'Identidad de GEM-T como variante Patriot; declaraciones del fabricante, no Pk universal.' },
    { id: 'rtx-patriot', role: 'primary', access: 'reviewed',
      url: 'https://www.rtx.com/raytheon/what-we-do/integrated-air-and-missile-defense/global-patriot-solutions',
      scope: 'Familia Patriot y modernización; no certifica cada combinación de componentes.' },
    { id: 'kongsberg-missiles', role: 'primary', access: 'reviewed',
      url: 'https://www.kongsberg.com/what-we-do/defence-and-security/integrated-air-and-missile-defence/raytheon-missiles/',
      scope: 'Familias ofrecidas para NASAMS/MML; no disponibilidad por operador.' },
    { id: 'kongsberg-nasams', role: 'primary', access: 'reviewed',
      url: 'https://www.kongsberg.com/what-we-do/defence-and-security/integrated-air-and-missile-defence/nasams-air-defence-system/',
      scope: 'Composición modular y FDC/Sentinel; no confirmar capacidades nacionales por inferencia.' },
    { id: 'csis-patriot', role: 'secondary', access: 'reviewed',
      url: 'https://missilethreat.csis.org/system/patriot/',
      scope: 'Composición e historia, CRI/MSE. No prestaciones universales.' },
    { id: 'apa-s300', role: 'secondary', access: 'reviewed',
      url: 'https://www.ausairpower.net/APA-Grumble-Gargoyle.html',
      scope: 'Historia S-300P y variantes de guía; página histórica, actualización indicada de 2014.' },
    { id: 'cmo-index-442', role: 'index', access: 'supplied',
      url: null, scope: 'Listas DB3K/CWDB 442 aportadas. Identidad y pistas de asociación, no validación física.' },
    { id: 'local-legacy', role: 'legacy', access: 'local',
      url: null, scope: 'src/data/defenses.js en bb0d718; estimaciones del juego, no validación independiente.' },
    { id: 'lm-pac3-blocked', role: 'primary', access: 'blocked',
      url: 'https://www.lockheedmartin.com/en-us/products/pac-3.html',
      scope: 'HTTP 403; no se atribuyen datos a contenido no leído.' }
  ],
  families: [
    { id: 'patriot', name: 'Patriot', identity: evidence('documented-primary', 'Familia Patriot', 'rtx-patriot') },
    { id: 'nasams', name: 'NASAMS', identity: evidence('documented-primary', 'Familia NASAMS', 'kongsberg-nasams') },
    { id: 's300p', name: 'S-300P', identity: evidence('documented-secondary', 'Familia S-300P, no S-300V', 'apa-s300') }
  ],
  weapons: [
    weapon('patriot-gemt', 'patriot', 'PAC-2 GEM-T',
      evidence('documented-primary', 'GEM-T es una variante de misil Patriot', 'rtx-gemt'),
      'No inferir todos los lanzadores, versiones de control ni cargas mixtas.'),
    weapon('patriot-pac3-cri', 'patriot', 'PAC-3 CRI',
      evidence('documented-secondary', 'Cost Reduction Initiative dentro de PAC-3', 'csis-patriot'),
      'No hereda prestaciones ni motor de MSE.'),
    weapon('patriot-pac3-mse', 'patriot', 'PAC-3 MSE',
      evidence('documented-secondary', 'Missile Segment Enhancement es una variante distinta de PAC-3', 'csis-patriot'),
      'El perfil de doble pulso se representa sólo mediante la aproximación acordada con Claude.'),
    weapon('nasams-aim120-unspecified', 'nasams', 'AIM-120, variante sin identificar',
      evidence('documented-primary', 'AIM-120 es la munición base de NASAMS', 'kongsberg-nasams'),
      'Marcador para preservar el legado; no una variante física concreta.'),
    weapon('nasams-aim120-c7', 'nasams', 'AIM-120 C7, candidato por precisar',
      evidence('documented-primary', 'Kongsberg usa C7 como referencia de comparación para ER', 'kongsberg-missiles'),
      'La comparación no identifica por sí sola todos los sistemas y operadores que lo usan.'),
    weapon('nasams-amraam-er', 'nasams', 'AMRAAM-ER',
      evidence('documented-primary', 'Ofrecido como munición de la familia NASAMS', 'kongsberg-missiles'),
      'No derivar alcance absoluto de porcentajes comerciales de mejora.'),
    weapon('nasams-aim9x-b2', 'nasams', 'AIM-9X Block II',
      evidence('documented-primary', 'Ofrecido para NASAMS/Multi-Missile Launcher', 'kongsberg-missiles'),
      'Ampliación posterior: requiere integrar comportamiento IR, sin copiar AMRAAM.',
      evidence('documented-primary', 'IR', 'kongsberg-missiles')),
    weapon('s300p-5v55k', 's300p', '5V55K',
      evidence('documented-secondary', 'Variante 5V55K de la familia S-300P', 'apa-s300'),
      'No confundir guía ni generación con 5V55R.',
      evidence('documented-secondary', 'command-link', 'apa-s300')),
    weapon('s300p-5v55kd', 's300p', '5V55KD',
      evidence('documented-secondary', 'Variante 5V55KD distinta de K/R', 'apa-s300'),
      'Corroborar combinación PT-1 y componentes mediante fuentes adicionales.'),
    weapon('s300p-5v55r', 's300p', '5V55R',
      evidence('documented-secondary', 'Variante 5V55R dentro de la familia S-300P', 'apa-s300'),
      'No habilitar genéricamente todos los PT/PS/PMU por el nombre de familia.',
      evidence('documented-secondary', 'TVM', 'apa-s300'))
  ],
  components: [
    component('patriot-launch-station', 'patriot', 'Estación de lanzamiento, revisión pendiente', 'launcher',
      evidence('documented-secondary', 'Componente genérico de batería Patriot', 'csis-patriot')),
    component('patriot-radar', 'patriot', 'Radar Patriot, versión pendiente', 'sensor',
      evidence('documented-secondary', 'Componente genérico de batería Patriot', 'csis-patriot')),
    component('patriot-control', 'patriot', 'Engagement Control Station, versión pendiente', 'control',
      evidence('documented-secondary', 'Componente genérico de batería Patriot', 'csis-patriot')),
    component('nasams-mml', 'nasams', 'NASAMS Multi-Missile Launcher', 'launcher',
      evidence('documented-primary', 'Lanzador de la oferta NASAMS', 'kongsberg-missiles')),
    component('nasams-fdc', 'nasams', 'NASAMS Fire Distribution Center', 'control',
      evidence('documented-primary', 'Mando/control de unidad NASAMS', 'kongsberg-nasams')),
    component('nasams-sentinel-f1', 'nasams', 'AN/MPQ-64F1 Sentinel', 'sensor',
      evidence('documented-primary', 'Sensor de la composición estándar descrita', 'kongsberg-nasams')),
    component('s300pt-launcher', 's300p', 'Lanzador S-300PT, revisión pendiente', 'launcher',
      evidence('indexed', 'Entrada de lanzador PT en lista CMO', 'cmo-index-442')),
    component('s300ps-launcher', 's300p', 'Lanzador S-300PS, revisión pendiente', 'launcher',
      evidence('indexed', 'Entrada de lanzador PS en lista CMO', 'cmo-index-442')),
    component('s300p-control-radar', 's300p', 'Control/radar S-300P, revisión pendiente', 'control-sensor',
      evidence('documented-secondary', 'Componente de familia; generaciones por corroborar', 'apa-s300'))
  ],
  configurations: [
    ...['patriot-gemt', 'patriot-pac3-cri', 'patriot-pac3-mse'].map(weaponId =>
      candidate(`candidate-${weaponId}`, 'patriot', weaponId,
        ['patriot-launch-station', 'patriot-radar', 'patriot-control'],
        { scope: 'family', evidence: unknown() })),
    ...['nasams-aim120-unspecified', 'nasams-aim120-c7', 'nasams-amraam-er', 'nasams-aim9x-b2'].map(weaponId =>
      candidate(`candidate-${weaponId}`, 'nasams', weaponId,
        ['nasams-mml', 'nasams-fdc', 'nasams-sentinel-f1'],
        { scope: 'family', evidence: weaponId === 'nasams-aim120-c7'
          ? unknown()
          : evidence('documented-primary', 'Oferta de familia, no configuración nacional', 'kongsberg-missiles') })),
    candidate('candidate-s300pt-k', 's300p', 's300p-5v55k',
      ['s300pt-launcher', 's300p-control-radar'],
      { scope: 'indexed-pairing', evidence: evidence('indexed', 'PT y 5V55K en etiqueta de lista', 'cmo-index-442') }),
    candidate('candidate-s300pt1-kd', 's300p', 's300p-5v55kd',
      ['s300pt-launcher', 's300p-control-radar'],
      { scope: 'indexed-pairing', evidence: evidence('indexed', 'PT-1 y 5V55KD en etiqueta de lista', 'cmo-index-442') }),
    candidate('candidate-s300ps-r', 's300p', 's300p-5v55r',
      ['s300ps-launcher', 's300p-control-radar'],
      { scope: 'indexed-pairing', evidence: evidence('indexed', 'PS y 5V55R en etiqueta de lista', 'cmo-index-442') })
  ],
  legacyMappings: [
    { legacyId: 'patriot', candidates: ['patriot-pac3-mse'], status: 'name-only' },
    { legacyId: 'patriot2', candidates: ['patriot-gemt'], status: 'name-only' },
    { legacyId: 'nasams', candidates: ['nasams-aim120-unspecified'], status: 'ambiguous' },
    { legacyId: 's300', candidates: ['s300p-5v55k', 's300p-5v55kd', 's300p-5v55r'], status: 'ambiguous' }
  ]
});
