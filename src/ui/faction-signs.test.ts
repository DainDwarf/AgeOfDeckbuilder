import { describe, expect, it } from 'vitest';
import { parseFactionSigns, serialiseFactionSigns } from './faction-signs';

describe('the faction signs kept in the browser', () => {
  it('come back as they were left', () => {
    for (const on of [true, false]) {
      expect(parseFactionSigns(serialiseFactionSigns(on))).toBe(on);
    }
  });

  it('are off when nothing was kept', () => {
    expect(parseFactionSigns(null)).toBe(false);
  });

  it('are off when what was kept is not one of the two', () => {
    for (const kept of ['', 'On', 'true', '1', 'yes', '{"on":true}']) {
      expect(parseFactionSigns(kept)).toBe(false);
    }
  });
});
