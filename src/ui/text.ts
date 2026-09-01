/** Every player-facing sentence, one entry each. English is the only language. */
const TEXT = {
  'label.food': 'Food',
  'label.production': 'Production',
  'label.military': 'Military',
  'label.money': 'Money',
  'label.science': 'Science',
  'label.culture': 'Culture',
  'label.population': 'Population',
  'label.health': 'Health',
  'label.damage': 'Damage',
  'label.range': 'Range',
  'label.move': 'Move',
  'tooltip.food': 'The most basic need. Feeds your population.',
  'tooltip.production': 'Materials of every sort. Build, improve, and shape the land.',
  'tooltip.military': 'A sad necessity. Defend and attack.',
  'tooltip.money': 'Exchange and opulence. Trade it for other goods, or amass it.',
  'tooltip.science':
    'The never-ending ingenuity of humanity. Draw, discard, and manipulate your cards.',
  'tooltip.culture': 'What the city creates and believes. Claims tiles, pushing the border out.',
  'tooltip.population':
    'The inhabitants of your city. Assign them to tiles, or turn them into units.',
  'tooltip.health': 'What the unit has left before it is killed.',
  'tooltip.damage': "The health this unit's attack removes.",
  'tooltip.range': 'The distance, in tiles, this unit attacks over.',
  'tooltip.move': 'The tiles this unit crosses per order.',
  'terrain.plain': 'Plain',
  'terrain.forest': 'Forest',
  'terrain.hills': 'Hills',
  'terrain.water': 'Water',
  'terrain.urban': 'Urban',
  'building.PH_City': 'PH_City',
  'building.PH_Farm': 'PH_Farm',
  'panel.no-yield': 'No yield',
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
  'rules.PH_Worker': 'Turn population into a worker',
  'rules.PH_Warrior': 'Turn population into a warrior',
  'rules.PH_Farm': 'Build a farm',
  'rules.PH_March': 'Move a unit and act',
  'rules.PH_Harvest': 'Gain 2 food',
  'browse.draw-pile': 'Draw pile — {count}',
  'browse.discard-pile': 'Discard pile — {count}',
} as const;

export type TextKey = keyof typeof TEXT;

export function text(key: TextKey, values: Record<string, number> = {}): string {
  return TEXT[key].replace(/\{(\w+)\}/g, (_, name: string) => String(values[name]));
}
