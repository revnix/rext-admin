/**
 * Comprehensive Test Suite for Zod Validation Integration
 *
 * Tests the enhanced validation capabilities in the transformation layer,
 * focusing on field presence validation, type checking, and error handling.
 */

import {
  createTransformationError,
  transformFormDataToBackendEnhanced,
  transformTopicForSavingEnhanced,
  transformTopicsForSavingEnhanced,
} from "@/lib/transformation-utils";
import type { SaveTopicItem } from "@/types/api";
import {
  createValidationReport,
  GeneratedTopicSchema,
  SaveTopicItemSchema,
  validateArrayOfTopics,
  validateFieldPresence,
} from "@/types/schemas";
import type {
  GeneratedTopic,
  TopicBuilderFormData,
} from "@/types/topic-builder";

describe("Zod Validation Integration", () => {
  // Test data fixtures
  const validGeneratedTopic: GeneratedTopic = {
    id: "test-topic-1",
    title: "Test Topic Title",
    angle: "Test angle for the topic",
    description: "Test description",
    scores: {
      relevance: 85,
      freshness: 90,
      novelty: 75,
    },
    channel_fit: ["blog", "social-media"],
    audience_fit: ["general-audience", "professionals"],
    why_it_works: "This topic works because it addresses current needs",
    tags: ["content", "marketing", "test"],
    generated_at: "2024-01-01T00:00:00Z",
    metadata: {
      generation_params: { temperature: 0.7 },
      model_used: "test-model",
      confidence: 0.85,
    },
  };

  const validTopicBuilderFormData: TopicBuilderFormData = {
    wizardMode: "industry-first",
    industry: "technology",
    content_type: "blog-post",
    purpose: ["educate-inform"],
    tone: ["professional-formal"],
    num_ideas: 5,
  };

  const validSaveTopicItem: SaveTopicItem = {
    title: "Test Topic Title",
    angle: "Test angle for the topic",
    channel_fit: ["blog", "social-media"],
    audience_fit: ["general-audience", "professionals"],
    scores: {
      relevance: 85,
      freshness: 90,
      novelty: 75,
    },
    why_it_works: "This topic works because it addresses current needs",
    tags: ["content", "marketing", "test"],
  };

  describe("Field Presence Validation", () => {
    it("should validate all required fields are present", () => {
      const result = validateFieldPresence(validSaveTopicItem, [
        "title",
        "angle",
        "channel_fit",
        "audience_fit",
        "scores",
        "why_it_works",
        "tags",
      ]);

      expect(result.success).toBe(true);
      expect(result.missingFields).toHaveLength(0);
      expect(result.presentFields).toHaveLength(7);
    });

    it("should detect missing required fields", () => {
      const incompleteData = {
        title: "Test",
        // Missing angle, channel_fit, etc.
      };

      const result = validateFieldPresence(incompleteData, [
        "title",
        "angle",
        "channel_fit",
      ]);

      expect(result.success).toBe(false);
      expect(result.missingFields).toContain("angle");
      expect(result.missingFields).toContain("channel_fit");
      expect(result.presentFields).toContain("title");
    });

    it("should detect empty arrays as missing fields", () => {
      const dataWithEmptyArrays = {
        title: "Test",
        tags: [], // Empty array should be considered missing
      };

      const result = validateFieldPresence(dataWithEmptyArrays, [
        "title",
        "tags",
      ]);

      expect(result.success).toBe(false);
      expect(result.missingFields).toContain("tags");
    });

    it("should detect null and undefined values as missing", () => {
      const dataWithNullValues = {
        title: "Test",
        angle: null,
        why_it_works: undefined,
      };

      const result = validateFieldPresence(dataWithNullValues, [
        "title",
        "angle",
        "why_it_works",
      ]);

      expect(result.success).toBe(false);
      expect(result.missingFields).toContain("angle");
      expect(result.missingFields).toContain("why_it_works");
    });
  });

  describe("Type Validation", () => {
    it("should validate correct GeneratedTopic structure", () => {
      const report = createValidationReport(
        validGeneratedTopic,
        GeneratedTopicSchema,
        "GeneratedTopic test",
      );

      expect(report.isValid).toBe(true);
      expect(report.data).toEqual(validGeneratedTopic);
      expect(report.errors).toHaveLength(0);
    });

    it("should detect type mismatches in scores", () => {
      const invalidTopic = {
        ...validGeneratedTopic,
        scores: {
          relevance: "high", // Should be number
          freshness: 90,
          novelty: 75,
        },
      };

      const report = createValidationReport(
        invalidTopic,
        GeneratedTopicSchema,
        "Invalid scores test",
      );

      expect(report.isValid).toBe(false);
      expect(report.errors).toHaveLength(1);
      expect(report.errors[0].field).toBe("scores.relevance");
      expect(report.errors[0].code).toBe("invalid_type");
    });

    it("should detect invalid score ranges", () => {
      const invalidTopic = {
        ...validGeneratedTopic,
        scores: {
          relevance: 150, // Above max of 100
          freshness: -10, // Below min of 0
          novelty: 75,
        },
      };

      const report = createValidationReport(
        invalidTopic,
        GeneratedTopicSchema,
        "Invalid score ranges test",
      );

      expect(report.isValid).toBe(false);
      expect(report.errors.length).toBeGreaterThan(0);
    });

    it("should validate SaveTopicItem structure", () => {
      const report = createValidationReport(
        validSaveTopicItem,
        SaveTopicItemSchema,
        "SaveTopicItem test",
      );

      expect(report.isValid).toBe(true);
      expect(report.data).toEqual(validSaveTopicItem);
    });
  });

  describe("Array Validation", () => {
    it("should validate non-empty required arrays", () => {
      const topicWithEmptyArrays = {
        ...validSaveTopicItem,
        channel_fit: [], // Should not be empty
        audience_fit: [], // Should not be empty
        tags: [], // Should not be empty
      };

      const report = createValidationReport(
        topicWithEmptyArrays,
        SaveTopicItemSchema,
        "Empty arrays test",
      );

      expect(report.isValid).toBe(false);
      expect(report.errors.length).toBeGreaterThanOrEqual(3);
    });

    it("should validate array of topics", () => {
      const topics = [validSaveTopicItem, validSaveTopicItem];
      const result = validateArrayOfTopics(topics);

      expect(result.success).toBe(true);
      expect(result.validTopics).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle mixed valid and invalid topics in array", () => {
      const invalidTopic = {
        title: "Invalid Topic",
        // Missing required fields
      };

      const topics = [validSaveTopicItem, invalidTopic, validSaveTopicItem];
      const result = validateArrayOfTopics(topics);

      expect(result.success).toBe(false);
      expect(result.validTopics).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].index).toBe(1);
    });
  });

  describe("Enhanced Transformation Validation", () => {
    it("should successfully transform valid GeneratedTopic", () => {
      const result = transformTopicForSavingEnhanced(validGeneratedTopic, {
        includeMetrics: true,
      });

      if (!result.success) {
        console.log("Error:", result.error);
      }

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("should fail transformation with detailed error for invalid input", () => {
      const invalidTopic = {
        title: "Test",
        // Missing required fields
      };

      const result = transformTopicForSavingEnhanced(invalidTopic);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toMatch(
        /validation|field_required|missing_field/,
      );
      expect(result.error?.recoveryActions).toBeDefined();
      expect(result.error?.fieldPath).toBeDefined();
    });

    it("should provide specific error types for different validation failures", () => {
      // Type mismatch error
      const typeMismatchTopic = {
        ...validGeneratedTopic,
        scores: "invalid", // Should be object
      };

      const typeResult = transformTopicForSavingEnhanced(typeMismatchTopic);
      expect(typeResult.success).toBe(false);
      expect(typeResult.error?.type).toBe("type_mismatch");

      // Missing field error
      const missingFieldTopic = {
        title: "Test",
        angle: "Test angle",
        // Missing other required fields
      };

      const missingResult = transformTopicForSavingEnhanced(missingFieldTopic);
      expect(missingResult.success).toBe(false);
      expect(missingResult.error?.type).toMatch(/validation|field_required/);
    });

    it("should apply auto-fixes when enabled", () => {
      const topicNeedingFixes = {
        ...validGeneratedTopic,
        channel_fit: [], // Will be auto-fixed
        audience_fit: [], // Will be auto-fixed
        tags: [], // Will be auto-fixed
      };

      const result = transformTopicForSavingEnhanced(topicNeedingFixes, {
        autoFix: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.channel_fit.length).toBeGreaterThan(0);
      expect(result.data?.audience_fit.length).toBeGreaterThan(0);
      expect(result.data?.tags.length).toBeGreaterThan(0);
    });
  });

  describe("Batch Transformation Validation", () => {
    it("should handle batch transformation with all valid topics", async () => {
      const topics = [
        validGeneratedTopic,
        validGeneratedTopic,
        validGeneratedTopic,
      ];

      const result = await transformTopicsForSavingEnhanced(topics, {
        includeMetrics: true,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.successCount).toBe(3);
    });

    it("should handle batch transformation with mixed valid/invalid topics", async () => {
      const invalidTopic = { title: "Invalid" };
      const topics = [validGeneratedTopic, invalidTopic, validGeneratedTopic];

      const result = await transformTopicsForSavingEnhanced(topics, {
        continueOnError: true,
        includeMetrics: true,
      });

      expect(result.success).toBe(false);
      expect(result.data).toHaveLength(2); // Only valid topics
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].index).toBe(1);
      expect(result.metrics?.errorCount).toBe(1);
    });

    it("should stop on first error when continueOnError is false", async () => {
      const invalidTopic = { title: "Invalid" };
      const topics = [invalidTopic, validGeneratedTopic, validGeneratedTopic];

      const result = await transformTopicsForSavingEnhanced(topics, {
        continueOnError: false,
      });

      expect(result.success).toBe(false);
      expect(result.data).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("Form Data Validation", () => {
    it("should validate correct form data structure", () => {
      const result = transformFormDataToBackendEnhanced(
        validTopicBuilderFormData,
        {
          validateRequired: true,
          includeMetrics: true,
        },
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.timestamp).toBeDefined();
      expect(result.metrics).toBeDefined();
    });

    it("should detect invalid enum values", () => {
      const invalidFormData = {
        ...validTopicBuilderFormData,
        industry: "invalid-industry", // Not in enum
      };

      const result = transformFormDataToBackendEnhanced(invalidFormData);

      expect(result.success).toBe(false);
      expect(result.error?.type).toMatch(/validation|schema_mismatch/);
    });

    it("should apply field normalization when enabled", () => {
      const messyFormData = {
        ...validTopicBuilderFormData,
        industry: "  technology  ", // Extra whitespace
        demographic_age: ["adult", "adult", "senior"], // Duplicates
      };

      const result = transformFormDataToBackendEnhanced(messyFormData, {
        normalizeFields: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.industry).toBe("technology");
    });
  });

  describe("Error Handling and Recovery", () => {
    it("should create structured transformation errors", () => {
      const error = createTransformationError(
        "field_required",
        "Test error message",
        { test: "data" },
        {
          fieldPath: "test.field",
          expectedType: "string",
          isRecoverable: true,
          recoveryActions: ["Fix the field"],
        },
      );

      expect(error.type).toBe("field_required");
      expect(error.message).toBe("Test error message");
      expect(error.fieldPath).toBe("test.field");
      expect(error.expectedType).toBe("string");
      expect(error.isRecoverable).toBe(true);
      expect(error.recoveryActions).toContain("Fix the field");
    });

    it("should provide context-specific recovery actions", () => {
      const result = transformTopicForSavingEnhanced({
        title: "Test",
        scores: "invalid", // Type error
      });

      expect(result.success).toBe(false);
      expect(result.error?.recoveryActions).toBeDefined();
      expect(
        result.error?.recoveryActions.some((action) =>
          action.toLowerCase().includes("type"),
        ),
      ).toBe(true);
    });
  });

  describe("Performance and Metrics", () => {
    it("should track transformation performance metrics", () => {
      const result = transformTopicForSavingEnhanced(validGeneratedTopic, {
        includeMetrics: true,
      });

      expect(result.metrics).toBeDefined();
      expect(result.metrics?.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.metrics?.inputSize).toBeGreaterThan(0);
      expect(result.metrics?.outputSize).toBeGreaterThan(0);
    });

    it("should track batch transformation metrics", async () => {
      const topics = Array(5).fill(validGeneratedTopic);

      const result = await transformTopicsForSavingEnhanced(topics, {
        includeMetrics: true,
      });

      expect(result.metrics).toBeDefined();
      expect(result.metrics?.totalDurationMs).toBeGreaterThanOrEqual(0);
      expect(result.metrics?.avgDurationMs).toBeGreaterThanOrEqual(0);
      expect(result.metrics?.successCount).toBe(5);
      expect(result.metrics?.errorCount).toBe(0);
    });
  });

  describe("Integration and Edge Cases", () => {
    it("should handle null input gracefully", () => {
      const result = transformTopicForSavingEnhanced(null);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe("validation");
    });

    it("should handle undefined input gracefully", () => {
      const result = transformTopicForSavingEnhanced(undefined);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe("validation");
    });

    it("should handle circular reference objects", () => {
      const circularObj: { title: string; self?: unknown } = { title: "Test" };
      circularObj.self = circularObj;

      const result = transformTopicForSavingEnhanced(circularObj);

      expect(result.success).toBe(false);
    });

    it("should validate deeply nested objects", () => {
      const deeplyNestedTopic = {
        ...validGeneratedTopic,
        metadata: {
          generation_params: {
            nested: {
              deeply: {
                invalid: "structure",
              },
            },
          },
        },
      };

      const result = transformTopicForSavingEnhanced(deeplyNestedTopic);
      // Should still pass as metadata structure is flexible
      expect(result.success).toBe(true);
    });
  });
});
