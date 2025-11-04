import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { getCSPHeader } from "@/lib/csp";

/**
 * Generate a cryptographically secure random nonce using Web Crypto API
 * (Edge Runtime compatible)
 */
function generateNonce(): string {
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);
  return btoa(String.fromCharCode(...buffer));
}

// Extend NextRequest to include auth session from NextAuth middleware
interface AuthenticatedRequest extends NextRequest {
  auth: Session | null;
}

/**
 * Protected routes configuration
 * Maps route patterns to required permissions or roles
 *
 * NOTE: These are GLOBAL (user-level) permissions, NOT workspace-scoped.
 * Workspace-scoped permissions are checked at the page/component level
 * after workspace context is loaded.
 */
const PROTECTED_ROUTES: Record<string, string | string[]> = {
  // Owner-only pages (subscription management)
  // These are user-level permissions (workspace_scoped=False in backend)
  "/subscription": "subscription.read",
  "/billing": "billing.read",

  // Usage monitoring (owner + admin have this permission)
  "/usage": "usage.read",

  // Admin-only pages (platform administration)
  "/admin": ["super_admin", "admin"], // Role-based check
  "/admin/users": "user.read",
  "/admin/monitoring": "audit.read",
  "/admin/reports": "audit.read",
};

/**
 * Workspace-scoped routes that require workspace-specific permission checks
 * These routes need workspace context loaded before permission check,
 * so they're checked at the page level, not in middleware.
 *
 * Examples:
 * - /workspaces/[workspaceSlug]/settings - requires workspace.update for THAT workspace
 * - /workspaces/[workspaceSlug]/members - requires member.read for THAT workspace
 * - /workspaces/[workspaceSlug]/content - requires content.read for THAT workspace
 *
 * Middleware only verifies user is authenticated for workspace routes.
 * Detailed permission checks happen in:
 * - WorkspaceProvider (workspace membership)
 * - PermissionGuard components (action-level permissions)
 */

/**
 * Check if user has required permission or role
 * @param session - User session with permissions and role
 * @param requirement - Single permission string, or array of roles
 * @returns true if user has access, false otherwise
 */
function checkAccess(
  session: Session | null,
  requirement: string | string[],
): boolean {
  if (!session?.user) return false;

  const user = session.user;

  // Super admin bypasses all permission checks
  if (user.role === "super_admin") return true;

  // Role-based check (array of allowed roles)
  if (Array.isArray(requirement)) {
    return requirement.includes(user.role || "");
  }

  // Permission-based check (single permission string)
  return user.permissions?.includes(requirement) || false;
}

export default auth((request) => {
  const { nextUrl } = request as NextRequest;
  const session = (request as AuthenticatedRequest).auth;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/invitations/accept", // Allow unauthenticated users to view and accept invitations
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    nextUrl.pathname.startsWith(route),
  );

  // Redirect to login if not authenticated and trying to access protected route
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Permission-based route protection
  // Check each protected route pattern and enforce permissions
  for (const [routePattern, requirement] of Object.entries(PROTECTED_ROUTES)) {
    if (nextUrl.pathname.startsWith(routePattern)) {
      const hasAccess = checkAccess(session, requirement);

      if (!hasAccess) {
        // Redirect to unauthorized page with context
        const unauthorizedUrl = new URL("/unauthorized", nextUrl.origin);
        unauthorizedUrl.searchParams.set("from", nextUrl.pathname);

        // Add required permission/role to help users understand what's needed
        const requiredLabel = Array.isArray(requirement)
          ? requirement.join(" or ")
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
  if (
    nextUrl.pathname.startsWith("/workspaces/") &&
    nextUrl.pathname !== "/workspaces/create"
  ) {
    if (!session) {
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
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
