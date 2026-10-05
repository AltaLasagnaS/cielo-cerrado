// @ts-check
// Parámetros del ambiente (docs/FISICA.md §2 "Clima" y §5 "Viento"), con rango y fuentes en UNC.env.modelo:
//   windAlpha  exponente de la ley de potencia del viento con la altura (Hellmann; 1/7 en atmósfera neutra)
//   windTop    altura (m) hasta la que crece el viento: tope aproximado de la capa límite
//   optDay     factor de alcance de los sensores ópticos e IR de día respecto de la noche. Los alcances
//              del catálogo (R1 de 'mfg', 'manpads') están estimados para la noche, con visor térmico.
export const ENV = {
  modelo: {
    windAlpha: 0.143,
    windTop: 1000,
    optDay: 1.3
  }
};

/** Momento del día (S.tod, rules.tod): factor sobre los sensores ópticos. Por defecto, noche. */
export const TIMES_OF_DAY = {
  noche: { name: 'Noche', desc: 'Los grupos móviles y los MANPADS buscan con visor térmico y reflectores: los alcances del catálogo.' },
  dia: { name: 'Día', desc: 'Se suma la vista: los sensores ópticos llegan algo más lejos (estimado). Los radares no cambian.' }
};
export const TOD_DEFAULT = 'noche';
