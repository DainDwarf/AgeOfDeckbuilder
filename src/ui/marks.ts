/**
 * Placeholder primitives until the art pass: the worker a block, the warrior a point. Each is its
 * corners about its own centre, raw.
 */
const UNIT_MARKS: Readonly<Record<string, number[]>> = {
  PH_Worker: [-11, -11, 11, -11, 11, 11, -11, 11],
  PH_Warrior: [0, -14, 13, 9, -13, 9],
};

/** The corners a unit kind's mark is drawn from; a kind with no mark is refused. */
export function unitMarkOf(type: string): number[] {
  if (!Object.hasOwn(UNIT_MARKS, type))
    throw new Error(`no mark is drawn for the unit kind ${type}`);
  return UNIT_MARKS[type];
}
