import { describe, expect, it } from 'vitest';
import {
  INTERFACE_SIZES,
  parseInterfaceSize,
  serialiseInterfaceSize,
  sizeAfter,
} from './interface-size';

describe('the interface size kept in the browser', () => {
  it('comes back as it was left', () => {
    for (const size of INTERFACE_SIZES) {
      expect(parseInterfaceSize(serialiseInterfaceSize(size))).toBe(size);
    }
  });

  it('stands at 100% when nothing was kept', () => {
    expect(parseInterfaceSize(null)).toBe(100);
  });

  it('stands at 100% when what was kept is not one of the sizes', () => {
    for (const kept of [
      '',
      '0',
      '1',
      '1.5',
      '175',
      '300',
      'Largest',
      'max',
      '[]',
      '{"size":150}',
    ]) {
      expect(parseInterfaceSize(kept)).toBe(100);
    }
  });
});

describe('a press on the interface size', () => {
  it('moves it to the next size, and Largest back to 100%', () => {
    expect(sizeAfter(100)).toBe(125);
    expect(sizeAfter(125)).toBe(150);
    expect(sizeAfter(150)).toBe(200);
    expect(sizeAfter(200)).toBe('largest');
    expect(sizeAfter('largest')).toBe(100);
  });
});
