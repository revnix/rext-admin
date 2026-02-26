/**
 * Sensitive Field Detection and Sanitization Utilities
 *
 * Provides functions to detect and redact sensitive information from
 * logs and error reports to prevent CWE-532 vulnerabilities.
 */

// ============================================================================
// 1. SENSITIVE FIELD NAME PATTERNS
// ============================================================================

/**
 * List of substrings that indicate a field might contain sensitive data.
 * Comparison is done on lowercase field names.
 */
const SENSITIVE_FIELD_PATTERNS = [
  // Authentication & Authorization
  "password",
  "passwd",
  "pwd",
  "secret",
  "token",
  "api_key",
  "apikey",
  "access_key",
  "auth_code",
  "authorization",
  "bearer",
  "challenge",
  "credentials",
  "otp",
  "passcode",
  "pin",
  "refresh_token",
  "session_id",
  "sessionid",
  "signature",
  "ticket",
  "x-auth",
  "x-api-key",

  // Cryptographic Material
  "private_key",
  "public_key", // Often sensitive in context of config
  "encryption_key",
  "decrypt_key",
  "ssh_key",
  "cipher",
  "salt",

  // Financial & Payment
  "credit_card",
  "card_number",
  "cvv",
  "cvc",
  "cc_number",
  "iban",
  "account_number",
  "routing_number",
  "billing_info",

  // PII (Personal Identifiable Information)
  "ssn",
  "social_security",
  "passport_number",
  "driver_license",
  "birth_date",
  "dob",
  "phone_number",
  "mobile_number",
  // Note: 'email' is often logged but can be sensitive. We'll leave it allowed for now
  // unless explicitly requested to redact, as it's a primary identifier.

  // Infrastructure
  "connection_string",
  "dsn",
  "jdbc",
  "database_url",
  "db_password",
  "redis_url",
];

// ============================================================================
// 2. SENSITIVE VALUE REGEX PATTERNS
// ============================================================================

/**
 * Regex patterns to detect sensitive values even if the key name is generic.
 */
const SENSITIVE_VALUE_REGEXES = [
  // JWT Token (Header.Payload.Signature) - basic check for eyJ...
  /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/,

  // Bearer Token
  /^Bearer\s+[a-zA-Z0-9\-._~+/]+=*$/,

  // AWS Access Key ID (AKIA...)
  /(?:AKIA|ASIA|ABIA|ACCA)[0-9A-Z]{16}/,

  // Common API Key Prefixes (Stripe, etc.)
  /sk_live_[0-9a-zA-Z]{24}/,
  /rk_live_[0-9a-zA-Z]{24}/,

  // Generic private keys
  /-----BEGIN (?:RSA )?PRIVATE KEY-----/,
];

// ============================================================================
// 3. EXPORTED FUNCTIONS
// ============================================================================

/**
 * Check if a field name matches any known sensitive patterns.
 *
 * @param fieldName The object key to check
 * @returns true if the field name suggests sensitive content
 */
export function isSensitiveFieldName(fieldName: string): boolean {
  if (!fieldName) return false;
  const lowerName = fieldName.toLowerCase();

  // Basic check: if meaningful key name matches pattern
  return SENSITIVE_FIELD_PATTERNS.some((pattern) =>
    lowerName.includes(pattern),
  );
}

/**
 * Check if a value string matches known sensitive data patterns (e.g. tokens).
 *
 * @param value The value to check
 * @returns true if the value looks like a secret/token
 */
export function isSensitiveValue(value: unknown): boolean {
  if (typeof value !== "string") return false;

  // Don't flag short strings to avoid false positives
  if (value.length < 10) return false;

  return SENSITIVE_VALUE_REGEXES.some((regex) => regex.test(value));
}

/**
 * Recursively sanitizes an object by redacting sensitive fields and values.
 * Returns a new object, does not mutate the original.
 * Handles circular references by depth limiting.
 *
 * @param obj The object or value to sanitize
 * @param depth Current recursion depth (internal usage)
 * @returns The sanitized object or value
 */
export function sanitizeObject(obj: unknown, depth = 0): unknown {
  const MAX_DEPTH = 3;

  // 1. Primitive values logic
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Check strings for sensitive content (e.g. leaked tokens in generic fields)
  if (typeof obj === "string") {
    if (isSensitiveValue(obj)) {
      return "[REDACTED]";
    }
    return obj;
  }

  if (typeof obj !== "object") {
    return obj;
  }

  // 2. Depth Check
  if (depth > MAX_DEPTH) {
    return "{ [TRUNCATED]: Max depth exceeded }";
  }

  // 3. Handle Arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  // 4. Handle Objects
  // Handle Date objects explicitly to avoid converting to empty {}
  if (obj instanceof Date) {
    return obj;
  }

  // Handle Error objects - preserve message/stack but sanitize sensitive props
  if (obj instanceof Error) {
    const sanitizedError: Record<string, unknown> = {
      name: obj.name,
      message: obj.message,
      stack: obj.stack,
    };
    // Copy other properties
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        // @ts-expect-error
        sanitizedError[key] = sanitizeObject(obj[key], depth + 1);
      }
    }
    return sanitizedError;
  }

  const result: Record<string, unknown> = {};
  const record = obj as Record<string, unknown>;

  for (const key in record) {
    if (Object.hasOwn(record, key)) {
      const val = record[key];

      // Check Key Name for sensitivity
      if (isSensitiveFieldName(key)) {
        result[key] = "[REDACTED]";
      } else {
        // Recursive sanitization for value
        result[key] = sanitizeObject(val, depth + 1);
      }
    }
  }

  return result;
}
