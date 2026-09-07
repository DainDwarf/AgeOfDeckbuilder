import type Phaser from 'phaser';
import { type TextKey, text } from './text';

/**
 * Every control the game binds, in the order the Controls window lists them. A binding is a key's
 * place on the keyboard, never what it prints, so a layout that moves a letter leaves the binding
 * standing where the key is.
 */
export const CONTROLS = [
  'pan-up',
  'pan-left',
  'pan-down',
  'pan-right',
  'zoom-in',
  'zoom-out',
  'city',
  'yields',
  'inspect',
  'back',
] as const;

export type Control = (typeof CONTROLS)[number];

/**
 * A key, as it binds and as it reads: the browser's code for its place, and what it printed when it
 * was pressed. The label is read and never compared — two places that print alike are two keys.
 */
export type Bind = { readonly code: string; readonly printed?: string };

/** The two keys a control is bound to; a slot holds nothing once its key has moved elsewhere. */
export type Slots = readonly [Bind | undefined, Bind | undefined];

export type Bindings = Readonly<Record<Control, Slots>>;

export const DEFAULTS: Bindings = {
  'pan-up': [{ code: 'KeyW' }, { code: 'ArrowUp' }],
  'pan-left': [{ code: 'KeyA' }, { code: 'ArrowLeft' }],
  'pan-down': [{ code: 'KeyS' }, { code: 'ArrowDown' }],
  'pan-right': [{ code: 'KeyD' }, { code: 'ArrowRight' }],
  'zoom-in': [{ code: 'WheelUp' }, undefined],
  'zoom-out': [{ code: 'WheelDown' }, undefined],
  city: [{ code: 'KeyC' }, undefined],
  yields: [{ code: 'Tab' }, undefined],
  inspect: [{ code: 'KeyI' }, undefined],
  back: [{ code: 'Escape' }, undefined],
};

/** The code of a mouse button's place: the button, by the number the browser gives it. */
export function mouseCode(button: number): string {
  return `Mouse${button}`;
}

/** Which of the two buttons that press the chronicle screen a press came from. */
export type Press = 'left' | 'right';

/**
 * The two mouse buttons that press the chronicle screen, and the press each makes. Neither reads as
 * a key, so neither binds: one kept in a slot from a launch that still bound it leaves that slot
 * empty.
 */
export const PRESSES: ReadonlyMap<number, Press> = new Map([
  [0, 'left'],
  [2, 'right'],
]);

const UNBINDABLE: ReadonlySet<string> = new Set([...PRESSES.keys()].map(mouseCode));

/** Which press a pointer is making, and nothing for a button that presses the screen with neither. */
export function pressOf(pointer: Phaser.Input.Pointer): Press | undefined {
  return PRESSES.get(pointer.button);
}

/** Where the browser keeps the bindings; the origin is shared with whatever else the host serves. */
const STORED = 'age-of-deckbuilder.controls';

/**
 * What the browser prints for a key that prints nothing: one that composes the key after it, and one
 * it cannot name at all.
 */
const UNPRINTED: ReadonlySet<string> = new Set(['Dead', 'Unidentified']);

/**
 * The one place a press becomes a key. A one-character label stands for both of its cases, so a
 * shifted press and a bare one read alike.
 */
export function keyPressed(event: { code: string; key: string }): Bind {
  if (UNPRINTED.has(event.key)) return { code: event.code };
  return {
    code: event.code,
    printed: event.key.length === 1 ? event.key.toUpperCase() : event.key,
  };
}

/** The keys whose own label is unreadable on a slot: the space bar's is a blank one. */
const NAMED: Record<string, TextKey> = {
  ArrowUp: 'key.arrow-up',
  ArrowLeft: 'key.arrow-left',
  ArrowDown: 'key.arrow-down',
  ArrowRight: 'key.arrow-right',
  Space: 'key.space',
  Mouse1: 'key.mouse-1',
  Mouse3: 'key.mouse-3',
  Mouse4: 'key.mouse-4',
  WheelUp: 'key.wheel-up',
  WheelDown: 'key.wheel-down',
};

