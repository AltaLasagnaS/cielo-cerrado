// @ts-check
// Atajos de DOM.
import { S } from '../sim/state.js';

/** querySelector corto. */
export const $ = s => document.querySelector(s);

/** ¿Está activa la "vista del defensor"? (oculta lo no detectado y disfraza los señuelos). */
export const isDefenderView = () => $('#view')?.value === 'def';
/** ¿Está activa la "vista del atacante"? (oculta las defensas que no conoce y su estado). */
export const isAttackerView = () => $('#view')?.value === 'atk';
/** Vista activa para paneles y registro: 'all', 'def' o 'atk' (la repetición muestra siempre la verdad). */
export const viewNow = () => (S.replay ? 'all' : isDefenderView() ? 'def' : isAttackerView() ? 'atk' : 'all');
