/**
 * API Middleware Utilities for Next.js 15 Route Handlers
 *
 * Modern reusable middleware patterns following 2025 best practices:
 * - Web Standard Request/Response APIs
 * - Structured logging integration
 * - Consistent error handling
 * - Request correlation and tracking
 * - Type-safe validation
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/response-utils";
import { resolveApiBaseUrl } from "@/lib/api-base-url";
import type { BackendErrorCode } from "@/types/consistent-response";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ApiContext {
  requestId: string;
  method: string;
  path: string;
  startTime: number;
}

export interface ApiErrorResponse {
  error: string;
  error_code: BackendErrorCode;
  details?: string;
  request_id: string;
  retry_after?: number;
  fallback_available?: boolean;
}

export interface ApiSuccessResponse<T = unknown> {
  data?: T;
  request_id: string;
  [key: string]: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export type RouteHandler<T = unknown> = (
  request: NextRequest,
  context: ApiContext,
) => Promise<NextResponse<ApiResponse<T>>>;

export interface MiddlewareOptions {
  /** Whether to log requests */
  enableLogging?: boolean;
  /** Custom request ID prefix */
  requestIdPrefix?: string;
  /** CORS settings */
  cors?: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
  };
  /** Rate limiting */
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

// ============================================================================
// CORE MIDDLEWARE WRAPPER
// ============================================================================

/**
 * Modern API middleware wrapper for Next.js 15 Route Handlers
 *
 * Features:
 * - Request correlation with unique IDs
 * - Structured logging integration
 * - Consistent error response format
 * - Performance tracking
 * - CORS handling
 * - Type-safe validation
 *
 * @example
 * ```typescript
 * export const POST = withApiMiddleware(async (request, context) => {
 *   const data = await parseJsonBody(request, MySchema);
 *   return createSuccessResponse({ result: data }, context.requestId);
 * }, { enableLogging: true });
 * ```
 */
export function withApiMiddleware<T = unknown>(
  handler: RouteHandler<T>,
  options: MiddlewareOptions = {},
): (request: NextRequest) => Promise<NextResponse<ApiResponse<T>>> {
  const { enableLogging = true, requestIdPrefix = "api", cors } = options;

  return async (
    request: NextRequest,
  ): Promise<NextResponse<ApiResponse<T>>> => {
    const startTime = Date.now();
    const requestId = generateRequestId(requestIdPrefix);
    const method = request.method;
    const path = request.nextUrl.pathname;

    const context: ApiContext = {
      requestId,
      method,
      path,
      startTime,
    };

    const apiLogger = logger.forComponent("api-middleware");

    if (enableLogging) {
      apiLogger.request(requestId, method, path, {
        headers: Object.fromEntries(request.headers.entries()),
        timestamp: new Date().toISOString(),
      });
    }

    try {
      // Handle CORS if configured
      if (cors && method === "OPTIONS") {
        return handleCorsPreFlight<T>(cors, requestId);
      }

      // Execute the route handler
      const response = await handler(request, context);

      // Add common headers
      const headers = new Headers(response.headers);
      headers.set("X-Request-ID", requestId);

      // Add CORS headers if configured
      if (cors) {
        addCorsHeaders(headers, cors);
      }

      const duration = Date.now() - startTime;

      if (enableLogging) {
        apiLogger.response(requestId, response.status, duration, {
          path,
          method,
        });
      }

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorResponse = handleApiError(error, requestId, apiLogger);

      if (enableLogging) {
        apiLogger.response(requestId, errorResponse.status, duration, {
          path,
          method,
          error: true,
        });
      }

      const headers = new Headers();
      headers.set("X-Request-ID", requestId);
      headers.set("Content-Type", "application/json");

      // Add CORS headers if configured
      if (cors) {
        addCorsHeaders(headers, cors);
      }

      return NextResponse.json(errorResponse.body, {
        status: errorResponse.status,
        headers,
      });
    }
  };
}

// ============================================================================
// RESPONSE CREATION UTILITIES
// ============================================================================

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  requestId: string,
  additionalFields?: Record<string, unknown>,
): NextResponse<ApiSuccessResponse<T>> {
  const responseBody: ApiSuccessResponse<T> = {
    data,
    request_id: requestId,
    ...additionalFields,
  };

  return NextResponse.json(responseBody, {
    headers: {
      "X-Request-ID": requestId,
      "Content-Type": "application/json",
    },
  });
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: string,
  errorCode: BackendErrorCode,
  requestId: string,
  statusCode: number = 500,
  details?: string,
  retryAfter?: number,
): NextResponse<ApiErrorResponse> {
  const responseBody: ApiErrorResponse = {
    error,
    error_code: errorCode,
    request_id: requestId,
    details,
    retry_after: retryAfter,
    fallback_available: false,
  };

  const headers: Record<string, string> = {
    "X-Request-ID": requestId,
    "Content-Type": "application/json",
  };

  if (retryAfter) {
    headers["Retry-After"] = retryAfter.toString();
  }

  return NextResponse.json(responseBody, {
    status: statusCode,
    headers,
  });
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Parses and validates JSON body with Zod schema
 */
export async function parseJsonBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Invalid request data",
        error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      );
    }
    throw new ValidationError("Invalid JSON in request body");
  }
}

