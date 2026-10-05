// @ts-check
// Parámetros del modelo de clutter (physics/clutter.js, docs/FISICA.md §2 "Clutter"). Valores por
// CLASE, no por radar: el catálogo todavía no publica la resolución en distancia, la PRF ni el factor de
// mejora de cada sistema. Cada uno tiene su rango y fuentes en UNC.clu.modelo (Monte Carlo los sortea).
// Un radar puede pisarlos con sus propios datos: radar.res (m), radar.prf (Hz), radar.bwEl (°).
//
//   landDb    σ°F⁴ mediano del suelo a ángulos rasantes (dB): Billingsley, 37 sitios rurales, < 8°
//   reliefDb  cuánto sube o baja (± dB) con la rugosidad del terreno (llano → −, quebrado → +)
//   res       resolución en distancia típica (m): el largo de la celda de clutter
//   ruK       la PRF de un radar MTI es la de alcance sin ambigüedad hasta ruK·R1: PRF = c / (2·ruK·R1)
//   mtiCap    techo del factor de mejora de un MTI (dB): inestabilidades, barrido de la antena
//   pdCap     factor de mejora de un pulso-Doppler (dB): lóbulos laterales del banco de filtros
//   landSv, seaSv, rainSv   dispersión de velocidades del clutter (m/s, desvío estándar del espectro)
export const CLUTTER = {
  modelo: {
    landDb: -30,
    reliefDb: 5,
    res: 150,
    ruK: 2,
    mtiCap: 35,
    pdCap: 55,
    landSv: 0.1,
    seaSv: 0.9,
    rainSv: 2
  }
};
