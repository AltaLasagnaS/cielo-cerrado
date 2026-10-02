// ===================== CATÁLOGO =====================
// Bandas, amenazas, tasas observadas, defensas e interferidores.

const BANDS = {
  VHF: { name: 'VHF (banda métrica)', bw: 6, note: 'Longitud de onda ~1–2 m: el "stealth" por forma pierde efecto (resonancia), pero precisión pobre: sirve para alerta, no para guiar misiles.' },
  L: { name: 'Banda L', bw: 3, note: 'Alerta temprana de largo alcance.' },
  S: { name: 'Banda S (E/F OTAN)', bw: 2, note: 'Buen compromiso alcance/clima; típica en radares de vigilancia 3D y AEW.' },
  C: { name: 'Banda C (G/H OTAN)', bw: 1.5, note: 'Radares multifunción de defensa aérea (Patriot, TRML-4D del IRIS-T).' },
  X: { name: 'Banda X (I/J OTAN)', bw: 1, note: 'Control de tiro: buena resolución, menos alcance y más afectada por lluvia.' },
  Ku: { name: 'Banda Ku/Ka', bw: 0.8, note: 'Seguimiento de alta precisión a corto alcance, buscadores de misiles.' },
  ACU: { name: 'Acústico', bw: 360, note: 'Red de micrófonos: detecta motores de pistón/jet a pocos km. Inmune a RCS e interferencia radar.' },
  OPT: { name: 'Óptico / IR', bw: 360, note: 'Detección visual/térmica: alcance corto, necesita línea de vista.' }
};


const CLS_NAME = { dron: 'Dron de ataque / señuelo', crucero: 'Misil de crucero subsónico', supersonico: 'Misil supersónico', balistico: 'Balístico / aerobalístico', hiper: 'Hipersónico (planeo/crucero)' };

