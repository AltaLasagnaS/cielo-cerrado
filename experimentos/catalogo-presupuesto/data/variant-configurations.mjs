import { deepFreeze } from '../lib/common.mjs';

// Additive evidence ledger for the existing candidates. Not a runtime compatibility table.
const fact = (status, value, sourceId, locator) => ({ status, value, sourceIds: [sourceId], locator });
const unknown = () => ({ status: 'unknown', value: null, sourceIds: [], locator: null });
const secondary = (value, sourceId, locator) => fact('documented-secondary', value, sourceId, locator);
const primary = (value, sourceId, locator) => fact('documented-primary', value, sourceId, locator);
const pending = (candidateId, weaponId) => ({
  candidateId, weaponId, readiness: 'research-only',
  launcherModel: unknown(), launcherDescription: unknown(),
  missilesPerLauncher: unknown(), auxiliaryLauncher: unknown(),
  auxiliaryMissilesPerLauncher: unknown(), auxiliaryRequires: unknown(),
  fireControlModel: unknown(), supportedSoftware: unknown(),
  fullCapabilityUpgrade: unknown(), prerequisites: unknown(),
  minimumSoftware: unknown(), mixedLoad: unknown(), operatorAvailability: unknown()
});

export const VARIANT_RESEARCH = deepFreeze({
  reviewedOn: '2026-10-04', baseline: 'e2a5f90',
  sources: [
    { id: 'army-fm30185-2002', role: 'primary', access: 'reviewed',
      url: 'https://archive.org/download/Fm301.85PatriotBattalionAndBatteryOperations/fm%203-01.85%20Patriot%20Battalion%20and%20Battery%20Operations.pdf',
      scope: 'US Army FM 3-01.85, mayo de 2002, apéndice B: lanzador PAC-3 genérico, no identifica CRI/MSE/GEM-T ni M902/M903. Original alojado por tercero.' },
    { id: 'dod-mse-sar2015', role: 'primary', access: 'reviewed',
      url: 'https://archive.org/download/DTIC_AD1019515/DTIC_AD1019515.pdf',
      scope: 'DoD, PAC-3 MSE Selected Acquisition Report, diciembre de 2015, publicado 21/3/2016, p.6: PDB-7/modificaciones de lanzador; RDP/PDB-8 amplían aprovechamiento. Original DTIC alojado por tercero.' },
    { id: 'dod-meads-sar2013', role: 'primary', access: 'reviewed',
      url: 'https://archive.org/download/DTIC_ADA614932/DTIC_ADA614932.pdf',
      scope: 'DoD, Patriot/MEADS CAP SAR, diciembre de 2013, pp.7–8: ensayo MSE del 6/6/2013 con Patriot PDB-7 y Modern Man Stations. No identifica lanzador M903 ni carga por lanzador.' },
    { id: 'missilery-s300ps', role: 'secondary', access: 'reviewed',
      url: 'https://en.missilery.info/missile/c300ps',
      scope: 'Composición S-300PS/PMU: 5P85S principal, 5P85D subordinado, cuatro 5V55R por vehículo. No trasladar modificaciones PMU1/PM/PMU2.' }
  ],
  records: [
    { ...pending('candidate-patriot-gemt', 'patriot-gemt'),
      note: 'No se confirmó una combinación GEM-T/modelo de lanzador/control y carga exacta. Cuatro GEM genéricos del FM de 2002 no acreditan GEM-T.' },
    { ...pending('candidate-patriot-pac3-cri', 'patriot-pac3-cri'),
      note: 'El FM de 2002 dice 16 PAC-3, sin especificar CRI ni M902/M903. No se transfiere esa cifra a CRI.' },
    { ...pending('candidate-patriot-pac3-mse', 'patriot-pac3-mse'),
      launcherDescription: primary('Estación Patriot con modificaciones para MSE; modelo no identificado', 'dod-mse-sar2015', 'p.6, Mission and Description'),
      supportedSoftware: primary('PDB-7', 'dod-mse-sar2015', 'p.6; ensayo con PDB-7 corroborado en SAR 2013, pp.7–8'),
      fullCapabilityUpgrade: primary({ software: 'PDB-8', radarProcessor: 'Radar Digital Processor' }, 'dod-mse-sar2015', 'p.6'),
      prerequisites: primary('Modificaciones de la estación de lanzamiento; no asumir compatibilidad sin ellas', 'dod-mse-sar2015', 'p.6'),
      note: 'PDB-7 compatible no significa versión mínima certificada ni envolvente plena. Los 12 misiles por Fire Unit usados para FUE/IOC en p.9 no son capacidad de un lanzador. Modelo de LS/ECS/radar y carga exacta pendientes.' },
    { ...pending('candidate-s300pt-k', 's300p-5v55k'),
      launcherModel: secondary('5P85', 'apa-s300', 'S-300P/PT: párrafos 5P85 TEL y primera generación 5V55K'),
      launcherDescription: secondary('Semirremolque remolcado; PT original', 'apa-s300', 'S-300P/PT'),
      missilesPerLauncher: secondary(4, 'apa-s300', '5P85 TEL: four launch tubes / each with four SAMs'),
      fireControlModel: secondary('5N63 Flap Lid A', 'apa-s300', '5N63 y primera generación 5V55K por mando'),
      note: 'Configuración histórica PT original/K, no PT-1/PT-1A con modificaciones ni 30N6E1/48N6. 5P85-1 se describe como designación después de actualización; no tratar como idéntico al PT original.' },
    { ...pending('candidate-s300pt1-kd', 's300p-5v55kd'),
      note: 'PT-1/KD permanece como asociación de índice. No hereda automáticamente 5P85/5N63 ni cuatro misiles del PT original; falta confirmar su configuración.' },
    { ...pending('candidate-s300ps-r', 's300p-5v55r'),
      launcherModel: secondary('5P85S', 'missilery-s300ps', 'Composition / Launching complex 5P85SD'),
      launcherDescription: secondary('Autopropulsado principal con control de lanzamiento F3S', 'missilery-s300ps', 'Launching complex 5P85SD'),
      missilesPerLauncher: secondary(4, 'missilery-s300ps', 'Both types carry four TLC with 5V55R'),
      auxiliaryLauncher: secondary('5P85D', 'missilery-s300ps', 'Launching complex 5P85SD'),
      auxiliaryMissilesPerLauncher: secondary(4, 'missilery-s300ps', 'Both types carry four TLC with 5V55R'),
      auxiliaryRequires: secondary('5P85S y su control F3S; hasta dos 5P85D adicionales', 'missilery-s300ps', 'Launching complex 5P85SD; APA también distingue smart/dumb TEL'),
      fireControlModel: secondary('5N63S Flap Lid B', 'apa-s300', 'Sección S-300PS: radar rehosted became 5N63S'),
      note: 'PS/R corroborado en APA y Missilery. La traducción automática confunde letras cirílicas: 5B55R/5B55P no son nuevos misiles; se normaliza a 5V55R. No habilitar 5P85D como unidad autónoma ni exportaciones SU/DU por analogía.' }
  ]
});
