import type { Slice } from '../rules/catalogue';
import { NOMADIC } from './nomadic';

const { basePrice, schedule, camp, regions } = NOMADIC.owns;

/** The Stone Age: what it owns, and what it brings to the tables every age shares. */
export const STONE: Slice = {
  id: 'stone',
  owns: {
    basePrice,
    schedule: {
      spacing: [6, 9],
      capstone: { id: schedule.capstone.id, window: [26, 34] },
      entries: schedule.entries,
    },
    camp,
    regions,
    achievements: {},
  },
  brings: {},
};
