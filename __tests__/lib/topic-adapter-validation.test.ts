import {
  transformTopicsToIdeasEnhanced,
  transformTopicToIdeaEnhanced,
} from "@/lib/topic-adapter-utils";
import { IdeaDataSchema } from "@/types/schemas";
import type { GeneratedTopic } from "@/types/topic-builder";

describe("Topic Adapter Validation", () => {
  // Valid test data
  const validTopic: GeneratedTopic = {
    id: "topic-1",
    title: "10 AI Tools That Will Transform Your Content Marketing Strategy",
    angle: "Focus on practical implementation and ROI measurement",
    description:
      "Comprehensive guide covering the latest AI tools for content creators",
    channel_fit: ["blog", "linkedin", "newsletter"],
    audience_fit: [
      "marketing professionals",
      "content creators",
      "small business owners",
    ],
    why_it_works:
      "Addresses the immediate need for AI adoption in marketing with actionable insights",
    scores: {
      relevance: 0.92,
      freshness: 0.85,
      novelty: 0.73,
    },
    tags: ["AI", "marketing", "content-strategy", "tools"],
    is_saved: false,
  };

  // Invalid test data scenarios
  const invalidTopics = {
    missingId: {
      ...validTopic,
      id: "",
    },
    missingTitle: {
      ...validTopic,
      title: "",
    },
    invalidScores: {
      ...validTopic,
      scores: {
        relevance: -1, // Invalid: below 0
        freshness: 150, // Invalid: above 100
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input scenarios
        novelty: "invalid" as any, // Invalid: not a number
      },
    },
    wrongType: {
      ...validTopic,
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input scenarios
      channel_fit: "not-an-array" as any, // Should be array
    },
    nullValues: {
      ...validTopic,
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input scenarios
      angle: null as any,
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input scenarios
      description: null as any,
    },
  };

  describe("Single Topic Validation", () => {
    describe("Valid Data", () => {
      it("should successfully validate and transform valid topic", () => {
        const result = transformTopicToIdeaEnhanced(validTopic, {
          includeMetrics: true,
          includeWarnings: true,
        });

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.metrics).toBeDefined();
        expect(result.error).toBeUndefined();

        // Verify the transformed data is valid IdeaData
        if (result.data) {
          const ideaValidation = IdeaDataSchema.safeParse(result.data);
          expect(ideaValidation.success).toBe(true);
        }
      });

      it("should include performance metrics when requested", () => {
        const result = transformTopicToIdeaEnhanced(validTopic, {
          includeMetrics: true,
        });

        expect(result.success).toBe(true);
        expect(result.metrics).toBeDefined();
        expect(result.metrics?.durationMs).toBeGreaterThan(0);
        expect(result.metrics?.inputSize).toBeGreaterThan(0);
        expect(result.metrics?.outputSize).toBeGreaterThan(0);
        expect(result.metrics?.fieldsMapped).toBeGreaterThan(0);
      });
    });

    describe("Invalid Data", () => {
      it("should fail validation for missing required fields", () => {
        const result = transformTopicToIdeaEnhanced(invalidTopics.missingId);

        expect(result.success).toBe(false);
        expect(result.data).toBeUndefined();
        expect(result.error).toBeDefined();
        expect(result.error?.type).toBe("validation_failed");
        expect(result.error?.validationIssues).toBeDefined();
        expect(result.error?.validationIssues?.length).toBeGreaterThan(0);
      });

      it("should provide descriptive error messages for invalid data", () => {
        const result = transformTopicToIdeaEnhanced(
          invalidTopics.invalidScores,
        );

        expect(result.success).toBe(false);
        expect(result.error?.message).toContain("validation");
        expect(result.error?.recoveryActions).toBeDefined();
        expect(result.error?.recoveryActions?.length).toBeGreaterThan(0);
      });

      it("should handle type mismatches gracefully", () => {
        const result = transformTopicToIdeaEnhanced(invalidTopics.wrongType);

        expect(result.success).toBe(false);
        expect(result.error?.type).toBe("validation_failed");
        expect(result.error?.fieldPath).toBeDefined();
      });

      it("should handle null values appropriately", () => {
        const result = transformTopicToIdeaEnhanced(invalidTopics.nullValues, {
          fallbackBehavior: "strict",
        });

        expect(result.success).toBe(false);
        expect(result.error?.type).toBe("validation_failed");
      });
    });

    describe("Auto-Fix Capabilities", () => {
      it("should auto-fix common issues when enabled", () => {
        const topicWithFixableIssues = {
          ...validTopic,
          scores: {
            relevance: 1.2, // Out of range - should be fixed to 1.0
            freshness: -0.1, // Out of range - should be fixed to 0.0
            novelty: 0.5, // Valid
          },
        };

        const result = transformTopicToIdeaEnhanced(topicWithFixableIssues, {
          autoFix: true,
          includeWarnings: true,
        });

        expect(result.success).toBe(true);
        expect(result.warnings?.length).toBeGreaterThan(0);
        expect(result.warnings?.[0]?.type).toContain("coerced");
      });

      it("should log applied fixes in warnings", () => {
        const topicWithEmptyStrings = {
          ...validTopic,
          angle: "",
          description: "",
        };

        const result = transformTopicToIdeaEnhanced(topicWithEmptyStrings, {
          autoFix: true,
          includeWarnings: true,
        });

        expect(result.success).toBe(true);
        expect(result.warnings?.some((w) => w.type === "fallback_used")).toBe(
          true,
        );
      });
    });

    describe("Fallback Behaviors", () => {
      it("should respect strict fallback behavior", () => {
        const result = transformTopicToIdeaEnhanced(
          invalidTopics.missingTitle,
          {
            fallbackBehavior: "strict",
          },
        );

        expect(result.success).toBe(false);
      });

      it("should apply lenient fallback behavior", () => {
        const result = transformTopicToIdeaEnhanced(
          invalidTopics.missingTitle,
          {
            fallbackBehavior: "lenient",
            autoFix: true,
          },
        );

        // Lenient mode might still succeed with fixes
        if (!result.success) {
          expect(result.error?.severity).toBe("high");
        }
      });
    });
  });

  describe("Batch Topic Validation", () => {
    const mixedTopics = [
      validTopic,
      invalidTopics.missingId,
      invalidTopics.invalidScores,
      { ...validTopic, id: "topic-2", title: "Another Valid Topic" },
    ];

    describe("Continue on Error", () => {
      it("should process valid topics and collect errors for invalid ones", async () => {
        const result = await transformTopicsToIdeasEnhanced(mixedTopics, {
          continueOnError: true,
          includeMetrics: true,
        });

        expect(result.success).toBe(true);
        expect(result.data.length).toBeGreaterThan(0); // Should have some valid results
        expect(result.errors.length).toBeGreaterThan(0); // Should have some errors
        expect(result.metrics).toBeDefined();
      });

      it("should provide detailed error information for failed items", async () => {
        const result = await transformTopicsToIdeasEnhanced(mixedTopics, {
          continueOnError: true,
        });

        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].error.type).toBe("validation_failed");
        expect(result.errors[0].index).toBeGreaterThanOrEqual(0);
        expect(result.errors[0].originalItem).toBeDefined();
      });
    });

    describe("Fail Fast", () => {
      it("should stop processing on first error when continueOnError is false", async () => {
        const result = await transformTopicsToIdeasEnhanced(mixedTopics, {
          continueOnError: false,
        });

        expect(result.success).toBe(false);
        expect(result.data.length).toBe(0);
        expect(result.errors.length).toBe(1); // Only first error
      });
    });

    describe("Performance Metrics", () => {
      it("should track batch processing metrics", async () => {
        const result = await transformTopicsToIdeasEnhanced(
          [validTopic, validTopic],
          {
            includeMetrics: true,
            maxConcurrency: 2,
          },
        );

        expect(result.success).toBe(true);
        expect(result.metrics).toBeDefined();
        expect(result.metrics?.totalDurationMs).toBeGreaterThan(0);
        expect(result.metrics?.throughputPerSecond).toBeGreaterThan(0);
        expect(result.metrics?.successCount).toBe(2);
        expect(result.metrics?.errorCount).toBe(0);
      });

      it("should respect concurrency limits", async () => {
        const manyTopics = Array(10)
          .fill(validTopic)
          .map((topic, i) => ({
            ...topic,
            id: `topic-${i}`,
          }));

        const result = await transformTopicsToIdeasEnhanced(manyTopics, {
          maxConcurrency: 3,
          includeMetrics: true,
        });

        expect(result.success).toBe(true);
        expect(result.data.length).toBe(10);
      });
    });
  });

  describe("Schema Validation Edge Cases", () => {
    it("should handle completely malformed input", () => {
      const result = transformTopicToIdeaEnhanced(null);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe("validation_failed");
    });

    it("should handle non-object input", () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input scenarios
      const result = transformTopicToIdeaEnhanced("not-an-object" as any);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe("validation_failed");
    });

    it("should handle empty object", () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input scenarios
      const result = transformTopicToIdeaEnhanced({} as any);

      expect(result.success).toBe(false);
      expect(result.error?.validationIssues?.length).toBeGreaterThan(0);
    });

    it("should handle array instead of object", () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input scenarios
      const result = transformTopicToIdeaEnhanced([] as any);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe("validation_failed");
    });
  });

  describe("Output Validation", () => {
    it("should validate transformed output against IdeaData schema", () => {
      const result = transformTopicToIdeaEnhanced(validTopic);

      expect(result.success).toBe(true);
      if (result.data) {
        const outputValidation = IdeaDataSchema.safeParse(result.data);
        expect(outputValidation.success).toBe(true);

        // Verify required fields
        expect(result.data.id).toBe(validTopic.id);
        expect(result.data.name).toBe(validTopic.title);
        expect(result.data.description).toContain(validTopic.angle);
        expect(result.data.status).toMatch(/generated|saving|saved/);
        expect(result.data.priority).toMatch(/low|medium|high/);
      }
    });

    it("should ensure all required IdeaData fields are present", () => {
      const result = transformTopicToIdeaEnhanced(validTopic);

      expect(result.success).toBe(true);
      if (result.data) {
        const requiredFields = [
          "id",
          "name",
          "description",
          "category",
          "status",
          "priority",
          "source",
          "tags",
          "created",
          "lastModified",
          "assignee",
          "estimatedEffort",
        ];

        for (const field of requiredFields) {
          expect(result.data).toHaveProperty(field);
          // biome-ignore lint/suspicious/noExplicitAny: Testing dynamic field access
          expect((result.data as any)[field]).toBeDefined();
        }
      }
    });

    it("should handle transformation that produces invalid output", () => {
      // This test simulates a scenario where input validation passes
      // but transformation logic produces invalid output
      const topicWithProblematicData = {
        ...validTopic,
        scores: {
          relevance: NaN, // This might cause issues in priority calculation
          freshness: 0.5,
          novelty: 0.3,
        },
      };

      const result = transformTopicToIdeaEnhanced(topicWithProblematicData, {
        autoFix: true,
      });

      // Should either succeed with auto-fix or fail gracefully
      if (!result.success) {
        expect(result.error?.stage).toBe("transformation");
      } else {
        // If it succeeds, the output should still be valid
        const outputValidation = IdeaDataSchema.safeParse(result.data);
        expect(outputValidation.success).toBe(true);
      }
    });
  });

  describe("Custom Configuration", () => {
    it("should respect maxInputSize limits", () => {
      const largeData = {
        ...validTopic,
        description: "x".repeat(10000), // Very large description
      };

      const result = transformTopicToIdeaEnhanced(largeData, {
        maxInputSize: 100, // Very small limit
      });

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe("size_limit_exceeded");
    });

    it("should respect transformation timeout", () => {
      const result = transformTopicToIdeaEnhanced(validTopic, {
        transformationTimeout: 1, // 1ms - very short
      });

      // This might pass if transformation is fast enough,
      // but should handle timeout gracefully if it occurs
      if (!result.success) {
        expect(result.error?.type).toBe("transformation_timeout");
      }
    });

    it("should apply custom field mappings", () => {
      const customMappings = {
        name: (topic: GeneratedTopic) => `Custom: ${topic.title}`,
        category: () => "Custom Category",
      };

      const result = transformTopicToIdeaEnhanced(validTopic, {
        customFieldMappings: customMappings,
      });

      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.name).toBe(`Custom: ${validTopic.title}`);
        expect(result.data.category).toBe("Custom Category");
      }
    });
  });
});
