import { type Campaign, learnedInto } from '../src/rules/campaign';
import { ageOf, type Catalogue, technologyOf } from '../src/rules/catalogue';

/** The technologies the age's achievements earn, in the order the catalogue's technologies table lists them. */
export function technologiesEarnedIn(catalogue: Catalogue, age: string): string[] {
  const earned = new Set(
    Object.values(ageOf(catalogue, age).achievements).map(({ technology }) => technology),
  );
  return Object.keys(catalogue.technologies).filter((id) => earned.has(id));
}

/**
 * The campaign with each technology named learned, every need of it not learned learned before it,
 * the needs in the order the catalogue lists them; a technology already learned is passed over.
 */
export function learnedWithNeeds(
  catalogue: Catalogue,
  campaign: Campaign,
  technologies: readonly string[],
): Campaign {
  let learning = campaign;
  const learn = (technology: string): void => {
    if (learning.technologies.includes(technology)) return;
    const { needs } = technologyOf(catalogue, technology);
    for (const need of Object.keys(catalogue.technologies)) {
      if (needs.includes(need)) learn(need);
    }
    learning = learnedInto(catalogue, learning, technology);
  };
  for (const technology of technologies) learn(technology);
  return learning;
}