/**
 * Validates query parameters with Zod schema
 */
export function parseQueryParams<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
): T {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        "Invalid query parameters",
        error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      );
    }
    throw new ValidationError("Invalid query parameters");
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "Insufficient permissions") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string = "Rate limit exceeded",
    public retryAfter: number = 60,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

function handleApiError(
  error: unknown,
  requestId: string,
  apiLogger: ReturnType<typeof logger.forComponent>,
): { status: number; body: ApiErrorResponse } {
  let errorCode: BackendErrorCode = "unknown_error";
  let errorMessage = "An unexpected error occurred";
  let statusCode = 500;
  let details: string | undefined;
  let retryAfter: number | undefined;

  if (error instanceof ValidationError) {
    errorCode = "validation_failed";
    errorMessage = error.message;
    statusCode = 400;
    details = error.details;
  } else if (error instanceof AuthenticationError) {
    errorCode = "authentication_required";
    errorMessage = error.message;
    statusCode = 401;
  } else if (error instanceof AuthorizationError) {
    errorCode = "insufficient_permissions";
    errorMessage = error.message;
    statusCode = 403;
  } else if (error instanceof NotFoundError) {
    errorCode = "resource_not_found";
    errorMessage = error.message;
    statusCode = 404;
  } else if (error instanceof RateLimitError) {
    errorCode = "api_rate_limit_exceeded";
    errorMessage = error.message;
    statusCode = 429;
    retryAfter = error.retryAfter;
  } else if (error instanceof Error) {
    errorMessage = error.message;
    details = error.stack;
  }

  apiLogger.error("API request failed", {
    error_code: errorCode,
    message: errorMessage,
    details,
    request_id: requestId,
    status_code: statusCode,
  });

  return {
    status: statusCode,
    body: {
      error: errorMessage,
      error_code: errorCode,
      request_id: requestId,
      details,
      retry_after: retryAfter,
      fallback_available: false,
    },
  };
}

// ============================================================================
// CORS UTILITIES
// ============================================================================

function handleCorsPreFlight<T>(
  cors: NonNullable<MiddlewareOptions["cors"]>,
  requestId: string,
): NextResponse<ApiResponse<T>> {
  const headers = new Headers();
  addCorsHeaders(headers, cors);
  headers.set("X-Request-ID", requestId);
  headers.set("Content-Type", "application/json");

  const body: ApiSuccessResponse<T> = {
    request_id: requestId,
  };

  return NextResponse.json(body as ApiResponse<T>, { status: 200, headers });
}

function addCorsHeaders(
  headers: Headers,
  cors: NonNullable<MiddlewareOptions["cors"]>,
): void {
  if (cors.origin) {
    const origin = Array.isArray(cors.origin)
      ? cors.origin.join(",")
      : cors.origin;
    headers.set("Access-Control-Allow-Origin", origin);
  }

  if (cors.methods) {
    headers.set("Access-Control-Allow-Methods", cors.methods.join(","));
  }

  if (cors.headers) {
    headers.set("Access-Control-Allow-Headers", cors.headers.join(","));
  }

  headers.set("Access-Control-Allow-Credentials", "true");
}

// ============================================================================
// AUTHENTICATION UTILITIES
// ============================================================================

/**
 * Extract and validate API key from request headers
 */
export function extractApiKey(request: NextRequest): string {
  const apiKey =
    request.headers.get("Authorization")?.replace("Bearer ", "") ||
    request.headers.get("X-API-Key");

  if (!apiKey) {
    throw new AuthenticationError("API key required");
  }

  return apiKey;
}

/**
 * Validate API key against environment variable
 */
export function validateApiKey(apiKey: string, envKey: string): void {
  const expectedKey = process.env[envKey];
  if (!expectedKey || apiKey !== expectedKey) {
    throw new AuthenticationError("Invalid API key");
  }
}

// ============================================================================
// BACKEND PROXY UTILITIES
// ============================================================================

/**
 * Proxy request to backend API with consistent error handling
 */
export async function proxyToBackend(
  endpoint: string,
  request: NextRequest,
  requestId: string,
  options: {
    apiUrl?: string;
    apiKey?: string;
    timeout?: number;
  } = {},
): Promise<Response> {
  const {
    apiUrl = resolveApiBaseUrl(process.env.BACKEND_API_URL),
    apiKey = process.env.NEXT_PUBLIC_CONTENT_API_KEY,
    timeout = 30000,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        ...(apiKey && { "content-api-key": apiKey }),
        ...Object.fromEntries(
          [...request.headers.entries()].filter(([key]) =>
            ["authorization", "x-api-key"].includes(key.toLowerCase()),
          ),
        ),
      },
      body: request.method !== "GET" ? await request.text() : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Backend request timeout");
    }
    throw error;
  }
}
