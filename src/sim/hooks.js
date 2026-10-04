// @ts-check
// Puntos de enganche de la simulación hacia afuera. La simulación no conoce el DOM: la interfaz
// reemplaza estas funciones al arrancar (ver main.js). En Node (tests) quedan como no-ops.
export const hooks = {
  /** Se agregó una línea al registro. */
  onLog() {},
  /** Terminó una corrida que estaba en marcha. */
  onEnd() {},
  /** Una unidad fue destruida (cambia la cobertura). */
  onUnitLost() {},
  /** ¿El jugador está en "vista del defensor"? (solo cambia el texto del registro). */
  defenderView: () => false
};
