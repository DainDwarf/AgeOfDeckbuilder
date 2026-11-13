/**
 * What a unit's health bar shows, each as a share of the bar's length: the health the unit holds, and
 * of it, from its top down, the health an attack read on the unit would remove; and whether that
 * attack would kill it.
 */
export type HealthBar = {
  readonly held: number;
  readonly removed: number;
  readonly kills: boolean;
};

/**
 * The health bar of a unit holding `health` of its `full`, with the damage of the attack read on it
 * where one is: none at its full health or above while none is read, a unit above it read as one at it.
 */
export function healthBarOf(
  health: number,
  full: number,
  damage: number | undefined,
): HealthBar | undefined {
  if (damage === undefined && health >= full) return undefined;
  const held = Math.min(health, full);
  const removed = Math.min(damage ?? 0, held);
  return {
    held: held / full,
    removed: removed / full,
    kills: damage !== undefined && damage >= health,
  };
}
