// @ts-check
// Estados del tiempo, fijos durante todo el escenario. Los usan physics/weather.js (atenuación del
// radar por lluvia) y physics/radar.js#detR / sim/engine.js (sensores ópticos y acústicos).
//
//   rain     lluvia en mm/h (ITU-R P.838-3 da la atenuación específica de cada banda)
//   rainKm   largo máximo del camino dentro de la lluvia (km): las celdas de lluvia no cubren todo
//   opt      factor de alcance de los sensores ópticos e infrarrojos (OPT: grupos móviles, MANPADS)
//   ceiling  techo de nubes o niebla (m sobre el terreno): un sensor OPT en tierra no ve blancos
//            más arriba. null = sin techo que moleste
//   acu      factor de alcance de la red acústica (la lluvia y el viento tapan el ruido del motor)
//   sea      estado del mar (escala Douglas, 0–6) para el clutter de mar (physics/clutter.js, modelo NRL).
//            Est: valores típicos para cada tiempo (2 = olas de 0,1–0,5 m; 3 = 0,5–1,25 m; 5 = 2,5–4 m)
//
// Fuentes: atenuación ITU-R P.838-3; efectos ópticos y de nubes según el manual de CMO (la lluvia
// deja lo visual en 1–5% de su alcance y degrada mucho el IR; las nubes cortan la línea de vista).
// Los factores ópticos y acústicos son estimaciones de juego (ver docs/FISICA.md §2, "Clima").
export const WEATHER = {
  despejado: {
    name: 'Despejado', rain: 0, rainKm: 0, opt: 1, ceiling: null, acu: 1, sea: 2,
    desc: 'Sin efectos: todos los sensores rinden su alcance nominal.'
  },
  nubes: {
    name: 'Nublado, techo bajo (≈600 m)', rain: 0, rainKm: 0, opt: 1, ceiling: 600, acu: 1, sea: 3,
    desc: 'Capa de nubes a unos 600 m: los grupos móviles y los MANPADS no ven nada que vuele por encima, aunque lo escuchen. Los radares no se enteran.'
  },
  lluvia: {
    name: 'Lluvia moderada (4 mm/h)', rain: 4, rainKm: 30, opt: 0.3, ceiling: 1000, acu: 0.7, sea: 3,
    desc: 'Lo visual y el infrarrojo caen a un tercio y las nubes tapan arriba de 1.000 m. La lluvia atenúa un poco los radares en X y Ku; S y L casi no la notan. La red acústica oye menos.'
  },
  tormenta: {
    name: 'Tormenta (25 mm/h)', rain: 25, rainKm: 15, opt: 0.1, ceiling: 800, acu: 0.4, sea: 5,
    desc: 'Lluvia fuerte en celdas de unos 15 km: los radares de banda X y Ku pierden bastante alcance, la óptica casi no sirve y la red acústica oye poco.'
  },
  niebla: {
    name: 'Niebla', rain: 0, rainKm: 0, opt: 0.1, ceiling: 200, acu: 1, sea: 1,
    desc: 'Visibilidad de unos cientos de metros: los sensores ópticos casi no sirven y no ven nada por encima de 200 m. Los radares no se enteran (la niebla casi no atenúa microondas) y el sonido viaja bien.'
  }
};

/** Clima por defecto (el comportamiento de siempre). */
export const WEATHER_DEFAULT = 'despejado';
