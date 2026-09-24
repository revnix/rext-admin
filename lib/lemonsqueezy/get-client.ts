/**
 * LemonSqueezy client access
 *
 * lemon.js exposes `window.LemonSqueezy` once it has been initialised. It only
 * wires itself up on DOMContentLoaded, which has usually already fired by the
 * time the script lands (and never fires again on client-side navigation), so
 * `createLemonSqueezy()` is the documented SPA entry point and is idempotent.
 *
 * @module lib/lemonsqueezy/get-client
 */

/** Checkout lifecycle event emitted by lemon.js. */
export interface LemonSqueezyEvent {
  event: string;
  data?: unknown;
}

/**
 * The active checkout event handler.
 *
 * Held at module scope rather than being passed straight to `Setup()` because
 * `createLemonSqueezy()` rebuilds the LemonSqueezy object and drops whatever
 * handler was registered before. `Setup()` is always given a stable wrapper
 * that reads this, so re-initialising can never lose the handler.
 */
let checkoutEventHandler: ((event: LemonSqueezyEvent) => void) | null = null;

/** Register the handler invoked for every lemon.js checkout event. */
export function setCheckoutEventHandler(
  handler: ((event: LemonSqueezyEvent) => void) | null,
) {
  checkoutEventHandler = handler;
}

/**
 * Initialise lemon.js (idempotent) and return the client.
 *
 * @returns The LemonSqueezy client, or null on the server / before the script loads.
 */
export function ensureLemonSqueezy() {
  if (typeof window === "undefined") {
    return null;
  }

  window.createLemonSqueezy?.();
  window.LemonSqueezy?.Setup?.({
    eventHandler: (event) => checkoutEventHandler?.(event),
  });

  return window.LemonSqueezy ?? null;
}

/**
 * Return the LemonSqueezy client without initialising it.
 *
 * Prefer {@link ensureLemonSqueezy} when about to open a checkout.
 */
export function getLemonSqueezyClient() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.LemonSqueezy ?? null;
}
