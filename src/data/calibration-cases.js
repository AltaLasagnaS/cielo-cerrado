// Casos de calibración de la Pk con su geometría guardada (docs/DATOS-Y-FUENTES.md §4). Los corre
// scripts/calibrar.mjs (npm run calibrar) y el resultado queda en data/calibration.js (CAL).
//
// Todos van sobre el mapa de Monterey aplanado (sin relieve: el relieve no es parte del dato real) con
// C2 coordinada, doctrina de salva y clima despejado. El blanco está en (60, 60) km. La métrica es la
// tasa de derribo de las amenazas del caso (derribadas / lanzadas); salvo con metric: 'todos', no cuentan
// los señuelos que sueltan los misiles. rules pisa reglas del estado (por ejemplo ignoreDecoys).
//
// "real" = dato observado; "obj" = rango objetivo [mín, máx] (null = caso de control, sin objetivo).
// La geometría de la versión original no quedó guardada: estas son reconstrucciones a partir de la
// descripción de cada caso (defensa sobre el blanco, ataque de frente). Ver CHANGELOG.

const T = [60, 60];
/** Ruta rasante desde el oeste hasta el blanco. */
const west = [[0, 60], T];
/** Balístico desde el norte (launchDist lo pone fuera del mapa). */
const north = [[60, 0], T];

export const CAL_CASES = [
  {
    id: 'kh101_iris_nasams',
    caso: '16 Kh-101 (cada 5 s) contra IRIS-T + NASAMS + radar 3D',
    real: 'NASAMS: 94% reclamado; IRIS-T: "casi 100%" (≈240 derribos). Datos de operador/fabricante, sesgados hacia arriba.',
    obj: [0.85, 1],
    defs: [['irist', 58, 60], ['nasams', 57, 61], ['ewr', 62, 62]],
    salvos: [{ type: 'kh101', count: 16, interval: 5, pts: west }]
  },
  {
    id: 'kalibr_s300_buk',
    caso: '20 Kalibr (cada 3 s) contra S-300PS + Buk-M1 + radar 3D',
    real: '67% para crucero a nivel nacional (feb-22 → ago-24), con defensa mayormente soviética.',
    obj: [0.6, 0.85],
    defs: [['s300', 58, 60, { az: 270 }], ['buk', 56, 61], ['ewr', 62, 62]],
    salvos: [{ type: 'kalibr', count: 20, interval: 3, pts: west }]
  },
  {
    id: 'shahed_capas',
    caso: '60 Shahed + 30 Gerbera contra 2 Gepard, 3 grupos móviles, 2 equipos de interceptores, red acústica',
    real: 'Derribo cinético 52% (mar–may 25) a 63% (2022–24); el resto de la neutralización es guerra electrónica, que el juego no modela como pérdida.',
    obj: [0.5, 0.7], metric: 'todos',
    defs: [['gepard', 55, 59], ['gepard', 58, 62], ['mfg', 45, 58], ['mfg', 50, 62], ['mfg', 54, 57], ['intdrone', 52, 60], ['intdrone', 57, 58],
      ['acoustic', 40, 60], ['acoustic', 46, 61], ['acoustic', 52, 59], ['acoustic', 57, 61]],
    salvos: [{ type: 'shahed', count: 60, interval: 15, pts: west }, { type: 'gerbera', count: 30, interval: 30, tStart: 30, pts: [[0, 62], T] }]
  },
  {
    id: 'iskm_patriot',
    caso: '8 Iskander-M con maniobra 2025 y señuelos contra una batería Patriot de 3 lanzadores (36 PAC-3 MSE)',
    real: '37% nacional en jun–sep 25 (IC95% 31–45%), cota inferior de lo que pasa dentro de cobertura; 6–17% en otoño 2025.',
    obj: [0.35, 0.65], rules: { ignoreDecoys: true },
    // "dentro de cobertura" = una batería desplegada de verdad: 3 lanzadores M903 con 12 MSE cada uno (una
    // batería completa tiene hasta 8). Con los 16 del catálogo (escasez) el Patriot se vacía con los señuelos
    // y da ≈21%; con 48, ≈62%.
    defs: [['patriot', 60, 63, { az: 0, mag: 36 }]],
    salvos: [{ type: 'isk_m', count: 8, interval: 20, launchDist: 300, maneuver: true, decoys: true, pts: north }]
  },
  {
    id: 'kinzhal_patriot',
    caso: '6 Kinzhal contra 1 Patriot MSE',
    real: '6 de 6 sobre Kyiv el 16/5/2023 (IC95% 61–100%); 25% a nivel nacional.',
    obj: [0.61, 1],
    defs: [['patriot', 60, 63, { az: 0 }]],
    salvos: [{ type: 'kinzhal', count: 6, interval: 15, launchDist: 450, pts: north }]
  },
  {
    id: 'kh22_patriot',
    caso: '12 Kh-22 (cada 5 s) contra 1 Patriot MSE (16 misiles)',
    real: '9 de 12 sobre Kyiv el 2/2/2026 (IC95% 47–91%).',
    obj: [0.47, 0.91],
    defs: [['patriot', 60, 63, { az: 0 }]],
    salvos: [{ type: 'kh22', count: 12, interval: 5, pts: north }]
  },
  {
    id: 'kh22_iris_nasams',
    caso: '6 Kh-22 contra IRIS-T + NASAMS, sin Patriot',
    real: '3 de más de 400 derribados antes de feb-2026 (IC95% 0–2%).',
    obj: [0, 0.1],
    defs: [['irist', 60, 62], ['nasams', 59, 63]],
    salvos: [{ type: 'kh22', count: 6, interval: 10, pts: north }]
  },
  {
    id: 'oniks_iris_nasams',
    caso: '6 Oniks (perfil hi-lo) contra IRIS-T + NASAMS ubicados en el blanco',
    real: '5,7% a nivel nacional (12 de 211). No hay datos dentro de cobertura: caso de control, sin objetivo.',
    obj: null,
    defs: [['irist', 60, 61], ['nasams', 61, 60]],
    salvos: [{ type: 'oniks', count: 6, interval: 10, pts: west }]
  },
  {
    id: 'zircon_patriot_sampt',
    caso: '4 Zircon contra Patriot + SAMP/T',
    real: '2 de 2 sobre Kyiv el 25/3/2024 (IC95% 34–100%); 33% nacional hasta ago-24.',
    obj: [0.34, 1],
    defs: [['patriot', 60, 63, { az: 270 }], ['sampt', 58, 61, { az: 270 }]],
    salvos: [{ type: 'zircon', count: 4, interval: 10, pts: west }]
  }
];
