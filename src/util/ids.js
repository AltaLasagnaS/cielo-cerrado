// Contador global de identificadores (unidades, salvas, amenazas y señuelos).
// Los ids aparecen en el registro ("Shahed #12"), así que el orden en que se piden importa
// para que una corrida con la misma semilla sea idéntica.
let next = 1;

/** Devuelve un id nuevo. */
export const nextId = () => next++;

/** Devuelve el último id pedido (para cálculos de prueba que no deben consumir numeración). */
export const releaseId = () => { next--; };
