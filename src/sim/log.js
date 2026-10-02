// Registro de eventos de la corrida (lo que se ve en el panel "Registro").
import { D } from '../data/index.js';
import { S } from './state.js';
import { hooks } from './hooks.js';

/**
 * Agrega un evento. cls = tipo, que la interfaz pinta de distinto color:
 * 'd' general, 'l' detección/disparo, 'k' derribo, 'x' falla o impacto, 'w' advertencia.
 */
export function log(cls, msg) { S.log.unshift({ t: S.t, cls, msg }); if (S.log.length > 300) S.log.pop(); hooks.onLog(); }

/** Nombre de una amenaza para el registro ("Kh-101 #34" o "Señuelo de Iskander-M #51"). */
export function label(th) { return (th.isDecoyChild ? 'Señuelo de ' : '') + th.T.short + ' #' + th.id; }

/** Nombre de una unidad de defensa. */
export function uLabel(u) { return u.name || D(u).short; }
