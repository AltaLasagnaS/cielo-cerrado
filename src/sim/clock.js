// @ts-check
// La interfaz acumula fracciones entre cuadros, pero el motor siempre recibe el mismo paso.
export const SIM_STEP = 0.25;

export function createSimClock() {
  let pending = 0;
  return {
    reset() { pending = 0; },
    advance(seconds, step) {
      pending += seconds;
      while (pending + 1e-9 >= SIM_STEP) {
        pending = Math.max(0, pending - SIM_STEP);
        if (step(SIM_STEP) === false) { pending = 0; break; }
      }
    }
  };
}
