import { type TextKey, text } from './text';

/**
 * Every control the game binds, in the order the Controls window lists them. A binding is a key's
 * label, never its place on the keyboard, so a layout that moves a letter moves the binding with it.
 */
export const CONTROLS = [
  'pan-up',
  'pan-left',
  'pan-down',
  'pan-right',
  'zoom-in',
  'zoom-out',
  'back',
] as const;

export type Control = (typeof CONTROLS)[number];

/** The two keys a control is bound to; a slot holds nothing once its key has moved elsewhere. */
export type Slots = readonly [string | undefined, string | undefined];

export type Bindings = Readonly<Record<Control, Slots>>;

export const DEFAULTS: Bindings = {
  'pan-up': ['W', 'ArrowUp'],
  'pan-left': ['A', 'ArrowLeft'],
  'pan-down': ['S', 'ArrowDown'],
  'pan-right': ['D', 'ArrowRight'],
  'zoom-in': ['WheelUp', undefined],
  'zoom-out': ['WheelDown', undefined],
  back: ['Escape', 'Mouse2'],
};

/** Where the browser keeps the bindings; the origin is shared with whatever else the host serves. */
const STORED = 'age-of-deckbuilder.controls';

/**
 * The one form a key is held and compared in: a one-character label stands for both of its cases,
 * so a shifted press binds and fires the same slot. Idempotent, so every entry point may call it.
 */
export function keyOf(label: string): string {
  return label.length === 1 ? label.toUpperCase() : label;
}

/** The keys whose own label is unreadable on a slot: the space bar's is a blank one. */
const NAMED: Record<string, TextKey> = {
  ArrowUp: 'key.arrow-up',
  ArrowLeft: 'key.arrow-left',
  ArrowDown: 'key.arrow-down',
  ArrowRight: 'key.arrow-right',
  ' ': 'key.space',
  Mouse1: 'key.mouse-1',
  Mouse2: 'key.mouse-2',
  Mouse3: 'key.mouse-3',
  Mouse4: 'key.mouse-4',
  WheelUp: 'key.wheel-up',
  WheelDown: 'key.wheel-down',
};

/** How a bound key reads: the named ones by their entry, every other by the label it carries. */
export function keyLabel(key: string): string {
  const named = NAMED[key];
  return named === undefined ? key : text(named);
}

/** A key moved onto one slot: whichever slot held it, of any control, is left empty. */
export function bound(bindings: Bindings, control: Control, slot: number, label: string): Bindings {
  const key = keyOf(label);
  const moved = {} as Record<Control, Slots>;
  for (const each of CONTROLS) {
    const [first, second] = bindings[each];
    moved[each] = [first === key ? undefined : first, second === key ? undefined : second];
  }
  const [first, second] = moved[control];
  moved[control] = slot === 0 ? [key, second] : [first, key];
  return moved;
}

/** One control's stored pair, and nothing when what was stored cannot be a pair of keys. */
function slotsOf(stored: unknown): Slots | undefined {
  if (!Array.isArray(stored) || stored.length !== 2) return undefined;
  const pair: (string | undefined)[] = [];
  for (const entry of stored) {
    if (entry === null) pair.push(undefined);
    else if (typeof entry === 'string' && entry.length > 0) pair.push(keyOf(entry));
    else return undefined;
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

function nulled(key: string | undefined): string | null {
  return key ?? null;
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

export function rebind(control: Control, slot: number, label: string): void {
  keep(bound(bindings(), control, slot, label));
}

export function restoreDefaults(): void {
  keep(DEFAULTS);
}

/** Whether the key pressed is one of the two a control stands on. */
export function boundTo(label: string, control: Control): boolean {
  const key = keyOf(label);
  return bindings()[control].some((slot) => slot === key);
}
