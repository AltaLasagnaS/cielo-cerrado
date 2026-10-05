import { demoCampaign } from './demo-campaign.mjs';

// Test fixture; Alpha/Beta and these costs/positions are not military data.
export function demoOperations() {
  const mission = (id, next, delay = 0) => ({ id, title: `Defender el puerto: ${id}`,
    scenarioKey: 'fixture_port', mapKey: 'fixture', role: 'defence', delayBeforeSeconds: delay,
    planningSeconds: 300, allowedAssetIds: ['battery', 'port'], allowedQuoteIds: ['alpha-supply'],
    objectives: [{ id: 'port-objective', text: 'Mantener el puerto operativo', deadlineSeconds: null }],
    next: { exito: next, parcial: next, fracaso: next } });
  return { id: 'port-operation', title: 'Operación de prueba: dos noches', resourceInitial: demoCampaign(),
    basis: 'Fixture ficticia de continuidad; no batalla, orden de combate ni presupuesto reales.',
    assets: [{ id: 'battery', kind: 'unit', engineType: 'fixture_launcher', engineName: 'Batería propia',
      mapKey: 'fixture', x: 10, y: 10, az: 0, maxHp: 100, hp: 100,
      componentIds: ['launcher', 'radar', 'control'], repairComponentId: 'radar' },
    { id: 'port', kind: 'objective', engineType: 'infra', engineName: 'Puerto propio',
      mapKey: 'fixture', x: 12, y: 12, az: 0, maxHp: 1000, hp: 1000, componentIds: [], repairComponentId: null }],
    missions: [mission('port-one', 'port-two'), mission('port-two', null, 86400)] };
}
