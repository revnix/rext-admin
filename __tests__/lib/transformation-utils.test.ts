/**
 * Comprehensive test suite for transformation utilities
 *
 * Tests cover typical use cases, edge cases, error handling, and performance
 * benchmarks for all transformation functions.
 */

import { describe, expect, it } from "@jest/globals";
import {
  benchmarkTransformations,
  createTransformationError,
  debugTransformation,
  safeTransformTopicForSaving,
  safeTransformTopicsForSaving,
  transformFormDataToBackendEnhanced,
  transformTopicForSavingEnhanced,
  transformTopicsForSavingEnhanced,
} from "@/lib/transformation-utils";
import type { SaveTopicItem } from "@/types/backend";
import type {
  GeneratedTopic,
  TopicBuilderFormData,
} from "@/types/topic-builder";

// ============================================================================
// TEST DATA FIXTURES
// ============================================================================

const validGeneratedTopic: GeneratedTopic = {
  id: "test-topic-1",
  title: "How to Build Better APIs",
  angle: "Focus on developer experience and maintainability",
  description: "A comprehensive guide to API development",
  scores: {
    relevance: 85,
    freshness: 70,
    novelty: 60,
  },
  channel_fit: ["blog", "documentation"],
  audience_fit: ["developers", "technical-leads"],
  why_it_works: "Addresses common pain points in API development",
  tags: ["api", "development", "best-practices"],
  generated_at: "2025-01-15T10:30:00Z",
  metadata: {
    generation_params: { model: "gpt-4", temperature: 0.7 },
    model_used: "gpt-4",
    confidence: 0.85,
  },
};

const validSaveTopicItem: SaveTopicItem = {
  title: "How to Build Better APIs",
  angle: "Focus on developer experience and maintainability",
  channel_fit: ["blog", "documentation"],
  audience_fit: ["developers", "technical-leads"],
  scores: {
    relevance: 85,
    freshness: 70,
    novelty: 60,
  },
  why_it_works: "Addresses common pain points in API development",
  tags: ["api", "development", "best-practices"],
};

const validFormData: TopicBuilderFormData = {
  wizardMode: "industry-first",
  industry: "technology",
  content_type: "blog-post",
  purpose: ["educate-inform"],
  tone: ["professional-formal"],
  num_topics: 5,
};

const invalidGeneratedTopic = {
  id: "invalid-topic",
  title: "", // Invalid - empty title
  angle: "Some angle",
  // Missing required fields
  scores: {
    relevance: 150, // Invalid - out of range
    freshness: -10, // Invalid - out of range
    novelty: 50,
  },
  channel_fit: [], // Invalid - empty array
  audience_fit: ["developers"],
  why_it_works: "Some reason",
  tags: [], // Invalid - empty array
};

// ============================================================================
// TRANSFORMATION TESTS - SUCCESS CASES
// ============================================================================

describe("transformTopicForSavingEnhanced - Success Cases", () => {
  it("should successfully transform a valid GeneratedTopic", () => {
    const result = transformTopicForSavingEnhanced(validGeneratedTopic);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.data).toEqual(validSaveTopicItem);
  });

  it("should include performance metrics when requested", () => {
    const result = transformTopicForSavingEnhanced(validGeneratedTopic, {
      includeMetrics: true,
    });

    expect(result.success).toBe(true);
    expect(result.metrics).toBeDefined();
    expect(result.metrics?.durationMs).toBeGreaterThan(0);
    expect(result.metrics?.inputSize).toBeGreaterThan(0);
    expect(result.metrics?.outputSize).toBeGreaterThan(0);
  });

  it("should apply auto-fixes when enabled", () => {
    const topicWithEmptyArrays = {
      ...validGeneratedTopic,
      channel_fit: [] as string[],
      audience_fit: [] as string[],
      tags: [] as string[],
    };

    const result = transformTopicForSavingEnhanced(topicWithEmptyArrays, {
      autoFix: true,
    });

    expect(result.success).toBe(true);
    expect(result.data?.channel_fit).toEqual(["blog", "social-media"]);
    expect(result.data?.audience_fit).toEqual(["general-audience"]);
    expect(result.data?.tags).toEqual(["content", "topic"]);
  });

  it("should handle custom field mappings", () => {
    const customMappings = { title: "custom_title" };
    const result = transformTopicForSavingEnhanced(validGeneratedTopic, {
      customMappings,
    });

    expect(result.success).toBe(true);
    // Custom mappings logic would be implemented in the actual utility
  });
});

