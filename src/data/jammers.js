// Guerra electrónica: interferidores de ruido y supresión GNSS.
// P = potencia relativa (parámetro de juego, no es una potencia física en watts).
import { WP, SRC } from './sources.js';


export const JAMMERS = {
  soj: { name: 'Avión de interferencia stand-off (tipo Il-22PP)', short: 'Jammer aéreo', side: 'RU', air: true, alt: 8000, P: 3e5, bands: ['S', 'C', 'X'],
    notes: ['Interferencia de ruido desde lejos. Pega fuerte solo cuando está en el lóbulo principal del radar (alineado con los blancos), y mucho menos por lóbulos laterales.', 'Bandas y potencia del Il-22PP no son públicas: los valores son genéricos de juego.'], sources: [WP('Ilyushin_Il-22'), SRC.keyaero_il22] },
  krasukha4: { name: 'Krasukha-4 (terrestre)', short: 'Krasukha-4', side: 'RU', air: false, mast: 6, P: 1e6, bands: ['X', 'Ku'],
    notes: ['Bandas X y Ku, alcance declarado ~300 km. Ucrania capturó uno en 2022.', 'Pensado contra radares aerotransportados y de control de tiro.'], sources: [WP('Krasukha_(electronic_warfare_system)')] },
  krasukha2: { name: 'Krasukha-2 (terrestre)', short: 'Krasukha-2', side: 'RU', air: false, mast: 6, P: 1e6, bands: ['S'],
    notes: ['Banda S, ~250 km: diseñado contra aviones AEW tipo E-3.'], sources: [WP('Krasukha_(electronic_warfare_system)')] },
  gnss: { name: 'Supresor GNSS (tipo Pole-21 ruso / Pokrova ucraniano)', short: 'Anti-GNSS', side: 'both', air: false, gnssJam: true, radius: 25,
    notes: ['No afecta radares: interfiere o engaña GPS-GLONASS. Las armas que dependen del satélite se desvían.', 'Pole-21 es ruso (≥25 km por módulo, montado en torres de celular); Pokrova es el sistema ucraniano de engaño GNSS contra Shahed.', 'Las antenas CRPA (Kometa) y la navegación por terreno/óptica reducen el efecto.'], sources: [SRC.topwar_pole21, SRC.kp_pokrova] }
};