// prof: drone | cruise | bunt | ballistic | highdive | hilo
// Los números de abajo se sobrescriben con UNC[...].p al cargar (applyProbable); se dejan iguales para leer el archivo.
const THREATS = {
  shahed: {
    name: 'Shahed-136 / Geran-2', short: 'Shahed', side: 'RU', cls: 'dron', prof: 'drone',
    v: 51, agl: 2000, aglRange: [50, 5000], rcs: 0.05, rcsVHF: 0.3, gnss: 0.5, cep: 15, warhead: '50 kg (BCh-50); 90 kg (BCh-90, 62 kg de explosivo)', range: '≈1.350–1.800 km típico; 2.500 km máx. declarado; ≈650 km con ojiva de 90 kg',
    cost: 0.035, costNote: 'Producción rusa US$20–80k (CSIS usa 35k); el precio de importación iraní era US$193k', maneuver: false,
    guidance: 'INS + GNSS con antena CRPA "Kometa-M" de 4–16 elementos', engine: 'Motor de pistón MD-550 (copia del Limbach L550E), hélice propulsora',
    profile: 'Vuela lento (≈185 km/h). Desde 2025 crucero a 2–5 km de altura para quedar fuera del alcance de ametralladoras y luego pica casi vertical sobre el blanco.',
    notes: ['Se lanzan en oleadas de cientos por noche: 54.538 drones tipo Shahed en 2025, ~40% señuelos (ISIS).', 'Neutralización mensual 83–93% entre ago-2025 y may-2026, sumando derribos y "pérdidas" por guerra electrónica (ISIS).', 'Red acústica Sky Fortress (~10.000 micrófonos) para detectarlos a baja cota.', 'RCS: el único estudio técnico (Járkov, 2023) da mediana 0,23 m² en todos los aspectos; de frente queda en ~0,05 m².'],
    sources: [WP('HESA_Shahed_136'), SRC.csis_geran, SRC.kharkiv_rcs]
  },
  geran3: {
    name: 'Geran-3 (Shahed a reacción)', short: 'Geran-3', side: 'RU', cls: 'dron', prof: 'drone',
    v: 92, agl: 1500, aglRange: [100, 5000], rcs: 0.05, rcsVHF: 0.3, gnss: 0.5, cep: 15, warhead: '≈50 kg termobárica-fragmentación (TBBCh-50)', range: '≈1.000 km (GUR)',
    cost: 0.07, costNote: 'Sin cifra oficial: ≈Geran-2 + 40% (el motor JT80 cuesta US$18–35k en el mercado civil)', maneuver: false,
    guidance: 'INS + GNSS con CRPA Kometa-M12', engine: 'Turbojet chino Telefly JT80 (confirmado por el GUR en un ejemplar capturado)',
    profile: 'Crucero ≈300 km/h, hasta ≈370 km/h al cruzar zonas defendidas (GUR). Los 550–600 km/h que circulan son del Shahed-238 iraní, no de este.',
    notes: ['Uso regular desde junio de 2025; primer derribo con dron interceptor Sting el 30/11/2025.', 'La inteligencia ucraniana informó en 2026 que se frenó su producción en transición al Geran-4.', 'Firma térmica y sonora mayor que el Geran-2: más fácil de oír, más difícil de alcanzar para interceptores lentos.'],
    sources: [SRC.dx_geran3, SRC.forbes_geran3, SRC.mil_geran3, SRC.csis_s238]
  },
  gerbera: {
    name: 'Gerbera (señuelo)', short: 'Gerbera', side: 'RU', cls: 'dron', prof: 'drone', decoy: true,
    v: 40, agl: 1200, aglRange: [100, 3000], rcs: 0.02, rcsVHF: 0.1, gnss: 0.3, cep: 50, warhead: 'Ninguna en la mayoría (algunas 2,5–5 kg o cámara)', range: '300–600 km',
    cost: 0.01, costNote: '≈US$10k según funcionarios ucranianos: espuma y terciado, motor de aeromodelismo', maneuver: false,
    guidance: 'INS + GNSS', engine: 'Motor de pistón chico (DLE60 / 70 cc)',
    profile: 'Imita a un Shahed en trayecto. Su único trabajo es hacer gastar munición y saturar canales de tiro.',
    notes: ['Primer uso en julio de 2024; Alabuga produce hasta ~50 por día (ISIS).', 'La espuma es casi transparente al radar: lo que refleja es el motor y la electrónica, por eso su RCS es menor que la del Shahed.', 'Otro señuelo, el "Parodiya", lleva lente de Luneburg y puede verse más grande que un Shahed en el radar.'],
    sources: [WP('Gerbera_(drone)'), SRC.isis_decoy, SRC.kp_gerbera]
  },
  kh101: {
    name: 'Kh-101 (misil de crucero aéreo)', short: 'Kh-101', side: 'RU', cls: 'crucero', prof: 'cruise', lo: true, ir: true,
    v: 200, agl: 50, aglRange: [30, 300], rcs: 0.03, rcsVHF: 0.5, gnss: 0.7, cep: 15, warhead: '400–480 kg; ≈800 kg en la variante de dos ojivas', range: '≈2.500–2.800 km (CSIS); hasta 3.500 km según otras fuentes',
    cost: 2.2, costNote: 'Contratos rusos filtrados: US$2,0 M (2024) y 2,0–2,4 M (2025). Forbes Ukraine estimaba US$13 M', maneuver: false,
    guidance: 'INS + GLONASS + correlación óptica del terreno + buscador terminal TV/IR', engine: 'Turbofán TRDD-50A',
    profile: 'Crucero a 700–720 km/h y 30–70 m sobre el terreno en la fase final, siguiendo valles para esconderse del radar. Forma de baja firma.',
    notes: ['Lanzado desde Tu-95MS y Tu-160 fuera del alcance ucraniano.', 'Desde fines de 2023 lleva dispensador de bengalas (módulo L-504, activo a 3–5 km del blanco); en 2026 se reportó además el sistema SP-504 de autoprotección electrónica.', 'A 50 m de altura, el horizonte de un radar con mástil de 10 m es de ~42 km: por eso importan los mástiles altos y los AEW.'],
    sources: [SRC.csis_kh101, SRC.twz_flares, SRC.twz_2wh, SRC.ep_sp504, SRC.costs_leak]
  },
  kalibr: {
    name: '3M-14 Kalibr (crucero naval)', short: 'Kalibr', side: 'RU', cls: 'crucero', prof: 'cruise',
    v: 240, agl: 50, aglRange: [20, 300], rcs: 0.1, rcsVHF: 0.5, gnss: 0.7, cep: 10, warhead: '≈450–500 kg', range: '1.500–2.500 km (CSIS)',
    cost: 2.0, costNote: 'Contratos rusos filtrados: ≈US$2 M. Forbes Ukraine estimaba 6,5 M', maneuver: false,
    guidance: 'INS + GLONASS + correlación de terreno + buscador terminal', engine: 'Turbojet/turbofán con booster de lanzamiento',
    profile: 'Subsónico (Mach 0,7–0,8), ≈20 m sobre el agua y 50–150 m sobre tierra.',
    notes: ['Lanzado desde corbetas, fragatas y submarinos del Mar Negro y el Caspio.', 'La estadística ucraniana lo agrupa con Kh-101/555 e Iskander-K: 66,6% interceptados entre feb-2022 y ago-2024.'],
    sources: [SRC.csis_kalibr, WP('Kalibr_(missile_family)'), SRC.costs_leak]
  },
  isk_k: {
    name: '9M728 Iskander-K (crucero)', short: '9M728', side: 'RU', cls: 'crucero', prof: 'cruise',
    v: 250, agl: 50, aglRange: [20, 1000], rcs: 0.1, rcsVHF: 0.5, gnss: 0.7, cep: 10, warhead: '≈480–500 kg', range: '≈500 km (publicado)',
    cost: 1.6, costNote: 'Contratos rusos filtrados: ≈US$1,5–1,7 M', maneuver: false,
    guidance: 'INS + GNSS + buscador radar terminal (se activa a ~20 km)', engine: 'Turbofán',
    profile: 'Versión de crucero terrestre del sistema Iskander, derivada de la familia Kalibr. Puede bajar a pocos metros en la aproximación final.',
    notes: ['Se lanza desde el mismo camión que el Iskander-M: el defensor no sabe de antemano si viene balístico o crucero.', 'Ucrania contabilizó 261 Iskander-K derribados hasta feb-2026 (ISW).'],
    sources: [SRC.rusi_isk22, WP('9K720_Iskander'), SRC.costs_leak]
  },
  isk_m: {
    name: '9M723 Iskander-M (cuasibalístico)', short: 'Iskander-M', side: 'RU', cls: 'balistico', prof: 'ballistic',
    v: 1150, apogee: 45, launchDist: 300, rcs: 0.1, rcsVHF: 0.3, gnss: 0.9, cep: 25, warhead: '450–700 kg', range: '390–500 km (9M723-2: ≈550 km)',
    cost: 2.7, costNote: 'Contratos rusos filtrados: US$2,4–3,0 M', maneuver: true, decoys: 6, manPk: 0.6,
    guidance: 'INS + GNSS (Kometa) + buscador óptico/radar terminal', engine: 'Cohete de combustible sólido, una etapa',
    profile: 'Trayectoria aplanada con apogeo típico de 40–50 km; hasta 2.100 m/s, ≈1.300–1.400 m/s cerca del blanco (GUR). Maniobra terminal y señuelos.',
    notes: ['Lleva señuelos 9B899 (RUSI escribe 9B999): unos 6 por misil, con emisor RF e IR.', 'Desde fines de 2025 una actualización de software agrega picada empinada o viraje terminal: la intercepción cayó de 37% (ago-2025) a 6% (sep-2025) según el FT.', 'RUSI encontró una distribución bimodal: en 273 de 345 ataques no se interceptó ninguno; cuando hay Patriot bien ubicado se intercepta casi todo.', 'CEP: 5–7 m es el valor de folleto; el GUR da 20–30 m.'],
    sources: [SRC.gur_isk, SRC.rusi_isk25, SRC.ft_aerotime, SRC.twz_9b899, SRC.costs_leak]
  },
  kinzhal: {
    name: 'Kh-47M2 Kinzhal (aerobalístico)', short: 'Kinzhal', side: 'RU', cls: 'balistico', prof: 'ballistic',
    v: 1250, apogee: 45, launchDist: 450, rcs: 0.1, rcsVHF: 0.3, gnss: 0.9, cep: 20, warhead: '≈480 kg', range: '≈460–480 km tras el lanzamiento',
    cost: 4.5, costNote: 'Contratos rusos filtrados: ≈US$4,5 M. Forbes Ukraine estimaba 10–15 M', maneuver: true, manPk: 0.8,
    guidance: 'INS + corrección en vuelo + buscador terminal', engine: 'Cohete sólido (derivado del Iskander)',
    profile: 'Lanzado desde MiG-31K. Rusia lo vende como "Mach 10", pero un operador de Patriot midió ≈1.240 m/s (Mach 3,6) en el momento de la intercepción.',
    notes: ['Primer derribo confirmado por Patriot sobre Kyiv el 4/5/2023.', '111 lanzados y 28 interceptados (25%) hasta ago-2024.', 'Técnicamente es un balístico aerolanzado, no un hipersónico maniobrable.'],
    sources: [WP('Kh-47M2_Kinzhal'), SRC.csis_kinzhal, SRC.syrskyi, SRC.costs_leak]
  },
  kh22: {
    name: 'Kh-22 / Kh-32 (supersónico pesado)', short: 'Kh-22', side: 'RU', cls: 'supersonico', prof: 'highdive',
    v: 1100, vDive: 1100, cruiseAlt: 27000, diveDist: 35, launchDist: 450, rcs: 1, rcsVHF: 3, gnss: 1, cep: 150, warhead: '≈950–1.000 kg (Kh-32: ≈500 kg)', range: '≈600 km (Kh-32: hasta 1.000 km)',
    cost: 1, costNote: 'Stock soviético: estimación ucraniana ≈US$1 M (no figura en los contratos filtrados)', maneuver: false,
    guidance: 'INS + buscador radar activo (antibuque)', engine: 'Cohete de combustible líquido R-201',
    profile: 'Sube a ≈27 km, vuela a Mach 3,5–4,6 y pica casi vertical. Muy impreciso contra blancos terrestres porque el buscador es antibuque.',
    notes: ['Hasta ago-2024: 2 interceptados de 362 lanzados (0,55%).', 'Según la Fuerza Aérea, solo 3 de más de 400 se habían derribado antes de feb-2026; el 2/2/2026 se derribaron 9 de 12 sobre Kyiv. La diferencia es estar dentro de la cobertura Patriot/SAMP-T.', 'Enorme (11,6 m) y nada furtivo: se ve de lejos, el problema es la velocidad y el ángulo de picada.'],
    sources: [WP('Kh-22'), SRC.syrskyi, SRC.rbc_kh22, SRC.ep_costs]
  },
  oniks: {
    name: 'P-800 Oniks (supersónico antibuque)', short: 'Oniks', side: 'RU', cls: 'supersonico', prof: 'hilo',
    v: 750, vLow: 680, cruiseAlt: 14000, agl: 15, launchDist: 250, rcs: 0.3, rcsVHF: 1, gnss: 1, cep: 20, warhead: '200–300 kg', range: '300 km exportación; ≈600 km versión rusa',
    cost: 1.25, costNote: 'Estimación Forbes Ukraine 2022: ≈US$1,25 M (no figura en los contratos filtrados)', maneuver: true,
    guidance: 'INS + buscador radar activo/pasivo', engine: 'Estatorreactor (ramjet) + booster sólido',
    profile: 'Mach 2,6 a ~14 km y baja a 10–15 m para el tramo final, a Mach 2.',
    notes: ['Usado desde baterías costeras Bastion-P contra blancos terrestres.', '211 lanzados y 12 interceptados (5,7%) hasta ago-2024.', 'La toma de aire frontal es una cavidad que agranda su RCS de frente.'],
    sources: [WP('P-800_Oniks'), SRC.rbc_oniks, SRC.syrskyi]
  },
  zircon: {
    name: '3M22 Tsirkon (Zircon)', short: 'Tsirkon', side: 'RU', cls: 'hiper', prof: 'highdive',
    v: 1500, vDive: 1150, cruiseAlt: 30000, diveDist: 45, launchDist: 400, rcs: 0.15, rcsVHF: 0.5, gnss: 1, cep: 30, warhead: '≈120 kg (KNDISE: ≤40 kg de explosivo)', range: '≈1.000 km (declarado, sin confirmar)',
    cost: 5.4, costNote: 'Contratos rusos filtrados: US$5,2–5,6 M', maneuver: true, manPk: 0.85,
    guidance: 'INS + buscador radar activo', engine: 'Dos etapas de combustible sólido según el GUR y los restos analizados (Rusia declara scramjet)',
    profile: 'Rusia declara Mach 8–9. El GUR registró como máximo Mach 6,8; Defense Express estimó Mach 5,5 a mitad de vuelo y ≈4,5 en la aproximación. Crucero a 30–40 km y picada final.',
    notes: ['Dos derribados sobre Kyiv el 25/3/2024 (SAMP/T y Patriot).', 'Hasta ago-2024: 6 lanzados, 2 interceptados. Ucrania contabilizaba 11 derribados a feb-2026.'],
    sources: [SRC.gur_zircon, SRC.u24_zircon, SRC.dx_zircon, SRC.nv_zircon, SRC.costs_leak]
  },
  storm: {
    name: 'Storm Shadow / SCALP-EG', short: 'Storm Shadow', side: 'UA', cls: 'crucero', prof: 'bunt', lo: true,
    v: 275, agl: 35, aglRange: [30, 300], rcs: 0.05, rcsVHF: 0.5, gnss: 0.85, cep: 2, warhead: '450 kg BROACH (penetrante en tándem)', range: '≈250 km (exportación, la entregada a Ucrania); ≈550 km versión UK/FR',
    cost: 2.5, costNote: '≈£2 M (≈US$2,5 M, 2023); el precio original era £790k', maneuver: false,
    guidance: 'INS + GPS + TERPROM + buscador IR de imagen', engine: 'Turbojet Microturbo TRI 60-30',
    profile: 'Vuelo rasante a 30–40 m guiado por mapa de terreno; al final hace un "bunt": trepa para identificar el blanco con el IR y pica.',
    notes: ['Lanzado por Su-24 ucranianos adaptados.', 'Rusia reclamó decenas de intercepciones sin datos verificables; no hay tasa independiente.', 'El ascenso final lo expone por unos segundos a defensas de punto (Pantsir, Tor).'],
    sources: [WP('Storm_Shadow'), SRC.dmn_storm, SRC.dn_storm, SRC.aoav_storm]
  },
  atacms: {
    name: 'MGM-140 ATACMS', short: 'ATACMS', side: 'UA', cls: 'balistico', prof: 'ballistic',
    v: 1000, apogee: 40, launchDist: 250, rcs: 0.1, rcsVHF: 0.3, gnss: 0.6, cep: 10, warhead: '≈230 kg unitaria (M57) o submuniciones', range: '165 km (M39) / 300 km (M39A1, M48, M57)',
    cost: 1.5, costNote: '≈US$1,5 M (M39 actualizado a FY2022); M57 ≈1,7 M', maneuver: false,
    guidance: 'INS + GPS', engine: 'Cohete sólido, una etapa',
    profile: 'Balístico táctico lanzado desde HIMARS/M270, Mach 3+ en terminal. Apogeo hasta ~50 km en tiro máximo.',
    notes: ['Usado contra bases aéreas y baterías S-400.', 'El MoD ruso dijo derribar 5 de 6, 3 de 5 y 7 de 8 en noviembre de 2024; son cifras sin verificar y admitió impactos.', 'El GPS lo hace sensible a la interferencia GNSS rusa.'],
    sources: [WP('MGM-140_ATACMS'), SRC.csis_atacms, SRC.tass_atacms]
  },
  neptune: {
    name: 'R-360 Neptune', short: 'Neptune', side: 'UA', cls: 'crucero', prof: 'cruise',
    v: 260, agl: 15, aglRange: [5, 300], rcs: 0.1, rcsVHF: 0.5, gnss: 0.7, cep: 10, warhead: '150 kg (Long Neptune ≈260 kg)', range: '280–300 km (Long Neptune ≈1.000 km)',
    cost: 1.5, costNote: 'Sin cifra oficial; ≈US$1,5 M es una estimación de prensa', maneuver: true,
    guidance: 'INS + GNSS + buscador terminal', engine: 'Turbofán Motor Sich MS400 + booster',
    profile: 'Antibuque subsónico rasante (4–5 m sobre el agua en la fase final). Hundió al crucero Moskva en abril de 2022.',
    notes: ['La versión de ataque a tierra (más larga y gruesa) amplió el alcance a ~1.000 km.', 'Producción de ~100 por año en 2024.'],
    sources: [WP('R-360_Neptune'), SRC.mil_neptune, SRC.rbc_neptune]
  },
  lyutyi: {
    name: 'AN-196 Liutyi (dron de largo alcance)', short: 'Liutyi', side: 'UA', cls: 'dron', prof: 'drone',
    v: 56, agl: 500, aglRange: [50, 3000], rcs: 0.3, rcsVHF: 1, gnss: 0.5, cep: 10, warhead: '50–75 kg', range: '≈1.000–1.400 km (hasta 2.000 km con ojiva liviana)',
    cost: 0.2, costNote: '≈US$200k (reportado)', maneuver: false,
    guidance: 'INS + GNSS + terminal asistida por IA', engine: 'Motor de pistón bóxer con hélice',
    profile: 'Dron de ataque ucraniano de 250–300 kg usado contra refinerías y bases en Rusia.',
    notes: ['Usado en grandes oleadas contra infraestructura petrolera.', 'Más grande y metálico que un Shahed: su RCS estimada es mayor.'],
    sources: [WP('Liutyi'), SRC.emp_liutyi]
  },
  flamingo: {
    name: 'FP-5 Flamingo', short: 'Flamingo', side: 'UA', cls: 'crucero', prof: 'cruise',
    v: 245, agl: 35, aglRange: [15, 1000], rcs: 1, rcsVHF: 2, gnss: 0.6, cep: 14, warhead: '1.000–1.150 kg (declarado)', range: '3.000 km declarado; ≈950 km en línea recta demostrado',
    cost: 0.6, costNote: '"Un poco menos de US$600k" según la CEO de Fire Point (jul-2026)', maneuver: false,
    guidance: 'INS + GNSS con antena CRPA', engine: 'Turbofán AI-25TL reacondicionado + booster',
    profile: 'Misil de crucero grande y barato: crucero a 850–900 km/h y 20–40 m de altura. No es furtivo, apuesta a cantidad y alcance.',
    notes: ['Datos mayormente declarados por el fabricante.', 'Kyiv Post (jun-2026): de 34 lanzamientos, solo 5 impactos creíbles, sin separar intercepción de falla.'],
    sources: [WP('FP-5_Flamingo'), SRC.ukr_flamingo, SRC.kp_flamingo, SRC.mil_flamingo]
  }
};

