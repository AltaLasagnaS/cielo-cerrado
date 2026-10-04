// @ts-check
// Defensas y sensores. Ver docs/DATOS-Y-FUENTES.md para el significado de cada campo.
import { WP, SRC } from './sources.js';

// kind: sam | gun | sensor | aew | acoustic
// radar: band, mti ('none' | 'mti' | 'pd': procesamiento contra clutter, ver physics/radar.js), R1 (km para 1 m²: Pd 50%), mast (m), mastRange [mín, máx] (m; iguales = fija), mastNote, sector (°), eccm (dB), scan (s)
//        ECCM (physics/radar.js#jamJ, docs/FISICA.md §4): agile (agilidad de frecuencia: anula el ruido puntual), lowSL (lóbulos
//        laterales bajos), slc (cantidad de canceladores de lóbulos laterales). Patriot: agilidad y al menos un SLC (Radartutorial,
//        MDAA); 30N6: lóbulos muy bajos y agilidad (Air Power Australia). El resto son estimaciones por generación y tipo de antena
//        (AESA/PESA modernos: agilidad y lóbulos bajos; soviéticos de los 60–70: nada). eccm (dB) queda como lo demás
//        (procesamiento, compresión de pulso, operador).
// sam: maxR, maxRtbm, minR (km), altMin, altMax (m), vInt (m/s promedio hasta maxR), vmax (m/s máx.), tb (s de motor; vmax y tb
//      opcionales: perfil de motor y planeo, physics/interceptor.js), vmaxT (m/s), react (s), ch, mag (listos),
//      reserve (en vehículos de recarga), reloadS (s para recargar toda la batería), salvo, guid, pk{}, cost (M$ por disparo)
export const DEFENSES = {
  patriot: {
    name: 'Patriot (PAC-3 MSE)', short: 'Patriot', side: 'UA', kind: 'sam', color: '#62b6ff',
    datalinks: ['l16'],
    radar: { name: 'AN/MPQ-65', agile: true, slc: 1, discrim: 4, band: 'C', mti: 'pd', R1: 100, mast: 4, mastRange: [4, 4], mastNote: 'Fija: la antena va sobre el semirremolque M860, inclinada a 67,5°. El mástil de ≈30 m de la batería (AMG) es de comunicaciones, no del radar (FM 3-01.85).', sector: 90, eccm: 10, scan: 2 },
    sam: { maxR: 100, maxRtbm: 40, minR: 3, altMin: 50, altMax: 36000, vInt: 1300, vmax: 1700, tb: 10, vmaxT: 3000, react: 9, ch: 8, mag: 16, reserve: 16, reloadS: 2400, salvo: 2, guid: 'activo', shot: 'PAC-3 MSE', noDrones: true, cost: 4.2, pk: { dron: 0.9, crucero: 0.9, supersonico: 0.6, balistico: 0.7, hiper: 0.5 } },
    range: '≈40 km vs balísticos (estimado), ≈100 km vs aeronaves', interceptor: 'PAC-3 MSE: hit-to-kill, buscador activo, motor de doble pulso, techo ≈36 km',
    notes: ['El AN/MPQ-65 busca en un sector de ~90° (sigue en ~120°): hay que orientarlo hacia la amenaza. El LTAMDS nuevo tiene 3 paneles y 360°.', 'El radar guía hasta ~9 misiles a la vez.', 'Lanzador M903: hasta 12 MSE (o 16 CRI); una batería tiene 6–8 lanzadores.', 'Costo: US$4,19 M por misil en el presupuesto FY2025; el contrato plurianual de 2025 da ≈4,97 M con costos asociados.'],
    sources: [WP('MIM-104_Patriot'), SRC.csis_patriot, SRC.rt_mpq53, SRC.army_jb25, SRC.bd_pac3]
  },
  patriot2: {
    name: 'Patriot (PAC-2 GEM-T)', short: 'Patriot GEM-T', side: 'UA', kind: 'sam', color: '#62b6ff',
    datalinks: ['l16'],
    radar: { name: 'AN/MPQ-65', agile: true, slc: 1, discrim: 4, band: 'C', mti: 'pd', R1: 100, mast: 4, mastRange: [4, 4], mastNote: 'Fija: la antena va sobre el semirremolque M860. El mástil de ≈30 m (AMG) es de comunicaciones, no del radar.', sector: 90, eccm: 10, scan: 2 },
    sam: { maxR: 160, maxRtbm: 20, minR: 3, altMin: 60, altMax: 24000, vInt: 900, vmax: 1500, tb: 12, vmaxT: 2500, react: 9, ch: 8, mag: 16, reserve: 16, reloadS: 2400, salvo: 2, guid: 'TVM', shot: 'PAC-2 GEM-T', noDrones: true, cost: 3, pk: { dron: 0.8, crucero: 0.85, supersonico: 0.55, balistico: 0.4, hiper: 0.25 } },
    range: '≈160 km vs aeronaves, ≈20 km vs balísticos', interceptor: 'GEM-T: fragmentación, guiado TVM (necesita que el radar propio vea el blanco), Mach ≈3,5',
    notes: ['Mayor alcance contra aviones y misiles de crucero que el MSE, pero peor contra balísticos.', '4 misiles por lanzador M901/M903.', 'Precio unitario no publicado: US$2–4 M según estimaciones de prensa.'],
    sources: [WP('MIM-104_Patriot'), SRC.csis_patriot, SRC.ar_gemt]
  },
  sampt: {
    name: 'SAMP/T (Aster 30 B1)', short: 'SAMP/T', side: 'UA', kind: 'sam', color: '#62b6ff',
    datalinks: [],
    radar: { name: 'Arabel', agile: true, lowSL: true, slc: 1, band: 'X', mti: 'pd', R1: 80, mast: 5, mastRange: [5, 5], mastNote: 'Fija: Arabel montado sobre camión (altura estimada).', sector: 360, eccm: 10, scan: 1 },
    sam: { maxR: 100, maxRtbm: 25, minR: 3, altMin: 50, altMax: 20000, vInt: 1050, vmax: 1400, tb: 6, vmaxT: 2500, react: 8, ch: 10, mag: 32, reserve: 16, reloadS: 2400, salvo: 2, guid: 'activo', shot: 'Aster 30', noDrones: true, cost: 2, pk: { dron: 0.85, crucero: 0.88, supersonico: 0.6, balistico: 0.6, hiper: 0.4 } },
    range: '≈100 km vs aeronaves (50 km por debajo de 3 km de altura), 20–35 km vs balísticos', interceptor: 'Aster 30: 1,4 km/s, buscador activo, control "PIF-PAF" (toberas laterales para maniobra final)',
    notes: ['Radar Arabel en banda X, giratorio a 60 rpm (refresco 1 s), ~100 km de alcance.', '8 misiles por lanzador vertical, 4–6 lanzadores por batería; 10 blancos simultáneos.', 'En Ucrania tuvo problemas de software contra algunos balísticos y escasez de misiles (2025). La afirmación de que superó al Patriot contra Iskander es de baja confianza.'],
    sources: [WP('SAMP/T'), SRC.csis_sampt, SRC.at_aster, SRC.ar_samp_pat]
  },
  irist: {
    name: 'IRIS-T SLM', short: 'IRIS-T', side: 'UA', kind: 'sam', color: '#62b6ff',
    datalinks: ['l16'],
    radar: { name: 'Hensoldt TRML-4D', agile: true, lowSL: true, slc: 2, band: 'C', mti: 'pd', R1: 100, mast: 6, mastRange: [4, 12], mastNote: 'Mástil hidráulico sobre el camión: la antena llega hasta 12 m (Hensoldt). Retraído ≈4 m (estimado).', sector: 360, eccm: 10, scan: 1 },
    sam: { maxR: 40, maxRtbm: 0, minR: 1, altMin: 10, altMax: 20000, vInt: 750, vmax: 1000, tb: 6, vmaxT: 1200, react: 6, ch: 8, mag: 24, reserve: 8, reloadS: 1200, salvo: 1, guid: 'IR', shot: 'IRIS-T SL', cost: 0.5, pk: { dron: 0.9, crucero: 0.88, supersonico: 0.2, balistico: 0, hiper: 0 } },
    range: '40 km, techo 20 km (SLX: 80 km)', interceptor: 'IRIS-T SL: guiado inercial + datalink, buscador IR de imagen terminal, ≈Mach 3',
    notes: ['El TRML-4D es banda C (G OTAN): 250 km instrumentados, cazas a más de 120 km, misiles supersónicos a más de 60 km, 1.500 pistas.', 'Diehl y operadores ucranianos reclaman "casi 100%" (≈240 derribos a jun-2024), sobre todo contra crucero y drones. No hay datos contra balísticos.', 'Al ser IR, puede atacar con pista de la red sin que el radar propio vea el blanco en el último tramo; las bengalas del Kh-101 son justamente contra este tipo de buscador.'],
    sources: [WP('IRIS-T_SL'), WP('TRML'), SRC.hensoldt, SRC.dm_iris]
  },
  nasams: {
    name: 'NASAMS (AIM-120 AMRAAM)', short: 'NASAMS', side: 'UA', kind: 'sam', color: '#62b6ff',
    datalinks: ['l16'],
    radar: { name: 'AN/MPQ-64 Sentinel', agile: true, lowSL: true, band: 'X', mti: 'pd', R1: 60, mast: 4, mastRange: [4, 4], mastNote: 'Fija: Sentinel sobre remolque (altura estimada).', sector: 360, eccm: 8, scan: 2 },
    sam: { maxR: 35, maxRtbm: 0, minR: 1, altMin: 30, altMax: 15000, vInt: 900, vmax: 1370, tb: 8, vmaxT: 1000, react: 6, ch: 6, mag: 18, reserve: 12, reloadS: 1800, salvo: 1, guid: 'activo', shot: 'AIM-120', cost: 1.07, pk: { dron: 0.85, crucero: 0.88, supersonico: 0.4, balistico: 0, hiper: 0 } },
    range: '≈35–40 km (AMRAAM-ER: 50–60 km)', interceptor: 'AIM-120: misil aire-aire adaptado, buscador radar activo',
    notes: ['Noruega reclamó 94% de éxito en Ucrania (feb-2025, ~900 AMRAAM); no se aclara si es por disparo o por blanco y ~60% de los blancos eran crucero.', 'Sentinel: banda X, 30 rpm (refresco 2 s); 40 km el modelo básico, 120 km el F1.', '3 lanzadores de 6 misiles por unidad de fuego. No sirve contra balísticos.'],
    sources: [WP('NASAMS'), SRC.crs_nasams, SRC.kongsberg, SRC.aw_nasams, SRC.dod_p1_25]
  },
  s300: {
    name: 'S-300PS/PT (5V55R)', short: 'S-300P', side: 'UA', kind: 'sam', color: '#62b6ff',
    datalinks: ['ua_c2'],
    radar: { name: '30N6 Flap Lid (en torre 40V6)', agile: true, lowSL: true, band: 'X', mti: 'pd', R1: 100, mast: 25, mastRange: [7, 39], mastNote: 'Sin torre, la antena queda a ≈7 m sobre su vehículo (estimado); en la torre 40V6M a ≈25 m y en la 40V6MD a ≈39 m (Air Power Australia). Armar la torre lleva 1–2 h, no se cambia durante el combate.', sector: 90, eccm: 3, scan: 2 },
    sam: { maxR: 75, maxRtbm: 25, minR: 5, altMin: 25, altMax: 27000, vInt: 1300, vmax: 2000, tb: 11, vmaxT: 1300, react: 12, ch: 4, mag: 16, reserve: 12, reloadS: 2400, salvo: 2, guid: 'TVM', shot: '5V55R', cost: 0.5, pk: { dron: 0.5, crucero: 0.5, supersonico: 0.1, balistico: 0.15, hiper: 0.05 } },
    range: '47 km (5V55K) / 75 km (5V55R), techo 27 km', interceptor: '5V55: hasta 2.000 m/s, guiado por mando (K) o TVM (R)',
    notes: ['Ucrania tenía 35 batallones S-300PS/PT en feb-2022 (RUSI), ~250 lanzadores: fue la columna vertebral de su defensa en 2022.', 'El 30N6 puede ir sobre la torre 40V6M (antena a ~24 m) o 40V6MD (~39 m): con 24 m ve un blanco a 25 m de altura a ~41 km.', 'Misiles soviéticos escasos: no hay producción nueva.'],
    sources: [WP('S-300_missile_system'), SRC.rusi_prelim, SRC.apa_fc, SRC.apa_40v6]
  },
  buk: {
    name: 'Buk-M1 (9M38)', short: 'Buk-M1', side: 'both', kind: 'sam', color: '#62b6ff',
    datalinks: ['ua_c2', 'ru_c2'],
    radar: { name: '9S35 Fire Dome (+9S18M1 Snow Drift)', band: 'X', mti: 'mti', R1: 50, mast: 4, mastRange: [4, 4], mastNote: 'Fija: radar sobre el vehículo de orugas (altura estimada).', sector: 360, eccm: 3, scan: 2 },
    sam: { maxR: 35, maxRtbm: 10, minR: 3.3, altMin: 15, altMax: 22000, vInt: 650, vmax: 850, tb: 15, vmaxT: 830, react: 22, ch: 3, mag: 12, reserve: 12, reloadS: 780, salvo: 2, guid: 'SARH', shot: '9M38', cost: 0.5, pk: { dron: 0.55, crucero: 0.5, supersonico: 0.35, balistico: 0.05, hiper: 0 } },
    range: '3,3–35 km, techo 22 km', interceptor: '9M38: ≈Mach 3, semiactivo: el radar del lanzador tiene que iluminar el blanco hasta el impacto',
    notes: ['Lo usan ambos bandos (Rusia con versiones M2/M3). Ucrania tenía 15 divisiones en 2022.', 'El 9S18M1 (banda centimétrica) detecta a ~85 km a altura; a 100 m de altura solo ~35 km.', 'Ucrania adaptó lanzadores Buk para disparar RIM-7 Sea Sparrow ("FrankenSAM").'],
    sources: [WP('Buk_missile_system'), SRC.missilery_buk, SRC.rusi_prelim]
  },
  gepard: {
    name: 'Flakpanzer Gepard (2×35 mm)', short: 'Gepard', side: 'UA', kind: 'gun', color: '#62b6ff',
    datalinks: [],
    radar: { name: 'Búsqueda S + seguimiento Ku', band: 'S', mti: 'pd', R1: 15, mast: 3, mastRange: [3, 3], mastNote: 'Fija: radar sobre la torreta (altura estimada).', sector: 360, eccm: 0, scan: 1 },
    sam: { maxR: 4, maxRtbm: 0, minR: 0.1, altMin: 0, altMax: 3000, vInt: 1100, vmaxT: 400, react: 3, ch: 1, mag: 20, reserve: 20, reloadS: 900, salvo: 1, guid: 'cañón', shot: 'ráfaga 35 mm', cost: 0.018, pk: { dron: 0.55, crucero: 0.35, supersonico: 0.05, balistico: 0, hiper: 0 } },
    range: '≈3,5–4 km típico (5,5 km con FAPDS)', interceptor: 'Dos cañones Oerlikon 35 mm, 550 disparos/min cada uno, 640 proyectiles a bordo',
    notes: ['Considerado de los mejores "mata-Shahed".', 'Cada proyectil cuesta ~US$600 (Rheinmetall, 2025): una ráfaga de 20–40 disparos sale US$12–24k.', 'El cuello de botella es la munición de 35 mm; inútil si el dron vuela por encima de ~3 km.'],
    sources: [WP('Flakpanzer_Gepard'), SRC.forbes_gepard]
  },
  mfg: {
    name: 'Grupo de fuego móvil (ametralladora + reflector)', short: 'Grupo móvil', side: 'UA', kind: 'gun', color: '#62b6ff',
    datalinks: [],
    radar: { name: 'Visual / térmico', band: 'OPT', R1: 5, mast: 2, mastRange: [2, 2], mastNote: 'Fija: ojos y óptica del equipo.', sector: 360, eccm: 99, scan: 1 },
    sam: { maxR: 1.5, maxRtbm: 0, minR: 0, altMin: 0, altMax: 1500, vInt: 800, vmaxT: 250, react: 5, ch: 1, mag: 30, reserve: 60, reloadS: 120, salvo: 1, guid: 'cañón', shot: 'ráfaga 12,7 mm', cost: 0.0003, pk: { dron: 0.2, crucero: 0.05, supersonico: 0, balistico: 0, hiper: 0 } },
    range: '≈1,5 km', interceptor: 'Pickup con ametralladora pesada (DShK/M2), reflector y visor térmico',
    notes: ['Muy barato, se reubica rápido y aprovecha la alerta de la red acústica.', 'Por eso Rusia subió la altura de vuelo de los Shahed a 2–5 km.'],
    sources: [WP('HESA_Shahed_136'), SRC.u24_high]
  },
  manpads: {
    name: 'MANPADS (Stinger / Igla)', short: 'MANPADS', side: 'both', kind: 'sam', color: '#62b6ff',
    datalinks: [],
    radar: { name: 'Visual / IR', band: 'OPT', R1: 7, mast: 2, mastRange: [2, 2], mastNote: 'Fija: el tirador.', sector: 360, eccm: 99, scan: 1 },
    sam: { maxR: 4.8, maxRtbm: 0, minR: 0.2, altMin: 10, altMax: 3800, vInt: 550, vmaxT: 400, react: 6, ch: 1, mag: 4, reserve: 4, reloadS: 60, salvo: 1, guid: 'IR', shot: 'FIM-92 Stinger', cost: 0.45, pk: { dron: 0.5, crucero: 0.4, supersonico: 0.05, balistico: 0, hiper: 0 } },
    range: '≈4,8 km, techo ≈3,8 km', interceptor: 'Misil portátil con buscador infrarrojo (Stinger Mach 2,2; Igla ≈570 m/s)',
    notes: ['Stinger: más de US$400k; Igla: ~US$60–80k (dato viejo).', 'Se usan en grupos móviles y contra helicópteros. Las bengalas los degradan.'],
    sources: [WP('FIM-92_Stinger'), WP('9K38_Igla')]
  },
  intdrone: {
    name: 'Drones interceptores (tipo Sting)', short: 'Interceptores', side: 'UA', kind: 'sam', color: '#62b6ff',
    datalinks: ['ua_c2'],
    radar: null,
    sam: { maxR: 25, maxRtbm: 0, minR: 0.3, altMin: 50, altMax: 3000, vInt: 85, vmaxT: 95, react: 20, ch: 4, mag: 20, reserve: 20, reloadS: 600, salvo: 1, guid: 'operador', shot: 'dron interceptor', cost: 0.003, pk: { dron: 0.6, crucero: 0.05, supersonico: 0, balistico: 0, hiper: 0 } },
    range: '≈25 km', interceptor: 'Ala/cuadricóptero rápido (Sting: 343 km/h, techo 3.000 m, cámara térmica) guiado por operador',
    notes: ['No tiene sensor propio: necesita pista de la red (radar o acústica). Sin red, no sirve.', 'Sting cuesta ~US$2.100. Interceptores: >70% de los Shahed derribados sobre Kyiv en feb-2026 y ~1/3 de los blancos a nivel nacional en mar-2026, con >60% de éxito por salida.', 'Contra un Geran-3 (≈300–370 km/h) solo funciona de frente: el primer derribo fue en nov-2025.'],
    sources: [WP('Sting_(drone)'), SRC.ukr_sting, SRC.dn_interceptors, SRC.mil_geran3]
  },
  hawk: {
    name: 'MIM-23B I-Hawk (Fase III)', short: 'Hawk', side: 'UA', kind: 'sam', color: '#62b6ff',
    datalinks: [],
    radar: { name: 'AN/MPQ-61 HPIR (+ AN/MPQ-50 PAR, AN/MPQ-62 CWAR)', band: 'X', mti: 'pd', R1: 70, mast: 4, mastRange: [4, 4], mastNote: 'Fija: radares sobre remolques (altura estimada).', sector: 360, eccm: 5, scan: 2 },
    sam: { maxR: 40, maxRtbm: 0, minR: 1.5, altMin: 60, altMax: 17700, vInt: 700, vmaxT: 820, react: 15, ch: 2, mag: 9, reserve: 9, reloadS: 1200, salvo: 2, guid: 'SARH', shot: 'MIM-23B', cost: 0.3, pk: { dron: 0.6, crucero: 0.7, supersonico: 0.4, balistico: 0, hiper: 0 } },
    range: '1,5–40 km, techo ≈17 km', interceptor: 'MIM-23B: ≈Mach 2,5, semiactivo: el HPIR ilumina el blanco hasta el impacto',
    notes: ['España entregó baterías Fase III desde fines de 2022 (21 lanzadores, radares MPQ-61 y MPQ-62) y más lanzadores en 2023–24; EE. UU. aportó misiles.', 'Una sola unidad ucraniana reclamó 14 misiles de crucero y 40 Shahed derribados.', 'Cada HPIR guía contra un blanco a la vez: dos secciones de fuego = dos canales.'],
    sources: [WP('MIM-23_Hawk'), SRC.mil_hawk, SRC.db_hawk, SRC.cmo_db3k_sam]
  },
  s125: {
    name: 'S-125 Pechora / Newa-SC (modernizado)', short: 'S-125', side: 'UA', kind: 'sam', color: '#62b6ff',
    datalinks: ['ua_c2'],
    radar: { name: 'SNR-125 "Low Blow" (+ P-18/P-19 de búsqueda)', band: 'X', mti: 'none', R1: 40, mast: 4, mastRange: [4, 6], mastNote: 'Cabina de radar sobre remolque; la versión polaca Newa-SC va sobre chasis MAZ-543 (≈4–6 m, estimado).', sector: 360, eccm: 3, scan: 2 },
    sam: { maxR: 25, maxRtbm: 0, minR: 2.5, altMin: 25, altMax: 18000, vInt: 600, vmax: 1000, tb: 3, vmaxT: 700, react: 25, ch: 1, mag: 8, reserve: 8, reloadS: 1500, salvo: 2, guid: 'mando', shot: '5V27', cost: 0.15, pk: { dron: 0.45, crucero: 0.55, supersonico: 0.3, balistico: 0, hiper: 0 } },
    range: '2,5–25 km, techo 18 km', interceptor: '5V27: guiado por radiocomando desde el SNR-125 (un blanco a la vez)',
    notes: ['Sistema de los años 60, modernizado en Ucrania y en Polonia (Newa-SC, digital y sobre chasis con orugas o ruedas).', 'En su primer combate un S-125 ucraniano derribó un Kalibr; muy bueno a baja altura para su edad.', 'Un solo canal: se satura enseguida con oleadas.'],
    sources: [WP('S-125_Neva/Pechora'), SRC.mil_newa, SRC.kp_s125, SRC.cmo_db3k_sam]
  },
  s200: {
    name: 'S-200V Vega (5V28)', short: 'S-200', side: 'UA', kind: 'sam', color: '#62b6ff',
    datalinks: ['ua_c2'],
    radar: { name: '5N62 "Square Pair" (iluminación; búsqueda con P-14/radar de la red)', band: 'C', mti: 'pd', R1: 250, mast: 8, mastRange: [8, 8], mastNote: 'Fija: antena del 5N62 sobre su base (altura estimada).', sector: 120, eccm: 3, scan: 4 },
    sam: { maxR: 250, maxRtbm: 0, minR: 17, altMin: 300, altMax: 40000, vInt: 1100, vmaxT: 1180, react: 60, ch: 1, mag: 6, reserve: 6, reloadS: 3600, salvo: 2, guid: 'SARH', shot: '5V28', cost: 0.6, pk: { dron: 0.2, crucero: 0.25, supersonico: 0.2, balistico: 0, hiper: 0 } },
    range: '17–250 km, techo ≈40 km; no baja de 300 m', interceptor: '5V28: misil de 7 t con cohetes aceleradores, semiactivo (el 5N62 ilumina hasta el impacto)',
    notes: ['Ucrania lo reactivó en 2022 (con aporte polaco) para cazar aviones: se le atribuyen un A-50 y un Tu-22M3 a ≈300 km. También se adaptó como misil de ataque a tierra.', 'Contra drones y misiles de crucero es un desperdicio: lento para reaccionar, un solo canal y piso de 300 m.', 'El juego todavía no tiene aviones como blanco: acá solo puede enfrentar drones altos, planeadoras y misiles.'],
    sources: [WP('S-200_(missile)'), SRC.twz_s200, SRC.dua_s200, SRC.cmo_db3k_sam]
  },
  pantsir: {
    name: 'Pantsir-S1', short: 'Pantsir', side: 'RU', kind: 'sam', color: '#ff9f5a',
    datalinks: ['ru_c2'],
    radar: { name: '1RS1 búsqueda (S) + 1RS2 seguimiento (Ku)', agile: true, band: 'S', mti: 'pd', R1: 30, mast: 6, mastRange: [6, 6], mastNote: 'Fija: radares sobre el camión (altura estimada).', sector: 360, eccm: 5, scan: 1 },
    sam: { maxR: 18, maxRtbm: 5, minR: 1, altMin: 5, altMax: 15000, vInt: 900, vmax: 1300, tb: 2, vmaxT: 1000, react: 5, ch: 3, mag: 12, reserve: 12, reloadS: 1800, salvo: 2, guid: 'mando', shot: '57E6', cost: 0.15, pk: { dron: 0.65, crucero: 0.6, supersonico: 0.3, balistico: 0.1, hiper: 0 } },
    range: '18–20 km misil, 4 km cañones', interceptor: '57E6: 1.300 m/s al apagar el motor, ≈900 m/s promedio a 12 km; guiado por mando radio, ojiva de varillas',
    notes: ['Radar de búsqueda: 36 km contra 2 m², 20 km contra un misil de crucero de 0,1 m².', 'Defensa de punto de las baterías S-400.', 'Recibió parches de software para HIMARS y Storm Shadow; aun así se registraron muchas pérdidas.'],
    sources: [WP('Pantsir_missile_system'), SRC.apa_pantsir, SRC.gs_57e6]
  },
  tor: {
    name: 'Tor-M2', short: 'Tor-M2', side: 'RU', kind: 'sam', color: '#ff9f5a',
    datalinks: ['ru_c2'],
    radar: { name: 'Búsqueda (banda F ≈ S) + seguimiento (G/H y Ku)', agile: true, band: 'S', mti: 'pd', R1: 25, mast: 4, mastRange: [4, 4], mastNote: 'Fija: radar sobre el vehículo de orugas (altura estimada).', sector: 360, eccm: 5, scan: 1 },
    sam: { maxR: 15, maxRtbm: 5, minR: 1, altMin: 10, altMax: 10000, vInt: 700, vmax: 1000, tb: 4, vmaxT: 700, react: 6, ch: 4, mag: 16, reserve: 8, reloadS: 1080, salvo: 1, guid: 'mando', shot: '9M338', cost: 0.3, pk: { dron: 0.75, crucero: 0.7, supersonico: 0.35, balistico: 0.1, hiper: 0 } },
    range: '15–16 km, techo 10 km', interceptor: '9M338: lanzamiento vertical, guiado por mando',
    notes: ['Defensa de punto contra drones, bombas planeadoras y misiles de crucero.', '4 blancos y 8 misiles simultáneos; 16 misiles en el M2 (8 en el M2E).'],
    sources: [WP('Tor_missile_system'), SRC.gs_9m338, SRC.ar_tor]
  },
  s400: {
    name: 'S-400 (48N6DM)', short: 'S-400', side: 'RU', kind: 'sam', color: '#ff9f5a',
    datalinks: ['ru_c2'],
    radar: { name: '92N6 Grave Stone (en torre 40V6M)', agile: true, lowSL: true, slc: 1, band: 'X', mti: 'pd', R1: 200, mast: 25, mastRange: [7, 39], mastNote: 'Sin torre, la antena queda a ≈7 m sobre su vehículo (estimado); en la torre 40V6M a ≈25 m y en la 40V6MD a ≈39 m (Air Power Australia). Armar la torre lleva 1–2 h, no se cambia durante el combate.', sector: 120, eccm: 8, scan: 2 },
    sam: { maxR: 250, maxRtbm: 60, minR: 3, altMin: 10, altMax: 27000, vInt: 1500, vmax: 2000, tb: 12, vmaxT: 4800, react: 9, ch: 10, mag: 32, reserve: 16, reloadS: 2400, salvo: 2, guid: 'TVM', shot: '48N6', noDrones: true, cost: 1.5, pk: { dron: 0.75, crucero: 0.7, supersonico: 0.6, balistico: 0.5, hiper: 0.3 } },
    range: '48N6DM: 240–250 km; 40N6: hasta 380–400 km', interceptor: '48N6: ≈2.000 m/s, guiado TVM; 9M96E2 (activo) para corto/medio alcance',
    notes: ['Ucrania destruyó varios radares (92N6, 96L6, 91N6) y lanzadores con ATACMS, Neptune y drones.', 'Contra blancos rasantes su alcance real lo pone el horizonte de radar, no el misil.', 'Precio por misil no publicado: estimación US$1–2 M.'],
    sources: [WP('S-400_missile_system'), SRC.csis_s400, SRC.ar_92n6]
  },
  ewr: {
    name: 'Radar de vigilancia 3D (36D6 / ST-68UM)', short: 'Radar 3D', side: 'both', kind: 'sensor', color: '#62b6ff',
    datalinks: ['ua_c2', 'ru_c2'],
    radar: { name: '36D6 "Tin Shield"', slc: 2, band: 'S', mti: 'mti', R1: 175, mast: 10, mastRange: [10, 39], mastNote: 'Sobre su remolque ≈10 m (estimado); puede ir en la torre 40V6M/MD hasta ≈39 m (Air Power Australia). Armar la torre lleva 1–2 h.', sector: 360, eccm: 3, scan: 5 },
    range: '200 km instrumentados; contra 1 m² a 50 m de altura ≈110–115 km con mástil', notes: ['Radar de alerta y adquisición que alimenta a las baterías S-300. Rota a 6 o 12 rpm.', 'Podés subirle el mástil (torre 40V6M) para ver más lejos a baja cota.'],
    sources: [SRC.rt_36d6, SRC.uos_36d6]
  },
  p18: {
    name: 'P-18 / P-18MR (VHF)', short: 'Radar VHF', side: 'both', kind: 'sensor', color: '#62b6ff',
    datalinks: ['ua_c2', 'ru_c2'],
    radar: { name: 'P-18MR', band: 'VHF', mti: 'mti', R1: 160, mast: 8, mastRange: [8, 8], mastNote: 'Fija: antenas Yagi sobre su soporte (altura estimada).', sector: 360, eccm: 0, scan: 6 },
    range: 'P-18MR contra 1 m²: 35 km a 100 m de altura, 120 km a 5 km', notes: ['En VHF las formas furtivas pierden efecto: la RCS del Kh-101 o del Storm Shadow "crece" mucho.', 'Precisión pobre: sirve para alerta y para pasar pistas a la red, no para guiar misiles.'],
    sources: [WP('P-18_radar'), SRC.dx_p18]
  },
  acoustic: {
    name: 'Nodo acústico (red Sky Fortress)', short: 'Acústico', side: 'UA', kind: 'acoustic', color: '#62b6ff',
    datalinks: ['ua_c2'],
    radar: { name: 'Micrófonos en red', band: 'ACU', R1: 5, mast: 0, mastRange: [0, 0], mastNote: 'Micrófonos a nivel del suelo.', sector: 360, eccm: 99, scan: 2, altMax: 3000 },
    range: '≈5 km por grupo de sensores (cada micrófono oye 1–3 km)', notes: ['~10.000 sensores de US$400–500 c/u conectados por celular.', 'Solo detecta drones con motor; no ve misiles ni blancos muy altos.', 'Inmune a la interferencia de radar y al RCS.'],
    sources: [WP('Sky_Fortress_(drone_defense_system)'), SRC.odessa_sf]
  },
  aew_s340: {
    name: 'Saab 340 AEW (ASC 890, Erieye)', short: 'Saab AEW', side: 'UA', kind: 'aew', color: '#62b6ff', alt: 6000,
    datalinks: ['l16'],
    radar: { name: 'Erieye (AESA, lateral)', agile: true, lowSL: true, band: 'S', mti: 'pd', R1: 240, mast: 6000, sector: 150, side: true, eccm: 10, scan: 4 },
    range: '≈330–350 km contra cazas; 450 km instrumentados', notes: ['Suecia lo anunció en mayo de 2024; la transferencia se confirmó en agosto de 2025 y opera en combate desde marzo de 2026.', 'Antena lateral "tabla": ve a ambos costados (~150° c/u) y tiene zonas ciegas adelante y atrás. Orientá el rumbo de vuelo.', 'Desde 6 km de altura ve misiles rasantes a más de 100 km, donde un radar terrestre no llega.'],
    sources: [WP('Saab_340_AEW&C'), WP('Erieye'), SRC.dx_saab, SRC.gs_erieye]
  },
  aew_a50: {
    name: 'Beriev A-50U', short: 'A-50U', side: 'RU', kind: 'aew', color: '#ff9f5a', alt: 9000,
    datalinks: ['ru_c2'],
    radar: { name: 'Shmel-M (rotodomo)', band: 'S', mti: 'pd', R1: 230, mast: 9000, sector: 360, eccm: 5, scan: 10 },
    range: '≈650 km contra blancos grandes; 150 pistas dentro de 230 km', notes: ['Rusia perdió dos A-50 en 2024 (14/1 y 23/2).', 'Rotodomo de 360°. La banda del Shmel-M no es pública (se asume S).'],
    sources: [WP('Beriev_A-50')]
  }
};
