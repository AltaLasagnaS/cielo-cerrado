// Bandas de sensores. bw = ancho de haz típico en grados (se usa para el modelo de interferencia:
// lóbulo principal vs lóbulos laterales).

export const BANDS = {
  VHF: { name: 'VHF (banda métrica)', bw: 6, note: 'Longitud de onda ~1–2 m: el "stealth" por forma pierde efecto (resonancia), pero precisión pobre: sirve para alerta, no para guiar misiles.' },
  L: { name: 'Banda L', bw: 3, note: 'Alerta temprana de largo alcance.' },
  S: { name: 'Banda S (E/F OTAN)', bw: 2, note: 'Buen compromiso alcance/clima; típica en radares de vigilancia 3D y AEW.' },
  C: { name: 'Banda C (G/H OTAN)', bw: 1.5, note: 'Radares multifunción de defensa aérea (Patriot, TRML-4D del IRIS-T).' },
  X: { name: 'Banda X (I/J OTAN)', bw: 1, note: 'Control de tiro: buena resolución, menos alcance y más afectada por lluvia.' },
  Ku: { name: 'Banda Ku/Ka', bw: 0.8, note: 'Seguimiento de alta precisión a corto alcance, buscadores de misiles.' },
  ACU: { name: 'Acústico', bw: 360, note: 'Red de micrófonos: detecta motores de pistón/jet a pocos km. Inmune a RCS e interferencia radar.' },
  OPT: { name: 'Óptico / IR', bw: 360, note: 'Detección visual/térmica: alcance corto, necesita línea de vista.' }
};
