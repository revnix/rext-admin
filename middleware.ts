import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";

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
      // Redirect non-admins to dashboard
      return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
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

  // Create response
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self' http://127.0.0.1:2024 http://localhost:2024",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

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
