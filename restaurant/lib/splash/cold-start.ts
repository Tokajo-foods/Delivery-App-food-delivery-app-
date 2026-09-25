/** Survives background → foreground; resets only on a fresh JS process (cold start). */
let coldStartSplashConsumed = false;

export const SPLASH_DURATION_MS = 3500;

export function shouldShowColdStartSplash(): boolean {
  return !coldStartSplashConsumed;
}

export function markColdStartSplashConsumed(): void {
  coldStartSplashConsumed = true;
}
