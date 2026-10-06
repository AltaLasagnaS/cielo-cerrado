import { createPlan, applyCommand, savePlan, loadPlan } from './budget.mjs';
import { deepFreeze } from './common.mjs';

const configuration = deepFreeze({ sideId: 'blue', budget: 100, unit: 'credits', offers: [
  { id: 'training-kit', price: 20, unit: 'credits', quantityLimit: 3,
    costBasis: { kind: 'fictional', note: 'Ejercicio didáctico, sin precio ni capacidad reales', sourceIds: [] },
    bundle: [{ itemId: 'training-equipment', kind: 'durable', quantity: 1 },
      { itemId: 'training-round', kind: 'consumable', quantity: 4 }] }
] });

export const LESSONS = deepFreeze([
  { action: 'buy', title: 'Elegir recursos', instruction: 'Reservá un paquete de entrenamiento por 20 créditos.',
    explanation: 'La compra se cobra una vez. El paquete aporta un equipo durable y cuatro consumibles.' },
  { action: 'load', title: 'Preparar existencias', instruction: 'Prepará exactamente dos consumibles.',
    explanation: 'Preparar mueve existencias de la reserva a lo disponible; no crea munición.' },
  { action: 'activate', title: 'Cerrar la preparación', instruction: 'Iniciá el ejercicio.',
    explanation: 'Se cierra la compra y asignación previa. Este ejercicio enseña recursos; no simula un combate.' },
  { action: 'consume', title: 'Registrar consumo', instruction: 'Consumí una unidad preparada.',
    explanation: 'El consumo descuenta lo listo y queda registrado. El equipo durable se conserva.' },
  { action: 'finish', title: 'Cerrar una etapa', instruction: 'Terminá esta etapa de entrenamiento.',
    explanation: 'Terminar no repone existencias ni devuelve el dinero comprometido.' },
  { action: 'begin-mission', title: 'Continuar con lo que queda', instruction: 'Pasá a la siguiente preparación.',
    explanation: 'Continúan el saldo y las existencias. El intervalo de 900 segundos es ficticio y no concede reparaciones.' }
]);

const commands = LESSONS.map((lesson, index) => ({ commandId: `training-${index + 1}`, sideId: 'blue', kind: lesson.action,
  ...(lesson.action === 'buy' ? { orderId: 'training-order', offerId: 'training-kit', quantity: 1 } : {}),
  ...(lesson.action === 'load' ? { itemId: 'training-round', quantity: 2 } : {}),
  ...(lesson.action === 'consume' ? { itemId: 'training-round', quantity: 1 } : {}),
  ...(lesson.action === 'begin-mission' ? { missionId: 'training-next', elapsedSeconds: 900 } : {})
}));

export const createTutorial = () => createPlan(configuration);

export function tutorialStep(plan) {
  savePlan(plan); // Only states issued by the actual allocation ledger.
  if (JSON.stringify(plan.initial) !== JSON.stringify(createTutorial().initial)) throw new Error('Guardado ajeno a este entrenamiento');
  if (plan.audit.length > commands.length) throw new Error('Secuencia de entrenamiento inválida');
  for (const [index, actual] of plan.audit.entries()) {
    const expected = commands[index];
    if (Object.keys(actual).length !== Object.keys(expected).length
        || Object.entries(expected).some(([key, value]) => actual[key] !== value)) throw new Error('El guardado no sigue los pasos del entrenamiento');
  }
  return plan.audit.length;
}

export function advanceTutorial(plan, action, quantity) {
  const step = tutorialStep(plan);
  if (step === LESSONS.length || action !== LESSONS[step].action) throw new Error('Seguí el paso indicado del entrenamiento');
  if (action === 'load' || action === 'consume') {
    if (!Number.isSafeInteger(quantity)) throw new Error('Ingresá una cantidad entera');
    if (quantity !== commands[step].quantity) throw new Error(`Para este paso usá ${commands[step].quantity} consumibles`);
  }
  return applyCommand(plan, commands[step]);
}

export function saveTutorial(plan) { tutorialStep(plan); return savePlan(plan); }
export function loadTutorial(text) { const plan = loadPlan(text); tutorialStep(plan); return plan; }
