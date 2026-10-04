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
