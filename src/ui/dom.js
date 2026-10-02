// Atajos de DOM.

/** querySelector corto. */
export const $ = s => document.querySelector(s);

/** ¿Está activa la "vista del defensor"? (oculta lo no detectado y disfraza los señuelos). */
export const isDefenderView = () => $('#defView').checked;