// Tasas de intercepción reportadas (nivel nacional salvo que se indique). Se muestran en la ficha.
// [período, lanzados, derribados, tasa, fuente, nota]
const OBS = {
  shahed: [['feb-22 → ago-24', 13315, 8836, '63%', 'syrskyi', 'Shahed + Lancet'], ['mar → may-25', 7974, 4188, '52% derribo + 35% EW', 'isis_may25', 'incluye señuelos; 12,5% impactaron'], ['ago-25 → may-26', null, null, '83% → 93% neutralizados', 'isis_month', 'derribos + supresión EW'], ['jul-26', null, null, '87%', 'tt_jul26', 'todos los drones']],
  geran3: [],
  gerbera: [['2025', 54538, null, '—', 'isis_2025', '~40% de los drones tipo Shahed eran señuelos']],
  kh101: [['feb-22 → ago-24', null, null, '67%', 'syrskyi', 'crucero agrupado (Kalibr, Kh-101/555, Iskander-K)'], ['nov-25', 108, null, '70–85%', 'kd_monitor', 'crucero agrupado'], ['jul-26', 265, 187, '71%', 'tt_jul26', 'crucero agrupado'], ['feb-22 → feb-26', null, 2459, '—', 'isw_feb26', 'derribados acumulados']],
  kalibr: [['feb-22 → ago-24', null, null, '67%', 'syrskyi', 'crucero agrupado'], ['jul-26', 265, 187, '71%', 'tt_jul26', 'crucero agrupado'], ['feb-22 → feb-26', null, 709, '—', 'isw_feb26', 'derribados acumulados']],
  isk_k: [['feb-22 → ago-24', null, null, '67%', 'syrskyi', 'crucero agrupado'], ['feb-22 → feb-26', null, 261, '—', 'isw_feb26', 'derribados acumulados']],
  isk_m: [['feb-22 → ago-24', 1388, 62, '4,5%', 'syrskyi', 'incluye Tochka-U y KN-23, en su mayoría fuera de cobertura Patriot'], ['ene → may-25', 128, 20, '15%', 'rusi_isk25', 'Iskander-M + KN-23'], ['jun → sep-25', 179, 67, '37%', 'rusi_isk25', 'Iskander-M + Kinzhal'], ['sep-25', null, null, '6%', 'ft_aerotime', 'tras la actualización de maniobra'], ['1 → 24 oct-25', 78, 14, '17%', 'rusi_isk25', ''], ['jul-26', 195, 29, '15%', 'tt_jul26', 'escasez de PAC-3 MSE']],
  kinzhal: [['16 may-23 (Kyiv)', 6, 6, '100% (reclamado)', 'aerotime_k', 'junto con 9 Kalibr y 3 Iskander'], ['feb-22 → ago-24', 111, 28, '25%', 'syrskyi', ''], ['hasta 24 oct-25', 939, 227, '24%', 'rusi_isk25', 'Iskander-M + Kinzhal']],
  kh22: [['feb-22 → ago-24', 362, 2, '0,55%', 'syrskyi', 'Kh-22 + Kh-32'], ['2 feb-26 (Kyiv)', 12, 9, '75%', 'rbc_kh22', 'un solo ataque, dentro de cobertura Patriot']],
  oniks: [['feb-22 → ago-24', 211, 12, '5,7%', 'syrskyi', '']],
  zircon: [['feb-22 → ago-24', 6, 2, '33%', 'syrskyi', ''], ['25 mar-24 (Kyiv)', 2, 2, '100%', 'nv_zircon', 'SAMP/T y Patriot']],
  storm: [['2023', null, null, 'sin dato', 'dmn_storm', 'solo afirmaciones rusas, no verificables']],
  atacms: [['nov-24', 19, 15, '79% (reclamado)', 'tass_atacms', 'MoD ruso, sin verificar']],
  neptune: [], lyutyi: [],
  flamingo: [['hasta jun-26', 34, null, '5 impactos creíbles', 'kp_flamingo', 'no separa intercepción de falla']]
};

