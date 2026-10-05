// @ts-check
// Guerra electrónica: interferidores de ruido contra radares y supresores/engañadores GNSS.
// P = potencia relativa (parámetro de juego, no es una potencia física en watts).
// spoofKm = desvío típico por ENGAÑO GNSS (km); sin él, el anti-GNSS solo interfiere (error menor).
// linkJam = además corta los enlaces de datos (módem/mesh) de las armas dentro de su radio.
//
// El efecto depende del ROL y del bando: los interferidores de radar degradan radares del bando
// contrario (herramienta del atacante) y los anti-GNSS desvían armas del bando contrario (herramienta
// del defensor). `both` queda reservado para equipos que pueden cambiar de operador.
import { WP, SRC } from './sources.js';

export const JAMMERS = {
  soj: { name: 'Avión de interferencia stand-off (tipo Il-22PP)', short: 'Jammer aéreo', side: 'RU', air: true, alt: 8000, P: 3e5, bands: ['S', 'C', 'X'],
    notes: ['Interferencia de ruido desde lejos. Pega fuerte solo cuando está en el lóbulo principal del radar (alineado con los blancos), y mucho menos por lóbulos laterales.', 'Bandas y potencia del Il-22PP no son públicas: los valores son genéricos de juego.'], sources: [WP('Ilyushin_Il-22'), SRC.keyaero_il22] },
  krasukha4: { name: 'Krasukha-4 (terrestre)', short: 'Krasukha-4', side: 'RU', air: false, mast: 6, P: 1e6, bands: ['X', 'Ku'],
    notes: ['Bandas X y Ku, alcance declarado ~300 km. Ucrania capturó uno en 2022.', 'Pensado contra radares aerotransportados y de control de tiro.'], sources: [WP('Krasukha_(electronic_warfare_system)')] },
  krasukha2: { name: 'Krasukha-2 (terrestre)', short: 'Krasukha-2', side: 'RU', air: false, mast: 6, P: 1e6, bands: ['S'],
    notes: ['Banda S, ~250 km: diseñado contra aviones AEW tipo E-3.'], sources: [WP('Krasukha_(electronic_warfare_system)')] },
  // ---- anti-GNSS: siempre a favor del DEFENSOR (desvían las armas que navegan por satélite) ----
  gnss: { name: 'Supresor GNSS ruso (tipo Pole-21)', short: 'Pole-21', side: 'RU', air: false, gnssJam: true, radius: 25,
    notes: ['No afecta radares: interfiere GPS/GLONASS. Las armas que dependen del satélite pasan a navegación inercial y se desvían.', 'Pole-21: ≥25 km por módulo, montado en torres de celular (fuente rusa). Protege bases e infraestructura rusas.', 'Las antenas CRPA y la navegación por terreno u óptica reducen el efecto (en el juego, el campo gnss de cada arma).'],
    sources: [SRC.topwar_pole21] },
  pokrova: { name: 'Pokrova (red ucraniana de supresión y engaño GNSS)', short: 'Pokrova', side: 'UA', air: false, gnssJam: true, radius: 25, spoofKm: 5,
    notes: ['Red nacional de estaciones anunciada en nov-2023 y operativa desde ene/feb-2024: suprime GPS/GLONASS o los engaña (spoofing) con coordenadas falsas.', 'Engañar no es lo mismo que meter ruido: el arma cree estar en otro lugar y se desvía kilómetros sin darse cuenta. No hay cifra pública para Pokrova; de Lima se dice "varios kilómetros". En algunas noches de nov/dic-2024, la mitad de los Shahed terminó "perdida localmente" o en Bielorrusia (esa categoría mezcla GE, señuelos y fallas).', 'No hay datos públicos de potencia, frecuencias ni radio por nodo: el radio y el desvío son valores de juego.', 'Las antenas CRPA rusas (Kometa-M de 4 elementos desde 2022, de 12 en las UMPK desde abr-2025 y de 16 desde mediados de 2025; CRPA chinas de 16 desde mar-2025) le restan mucho efecto.'],
    sources: [SRC.kp_pokrova, SRC.dx_pokrova, SRC.forbes_pokrova, SRC.dpost_spoof, SRC.euronews_lost, SRC.dx_lost] },
  lima: { name: 'Lima / Lima-Quant (estaciones anti-GNSS ucranianas)', short: 'Lima', side: 'UA', air: false, gnssJam: true, radius: 40, spoofKm: 3,
    notes: ['Interferencia, engaño y "ataque digital" al receptor GNSS. En uso desde 2024 contra bombas planeadoras UMPK/KAB y Shahed; según sus operadores, también contra crucero y Kinzhal.', '~€58.000 por estación; una ciudad grande necesita 30–100, porque contra una antena CRPA hacen falta muchas fuentes desde distintos puntos.', 'Cifras del fabricante y de la unidad, sin verificación independiente: más de 20.000 Shahed afectados, 58–61 Kinzhal "neutralizados", alcance de 300 km contra Kinzhal. Forbes y JAPCC confirman de forma independiente que la precisión de los KAB cayó en 2025.', 'Rusia respondió con Kometa-M24 y con planeadoras de mayor alcance (UMPK-PD, lanzadas desde más de 95 km).'],
    sources: [SRC.kp_lima, SRC.kp_lima2, SRC.nv_lima, SRC.forbes_kab25, SRC.japcc_kab, SRC.ki_kinzhal, SRC.forbes_limaq, SRC.mil_lima_half] },
  bukovel: { name: 'Bukovel-AD (antidrón ucraniano: enlaces y GNSS)', short: 'Bukovel-AD', side: 'UA', air: false, gnssJam: true, linkJam: true, radius: 15,
    notes: ['De Proximus, en servicio desde 2016. Detecta en 320–6.000 MHz hasta 70–100 km e interfiere enlaces de datos hasta 16–20 km. El fabricante declara supresión GNSS hasta 35 km, con 10 W por antena.', 'El motor solo representa la parte GNSS: cortar el enlace de control no detiene a un Shahed autónomo (sí "aterrizó" un ZALA 421-16E2 ruso).', 'Con 10 W y frente a receptores con CRPA, el radio real es mucho menor que el declarado: valor de juego conservador.'],
    sources: [WP('Bukovel_(counter_unmanned_aircraft_system)'), SRC.azov_bukovel, SRC.mil_bukovel] },
  // ---- contra radares: siempre a favor del ATACANTE (degradan los radares de la defensa) ----
  f16ecm: { name: 'F-16 ucraniano con autoprotección (ALQ-162 / ALQ-131)', short: 'F-16 ECM', side: 'UA', air: true, alt: 4000, P: 3e4, bands: ['C', 'X', 'Ku'],
    notes: ['Los F-16 holandeses llegaron con AN/ALQ-131 y los daneses con ALQ-162 en pilones ECIPS (TWZ informa el ALQ-162(V)6 instalado en los ucranianos; el ALQ-131 en Ucrania no está confirmado); un escuadrón de guerra electrónica de la USAF los reprogramó contra amenazas rusas (ago-2024).', 'El ALQ-131 cubre 2–20 GHz en configuraciones de 1 a 3 bandas: no se sabe cuáles tiene Ucrania. Acá se asumen las bandas de control de tiro (C/X/Ku).', 'Es un pod de autoprotección, no un interferidor stand-off: en el juego representa una patrulla escoltando un ataque, con mucha menos potencia que un Il-22PP o un Krasukha. Confianza baja.'],
    sources: [SRC.ng_alq131, SRC.fas_alq131, SRC.dx_f16nl, SRC.afm_f16ew, SRC.twz_f16pods] }
};

