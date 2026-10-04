// @ts-check
// Utilidades matemáticas y de geometría plana.
// Convención del mapa: x crece hacia el este, y hacia el sur (como la pantalla), distancias en km.
// Azimut: 0° = norte, sentido horario.

/** Limita v al intervalo [a, b]. */
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Azimut (0–360°) del vector (dx, dy) en coordenadas de mapa. */
export const azOf = (dx, dy) => (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;

/** Diferencia angular mínima entre dos azimuts, en grados (0–180). */
export const angDiff = (a, b) => { let d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

/** Distancia del punto P al segmento AB. */
export function segDist(px, py, ax, ay, bx, by) { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1; const t = clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1); return Math.hypot(px - ax - dx * t, py - ay - dy * t); }
