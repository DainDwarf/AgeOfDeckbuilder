// A `rules.`, `answer-rules.` or `capstone-rules.` entry may mark a resource glyph `[resource]` and
// a card's name `[card:<id>]`, which only a card face draws: anything else puts the mark on screen.
/** Every player-facing sentence, one entry each. English is the only language. */
const TEXT = {
  'label.food': 'Food',
  'label.production': 'Production',
  'label.military': 'Military',
  'label.money': 'Money',
  'label.science': 'Science',
  'label.culture': 'Culture',
  'label.idle': 'Idle',
  'label.health': 'Health',
  'label.damage': 'Damage',
  'label.range': 'Range',
  'label.move': 'Move',
  'label.action': 'Action',
  'label.sight': 'Sight',
  'reading.over': '{count}/{over}',
  'threshold.culture': '−{culture}',
  'tooltip.food': 'Grows your population if you reach the threshold', // glossary exception: reach
  'tooltip.production': 'Build, improve, and terraform', // glossary exception: build
  'tooltip.military': 'Defend and attack',
  'tooltip.money': 'Trade it for other goods',
  'tooltip.science': 'Manipulate your cards',
  'tooltip.culture': 'Claims more tiles for your city',
  'tooltip.idle': 'Idle population. Assign to tile or turn into units',
  'tooltip.health': 'Unit is killed when it reaches 0',
  'tooltip.damage': "The health this unit's attack removes",
  'tooltip.range': 'The distance this unit attacks over',
  'tooltip.move': 'How much this unit can move',
  'tooltip.action': 'How many actions this unit can do each turn',
  'tooltip.sight': 'The distance this unit sees over',
  'terrain.plain': 'Plain',
  'terrain.forest': 'Forest',
  'terrain.hills': 'Hills',
  'terrain.mountain': 'Mountain',
  'terrain.coast': 'Coast',
  'terrain.deep': 'Deep',
  'terrain.ocean': 'Ocean',
  'terrain.urban': 'Urban',
  'panel.river': 'River',
  'panel.crossing': 'Crossing ends the move',
  'panel.movement': 'Mv {cost}',
  'panel.no-movement': 'Mv —',
  'feature.PH_Fertile': 'PH_Fertile',
  'feature.fertile': 'Fertile',
  'feature.wildlife': 'Wildlife',
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
  'button.settle-phase': 'Settle phase',
  'button.end-settle-phase': 'End settle phase',
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
  'card.settle': 'Settlement', // glossary exception: settlement
  'rules.settle': 'Place the city',
  'card.first-worker': 'Worker',
  'rules.first-worker': 'Place a worker',
  'card.first-scout': 'Scout',
  'rules.first-scout': 'Place a scout',
  'card.worker': 'Worker',
  'rules.worker': 'Place a worker',
  'card.warrior': 'Warrior',
  'rules.warrior': 'Place a warrior',
  'card.scout': 'Scout',
  'rules.scout': 'Place a scout',
  'card.gather': 'Gather',
  'rules.gather': "Gain the yield of a worker's tile",
  'card.trapping': 'Trapping',
  'rules.trapping': 'Place Trapping on Forest',
  'card.march': 'March',
  'rules.march': "Refresh a unit's move points",
  'card.shelter': 'Shelter',
  'rules.shelter': 'Win the Nomadic Age',
  'card.hunger': 'Hunger',
  'rules.hunger': 'Takes food. Not enough food kills one population',
  'card.stores': 'Pillage',
  'rules.stores': 'Single use.\n4[food] 4[production]',
  'card.band-joins': 'Capture',
  'rules.band-joins': 'Single use.\nGain one population',
  'event.PH_Hardship': 'PH_Hardship',
  'event.PH_Toll': 'PH_Toll',
  'answer.PH_Tribute': 'PH_Tribute',
  'answer.PH_Defiance': 'PH_Defiance',
  'answer-rules.PH_Tribute': 'The camps are paid off',
  'answer-rules.PH_Defiance': 'A raid of {warriors} enters the map',
  'answer.PH_Raid': 'PH_Raid',
  'answer.PH_Famine': 'PH_Famine',
  'answer-rules.PH_Raid': 'A raid of {warriors} enters the map',
  'answer-rules.PH_Famine': 'Lays [card:PH_Hunger] on top of the draw pile',
  'event.lean-season': 'Lean season',
  'answer.share': 'Share food',
  'answer-rules.share': 'Put [card:hunger] on top of the draw pile',
  'answer.ration': 'Keep to yourself',
  'answer-rules.ration': 'Your city is attacked by {warriors} Warrior',
  'event.rival-band': 'A rival band',
  'answer.fight': 'Fight them', // glossary exception: fight
  'answer-rules.fight': 'Your city is attacked by {warriors} Warrior', // glossary exception: fight
  'answer.make-room': 'Make room',
  'answer-rules.make-room': 'A camp with {warriors} Warrior is placed near your city',
  'event.wildfire': 'Wildfire',
  'answer.let-it-burn': 'Let it burn',
  'answer-rules.let-it-burn':
    'The fire burns {tiles} forest into plain, kills {population} population and damages {units} unit',
  'answer.firebreak': 'Cut a firebreak',
  'answer-rules.firebreak': 'Pay {production} [production]',
  'event.departure': 'Departure',
  'answer.let-them-go': 'Let them go',
  'answer-rules.let-them-go': 'Lose one population',
  'answer.keep-them': 'Keep them',
  'answer-rules.keep-them': 'Pay {culture} [culture]',
  'event.herd': 'The herd',
  'answer.hunt-it': 'Hunt it',
  'answer-rules.hunt-it': 'Gain {food} [food]',
  'answer.follow-it': 'Follow it',
  'answer-rules.follow-it': 'One forest gains Wildlife',
  'capstone-name.PH_Siege': 'PH_Siege',
  'capstone-rules.PH_Siege': 'The camps close in around the city',
  'capstone-name.PH_ShortSiege': 'PH_ShortSiege',
  'capstone-rules.PH_ShortSiege': 'The camps close in around the city',
  'capstone-name.PH_Tillage': 'PH_Tillage',
  'capstone-rules.PH_Tillage': 'Lands nothing. A farm the city holds passes it.',
  'capstone-name.first-shelter': 'The first shelter',
  'capstone-rules.first-shelter': 'Put [card:shelter] on top of the draw pile',
  'capstone.title': 'Pass the capstone to win the Nomadic Age',
  'capstone.lands': 'The capstone lands.',
  'aim.tile': 'Play {card} at a tile',
  'aim.unit': 'Play {card} at a unit',
  'aim.discard-pile': 'Play {card} at a card of the discard pile',
  'refusal.food': 'Costs {cost} food',
  'refusal.production': 'Costs {cost} production',
  'refusal.military': 'Costs {cost} military',
  'refusal.money': 'Costs {cost} money',
  'refusal.science': 'Costs {cost} science',
  'refusal.culture': 'Costs {cost} culture',
  'refusal.population': 'The city keeps its last population',
  'refusal.idle': 'No idle population',
  'refusal.city': 'A unit already stands on the city',
  'refusal.tile-uncharted': 'Uncharted',
  'refusal.no-worker': 'Needs a worker',
  'refusal.worker-spent': 'The worker has no action left',
  'refusal.outside-border': 'Outside the city border',
  'refusal.inside-border': 'Inside the city border',
  'refusal.wrong-terrain': 'Wrong terrain',
  'refusal.slot-filled': 'A building already stands here',
  'refusal.other-faction': 'That tile belongs to another faction',
  'refusal.improvement-laid': 'That improvement is already here',
  'refusal.no-unit': 'No unit stands here',
  'refusal.unit-standing': 'A unit already stands here',
  'refusal.move-full': 'Unit move points are full',
  'refusal.discard-pile': 'The discard pile is empty',
  'refusal.no-claim': 'The city cannot claim that tile',
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
  'victory.PH_Tillage': 'The farm stands.',
  'victory.first-shelter': 'The shelter was built. Nomadic Age is over.',
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

/** The entry a key names, each `{name}` filled with its value; a placeholder handed no value is refused. */
export function text(key: TextKey, values: Record<string, string | number> = {}): string {
  return TEXT[key].replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = values[name];
    if (value === undefined) throw new Error(`no value fills {${name}} in ${key}`);
    return String(value);
  });
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
