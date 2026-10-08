/**
 * The key this server sends when it completes a Google or GitHub sign-in with the backend
 * (revnix/rext-control#892).
 *
 * That call (`POST /api/v1/user/oauth/login`, made in auth.config.ts once the provider has
 * answered) reaches the backend from this server's address, never from the visitor's. The key
 * tells the backend the call is this server's: it then counts the call per provider account, so
 * people signing in at the same time don't share one address's allowance, and it can refuse the
 * same call from anywhere else.
 *
 * `DASHBOARD_SERVER_KEY` is a server-side setting, the same value as the backend's. It has no
 * NEXT_PUBLIC_ prefix, so it is never built into the browser's code. Unset, the call goes
 * without the header, as it did before.
 */

export const DASHBOARD_SERVER_HEADER = "X-Rext-Dashboard-Key";

export function dashboardServerKeyHeader(): Record<string, string> {
  const key = process.env.DASHBOARD_SERVER_KEY?.trim();
  return key ? { [DASHBOARD_SERVER_HEADER]: key } : {};
}
