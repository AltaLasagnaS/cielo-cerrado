import { LESSONS, createTutorial, tutorialStep, advanceTutorial, saveTutorial, loadTutorial } from '../lib/tutorial.mjs';
import { CATALOG } from '../data/catalog.mjs';

const el = id => document.getElementById(id);
const pages = new Set(['home', 'scenarios', 'campaign', 'tutorial', 'reference', 'settings']);
let plan = createTutorial();

function message(text, error = false) { el('status').textContent = text; el('status').classList.toggle('error', error); }
function show(page, focus = true) {
  if (!pages.has(page)) page = 'home';
  for (const name of pages) el(`page-${name}`).hidden = name !== page;
  for (const button of document.querySelectorAll('[data-page]')) button.setAttribute('aria-pressed', String(button.dataset.page === page));
  if (focus) el(`heading-${page}`).focus();
}
for (const button of document.querySelectorAll('[data-page],[data-go]')) {
  button.addEventListener('click', () => { const page = button.dataset.page || button.dataset.go;
    if (location.hash === `#${page}`) show(page); else location.hash = page;
  });
}
window.addEventListener('hashchange', () => show(location.hash.slice(1)));

function render() {
  const step = tutorialStep(plan), lesson = LESSONS[step], completed = !lesson;
  el('lesson-progress').textContent = completed ? 'Entrenamiento completo · 6 de 6 pasos' : `Paso ${step + 1} de ${LESSONS.length}`;
  el('lesson-title').textContent = lesson?.title || 'Listo para la próxima preparación';
  el('lesson-instruction').textContent = lesson?.instruction || 'Conservaste 80 créditos, dos consumibles en reserva y uno preparado.';
  el('lesson-explanation').textContent = lesson?.explanation || 'El consumible usado queda registrado. La siguiente etapa no regaló existencias ni reparaciones.';
  el('lesson-list').replaceChildren(...LESSONS.map((item, index) => {
    const li = document.createElement('li'); li.textContent = `${index < step ? '✓ ' : ''}${item.title}`;
    if (index === step) li.setAttribute('aria-current', 'step'); return li;
  }));
  el('training-balance').textContent = plan.balance;
  el('training-phase').textContent = { planning: 'Preparación', active: 'Ejercicio activo', completed: 'Etapa terminada' }[plan.phase];
  const stock = plan.inventory['training-round'] || { reserve: 0, ready: 0, consumed: 0 };
  for (const field of ['reserve', 'ready', 'consumed']) el(`training-${field}`).textContent = stock[field];
  for (const button of document.querySelectorAll('[data-action]')) button.disabled = completed || button.dataset.action !== lesson.action;
  el('training-quantity').disabled = !['load', 'consume'].includes(lesson?.action);
  if (lesson?.action === 'load') el('training-quantity').value = '2';
  if (lesson?.action === 'consume') el('training-quantity').value = '1';
}
for (const button of document.querySelectorAll('[data-action]')) button.addEventListener('click', () => {
  try {
    const action = button.dataset.action, input = el('training-quantity');
    if (['load', 'consume'].includes(action) && (!input.validity.valid || input.value === '')) throw new Error('Ingresá una cantidad entera de 1 a 4');
    plan = advanceTutorial(plan, action, input.valueAsNumber); render(); message('Paso completado.');
  } catch (error) { message(error.message, true); }
});
el('training-reset').addEventListener('click', () => { plan = createTutorial(); el('training-saved').value = ''; render(); message('Entrenamiento reiniciado.'); });
el('training-save').addEventListener('click', () => { el('training-saved').value = saveTutorial(plan); message('Guardado generado.'); });
el('training-restore').addEventListener('click', () => {
  try { const restored = loadTutorial(el('training-saved').value); plan = restored; render(); message('Entrenamiento restaurado.'); }
  catch (error) { message(error.message, true); }
});
function reference() {
  const family = el('reference-family').value;
  el('reference-list').replaceChildren(...CATALOG.weapons.filter(w => family === 'all' || w.familyId === family).map(w => {
    const li = document.createElement('li'); const title = document.createElement('strong'); title.textContent = w.name;
    const note = document.createElement('p'); note.textContent = w.note;
    const evidence = document.createElement('p'); evidence.className = 'muted';
    evidence.textContent = `${w.identity.status === 'documented-primary' ? 'Identidad: fabricante' : 'Identidad: referencia secundaria'} · Prestaciones y precio: pendientes de verificación.`;
    li.append(title, note, evidence); return li;
  }));
}
el('reference-family').addEventListener('change', reference);
for (const setting of ['large-text', 'high-contrast']) el(setting).addEventListener('change', () => document.body.classList.toggle(setting, el(setting).checked));
render(); reference(); show(location.hash.slice(1), false);
window.__tutorialMenu = Object.freeze({ getState: () => plan, getStep: () => tutorialStep(plan) });
