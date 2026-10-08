import type { Block, Cost, Refusal } from '../rules/state';
import { text } from './text';

export type Said = readonly string[];

/** The one line a block is said in, wherever it is raised. */
export function blockLine(block: Block): string {
  return text(`refusal.${block}`);
}

export function refused(costs: readonly Cost[], refusal: Refusal): Said {
  return [
    ...costs
      .filter(({ resource }) => refusal.unaffordable.includes(resource))
      .map(({ resource, amount }) => text(`refusal.${resource}`, { cost: amount })),
    ...refusal.blocked.map(blockLine),
  ];
}

export function refusedAim(block: Block): Said {
  return [blockLine(block)];
}
