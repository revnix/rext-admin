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

  // Admin route protection
  if (nextUrl.pathname.startsWith("/admin")) {
    const userRole = session?.user?.role || "";
    const isAdmin = userRole === "super_admin" || userRole === "admin";

    if (!isAdmin) {
      // Redirect non-admins to home
      return NextResponse.redirect(new URL("/", nextUrl.origin));
    }
  }

  // Workspace route protection - verify user has access
  // Note: Detailed workspace membership is checked at page level via WorkspaceProvider
  // This is a basic check to ensure user is authenticated for workspace routes
  if (nextUrl.pathname.startsWith("/w/") && nextUrl.pathname !== "/w/create") {
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
