/** The five core resources, then culture. Population is people, not a store. */
export const RESOURCES = ['food', 'production', 'military', 'money', 'science', 'culture'] as const;

export type Resource = (typeof RESOURCES)[number];
export type Resources = Record<Resource, number>;

/** Every resource the parts name, summed. A resource left out is none of it. */
export function summed(parts: readonly Partial<Resources>[]): Partial<Resources> {
  const total: Partial<Resources> = {};
  for (const part of parts) {
    for (const [resource, amount] of Object.entries(part) as [Resource, number][]) {
      total[resource] = (total[resource] ?? 0) + amount;
    }
  }
  return total;
}

/** The resources with none of the one named. */
export function withNone(resources: Partial<Resources>, none: Resource): Partial<Resources> {
  const { [none]: _taken, ...kept } = resources;
  return kept;
}
