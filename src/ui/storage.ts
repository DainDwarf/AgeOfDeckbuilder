/** Whether the browser has refused anything since the page loaded. */
let refused = false;

/** Who is told of the first refusal, and nothing until someone listens. */
let told: (() => void) | undefined;

/** A refusal, said on the console in the browser's own words. */
function refusedWith(error: unknown): void {
  console.warn(error instanceof Error ? error.message : String(error));
  if (refused) return;
  refused = true;
  told?.();
}

/** The one told of the first refusal of the page load: at once, where it has come already. */
export function onRefused(tell: () => void): void {
  told = tell;
  if (refused) tell();
}

/** What the browser keeps under the key, and nothing where it keeps nothing or refuses to be read. */
export function stored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    refusedWith(error);
    return null;
  }
}

/** The text kept under the key, over whatever stood. */
export function store(key: string, text: string): void {
  try {
    window.localStorage.setItem(key, text);
  } catch (error) {
    refusedWith(error);
  }
}

/** Nothing kept under the key any more. */
export function unstore(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    refusedWith(error);
  }
}