// ---------------- DEFENSAS ----------------
// kind: sam | gun | sensor | aew | acoustic
// radar: band, R1 (km para 1 m²), mast (m), sector (°), eccm (dB), scan (s)
// sam: maxR, maxRtbm, minR (km), altMin, altMax (m), vInt (m/s promedio), vmaxT (m/s), react (s), ch, mag, salvo, guid, pk{}, cost (M$ por disparo)
const DEFENSES = {
  patriot: {
    name: 'Patriot (PAC-3 MSE)', short: 'Patriot', side: 'UA', kind: 'sam', color: '#62b6ff',
    radar: { name: 'AN/MPQ-65', band: 'C', R1: 100, mast: 4, sector: 90, eccm: 10, scan: 2 },
    sam: { maxR: 100, maxRtbm: 40, minR: 3, altMin: 50, altMax: 36000, vInt: 1300, vmaxT: 3000, react: 9, ch: 8, mag: 16, salvo: 2, guid: 'activo', shot: 'PAC-3 MSE', noDrones: true, cost: 4.2, pk: { dron: 0.9, crucero: 0.9, supersonico: 0.6, balistico: 0.7, hiper: 0.5 } },
    range: '≈40 km vs balísticos (estimado), ≈100 km vs aeronaves', interceptor: 'PAC-3 MSE: hit-to-kill, buscador activo, motor de doble pulso, techo ≈36 km',
    notes: ['El AN/MPQ-65 busca en un sector de ~90° (sigue en ~120°): hay que orientarlo hacia la amenaza. El LTAMDS nuevo tiene 3 paneles y 360°.', 'El radar guía hasta ~9 misiles a la vez.', 'Lanzador M903: hasta 12 MSE (o 16 CRI); una batería tiene 6–8 lanzadores.', 'Costo: US$4,19 M por misil en el presupuesto FY2025; el contrato plurianual de 2025 da ≈4,97 M con costos asociados.'],
    sources: [WP('MIM-104_Patriot'), SRC.csis_patriot, SRC.rt_mpq53, SRC.army_jb25, SRC.bd_pac3]
  },
  patriot2: {
    name: 'Patriot (PAC-2 GEM-T)', short: 'Patriot GEM-T', side: 'UA', kind: 'sam', color: '#62b6ff',
    radar: { name: 'AN/MPQ-65', band: 'C', R1: 100, mast: 4, sector: 90, eccm: 10, scan: 2 },
    sam: { maxR: 160, maxRtbm: 20, minR: 3, altMin: 60, altMax: 24000, vInt: 900, vmaxT: 2500, react: 9, ch: 8, mag: 16, salvo: 2, guid: 'TVM', shot: 'PAC-2 GEM-T', noDrones: true, cost: 3, pk: { dron: 0.8, crucero: 0.85, supersonico: 0.55, balistico: 0.4, hiper: 0.25 } },
    range: '≈160 km vs aeronaves, ≈20 km vs balísticos', interceptor: 'GEM-T: fragmentación, guiado TVM (necesita que el radar propio vea el blanco), Mach ≈3,5',
    notes: ['Mayor alcance contra aviones y misiles de crucero que el MSE, pero peor contra balísticos.', '4 misiles por lanzador M901/M903.', 'Precio unitario no publicado: US$2–4 M según estimaciones de prensa.'],
    sources: [WP('MIM-104_Patriot'), SRC.csis_patriot, SRC.ar_gemt]
  },
  sampt: {
    name: 'SAMP/T (Aster 30 B1)', short: 'SAMP/T', side: 'UA', kind: 'sam', color: '#62b6ff',
    radar: { name: 'Arabel', band: 'X', R1: 80, mast: 5, sector: 360, eccm: 10, scan: 1 },
    sam: { maxR: 100, maxRtbm: 25, minR: 3, altMin: 50, altMax: 20000, vInt: 1050, vmaxT: 2500, react: 8, ch: 10, mag: 32, salvo: 2, guid: 'activo', shot: 'Aster 30', noDrones: true, cost: 2, pk: { dron: 0.85, crucero: 0.88, supersonico: 0.6, balistico: 0.6, hiper: 0.4 } },
    range: '≈100 km vs aeronaves (50 km por debajo de 3 km de altura), 20–35 km vs balísticos', interceptor: 'Aster 30: 1,4 km/s, buscador activo, control "PIF-PAF" (toberas laterales para maniobra final)',
    notes: ['Radar Arabel en banda X, giratorio a 60 rpm (refresco 1 s), ~100 km de alcance.', '8 misiles por lanzador vertical, 4–6 lanzadores por batería; 10 blancos simultáneos.', 'En Ucrania tuvo problemas de software contra algunos balísticos y escasez de misiles (2025). La afirmación de que superó al Patriot contra Iskander es de baja confianza.'],
    sources: [WP('SAMP/T'), SRC.csis_sampt, SRC.at_aster, SRC.ar_samp_pat]
  },
  irist: {
    name: 'IRIS-T SLM', short: 'IRIS-T', side: 'UA', kind: 'sam', color: '#62b6ff',
    radar: { name: 'Hensoldt TRML-4D', band: 'C', R1: 100, mast: 6, sector: 360, eccm: 10, scan: 1 },
    sam: { maxR: 40, maxRtbm: 0, minR: 1, altMin: 10, altMax: 20000, vInt: 750, vmaxT: 1200, react: 6, ch: 8, mag: 24, salvo: 1, guid: 'IR', shot: 'IRIS-T SL', cost: 0.5, pk: { dron: 0.9, crucero: 0.88, supersonico: 0.2, balistico: 0, hiper: 0 } },
    range: '40 km, techo 20 km (SLX: 80 km)', interceptor: 'IRIS-T SL: guiado inercial + datalink, buscador IR de imagen terminal, ≈Mach 3',
    notes: ['El TRML-4D es banda C (G OTAN): 250 km instrumentados, cazas a más de 120 km, misiles supersónicos a más de 60 km, 1.500 pistas.', 'Diehl y operadores ucranianos reclaman "casi 100%" (≈240 derribos a jun-2024), sobre todo contra crucero y drones. No hay datos contra balísticos.', 'Al ser IR, puede atacar con pista de la red sin que el radar propio vea el blanco en el último tramo; las bengalas del Kh-101 son justamente contra este tipo de buscador.'],
    sources: [WP('IRIS-T_SL'), WP('TRML'), SRC.hensoldt, SRC.dm_iris]
  },
  nasams: {
    name: 'NASAMS (AIM-120 AMRAAM)', short: 'NASAMS', side: 'UA', kind: 'sam', color: '#62b6ff',
    radar: { name: 'AN/MPQ-64 Sentinel', band: 'X', R1: 60, mast: 4, sector: 360, eccm: 8, scan: 2 },
    sam: { maxR: 35, maxRtbm: 0, minR: 1, altMin: 30, altMax: 15000, vInt: 900, vmaxT: 1000, react: 6, ch: 6, mag: 18, salvo: 1, guid: 'activo', shot: 'AIM-120', cost: 1.07, pk: { dron: 0.85, crucero: 0.88, supersonico: 0.4, balistico: 0, hiper: 0 } },
    range: '≈35–40 km (AMRAAM-ER: 50–60 km)', interceptor: 'AIM-120: misil aire-aire adaptado, buscador radar activo',
    notes: ['Noruega reclamó 94% de éxito en Ucrania (feb-2025, ~900 AMRAAM); no se aclara si es por disparo o por blanco y ~60% de los blancos eran crucero.', 'Sentinel: banda X, 30 rpm (refresco 2 s); 40 km el modelo básico, 120 km el F1.', '3 lanzadores de 6 misiles por unidad de fuego. No sirve contra balísticos.'],
    sources: [WP('NASAMS'), SRC.crs_nasams, SRC.kongsberg, SRC.aw_nasams, SRC.dod_p1_25]
  },
  s300: {
    name: 'S-300PS/PT (5V55R)', short: 'S-300P', side: 'UA', kind: 'sam', color: '#62b6ff',
    radar: { name: '30N6 Flap Lid (en torre 40V6)', band: 'X', R1: 100, mast: 25, sector: 90, eccm: 3, scan: 2 },
    sam: { maxR: 75, maxRtbm: 25, minR: 5, altMin: 25, altMax: 27000, vInt: 1300, vmaxT: 1300, react: 12, ch: 4, mag: 16, salvo: 2, guid: 'TVM', shot: '5V55R', cost: 0.5, pk: { dron: 0.5, crucero: 0.6, supersonico: 0.4, balistico: 0.15, hiper: 0.05 } },
    range: '47 km (5V55K) / 75 km (5V55R), techo 27 km', interceptor: '5V55: hasta 2.000 m/s, guiado por mando (K) o TVM (R)',
    notes: ['Ucrania tenía 35 batallones S-300PS/PT en feb-2022 (RUSI), ~250 lanzadores: fue la columna vertebral de su defensa en 2022.', 'El 30N6 puede ir sobre la torre 40V6M (antena a ~24 m) o 40V6MD (~39 m): con 24 m ve un blanco a 25 m de altura a ~41 km.', 'Misiles soviéticos escasos: no hay producción nueva.'],
    sources: [WP('S-300_missile_system'), SRC.rusi_prelim, SRC.apa_fc, SRC.apa_40v6]
  },
  buk: {
    name: 'Buk-M1 (9M38)', short: 'Buk-M1', side: 'both', kind: 'sam', color: '#62b6ff',
    radar: { name: '9S35 Fire Dome (+9S18M1 Snow Drift)', band: 'X', R1: 50, mast: 4, sector: 360, eccm: 3, scan: 2 },
    sam: { maxR: 35, maxRtbm: 10, minR: 3.3, altMin: 15, altMax: 22000, vInt: 650, vmaxT: 830, react: 22, ch: 3, mag: 12, salvo: 2, guid: 'SARH', shot: '9M38', cost: 0.5, pk: { dron: 0.55, crucero: 0.6, supersonico: 0.35, balistico: 0.05, hiper: 0 } },
    range: '3,3–35 km, techo 22 km', interceptor: '9M38: ≈Mach 3, semiactivo: el radar del lanzador tiene que iluminar el blanco hasta el impacto',
    notes: ['Lo usan ambos bandos (Rusia con versiones M2/M3). Ucrania tenía 15 divisiones en 2022.', 'El 9S18M1 (banda centimétrica) detecta a ~85 km a altura; a 100 m de altura solo ~35 km.', 'Ucrania adaptó lanzadores Buk para disparar RIM-7 Sea Sparrow ("FrankenSAM").'],
    sources: [WP('Buk_missile_system'), SRC.missilery_buk, SRC.rusi_prelim]
  },
  gepard: {
    name: 'Flakpanzer Gepard (2×35 mm)', short: 'Gepard', side: 'UA', kind: 'gun', color: '#62b6ff',
    radar: { name: 'Búsqueda S + seguimiento Ku', band: 'S', R1: 15, mast: 3, sector: 360, eccm: 0, scan: 1 },
    sam: { maxR: 4, maxRtbm: 0, minR: 0.1, altMin: 0, altMax: 3000, vInt: 1100, vmaxT: 400, react: 3, ch: 1, mag: 20, salvo: 1, guid: 'cañón', shot: 'ráfaga 35 mm', cost: 0.018, pk: { dron: 0.55, crucero: 0.35, supersonico: 0.05, balistico: 0, hiper: 0 } },
    range: '≈3,5–4 km típico (5,5 km con FAPDS)', interceptor: 'Dos cañones Oerlikon 35 mm, 550 disparos/min cada uno, 640 proyectiles a bordo',
    notes: ['Considerado de los mejores "mata-Shahed".', 'Cada proyectil cuesta ~US$600 (Rheinmetall, 2025): una ráfaga de 20–40 disparos sale US$12–24k.', 'El cuello de botella es la munición de 35 mm; inútil si el dron vuela por encima de ~3 km.'],
    sources: [WP('Flakpanzer_Gepard'), SRC.forbes_gepard]
  },
  mfg: {
    name: 'Grupo de fuego móvil (ametralladora + reflector)', short: 'Grupo móvil', side: 'UA', kind: 'gun', color: '#62b6ff',
    radar: { name: 'Visual / térmico', band: 'OPT', R1: 5, mast: 2, sector: 360, eccm: 99, scan: 1 },
    sam: { maxR: 1.5, maxRtbm: 0, minR: 0, altMin: 0, altMax: 1500, vInt: 800, vmaxT: 250, react: 5, ch: 1, mag: 30, salvo: 1, guid: 'cañón', shot: 'ráfaga 12,7 mm', cost: 0.0003, pk: { dron: 0.2, crucero: 0.05, supersonico: 0, balistico: 0, hiper: 0 } },
    range: '≈1,5 km', interceptor: 'Pickup con ametralladora pesada (DShK/M2), reflector y visor térmico',
    notes: ['Muy barato, se reubica rápido y aprovecha la alerta de la red acústica.', 'Por eso Rusia subió la altura de vuelo de los Shahed a 2–5 km.'],
    sources: [WP('HESA_Shahed_136'), SRC.u24_high]
  },
  manpads: {
    name: 'MANPADS (Stinger / Igla)', short: 'MANPADS', side: 'both', kind: 'sam', color: '#62b6ff',
    radar: { name: 'Visual / IR', band: 'OPT', R1: 7, mast: 2, sector: 360, eccm: 99, scan: 1 },
    sam: { maxR: 4.8, maxRtbm: 0, minR: 0.2, altMin: 10, altMax: 3800, vInt: 550, vmaxT: 400, react: 6, ch: 1, mag: 4, salvo: 1, guid: 'IR', shot: 'FIM-92 Stinger', cost: 0.45, pk: { dron: 0.5, crucero: 0.4, supersonico: 0.05, balistico: 0, hiper: 0 } },
    range: '≈4,8 km, techo ≈3,8 km', interceptor: 'Misil portátil con buscador infrarrojo (Stinger Mach 2,2; Igla ≈570 m/s)',
    notes: ['Stinger: más de US$400k; Igla: ~US$60–80k (dato viejo).', 'Se usan en grupos móviles y contra helicópteros. Las bengalas los degradan.'],
    sources: [WP('FIM-92_Stinger'), WP('9K38_Igla')]
  },
  intdrone: {
    name: 'Drones interceptores (tipo Sting)', short: 'Interceptores', side: 'UA', kind: 'sam', color: '#62b6ff',
    radar: null,
    sam: { maxR: 25, maxRtbm: 0, minR: 0.3, altMin: 50, altMax: 3000, vInt: 85, vmaxT: 95, react: 20, ch: 4, mag: 20, salvo: 1, guid: 'operador', shot: 'dron interceptor', cost: 0.003, pk: { dron: 0.6, crucero: 0.05, supersonico: 0, balistico: 0, hiper: 0 } },
    range: '≈25 km', interceptor: 'Ala/cuadricóptero rápido (Sting: 343 km/h, techo 3.000 m, cámara térmica) guiado por operador',
    notes: ['No tiene sensor propio: necesita pista de la red (radar o acústica). Sin red, no sirve.', 'Sting cuesta ~US$2.100. Interceptores: >70% de los Shahed derribados sobre Kyiv en feb-2026 y ~1/3 de los blancos a nivel nacional en mar-2026, con >60% de éxito por salida.', 'Contra un Geran-3 (≈300–370 km/h) solo funciona de frente: el primer derribo fue en nov-2025.'],
    sources: [WP('Sting_(drone)'), SRC.ukr_sting, SRC.dn_interceptors, SRC.mil_geran3]
  },
  pantsir: {
    name: 'Pantsir-S1', short: 'Pantsir', side: 'RU', kind: 'sam', color: '#ff9f5a',
    radar: { name: '1RS1 búsqueda (S) + 1RS2 seguimiento (Ku)', band: 'S', R1: 30, mast: 6, sector: 360, eccm: 5, scan: 1 },
    sam: { maxR: 18, maxRtbm: 5, minR: 1, altMin: 5, altMax: 15000, vInt: 900, vmaxT: 1000, react: 5, ch: 3, mag: 12, salvo: 2, guid: 'mando', shot: '57E6', cost: 0.15, pk: { dron: 0.65, crucero: 0.6, supersonico: 0.3, balistico: 0.1, hiper: 0 } },
    range: '18–20 km misil, 4 km cañones', interceptor: '57E6: 1.300 m/s al apagar el motor, ≈900 m/s promedio a 12 km; guiado por mando radio, ojiva de varillas',
    notes: ['Radar de búsqueda: 36 km contra 2 m², 20 km contra un misil de crucero de 0,1 m².', 'Defensa de punto de las baterías S-400.', 'Recibió parches de software para HIMARS y Storm Shadow; aun así se registraron muchas pérdidas.'],
    sources: [WP('Pantsir_missile_system'), SRC.apa_pantsir, SRC.gs_57e6]
  },
  tor: {
    name: 'Tor-M2', short: 'Tor-M2', side: 'RU', kind: 'sam', color: '#ff9f5a',
    radar: { name: 'Búsqueda (banda F ≈ S) + seguimiento (G/H y Ku)', band: 'S', R1: 25, mast: 4, sector: 360, eccm: 5, scan: 1 },
    sam: { maxR: 15, maxRtbm: 5, minR: 1, altMin: 10, altMax: 10000, vInt: 700, vmaxT: 700, react: 6, ch: 4, mag: 16, salvo: 1, guid: 'mando', shot: '9M338', cost: 0.3, pk: { dron: 0.75, crucero: 0.7, supersonico: 0.35, balistico: 0.1, hiper: 0 } },
    range: '15–16 km, techo 10 km', interceptor: '9M338: lanzamiento vertical, guiado por mando',
    notes: ['Defensa de punto contra drones, bombas planeadoras y misiles de crucero.', '4 blancos y 8 misiles simultáneos; 16 misiles en el M2 (8 en el M2E).'],
    sources: [WP('Tor_missile_system'), SRC.gs_9m338, SRC.ar_tor]
  },
  s400: {
    name: 'S-400 (48N6DM)', short: 'S-400', side: 'RU', kind: 'sam', color: '#ff9f5a',
    radar: { name: '92N6 Grave Stone (en torre 40V6M)', band: 'X', R1: 200, mast: 25, sector: 120, eccm: 8, scan: 2 },
    sam: { maxR: 250, maxRtbm: 60, minR: 3, altMin: 10, altMax: 27000, vInt: 1500, vmaxT: 4800, react: 9, ch: 10, mag: 32, salvo: 2, guid: 'TVM', shot: '48N6', noDrones: true, cost: 1.5, pk: { dron: 0.75, crucero: 0.7, supersonico: 0.6, balistico: 0.5, hiper: 0.3 } },
    range: '48N6DM: 240–250 km; 40N6: hasta 380–400 km', interceptor: '48N6: ≈2.000 m/s, guiado TVM; 9M96E2 (activo) para corto/medio alcance',
    notes: ['Ucrania destruyó varios radares (92N6, 96L6, 91N6) y lanzadores con ATACMS, Neptune y drones.', 'Contra blancos rasantes su alcance real lo pone el horizonte de radar, no el misil.', 'Precio por misil no publicado: estimación US$1–2 M.'],
    sources: [WP('S-400_missile_system'), SRC.csis_s400, SRC.ar_92n6]
  },
  ewr: {
    name: 'Radar de vigilancia 3D (36D6 / ST-68UM)', short: 'Radar 3D', side: 'both', kind: 'sensor', color: '#62b6ff',
    radar: { name: '36D6 "Tin Shield"', band: 'S', R1: 175, mast: 10, sector: 360, eccm: 3, scan: 5 },
    range: '200 km instrumentados; contra 1 m² a 50 m de altura ≈110–115 km con mástil', notes: ['Radar de alerta y adquisición que alimenta a las baterías S-300. Rota a 6 o 12 rpm.', 'Podés subirle el mástil (torre 40V6M) para ver más lejos a baja cota.'],
    sources: [SRC.rt_36d6, SRC.uos_36d6]
  },
  p18: {
    name: 'P-18 / P-18MR (VHF)', short: 'Radar VHF', side: 'both', kind: 'sensor', color: '#62b6ff',
    radar: { name: 'P-18MR', band: 'VHF', R1: 160, mast: 8, sector: 360, eccm: 0, scan: 6 },
    range: 'P-18MR contra 1 m²: 35 km a 100 m de altura, 120 km a 5 km', notes: ['En VHF las formas furtivas pierden efecto: la RCS del Kh-101 o del Storm Shadow "crece" mucho.', 'Precisión pobre: sirve para alerta y para pasar pistas a la red, no para guiar misiles.'],
    sources: [WP('P-18_radar'), SRC.dx_p18]
  },
  acoustic: {
    name: 'Nodo acústico (red Sky Fortress)', short: 'Acústico', side: 'UA', kind: 'acoustic', color: '#62b6ff',
    radar: { name: 'Micrófonos en red', band: 'ACU', R1: 5, mast: 0, sector: 360, eccm: 99, scan: 2, altMax: 3000 },
    range: '≈5 km por grupo de sensores (cada micrófono oye 1–3 km)', notes: ['~10.000 sensores de US$400–500 c/u conectados por celular.', 'Solo detecta drones con motor; no ve misiles ni blancos muy altos.', 'Inmune a la interferencia de radar y al RCS.'],
    sources: [WP('Sky_Fortress_(drone_defense_system)'), SRC.odessa_sf]
  },
  aew_s340: {
    name: 'Saab 340 AEW (ASC 890, Erieye)', short: 'Saab AEW', side: 'UA', kind: 'aew', color: '#62b6ff', alt: 6000,
    radar: { name: 'Erieye (AESA, lateral)', band: 'S', R1: 240, mast: 6000, sector: 150, side: true, eccm: 10, scan: 4 },
    range: '≈330–350 km contra cazas; 450 km instrumentados', notes: ['Suecia lo anunció en mayo de 2024; la transferencia se confirmó en agosto de 2025 y opera en combate desde marzo de 2026.', 'Antena lateral "tabla": ve a ambos costados (~150° c/u) y tiene zonas ciegas adelante y atrás. Orientá el rumbo de vuelo.', 'Desde 6 km de altura ve misiles rasantes a más de 100 km, donde un radar terrestre no llega.'],
    sources: [WP('Saab_340_AEW&C'), WP('Erieye'), SRC.dx_saab, SRC.gs_erieye]
  },
  aew_a50: {
    name: 'Beriev A-50U', short: 'A-50U', side: 'RU', kind: 'aew', color: '#ff9f5a', alt: 9000,
    radar: { name: 'Shmel-M (rotodomo)', band: 'S', R1: 230, mast: 9000, sector: 360, eccm: 5, scan: 10 },
    range: '≈650 km contra blancos grandes; 150 pistas dentro de 230 km', notes: ['Rusia perdió dos A-50 en 2024 (14/1 y 23/2).', 'Rotodomo de 360°. La banda del Shmel-M no es pública (se asume S).'],
    sources: [WP('Beriev_A-50')]
  }
};

