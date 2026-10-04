// No copiar al escenario números vacíos, fuera de rango o fraccionarios en campos enteros.
// Se permite editar el texto; al salir del campo se recupera el último valor válido.
export function bindNumber(input, get, set, { integer = false } = {}) {
  if (!input) return;
  let message;
  if (integer) {
    message = document.createElement('p'); message.id = input.id + '-error';
    message.className = 'hint'; message.style.color = 'var(--red)'; message.style.gridColumn = '1 / -1';
    message.hidden = true; message.setAttribute('role', 'status');
    input.insertAdjacentElement('afterend', message);
    input.setAttribute('aria-describedby', [input.getAttribute('aria-describedby'), message.id].filter(Boolean).join(' '));
  }
  const valid = () => input.value !== '' && Number.isFinite(input.valueAsNumber)
    && (!integer || Number.isInteger(input.valueAsNumber)) && input.validity.valid;
  const error = restored => {
    if (!message) return;
    const value = input.valueAsNumber;
    const why = input.value === '' || !Number.isFinite(value) ? 'Ingresá un número entero.'
      : !Number.isInteger(value) ? 'Ingresá un número entero, sin decimales.'
      : `Ingresá un entero entre ${input.min} y ${input.max}.`;
    message.textContent = why + (restored ? ` Se conservó el último valor válido: ${get()}.` : ' El valor anterior se conserva.');
    message.hidden = false; input.setAttribute('aria-invalid', String(!restored));
  };
  const commit = () => {
    if (valid()) {
      set(input.valueAsNumber);
      if (message) { message.hidden = true; input.removeAttribute('aria-invalid'); }
    } else error(false);
  };
  input.addEventListener('input', commit);
  input.addEventListener('change', commit);
  input.addEventListener('blur', () => {
    if (!valid()) { error(true); input.value = get(); }
  });
}
