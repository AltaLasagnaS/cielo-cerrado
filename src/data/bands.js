// Bandas de sensores: ÚNICA fuente de datos de bandas para la simulación, las fichas, el catálogo,
// los tooltips y la Academia.
//
//   ghz     frecuencia representativa (GHz): la usa physics/weather.js para la atenuación por lluvia.
//   bw      ancho de haz típico (°). Lo usa el modelo de interferencia (lóbulo principal vs laterales).
//   rcs     cómo cambia la RCS del blanco en esta banda respecto de la frontal en X/S (th.rcs).
//           La aplica physics/radar.js#rcsAt, en este orden:
//             own: campo propio de la amenaza si existe (p. ej. rcsVHF, estimado por resonancia)
//             lo: × si la amenaza es de baja firma (th.lo) · dron: × si es un dron
//             small/smallBelow: × si su RCS frontal es menor que smallBelow m² · other: × en el resto
//           Sin "rcs" la banda usa la RCS frontal tal cual.
//   low     banda baja ("A–D" en la nomenclatura de CMO: VHF, UHF, L). Ahí los blancos chicos están
//           cerca de la resonancia y la RCS cambia menos con el aspecto: physics/radar.js#aspectFactor
//           usa la mitad del contraste en dB entre frente, costado y cola.
//   decoyTau tiempo característico (s de seguimiento) para distinguir un señuelo de un arma real con
//           un radar de esta banda (physics/decoys.js). Sin él la banda no clasifica (VHF, L: alerta).
//   freq, lambda ([mín, máx] en metros), res, uses, pros, cons: texto educativo (Academia).
//
// Los multiplicadores son una simplificación del juego (ver docs/FISICA.md §3): la RCS real depende
// del ángulo, la polarización, la frecuencia exacta y el diseño del blanco, y no es pública.

