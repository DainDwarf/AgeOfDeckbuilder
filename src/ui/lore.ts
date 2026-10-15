/** Every lore text, one entry each: the fiction a window reads over its cards. */
const LORE = {
  'event.lean-season':
    'Last season was cruel, and everyone in the land is starving. The neighbouring tribes have been eyeing each other hungrily.',
  'event.rival-band':
    'Strangers have come to your door. A new tribe, they say, and they intend to make their camp nearby, whether you like it or not.',
  'event.wildfire':
    'There is smoke over the forest, and the wind is up. Somewhere out there, a wildfire is running.',
  'event.stone-wildfire':
    'There is smoke over the forest, and the wind is up. Somewhere out there, a wildfire is running.',
  'event.departure':
    'Some of the tribe have grown unhappy here. They talk of leaving, and they mean it.',
  'event.flood':
    'The low fields are under water again this spring, and the elders say the river has not finished rising.',
  'event.bad-air':
    'A fever runs through the houses. The elders say the air has gone bad and the spirits are angry, and the healers have no more roots to boil.',
  'event.strangers':
    'A band has come down to your fires, thin and footsore, and asks to stay. Nobody understands a word they say, and they are not leaving.',
  'event.predators':
    'Wolves have come down from the hills. The herders found two carcasses at first light and tracks all round the pens, and tonight nobody wants to go out.',
  'event.drought':
    'The rains have not come. The stream is a line of cracked mud, the fields have gone grey, and the elders have begun to talk of the old dances.',
  'event.travellers':
    'A band of travellers has made camp at the edge of your fields for the night, packs full and tongues loose. They move on at dawn, but tonight there is trading to do and tales to swap around the fire.',
  'event.grievance':
    'A delegation from the other village stands at your fires, stone-faced. One of their hunters was found dead on your side of the ridge, they say, and the herd he followed has not been seen since. They want amends, and they want them now.',
  'event.herd':
    'One of the hunters came back with news: a new herd, not far from here. The tribe has been arguing all evening about what to do.',
  'capture.camp':
    'The camp has fallen. Its stores lie open and its people wait to hear their fate: what do you take?',
  'capture.stone-camp':
    'The camp has fallen. Its stores lie open and its people wait to hear their fate: what do you take?',
  'capture.painted-cave':
    'Deep in the hill, by torchlight, the walls are alive with painted herds and hunters long gone. The band stands in silence a long while, and carries the pictures away in their heads.',
  'capture.stone-painted-cave':
    'Deep in the hill, by torchlight, the walls are alive with painted herds and hunters long gone. The band stands in silence: what do you take from this place?',
  'capture.old-cairn':
    'A heap of old stones in the open, and under it the dead of a band nobody remembers, laid down with their tools and their beads. The band sits with them a while before moving on.',
  'capture.stone-old-cairn':
    'A heap of old stones in the open, and under it the dead of a band nobody remembers, laid down with their tools and their beads. Do you leave them in peace, or take what they no longer need?',
  'capture.beast-bones':
    'Out on the open ground lie the bones of a beast larger than anything the band has ever hunted, bleached and half sunk in the earth. The children climb the ribs, the elders say it walked here before the first people did, and the band carries the tale on with it.',
  'capture.stone-beast-bones':
    'Out on the open ground lie the bones of a beast larger than anything the band has ever hunted, bleached and half sunk in the earth. The elders say it walked here before the first people did: do you carve what it left, or make tools of it?',
  'capture.neutral-village':
    'The village is yours. Its fires are out, its stores lie open and its people stand waiting at the edge of the fields: what do you take?',
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

/** The lore a capture's window reads, keyed on the building captured; a building no entry holds is refused. */
export function captureLore(building: string): string {
  return lore('capture', building, 'the building');
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
