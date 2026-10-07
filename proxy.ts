import { AUTH_PAGES, AUTH_PAGE_PATHS, isAuthPage } from "@/lib/auth-routes";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { getToken } from "next-auth/jwt";
import { getCSPHeader } from "@/lib/csp";
import { devPagesOn } from "@/lib/dev-pages";
import { ROLES } from "@/lib/permissions";

/** The site's pricing page, where a signed-out visit to /pricing goes. */
const SITE_PRICING_URL = "https://rext.ai/pricing";

/**
 * Generate a cryptographically secure random nonce using Web Crypto API
 * (Edge Runtime compatible)
 */
function generateNonce(): string {
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);
  return btoa(String.fromCharCode(...buffer));
}

function toSession(token: JWT | null): Session | null {
  if (!token) return null;

  const id = String(token.id ?? token.sub ?? "");
  if (!id) return null;

  return {
    user: {
      id,
      email: String(token.email ?? ""),
      name: typeof token.name === "string" ? token.name : null,
      full_name:
        typeof token.full_name === "string"
          ? token.full_name
          : typeof token.name === "string"
            ? token.name
            : "",
      display_name:
        typeof token.display_name === "string" ? token.display_name : null,
      image: typeof token.picture === "string" ? token.picture : null,
      accessToken: String(token.accessToken ?? ""),
      role: typeof token.role === "string" ? token.role : undefined,
      permissions: Array.isArray(token.permissions)
        ? (token.permissions as string[])
        : [],
    },
    expires: token.exp
      ? new Date(token.exp * 1000).toISOString()
      : new Date(0).toISOString(),
    accessTokenExpires:
      typeof token.accessTokenExpires === "number"
        ? token.accessTokenExpires
        : undefined,
    error: typeof token.error === "string" ? token.error : undefined,
  };
}

async function readSessionWithoutWritingCookie(
  request: NextRequest,
): Promise<Session | null> {
  const secret =
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    (process.env.NODE_ENV !== "production"
      ? "development_auth_secret"
      : undefined);
  if (!secret) return null;

  const configuredUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  const secureCookie = configuredUrl
    ? configuredUrl.startsWith("https://")
    : process.env.NODE_ENV === "production";

  const token = await getToken({ req: request, secret, secureCookie }).catch(
    () => null,
  );
  return toSession(token);
}

/**
 * Protected routes configuration
 *
 * Value forms:
 * - string: a single GLOBAL permission
 * - string[]: ANY of these ROLES
 * - { anyPermission / anyRole }: ANY of these permissions OR roles
 *
 * NOTE:
 * - These are GLOBAL (user-level) permissions, NOT workspace-scoped.
 * - Workspace-scoped permissions are checked at the page/component level
 *   after workspace context is loaded (via workspace permission store).
 *
 * Subscription/Billing/Usage access is now derived from workspace-scoped
 * permissions (e.g. "billing.read" in ANY workspace) on the client side,
 * so they are no longer enforced here to avoid mismatches with the new
 * `/permissions/me` API.
 */
const PROTECTED_ROUTES: Record<
  string,
  string | string[] | { anyPermission?: string[]; anyRole?: string[] }
