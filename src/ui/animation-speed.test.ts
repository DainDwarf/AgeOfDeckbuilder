import { describe, expect, it } from 'vitest';
import {
  ANIMATION_SPEEDS,
  parseAnimationSpeed,
  serialiseAnimationSpeed,
  speedAfter,
} from './animation-speed';

describe('the animation speed kept in the browser', () => {
  it('comes back as it was left', () => {
    for (const speed of ANIMATION_SPEEDS) {
      expect(parseAnimationSpeed(serialiseAnimationSpeed(speed))).toBe(speed);
    }
  });

  it('stands at the designed speed when nothing was kept', () => {
    expect(parseAnimationSpeed(null)).toBe(1);
  });

  it('stands at the designed speed when what was kept is not one of the speeds', () => {
    for (const kept of ['', '0', '3', '8', '-2', '1.5', 'fast', '[]', '{"speed":4}']) {
      expect(parseAnimationSpeed(kept)).toBe(1);
    }
  });
});

describe('a press on the animation speed', () => {
  it('moves it to the next speed, and the fastest back to the first', () => {
    expect(speedAfter(1)).toBe(2);
    expect(speedAfter(2)).toBe(4);
    expect(speedAfter(4)).toBe(1);
  });
});
