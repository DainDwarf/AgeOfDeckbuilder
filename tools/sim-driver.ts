import type { Catalogue } from '../src/rules/catalogue';
import { apply, type Command, outcome } from '../src/rules/chronicle';
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

/** What stops a chronicle short of its ending. */
export type StopCause = 'turn-cap' | 'command-cap' | 'runtime-error' | 'stuck';

/** How a walk came to its end, and the turn it came on: the chronicle's ending, or its stop. */
export type End =
  | Ending
  | {
      readonly outcome: 'stopped';
      readonly cause: StopCause;
      readonly turn: number;
      /** For a `runtime-error`, the group holding it nearest, where one does. */
      readonly during?: Group['name'];
    };

/** A command landed, the turn the chronicle stood on when it was sent, and the gambit behind it. */
export type LandedCommand = {
  readonly turn: number;
  readonly gambit: string;
  readonly command: Command;
};

/** A chronicle walked: the chronicle it was left on, how it came to its end, and every command landed. */
export type Walked = {
  readonly chronicle: Chronicle;
  readonly end: End;
  readonly landed: readonly LandedCommand[];
};

/**
 * The chronicle the launch left walked by the persona to its ending, or to its stop: on the turn cap's
 * turn, at the command cap landed in one turn, on a `runtime-error` among the launch's stages or a
 * command's, and on a decision where no gambit's command lands.
 */
export function playedBy(
  catalogue: Catalogue,
  persona: Persona,
  launch: Sequence,
  turnCap: number,
): Walked {
  const landed: LandedCommand[] = [];
  let chronicle = launch.chronicle;
  let thisTurn = 0;
  const stopped = (cause: StopCause, during?: Group['name']): Walked => ({
    chronicle,
    landed,
    end: { outcome: 'stopped', cause, turn: chronicle.turn, during },
  });

  const [raised] = runtimeErrors(launch.stages);
  if (raised !== undefined) return stopped('runtime-error', raised.during);
  for (;;) {
    if (chronicle.ending !== undefined) return { chronicle, landed, end: chronicle.ending };
    if (chronicle.turn >= turnCap) return stopped('turn-cap');

    const decided = decision(catalogue, persona, chronicle);
    if (decided === undefined) return stopped('stuck');
    const { gambit, command, stages } = decided;
    const after = outcome(stages);
    if (after !== chronicle) {
      landed.push({ turn: chronicle.turn, gambit, command });
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
 * The first gambit, read top down, whose command lands on the chronicle or raises a `runtime-error`,
 * with its stages; a command that leaves the chronicle as it stood is dropped. Nothing where every
 * gambit's command is dropped.
 */
function decision(
  catalogue: Catalogue,
  persona: Persona,
  chronicle: Chronicle,
): { gambit: string; command: Command; stages: Stage[] } | undefined {
  for (const { sentence, command: commandOn } of persona) {
    const command = commandOn(catalogue, chronicle);
    if (command === undefined) continue;
    const stages = apply(catalogue, chronicle, command);
    if (outcome(stages) !== chronicle || runtimeErrors(stages).length > 0) {
      return { gambit: sentence, command, stages };
    }
  }
  return undefined;
}
