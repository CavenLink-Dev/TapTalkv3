/** In-memory flag — survives background/foreground within one JS runtime. */
let warmSession = false;

export function markSessionWarm(): void {
  warmSession = true;
}

export function isWarmSession(): boolean {
  return warmSession;
}

export function resetSessionWarmForDev(): void {
  warmSession = false;
}
