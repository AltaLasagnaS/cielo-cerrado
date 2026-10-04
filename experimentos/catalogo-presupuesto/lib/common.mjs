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
