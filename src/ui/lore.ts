/** Every lore text, one entry each: the fiction a window reads over its cards. */
const LORE = {
  'event.PH_Hardship': 'PH_Hardship',
  'event.PH_Toll': 'PH_Toll',
  'event.PH_Newcomers': 'PH_Newcomers',
  'event.PH_Wilds': 'PH_Wilds',
  'camp.PH_Camp': 'PH_Camp',
  'capstone-opening.PH_Siege': 'PH_Siege',
  'capstone-landing.PH_Siege': 'PH_Siege',
  'capstone-opening.PH_ShortSiege': 'PH_ShortSiege',
  'capstone-landing.PH_ShortSiege': 'PH_ShortSiege',
  'capstone-opening.PH_Tillage': 'PH_Tillage',
  'capstone-landing.PH_Tillage': 'PH_Tillage',
  'event.lean-season':
    'Last season was cruel, and everyone in the land is starving. The neighbouring tribes have been eyeing each other hungrily.',
  'event.rival-band':
    'Strangers have come to your door. A new tribe, they say, and they intend to make their camp nearby, whether you like it or not.',
  'event.wildfire':
    'There is smoke over the forest, and the wind is up. Somewhere out there, a wildfire is running.',
  'event.departure':
    'Some of the tribe have grown unhappy here. They talk of leaving, and they mean it.',
  'event.herd':
    'One of the hunters came back with news: a new herd, not far from here. The tribe has been arguing all evening about what to do.',
  'camp.camp':
    'The camp has fallen. Its stores lie open and its people wait to hear their fate: what do you take?',
  'capstone-opening.first-shelter':
    'The tribe has wandered long enough. When the time comes, build the first shelter, and the Nomadic Age is won.',
  'capstone-landing.first-shelter':
    'The time has come. The first shelter is in your hands: build it, and the Nomadic Age is won.',
} as const;

/** The capstone window's two raisings, each reading a lore of its own. */
export type Raising = 'opening' | 'landing';

/** The lore the deal window reads over an event's answers; an event no entry holds is refused. */
export function eventLore(event: string): string {
  return lore('event', event, 'the event');
}

/** The lore a capture's window reads, keyed on the camp's building; a building no entry holds is refused. */
export function campLore(building: string): string {
  return lore('camp', building, 'the building');
}

/** The lore the capstone's window reads at that raising; a capstone no entry holds is refused. */
export function capstoneLore(capstone: string, raised: Raising): string {
  return lore(`capstone-${raised}`, capstone, 'the capstone');
}

function lore(prefix: string, id: string, noun: string): string {
  const key = `${prefix}.${id}`;
  if (!Object.hasOwn(LORE, key)) throw new Error(`no lore entry holds ${noun} ${id}`);
  return LORE[key as keyof typeof LORE];
}
