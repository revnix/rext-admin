import { type NextRequest, NextResponse } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

// Routes that should redirect to dashboard if user is already authenticated
const AUTH_ROUTES = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from localStorage (stored by Zustand persist)
  const authCookie = request.cookies.get("auth-storage");

  // Check if user has valid auth token
  let isAuthenticated = false;
  if (authCookie) {
    try {
      const authData = JSON.parse(authCookie.value);
      const authState = authData?.state;
      isAuthenticated =
        authState?.isAuthenticated === true && authState?.token !== null;
    } catch {
      // Invalid auth cookie
      isAuthenticated = false;
    }
  }

  // Redirect authenticated users away from auth pages
  if (
    isAuthenticated &&
    AUTH_ROUTES.some((route) => pathname.startsWith(route))
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users to login for protected routes
  if (
    !isAuthenticated &&
    !PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api")
  ) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
