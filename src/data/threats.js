// Amenazas: misiles, drones y señuelos. Ver docs/DATOS-Y-FUENTES.md para el significado de cada campo.
import { WP, SRC } from './sources.js';

/** Nombre legible de cada clase de blanco (la clase decide qué Pk usa cada defensa). */

export const CLS_NAME = { dron: 'Dron de ataque / señuelo', crucero: 'Misil de crucero subsónico', supersonico: 'Misil supersónico', balistico: 'Balístico / aerobalístico', hiper: 'Hipersónico (planeo/crucero)' };

// prof: drone | cruise | bunt | ballistic | highdive | hilo
// Los números de abajo se sobrescriben con UNC[...].p al cargar (applyProbable); se dejan iguales para leer el archivo.
export const THREATS = {
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
