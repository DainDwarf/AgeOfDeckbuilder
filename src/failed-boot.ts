import { CONSOLE_FONT, UI_FONT } from './ui/design-space';
import { css, LOOK } from './ui/look';
import { text } from './ui/text';

/** The failed boot's page over the body, the error's own words under its sentence, and the game destroyed. */
function failed(event: ErrorEvent): void {
  window.removeEventListener('error', failed);
  // Phaser cannot draw this: the boot that failed is the one that would have drawn it (DOGMAS.md, Stack).
  const page = document.createElement('div');
  Object.assign(page.style, {
    position: 'fixed',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: '24px',
    boxSizing: 'border-box',
    background: css(LOOK.page),
    textAlign: 'center',
  });
  const sentence = document.createElement('div');
  sentence.textContent = text('boot.failed');
  Object.assign(sentence.style, {
    fontFamily: UI_FONT,
    fontSize: '26px',
    fontWeight: 'bold',
    color: css(LOOK.paleInk),
  });
  const words = document.createElement('div');
  words.textContent = event.error instanceof Error ? event.error.message : String(event.error);
  Object.assign(words.style, {
    fontFamily: CONSOLE_FONT,
    fontSize: '16px',
    color: css(LOOK.answerInk),
    maxWidth: '100%',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
  });
  page.append(sentence, words);
  document.body.append(page);
  const game = window.game;
  if (game === undefined) return;
  game.destroy(true);
  // `destroy` only flags the game for its next step: a READY handler that threw left no loop to take it,
  // and before READY the loop starts later, while a step now throws on the unbuilt system scene
  // (phaser/src/core/Game.js:398, :456, :716; phaser/src/scene/SceneManager.js:1728).
  if (game.scene.isBooted) game.step(0, 0);
}

window.addEventListener('error', failed);

/** The first screen stands: an error from here on is no failed boot. */
export function booted(): void {
  window.removeEventListener('error', failed);
}
