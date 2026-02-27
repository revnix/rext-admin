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
