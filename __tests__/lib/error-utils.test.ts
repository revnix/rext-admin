/**
 * Tests for Error Utils
 */

import {
  calculateRetryDelay,
  classifyError,
  DEFAULT_RETRY_CONFIG,
  generateRequestId,
  getContextualErrorMessage,
  getFallbackBehavior,
  isBackendUnavailable,
  isOnline,
  sanitizeErrorForLogging,
  shouldRetry,
} from "@/lib/error-utils";
import type { BackendError, BackendErrorType } from "@/types/backend";

describe("Error Utils", () => {
  describe("classifyError", () => {
    it("should classify network errors correctly", () => {
      const networkError = new Error("Failed to fetch");
      const classified = classifyError(networkError, "test-req-1", 1);

      expect(classified.type).toBe("network_error");
      expect(classified.isRetryable).toBe(true);
      expect(classified.severity).toBe("high");
      expect(classified.recoveryActions).toContain("retry");
      expect(classified.recoveryActions).toContain("check_connection");
      expect(classified.requestId).toBe("test-req-1");
      expect(classified.retryAttempt).toBe(1);
    });

    it("should classify timeout errors correctly", () => {
      const timeoutError = new Error("TimeoutError");
      timeoutError.name = "TimeoutError";
      const classified = classifyError(timeoutError);

      expect(classified.type).toBe("timeout_error");
      expect(classified.isRetryable).toBe(true);
      expect(classified.severity).toBe("medium");
      expect(classified.recoveryActions).toContain("retry");
    });

    it("should classify abort errors correctly", () => {
      const abortError = new Error("Request aborted");
      abortError.name = "AbortError";
      const classified = classifyError(abortError);

      expect(classified.type).toBe("abort_error");
      expect(classified.severity).toBe("low");
      expect(classified.recoveryActions).toContain("retry");
    });

    it("should classify backend API errors by status code", () => {
      const testCases = [
        {
          message: "Backend API error: 400 Bad Request",
          expectedType: "validation_error",
        },
        {
          message: "Backend API error: 401 Unauthorized",
          expectedType: "authentication_error",
        },
        {
          message: "Backend API error: 403 Forbidden",
          expectedType: "authentication_error",
        },
        {
          message: "Backend API error: 429 Too Many Requests",
          expectedType: "rate_limit_error",
        },
        {
          message: "Backend API error: 500 Internal Server Error",
          expectedType: "server_error",
        },
        {
          message: "Backend API error: 502 Bad Gateway",
          expectedType: "server_error",
        },
        {
          message: "Backend API error: 503 Service Unavailable",
          expectedType: "server_error",
        },
      ];

      testCases.forEach(({ message, expectedType }) => {
        const error = new Error(message);
        const classified = classifyError(error);
        expect(classified.type).toBe(expectedType);
      });
    });

    it("should classify configuration errors correctly", () => {
      const configError = new Error("Backend API URL is not configured");
      const classified = classifyError(configError);

      expect(classified.type).toBe("configuration_error");
      expect(classified.severity).toBe("critical");
      expect(classified.isRetryable).toBe(false);
      expect(classified.recoveryActions).toContain("contact_support");
    });

    it("should classify parsing errors correctly", () => {
      const parseError = new Error("Invalid response format from backend");
      const classified = classifyError(parseError);

      expect(classified.type).toBe("parsing_error");
      expect(classified.severity).toBe("medium");
      expect(classified.recoveryActions).toContain("retry");
    });

    it("should classify CORS errors correctly", () => {
      const corsError = new Error("CORS policy blocked the request");
      const classified = classifyError(corsError);

      expect(classified.type).toBe("cors_error");
      expect(classified.severity).toBe("critical");
      expect(classified.isRetryable).toBe(false);
    });

    it("should handle non-Error objects", () => {
      const stringError = "Something went wrong";
      const classified = classifyError(stringError);

      expect(classified.type).toBe("unknown_error");
      expect(classified.technicalMessage).toBe(stringError);
      expect(classified.isRetryable).toBe(false);
    });

    it("should include timestamp in classified errors", () => {
      const error = new Error("Test error");
      const classified = classifyError(error);

      expect(classified.timestamp).toBeDefined();
      expect(new Date(classified.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe("calculateRetryDelay", () => {
    it("should calculate exponential backoff delay", () => {
      const config = DEFAULT_RETRY_CONFIG;

      const delay1 = calculateRetryDelay(1, config);
      const delay2 = calculateRetryDelay(2, config);
      const delay3 = calculateRetryDelay(3, config);

      expect(delay1).toBeGreaterThanOrEqual(config.initialDelay * 0.9); // Account for jitter
      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });

    it("should respect maximum delay cap", () => {
      const config = { ...DEFAULT_RETRY_CONFIG, maxDelay: 5000 };

      const longDelay = calculateRetryDelay(10, config);
      expect(longDelay).toBeLessThanOrEqual(config.maxDelay * 1.1); // Account for jitter
    });

    it("should add jitter to prevent thundering herd", () => {
      const config = DEFAULT_RETRY_CONFIG;
      const delays = [];

      // Generate multiple delays for the same attempt
      for (let i = 0; i < 10; i++) {
        delays.push(calculateRetryDelay(2, config));
      }

      // All delays should be different due to jitter
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });

    it("should work with custom retry configuration", () => {
      const customConfig = {
        ...DEFAULT_RETRY_CONFIG,
        initialDelay: 500,
        backoffMultiplier: 3,
        jitterFactor: 0.2,
      };

      const delay = calculateRetryDelay(2, customConfig);
      expect(delay).toBeGreaterThanOrEqual(500 * 3 * 0.8); // Min with jitter
      expect(delay).toBeLessThanOrEqual(500 * 3 * 1.2); // Max with jitter
    });
  });

  describe("shouldRetry", () => {
    const retryableError: BackendError = {
      type: "network_error",
      message: "Network error",
      isRetryable: true,
      severity: "high",
      recoveryActions: ["retry"],
      timestamp: new Date().toISOString(),
    };

    const nonRetryableError: BackendError = {
      type: "configuration_error",
      message: "Config error",
      isRetryable: false,
      severity: "critical",
      recoveryActions: ["contact_support"],
      timestamp: new Date().toISOString(),
    };

    it("should allow retry for retryable errors within limit", () => {
      const config = { ...DEFAULT_RETRY_CONFIG, maxAttempts: 3 };

      expect(shouldRetry(retryableError, 1, config)).toBe(true);
      expect(shouldRetry(retryableError, 2, config)).toBe(true);
      expect(shouldRetry(retryableError, 3, config)).toBe(true);
    });

    it("should not retry beyond max attempts", () => {
      const config = { ...DEFAULT_RETRY_CONFIG, maxAttempts: 2 };

      expect(shouldRetry(retryableError, 3, config)).toBe(false);
      expect(shouldRetry(retryableError, 4, config)).toBe(false);
    });

    it("should not retry non-retryable errors", () => {
      const config = DEFAULT_RETRY_CONFIG;

      expect(shouldRetry(nonRetryableError, 1, config)).toBe(false);
      expect(shouldRetry(nonRetryableError, 2, config)).toBe(false);
    });

    it("should respect retryable error types configuration", () => {
      const config = {
        ...DEFAULT_RETRY_CONFIG,
        retryableErrors: ["timeout_error"] as BackendErrorType[],
      };

      const timeoutError: BackendError = {
        ...retryableError,
        type: "timeout_error",
      };

      expect(shouldRetry(timeoutError, 1, config)).toBe(true);
      expect(shouldRetry(retryableError, 1, config)).toBe(false); // network_error not in config
    });
  });

  describe("sanitizeErrorForLogging", () => {
    it("should remove sensitive information from context", () => {
      const errorWithSensitiveData: BackendError = {
        type: "network_error",
        message: "Network error",
        isRetryable: true,
        severity: "high",
        recoveryActions: ["retry"],
        timestamp: new Date().toISOString(),
        context: {
          password: "secret123",
          apiKey: "sk-secret",
          token: "bearer-token",
          userSecret: "private-key",
          publicData: "safe-data",
          userId: "123",
        },
        originalError: new Error("Original error with stack"),
      };

      const sanitized = sanitizeErrorForLogging(errorWithSensitiveData);

      expect(sanitized.sanitizedContext?.password).toBe("[REDACTED]");
      expect(sanitized.sanitizedContext?.apiKey).toBe("[REDACTED]");
      expect(sanitized.sanitizedContext?.token).toBe("[REDACTED]");
      expect(sanitized.sanitizedContext?.userSecret).toBe("[REDACTED]");
      expect(sanitized.sanitizedContext?.publicData).toBe("safe-data");
      expect(sanitized.sanitizedContext?.userId).toBe("123");
      expect(sanitized.stackTrace).toBeDefined();
      expect("originalError" in sanitized).toBe(false);
    });

    it("should handle errors without context", () => {
      const simpleError: BackendError = {
        type: "timeout_error",
        message: "Timeout",
        isRetryable: true,
        severity: "medium",
        recoveryActions: ["retry"],
        timestamp: new Date().toISOString(),
      };

      const sanitized = sanitizeErrorForLogging(simpleError);

      expect(sanitized.sanitizedContext).toBeUndefined();
      expect(sanitized.type).toBe("timeout_error");
      expect(sanitized.message).toBe("Timeout");
    });
  });

  describe("generateRequestId", () => {
    it("should generate unique request IDs", () => {
      const ids = [];
      for (let i = 0; i < 100; i++) {
        ids.push(generateRequestId());
      }

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100); // All should be unique
    });

    it("should follow expected format", () => {
      const id = generateRequestId();
      expect(id).toMatch(/^req_\d+_[a-z0-9]+$/);
    });
  });

  describe("isOnline", () => {
    it("should return true when navigator is available and online", () => {
      Object.defineProperty(window.navigator, "onLine", {
        writable: true,
        value: true,
      });

      expect(isOnline()).toBe(true);
    });

    it("should return true when navigator is not available (SSR)", () => {
      const originalNavigator = window.navigator;
      delete (window as unknown as { navigator: undefined }).navigator;

      expect(isOnline()).toBe(true);

      (window as unknown as { navigator: typeof navigator }).navigator =
        originalNavigator;
    });
  });

  describe("getContextualErrorMessage", () => {
    const timeoutError: BackendError = {
      type: "timeout_error",
      message: "Request timed out",
      isRetryable: true,
      severity: "medium",
      recoveryActions: ["retry"],
      timestamp: new Date().toISOString(),
    };

    const serverError: BackendError = {
      type: "server_error",
      message: "Server error",
      isRetryable: true,
      severity: "high",
      recoveryActions: ["retry"],
      timestamp: new Date().toISOString(),
    };

    it("should provide context-specific messages for topic generation", () => {
      const timeoutMessage = getContextualErrorMessage(
        timeoutError,
        "topic_generation",
      );
      expect(timeoutMessage).toContain("Topic generation is taking longer");

      const serverMessage = getContextualErrorMessage(
        serverError,
        "topic_generation",
      );
      expect(serverMessage).toContain("AI service is temporarily unavailable");
    });

    it("should provide context-specific messages for form validation", () => {
      const validationError: BackendError = {
        type: "validation_error",
        message: "Validation failed",
        isRetryable: false,
        severity: "low",
        recoveryActions: ["go_back"],
        timestamp: new Date().toISOString(),
      };

      const message = getContextualErrorMessage(
        validationError,
        "form_validation",
      );
      expect(message).toContain("review your form entries");
    });

    it("should provide context-specific messages for data saving", () => {
      const networkError: BackendError = {
        type: "network_error",
        message: "Network error",
        isRetryable: true,
        severity: "high",
        recoveryActions: ["retry"],
        timestamp: new Date().toISOString(),
      };

      const message = getContextualErrorMessage(networkError, "data_save");
      expect(message).toContain("Unable to save your data");
    });

    it("should fallback to base message for unmapped scenarios", () => {
      const unmappedError: BackendError = {
        type: "cors_error",
        message: "CORS error",
        isRetryable: false,
        severity: "critical",
        recoveryActions: ["contact_support"],
        timestamp: new Date().toISOString(),
      };

      const message = getContextualErrorMessage(
        unmappedError,
        "topic_generation",
      );
      expect(message).toBe("CORS error");
    });
  });

  describe("isBackendUnavailable", () => {
    it("should detect network unavailability", () => {
      const networkError: BackendError = {
        type: "network_error",
        message: "Network error",
        isRetryable: true,
        severity: "high",
        recoveryActions: ["retry"],
        timestamp: new Date().toISOString(),
      };

      expect(isBackendUnavailable(networkError)).toBe(true);
    });

    it("should detect configuration issues", () => {
      const configError: BackendError = {
        type: "configuration_error",
        message: "Config error",
        isRetryable: false,
        severity: "critical",
        recoveryActions: ["contact_support"],
        timestamp: new Date().toISOString(),
      };

      expect(isBackendUnavailable(configError)).toBe(true);
    });

    it("should detect service unavailable", () => {
      const serverError: BackendError = {
        type: "server_error",
        message: "Server error",
        statusCode: 503,
        isRetryable: true,
        severity: "high",
        recoveryActions: ["retry"],
        timestamp: new Date().toISOString(),
      };

      expect(isBackendUnavailable(serverError)).toBe(true);
    });

    it("should not flag recoverable server errors as unavailable", () => {
      const recoverableError: BackendError = {
        type: "server_error",
        message: "Server error",
        statusCode: 500,
        isRetryable: true,
        severity: "high",
        recoveryActions: ["retry"],
        timestamp: new Date().toISOString(),
      };

      expect(isBackendUnavailable(recoverableError)).toBe(false);
    });

    it("should not flag client errors as unavailable", () => {
      const clientError: BackendError = {
        type: "validation_error",
        message: "Validation error",
        isRetryable: false,
        severity: "low",
        recoveryActions: ["go_back"],
        timestamp: new Date().toISOString(),
      };

      expect(isBackendUnavailable(clientError)).toBe(false);
    });
  });

  describe("getFallbackBehavior", () => {
    it("should provide appropriate fallback for topic generation", () => {
      const fallback = getFallbackBehavior("topic_generation");

      expect(fallback.enableOfflineMode).toBe(false);
      expect(fallback.showCachedData).toBe(false);
      expect(fallback.allowRetry).toBe(true);
      expect(fallback.message).toContain("requires an active connection");
    });

    it("should provide default fallback for unknown operations", () => {
      const fallback = getFallbackBehavior("unknown_operation");

      expect(fallback.enableOfflineMode).toBe(false);
      expect(fallback.showCachedData).toBe(false);
      expect(fallback.allowRetry).toBe(true);
      expect(fallback.message).toContain("requires an active connection");
    });
  });

  describe("DEFAULT_RETRY_CONFIG", () => {
    it("should have sensible default values", () => {
      expect(DEFAULT_RETRY_CONFIG.maxAttempts).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.initialDelay).toBe(1000);
      expect(DEFAULT_RETRY_CONFIG.maxDelay).toBe(30000);
      expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBe(2);
      expect(DEFAULT_RETRY_CONFIG.jitterFactor).toBe(0.1);

      expect(DEFAULT_RETRY_CONFIG.retryableErrors).toContain("network_error");
      expect(DEFAULT_RETRY_CONFIG.retryableErrors).toContain("timeout_error");
      expect(DEFAULT_RETRY_CONFIG.retryableErrors).toContain("server_error");
      expect(DEFAULT_RETRY_CONFIG.retryableErrors).not.toContain(
        "configuration_error",
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle malformed error objects gracefully", () => {
      const malformedError = { someProperty: "value" };
      const classified = classifyError(malformedError);

      expect(classified.type).toBe("unknown_error");
      expect(classified.technicalMessage).toBe(
        '{\n  "someProperty": "value"\n}',
      );
      expect(classified.isRetryable).toBe(false);
    });

    it("should handle null and undefined errors", () => {
      const nullError = classifyError(null);
      const undefinedError = classifyError(undefined);

      expect(nullError.type).toBe("unknown_error");
      expect(undefinedError.type).toBe("unknown_error");
    });

    it("should calculate delay with zero jitter factor", () => {
      const config = { ...DEFAULT_RETRY_CONFIG, jitterFactor: 0 };
      const delay1 = calculateRetryDelay(1, config);
      const delay2 = calculateRetryDelay(1, config);

      expect(delay1).toBe(delay2); // Should be identical with no jitter
    });

    it("should handle extreme retry attempt numbers", () => {
      const config = DEFAULT_RETRY_CONFIG;

      const delay = calculateRetryDelay(100, config);
      expect(delay).toBeLessThanOrEqual(config.maxDelay * 1.1); // Should be capped
      expect(delay).toBeGreaterThan(0);
    });
  });
});
