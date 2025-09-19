/**
 * API Route Utilities
 *
 * Simplified utilities for common API route patterns.
 * Used in conjunction with api-middleware.ts for complete functionality.
 */

import type { NextRequest } from "next/server";
import { z } from "zod";

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================

export const RequestIdSchema = z.object({
  request_id: z.string().optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const TimestampSchema = z.object({
  timestamp: z.string().datetime().optional(),
});

// ============================================================================
// REQUEST HELPERS
// ============================================================================

/**
 * Extract request ID from headers or generate one
 */
export function getRequestId(request: NextRequest): string {
  return (
    request.headers.get("X-Request-ID") ||
    request.headers.get("x-request-id") ||
    `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  );
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

/**
 * Extract user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") || "unknown";
}

/**
 * Check if request is from localhost
 */
export function isLocalhost(request: NextRequest): boolean {
  const host = request.headers.get("host") || "";
  return host.includes("localhost") || host.includes("127.0.0.1");
}

// ============================================================================
// ENVIRONMENT HELPERS
// ============================================================================

/**
 * Get required environment variable
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Get optional environment variable with default
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

// ============================================================================
// DATA TRANSFORMATION HELPERS
// ============================================================================

/**
 * Remove undefined values from object
 */
export function cleanObject<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as T;
}

/**
 * Convert string to boolean safely
 */
export function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
}

/**
 * Parse JSON safely with fallback
 */
export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// ============================================================================
// TIME AND FORMATTING HELPERS
// ============================================================================

/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format duration in milliseconds to human readable
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

/**
 * Add timestamp to data object
 */
export function withTimestamp<T extends Record<string, unknown>>(
  data: T,
  key: string = "timestamp",
): T & { [K in typeof key]: string } {
  return {
    ...data,
    [key]: getCurrentTimestamp(),
  } as T & { [K in typeof key]: string };
}

// ============================================================================
// URL AND PATH HELPERS
// ============================================================================

/**
 * Extract path segments from request URL
 */
export function getPathSegments(request: NextRequest): string[] {
  return request.nextUrl.pathname.split("/").filter(Boolean);
}

/**
 * Get route parameter from path
 */
export function getRouteParam(
  request: NextRequest,
  paramIndex: number,
): string | undefined {
  const segments = getPathSegments(request);
  return segments[paramIndex];
}

/**
 * Build URL with query parameters
 */
export function buildUrl(
  base: string,
  params: Record<string, string | number | boolean>,
): string {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

// ============================================================================
// SECURITY HELPERS
// ============================================================================

/**
 * Basic rate limiting storage (in-memory)
 * Note: Use Redis or external store for production
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple in-memory rate limiting
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const window = rateLimitStore.get(key);

  if (!window || now > window.resetTime) {
    // Reset or create new window
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
  }

  if (window.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: window.resetTime };
  }

  window.count++;
  return {
    allowed: true,
    remaining: limit - window.count,
    resetTime: window.resetTime,
  };
}

/**
 * Hash string using built-in crypto (Node.js 14+)
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate secure random string
 */
export function generateSecureId(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================================================
// TYPED METHOD HELPERS
// ============================================================================

/**
 * Type-safe method checking
 */
export function isMethod(
  request: NextRequest,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
): boolean {
  return request.method === method;
}

/**
 * Require specific HTTP method
 */
export function requireMethod(
  request: NextRequest,
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
): void {
  if (!isMethod(request, method)) {
    throw new Error(
      `Method ${request.method} not allowed. Expected ${method}.`,
    );
  }
}

/**
 * Allow multiple HTTP methods
 */
export function allowMethods(
  request: NextRequest,
  methods: ("GET" | "POST" | "PUT" | "DELETE" | "PATCH")[],
): void {
  const method = request.method.toUpperCase();
  const isAllowed = methods.some((allowedMethod) => allowedMethod === method);

  if (!isAllowed) {
    throw new Error(
      `Method ${request.method} not allowed. Expected one of: ${methods.join(", ")}.`,
    );
  }
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Create standardized pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number,
): {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const pages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
}

/**
 * Create consistent API metadata
 */
export function createApiMeta(
  requestId: string,
  additionalMeta?: Record<string, unknown>,
) {
  return {
    request_id: requestId,
    timestamp: getCurrentTimestamp(),
    version: "1.0",
    ...additionalMeta,
  };
}
