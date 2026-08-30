// sfc32, seeded through splitmix32. The arithmetic is the published algorithm, not a
// construction to tidy: every word must stay a signed int32 or the sequence changes, and the
// state is serialised into a save, so `| 0` and `Math.imul` are what keep it JSON-exact.

export type Rng = readonly [number, number, number, number];

function mix(state: number): [number, number] {
  const advanced = (state + 0x9e3779b9) | 0;
  let word = advanced ^ (advanced >>> 16);
  word = Math.imul(word, 0x21f0aaad);
  word ^= word >>> 15;
  word = Math.imul(word, 0x735a2d97);
  return [advanced, (word ^ (word >>> 15)) | 0];
}

export function seedRng(seed: number): Rng {
  const [first, a] = mix(seed | 0);
  const [second, b] = mix(first);
  const [third, c] = mix(second);
  const [, d] = mix(third);
  return [a, b, c, d];
}

/** The next value in [0, 1), with the generator state that follows it. */
export function nextRng([a, b, c, d]: Rng): { rng: Rng; value: number } {
  const t = (((a + b) | 0) + d) | 0;
  return {
    rng: [b ^ (b >>> 9), (c + (c << 3)) | 0, (((c << 21) | (c >>> 11)) + t) | 0, (d + 1) | 0],
    value: (t >>> 0) / 4294967296,
  };
}
