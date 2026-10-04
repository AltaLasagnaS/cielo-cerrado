// No copiar al escenario números vacíos, fuera de rango o fraccionarios en campos enteros.
// Se permite editar el texto; al salir del campo se recupera el último valor válido.
export function bindNumber(input, get, set) {
  if (!input) return;
  const commit = () => {
    if (input.value !== '' && Number.isFinite(input.valueAsNumber) && input.validity.valid) set(input.valueAsNumber);
  };
  input.addEventListener('input', commit);
  input.addEventListener('change', commit);
  input.addEventListener('blur', () => {
    if (input.value === '' || !Number.isFinite(input.valueAsNumber) || !input.validity.valid) input.value = get();
  });
}
