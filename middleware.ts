export { auth as middleware } from "@/auth";

export const config = {
    matcher: [
        // Skip all internal paths (_next, static, images, favicon)
        // and skip API routes unless they should be protected by middleware
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)",
    ],
};
