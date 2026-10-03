// ---------------- VISTA ----------------
// Cámara del mapa: centro (cx, cy) en km y escala s en píxeles CSS por km.
import { MAP } from '../physics/terrain.js';
import { draw } from './draw.js';

/** Canvas del mapa, su contexto 2D y la relación de píxeles del dispositivo. */
export let cv = null, ctx = null, dpr = 1;
export const V = { cx: 50, cy: 50, s: 6 };

export function initView(canvas) { cv = canvas; ctx = cv.getContext('2d'); }

/** Ajusta la resolución del canvas a su tamaño en pantalla. */
export function resize() { const r = cv.getBoundingClientRect(); dpr = window.devicePixelRatio || 1; cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr); draw(); }

/** Encuadra el mapa completo. */
export function fitView() { const r = cv.getBoundingClientRect(); if (!MAP || !r.width) return; V.cx = MAP.wKm / 2; V.cy = MAP.hKm / 2; V.s = Math.min(r.width / (MAP.wKm * 1.06), r.height / (MAP.hKm * 1.06)); draw(); }

/** Mundo (km) → pantalla (px CSS). */
export const toS = (x, y) => [(x - V.cx) * V.s + cv.width / dpr / 2, (y - V.cy) * V.s + cv.height / dpr / 2];
/** Pantalla (px CSS) → mundo (km). */
export const toW = (sx, sy) => [(sx - cv.width / dpr / 2) / V.s + V.cx, (sy - cv.height / dpr / 2) / V.s + V.cy];
