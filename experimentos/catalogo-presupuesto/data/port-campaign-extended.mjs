import { portCampaignDefinition } from './port-campaign.mjs';

// Optional authored continuation, not a historical third attack or a new weapons model.
// The two-stage factory stays unchanged while its native integration is reviewed.
export function extendedPortCampaignDefinition(selection) {
  const definition = portCampaignDefinition(selection);
  const first = definition.missions[0], second = definition.missions[1];
  second.next = { exito: 'third-watch', parcial: 'third-watch', fracaso: 'third-watch' };
  definition.missions.push({
    ...structuredClone(first),
    id: 'third-watch',
    title: 'Tercera guardia: volver a los puertos con los recursos restantes',
    delayBeforeSeconds: 86400,
    // Equipment assigned for the second watch remains available, with its actual condition/stock.
    allowedAssetIds: [...new Set([...second.allowedAssetIds.filter(id =>
      definition.assets.find(a => a.id === id)?.kind === 'unit'),
    ...first.allowedAssetIds.filter(id => definition.assets.find(a => a.id === id)?.kind === 'objective')])],
    allowedQuoteIds: [...second.allowedQuoteIds],
    objectives: first.objectives.map((g, i) => ({ ...g, id: `third-watch-goal-${i + 1}` })),
    next: { exito: null, parcial: null, fracaso: null }
  });
  definition.title = 'Odesa: tres guardias con recursos persistentes';
  definition.basis += ' Continuación opcional: tercera guardia 24 horas después del cierre de la segunda, reutilizando od_puertos sin modificar su ataque. Continuar incluso tras fracaso es una regla del ejercicio, no una afirmación histórica. No hay presupuesto, munición, reparación ni repuestos extra.';
  return definition;
}