/**
 * Antenas CRPA que se pueden elegir para una salva (elementos; 0 = antena común). Una CRPA de N
 * elementos anula hasta N − 1 interferidores desde direcciones distintas (physics/navigation.js).
 * Referencias (confianza baja, docs/investigacion/guerra-electronica-ucraniana.md D3): Shahed 2022–23
 * sin CRPA o de 4; Kometa de 8 y 12 en Shahed y UMPK desde 2025; CRPA chinas de 16 en Shahed desde
 * mar-2025 y Kometa-M de 16 en Iskander-K desde mediados de 2025. Ingenieros ucranianos: contra 8 elementos hicieron falta 19 estaciones Lima; contra 16,
 * ni 104 alcanzaron.
 */
export const CRPA_SIZES = [0, 4, 8, 12, 16];

/**
 * Modos del ruido contra radares (docs/FISICA.md §4). El jammer reparte su potencia:
 *   barrera: en toda la banda; afecta por igual a todos los radares de sus bandas (×1).
 *   puntual: concentrada en la frecuencia de UN radar elegido (j.target): ×gain contra ese radar,
 *            nada contra los demás. Un radar con agilidad de frecuencia (radar.agile) salta de
 *            frecuencia pulso a pulso y le deja solo ×agileGain: contra él hay que usar barrera.
 *   DRFM:    no mete ruido: graba el pulso del radar y lo devuelve con demoras y corrimientos Doppler,
 *            así que sus copias reciben toda la ganancia de procesamiento del radar (el eccm no las
 *            achica) y el radar las ve como blancos. Crea falseTargets falsos blancos por barrido
 *            (valor de juego) que ocupan la capacidad de seguimiento (radar.tracks). Entran por el
 *            lóbulo principal cuando el haz pasa por el jammer, y por los laterales si son fuertes,
 *            salvo que el radar tenga blanqueo de lóbulos laterales (radar.slb). Una fracción fooled (valor
 *            de juego, sin dato público) pasa la clasificación y la batería le dispara: misiles perdidos.
 *            Ver docs/FISICA.md §4.
 * gain 10 (10 dB) es un valor de juego: la ganancia real es el cociente entre el ancho de la banda
 * barrida y el del radar, y puede ser mucho mayor.
 */
export const JAM_MODES = {
  barrage: { name: 'Barrera (toda la banda)', gain: 1 },
  spot: { name: 'Puntual (contra un radar)', gain: 10, agileGain: 0.1 },
  drfm: { name: 'Engaño DRFM (falsos blancos)', gain: 0, coherent: true, falseTargets: 20, fooled: 0.3 }
};
