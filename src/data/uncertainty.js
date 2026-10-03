// Rangos de incertidumbre: cada parámetro numérico relevante tiene {min, p (probable), max, c (confianza), src, nota}.
// El valor "p" es el que usa la simulación (applyProbable lo escribe sobre el catálogo al cargar);
// min y max quedan para el modo Monte Carlo (applySample).
import { S_ } from './sources.js';

// U(min, probable, max, confianza, [fuentes], nota). Confianza: 'alta' | 'media' | 'baja'.
// "est" en la nota = estimación propia (física o analogía), sin dato público directo.
export const U = (min, p, max, c, src, nota) => ({ min, p, max, c, src: src || [], nota: nota || '' });
export const PL = {
  v: ['Velocidad de crucero', 'm/s'], vDive: ['Velocidad terminal (picada)', 'm/s'], vLow: ['Velocidad rasante final', 'm/s'],
  agl: ['Altura de vuelo', 'm AGL'], cruiseAlt: ['Altura de crucero', 'm'], apogee: ['Apogeo', 'km'],
  rcs: ['RCS frontal (X/S)', 'm²'], rcsSide: ['RCS lateral (X/S)', 'm²'], rcsVHF: ['RCS en VHF', 'm²'], cep: ['CEP', 'm'], cost: ['Costo unitario', 'M US$'],
  decoys: ['Señuelos por misil', ''], manPk: ['Efecto de su maniobra terminal sobre la Pk', '×'],
  'info.rangeKm': ['Alcance', 'km'], 'info.warheadKg': ['Ojiva', 'kg'],
  'radar.R1': ['Radar: detección contra 1 m²', 'km'], 'radar.sector': ['Radar: sector de búsqueda', '°'], 'radar.scan': ['Radar: refresco', 's'], 'radar.altMax': ['Altura máxima detectable', 'm'],
  'sam.maxR': ['Alcance vs aeronaves/crucero', 'km'], 'sam.maxRtbm': ['Alcance vs balísticos', 'km'], 'sam.altMax': ['Techo', 'm'], 'sam.altMin': ['Altura mínima de enfrentamiento', 'm'],
  'sam.vInt': ['Velocidad media del interceptor', 'm/s'], 'sam.vmaxT': ['Blanco más rápido enfrentable', 'm/s'], 'sam.react': ['Tiempo de reacción', 's'],
  'sam.ch': ['Canales simultáneos', ''], 'sam.mag': ['Munición de la unidad', ''], 'sam.cost': ['Costo por disparo', 'M US$'],
  'sam.pk.dron': ['Pk por disparo vs drones', ''], 'sam.pk.crucero': ['Pk por disparo vs crucero', ''], 'sam.pk.supersonico': ['Pk por disparo vs supersónicos', ''],
  'sam.pk.balistico': ['Pk por disparo vs balísticos', ''], 'sam.pk.hiper': ['Pk por disparo vs hipersónicos', ''],
  alt: ['Altitud de patrulla', 'm'], radius: ['Radio de efecto', 'km'], spoofKm: ['Desvío típico por engaño GNSS', 'km'], P: ['Potencia relativa (juego)', '']
};
export const RCS_NOTE = 'est: sin medición pública; analogía con la tabla de GlobalSecurity (Tomahawk 0,5 m², ALCM furtivo <0,05, Harpoon/Exocet 0,1) y tamaño/forma';
export const VHF_NOTE = 'est: con λ≈1,5–2 m el cuerpo entra en zona de resonancia y el conformado furtivo pierde efecto';
export const PK_NOTE = 'calibrada contra tasas reportadas en Ucrania (ver "Calibración de Pk")';
export const UNC = {
  thr: {
    shahed: {
      v: U(39, 51, 58, 'alta', S_('ar_shahed', 'sprotyv'), '185 km/h típico; 140–150 km/h de promedio en rutas largas; 200–210 km/h a gran altura'),
      agl: U(50, 2000, 5000, 'alta', S_('u24_high', 'forbes_high', 'sprotyv'), '2022–23: 700–2.000 m; desde 2025: 2–5 km con picada final'),
      rcs: U(0.01, 0.05, 0.2, 'baja', S_('kharkiv_rcs', 'sprotyv'), 'Modelado de Járkov: mediana 0,23 m² (X) en todos los aspectos; de frente la detección es 1,7–2× menor que de costado, o sea σ frontal 8–16× menor'),
      rcsSide: U(0.3, 1, 3, 'baja', S_('kharkiv_rcs'), 'media lateral modelada 1,6 m² (X) y 2,1 m² (S)'),
      rcsVHF: U(0.1, 0.3, 1, 'baja', [], 'est: envergadura 2,5 m frente a λ 1,5–2 m: resonancia; motor y estructura conductora'),
      cep: U(5, 15, 50, 'baja', [], 'est: con GNSS + CRPA 10–20 m; solo INS empeora mucho'),
      cost: U(0.02, 0.035, 0.08, 'media', S_('csis_cost_uav', 'ep_costs'), 'CSIS: 20–80k, usa 35k; Forbes Ukraine 50k; exportación iraní 193k'),
      'info.rangeKm': U(650, 1500, 2500, 'media', S_('isis_wh', 'ar_shahed'), 'el informe de ISIS dice que con BCh-90 cae a ~650 km desde ~1.350 km'),
      'info.warheadKg': U(40, 50, 90, 'alta', S_('isis_wh'), 'BCh-50 o BCh-90 (62 kg de explosivo)')
    },
    geran3: {
      v: U(83, 92, 103, 'alta', S_('dx_geran3', 'mil_geran3', 'forbes_geran3'), 'GUR: 300 km/h crucero, 370 km/h máx.'),
      agl: U(100, 1500, 5000, 'baja', [], 'est: mismo envolvente que el Geran-2'),
      rcs: U(0.02, 0.05, 0.2, 'baja', S_('dx_geran3'), 'est: misma célula que el Geran-2, sin hélice pero con toma de aire'),
      rcsVHF: U(0.1, 0.3, 1, 'baja', [], VHF_NOTE),
      cep: U(5, 15, 50, 'baja', [], 'est: como el Geran-2'),
      cost: U(0.05, 0.07, 0.1, 'baja', S_('forbes_geran3', 'dx_geran3'), 'est: Geran-2 + ~40%; el JT80 cuesta 18–35k'),
      'info.rangeKm': U(600, 1000, 1500, 'media', S_('dx_geran3', 'forbes_geran3'), ''),
      'info.warheadKg': U(50, 50, 90, 'media', S_('forbes_geran3', 'csis_s238'), '')
    },
    gerbera: {
      v: U(33, 40, 44, 'media', S_('wp:Gerbera_(drone)'), 'hasta 160 km/h'),
      agl: U(100, 1200, 3000, 'media', S_('wp:Gerbera_(drone)'), ''),
      rcs: U(0.005, 0.02, 0.05, 'baja', [], 'est: espuma casi transparente; reflejan motor, electrónica y cableado'),
      rcsVHF: U(0.03, 0.1, 0.3, 'baja', [], VHF_NOTE),
      cost: U(0.003, 0.01, 0.015, 'media', S_('isis_decoy', 'kp_gerbera'), '"unos pocos miles" a ~10k'),
      'info.rangeKm': U(300, 450, 600, 'media', S_('kp_gerbera'), '')
    },
    kh101: {
      v: U(195, 200, 270, 'alta', S_('csis_kh101'), 'Mach 0,58 crucero, 0,78 máx.'),
      agl: U(30, 50, 70, 'alta', S_('csis_kh101'), '30–70 m en la fase final; tramos de crucero más altos'),
      rcs: U(0.01, 0.03, 0.1, 'baja', S_('gs_rcs'), RCS_NOTE + '; forma de baja observabilidad'),
      rcsSide: U(0.1, 0.3, 1, 'baja', [], 'est: cuerpo de 7,45 m visto de costado'),
      rcsVHF: U(0.3, 0.5, 1, 'baja', [], VHF_NOTE),
      cep: U(6, 15, 20, 'media', S_('csis_kh101', 'gs_kh101'), 'CSIS: 6 m, generalmente 10–20 m'),
      cost: U(1.2, 2.2, 13, 'media', S_('costs_leak', 'ep_costs', 'rs_costs'), 'contratos filtrados 2,0–2,4 M; Forbes Ukraine 13 M (inflado)'),
      'info.rangeKm': U(2500, 2800, 5500, 'media', S_('csis_kh101', 'gs_kh101'), 'con dos ojivas, más o menos la mitad'),
      'info.warheadKg': U(400, 450, 800, 'alta', S_('csis_kh101', 'twz_2wh'), '')
    },
    kalibr: {
      v: U(230, 240, 270, 'alta', S_('wp:Kalibr_(missile_family)', 'csis_kalibr'), 'Mach 0,7–0,8'),
      agl: U(20, 50, 150, 'media', S_('wp:Kalibr_(missile_family)'), '≈20 m sobre el agua, 50–150 m sobre tierra'),
      rcs: U(0.05, 0.1, 0.3, 'baja', S_('gs_rcs'), RCS_NOTE),
      rcsSide: U(0.5, 1, 3, 'baja', [], 'est'),
      rcsVHF: U(0.3, 0.5, 1, 'baja', [], VHF_NOTE),
      cep: U(3, 10, 20, 'baja', S_('wp:Kalibr_(missile_family)'), '2–3 m declarado con GLONASS; real est 5–20 m'),
      cost: U(1.0, 2.0, 6.5, 'media', S_('costs_leak', 'ep_costs', 'rs_costs'), ''),
      'info.rangeKm': U(1400, 1750, 2500, 'media', S_('csis_kalibr'), ''),
      'info.warheadKg': U(450, 450, 500, 'alta', S_('csis_kalibr'), '')
    },
    isk_k: {
      v: U(220, 250, 280, 'baja', [], 'est: derivado del Kalibr, subsónico'),
      agl: U(6, 50, 150, 'media', S_('rusi_isk22'), ''),
      rcs: U(0.05, 0.1, 0.3, 'baja', S_('gs_rcs'), RCS_NOTE),
      rcsVHF: U(0.3, 0.5, 1, 'baja', [], VHF_NOTE),
      cep: U(3, 10, 20, 'baja', S_('rusi_isk22'), '1–3 m declarado'),
      cost: U(1.0, 1.6, 1.8, 'media', S_('costs_leak', 'rs_costs'), ''),
      'info.rangeKm': U(480, 500, 500, 'media', S_('rusi_isk22'), ''),
      'info.warheadKg': U(480, 480, 500, 'alta', S_('rusi_isk22'), '')
    },
    isk_m: {
      v: U(1000, 1150, 1400, 'media', S_('gur_isk', 'wp:9K720_Iskander'), 'velocidad horizontal media del modelo; pico 2.100–2.600 m/s, 1.300–1.400 m/s cerca del blanco'),
      apogee: U(40, 45, 100, 'media', S_('gur_isk', 'rusi_isk25'), 'típico 40–50 km; el GUR da 100 km como máximo'),
      rcs: U(0.03, 0.1, 0.3, 'baja', [], 'est: cuerpo cónico-ojival de 0,92 m de diámetro visto de nariz'),
      rcsVHF: U(0.1, 0.3, 1, 'baja', [], VHF_NOTE),
      cep: U(5, 25, 30, 'media', S_('gur_isk', 'rusi_isk22', 'csis_isk'), 'GUR: 20–30 m; 5–7 m es valor de folleto'),
      cost: U(2.4, 2.7, 3.0, 'alta', S_('costs_leak'), ''),
      decoys: U(2, 6, 6, 'media', S_('gur_isk', 'twz_9b899', 'rusi_isk25'), 'unos 6 señuelos 9B899 por misil (RUSI escribe 9B999). El juego no modela la discriminación del radar: el mínimo representa un radar que descarta la mayoría'),
      manPk: U(0.4, 0.6, 0.85, 'baja', S_('ft_aerotime', 'rusi_isk25'), 'calibrado: perfil con la actualización de 2025; 0,85 ≈ perfil 2023–24'),
      'info.rangeKm': U(390, 450, 550, 'alta', S_('gur_isk'), ''),
      'info.warheadKg': U(450, 480, 700, 'media', S_('gur_isk', 'rusi_isk22'), '')
    },
    kinzhal: {
      v: U(1100, 1250, 1500, 'media', S_('wp:Kh-47M2_Kinzhal', 'csis_kinzhal'), '≈1.240 m/s medido en la intercepción (The Economist); CSIS: acelera a Mach 4'),
      apogee: U(35, 45, 80, 'baja', S_('gs_kinzhal'), 'est por física: lanzado a 15–20 km y Mach 2+'),
      rcs: U(0.03, 0.1, 0.3, 'baja', S_('gs_kinzhal'), '"aproximadamente la del 9M723"'),
      rcsVHF: U(0.1, 0.3, 1, 'baja', [], VHF_NOTE),
      cep: U(10, 20, 30, 'baja', [], 'est: análogo al Iskander-M'),
      cost: U(2, 4.5, 15, 'media', S_('costs_leak', 'ep_costs', 'rs_costs'), 'contrato filtrado 4,4–4,5 M'),
      manPk: U(0.6, 0.8, 0.9, 'baja', S_('ft_aerotime'), 'calibrado'),
      'info.rangeKm': U(460, 470, 480, 'media', S_('wp:Kh-47M2_Kinzhal'), ''),
      'info.warheadKg': U(480, 480, 500, 'media', S_('csis_kinzhal'), '')
    },
    kh22: {
      v: U(1030, 1100, 1360, 'media', S_('wp:Kh-22', 'wp:Kh-32'), 'Mach 3,5–4,6'),
      vDive: U(900, 1100, 1350, 'baja', [], 'est: no hay medición pública de la picada'),
      cruiseAlt: U(12000, 27000, 40000, 'media', S_('wp:Kh-22', 'wp:Kh-32'), '≈27 km régimen alto; ≈12 km régimen bajo; Kh-32 hasta ~40 km'),
      rcs: U(0.5, 1, 3, 'baja', [], 'est: 11,6 m de largo y 0,9 m de diámetro, sin conformado furtivo'),
      rcsVHF: U(1, 3, 10, 'baja', [], VHF_NOTE),
      cep: U(90, 150, 500, 'baja', S_('wp:Kh-22'), '>91 m; buscador antibuque, malo contra tierra'),
      cost: U(0.5, 1, 1.5, 'baja', S_('ep_costs'), 'solo estimación Forbes/EP'),
      'info.rangeKm': U(600, 600, 1000, 'media', S_('wp:Kh-22', 'wp:Kh-32'), ''),
      'info.warheadKg': U(500, 950, 1000, 'alta', S_('wp:Kh-22'), '')
    },
    oniks: {
      v: U(700, 750, 884, 'media', S_('wp:P-800_Oniks', 'rbc_oniks'), 'Mach 2,6 a 14 km'),
      vLow: U(600, 680, 750, 'media', S_('wp:P-800_Oniks'), 'Mach 2 a ras'),
      cruiseAlt: U(10000, 14000, 15000, 'media', S_('rbc_oniks'), ''),
      agl: U(10, 15, 20, 'media', S_('rbc_oniks'), ''),
      rcs: U(0.1, 0.3, 1, 'baja', [], 'est: toma de aire frontal anular (cavidad) de 0,7 m'),
      rcsVHF: U(0.5, 1, 3, 'baja', [], VHF_NOTE),
      cep: U(10, 20, 50, 'baja', [], 'est: buscador nuevo para tierra desde 2024'),
      cost: U(1, 1.25, 1.5, 'baja', S_('rs_costs'), ''),
      'info.rangeKm': U(300, 500, 600, 'media', S_('wp:P-800_Oniks'), ''),
      'info.warheadKg': U(200, 250, 300, 'media', S_('wp:P-800_Oniks'), '')
    },
    zircon: {
      v: U(690, 1500, 2000, 'media', S_('gur_zircon', 'dx_zircon', 'ki_zircon'), 'GUR: máx. Mach 6,8; Defense Express: Mach 5,5 a mitad de vuelo'),
      vDive: U(690, 1150, 1500, 'media', S_('dx_zircon', 'nv_zircon', 'ki_zircon'), '≈Mach 4,5 en la aproximación; KNDISE midió ~2.500 km/h al final'),
      cruiseAlt: U(25000, 30000, 40000, 'media', S_('gur_zircon'), ''),
      rcs: U(0.05, 0.15, 0.5, 'baja', [], 'est: 0,67 m de diámetro, nariz cónica; la "invisibilidad por plasma" no está verificada'),
      rcsVHF: U(0.2, 0.5, 1, 'baja', [], VHF_NOTE),
      cep: U(10, 30, 50, 'baja', [], 'est'),
      cost: U(5.0, 5.4, 5.6, 'alta', S_('costs_leak'), ''),
      manPk: U(0.7, 0.85, 1, 'baja', [], 'est'),
      'info.rangeKm': U(500, 800, 1000, 'baja', S_('dx_zircon'), 'oficialmente no confirmado'),
      'info.warheadKg': U(40, 120, 300, 'media', S_('u24_zircon', 'ki_zircon'), '')
    },
    storm: {
      v: U(270, 275, 323, 'alta', S_('wp:Storm_Shadow', 'dmn_storm'), 'Mach 0,8–0,95'),
      agl: U(30, 35, 40, 'alta', S_('dmn_storm'), ''),
      rcs: U(0.01, 0.05, 0.1, 'baja', S_('gs_rcs', 'dmn_storm'), RCS_NOTE),
      rcsVHF: U(0.2, 0.5, 1, 'baja', [], VHF_NOTE),
      cep: U(1, 2, 3, 'baja', S_('dmn_storm'), 'no hay CEP oficial; buscador IR de imagen'),
      cost: U(1.3, 2.5, 2.8, 'media', S_('wp:Storm_Shadow', 'aoav_storm'), ''),
      'info.rangeKm': U(250, 250, 550, 'alta', S_('wp:Storm_Shadow', 'dn_storm'), ''),
      'info.warheadKg': U(450, 450, 450, 'alta', S_('wp:Storm_Shadow'), '')
    },
    atacms: {
      v: U(900, 1000, 1200, 'media', S_('wp:MGM-140_ATACMS'), 'Mach 3+'),
      apogee: U(25, 40, 50, 'media', S_('wp:MGM-140_ATACMS'), '50 km es el techo; a 300 km un tiro óptimo daría ~75 km, así que la trayectoria es deprimida'),
      rcs: U(0.05, 0.1, 0.3, 'baja', [], 'est: cuerpo de 0,61 m visto de nariz'),
      rcsSide: U(1, 3, 10, 'baja', [], 'est'),
      rcsVHF: U(0.1, 0.3, 1, 'baja', [], VHF_NOTE),
      cep: U(9, 10, 50, 'media', S_('csis_atacms'), ''),
      cost: U(0.82, 1.5, 1.7, 'media', S_('wp:MGM-140_ATACMS'), ''),
      'info.rangeKm': U(165, 300, 300, 'alta', S_('csis_atacms'), ''),
      'info.warheadKg': U(230, 230, 560, 'alta', S_('csis_atacms'), '')
    },
    neptune: {
      v: U(250, 260, 270, 'media', S_('rbc_neptune'), ''),
      agl: U(3, 15, 100, 'media', S_('rbc_neptune'), '4–5 m sobre el mar; est ~30 m sobre tierra'),
      rcs: U(0.05, 0.1, 0.3, 'baja', S_('gs_rcs'), 'est: análogo a Harpoon/Exocet'),
      rcsVHF: U(0.2, 0.5, 1, 'baja', [], VHF_NOTE),
      cep: U(5, 10, 20, 'baja', [], 'no público'),
      cost: U(0.5, 1.5, 2, 'baja', [], 'sin cifra oficial; estimación de prensa'),
      'info.rangeKm': U(280, 300, 1000, 'media', S_('wp:R-360_Neptune', 'mil_neptune'), ''),
      'info.warheadKg': U(150, 150, 260, 'media', S_('rbc_neptune'), '')
    },
    lyutyi: {
      v: U(44, 56, 83, 'baja', S_('wp:Liutyi'), 'fuentes entre 160 y 300 km/h'),
      agl: U(50, 500, 3000, 'baja', [], 'est: análogo al Shahed'),
      rcs: U(0.1, 0.3, 1, 'baja', [], 'est: motor y hélice como reflectores principales'),
      rcsVHF: U(0.3, 1, 2, 'baja', [], VHF_NOTE),
      cep: U(3, 10, 20, 'baja', [], 'est'),
      cost: U(0.15, 0.2, 0.25, 'media', S_('wp:Liutyi', 'emp_liutyi'), ''),
      'info.rangeKm': U(800, 1200, 2000, 'media', S_('wp:Liutyi', 'emp_liutyi'), ''),
      'info.warheadKg': U(50, 75, 75, 'alta', S_('wp:Liutyi'), '')
    },
    flamingo: {
      v: U(194, 245, 264, 'media', S_('wp:FP-5_Flamingo', 'mil_flamingo'), '700 km/h crucero a 950 km/h máx. declarado'),
      agl: U(15, 35, 114, 'baja', S_('wp:FP-5_Flamingo'), ''),
      rcs: U(0.3, 1, 2, 'baja', [], 'est: fuselaje de composite pero góndola de motor dorsal grande'),
      rcsVHF: U(1, 2, 5, 'baja', [], VHF_NOTE),
      cep: U(14, 14, 50, 'baja', S_('wp:FP-5_Flamingo'), '14 m declarado'),
      cost: U(0.5, 0.6, 1.1, 'media', S_('ukr_flamingo'), ''),
      'info.rangeKm': U(950, 1800, 3000, 'media', S_('ukr_flamingo', 'wp:FP-5_Flamingo'), '3.000 km es dato del fabricante'),
      'info.warheadKg': U(1000, 1000, 1150, 'alta', S_('wp:FP-5_Flamingo'), 'declarado')
    }
  },
  def: {
    patriot: {
      'radar.R1': U(90, 100, 120, 'baja', S_('rt_mpq53'), 'est: 170 km es el alcance instrumentado; avión grande 150–170 km, escalado con σ^¼'),
      'radar.sector': U(90, 90, 120, 'media', S_('rt_mpq53'), 'búsqueda 90°, seguimiento 120°'),
      'radar.scan': U(1, 2, 3, 'baja', [], 'est: barrido electrónico en sector fijo'),
      'sam.maxR': U(60, 100, 120, 'baja', S_('wp:MIM-104_Patriot'), ''),
      'sam.maxRtbm': U(30, 40, 60, 'baja', S_('wp:MIM-104_Patriot'), ''),
      'sam.altMax': U(35000, 36000, 40000, 'media', S_('wp:MIM-104_Patriot'), ''),
      'sam.vInt': U(1100, 1300, 1500, 'baja', [], 'est: ≈0,75 × velocidad máxima'),
      'sam.react': U(8, 9, 15, 'baja', S_('ar_samp_pat'), ''),
      'sam.ch': U(6, 8, 9, 'media', S_('rt_mpq53'), '9 misiles guiados a la vez'),
      'sam.mag': U(12, 16, 48, 'media', S_('csis_patriot'), 'M903: 12 MSE; 6–8 lanzadores por batería'),
      'sam.cost': U(4.0, 4.2, 5.3, 'alta', S_('army_jb25', 'bd_pac3'), 'FY2025: 4,19 M; plurianual 2025 ≈4,97 M con costos asociados'),
      'sam.pk.dron': U(0.8, 0.9, 0.95, 'baja', [], 'est'),
      'sam.pk.crucero': U(0.8, 0.9, 0.95, 'media', [], PK_NOTE),
      'sam.pk.supersonico': U(0.4, 0.6, 0.8, 'baja', S_('rbc_kh22'), PK_NOTE),
      'sam.pk.balistico': U(0.4, 0.7, 0.85, 'media', S_('rusi_isk25', 'ft_aerotime'), PK_NOTE),
      'sam.pk.hiper': U(0.3, 0.5, 0.7, 'baja', S_('nv_zircon'), PK_NOTE)
    },
    patriot2: {
      'radar.R1': U(90, 100, 120, 'baja', S_('rt_mpq53'), 'mismo radar que el MSE'),
      'radar.sector': U(90, 90, 120, 'media', S_('rt_mpq53'), ''),
      'sam.maxR': U(120, 160, 160, 'baja', S_('wp:MIM-104_Patriot'), ''),
      'sam.maxRtbm': U(15, 20, 30, 'baja', [], ''),
      'sam.altMax': U(24000, 24000, 32000, 'baja', S_('wp:MIM-104_Patriot'), ''),
      'sam.vInt': U(800, 900, 1100, 'baja', [], 'est: Mach 3,5 máx.'),
      'sam.cost': U(2, 3, 4, 'baja', S_('ar_gemt'), 'precio oficial no público'),
      'sam.pk.crucero': U(0.7, 0.85, 0.9, 'baja', [], PK_NOTE),
      'sam.pk.supersonico': U(0.4, 0.55, 0.7, 'baja', [], PK_NOTE),
      'sam.pk.balistico': U(0.2, 0.4, 0.6, 'baja', [], PK_NOTE),
      'sam.pk.hiper': U(0.1, 0.25, 0.4, 'baja', [], PK_NOTE)
    },
    sampt: {
      'radar.R1': U(70, 80, 100, 'media', S_('at_aster', 'csis_sampt'), 'Arabel: ~100 km, banda X, 60 rpm'),
      'sam.maxR': U(50, 100, 120, 'media', S_('at_aster', 'csis_sampt'), '100 km por encima de 3 km de altura, 50 km por debajo'),
      'sam.maxRtbm': U(20, 25, 35, 'baja', S_('at_aster'), 'prueba: intercepción a 26 km de distancia'),
      'sam.altMax': U(20000, 20000, 20000, 'media', S_('at_aster'), ''),
      'sam.vInt': U(950, 1050, 1200, 'baja', [], 'est: 1,4 km/s máx.'),
      'sam.react': U(5, 8, 10, 'baja', S_('ar_samp_pat'), ''),
      'sam.ch': U(10, 10, 10, 'media', S_('csis_sampt'), ''),
      'sam.mag': U(24, 32, 48, 'media', S_('at_aster'), '4–6 lanzadores × 8'),
      'sam.cost': U(1, 2, 3, 'baja', [], 'sin precio oficial; €1–2,5 M según fuentes'),
      'sam.pk.crucero': U(0.75, 0.88, 0.95, 'media', [], PK_NOTE),
      'sam.pk.balistico': U(0.3, 0.6, 0.8, 'baja', S_('ar_samp_pat'), PK_NOTE + '; problemas de software reportados en 2025'),
      'sam.pk.hiper': U(0.2, 0.4, 0.6, 'baja', S_('nv_zircon'), PK_NOTE)
    },
    irist: {
      'radar.R1': U(80, 100, 150, 'media', S_('hensoldt'), 'cazas a más de 120 km, misiles supersónicos a más de 60 km'),
      'sam.maxR': U(40, 40, 40, 'alta', S_('wp:IRIS-T_SL'), ''),
      'sam.maxRtbm': U(0, 0, 10, 'baja', [], 'sin datos públicos de capacidad antibalística (se quitó del modelo)'),
      'sam.altMax': U(20000, 20000, 20000, 'alta', S_('wp:IRIS-T_SL'), ''),
      'sam.altMin': U(5, 10, 30, 'baja', [], 'est: no publicado; buscador IR de imagen, sin problema de clutter de mar'),
      'sam.vInt': U(650, 750, 850, 'baja', [], 'est: ≈Mach 3 máx.'),
      'sam.vmaxT': U(1000, 1200, 1500, 'baja', [], 'est: no hay datos contra blancos de Mach 3+'),
      'sam.ch': U(8, 8, 12, 'baja', S_('dm_iris'), '"100% en oleadas de más de 12 blancos"'),
      'sam.cost': U(0.43, 0.5, 0.61, 'media', S_('wp:IRIS-T_SL'), '€400–565k'),
      'sam.pk.dron': U(0.8, 0.9, 0.97, 'media', S_('dm_iris'), PK_NOTE),
      'sam.pk.crucero': U(0.8, 0.88, 0.97, 'media', S_('dm_iris'), PK_NOTE),
      'sam.pk.supersonico': U(0.1, 0.2, 0.35, 'baja', S_('syrskyi'), 'est: sin datos contra Mach 2–4; Oniks 5,7% a nivel nacional')
    },
    nasams: {
      'radar.R1': U(40, 60, 90, 'media', S_('wp:AN/MPQ-64_Sentinel'), '40 km el básico, 120 km el F1/A3'),
      'sam.maxR': U(25, 35, 40, 'media', S_('crs_nasams'), ''),
      'sam.altMax': U(12000, 15000, 21000, 'baja', S_('kongsberg'), 'est'),
      'sam.altMin': U(15, 30, 60, 'baja', [], 'est: buscador radar activo contra clutter de superficie'),
      'sam.vInt': U(800, 900, 1000, 'baja', [], 'est'),
      'sam.cost': U(1.0, 1.07, 2.5, 'alta', S_('dod_p1_25'), 'AIM-120 ≈1,07 M (P-1 FY2025); AMRAAM-ER sin precio oficial'),
      'sam.pk.dron': U(0.75, 0.85, 0.94, 'media', S_('aw_nasams'), PK_NOTE),
      'sam.pk.crucero': U(0.75, 0.88, 0.94, 'media', S_('aw_nasams'), PK_NOTE + '; Noruega reclama 94%'),
      'sam.pk.supersonico': U(0.25, 0.4, 0.6, 'baja', [], 'est')
    },
    s300: {
      'radar.R1': U(80, 100, 130, 'baja', S_('apa_fc'), 'est'),
      'radar.sector': U(90, 90, 90, 'alta', S_('apa_fc'), ''),
      'sam.maxR': U(47, 75, 75, 'alta', S_('wp:S-300_missile_system'), '5V55K 47 km / 5V55R 75 km'),
      'sam.vInt': U(1100, 1300, 1500, 'baja', [], 'est: 2.000 m/s máx.'),
      'sam.ch': U(4, 4, 6, 'media', S_('apa_fc', 'wp:S-300_missile_system'), 'PT: 4 blancos; PS: 6'),
      'sam.cost': U(0.3, 0.5, 1, 'baja', [], 'est: sin precio público'),
      'sam.pk.crucero': U(0.4, 0.6, 0.75, 'media', S_('syrskyi'), PK_NOTE),
      'sam.pk.balistico': U(0.05, 0.15, 0.3, 'baja', S_('syrskyi'), PK_NOTE)
    },
    buk: {
      'radar.R1': U(35, 50, 85, 'baja', S_('wp:Buk_missile_system'), '9S18M1 85 km a altura; 9S35 est 40–50 km'),
      'sam.maxR': U(33, 35, 42, 'media', S_('missilery_buk'), ''),
      'sam.vInt': U(550, 650, 750, 'baja', [], 'est: ≈850 m/s máx.'),
      'sam.vmaxT': U(800, 830, 1000, 'media', S_('wp:Buk_missile_system'), ''),
      'sam.react': U(15, 22, 25, 'media', S_('missilery_buk'), ''),
      'sam.cost': U(0.3, 0.5, 1, 'baja', [], 'est'),
      'sam.pk.crucero': U(0.4, 0.6, 0.75, 'media', S_('syrskyi'), PK_NOTE)
    },
    gepard: {
      'sam.maxR': U(3.5, 4, 5.5, 'media', S_('wp:Flakpanzer_Gepard'), ''),
      'sam.altMax': U(2500, 3000, 3500, 'baja', [], 'est'),
      'sam.mag': U(16, 20, 32, 'media', S_('wp:Flakpanzer_Gepard'), '640 proyectiles / 20–40 por ráfaga'),
      'sam.cost': U(0.012, 0.018, 0.024, 'media', S_('forbes_gepard'), '≈US$600 por proyectil × 20–40'),
      'sam.pk.dron': U(0.35, 0.55, 0.75, 'baja', [], PK_NOTE)
    },
    mfg: {
      'radar.R1': U(2, 5, 8, 'baja', [], 'est: visual/térmico nocturno con alerta acústica'),
      'sam.maxR': U(1, 1.5, 2, 'media', [], ''),
      'sam.pk.dron': U(0.05, 0.2, 0.3, 'baja', [], PK_NOTE)
    },
    manpads: {
      'sam.maxR': U(4.5, 4.8, 6, 'alta', S_('wp:FIM-92_Stinger', 'wp:9K38_Igla'), ''),
      'sam.vInt': U(450, 550, 650, 'baja', [], 'est'),
      'sam.cost': U(0.06, 0.45, 0.5, 'media', S_('wp:FIM-92_Stinger', 'wp:9K38_Igla'), 'Igla 60–80k; Stinger >400k'),
      'sam.pk.dron': U(0.3, 0.5, 0.7, 'baja', [], 'est')
    },
    intdrone: {
      'sam.maxR': U(10, 25, 25, 'media', S_('wp:Sting_(drone)'), ''),
      'sam.vInt': U(70, 85, 95, 'media', S_('wp:Sting_(drone)'), '343 km/h máx.'),
      'sam.vmaxT': U(70, 95, 100, 'baja', S_('mil_geran3'), 'derribó un Geran-3 de frente'),
      'sam.react': U(10, 20, 40, 'baja', [], 'est: despegue y aproximación'),
      'sam.cost': U(0.002, 0.003, 0.005, 'media', S_('wp:Sting_(drone)', 'dn_interceptors'), ''),
      'sam.pk.dron': U(0.4, 0.6, 0.75, 'media', S_('dn_interceptors'), '>60% de éxito por salida')
    },
    pantsir: {
      'radar.R1': U(25, 30, 36, 'media', S_('apa_pantsir'), '36 km vs 2 m²'),
      'sam.maxR': U(18, 18, 20, 'media', S_('gs_57e6'), ''),
      'sam.vInt': U(780, 900, 1000, 'media', S_('gs_57e6', 'apa_pantsir'), ''),
      'sam.ch': U(2, 3, 4, 'baja', S_('apa_pantsir'), ''),
      'sam.cost': U(0.1, 0.15, 0.2, 'baja', [], 'est'),
      'sam.pk.crucero': U(0.4, 0.6, 0.75, 'baja', [], 'est')
    },
    tor: {
      'radar.R1': U(20, 25, 32, 'media', S_('ar_tor', 'wp:Tor_missile_system'), '>30 km contra cazas'),
      'sam.maxR': U(15, 15, 16, 'media', S_('gs_9m338', 'ar_tor'), ''),
      'sam.vInt': U(600, 700, 850, 'baja', [], 'est'),
      'sam.cost': U(0.2, 0.3, 0.5, 'baja', [], 'est'),
      'sam.pk.crucero': U(0.5, 0.7, 0.8, 'baja', [], 'est')
    },
    s400: {
      'radar.R1': U(150, 200, 250, 'baja', S_('ar_92n6'), '92N6: 250–340 km contra blancos grandes'),
      'sam.maxR': U(240, 250, 250, 'alta', S_('wp:S-400_missile_system'), ''),
      'sam.maxRtbm': U(40, 60, 60, 'media', S_('csis_s400'), ''),
      'sam.vInt': U(1300, 1500, 1700, 'baja', [], 'est: 2.000 m/s máx.'),
      'sam.cost': U(1, 1.5, 2.5, 'baja', [], 'est: sin precio público'),
      'sam.pk.crucero': U(0.5, 0.7, 0.85, 'baja', [], 'est'),
      'sam.pk.balistico': U(0.3, 0.5, 0.7, 'baja', S_('tass_atacms'), 'las cifras rusas contra ATACMS (≈79%) no son verificables')
    },
    ewr: {
      'radar.R1': U(110, 175, 200, 'media', S_('rt_36d6', 'uos_36d6'), '200 km instrumentados'),
      'radar.scan': U(5, 5, 10, 'media', S_('rt_36d6'), '6 o 12 rpm')
    },
    p18: {
      'radar.R1': U(120, 160, 200, 'baja', S_('dx_p18'), ''),
      'radar.scan': U(6, 6, 6, 'alta', S_('wp:P-18_radar'), '10 rpm')
    },
    acoustic: {
      'radar.R1': U(2, 5, 8, 'baja', S_('odessa_sf'), 'est: cada sensor 1–3 km; el ícono es un grupo'),
      'radar.altMax': U(2000, 3000, 4000, 'baja', [], 'est')
    },
    aew_s340: {
      'radar.R1': U(200, 240, 280, 'media', S_('gs_erieye', 'wp:Erieye'), 'cazas a 330–350 km'),
      'radar.sector': U(150, 150, 160, 'media', S_('gs_erieye'), ''),
      alt: U(5000, 6000, 7600, 'media', S_('wp:Saab_340_AEW&C'), '')
    },
    aew_a50: {
      'radar.R1': U(180, 230, 300, 'baja', S_('wp:Beriev_A-50'), 'est'),
      alt: U(8000, 9000, 10000, 'baja', [], 'est')
    }
  },
  jam: {
    soj: { P: U(1e5, 3e5, 1e6, 'baja', [], 'parámetro de juego: bandas y potencia del Il-22PP no son públicas') },
    krasukha4: { P: U(3e5, 1e6, 3e6, 'baja', [], 'parámetro de juego') },
    krasukha2: { P: U(3e5, 1e6, 3e6, 'baja', [], 'parámetro de juego') },
    gnss: { radius: U(15, 25, 50, 'media', S_('topwar_pole21'), '≥25 km por módulo (fuente rusa)') },
    pokrova: {
      radius: U(10, 25, 50, 'baja', S_('dx_pokrova', 'kp_pokrova'), 'est: no hay radio por nodo publicado; mismo orden de magnitud que Pole-21. La red nacional son muchos nodos superpuestos'),
      spoofKm: U(2, 5, 10, 'baja', S_('dx_pokrova', 'forbes_pokrova'), 'primeros reportes ucranianos de 2024: desvíos de 5–10 km')
    },
    lima: {
      radius: U(20, 40, 100, 'baja', S_('kp_lima2', 'forbes_limaq', 'ki_kinzhal'), 'fabricante: CRPA a 50 km, KAB a más de 100 km, Kinzhal a 300 km. Que una ciudad necesite 30–100 estaciones sugiere un radio efectivo menor contra CRPA; est'),
      spoofKm: U(1, 3, 10, 'baja', S_('forbes_kab25', 'nv_lima'), 'est: desvíos de km contra planeadoras (Forbes); sin cifra pública por arma')
    },
    bukovel: { radius: U(5, 15, 35, 'baja', S_('wp:Bukovel_(counter_unmanned_aircraft_system)', 'azov_bukovel'), 'fabricante: GNSS hasta 35 km con 10 W por antena; contra CRPA mucho menos; est') },
    f16ecm: {
      P: U(1e4, 3e4, 1e5, 'baja', S_('ng_alq131', 'fas_alq131'), 'parámetro de juego: potencia y bandas del pod no son públicas. Un orden de magnitud menos que el Il-22PP (3e5): un pod de caza tiene menos potencia y antenas mucho más chicas; est'),
      alt: U(300, 4000, 8000, 'baja', [], 'est: los F-16 ucranianos vuelan bajo para sobrevivir y suben para lanzar; altura de patrulla de juego')
    }
  }
};
