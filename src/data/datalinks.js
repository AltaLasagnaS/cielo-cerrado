// @ts-check
// Familias de enlaces de datos del modelo. Son interfaces de juego, no una afirmación de que dos
// equipos puedan intercambiar directamente mensajes en el mundo real. La confianza y las fuentes
// quedan documentadas para que una futura investigación OSINT pueda reemplazar la estimación.
//
// `datalinks` en una defensa dice qué transporte nativo o gateway compatible tiene. El interruptor
// de una unidad (`link`) solo enciende o apaga esos transportes. C2 (data/c2.js) decide qué uso se
// hace de la información: alerta, pista o calidad de tiro.
export const DATALINKS = {
  l16: {
    name: 'Link 16 / MIDS',
    capability: 'track',
    confidence: 'media',
    note: 'Familia de intercambio táctico occidental; el acceso y la capacidad de engage-on-remote dependen de la integración concreta.',
    sources: ['crs_nasams', 'kongsberg']
  },
  ua_c2: {
    name: 'Red C2 nacional ucraniana',
    capability: 'track',
    confidence: 'media',
    note: 'Gateway nacional para sistemas soviéticos y occidentales; no se presume interoperabilidad de calidad de tiro entre todos los usuarios.',
    sources: ['ua_mix']
  },
  ru_c2: {
    name: 'Red automatizada rusa',
    capability: 'track',
    confidence: 'media',
    note: 'Familia Polyana/Baikal/Senezh; el comportamiento real de cada despliegue no es público.',
    sources: ['ru_polyana']
  }
};

/**
 * Pasarelas entre familias (docs/FISICA.md §6, "Enlaces"): una pista publicada en la red a llega a los
 * usuarios de la red b (y al revés) con gwLag segundos más de demora, y un disparo con esa pista rinde
 * ×gwPk (la conversión de formato y la demora agregan error de posición). Rango y fuentes en UNC.gw.
 * Vienen APAGADAS: cada escenario las habilita en rules.gateways (S.gateways). La de Link 16 ↔ red
 * ucraniana no tiene fuente de pista de calidad de tiro (sí de imagen común y alertas, que el modelo ya
 * comparte entre familias): docs/investigacion/datos-fisica-enlaces.md.
 */
export const GATEWAYS = {
  ua_l16: {
    name: 'Pasarela Link 16 ↔ red C2 ucraniana', a: 'l16', b: 'ua_c2', gwLag: 10, gwPk: 0.95,
    note: 'Ucrania convirtió la salida de sus radares soviéticos a su imagen aérea común con los sistemas occidentales ("cajas negras" de conversión, 2022–24) y firmó la licencia de Link 16 en 2025. Demora y pérdida: estimación. Sin fuente primaria de que la pista sirva para disparar: apagada por defecto.',
    sources: ['ms_lessons', 'nv_l16']
  }
};

/** Pasarelas que llevan pistas de otra red a la red key: [{ from, G, id }]. */
export function gatewaysInto(key) {
  const out = [];
  for (const [id, G] of Object.entries(GATEWAYS)) { if (G.a === key) out.push({ from: G.b, G, id }); else if (G.b === key) out.push({ from: G.a, G, id }); }
  return out;
}

export const datalinksOf = u => {
  const links = u?.datalinks ?? u?.links ?? [];
  return Array.isArray(links) ? links.filter(k => DATALINKS[k]) : [];
};

/** Enlaces de transporte que pueden llevar una pista de u a un receptor v. */
export function commonDatalinks(u, v) {
  const b = new Set(datalinksOf(v));
  return datalinksOf(u).filter(k => b.has(k));
}

export const canShareTrack = (u, v) => commonDatalinks(u, v).some(k => DATALINKS[k].capability === 'track');
