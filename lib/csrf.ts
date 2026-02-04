/**
 * CSRF Token Management
 *
 * Generates and validates CSRF tokens for state-changing requests.
 * Tokens are stored in sessionStorage and sent with every POST/PUT/PATCH/DELETE request.
 */

const CSRF_TOKEN_KEY = "__csrf_token";

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
	const array = new Uint8Array(32);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
		"",
	);
}

/**
 * Get or create CSRF token for current session
 */
export function getCSRFToken(): string {
	if (typeof window === "undefined") return "";

	let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
	if (!token) {
		token = generateCSRFToken();
		sessionStorage.setItem(CSRF_TOKEN_KEY, token);
	}
	return token;
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFHeader(headers: HeadersInit = {}): HeadersInit {
	return {
		...headers,
		"X-CSRF-Token": getCSRFToken(),
	};
}

/**
 * Clear CSRF token (e.g., on logout)
 */
export function clearCSRFToken(): void {
	if (typeof window !== "undefined") {
		sessionStorage.removeItem(CSRF_TOKEN_KEY);
	}
}
