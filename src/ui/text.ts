/** Every player-facing sentence, one entry each. English is the only language. */
const TEXT = {
  'label.food': 'Food',
  'label.production': 'Production',
  'label.military': 'Military',
  'label.money': 'Money',
  'label.science': 'Science',
  'label.culture': 'Culture',
  'label.population': 'Population',
  'tooltip.food': 'Feeds the population. From assigned tiles.',
  'tooltip.production': 'Raises buildings and units. From assigned tiles.',
  'tooltip.military': 'Pays for military units, orders, actions and fortifications.',
  'tooltip.money': "The city's coin. From assigned tiles.",
  'tooltip.science': "The city's learning. From assigned tiles.",
  'tooltip.culture': 'Claims tiles, pushing the border out.',
  'tooltip.population': "The city's inhabitants, assigned to tiles or turned into units.",
  'bar.turn': 'Turn {turn}',
  'button.end-turn': 'End turn',
} as const;

export type TextKey = keyof typeof TEXT;

export function text(key: TextKey, values: Record<string, number> = {}): string {
  return TEXT[key].replace(/\{(\w+)\}/g, (_, name: string) => String(values[name]));
}
