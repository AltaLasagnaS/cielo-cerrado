'use strict';
// ===================== UTILIDADES =====================
const $ = s => document.querySelector(s);
const KR = 8.5e6;                 // radio terrestre efectivo 4/3 (m)
const rnd = Math.random;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtT = t => { t = Math.max(0, Math.floor(t)); const m = Math.floor(t / 60), s = t % 60; return 'T+' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const azOf = (dx, dy) => (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
const angDiff = (a, b) => { let d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const money = v => v >= 1 ? 'US$' + v.toFixed(v >= 10 ? 0 : 1) + ' M' : 'US$' + Math.round(v * 1000) + 'k';
const kmh = v => Math.round(v * 3.6).toLocaleString('es-AR') + ' km/h';
const mach = v => 'Mach ' + (v / 340).toFixed(v < 340 ? 2 : 1);
