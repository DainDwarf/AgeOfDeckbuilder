// A `rules.`, `answer-rules.` or `capstone-rules.` entry may mark a resource glyph `[resource]`,
// which only a card face draws: anything else reading one puts the brackets on the screen.
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
  'label.action': 'Action',
  'label.sight': 'Sight',
  'reading.over': '{count}/{over}',
  'threshold.culture': '−{culture}',
  'tooltip.food': 'The most basic need. Grows your population toward the growth threshold.',
  'tooltip.production': 'Materials of every sort. Build, improve, and shape the land.',
  'tooltip.military': 'A sad necessity. Defend and attack.',
  'tooltip.money': 'Exchange and opulence. Trade it for other goods, or amass it.',
  'tooltip.science':
    'The never-ending ingenuity of humanity. Draw, discard, and manipulate your cards.',
  'tooltip.culture': 'What the city creates and believes. Claims tiles, pushing the border out.',
  'tooltip.population':
    'Idle population, over all of it. Assign it to tiles, or turn it into units.',
  'tooltip.health': 'What the unit has left before it is killed.',
  'tooltip.damage': "The health this unit's attack removes.",
  'tooltip.range': 'The distance, in tiles, this unit attacks over.',
  'tooltip.move': 'The tiles this unit can still cross this turn, over its move.',
  'tooltip.action': 'The action this unit can still spend this turn, over its action.',
  'tooltip.sight': 'The distance, in tiles, this unit sees over the ground.',
  'terrain.plain': 'Plain',
  'terrain.forest': 'Forest',
  'terrain.hills': 'Hills',
  'terrain.mountain': 'Mountain',
  'terrain.coast': 'Coast',
  'terrain.deep': 'Deep',
  'terrain.urban': 'Urban',
  'panel.river': 'River',
  'panel.crossing': 'Crossing ends the move.',
  'panel.movement': 'Mv {cost}',
  'panel.no-movement': 'Mv —',
  'feature.PH_Fertile': 'PH_Fertile',
  'feature.fertile': 'Fertile',
  'feature.game': 'Game',
  'feature.flint': 'Flint',
  'improvement.PH_Mine': 'PH_Mine',
  'improvement.PH_Road': 'PH_Road',
  'improvement.trapping': 'Trapping',
  'building.PH_City': 'PH_City',
  'building.PH_Farm': 'PH_Farm',
  'building.PH_Camp': 'PH_Camp',
  'building.city': 'City',
  'building.camp': 'Camp',
  'building.shelter': 'Shelter',
  'panel.no-yield': 'No yield',
  'button.turn': 'Turn {turn}',
  'button.end-turn': 'End turn',
  'button.city-mode': 'City mode',
  'kind.settle': 'Settle',
  'kind.unit': 'Unit',
  'kind.building': 'Building',
  'kind.instant': 'Instant',
  'kind.hazard': 'Hazard',
  'kind.event': 'Event',
  'kind.capstone': 'Capstone',
  'unit.PH_Worker': 'PH_Worker',
  'unit.PH_Warrior': 'PH_Warrior',
  'unit.worker': 'Worker',
  'unit.warrior': 'Warrior',
  'unit.scout': 'Scout',
  'card.PH_Settle': 'PH_Settle',
  'card.PH_Claim': 'PH_Claim',
  'card.PH_Worker': 'PH_Worker',
  'card.PH_Warrior': 'PH_Warrior',
  'card.PH_Farm': 'PH_Farm',
  'card.PH_March': 'PH_March',
  'card.PH_Harvest': 'PH_Harvest',
  'card.PH_Mine': 'PH_Mine',
  'card.PH_Road': 'PH_Road',
  'card.PH_Urbanisation': 'PH_Urbanisation',
  'card.PH_Recall': 'PH_Recall',
  'card.PH_Spoils': 'PH_Spoils',
  'card.PH_Hunger': 'PH_Hunger',
  'rules.PH_Settle': 'Settle the city',
  'rules.PH_Claim': 'Claim a tile and gain one population.',
  'rules.PH_Worker': 'Turn one idle population into a worker',
  'rules.PH_Warrior': 'Turn one idle population into a warrior',
  'rules.PH_Farm': 'Build a farm',
  'rules.PH_March': "Refresh a unit's move points",
  'rules.PH_Harvest': 'Gain 2 food',
  'rules.PH_Mine': 'Improve hills with a mine',
  'rules.PH_Road': 'Improve a tile with a road',
  'rules.PH_Urbanisation': 'Terraform a plain into urban',
  'rules.PH_Recall': 'Recall a card from the discard pile',
  'rules.PH_Spoils': 'Single use.\n10[food] 10[production] 10[military] 10[money] 10[science]',
  'rules.PH_Hunger': 'Empties the food stock',
  'card.settle': 'Settle',
  'rules.settle': 'Settle the city on plain, forest or hills',
  'card.first-worker': 'First worker',
  'rules.first-worker': 'A worker enters on a charted tile',
  'card.first-scout': 'First scout',
  'rules.first-scout': 'A scout enters on a charted tile',
  'card.worker': 'Worker',
  'rules.worker': 'Turn one idle population into a worker',
  'card.warrior': 'Warrior',
  'rules.warrior': 'Turn one idle population into a warrior',
  'card.scout': 'Scout',
  'rules.scout': 'Turn one idle population into a scout',
  'card.gather': 'Gather',
  'rules.gather': 'Through a worker: gain the yield of its tile',
  'card.trapping': 'Trapping',
  'rules.trapping': 'Improve forest with trapping',
  'card.march': 'March',
  'rules.march': "Refresh a unit's move points",
  'card.shelter': 'Shelter',
  'rules.shelter': 'Build the shelter. The age ends when it stands.',
  'card.hunger': 'Hunger',
  'rules.hunger': 'Takes food at the end of every turn it is still in the hand',
  'card.stores': 'The stores',
  'rules.stores': 'Single use.\n4[food] 4[production]',
  'card.band-joins': 'The band joins',
  'rules.band-joins': 'Single use.\nGain one idle population',
  'event.PH_Hardship': 'PH_Hardship',
  'event.PH_Toll': 'PH_Toll',
  'answer.PH_Tribute': 'PH_Tribute',
  'answer.PH_Defiance': 'PH_Defiance',
  'answer-rules.PH_Tribute': 'The camps are paid off',
  'answer-rules.PH_Defiance': 'A raid of {warriors} enters the map',
  'answer.PH_Raid': 'PH_Raid',
  'answer.PH_Famine': 'PH_Famine',
  'answer-rules.PH_Raid': 'A raid of {warriors} enters the map',
  'answer-rules.PH_Famine': 'Lays PH_Hunger on top of the draw pile',
  'event.lean-season': 'Lean season',
  'answer.share': 'Share',
  'answer-rules.share': 'Lays Hunger on top of the draw pile',
  'answer.ration': 'Ration',
  'answer-rules.ration': 'A raid of {warriors} enters the map',
  'event.rival-band': 'A rival band',
  'answer.fight': 'Fight',
  'answer-rules.fight': 'A raid of {warriors} enters the map',
  'answer.make-room': 'Make room',
  'answer-rules.make-room':
    'A camp is placed near the city, and a raid of {warriors} enters on and around it',
  'capstone-name.PH_Siege': 'PH_Siege',
  'capstone-rules.PH_Siege': 'The camps close in around the city',
  'capstone-name.PH_ShortSiege': 'PH_ShortSiege',
  'capstone-rules.PH_ShortSiege': 'The camps close in around the city',
  'capstone-name.first-shelter': 'The first shelter',
  'capstone-rules.first-shelter': 'Lays Shelter on top of the draw pile',
  'capstone.title': 'The age ends on this capstone.',
  'capstone.lands': 'The capstone lands.',
  'aim.tile': 'Play {card} at a tile',
  'aim.unit': 'Play {card} at a unit',
  'aim.discard-pile': 'Play {card} at a card of the discard pile',
  'refusal.food': 'Costs {cost} food.',
  'refusal.production': 'Costs {cost} production.',
  'refusal.military': 'Costs {cost} military.',
  'refusal.money': 'Costs {cost} money.',
  'refusal.science': 'Costs {cost} science.',
  'refusal.culture': 'Costs {cost} culture.',
  'refusal.unpaid': 'Not enough culture.',
  'refusal.population': 'The city keeps its last population.',
  'refusal.idle': 'No idle population.',
  'refusal.city': 'A unit already stands on the city.',
  'refusal.uncharted': 'Uncharted.',
  'refusal.worker': 'Needs a worker.',
  'refusal.action': 'The worker has no action left.',
  'refusal.border': 'Outside the city border.',
  'refusal.terrain': 'Wrong terrain.',
  'refusal.slot': 'A building already stands there.',
  'refusal.faction': 'That tile belongs to another faction.',
  'refusal.improvement': 'That improvement is already there.',
  'refusal.unit': 'No unit stands there.',
  'refusal.standing': 'A unit already stands there.',
  'refusal.move': 'Unit move points are full.',
  'refusal.discard-pile': 'The discard pile is empty.',
  'refusal.claim': 'The city cannot claim that tile.',
  'browse.draw-pile': 'Draw pile — {count}',
  'browse.discard-pile': 'Discard pile — {count}',
  'menu.menu': 'Menu',
  'menu.settings': 'Settings',
  'menu.controls': 'Controls',
  'menu.new-chronicle': 'New chronicle',
  'control.pan-up': 'Pan up',
  'control.pan-left': 'Pan left',
  'control.pan-down': 'Pan down',
  'control.pan-right': 'Pan right',
  'control.zoom-in': 'Zoom in',
  'control.zoom-out': 'Zoom out',
  'control.city': 'City mode',
  'control.yields': 'Yield overlay',
  'control.inspect': 'Inspect',
  'control.back': 'Back',
  'controls.press': 'Press a key',
  'controls.empty': '—',
  'controls.default': 'Default',
  'key.arrow-up': '↑',
  'key.arrow-left': '←',
  'key.arrow-down': '↓',
  'key.arrow-right': '→',
  'key.space': 'Space',
  'key.mouse-1': 'Middle click',
  'key.mouse-3': 'Mouse 4',
  'key.mouse-4': 'Mouse 5',
  'key.wheel-up': 'Wheel up',
  'key.wheel-down': 'Wheel down',
  'defeat.title': 'Defeat',
  'defeat.capture': 'An enemy captured the city on turn {turn}.',
  'defeat.population': "The city's population reached zero on turn {turn}.",
  'victory.title': 'Victory',
  'victory.PH_Siege': 'The city survived the siege.',
  'victory.PH_ShortSiege': 'The city survived the siege.',
  'victory.first-shelter': 'The shelter stands. The age is over.',
  'launch.title': 'Launch a chronicle',
  'launch.content': 'Content',
  'launch.region': 'Region',
  'launch.schedule': 'Schedule',
  'launch.deck': 'Deck',
  'launch.seed': 'Seed',
  'launch.fresh': 'Fresh',
  'launch.button': 'Launch',
  'console.line': '> {line}',
  'console.no-entry': 'no such entry: {word}',
  'console.uncharted-veil-on': 'uncharted veil: on',
  'console.uncharted-veil-off': 'uncharted veil: off',
  'console.fog-veil-on': 'fog veil: on',
  'console.fog-veil-off': 'fog veil: off',
} as const;