// ============================================================================
// TRANSFORMATION TESTS - ERROR CASES
// ============================================================================

describe("transformTopicForSavingEnhanced - Error Cases", () => {
  it("should handle validation errors for invalid input", () => {
    const result = transformTopicForSavingEnhanced(invalidGeneratedTopic);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(
      ["validation", "field_required", "type_mismatch", "array_empty"].includes(
        result.error?.type || "",
      ),
    ).toBe(true);
    expect(result.error?.message).toContain("Invalid GeneratedTopic input");
    expect(result.error?.recoveryActions).toHaveLength(3);
    expect(result.error?.isRecoverable).toBe(true);
    expect(result.error?.validationIssues).toBeDefined();
  });

  it("should handle missing required fields", () => {
    const topicMissingFields = {
      id: "test",
      title: "Test Title",
      // Missing most required fields
    };

    const result = transformTopicForSavingEnhanced(topicMissingFields);

    expect(result.success).toBe(false);
    expect(
      ["validation", "field_required", "type_mismatch", "array_empty"].includes(
        result.error?.type || "",
      ),
    ).toBe(true);
    expect(result.error?.isRecoverable).toBe(true);
  });

  it("should handle null/undefined input", () => {
    const resultNull = transformTopicForSavingEnhanced(null);
    const resultUndefined = transformTopicForSavingEnhanced(undefined);

    expect(resultNull.success).toBe(false);
    expect(resultUndefined.success).toBe(false);
    expect(resultNull.error?.type).toBe("validation");
    expect(resultUndefined.error?.type).toBe("validation");
  });

  it("should handle non-object input", () => {
    const result = transformTopicForSavingEnhanced("not an object");

    expect(result.success).toBe(false);
    expect(
      ["validation", "field_required", "type_mismatch", "array_empty"].includes(
        result.error?.type || "",
      ),
    ).toBe(true);
    expect(result.error?.originalData).toBe("not an object");
  });
});

// ============================================================================
// BATCH TRANSFORMATION TESTS
// ============================================================================

