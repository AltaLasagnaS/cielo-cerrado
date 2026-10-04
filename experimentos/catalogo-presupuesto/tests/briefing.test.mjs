import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlan, applyCommand } from '../lib/budget.mjs';
import { buildPreparationBriefing } from '../lib/briefing.mjs';

const plan = sideId => createPlan({ sideId, missionId: 'first', budget: 100, unit: 'credits', offers: [] });
const input = () => ({ sideId: 'blue', missionId: 'first', role: 'defence', title: 'Ejemplo ficticio', issuedAtSeconds: 0,
  objectives: [{ id: 'protect', text: 'Mantener una instalación operativa', deadlineSeconds: 600 }],
  intelligence: [{ id: 'report-one', text: 'Actividad reportada; ruta exacta desconocida', sourceLabel: 'Informe de ejercicio',
    confidence: 'probable', observedAtSeconds: -600, receivedAtSeconds: -120 }] });

test('briefing de preparación contiene tareas, recursos propios y reportes fechados', () => {
  const view = buildPreparationBriefing(plan('blue'), input());
  assert.equal(view.resources.balance, 100); assert.deepEqual(view.resources.inventory, []);
  assert.equal(view.intelligence[0].ageSeconds, 600);
  assert.equal(view.intelligence[0].deliveryDelaySeconds, 480);
  assert.equal(view.intelligence[0].confidence, 'probable');
  assert.equal(view.objectives[0].deadlineSeconds, 600);
});

test('rol ataque/defensa no se infiere de blue/red ni permite acceso cruzado', () => {
  const raw = input(); raw.role = 'attack';
  assert.equal(buildPreparationBriefing(plan('blue'), raw).role, 'attack');
  assert.throws(() => buildPreparationBriefing(plan('red'), raw));
  raw.sideId = 'red'; raw.role = 'defence';
  assert.equal(buildPreparationBriefing(plan('red'), raw).role, 'defence');
  raw.missionId = 'another'; assert.throws(() => buildPreparationBriefing(plan('red'), raw));
});

test('no acepta verdad enemiga, planes futuros, enlaces a entidades o datos de daño secreto', () => {
  for (const extra of ['enemyUnits', 'enemyPlan', 'truth', 'enemyBudget']) {
    assert.throws(() => buildPreparationBriefing(plan('blue'), { ...input(), [extra]: [] }));
  }
  const raw = input(); raw.intelligence[0].entityId = 'secret';
  assert.throws(() => buildPreparationBriefing(plan('blue'), raw));
  delete raw.intelligence[0].entityId; raw.objectives[0].actualEnemyHp = 0;
  assert.throws(() => buildPreparationBriefing(plan('blue'), raw));
});

test('cambiar un mundo oculto no altera la proyección si reportes autorizados no cambian', () => {
  const state = plan('blue'); const authorized = input();
  const exportFrom = world => buildPreparationBriefing(state, world.authorized);
  const one = { authorized, enemyTruth: { route: 'east', count: 1 } };
  const two = { authorized, enemyTruth: { route: 'west', count: 99 } };
  assert.deepEqual(exportFrom(one), exportFrom(two));
});

test('recepción tardía no renueva la fecha de observación ni elimina su antigüedad', () => {
  const raw = input(); raw.issuedAtSeconds = 1000; raw.intelligence[0].receivedAtSeconds = 1000;
  const view = buildPreparationBriefing(plan('blue'), raw);
  assert.equal(view.intelligence[0].ageSeconds, 1600);
  assert.equal(view.intelligence[0].observedAtSeconds, -600);
  assert.equal(view.intelligence[0].deliveryDelaySeconds, 1600);
});

test('rechaza reportes futuros, recepción anterior a observación y tiempos no enteros', () => {
  for (const times of [{ observedAtSeconds: 1, receivedAtSeconds: 1 },
    { observedAtSeconds: -100, receivedAtSeconds: -200 },
    { observedAtSeconds: -0.5, receivedAtSeconds: 0 },
    { observedAtSeconds: NaN, receivedAtSeconds: 0 },
    { observedAtSeconds: -Number.MAX_SAFE_INTEGER, receivedAtSeconds: 0 }]) {
    const raw = input(); Object.assign(raw.intelligence[0], times);
    if (times.observedAtSeconds === -Number.MAX_SAFE_INTEGER) raw.issuedAtSeconds = 1;
    assert.throws(() => buildPreparationBriefing(plan('blue'), raw));
  }
});

test('objeto inmutable, sin aliases, datos sin plan completo ni auditoría de compras', () => {
  const raw = input(); const state = plan('blue'); const view = buildPreparationBriefing(state, raw);
  raw.intelligence[0].text = 'Otro'; assert.notEqual(view.intelligence[0].text, 'Otro');
  assert.throws(() => { view.intelligence[0].confidence = 'confirmed'; }, TypeError);
  for (const field of ['initial', 'audit', 'offers', 'orders', 'enemyTruth']) assert.equal(Object.hasOwn(view, field), false);
  assert.throws(() => buildPreparationBriefing({ ...state, balance: 999 }, input()));
});

test('preparación no publica inventario real durante combate como si fuera reporte del mando', () => {
  const active = applyCommand(plan('blue'), { commandId: 'activate', sideId: 'blue', kind: 'activate' });
  assert.throws(() => buildPreparationBriefing(active, input()));
});

test('exige texto, IDs únicos, confianza definida y listas acotadas', () => {
  for (const change of [raw => { raw.title = ' '; }, raw => { raw.role = 'neutral'; },
    raw => { raw.objectives = []; }, raw => { raw.intelligence[0].confidence = 'absolute'; },
    raw => { raw.intelligence.push(structuredClone(raw.intelligence[0])); },
    raw => { raw.objectives.push(structuredClone(raw.objectives[0])); },
    raw => { raw.intelligence = Array.from({ length: 101 }, () => raw.intelligence[0]); },
    raw => { raw.objectives[0].deadlineSeconds = 1.5; }]) {
    const raw = input(); change(raw); assert.throws(() => buildPreparationBriefing(plan('blue'), raw));
  }
  const raw = input(); raw.objectives[0].deadlineSeconds = null; raw.intelligence = [];
  assert.deepEqual(buildPreparationBriefing(plan('blue'), raw).intelligence, []);
});
