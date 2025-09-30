type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
  requestId?: string;
  context?: string;
  component?: string;
}

interface LogContext {
  requestId?: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isDebugEnabled = process.env.ENABLE_DEBUG_LOGS === "true";
  private globalContext: LogContext = {};

  setGlobalContext(context: LogContext) {
    this.globalContext = { ...this.globalContext, ...context };
  }

  clearGlobalContext() {
    this.globalContext = {};
  }

  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    context?: LogContext,
  ) {
    // Skip debug logs in production unless explicitly enabled
    if (!this.isDevelopment && level === "debug" && !this.isDebugEnabled)
      return;

    const mergedContext = { ...this.globalContext, ...context };
    const entry: LogEntry = {
      level,
      message,
      data: data ? { ...data, ...mergedContext } : mergedContext,
      timestamp: new Date().toISOString(),
      requestId: mergedContext.requestId as string,
      context: mergedContext.context as string,
      component: mergedContext.component as string,
    };

    if (this.isDevelopment) {
      // Colorful console logging for development
      const colors = {
        debug: "\x1b[36m", // cyan
        info: "\x1b[34m", // blue
        warn: "\x1b[33m", // yellow
        error: "\x1b[31m", // red
      };

      const contextPrefix = entry.component ? `[${entry.component}] ` : "";
      const requestPrefix = entry.requestId ? `{${entry.requestId}} ` : "";

      console.log(
        `${colors[level]}[${level.toUpperCase()}]\x1b[0m ${contextPrefix}${requestPrefix}${message}`,
        entry.data && Object.keys(entry.data).length > 0 ? entry.data : "",
      );
    } else {
      // Structured JSON logging for production
      console[level === "debug" ? "log" : level](JSON.stringify(entry));
    }
  }

  // Main logging methods
  debug(message: string, data?: Record<string, unknown>, context?: LogContext) {
    this.log("debug", message, data, context);
  }

  info(message: string, data?: Record<string, unknown>, context?: LogContext) {
    this.log("info", message, data, context);
  }

  warn(message: string, data?: Record<string, unknown>, context?: LogContext) {
    this.log("warn", message, data, context);
  }

  error(message: string, data?: Record<string, unknown>, context?: LogContext) {
    this.log("error", message, data, context);
  }

  // Convenience methods for common use cases
  request(
    requestId: string,
    method: string,
    url: string,
    data?: Record<string, unknown>,
  ) {
    this.info(`${method} ${url}`, data, { requestId, component: "http" });
  }

  response(
    requestId: string,
    status: number,
    duration?: number,
    data?: Record<string, unknown>,
  ) {
    const level = status >= 400 ? "error" : status >= 300 ? "warn" : "info";
    this.log(
      level,
      `Response ${status}${duration ? ` (${duration}ms)` : ""}`,
      data,
      { requestId, component: "http" },
    );
  }

  performance(
    component: string,
    operation: string,
    duration: number,
    data?: Record<string, unknown>,
  ) {
    this.debug(`${operation} completed in ${duration}ms`, data, {
      component: `perf:${component}`,
    });
  }

  validation(
    component: string,
    message: string,
    data?: Record<string, unknown>,
  ) {
    this.warn(`Validation: ${message}`, data, {
      component: `validation:${component}`,
    });
  }

  // Factory method for component-specific loggers
  forComponent(component: string) {
    return {
      debug: (message: string, data?: Record<string, unknown>) =>
        this.debug(message, data, { component }),
      info: (message: string, data?: Record<string, unknown>) =>
        this.info(message, data, { component }),
      warn: (message: string, data?: Record<string, unknown>) =>
        this.warn(message, data, { component }),
      error: (message: string, data?: Record<string, unknown>) =>
        this.error(message, data, { component }),
      request: (
        requestId: string,
        method: string,
        url: string,
        data?: Record<string, unknown>,
      ) => this.request(requestId, method, url, data),
      response: (
        requestId: string,
        status: number,
        duration?: number,
        data?: Record<string, unknown>,
      ) => this.response(requestId, status, duration, data),
      performance: (
        operation: string,
        duration: number,
        data?: Record<string, unknown>,
      ) => this.performance(component, operation, duration, data),
    };
  }
}

export const logger = new Logger();

// Legacy console replacements for gradual migration
export const createConsoleReplacements = (component?: string) => ({
  log: (message: string, ...args: unknown[]) => {
    logger.info(message, args.length > 0 ? { args } : undefined, { component });
  },
  error: (message: string, ...args: unknown[]) => {
    logger.error(message, args.length > 0 ? { args } : undefined, {
      component,
    });
  },
  warn: (message: string, ...args: unknown[]) => {
    logger.warn(message, args.length > 0 ? { args } : undefined, { component });
  },
  info: (message: string, ...args: unknown[]) => {
    logger.info(message, args.length > 0 ? { args } : undefined, { component });
  },
  debug: (message: string, ...args: unknown[]) => {
    logger.debug(message, args.length > 0 ? { args } : undefined, {
      component,
    });
  },
});