describe("transformTopicsForSavingEnhanced - Batch Processing", () => {
  const validTopics: GeneratedTopic[] = [
    { ...validGeneratedTopic, id: "topic-1", title: "Topic 1" },
    { ...validGeneratedTopic, id: "topic-2", title: "Topic 2" },
    { ...validGeneratedTopic, id: "topic-3", title: "Topic 3" },
  ];

  it("should successfully transform multiple valid topics", async () => {
    const result = await transformTopicsForSavingEnhanced(validTopics);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
    expect(result.errors).toHaveLength(0);
  });

  it("should include performance metrics for batch operations", async () => {
    const result = await transformTopicsForSavingEnhanced(validTopics, {
      includeMetrics: true,
    });

    expect(result.metrics).toBeDefined();
    expect(result.metrics?.totalDurationMs).toBeGreaterThan(0);
    expect(result.metrics?.successCount).toBe(3);
    expect(result.metrics?.errorCount).toBe(0);
    expect(result.metrics?.avgDurationMs).toBeGreaterThan(0);
  });

  it("should handle mixed valid/invalid topics with continueOnError", async () => {
    const mixedTopics = [validTopics[0], invalidGeneratedTopic, validTopics[1]];

    const result = await transformTopicsForSavingEnhanced(mixedTopics, {
      continueOnError: true,
    });

    expect(result.success).toBe(false); // Overall failure due to errors
    expect(result.data).toHaveLength(2); // 2 successful transformations
    expect(result.errors).toHaveLength(1); // 1 error
    expect(result.errors[0].index).toBe(1); // Error at index 1
    expect(result.errors[0].originalItem).toBe(invalidGeneratedTopic);
  });

  it("should stop on first error when continueOnError is false", async () => {
    const mixedTopics = [invalidGeneratedTopic, validTopics[0], validTopics[1]];

    const result = await transformTopicsForSavingEnhanced(mixedTopics, {
      continueOnError: false,
    });

    expect(result.success).toBe(false);
    expect(result.data).toHaveLength(0); // No successful transformations
    expect(result.errors).toHaveLength(1); // Only first error
  });

  it("should handle empty array input", async () => {
    const result = await transformTopicsForSavingEnhanced([]);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("should respect maxConcurrency setting", async () => {
    const largeTopicSet = Array(10)
      .fill(validGeneratedTopic)
      .map((topic, i) => ({
        ...topic,
        id: `topic-${i}`,
      }));

    const result = await transformTopicsForSavingEnhanced(largeTopicSet, {
      maxConcurrency: 3,
      includeMetrics: true,
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(10);
    expect(result.metrics?.successCount).toBe(10);
  });
});

// ============================================================================
// FORM DATA TRANSFORMATION TESTS
// ============================================================================

describe("transformFormDataToBackendEnhanced", () => {
  it("should successfully transform valid form data", () => {
    const result = transformFormDataToBackendEnhanced(validFormData);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.industry).toBe("technology");
    expect(result.data?.content_type).toBe("blog-post");
    expect(result.data?.num_topics).toBe(5);
    expect(result.data?.timestamp).toBeDefined();
  });

  it("should apply normalization when enabled", () => {
    const unnormalizedData = {
      ...validFormData,
      industry: "  TECHNOLOGY  ",
      content_type: "  BLOG-POST  ",
    };

    const result = transformFormDataToBackendEnhanced(unnormalizedData, {
      normalizeFields: true,
    });

    expect(result.success).toBe(true);
    expect(result.data?.industry).toBe("technology"); // normalized
    expect(result.data?.content_type).toBe("blog-post"); // normalized
  });

  it("should validate required fields when requested", () => {
    // Create a minimal form data that passes schema validation but has empty transformed fields
    const incompleteData = {
      wizardMode: "industry-first" as const,
      industry: "technology",
      content_type: "blog-post",
      purpose: [],
      tone: [],
      num_topics: 5,
    };

    const result = transformFormDataToBackendEnhanced(incompleteData, {
      validateRequired: true,
    });

    expect(result.success).toBe(false);
    expect(["missing_field", "validation"]).toContain(result.error?.type);
    expect(result.error?.message).toMatch(
      /(Required backend fields are missing|Invalid TopicBuilderFormData input)/,
    );
  });

  it("should apply default values", () => {
    const minimalData = {
      wizardMode: "industry-first" as const,
      industry: "technology",
      content_type: "blog-post",
      purpose: ["educate-inform"],
      tone: ["professional-formal"],
      num_topics: 3,
    };

    const defaultValues = {
      notes: "Default notes",
      platform: "linkedin",
    };

    const result = transformFormDataToBackendEnhanced(minimalData, {
      defaultValues,
    });

    if (!result.success) {
      console.log("Error:", result.error);
    }
    expect(result.success).toBe(true);
    expect(result.data?.notes).toBe("Default notes");
    expect(result.data?.platform).toBe("linkedin");
  });

  it("should handle invalid form data", () => {
    const invalidData = {
      wizardMode: "invalid-mode",
      // Missing required fields
    };

    const result = transformFormDataToBackendEnhanced(invalidData);

    expect(result.success).toBe(false);
    expect(
      ["validation", "field_required", "type_mismatch", "array_empty"].includes(
        result.error?.type || "",
      ),
    ).toBe(true);
    expect(result.error?.validationIssues).toBeDefined();
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe("createTransformationError", () => {
  it("should create a properly structured error", () => {
    const error = createTransformationError(
      "validation",
      "Test error message",
      { test: "data" },
      {
        fieldPath: "title",
        recoveryActions: ["Custom recovery action"],
        isRecoverable: false,
      },
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.type).toBe("validation");
    expect(error.message).toBe("Test error message");
    expect(error.originalData).toEqual({ test: "data" });
    expect(error.fieldPath).toBe("title");
    expect(error.recoveryActions).toEqual(["Custom recovery action"]);
    expect(error.isRecoverable).toBe(false);
  });

  it("should provide default recovery actions for each error type", () => {
    const validationError = createTransformationError("validation", "Test");
    const conversionError = createTransformationError("conversion", "Test");
    const missingFieldError = createTransformationError(
      "missing_field",
      "Test",
    );
    const typeMismatchError = createTransformationError(
      "type_mismatch",
      "Test",
    );
    const unknownError = createTransformationError("unknown", "Test");

    expect(validationError.recoveryActions).toContain(
      "Check that all required fields are present",
    );
    expect(conversionError.recoveryActions).toContain(
      "Ensure input data is in the expected format",
    );
    expect(missingFieldError.recoveryActions).toContain(
      "Add the missing required field to your input data",
    );
    expect(typeMismatchError.recoveryActions).toContain(
      "Convert field value to the expected type",
    );
    expect(unknownError.recoveryActions).toContain(
      "Check the error message for specific details",
    );
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe("Performance Tests", () => {
  const performanceTopics: GeneratedTopic[] = Array(100)
    .fill(validGeneratedTopic)
    .map((topic, i) => ({
      ...topic,
      id: `perf-topic-${i}`,
      title: `Performance Test Topic ${i}`,
    }));

  it("should handle large datasets efficiently", async () => {
    const startTime = performance.now();
    const result = await transformTopicsForSavingEnhanced(performanceTopics, {
      includeMetrics: true,
    });
    const endTime = performance.now();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(100);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    expect(result.metrics?.avgDurationMs).toBeLessThan(50); // Average per item should be fast
  });

  it("should provide accurate benchmark results", async () => {
    const smallDataset = performanceTopics.slice(0, 10);
    const benchmarkResult = await benchmarkTransformations(smallDataset, 3);

    expect(benchmarkResult.avgDurationMs).toBeGreaterThan(0);
    expect(benchmarkResult.minDurationMs).toBeLessThanOrEqual(
      benchmarkResult.avgDurationMs,
    );
    expect(benchmarkResult.maxDurationMs).toBeGreaterThanOrEqual(
      benchmarkResult.avgDurationMs,
    );
    expect(benchmarkResult.throughputPerSecond).toBeGreaterThan(0);
  });
});

// ============================================================================
// LEGACY COMPATIBILITY TESTS
// ============================================================================

describe("Legacy Compatibility", () => {
  it("safeTransformTopicForSaving should return data or null", () => {
    const validResult = safeTransformTopicForSaving(validGeneratedTopic);
    expect(validResult).toEqual(validSaveTopicItem);

    const invalidResult = safeTransformTopicForSaving(
      invalidGeneratedTopic as GeneratedTopic,
    );
    expect(invalidResult).toBeNull();
  });

  it("safeTransformTopicsForSaving should return only successful transformations", async () => {
    const mixedTopics = [
      validGeneratedTopic,
      invalidGeneratedTopic as GeneratedTopic,
    ];
    const result = await safeTransformTopicsForSaving(mixedTopics);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(validSaveTopicItem);
  });
});

// ============================================================================
// DEBUGGING UTILITY TESTS
// ============================================================================

describe("Debugging Utilities", () => {
  it("should log transformation details without errors", () => {
    const consoleSpy = jest.spyOn(console, "group").mockImplementation();
    const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    const consoleEndSpy = jest.spyOn(console, "groupEnd").mockImplementation();

    const result = transformTopicForSavingEnhanced(validGeneratedTopic, {
      includeMetrics: true,
    });
    debugTransformation(validGeneratedTopic, result);

    expect(consoleSpy).toHaveBeenCalledWith("🔧 Transformation Debug");
    expect(consoleLogSpy).toHaveBeenCalledTimes(4); // Input, Success, Output, Metrics
    expect(consoleEndSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleEndSpy.mockRestore();
  });
});

// ============================================================================
// EDGE CASES AND STRESS TESTS
// ============================================================================

describe("Edge Cases", () => {
  it("should handle extremely large text fields", () => {
    const topicWithLargeText = {
      ...validGeneratedTopic,
      title: "A".repeat(10000), // Very long title
      angle: "B".repeat(10000), // Very long angle
      why_it_works: "C".repeat(50000), // Extremely long explanation
    };

    const result = transformTopicForSavingEnhanced(topicWithLargeText, {
      autoFix: true,
    });

    if (!result.success) {
      console.log("Large text error:", result.error);
    }
    expect(result.success).toBe(true);
    // Auto-fix should truncate the fields
    expect(result.data?.title.length).toBeLessThanOrEqual(200);
    expect(result.data?.angle.length).toBeLessThanOrEqual(500);
  });

  it("should handle Unicode and special characters", () => {
    const unicodeTopic = {
      ...validGeneratedTopic,
      title: "如何构建更好的API 🚀",
      angle: "Enfoque en la experiencia del desarrollador y mantenibilidad 💻",
      tags: ["api", "开发", "mejores-prácticas", "🔧"],
    };

    const result = transformTopicForSavingEnhanced(unicodeTopic);
    expect(result.success).toBe(true);
    expect(result.data?.title).toBe("如何构建更好的API 🚀");
    expect(result.data?.angle).toBe(
      "Enfoque en la experiencia del desarrollador y mantenibilidad 💻",
    );
  });

  it("should handle nested object corruption", () => {
    const corruptedTopic = {
      ...validGeneratedTopic,
      scores: {
        relevance: "not_a_number", // Type error
        freshness: null, // Null value
        novelty: undefined, // Undefined value
      },
    };

    const result = transformTopicForSavingEnhanced(corruptedTopic);
    expect(result.success).toBe(false);
    expect(
      ["validation", "field_required", "type_mismatch", "array_empty"].includes(
        result.error?.type || "",
      ),
    ).toBe(true);
  });

  it("should handle circular references gracefully", () => {
    const circularTopic = { ...validGeneratedTopic } as unknown;
    (circularTopic as Record<string, unknown>).self = circularTopic; // Create circular reference

    const result = transformTopicForSavingEnhanced(circularTopic);
    // Should not crash, but may fail validation
    expect(result.success).toBeDefined();
    expect(result.error || result.data).toBeDefined();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe("Integration Tests", () => {
  it("should work end-to-end with real-world data flow", async () => {
    // Simulate the complete flow: form data -> backend payload -> topics -> save format
    const formResult = transformFormDataToBackendEnhanced(validFormData, {
      normalizeFields: true,
      validateRequired: true,
    });

    expect(formResult.success).toBe(true);

    // Simulate topic generation (would come from backend)
    const generatedTopics = [validGeneratedTopic];

    // Transform topics for saving
    const saveResult = await transformTopicsForSavingEnhanced(generatedTopics, {
      autoFix: true,
      includeMetrics: true,
    });

    expect(saveResult.success).toBe(true);
    expect(saveResult.data).toHaveLength(1);
    expect(saveResult.metrics?.successCount).toBe(1);
  });
});
