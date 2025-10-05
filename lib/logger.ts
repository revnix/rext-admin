/**
 * Structured logging using Pino
 * Provides production-ready logging with sensitive data redaction
 */
import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";
const isClient = typeof window !== "undefined";

// Browser logger configuration
const browserLogger = pino({
  level: isDevelopment ? "debug" : "info",
  browser: {
    asObject: true,
    serialize: true,
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
});

// Server logger configuration
// NOTE: pino-pretty is disabled to prevent worker thread issues in Next.js 15
// Logs will appear as JSON in development, which is compatible with Next.js
const serverLogger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  formatters: {
    level: (label) => ({ level: label }),
  },
  // Transport disabled - prevents worker thread errors in Next.js 15
  // Use JSON logs in all environments for compatibility
});

const pinoLogger = isClient ? browserLogger : serverLogger;

// Wrapper to maintain old logger API (message, data) while using pino (data, message)
type ComponentLogger = {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, error?: Error | unknown, data?: unknown) => void;
  request: (
    requestId: string,
    method: string,
    url: string,
    data?: unknown,
  ) => void;
  response: (
    requestId: string,
    status: number,
    duration?: number,
    data?: unknown,
  ) => void;
  performance: (operation: string, duration: number, data?: unknown) => void;
};

// Create a wrapper that swaps pino's (obj, msg) to old logger's (msg, obj) signature
export const logger = {
  debug: (message: string, data?: unknown, ...args: unknown[]) => {
    const sanitized = sanitize(data) as Record<string, unknown> | null;
    const mergedData =
      args.length > 0 ? { ...(sanitized || {}), args } : sanitized || {};
    pinoLogger.debug(mergedData, message);
  },
  info: (message: string, data?: unknown, ...args: unknown[]) => {
    const sanitized = sanitize(data) as Record<string, unknown> | null;
    const mergedData =
      args.length > 0 ? { ...(sanitized || {}), args } : sanitized || {};
    pinoLogger.info(mergedData, message);
  },
  warn: (message: string, data?: unknown, ...args: unknown[]) => {
    const sanitized = sanitize(data) as Record<string, unknown> | null;
    const mergedData =
      args.length > 0 ? { ...(sanitized || {}), args } : sanitized || {};
    pinoLogger.warn(mergedData, message);
  },
  error: (
    message: string,
    error?: Error | unknown,
    data?: unknown,
    ...args: unknown[]
  ) => {
    const sanitized = sanitize(data) as Record<string, unknown> | null;
    const mergedData =
      args.length > 0 ? { ...(sanitized || {}), args } : sanitized || {};
    pinoLogger.error(
      {
        ...mergedData,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      message,
    );
  },
  forComponent: (component: string): ComponentLogger => ({
    debug: (message: string, data?: unknown) => {
      const sanitized = sanitize(data) as Record<string, unknown> | null;
      pinoLogger.debug({ ...(sanitized || {}), component }, message);
    },
    info: (message: string, data?: unknown) => {
      const sanitized = sanitize(data) as Record<string, unknown> | null;
      pinoLogger.info({ ...(sanitized || {}), component }, message);
    },
    warn: (message: string, data?: unknown) => {
      const sanitized = sanitize(data) as Record<string, unknown> | null;
      pinoLogger.warn({ ...(sanitized || {}), component }, message);
    },
    error: (message: string, error?: Error | unknown, data?: unknown) => {
      const sanitized = sanitize(data) as Record<string, unknown> | null;
      pinoLogger.error(
        {
          ...(sanitized || {}),
          component,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        message,
      );
    },
    request: (
      requestId: string,
      method: string,
      url: string,
      data?: unknown,
    ) => {
      const sanitized = sanitize(data) as Record<string, unknown> | null;
      pinoLogger.info(
        { ...(sanitized || {}), component, requestId },
        `${method} ${url}`,
      );
    },
    response: (
      requestId: string,
      status: number,
      duration?: number,
      data?: unknown,
    ) => {
      const sanitized = sanitize(data) as Record<string, unknown> | null;
      const level = status >= 400 ? "error" : status >= 300 ? "warn" : "info";
      pinoLogger[level](
        { ...(sanitized || {}), component, requestId },
        `Response ${status}${duration ? ` (${duration}ms)` : ""}`,
      );
    },
    performance: (operation: string, duration: number, data?: unknown) => {
      const sanitized = sanitize(data) as Record<string, unknown> | null;
      pinoLogger.debug(
        { ...(sanitized || {}), component: `perf:${component}` },
        `${operation} completed in ${duration}ms`,
      );
    },
  }),
};

// Sensitive data redaction
const SENSITIVE_KEYS = [
  "password",
  "token",
  "authorization",
  "cookie",
  "apiKey",
  "api_key",
  "secret",
  "refresh_token",
  "access_token",
];

export function sanitize(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (
      SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))
    ) {
      sanitized[key] = "***REDACTED***";
    } else if (typeof value === "object") {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// Convenience export - `log` is an alias for `logger` for files converted from console.*
export const log = logger;

// Default export for compatibility
export default logger;
