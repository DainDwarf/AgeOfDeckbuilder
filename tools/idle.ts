import type { Catalogue } from '../src/rules/catalogue';
import type { Command } from '../src/rules/chronicle';
import { CENTRE } from '../src/rules/map';
import { answerRefusal, offered } from '../src/rules/schedule';
import { type Chronicle, type Deal, onSettlePhase, playable } from '../src/rules/state';
import type { Gambit, Persona } from './sim-driver';

/** Whether the entry of the deal by that id is refused on the chronicle: a reward never is. */
export function refusedEntry(
  catalogue: Catalogue,
  chronicle: Chronicle,
  deal: Deal,
  id: string,
): boolean {
  switch (deal.of) {
    case 'event':
      return !playable(answerRefusal(catalogue, chronicle, deal.event, id));
    case 'capture':
      return false;
  }
}

/** The first entry of the deal standing that is not refused, taken, and nothing where none stands. */
export function firstTaken(catalogue: Catalogue, chronicle: Chronicle): Command | undefined {
  const [deal] = chronicle.deals;
  if (deal === undefined) return undefined;
  const at = offered(catalogue, deal).findIndex(
    (id) => !refusedEntry(catalogue, chronicle, deal, id),
  );
  return at === -1 ? undefined : { type: 'take', at };
}

export const TURN_ENDED: Gambit = {
  sentence: 'End the turn',
  command: () => ({ type: 'end-turn' }),
};

export const IDLE: Persona = [
  {
    sentence: 'While a deal stands, take its first answer or reward that is not refused',
    command: firstTaken,
  },
  {
    sentence: "On the settle phase, settle on the map's centre tile",
    command: (_catalogue, chronicle) =>
      onSettlePhase(chronicle) && chronicle.city === undefined
        ? { type: 'play', index: 0, aim: 'tile', tile: CENTRE }
        : undefined,
  },
  TURN_ENDED,
];
