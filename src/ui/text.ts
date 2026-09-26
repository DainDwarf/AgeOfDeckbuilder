import type { ChronicleCard } from '../rules/state';
import type { Reference } from './text-run';

// A `rules.`, `answer-rules.` or `capstone-rules.` entry may mark a glyph `[<resource>]` and a name
// `[<kind>:<id>]` — a `card`, `terrain`, `feature`, `improvement`, `building`, or a unit kind painted
// for the faction `player` or `enemy` — which only a card face draws: elsewhere the mark shows.
/** Every player-facing sentence but the lore (`lore.ts`), one entry each. English is the only language. */
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
  'tooltip.production': 'Build, place, and terraform',
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
  'tooltip.settle': 'Played on the settle phase only',
  'tooltip.unit': 'One idle population becomes the unit',
  'tooltip.building': 'Built by a worker on a tile inside your border',
  'tooltip.instant': 'An immediate effect',
  'tooltip.hazard': 'Strikes each turn it stays in your hand',
  'tooltip.event': 'Choose one answer',
  'tooltip.capstone': "The age's trial. Pass it to win the age",
  'terrain.plain': 'Plain',
  'terrain.forest': 'Forest',
  'terrain.hills': 'Hills',
  'terrain.mountain': 'Mountain',
  'terrain.coast': 'Coast',
  'terrain.ocean': 'Ocean',
  'panel.river': 'River',
  'panel.crossing': 'Crossing ends the move',
  'panel.movement': 'Mv {cost}',
  'panel.no-movement': 'Mv —',
  'feature.fertile': 'Fertile',
  'feature.wildlife': 'Wildlife',
  'feature.flint': 'Flint',
  'improvement.trapping': 'Trapping',
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
  'unit.worker': 'Worker',
  'unit.warrior': 'Warrior',
  'unit.scout': 'Scout',
  'card.settle': 'Settlement', // glossary exception: settlement
  'rules.settle': 'Place the [building:city]',
  'card.first-worker': 'Worker',
  'rules.first-worker': 'Place a [player:worker]',
  'card.first-scout': 'Scout',
  'rules.first-scout': 'Place a [player:scout]',
  'card.worker': 'Worker',
  'rules.worker': 'Place a [player:worker]',
  'card.warrior': 'Warrior',
  'rules.warrior': 'Place a [player:warrior]',
  'card.scout': 'Scout',
  'rules.scout': 'Place a [player:scout]',
  'card.gather': 'Gather',
  'rules.gather': "Gain the yield of a [player:worker]'s tile",
  'card.trapping': 'Trapping',
  'rules.trapping': 'Place [improvement:trapping] on [terrain:forest]',
  'card.march': 'March',
  'rules.march': "Refresh a unit's move points",
  'card.shelter': 'Shelter',
  'rules.shelter': 'Win the Nomadic Age',
  'card.hunger': 'Hunger',
  'rules.hunger': 'Takes {food}[food]. Not enough food kills one population',
  'card.stores': 'Pillage',
  'rules.stores': 'Single use.\n4[food] 4[production]',
  'card.band-joins': 'Capture',
  'rules.band-joins': 'Single use.\nGain one population',
  'event.lean-season': 'Lean season',
  'answer.share': 'Share food',
  'answer-rules.share': 'Put [card:hunger] on top of the draw pile. It takes {food} [food]',
  'answer.ration': 'Keep to yourself',
  'answer-rules.ration': 'Your [building:city] is attacked by {warriors} [enemy:warrior]',
  'event.rival-band': 'A rival band',
  'answer.fight': 'Fight them', // glossary exception: fight
  'answer-rules.fight': 'Your [building:city] is attacked by {warriors} [enemy:warrior]', // glossary exception: fight
  'answer.make-room': 'Make room',
  'answer-rules.make-room':
    'A [building:camp] with {warriors} [enemy:warrior] is placed near your [building:city]',
  'event.wildfire': 'Wildfire',
  'answer.let-it-burn': 'Let it burn',
  'answer-rules.let-it-burn':
    'The fire burns {tiles} [terrain:forest] into [terrain:plain], kills {population} population and damages {units} unit',
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
  'answer-rules.follow-it': 'One [terrain:forest] gains [feature:wildlife]',
  'capstone-name.first-shelter': 'The first shelter',
  'capstone-rules.first-shelter': 'Put [card:shelter] on top of the draw pile',
  'capstone.title': 'Capstone',
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
  'victory.first-shelter': 'The shelter was built. Nomadic Age is over.',
  'launch.title': 'Launch a chronicle',
  'launch.content': 'Content',
  'launch.region': 'Region',
  'launch.schedule': 'Schedule',
  'launch.deck': 'Deck',
  'launch.seed': 'Seed',
  'launch.fresh': 'Fresh',
  'launch.button': 'Launch',
  'boot.failed': 'The game could not start', // glossary exception: start
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

/** What the thing a name names is named on the screen, by its kind's entry; one no entry names is refused. */
export function referenceName(reference: Reference): string {
  switch (reference.kind) {
    case 'card':
      return cardName(reference.id);
    case 'terrain':
      return terrainName(reference.id);
    case 'feature':
      return featureName(reference.id);
    case 'improvement':
      return improvementName(reference.id);
    case 'building':
      return buildingName(reference.id);
    case 'player':
    case 'enemy':
      return unitName(reference.id);
  }
}

/**
 * What a card's rules entry reads on the screen, filled with the counters the card carries; a card
 * no entry names is refused.
 */
export function cardRules(card: ChronicleCard): string {
  return named('rules', card.id, 'the card', card.counters);
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