export type TextKey = keyof typeof TEXT;

export function text(key: TextKey, values: Record<string, string | number> = {}): string {
  return TEXT[key].replace(/\{(\w+)\}/g, (_, name: string) => String(values[name]));
}

/** What a unit kind is named on the screen; a kind no entry names is refused. */
export function unitName(type: string): string {
  return named('unit', type, 'the unit kind');
}

/** What a terrain is named on the screen; a terrain no entry names is refused. */
export function terrainName(terrain: string): string {
  return named('terrain', terrain, 'the terrain');
}

/** What a building is named on the screen; a building no entry names is refused. */
export function buildingName(building: string): string {
  return named('building', building, 'the building');
}

/** What a feature is named on the screen; a feature no entry names is refused. */
export function featureName(feature: string): string {
  return named('feature', feature, 'the feature');
}

/** What an improvement is named on the screen; an improvement no entry names is refused. */
export function improvementName(improvement: string): string {
  return named('improvement', improvement, 'the improvement');
}

/** What a card is named on the screen; a card no entry names is refused. */
export function cardName(card: string): string {
  return named('card', card, 'the card');
}

/** What a card's rules entry reads on the screen; a card no entry names is refused. */
export function cardRules(card: string): string {
  return named('rules', card, 'the card');
}

/** What an event is named on the screen; an event no entry names is refused. */
export function eventName(event: string): string {
  return named('event', event, 'the event');
}

