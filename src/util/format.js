// Formato de números y textos para la interfaz y el registro (locale es-AR).

/** Reloj de simulación: segundos → "T+mm:ss". */
export const fmtT = t => { t = Math.max(0, Math.floor(t)); const m = Math.floor(t / 60), s = t % 60; return 'T+' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); };

/** Escapa texto para insertarlo en HTML. */
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Millones de US$ → "US$2,5 M" o "US$35k". */
export const money = v => v >= 1 ? 'US$' + v.toFixed(v >= 10 ? 0 : 1) + ' M' : 'US$' + Math.round(v * 1000) + 'k';

/** m/s → "185 km/h". */
export const kmh = v => Math.round(v * 3.6).toLocaleString('es-AR') + ' km/h';

/** m/s → número de Mach aproximado (velocidad del sonido fija en 340 m/s). */
export const mach = v => 'Mach ' + (v / 340).toFixed(v < 340 ? 2 : 1);
