// @ts-check
// ARCHIVO GENERADO por scripts/calibrar.mjs (npm run calibrar -- --write): no editar a mano.
// Casos de calibración (geometría en data/calibration-cases.js) corridos con el motor: 40 noches, C2
// coordinada, doctrina de salva. "real" = dato observado; "obj" = rango objetivo para la tasa de derribo
// dentro de cobertura; "sim" = con las Pk probables; "lo"/"hi" = con todas las Pk en el mínimo/máximo de UNC.
export const CAL = [
 {
  "id": "kh101_iris_nasams",
  "caso": "16 Kh-101 (cada 5 s) contra IRIS-T + NASAMS + radar 3D",
  "real": "NASAMS: 94% reclamado; IRIS-T: \"casi 100%\" (≈240 derribos). Datos de operador/fabricante, sesgados hacia arriba.",
  "obj": "85–100%",
  "sim": 1,
  "lo": 1,
  "hi": 1,
  "ok": true
 },
 {
  "id": "kalibr_s300_buk",
  "caso": "20 Kalibr (cada 3 s) contra S-300PS + Buk-M1 + radar 3D",
  "real": "67% para crucero a nivel nacional (feb-22 → ago-24), con defensa mayormente soviética.",
  "obj": "60–85%",
  "sim": 0.741,
  "lo": 0.621,
  "hi": 0.978,
  "ok": true
 },
 {
  "id": "shahed_capas",
  "caso": "60 Shahed + 30 Gerbera contra 2 Gepard, 3 grupos móviles, 2 equipos de interceptores, red acústica",
  "real": "Derribo cinético 52% (mar–may 25) a 63% (2022–24); el resto de la neutralización es guerra electrónica, que el juego no modela como pérdida.",
  "obj": "50–70%",
  "sim": 0.627,
  "lo": 0.464,
  "hi": 0.758,
  "ok": true
 },
 {
  "id": "iskm_patriot",
  "caso": "8 Iskander-M con maniobra 2025 y señuelos contra una batería Patriot de 3 lanzadores (36 PAC-3 MSE)",
  "real": "37% nacional en jun–sep 25 (IC95% 31–45%), cota inferior de lo que pasa dentro de cobertura; 6–17% en otoño 2025.",
  "obj": "35–65%",
  "sim": 0.509,
  "lo": 0.375,
  "hi": 0.575,
  "ok": true
 },
 {
  "id": "kinzhal_patriot",
  "caso": "6 Kinzhal contra 1 Patriot MSE",
  "real": "6 de 6 sobre Kyiv el 16/5/2023 (IC95% 61–100%); 25% a nivel nacional.",
  "obj": "61–100%",
  "sim": 0.983,
  "lo": 0.796,
  "hi": 1,
  "ok": true
 },
 {
  "id": "kh22_patriot",
  "caso": "12 Kh-22 (cada 5 s) contra 1 Patriot MSE (16 misiles)",
  "real": "9 de 12 sobre Kyiv el 2/2/2026 (IC95% 47–91%).",
  "obj": "47–91%",
  "sim": 0.621,
  "lo": 0.492,
  "hi": 0.665,
  "ok": true
 },
 {
  "id": "kh22_iris_nasams",
  "caso": "6 Kh-22 contra IRIS-T + NASAMS, sin Patriot",
  "real": "3 de más de 400 derribados antes de feb-2026 (IC95% 0–2%).",
  "obj": "0–10%",
  "sim": 0,
  "lo": 0,
  "hi": 0,
  "ok": true
 },
 {
  "id": "kh22_s300",
  "caso": "6 Kh-22 contra S-300PS + radar 3D, sin Patriot",
  "real": "3 de más de 400 derribados antes de feb-2026 por la defensa sin Patriot, que incluía S-300 sobre las ciudades atacadas (IC95% 0–2%).",
  "obj": "0–10%",
  "sim": 0.008,
  "lo": 0,
  "hi": 0.017,
  "ok": true
 },
 {
  "id": "oniks_iris_nasams",
  "caso": "6 Oniks (perfil hi-lo) contra IRIS-T + NASAMS ubicados en el blanco",
  "real": "5,7% a nivel nacional (12 de 211). No hay datos dentro de cobertura: caso de control, sin objetivo.",
  "obj": "—",
  "sim": 0.488,
  "lo": 0.288,
  "hi": 0.717,
  "ok": null
 },
 {
  "id": "zircon_patriot_sampt",
  "caso": "4 Zircon contra Patriot + SAMP/T",
  "real": "2 de 2 sobre Kyiv el 25/3/2024 (IC95% 34–100%); 33% nacional hasta ago-24.",
  "obj": "34–100%",
  "sim": 0.988,
  "lo": 0.788,
  "hi": 1,
  "ok": true
 }
];
