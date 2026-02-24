/**
 * Shared API base URL resolver.
 * 
 * Determines the backend API base URL based on (in order):
 * 1. Explicitly provided baseUrl
 * 2. NEXT_PUBLIC_BACKEND_API_URL environment variable
 * 3. NEXT_PUBLIC_API_BASE_URL environment variable
 * 4. window.location.origin (if running in a browser)
 * 
 * @throws {Error} If no valid API base URL can be determined.
 */
export function resolveApiBaseUrl(explicitBaseUrl?: string): string {
    // Use explicit override if provided
    if (explicitBaseUrl && explicitBaseUrl.trim().length > 0) {
        return explicitBaseUrl.replace(/\/+$/, "");
    }

    // Check environment variables
    const envBaseUrl =
        process.env.NEXT_PUBLIC_BACKEND_API_URL ||
        process.env.NEXT_PUBLIC_API_BASE_URL;

    if (envBaseUrl && envBaseUrl.trim().length > 0) {
        return envBaseUrl.replace(/\/+$/, "");
    }

    // Fallback to window.location.origin if available
    if (typeof window !== "undefined" && window.location?.origin) {
        return window.location.origin.replace(/\/+$/, "");
    }

    // Fail fast if no base URL is found
    throw new Error(
        "No API base URL configured. Set NEXT_PUBLIC_BACKEND_API_URL or NEXT_PUBLIC_API_BASE_URL.",
    );
}
