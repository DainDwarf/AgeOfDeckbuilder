/**
 * Where each of the things standing one under another in a room from `top` to `bottom` starts: the
 * block they make centred in the room, and where it stands taller than the room, the gaps between them
 * closed by the same amount until it stands in the room exactly.
 */
export function blockIn(top: number, bottom: number, heights: readonly number[]): number[] {
  const tall = heights.reduce((sum, height) => sum + height, 0);
  const gaps = Math.max(0, heights.length - 1);
  const closing = Math.max(0, tall - (bottom - top)) / Math.max(1, gaps);
  let at = (top + bottom - (tall - gaps * closing)) / 2;
  return heights.map((height) => {
    const start = at;
    at += height - closing;
    return start;
  });
}
