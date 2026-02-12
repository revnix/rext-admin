/**
 * Check if a password has been exposed in known data breaches
 * using the Have I Been Pwned Passwords API (k-anonymity model).
 *
 * Only the first 5 characters of the SHA-1 hash are sent to the API,
 * protecting user privacy. The full hash is never transmitted.
 *
 * @see https://haveibeenpwned.com/API/v3#PwnedPasswords
 */
export async function checkPasswordBreach(password: string): Promise<{
    breached: boolean;
    count: number;
}> {
    try {
        // Compute SHA-1 hash of the password
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-1", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
            .toUpperCase();

        const prefix = hashHex.slice(0, 5);
        const suffix = hashHex.slice(5);

        // Query HIBP API with only the hash prefix (k-anonymity)
        const response = await fetch(
            `https://api.pwnedpasswords.com/range/${prefix}`,
            {
                headers: {
                    "Add-Padding": "true", // Prevent response length analysis
                },
            },
        );

        if (!response.ok) {
            // If HIBP API is unavailable, fail open (allow the password)
            // Log the error for monitoring
            console.warn("[Password Check] HIBP API unavailable:", response.status);
            return { breached: false, count: 0 };
        }

        const text = await response.text();
        const lines = text.split("\n");

        for (const line of lines) {
            const [hashSuffix, countStr] = line.split(":");
            if (hashSuffix.trim() === suffix) {
                const count = parseInt(countStr.trim(), 10);
                return { breached: true, count };
            }
        }

        return { breached: false, count: 0 };
    } catch {
        // Fail open if there's any error (network issue, crypto not available, etc.)
        console.warn("[Password Check] Error checking password breach database");
        return { breached: false, count: 0 };
    }
}