/** The glyph a US keyboard prints on the punctuation places. */
const GLYPHS: Record<string, string> = {
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
  IntlBackslash: '\\',
};

/** What a place prints on a US keyboard; a place with no keycap of its own reads as its code. */
function keycap(code: string): string {
  const printed = /^(?:Key|Digit)(.)$/.exec(code);
  if (printed !== null) return printed[1];
  return GLYPHS[code] ?? code;
}

/**
 * How a bound key reads. A default and a key that printed nothing carry no label of their own, so
 * both read by the US keycap of their place.
 */
export function keyLabel(bind: Bind): string {
  const named = NAMED[bind.code];
  if (named !== undefined) return text(named);
  return bind.printed ?? keycap(bind.code);
}

/** A key moved onto one slot: whichever slot held its place, of any control, is left empty. */
export function bound(bindings: Bindings, control: Control, slot: number, press: Bind): Bindings {
  const elsewhere = (held: Bind | undefined): Bind | undefined =>
    held?.code === press.code ? undefined : held;
  const moved = {} as Record<Control, Slots>;
  for (const each of CONTROLS) {
    const [first, second] = bindings[each];
    moved[each] = [elsewhere(first), elsewhere(second)];
  }
  const [first, second] = moved[control];
  moved[control] = slot === 0 ? [press, second] : [first, press];
  return moved;
}

/** One stored slot's key, and nothing when what was stored cannot be one. */
function bindOf(stored: unknown): Bind | undefined {
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return undefined;
  const { code, printed } = stored as { code: unknown; printed: unknown };
  if (typeof code !== 'string' || code.length === 0) return undefined;
  if (printed === undefined) return { code };
  return typeof printed === 'string' && printed.length > 0 ? { code, printed } : undefined;
}

/**
 * One control's stored pair, and nothing when what was stored cannot be a pair of keys. A key that
 * no longer binds leaves its slot empty rather than the whole control at its default.
 */
function slotsOf(stored: unknown): Slots | undefined {
  if (!Array.isArray(stored) || stored.length !== 2) return undefined;
  const pair: (Bind | undefined)[] = [];
  for (const entry of stored) {
    if (entry === null) {
      pair.push(undefined);
      continue;
    }
    const bind = bindOf(entry);
    if (bind === undefined) return undefined;
    pair.push(UNBINDABLE.has(bind.code) ? undefined : bind);
  }
  return [pair[0], pair[1]];
}

/** What was kept, control by control: whatever it does not cover stands at its default. */
export function parseBindings(stored: string | null): Bindings {
  let raw: unknown;
  try {
    raw = stored === null ? undefined : JSON.parse(stored);
  } catch {
    raw = undefined;
  }
  const kept = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const parsed = {} as Record<Control, Slots>;
  for (const control of CONTROLS) parsed[control] = slotsOf(kept[control]) ?? DEFAULTS[control];
  return parsed;
}

export function serialiseBindings(bindings: Bindings): string {
  return JSON.stringify(
    Object.fromEntries(CONTROLS.map((control) => [control, [...bindings[control]].map(nulled)])),
  );
}

function nulled(bind: Bind | undefined): Bind | null {
  return bind ?? null;
}

/** The bindings the game runs on, read from the browser the first time they are asked for. */
let current: Bindings | undefined;

export function bindings(): Bindings {
  current ??= parseBindings(window.localStorage.getItem(STORED));
  return current;
}

/** The one place a binding changes: what the player set outlives the page. */
function keep(next: Bindings): void {
  current = next;
  window.localStorage.setItem(STORED, serialiseBindings(next));
}

export function rebind(control: Control, slot: number, press: Bind): void {
  keep(bound(bindings(), control, slot, press));
}

export function restoreDefaults(): void {
  keep(DEFAULTS);
}

/** Whether the key pressed stands in one of the two places a control is bound to. */
export function boundTo(press: Bind, control: Control): boolean {
  return bindings()[control].some((slot) => slot?.code === press.code);
}
