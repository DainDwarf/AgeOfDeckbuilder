import type Phaser from 'phaser';

/** How wide and how tall a sheet is: a power of two, or Phaser makes no mipmaps of it (docs/PHASER.md). */
const SHEET_SIDE = 4096;

/** Every file of a sheet queued on a scene's loader under its own name, for `drawSheet` to read. */
export function queueSheet(load: Phaser.Loader.LoaderPlugin, files: readonly string[]): void {
  for (const file of files) load.image(file, `${import.meta.env.BASE_URL}assets/${file}`);
}

/**
 * The files `queueSheet` loaded drawn into one canvas texture under the key, row by row, each a frame
 * named by its file, and their own textures let go; a file that did not load is refused.
 */
export function drawSheet(
  textures: Phaser.Textures.TextureManager,
  key: string,
  files: readonly string[],
): void {
  const sheet = textures.createCanvas(key, SHEET_SIDE, SHEET_SIDE);
  if (sheet === null) throw new Error(`a texture stands under ${key} already`);
  let x = 0;
  let y = 0;
  let row = 0;
  for (const file of files) {
    // A texture the manager does not hold draws as Phaser's missing one and throws nothing (docs/PHASER.md).
    if (!textures.exists(file)) throw new Error(`the texture ${file} could not be loaded`);
    const { width, height } = textures.getFrame(file);
    if (x + width > SHEET_SIDE) {
      x = 0;
      y += row;
      row = 0;
    }
    if (y + height > SHEET_SIDE) throw new Error(`the sheet ${key} has no room left for ${file}`);
    sheet.drawFrame(file, undefined, x, y, false);
    sheet.add(file, 0, x, y, width, height);
    textures.remove(file);
    x += width;
    row = Math.max(row, height);
  }
  sheet.refresh();
}
