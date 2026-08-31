/** Every player-facing sentence, one entry each. English is the only language. */
const TEXT = {
  'label.food': 'Food',
  'label.production': 'Production',
  'label.military': 'Military',
  'label.money': 'Money',
  'label.science': 'Science',
  'label.culture': 'Culture',
  'label.population': 'Population',
  'tooltip.food': 'The most basic need. Feeds your population.',
  'tooltip.production': 'Materials of every sort. Raise, improve, and shape the land.',
  'tooltip.military': 'A sad necessity. Defend and attack.',
  'tooltip.money': 'Exchange and opulence. Trade it for other goods, or amass it.',
  'tooltip.science':
    'The never-ending ingenuity of humanity. Draw, discard, and manipulate your cards.',
  'tooltip.culture': 'What the city creates and believes. Claims tiles, pushing the border out.',
  'tooltip.population':
    'The inhabitants of your city. Assign them to tiles, or turn them into units.',
  'button.turn': 'Turn {turn}',
  'button.end-turn': 'End turn',
  'kind.unit': 'Unit',
  'kind.building': 'Building',
  'kind.order': 'Order',
  'kind.action': 'Action',
  'card.PH_Worker': 'PH_Worker',
  'card.PH_Warrior': 'PH_Warrior',
  'card.PH_Farm': 'PH_Farm',
  'card.PH_March': 'PH_March',
  'card.PH_Harvest': 'PH_Harvest',
} as const;

export type TextKey = keyof typeof TEXT;

export function text(key: TextKey, values: Record<string, number> = {}): string {
  return TEXT[key].replace(/\{(\w+)\}/g, (_, name: string) => String(values[name]));
}
