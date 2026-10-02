// Constantes físicas del modelo. Ver docs/FISICA.md para la derivación de cada una.

/**
 * Radio terrestre efectivo en metros con refracción atmosférica estándar (modelo "Tierra 4/3":
 * 4/3 × 6.371 km ≈ 8.500 km). Curva menos el haz y estira el horizonte de radar ~15%.
 */
export const KR = 8.5e6;

/**
 * Margen sobre el relieve en metros para la línea de vista (árboles, edificios, rugosidad que
 * la grilla de 200 m no resuelve). Un rayo que pasa a menos de esto del suelo se considera tapado.
 */
export const LOS_MARGIN = 4;

/**
 * Coeficiente del horizonte de radar en km/√m: d ≈ 4,12·(√h_radar + √h_blanco), que es
 * √(2·KR)/1000 con KR de 8.500 km.
 */
export const HORIZON_K = 4.12;