/** What an answer is named on the screen; an answer no entry names is refused. */
export function answerName(answer: string): string {
  return named('answer', answer, 'the answer');
}

/** What an answer's rules entry reads on the screen, with its numbers; an answer no entry names is refused. */
export function answerRules(answer: string, values: Record<string, string | number>): string {
  return named('answer-rules', answer, 'the answer', values);
}

/** What a capstone is named on the screen; a capstone no entry names is refused. */
export function capstoneName(capstone: string): string {
  return named('capstone-name', capstone, 'the capstone');
}

/** What a capstone's rules entry reads on the screen; a capstone no entry names is refused. */
export function capstoneRules(capstone: string): string {
  return named('capstone-rules', capstone, 'the capstone');
}

/** The line the victory screen reads for passing a capstone; a capstone no entry names is refused. */
export function victoryLine(capstone: string): string {
  return named('victory', capstone, 'the capstone');
}

/** The entry a content id names under its prefix; an id no entry names is refused. */
function named(
  prefix: string,
  id: string,
  noun: string,
  values: Record<string, string | number> = {},
): string {
  const key = `${prefix}.${id}`;
  if (!Object.hasOwn(TEXT, key)) throw new Error(`no entry names ${noun} ${id}`);
  return text(key as TextKey, values);
}
