/** Foreground JS owns the ping. A fresh background task starts with this false. */
let owns = false;

export function setForegroundOwnsLocation(next: boolean): void {
  owns = next;
}

export function foregroundOwnsLocation(): boolean {
  return owns;
}
