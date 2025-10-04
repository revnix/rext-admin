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
const serverLogger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  formatters: {
    level: (label) => ({ level: label }),
  },
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
        },
      }
    : undefined,
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
    const mergedData =
      args.length > 0 ? { ...sanitize(data), args } : sanitize(data) || {};
    pinoLogger.debug(mergedData, message);
  },
  info: (message: string, data?: unknown, ...args: unknown[]) => {
    const mergedData =
      args.length > 0 ? { ...sanitize(data), args } : sanitize(data) || {};
    pinoLogger.info(mergedData, message);
  },
  warn: (message: string, data?: unknown, ...args: unknown[]) => {
    const mergedData =
      args.length > 0 ? { ...sanitize(data), args } : sanitize(data) || {};
    pinoLogger.warn(mergedData, message);
  },
  error: (
    message: string,
    error?: Error | unknown,
    data?: unknown,
    ...args: unknown[]
  ) => {
    const mergedData =
      args.length > 0 ? { ...sanitize(data), args } : sanitize(data) || {};
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
      pinoLogger.debug({ ...sanitize(data), component }, message);
    },
    info: (message: string, data?: unknown) => {
      pinoLogger.info({ ...sanitize(data), component }, message);
    },
    warn: (message: string, data?: unknown) => {
      pinoLogger.warn({ ...sanitize(data), component }, message);
    },
    error: (message: string, error?: Error | unknown, data?: unknown) => {
      pinoLogger.error(
        {
          ...sanitize(data),
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
      pinoLogger.info(
        { ...sanitize(data), component, requestId },
        `${method} ${url}`,
      );
    },
    response: (
      requestId: string,
      status: number,
      duration?: number,
      data?: unknown,
    ) => {
      const level = status >= 400 ? "error" : status >= 300 ? "warn" : "info";
      pinoLogger[level](
        { ...sanitize(data), component, requestId },
        `Response ${status}${duration ? ` (${duration}ms)` : ""}`,
      );
    },
    performance: (operation: string, duration: number, data?: unknown) => {
      pinoLogger.debug(
        { ...sanitize(data), component: `perf:${component}` },
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

// biome-ignore lint/suspicious/noExplicitAny: Required for dynamic object sanitization
export function sanitize(obj: any): any {
  if (typeof obj !== "object" || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  // biome-ignore lint/suspicious/noExplicitAny: Dynamic object construction
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
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
