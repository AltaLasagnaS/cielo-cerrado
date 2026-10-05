// ALL quantities, capacities, costs and durations below are FICTIONAL.
// This fixture demonstrates conservation, not a historical order of battle.
export function demoCampaign() {
  const basis = () => ({ kind: 'fictional', note: 'Ejemplo mecánico; no precio, capacidad ni plazo reales', sourceIds: [] });
  return {
    budget: 1200, unit: 'credits', missionId: 'port-one',
    inventory: {
      sideId: 'blue', ammunitionIds: ['alpha', 'beta'],
      components: [{ id: 'launcher', kind: 'launcher' }, { id: 'radar', kind: 'sensor' }, { id: 'control', kind: 'control' }],
      configurations: [{ id: 'launcher-demo', basis: basis(), loadouts: [
        { id: 'alpha-only', rounds: [{ ammunitionId: 'alpha', quantity: 4 }] },
        { id: 'beta-only', rounds: [{ ammunitionId: 'beta', quantity: 6 }] }
      ] }],
      locations: [{ id: 'depot', kind: 'depot' }, { id: 'cargo', kind: 'depot' },
        { id: 'launcher-stock', kind: 'launcher', componentId: 'launcher', configurationId: 'launcher-demo', launchDependencies: ['radar', 'control'] }],
      stock: [{ locationId: 'depot', ammunitionId: 'alpha', quantity: 12 }, { locationId: 'depot', ammunitionId: 'beta', quantity: 8 }]
    },
    quotes: [{ id: 'alpha-supply', ammunitionId: 'alpha', toId: 'depot', price: 25,
      quantityLimit: 20, leadSeconds: 300, cancellable: true, basis: basis() },
    { id: 'beta-supply', ammunitionId: 'beta', toId: 'depot', price: 15,
      quantityLimit: 10, leadSeconds: 180, cancellable: false, basis: basis() }],
    services: [{ id: 'reload', kind: 'transfer', fromId: 'depot', toId: 'launcher-stock', transitId: 'cargo',
      recoveryId: 'depot', ammunitionIds: ['alpha', 'beta'], fee: 10, durationSeconds: 60, basis: basis() },
    { id: 'workshop', kind: 'repair', componentIds: ['radar', 'launcher', 'control'], spareId: 'parts', spareQuantity: 1,
      fee: 50, durationSeconds: 240, basis: basis() }],
    spares: [{ id: 'parts', quantity: 3 }]
  };
}
