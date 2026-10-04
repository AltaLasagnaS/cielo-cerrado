// ---------------- PERFIL DE VELOCIDAD DEL INTERCEPTOR ----------------
// Motor y planeo (docs/FISICA.md §6): el misil acelera parejo mientras quema el motor y después planea
// perdiendo velocidad por el arrastre.
//   motor  (t ≤ tb):  v(t) = vmax·t/tb                 s(t) = vmax·t²/(2·tb)
//   planeo (t > tb):  v(t) = vmax / (1 + (t − tb)/τd)   s(t) = s(tb) + vmax·τd·ln(1 + (t − tb)/τd)
// tb (sam.tb) y vmax (sam.vmax) vienen del catálogo. τd (frenado) casi nunca es público: se despeja
// para que el tiempo de vuelo hasta el alcance máximo siga siendo maxR / vInt, es decir, para que en el
// borde de la envolvente el interceptor llegue cuando llegaba con la velocidad media de antes.
// Sin vmax o tb (cañones, drones interceptores, sistemas sin dato) el perfil es la velocidad constante
// vInt de siempre: tb = 0 y τd infinito.

/** @typedef {{ tb: number, vmax: number, td: number }} Profile */

/** Distancia (m) recorrida a los t s de vuelo. */
export function distAt(P, t) {
  if (t <= 0) return 0;
  if (t <= P.tb) return P.vmax * t * t / (2 * P.tb);
  const sb = P.vmax * P.tb / 2, x = t - P.tb;
  return sb + (P.td === Infinity ? P.vmax * x : P.vmax * P.td * Math.log1p(x / P.td));
}

/** Velocidad (m/s) a los t s de vuelo. */
export function velAt(P, t) {
  if (t <= 0) return 0;
  if (t <= P.tb) return P.vmax * t / P.tb;
  return P.td === Infinity ? P.vmax : P.vmax / (1 + (t - P.tb) / P.td);
}

/** Tiempo de vuelo (s) hasta d metros: la inversa de distAt (forma cerrada). */
export function timeTo(P, d) {
  if (d <= 0) return 0;
  const sb = P.vmax * P.tb / 2;
  if (d <= sb) return Math.sqrt(2 * d * P.tb / P.vmax);
  const y = (d - sb) / P.vmax;
  return P.tb + (P.td === Infinity ? y : P.td * Math.expm1(y / P.td));
}

/**
 * τd (s) para que el misil recorra R metros en T segundos. distAt crece con τd, así que se busca por
 * bisección en escala logarítmica. Unidades: tb y T en s, vmax en m/s, R en m. Hay solución si T > tb y
 * vmax·(T − tb/2) > R. Si no (vmax demasiado baja para ese vInt o motor más largo que el vuelo, lo que
 * puede pasar con un sorteo de Monte Carlo en los extremos de UNC), devuelve Infinity: el misil vuela
 * sin frenar y su tiempo hasta R no es exactamente T.
 */
export function solveTd(tb, vmax, R, T) {
  const reach = td => distAt({ tb, vmax, td }, T);
  // con el motor todavía encendido en T, τd no cambia nada: no hay frenado que ajustar
  if (T <= tb || reach(Infinity) <= R) return Infinity;
  let lo = 1e-3, hi = 1e6;
  if (reach(hi) < R) return Infinity;
  for (let i = 0; i < 80; i++) { const mid = Math.sqrt(lo * hi); if (reach(mid) < R) lo = mid; else hi = mid; }
  return hi;
}

/** ¿El arma tiene perfil de motor y planeo? Sin vmax y tb, vuela a vInt constante. */
export const hasProfile = sm => !!(sm.vmax && sm.tb);

/**
 * Perfil del interceptor de un arma (sam del catálogo). τd se calcula con el alcance contra aeronaves
 * (maxR), que es el límite cinemático; el alcance antibalístico es menor por otras razones (sensor,
 * geometría). Se recalcula en cada consulta porque el Monte Carlo sortea vInt, vmax y tb.
 * @returns {Profile}
 */
export function profileOf(sm) {
  if (!hasProfile(sm) || !sm.maxR) return { tb: 0, vmax: sm.vInt, td: Infinity };
  const R = sm.maxR * 1000;
  return { tb: sm.tb, vmax: sm.vmax, td: solveTd(sm.tb, sm.vmax, R, R / sm.vInt) };
}

/**
 * Energía relativa (0 a 1) del interceptor tras recorrer d metros: durante el motor, 1 (todavía
 * empuja y tiene toda su capacidad de maniobra); en el planeo, (v / vmax)², porque la aceleración
 * lateral que puede generar es proporcional a la presión dinámica ½ρv².
 */
export function energyAt(P, d) {
  if (d <= P.vmax * P.tb / 2) return 1;
  const k = velAt(P, timeTo(P, d)) / P.vmax;
  return k * k;
}
