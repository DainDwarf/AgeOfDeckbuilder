import { describe, expect, it } from 'vitest';
import { blockIn } from './text-room';

describe('a block standing in a room', () => {
  it('stands centred in the room where it fits, its things touching', () => {
    expect(blockIn(10, 50, [8, 8, 6])).toEqual([19, 27, 35]);
  });

  it('closes each gap between its things by the same amount where it stands taller than the room, its first thing at the room’s top and its last ending at its foot', () => {
    expect(blockIn(10, 40, [12, 12, 12])).toEqual([10, 19, 28]);
  });

  it('stands centred on the room where a lone thing is taller than it, there being no gap to close', () => {
    expect(blockIn(0, 20, [30])).toEqual([-5]);
  });
});
