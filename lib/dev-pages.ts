/**
 * The development pages under /dev (the tokens and the primitives, tasks B8 and C6). They are on under
 * `next dev`, and in a production build only when REXT_DEV_PAGES is "1", which pr-checks sets so its
 * accessibility checks (task C10) can open /dev/primitives without signing in. The deploys never set it,
 * so app.rext.ai answers 404 there.
 */
export function devPagesOn(): boolean {
  return (
    process.env.NODE_ENV !== "production" || process.env.REXT_DEV_PAGES === "1"
  );
}
