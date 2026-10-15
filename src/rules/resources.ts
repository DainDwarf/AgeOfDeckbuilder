/** The five core resources, then culture. Population is people, not a store. */
export const RESOURCES = ['food', 'production', 'military', 'money', 'science', 'culture'] as const;

export type Resource = (typeof RESOURCES)[number];
export type Resources = Record<Resource, number>;

/** The resources with none of the one named. */
export function withNone(resources: Partial<Resources>, none: Resource): Partial<Resources> {
  const { [none]: _taken, ...kept } = resources;
  return kept;
}
