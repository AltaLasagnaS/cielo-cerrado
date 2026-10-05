// @ts-check
// Registro de eventos de la corrida (lo que se ve en el panel "Registro").
import { D } from '../data/index.js';
import { S } from './state.js';
import { hooks } from './hooks.js';

/**
 * Agrega un evento. cls = tipo, que la interfaz pinta de distinto color:
 * 'd' general, 'l' detección/disparo, 'k' derribo, 'x' falla o impacto, 'w' advertencia.
 * who = quién puede saberlo (vistas por bando, docs/ARQUITECTURA.md): 'def' la defensa, 'atk' el
 * atacante, 'all' los dos. alt = el mismo mensaje como lo cuenta la defensa, sin lo que ella no sabe
 * (el tipo real del arma): lo usa la vista del defensor.
 * @param {'def' | 'atk' | 'all'} [who]
 * @param {string | null} [alt]
 */
export function log(cls, msg, who = 'all', alt = null) { const e = { t: S.t, cls, msg, who, alt }; S.log.unshift(e); if (S.log.length > 300) S.log.pop(); S.rec?.log.push(e); hooks.onLog(); }

/** Líneas del registro que ve cada vista ('all' completa, 'def' defensor, 'atk' atacante), con su texto. */
export function logFor(entries, view) {
  if (view === 'all') return entries.map(e => ({ ...e, text: e.msg }));
  return entries.filter(e => (e.who || 'all') === 'all' || e.who === view).map(e => ({ ...e, text: view === 'def' && e.alt ? e.alt : e.msg }));
}

/** Cómo nombra la defensa a una amenaza: su número de pista y la clasificación que tenga, sin el tipo real. */
export function pista(th) { return 'pista #' + th.id + (th.clsAs ? ' (' + th.clsAs + ')' : ''); }

/** Nombre de una amenaza para el registro ("Kh-101 #34" o "Señuelo de Iskander-M #51"). */
export function label(th) { return (th.isDecoyChild ? 'Señuelo de ' : '') + th.T.short + ' #' + th.id; }

/** Nombre de una unidad de defensa. */
export function uLabel(u) { return u.name || D(u).short; }

/**
 * Evento clave para la línea de tiempo del debrief. Con key, solo se registra la primera vez
 * (por ejemplo 'firstDet' o 'empty:Patriot-1').
 */
export function event(text, key) {
  if (key && S.events.some(e => e.key === key)) return;
  S.events.push({ t: S.t, text, key: key || null });
}