export const BANDS = {
  VHF: {
    name: 'VHF (banda métrica)', ghz: 0.17, bw: 6,
    note: 'Longitud de onda ~1–2 m: el "stealth" por forma pierde efecto (resonancia), pero precisión pobre: sirve para alerta, no para guiar misiles.',
    freq: '30–300 MHz (radares de alerta: ~150–200 MHz)', lambda: [1, 2], res: 'Muy baja: haces de varios grados, errores de cientos de metros.',
    uses: 'Alerta temprana de largo alcance (P-18, Nebo).', pros: 'Ve blancos furtivos y chicos mejor que las bandas altas; antenas baratas.', cons: 'Antenas enormes, mala precisión angular, no sirve para guiar misiles; vulnerable a interferencia de ancho de banda amplio.',
    rcs: { own: 'rcsVHF', lo: 12, small: 4, smallBelow: 0.05, other: 2 }, low: true,
    rcsWhy: 'Con λ de 1–2 m, partes del blanco (alas, aletas, el fuselaje entero) miden lo mismo que la onda y entran en resonancia: devuelven mucha más energía. El conformado furtivo está pensado para bandas centimétricas y acá pierde efecto. El motor usa la RCS VHF estimada de cada arma (rcsVHF) y, si falta, multiplica la frontal: ×12 si es de baja firma, ×4 si es muy chica (< 0,05 m²), ×2 en el resto.'
  },
  L: {
    name: 'Banda L', ghz: 1.3, bw: 3,
    note: 'Alerta temprana de largo alcance.',
    freq: '1–2 GHz', lambda: [0.15, 0.3], res: 'Baja a media.',
    uses: 'Vigilancia de largo alcance y control de tránsito aéreo en ruta.', pros: 'Mucho alcance, poca atenuación por lluvia.', cons: 'Resolución limitada; antenas grandes.',
    rcs: { lo: 3, other: 1.4 }, low: true,
    rcsWhy: 'Todavía cerca de la zona de resonancia para misiles chicos: el motor multiplica la RCS frontal ×3 si el blanco es de baja firma y ×1,4 en el resto.'
  },
  S: {
    name: 'Banda S (E/F OTAN)', ghz: 3, decoyTau: 60, bw: 2,
    note: 'Buen compromiso alcance/clima; típica en radares de vigilancia 3D y AEW.',
    freq: '2–4 GHz', lambda: [0.075, 0.15], res: 'Media.',
    uses: 'Vigilancia 3D (36D6), AEW (Erieye, A-50), búsqueda de defensas de punto (Pantsir, Tor).', pros: 'Buen alcance y poca sensibilidad a la lluvia.', cons: 'Menos precisión que C o X para guiar.',
    rcsWhy: 'Es una de las bandas de referencia del catálogo: el motor usa la RCS frontal (th.rcs) sin cambios.'
  },
  C: {
    name: 'Banda C (G/H OTAN)', ghz: 5.5, decoyTau: 25, bw: 1.5,
    note: 'Radares multifunción de defensa aérea (Patriot, TRML-4D del IRIS-T).',
    freq: '4–8 GHz', lambda: [0.0375, 0.075], res: 'Media a alta.',
    uses: 'Radares multifunción (búsqueda + seguimiento + guiado): AN/MPQ-65 del Patriot, TRML-4D.', pros: 'Compromiso entre alcance y precisión; un solo radar puede buscar y guiar.', cons: 'Más afectado por la lluvia que S o L.',
    rcsWhy: 'Régimen óptico para casi todos los blancos: el motor usa la RCS frontal sin cambios.'
  },
  X: {
    name: 'Banda X (I/J OTAN)', ghz: 9.5, decoyTau: 18, bw: 1,
    note: 'Control de tiro: buena resolución, menos alcance y más afectada por lluvia.',
    freq: '8–12 GHz', lambda: [0.025, 0.0375], res: 'Alta: haces de ~1°.',
    uses: 'Control de tiro e iluminación (30N6, 92N6, 9S35, Arabel, Sentinel), buscadores de misiles.', pros: 'Resolución angular y de seguimiento alta con antenas manejables.', cons: 'Menos alcance para la misma potencia y antena, atenuación por lluvia; es la banda contra la que se optimiza el conformado furtivo.',
    rcsWhy: 'Banda de referencia del catálogo (RCS frontal "X/S"). Con λ de ~3 cm todos los blancos son grandes respecto de la onda (régimen óptico): manda la forma, y por eso funcionan el conformado furtivo y los materiales absorbentes.'
  },
  Ku: {
    name: 'Banda Ku/Ka', ghz: 15, decoyTau: 12, bw: 0.8,
    note: 'Seguimiento de alta precisión a corto alcance, buscadores de misiles.',
    freq: '12–18 GHz (Ku) y 27–40 GHz (Ka)', lambda: [0.0075, 0.025], res: 'Muy alta.',
    uses: 'Radares de seguimiento de corto alcance (Pantsir 1RS2), buscadores activos, cañones.', pros: 'Precisión muy alta, antenas chicas.', cons: 'Alcance corto y mucha atenuación atmosférica y por lluvia.',
    rcs: { dron: 1.6 },
    rcsWhy: 'Las longitudes de onda milimétricas "ven" detalles chicos (hélices, motores, cables): el motor sube ×1,6 la RCS de los drones y deja igual el resto.'
  },
  ACU: {
    name: 'Acústico', bw: 360,
    note: 'Red de micrófonos: detecta motores de pistón/jet a pocos km. Inmune a RCS e interferencia radar.',
    freq: 'Sonido de motores: ~50–500 Hz', lambda: [0.7, 7], res: 'Baja: ubica por triangulación entre nodos.',
    uses: 'Redes de micrófonos contra drones (Sky Fortress).', pros: 'Barato, pasivo, inmune a la interferencia de radar y al RCS.', cons: 'Pocos km, solo blancos con motor ruidoso y a baja altura; no ve misiles rápidos.',
    rcsWhy: 'No usa RCS: el motor detecta drones dentro del alcance (R1) y por debajo de su altura máxima.'
  },
  OPT: {
    name: 'Óptico / IR', bw: 360,
    note: 'Detección visual/térmica: alcance corto, necesita línea de vista.',
    freq: 'Visible 0,4–0,7 µm · infrarrojo 3–14 µm', lambda: [4e-7, 1.4e-5], res: 'Muy alta.',
    uses: 'Visores térmicos de grupos móviles, MANPADS.', pros: 'Pasivo, preciso, inmune a la interferencia de radar.', cons: 'Alcance corto, depende del clima y de la línea de vista.',
    rcsWhy: 'No usa RCS: el motor usa un alcance fijo (R1) con línea de vista.'
  }
};
