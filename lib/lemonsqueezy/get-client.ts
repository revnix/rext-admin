export function getLemonSqueezyClient() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.LemonSqueezy ?? null;
}