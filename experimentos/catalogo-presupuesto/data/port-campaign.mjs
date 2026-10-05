import { DEFENSES, SCENARIOS, TARGET_TYPES, UNIT_TARGET } from '../../../src/data/index.js';

// Allocation credits/costs are explicit scenario assumptions, not military prices.
// Legacy entries keep their existing physics; they do not certify an exact variant or launcher.
export const PORT_BUDGET = 1500;
export const PORT_CHOICES = [
  { id: 'radar', type: 'ewr', name: 'Radar 3D', cost: 80, x: 49, y: 81 },
  { id: 'vhf', type: 'p18', name: 'Radar VHF', cost: 60, x: 40, y: 60 },
  { id: 's125', type: 's125', name: 'S-125-1', cost: 150, x: 54, y: 69 },
  { id: 'buk', type: 'buk', name: 'Buk-1', cost: 250, x: 51, y: 74 },
  { id: 's300', type: 's300', name: 'S-300-1', cost: 300, x: 49.5, y: 78 },
  { id: 'mobile', type: 'mfg', name: 'Grupo móvil 1', cost: 20, x: 54.5, y: 62 },
  { id: 'iris', type: 'irist', name: 'IRIS-T-1', cost: 350, x: 48.5, y: 82, later: true }
];
export function portCampaignDefinition(selection = ['radar', 'vhf', 's125', 'buk', 'mobile']) {
  if (!Array.isArray(selection) || !selection.length || new Set(selection).size !== selection.length
    || selection.some(id => !PORT_CHOICES.some(c => c.id === id))) throw Error('Selección de medios inválida');
  const chosen = PORT_CHOICES.filter(c => selection.includes(c.id));
  const spent = chosen.reduce((n, c) => n + c.cost, 0);
  if (spent > PORT_BUDGET) throw Error('La asignación excede el presupuesto');
  const basis = () => ({ kind: 'fictional', sourceIds: [], note: 'Créditos, disponibilidad y plazos de suministro de la campaña hipotética; no precios ni contratos reales.' });
  const inventory = { sideId: 'ua', ammunitionIds: [], components: [], configurations: [],
    locations: [{ id: 'depot', kind: 'depot' }], stock: [] };
  const assets = [], quotes = [], services = [], spares = [{ id: 'parts', quantity: 6 }];
  for (const c of chosen) {
    const d = DEFENSES[c.type], components = [];
    if (d.radar) { inventory.components.push({ id: `${c.id}-sensor`, kind: 'sensor' }); components.push(`${c.id}-sensor`); }
    if (d.sam) {
      const ammo = `legacy-${c.id}`;
      inventory.ammunitionIds.push(ammo); inventory.components.push({ id: `${c.id}-launcher`, kind: 'launcher' }, { id: `${c.id}-control`, kind: 'control' });
      components.push(`${c.id}-launcher`, `${c.id}-control`);
      inventory.configurations.push({ id: `${c.id}-aggregate`, basis: { kind: 'legacy-estimate', sourceIds: [],
        note: `Agregado del catálogo actual ${d.short}: ${d.sam.mag} disparos. No es la capacidad certificada de un lanzador ni una variante nueva.` },
      loadouts: [{ id: `${c.id}-only`, rounds: [{ ammunitionId: ammo, quantity: d.sam.mag }] }] });
      inventory.locations.push({ id: `${c.id}-ready`, kind: 'launcher', componentId: `${c.id}-launcher`,
        configurationId: `${c.id}-aggregate`, launchDependencies: components.filter(id => !id.endsWith('-launcher')) },
      { id: `${c.id}-cargo`, kind: 'depot' });
      inventory.stock.push({ locationId: 'depot', ammunitionId: ammo, quantity: 0 });
      quotes.push({ id: `${c.id}-supply`, ammunitionId: ammo, toId: 'depot', price: c.type === 'mfg' ? 1 : 10,
        quantityLimit: d.sam.mag * 3, leadSeconds: 120, cancellable: true, basis: basis() });
      services.push({ id: `${c.id}-reload`, kind: 'transfer', fromId: 'depot', toId: `${c.id}-ready`, transitId: `${c.id}-cargo`,
        recoveryId: 'depot', ammunitionIds: [ammo], fee: 0, durationSeconds: d.sam.reloadS, basis: basis() });
    }
    if (components.length) services.push({ id: `${c.id}-repair`, kind: 'repair', componentIds: components,
      spareId: 'parts', spareQuantity: 1, fee: 50, durationSeconds: 600, basis: basis() });
    assets.push({ id: c.id, kind: 'unit', engineType: c.type, engineName: c.name, mapKey: 'odesa',
      x: c.x, y: c.y, az: 135, maxHp: UNIT_TARGET.hp, hp: UNIT_TARGET.hp, componentIds: components,
      repairComponentId: components.find(id => id.endsWith('-sensor')) ?? components[0] ?? null });
  }
  const objectiveIds = new Map();
  for (const scenario of ['od_puertos', 'od_corredor']) for (const g of SCENARIOS[scenario].objectives) {
    if (objectiveIds.has(g.name)) continue;
    const id = `site-${objectiveIds.size + 1}`, hp = g.hp ?? TARGET_TYPES[g.type].hp;
    objectiveIds.set(g.name, id);
    assets.push({ id, kind: 'objective', engineType: g.type, engineName: g.name, mapKey: 'odesa',
      x: g.x, y: g.y, az: 0, maxHp: hp, hp, componentIds: [], repairComponentId: null });
  }
  const mission = (id, scenarioKey, title, next, delayBeforeSeconds, later) => ({ id, scenarioKey, title, mapKey: 'odesa', role: 'defence',
    delayBeforeSeconds, planningSeconds: 7200,
    allowedAssetIds: [...chosen.filter(c => later || !c.later).map(c => c.id), ...SCENARIOS[scenarioKey].objectives.map(o => objectiveIds.get(o.name))],
    allowedQuoteIds: quotes.filter(q => later || !q.id.startsWith('iris-')).map(q => q.id),
    objectives: SCENARIOS[scenarioKey].goals.filter(g => g.side === 'defensa' && (g.kind !== 'keepUnit' || chosen.some(c => c.name === g.target)))
      .map((g, i) => ({ id: `${id}-goal-${i + 1}`, text: g.text, deadlineSeconds: null })),
    next: { exito: next, parcial: next, fracaso: next } });
  return { id: 'odessa-resource-campaign', title: 'Odesa: sostener los puertos',
    basis: `Campaña hipotética con escenarios del catálogo, sin reconstruir una cronología histórica. ${PORT_BUDGET} créditos de asignación; ${spent} asignados a medios, ${PORT_BUDGET - spent} restantes. Costos/suministros son supuestos. Capacidades de combate conservan las estimaciones del catálogo legado, no equivalencias entre variantes.`,
    resourceInitial: { inventory, budget: PORT_BUDGET - spent, unit: 'credits', missionId: 'first-watch', quotes, services, spares }, assets,
    missions: [mission('first-watch', 'od_puertos', 'Primera guardia: medios de origen soviético y grupos móviles', 'second-watch', 0, false),
      mission('second-watch', 'od_corredor', 'Segunda guardia: barcos y continuidad de recursos', null, 86400, true)] };
}
