/**
 * Comprehensive Edge Case Test Suite for Transformation Layer
 *
 * Tests various edge cases, error conditions, and fallback behaviors
 * in the enhanced transformation utilities.
 */

import {
  createTransformationError,
  debugTransformation,
  transformFormDataToBackendEnhanced,
  transformTopicForSavingEnhanced,
  transformTopicsForSavingEnhanced,
} from "@/lib/transformation-utils";

describe("Edge Cases and Error Handling", () => {
  describe("Null and Undefined Input Handling", () => {
    it("should handle null input with error by default", () => {
      const result = transformTopicForSavingEnhanced(null);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe("validation");
      expect(result.error?.message).toContain("cannot be null or undefined");
      expect(result.error?.severity).toBe("high");
      expect(result.error?.expectedType).toBe("object");
      expect(result.error?.actualType).toBe("object");
    });

    it("should handle undefined input with error by default", () => {
      const result = transformTopicForSavingEnhanced(undefined);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe("validation");
      expect(result.error?.message).toContain("cannot be null or undefined");
      expect(result.error?.severity).toBe("high");
    });

    it("should handle null input with lenient fallback", () => {
      const result = transformTopicForSavingEnhanced(null, {
        handleNullInput: "return_empty",
        fallbackBehavior: "lenient",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("Circular Reference Handling", () => {
    it("should detect circular references", () => {
      const circularObj = { title: "Test Topic" } as Record<string, unknown>;
      circularObj.self = circularObj;

      const result = transformTopicForSavingEnhanced(circularObj);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe("circular_reference");
      expect(result.error?.message).toContain("circular references");
      expect(result.error?.severity).toBe("high");
    });

    it("should handle circular references with serialize option", () => {
      const circularObj = { title: "Test Topic" } as Record<string, unknown>;
      circularObj.self = circularObj;

      const result = transformTopicForSavingEnhanced(circularObj, {
        handleCircularRefs: "serialize",
      });

      // Should still fail validation but not due to circular reference
      expect(result.success).toBe(false);
      expect(result.error?.type).not.toBe("circular_reference");
    });
  });

  describe("Size Limit Handling", () => {
    it("should handle oversized input", () => {
      const oversizedInput = {
        title: "Test".repeat(10000),
        description: "Long description".repeat(10000),
      };

      const result = transformTopicForSavingEnhanced(oversizedInput, {
        maxInputSize: 1000,
      });

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe("size_limit_exceeded");
      expect(result.error?.context?.inputSize).toBeGreaterThan(1000);
      expect(result.error?.context?.maxSize).toBe(1000);
    });

    it("should handle oversized input with truncate option", () => {
      const oversizedInput = {
        title: "Test".repeat(1000),
        description: "Long description".repeat(1000),
      };

      const result = transformTopicForSavingEnhanced(oversizedInput, {
        maxInputSize: 5000,
        handleOversizedInput: "truncate",
      });

      // Will likely still fail validation but not due to size
      expect(result.error?.type).not.toBe("size_limit_exceeded");
    });
  });

  describe("Error Classification", () => {
    it("should classify missing field errors correctly", () => {
      const incompleteInput = {
        title: "Test Topic",
        // Missing required fields
      };

      const result = transformTopicForSavingEnhanced(incompleteInput);

      expect(result.success).toBe(false);
      expect(
        ["field_required", "validation", "type_mismatch"].includes(
          result.error?.type || "",
        ),
      ).toBe(true);
      expect(result.error?.expectedType).toBe("GeneratedTopic");
    });

    it("should classify type mismatch errors correctly", () => {
      const invalidTypeInput = {
        title: "Test Topic",
        angle: 123, // Should be string
        scores: "invalid", // Should be object
      };

      const result = transformTopicForSavingEnhanced(invalidTypeInput);

      expect(result.success).toBe(false);
      expect(
        ["type_mismatch", "validation"].includes(result.error?.type || ""),
      ).toBe(true);
    });
  });

  describe("Fallback Behaviors", () => {
    const partialValidInput = {
      id: "test-1",
      title: "Test Topic",
      angle: "Test angle",
      description: "Test description",
      scores: {
        relevance: 85,
        freshness: 90,
        novelty: 75,
      },
      channel_fit: ["blog"],
      audience_fit: ["general-audience"],
      why_it_works: "It works",
      tags: ["test"],
      generated_at: new Date().toISOString(),
      metadata: {
        generation_params: {},
        model_used: "test",
        confidence: 0.8,
      },
    };

    it("should use strict mode by default", () => {
      const invalidInput = { title: "Test" };

      const result = transformTopicForSavingEnhanced(invalidInput, {
        fallbackBehavior: "strict",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should use lenient mode for recoverable errors", () => {
      // This would need a more complex test case where base transformation fails
      // but recovery is possible
      const result = transformTopicForSavingEnhanced(partialValidInput, {
        fallbackBehavior: "lenient",
        autoFix: true,
      });

      expect(result.success).toBe(true);
    });

    it("should skip processing with skip fallback", () => {
      const invalidInput = { title: "Test" };

      const result = transformTopicForSavingEnhanced(invalidInput, {
        fallbackBehavior: "skip",
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain("skipped");
    });
  });

  describe("Enhanced Error Context", () => {
    it("should include detailed error context", () => {
      const result = transformTopicForSavingEnhanced(null, {
        enableDetailedErrors: true,
      });

      expect(result.error?.context).toBeDefined();
      expect(result.error?.timestamp).toBeDefined();
      expect(result.error?.severity).toBeDefined();
      expect(result.error?.expectedType).toBeDefined();
      expect(result.error?.actualType).toBeDefined();
    });

    it("should provide context-specific recovery actions", () => {
      const invalidInput = {
        title: 123, // Wrong type
        scores: "invalid", // Wrong type
      };

      const result = transformTopicForSavingEnhanced(invalidInput);

      expect(result.error?.recoveryActions).toBeDefined();
      expect(result.error?.recoveryActions.length).toBeGreaterThan(0);
      expect(
        result.error?.recoveryActions.some((action) =>
          action.toLowerCase().includes("type"),
        ),
      ).toBe(true);
    });
  });

  describe("Memory and Performance Edge Cases", () => {
    it("should handle deeply nested objects", () => {
      const deeplyNested = { title: "Test" } as Record<string, unknown>;
      let current = deeplyNested;

      // Create deep nesting (but not circular)
      for (let i = 0; i < 100; i++) {
        const nested = { level: i } as Record<string, unknown>;
        current.nested = nested;
        current = nested;
      }

      const result = transformTopicForSavingEnhanced(deeplyNested);

      expect(result.success).toBe(false);
      // Should not crash or timeout
      expect(result.error).toBeDefined();
    });

    it("should include performance metrics when requested", () => {
      const validInput = {
        id: "test-1",
        title: "Test Topic",
        angle: "Test angle",
        description: "Test description",
        scores: {
          relevance: 85,
          freshness: 90,
          novelty: 75,
        },
        channel_fit: ["blog"],
        audience_fit: ["general-audience"],
        why_it_works: "It works",
        tags: ["test"],
        generated_at: new Date().toISOString(),
        metadata: {
          generation_params: {},
          model_used: "test",
          confidence: 0.8,
        },
      };

      const result = transformTopicForSavingEnhanced(validInput, {
        includeMetrics: true,
        autoFix: true,
      });

      expect(result.metrics).toBeDefined();
      expect(result.metrics?.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.metrics?.inputSize).toBeGreaterThan(0);
    });
  });

  describe("Batch Processing Edge Cases", () => {
    it("should handle empty arrays", async () => {
      const result = await transformTopicsForSavingEnhanced([], {
        includeMetrics: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(result.metrics?.successCount).toBe(0);
      expect(result.metrics?.errorCount).toBe(0);
    });

    it("should handle all invalid inputs", async () => {
      const invalidInputs = [null, undefined, { invalid: true }];

      const result = await transformTopicsForSavingEnhanced(invalidInputs, {
        continueOnError: true,
        includeMetrics: true,
      });

      expect(result.success).toBe(false);
      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(3);
      expect(result.metrics?.errorCount).toBe(3);
    });

    it("should stop on first error when continueOnError is false", async () => {
      const mixedInputs = [null, { title: "Valid" }, { title: "Also Valid" }];

      const result = await transformTopicsForSavingEnhanced(mixedInputs, {
        continueOnError: false,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.data).toHaveLength(0);
    });
  });

  describe("Form Data Edge Cases", () => {
    it("should handle malformed form data", () => {
      const malformedData = {
        industry: 123, // Should be string
        content_type: ["array"], // Should be string
        num_ideas: "five", // Should be number
      };

      const result = transformFormDataToBackendEnhanced(malformedData);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe("validation");
    });

    it("should handle missing required form fields", () => {
      const incompleteData = {
        wizardMode: "industry-first",
        // Missing other required fields
      };

      const result = transformFormDataToBackendEnhanced(incompleteData, {
        validateRequired: true,
      });

      expect(result.success).toBe(false);
      expect(
        ["missing_field", "field_required", "validation"].includes(
          result.error?.type || "",
        ),
      ).toBe(true);
    });

    it("should apply field normalization", () => {
      const messyData = {
        wizardMode: "industry-first" as const,
        industry: "  technology  ", // Extra whitespace
        content_type: "blog-post" as const,
        purpose: ["educate-inform"],
        tone: ["professional-formal"],
        num_ideas: 5,
        audience: ["  developers  ", "developers", "students  "], // Duplicates & whitespace
      };

      const result = transformFormDataToBackendEnhanced(messyData, {
        normalizeFields: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.industry).toBe("technology");
    });
  });

  describe("Error Creation and Debugging", () => {
    it("should create well-formed transformation errors", () => {
      const error = createTransformationError(
        "type_mismatch",
        "Test error message",
        { test: "data" },
        {
          fieldPath: "test.field",
          expectedType: "string",
          actualType: "number",
          constraints: ["min length: 5"],
          severity: "medium",
        },
      );

      expect(error.type).toBe("type_mismatch");
      expect(error.message).toBe("Test error message");
      expect(error.fieldPath).toBe("test.field");
      expect(error.expectedType).toBe("string");
      expect(error.actualType).toBe("number");
      expect(error.severity).toBe("medium");
      expect(error.timestamp).toBeDefined();
      expect(error.isRecoverable).toBe(true);
      expect(error.recoveryActions).toBeDefined();
      expect(error.recoveryActions.length).toBeGreaterThan(0);
    });

    it("should determine error severity correctly", () => {
      const criticalError = createTransformationError(
        "memory_limit_exceeded",
        "Test",
      );
      const highError = createTransformationError("field_required", "Test");
      const lowError = createTransformationError("network_timeout", "Test");

      expect(criticalError.severity).toBe("critical");
      expect(highError.severity).toBe("high");
      expect(lowError.severity).toBe("low");
    });

    it("should debug transformation results", () => {
      const consoleSpy = jest.spyOn(console, "group").mockImplementation();
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      const consoleEndSpy = jest
        .spyOn(console, "groupEnd")
        .mockImplementation();

      const mockResult = {
        success: false,
        error: createTransformationError("validation", "Test error"),
      };

      debugTransformation({ test: "input" }, mockResult);

      expect(consoleSpy).toHaveBeenCalledWith("🔧 Transformation Debug");
      expect(consoleLogSpy).toHaveBeenCalledWith("✅ Success:", false);
      expect(consoleEndSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleEndSpy.mockRestore();
    });
  });

  describe("Complex Validation Scenarios", () => {
    it("should handle mixed validation errors", () => {
      const complexInvalidInput = {
        title: 123, // Type error
        angle: "", // Empty string
        scores: {
          relevance: 150, // Out of range
          freshness: -10, // Out of range
          novelty: "high", // Type error
        },
        channel_fit: [], // Empty array
        audience_fit: null, // Null value
        tags: undefined, // Undefined value
      };

      const result = transformTopicForSavingEnhanced(complexInvalidInput);

      expect(result.success).toBe(false);
      expect(result.error?.validationIssues).toBeDefined();
      expect(result.error?.validationIssues?.length).toBeGreaterThan(0);
    });

    it("should validate with auto-fix enabled", () => {
      const fixableInput = {
        id: "test-1",
        title: "Test Topic",
        angle: "Test angle",
        description: "Test description",
        scores: {
          relevance: 150, // Will be clamped to 100
          freshness: -10, // Will be clamped to 0
          novelty: 75,
        },
        channel_fit: [], // Will be filled with defaults
        audience_fit: [], // Will be filled with defaults
        why_it_works: "  It works  ", // Will be trimmed
        tags: [], // Will be filled with defaults
        generated_at: new Date().toISOString(),
        metadata: {
          generation_params: {},
          model_used: "test",
          confidence: 0.8,
        },
      };

      const result = transformTopicForSavingEnhanced(fixableInput, {
        autoFix: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.scores.relevance).toBeLessThanOrEqual(100);
      expect(result.data?.scores.freshness).toBeGreaterThanOrEqual(0);
      expect(result.data?.channel_fit.length).toBeGreaterThan(0);
      expect(result.data?.audience_fit.length).toBeGreaterThan(0);
      expect(result.data?.tags.length).toBeGreaterThan(0);
    });
  });
});
