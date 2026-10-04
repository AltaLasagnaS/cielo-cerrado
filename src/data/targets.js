// @ts-check
// Objetivos físicos que las armas atacan y las defensas protegen.
// hp = vida máxima por defecto (un escenario puede cambiarla), radius = huella en metros (un impacto
// dentro de la huella cuenta como directo), vuln = vulnerabilidad relativa al daño explosivo.
// Son parámetros de juego: no salen de una fuente, se eligieron para que las proporciones entre
// tipos sean razonables (un tanque de combustible es más frágil que un búnker). Ver docs/FISICA.md §10.

export const TARGET_TYPES = {
  storage: { name: 'Depósito logístico', icon: 'D', hp: 1000, radius: 40, vuln: 1.0, desc: 'Galpones y playones de almacenamiento. Estructura liviana pero extensa.' },
  fuel: { name: 'Depósito de combustible', icon: 'F', hp: 800, radius: 50, vuln: 1.3, desc: 'Tanques de combustible: inflamables, el fuego propaga el daño.' },
  airbase: { name: 'Base aérea', icon: 'A', hp: 2500, radius: 300, vuln: 0.6, desc: 'Pista, calles de rodaje y refugios dispersos en un área grande: hacen falta muchos impactos para inutilizarla.' },
  radar: { name: 'Sitio de radar', icon: 'R', hp: 600, radius: 25, vuln: 1.2, desc: 'Antenas y shelters livianos, muy sensibles a esquirlas.' },
  command: { name: 'Puesto de mando', icon: 'C', hp: 900, radius: 20, vuln: 0.8, desc: 'Estructura reforzada o semienterrada.' },
  ammo: { name: 'Depósito de munición', icon: 'M', hp: 900, radius: 40, vuln: 1.4, desc: 'Las explosiones secundarias amplifican el daño de cada impacto.' },
  comms: { name: 'Sitio de comunicaciones', icon: 'T', hp: 500, radius: 15, vuln: 1.1, desc: 'Torres y equipos de enlace: blancos chicos y frágiles.' },
  infra: { name: 'Infraestructura', icon: 'I', hp: 1500, radius: 60, vuln: 0.9, desc: 'Puerto, puente, subestación eléctrica o similar.' }
};

/** Estados de un objetivo (códigos internos → texto en pantalla). */
export const TARGET_STATUS = { operational: 'Operativo', damaged: 'Dañado', destroyed: 'Destruido' };

/** Fracción de la vida perdida a partir de la cual un objetivo pasa a "Dañado". */
export const DAMAGED_AT = 0.2;

/**
 * Las unidades de defensa como blanco (daño funcional, sim/engine.js#damageUnits): una batería típica
 * con radar, lanzadores y vehículos dispersos en ≈30 m, liviana y sensible a esquirlas como un sitio
 * de radar. Valores de juego.
 */
export const UNIT_TARGET = { hp: 300, radius: 30, vuln: 1.2 };

/**
 * Daño funcional: al perder UNIT_COMP_AT[k] de la vida, la unidad pierde su componente k+1 (radar o
 * lanzador; si tiene los dos, se sortea cuál primero).
 *   radar dañado: alcance de detección ×radarR y tiempo de reacción ×react;
 *   lanzador dañado: no lanza (sigue viendo y alimentando la red).
 * Valores de juego (sin fuente directa); ver docs/FISICA.md §10.
 */
export const UNIT_DAMAGE = { radarR: 0.7, react: 1.5 };
export const UNIT_COMP_AT = [0.2, 0.5];

/**
 * Modelo de daño (ver physics/damage.js):
 *   daño directo  = K · W^EXP · vuln · mult        (W = ojiva en kg, del catálogo: info.warheadKg)
 *   radio al 50%  = R50K · W^(1/3)  m               (escala de Hopkinson-Cranz)
 *   factor        = 1 / (1 + (d / R50)²)            (d = distancia fuera de la huella del objetivo)
 * Por debajo de CUTOFF el impacto no causa daño.
 */
export const DAMAGE = { K: 12, EXP: 0.6, R50K: 4, CUTOFF: 0.02 };