> = {
  "/admin": [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  // user.manage = full management (admin/super_admin); the global support
  // role gets read-only visibility. user.read cannot gate this route — it is
  // the self-service permission every account holds.
  "/admin/users": {
    anyPermission: ["user.manage"],
    anyRole: [ROLES.SUPPORT],
  },
  "/admin/monitoring": "security.read",
  "/admin/email-analytics": "security.read",
  "/admin/security": "security.read",
  "/admin/audit-logs": "audit.read",
  "/admin/reports": "billing.read",
  "/admin/subscriptions": "billing.read",
  "/admin/refunds": "billing.read",
  "/admin/roles": "role.read",
};

const PROTECTED_ROUTE_ENTRIES = Object.entries(PROTECTED_ROUTES).sort(
  ([left], [right]) => right.length - left.length,
);

function matchesRoute(pathname: string, routePattern: string): boolean {
  return pathname === routePattern || pathname.startsWith(`${routePattern}/`);
}

/**
 * Workspace-scoped routes that require workspace-specific permission checks
 * These routes need workspace context loaded before permission check,
 * so they're checked at the page level, not in middleware.
 *
 * Examples:
 * - /w/[workspaceSlug]/settings/brand-voice - requires brand_voice.read for THAT workspace
 * - /w/[workspaceSlug]/settings/members - requires member.read for THAT workspace
 * - /w/[workspaceSlug]/content - requires content.read for THAT workspace
 *
 * Middleware only verifies user is authenticated for workspace routes.
 * Detailed permission checks happen in:
 * - WorkspaceProvider (workspace membership)
 * - PermissionGuard components (action-level permissions)
 */

/**
 * Check if user has required permission or role
 * @param session - User session with permissions and role
 * @param requirement - Single permission, array of roles, or any-of permissions/roles
 * @returns true if user has access, false otherwise
 */
function checkAccess(
  session: Session | null,
  requirement:
    | string
    | string[]
    | { anyPermission?: string[]; anyRole?: string[] },
): boolean {
  if (!session?.user) return false;

  const user = session.user;

  if (user.role === ROLES.SUPER_ADMIN) return true;

  if (Array.isArray(requirement)) {
    return requirement.includes(user.role || "");
  }

  if (typeof requirement === "object") {
    const byPermission = (requirement.anyPermission ?? []).some((permission) =>
      user.permissions?.includes(permission),
    );
    const byRole = (requirement.anyRole ?? []).includes(user.role || "");
    return byPermission || byRole;
  }

  return user.permissions?.includes(requirement) || false;
}

export default async function proxy(request: NextRequest) {
  const { nextUrl } = request;

  // Handle legacy invitation route redirect
  if (nextUrl.pathname === "/accept-invitation") {
    const redirectedUrl = new URL("/invitations/accept", nextUrl.origin);
    const token =
      nextUrl.searchParams.get("token") ||
      nextUrl.searchParams.get("invitation_token");

    if (token) {
      redirectedUrl.searchParams.set("token", token);
    }

    return NextResponse.redirect(redirectedUrl);
  }

  // Decode the encrypted Auth.js JWT without invoking Auth.js's session
  // action. The session action re-encodes and Set-Cookies on every read;
  // middleware requests completing out of order could otherwise overwrite a
  // newly rotated backend refresh token with an older cookie.
  const session = await readSessionWithoutWritingCookie(request);
  const isLoggedIn = !!session?.user && !session.error;
  const isInvitationPage =
    nextUrl.pathname.startsWith("/invitations/accept") ||
    nextUrl.pathname.startsWith("/accept-invitation") ||
    nextUrl.pathname.startsWith("/accept-admin-invitation");
  const isVerifyEmailPage = nextUrl.pathname.startsWith(
    AUTH_PAGES.VERIFY_EMAIL,
  );

  // Public routes that don't require authentication
  const publicRoutes = [
    ...AUTH_PAGE_PATHS,
    "/invitations/accept", // Allow unauthenticated users to view and accept invitations
    // A deleted user has no session (delete revokes them all), so the recovery
    // link must open without one. Kept out of AUTH_PAGE_PATHS so that someone
    // signed in as another account isn't bounced away from the link.
    "/account-recovery",
    // Every email's unsubscribe link: it works without signing in (commercial-email law expects
    // that), and the token in the link is the proof.
    "/unsubscribe",
    // The development pages read no data. They open signed out wherever they're on
    // (lib/dev-pages.ts), so pr-checks' accessibility checks reach them.
    ...(devPagesOn() ? ["/dev/"] : []),
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    nextUrl.pathname.startsWith(route),
  );

  if (session?.error && !isPublicRoute) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set(
      "error",
      session.error === "OAuthBackendError" ? "OAuthError" : "SessionExpired",
    );
    return NextResponse.redirect(loginUrl);
  }

  if (
    isLoggedIn &&
    isAuthPage(nextUrl.pathname) &&
    !isInvitationPage &&
    !isVerifyEmailPage
  ) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  // Pricing is the app's for its accounts; a visitor who isn't signed in gets the site's
  // (plans/app/F-billing.md §2 item 2).
  if (!isLoggedIn && nextUrl.pathname === "/pricing") {
    return NextResponse.redirect(SITE_PRICING_URL);
  }

  // Redirect to login if not authenticated and trying to access protected route
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Permission-based route protection
  // Check each protected route pattern and enforce permissions
  for (const [routePattern, requirement] of PROTECTED_ROUTE_ENTRIES) {
    if (matchesRoute(nextUrl.pathname, routePattern)) {
      const hasAccess = checkAccess(session, requirement);

      if (!hasAccess) {
        // Redirect to unauthorized page with context
        const unauthorizedUrl = new URL("/unauthorized", nextUrl.origin);
        unauthorizedUrl.searchParams.set("from", nextUrl.pathname);

        // Add required permission/role to help users understand what's needed
        const requiredLabel = Array.isArray(requirement)
          ? requirement.join(" or ")
          : typeof requirement === "object"
            ? [
                ...(requirement.anyPermission ?? []),
                ...(requirement.anyRole ?? []),
              ].join(" or ")
            : requirement;
        unauthorizedUrl.searchParams.set("required", requiredLabel);

        return NextResponse.redirect(unauthorizedUrl);
      }

      // Permission granted, continue to page
      break;
    }
  }

  // Workspace route protection - verify user has access
  // Note: Detailed workspace membership is checked at page level via WorkspaceProvider
  // This is a basic check to ensure user is authenticated for workspace routes
  if (nextUrl.pathname.startsWith("/w/") && nextUrl.pathname !== "/w/create") {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    // Detailed workspace membership verified by WorkspaceProvider on page load
  }

  // Generate cryptographic nonce for CSP
  const nonce = generateNonce();

  // Content Security Policy (nonce-based, environment-aware)
  const csp = getCSPHeader(nonce);

  // CRITICAL: Set nonce in request headers so Next.js can apply it during SSR
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  // Create response with updated request headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Security headers
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");

  // Set CSP in response headers for browser enforcement
  response.headers.set("Content-Security-Policy", csp);

  // Pass nonce to components via header (if needed for inline scripts)
  response.headers.set("x-nonce", nonce);

  // HSTS (only in production)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|favicons|logos).*)",
  ],
};
