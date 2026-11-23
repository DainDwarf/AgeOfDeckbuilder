import type Phaser from 'phaser';

/** A Text's word wrap breaking it as `balancedLines` does, across a room that wide. */
export function balancedWrap(room: number): Phaser.Types.GameObjects.Text.TextWordWrap {
  return {
    // Phaser runs the callback on the Text's own context, its font synced first (docs/PHASER.md).
    callback: (content: string, label: Phaser.GameObjects.Text) =>
      balancedLines(content, (line) => label.context.measureText(line).width, room),
  };
}

/**
 * A text broken at its spaces into the fewest lines a room that wide allows, and of those breaks the
 * one whose longest line is shortest, then whose shortest line is longest, each line as `measure`
 * measures it. A word wider than the room stands on a line of its own.
 */
export function balancedLines(
  text: string,
  measure: (line: string) => number,
  room: number,
): string[] {
  const words = text.split(' ');
  const measured = new Map<string, number>();
  const width = (from: number, to: number): number => {
    const key = `${from}-${to}`;
    const known = measured.get(key);
    if (known !== undefined) return known;
    const line = measure(words.slice(from, to).join(' '));
    measured.set(key, line);
    return line;
  };
  const fits = (from: number, to: number): boolean => to - from === 1 || width(from, to) <= room;

  let fewest = 0;
  for (let from = 0; from < words.length; fewest++) {
    let to = from + 1;
    while (to < words.length && fits(from, to + 1)) to++;
    from = to;
  }

  let best = { starts: [] as number[], longest: Number.POSITIVE_INFINITY, shortest: 0 };
  const walk = (
    from: number,
    lines: number,
    starts: number[],
    longest: number,
    shortest: number,
  ) => {
    const last = lines === 1;
    for (let to = last ? words.length : from + 1; to <= words.length - lines + 1; to++) {
      if (!fits(from, to)) return;
      const line = width(from, to);
      const longer = Math.max(longest, line);
      const shorter = Math.min(shortest, line);
      if (!last) walk(to, lines - 1, [...starts, from], longer, shorter);
      else if (longer < best.longest || (longer === best.longest && shorter > best.shortest)) {
        best = { starts: [...starts, from], longest: longer, shortest: shorter };
      }
    }
  };
  walk(0, fewest, [], 0, Number.POSITIVE_INFINITY);

  return best.starts.map((start, at) =>
    words.slice(start, best.starts[at + 1] ?? words.length).join(' '),
  );
}
