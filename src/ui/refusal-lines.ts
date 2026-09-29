import type { Block, Cost, Refusal } from '../rules/state';
import { text } from './text';

export type Said = readonly string[];

function blocking(block: Block): string {
  return text(`refusal.${block}`);
}

export function refused(costs: readonly Cost[], refusal: Refusal): Said {
  return [
    ...costs
      .filter(({ resource }) => refusal.unaffordable.includes(resource))
      .map(({ resource, amount }) => text(`refusal.${resource}`, { cost: amount })),
    ...refusal.blocked.map(blocking),
  ];
}

export function refusedAim(block: Block): Said {
  return [blocking(block)];
}
