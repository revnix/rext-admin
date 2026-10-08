export const AUTH_PAGES = {
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  ACCEPT_ADMIN_INVITATION: "/accept-admin-invitation",
} as const;

export type AuthPage = (typeof AUTH_PAGES)[keyof typeof AUTH_PAGES];

export const AUTH_PAGE_PATHS: readonly string[] = Object.values(AUTH_PAGES);

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGE_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * The pages that open without a session: `proxy.ts`'s public routes, for the browser. A request
 * made from one of these may leave without a token (an invitation looked up before signing in);
 * from any other page it may not (lib/auth-utils.ts). `__tests__/lib/auth-routes.test.ts` keeps
 * this list in step with the proxy's.
 */
export const PAGES_WITHOUT_SESSION: readonly string[] = [
  ...AUTH_PAGE_PATHS,
  "/invitations/accept",
  "/account-recovery",
  "/unsubscribe",
  "/legal/",
  "/dev/",
];

export function opensWithoutSession(pathname: string): boolean {
  return PAGES_WITHOUT_SESSION.some((path) => pathname.startsWith(path));
}
