export function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function id(value, name = 'id') {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]{0,79}$/.test(value)) {
    throw new Error(`${name}: identificador inválido`);
  }
  return value;
}

export function integer(value, name, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`${name}: entero seguro mayor o igual a ${minimum} requerido`);
  }
  return value;
}

export function safeProduct(a, b) {
  return integer(a * b, 'producto');
}

export function safeSum(a, b) {
  return integer(a + b, 'suma');
}

// Combat uses quarter-second steps. Time is continuous; ammunition and
// monetary minor units remain integers. Bound the supported campaign clock
// to 1e9 seconds (about 31 years), without rounding or quantization.
export function seconds(value, name = 'tiempo', signed = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1e9 || (!signed && value < 0)) {
    throw Error(`${name}: segundos finitos dentro del intervalo admitido requeridos`);
  }
  return value;
}

export function addSeconds(a, b) { return seconds(a + b, 'suma de tiempo'); }
