import type { Catalogue } from '../src/rules/catalogue';
import { apply, type Command, outcome } from '../src/rules/chronicle';
import { offered } from '../src/rules/schedule';
import { type Group, runtimeErrors, type Sequence, type Stage } from '../src/rules/stages';
import type { Chronicle, Ending } from '../src/rules/state';

/** One condition and one command, and the sentence the persona is printed as. */
export type Gambit = {
  readonly sentence: string;
  /** The command the gambit answers on the chronicle, and nothing where its condition does not hold. */
  readonly command: (catalogue: Catalogue, chronicle: Chronicle) => Command | undefined;
};

/** A stance a player could hold: its gambits, read top down, the last ending the turn. */
export type Persona = readonly Gambit[];

/** The answer a cell takes whenever its event is dealt. */
export type FixedAnswer = { readonly event: string; readonly answer: string };

/** The fixed answer as `--answer` names it, `<event>:<answer>`, and the trace and the record after it. */
export function fixedNamed({ event, answer }: FixedAnswer): string {
  return `${event}:${answer}`;
}

/** What stops a chronicle short of its ending. */
export type StopCause = 'turn-cap' | 'command-cap' | 'runtime-error' | 'stuck';

/** How a chronicle driven came to its end, and the turn it came on: the chronicle's ending, or its stop. */
export type End =
  | Ending
  | {
      readonly outcome: 'stopped';
      readonly cause: StopCause;
      readonly turn: number;
      /** For a `runtime-error`, the group holding it nearest, where one does. */
      readonly during?: Group['name'];
    };

/**
 * A command landed, the turn the chronicle stood on when it was sent, what sent it, the gambit's
 * sentence or the fixed answer as named, and its stages.
 */
export type LandedCommand = {
  readonly turn: number;
  readonly sentBy: string;
  readonly command: Command;
  readonly stages: readonly Stage[];
};

/** A chronicle driven: the chronicle it was left on, how it came to its end, and every command landed. */
export type Driven = {
  readonly chronicle: Chronicle;
  readonly end: End;
  readonly landed: readonly LandedCommand[];
};

/**
 * The chronicle the launch left driven by the fixed answers and the persona to its ending, or to its
 * stop: on the turn cap's turn, at the command cap landed in one turn, on a `runtime-error` among the
 * launch's stages or a command's, and on a decision where no command lands, the fixed answer's or a gambit's.
 */
export function playedBy(
  catalogue: Catalogue,
  persona: Persona,
  launch: Sequence,
  turnCap: number,
  fixed: readonly FixedAnswer[] = [],
): Driven {
  const landed: LandedCommand[] = [];
  let chronicle = launch.chronicle;
  let thisTurn = 0;
  const stopped = (cause: StopCause, during?: Group['name']): Driven => ({
    chronicle,
    landed,
    end: { outcome: 'stopped', cause, turn: chronicle.turn, during },
  });

  const [raised] = runtimeErrors(launch.stages);
  if (raised !== undefined) return stopped('runtime-error', raised.during);
  for (;;) {
    if (chronicle.ending !== undefined) return { chronicle, landed, end: chronicle.ending };
    if (chronicle.turn >= turnCap) return stopped('turn-cap');

    const decided = decision(catalogue, persona, fixed, chronicle);
    if (decided === undefined) return stopped('stuck');
    const { sentBy, command, stages } = decided;
    const after = outcome(stages);
    if (after !== chronicle) {
      landed.push({ turn: chronicle.turn, sentBy, command, stages });
      chronicle = after;
      if (after.ending !== undefined) continue;
    }
    const [error] = runtimeErrors(stages);
    if (error !== undefined) return stopped('runtime-error', error.during);
    thisTurn = command.type === 'end-turn' ? 0 : thisTurn + 1;
    if (thisTurn === 100) return stopped('command-cap');
  }
}

/**
 * The fixed answer's take where a deal of its event stands, else the first gambit, read top down, whose
 * command lands on the chronicle or raises a `runtime-error`, with its stages; nothing where the take,
 * or every gambit's command, leaves the chronicle as it stood.
 */
function decision(
  catalogue: Catalogue,
  persona: Persona,
  fixed: readonly FixedAnswer[],
  chronicle: Chronicle,
): { sentBy: string; command: Command; stages: Stage[] } | undefined {
  const take = fixedTake(catalogue, fixed, chronicle);
  const senders =
    take === undefined
      ? persona.map(({ sentence, command }) => ({ sentBy: sentence, command }))
      : [{ sentBy: take.sentBy, command: () => take.command }];
  for (const { sentBy, command: commandOn } of senders) {
    const command = commandOn(catalogue, chronicle);
    if (command === undefined) continue;
    const stages = apply(catalogue, chronicle, command);
    if (outcome(stages) !== chronicle || runtimeErrors(stages).length > 0) {
      return { sentBy, command, stages };
    }
  }
  return undefined;
}

/** The take of the fixed answer, and what sent it, where the deal standing is of its event; nothing otherwise. */
function fixedTake(
  catalogue: Catalogue,
  fixed: readonly FixedAnswer[],
  chronicle: Chronicle,
): { readonly sentBy: string; readonly command: Command } | undefined {
  const [deal] = chronicle.deals;
  if (deal?.of !== 'event') return undefined;
  const taken = fixed.find(({ event }) => event === deal.event);
  if (taken === undefined) return undefined;
  return {
    sentBy: fixedNamed(taken),
    command: { type: 'take', at: offered(catalogue, deal).indexOf(taken.answer) },
  };
}
