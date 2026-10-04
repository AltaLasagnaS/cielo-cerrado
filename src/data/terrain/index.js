// Mapas de relieve incluidos en el juego. Para agregar uno nuevo: crear un módulo con el mismo
// formato que monterey.js (ver docs/DATOS-Y-FUENTES.md) y sumarlo acá.
import monterey from './monterey.js';
import goteborg from './goteborg.js';
import kyiv from './kyiv.js';
import kharkiv from './kharkiv.js';
import odesa from './odesa.js';

export const TERRAIN = { monterey, goteborg, kyiv, kharkiv, odesa };