const JAMMERS = {
  soj: { name: 'Avión de interferencia stand-off (tipo Il-22PP)', short: 'Jammer aéreo', side: 'RU', air: true, alt: 8000, P: 3e5, bands: ['S', 'C', 'X'],
    notes: ['Interferencia de ruido desde lejos. Pega fuerte solo cuando está en el lóbulo principal del radar (alineado con los blancos), y mucho menos por lóbulos laterales.', 'Bandas y potencia del Il-22PP no son públicas: los valores son genéricos de juego.'], sources: [WP('Ilyushin_Il-22'), SRC.keyaero_il22] },
  krasukha4: { name: 'Krasukha-4 (terrestre)', short: 'Krasukha-4', side: 'RU', air: false, mast: 6, P: 1e6, bands: ['X', 'Ku'],
    notes: ['Bandas X y Ku, alcance declarado ~300 km. Ucrania capturó uno en 2022.', 'Pensado contra radares aerotransportados y de control de tiro.'], sources: [WP('Krasukha_(electronic_warfare_system)')] },
  krasukha2: { name: 'Krasukha-2 (terrestre)', short: 'Krasukha-2', side: 'RU', air: false, mast: 6, P: 1e6, bands: ['S'],
    notes: ['Banda S, ~250 km: diseñado contra aviones AEW tipo E-3.'], sources: [WP('Krasukha_(electronic_warfare_system)')] },
  gnss: { name: 'Supresor GNSS (tipo Pole-21 ruso / Pokrova ucraniano)', short: 'Anti-GNSS', side: 'both', air: false, gnssJam: true, radius: 25,
    notes: ['No afecta radares: interfiere o engaña GPS-GLONASS. Las armas que dependen del satélite se desvían.', 'Pole-21 es ruso (≥25 km por módulo, montado en torres de celular); Pokrova es el sistema ucraniano de engaño GNSS contra Shahed.', 'Las antenas CRPA (Kometa) y la navegación por terreno/óptica reducen el efecto.'], sources: [SRC.topwar_pole21, SRC.kp_pokrova] }
};
