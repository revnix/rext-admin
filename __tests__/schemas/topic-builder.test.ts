/**
 * Tests for Topic Builder Zod Schemas
 */

import {
  audienceStepSchema,
  contentFormatStepSchema,
  generatedTopicSchema,
  goalsStepSchema,
  industryStepSchema,
  topicBuilderFormDataSchema,
  topicGenerationResponseSchema,
} from "@/schemas/topic-builder";
import type {
  GeneratedTopic,
  TopicBuilderFormData,
} from "@/types/topic-builder";

describe("Topic Builder Schemas", () => {
  describe("topicBuilderFormDataSchema", () => {
    const validFormData: TopicBuilderFormData = {
      wizardMode: "industry-first",
      industry: "technology",
      content_type: "blog-post",
      purpose: ["educate-inform"],
      tone: ["professional-formal"],
      num_ideas: 5,
    };

    it("should validate valid form data", () => {
      const result = topicBuilderFormDataSchema.parse(validFormData);
      expect(result).toEqual(validFormData);
    });

    it("should apply default values", () => {
      const minimalData = {
        wizardMode: "industry-first" as const,
        industry: "technology" as const,
        content_type: "blog-post" as const,
        purpose: ["educate-inform"] as const,
        tone: ["professional-formal"] as const,
      };

      const result = topicBuilderFormDataSchema.parse(minimalData);

      expect(result.num_ideas).toBe(5);
    });

    it("should reject invalid enum values", () => {
      const invalidData = {
        ...validFormData,
        industry: "invalid-industry",
      };

      expect(() => topicBuilderFormDataSchema.parse(invalidData)).toThrow();
    });

    it("should require at least one purpose", () => {
      const invalidData = {
        ...validFormData,
        purpose: [],
      };

      expect(() => topicBuilderFormDataSchema.parse(invalidData)).toThrow(
        "Please select at least one purpose",
      );
    });

    it("should validate num_ideas range", () => {
      const invalidMin = { ...validFormData, num_ideas: 0 };
      const invalidMax = { ...validFormData, num_ideas: 25 };
      const validRange = { ...validFormData, num_ideas: 10 };

      expect(() => topicBuilderFormDataSchema.parse(invalidMin)).toThrow();
      expect(() => topicBuilderFormDataSchema.parse(invalidMax)).toThrow();
      expect(() => topicBuilderFormDataSchema.parse(validRange)).not.toThrow();
    });
  });

  describe("industryStepSchema", () => {
    it("should validate industry-first mode", () => {
      const validData = {
        wizardMode: "industry-first" as const,
        industry: "technology" as const,
      };

      const result = industryStepSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should validate subject-first mode with subject", () => {
      const validData = {
        wizardMode: "subject-first" as const,
        industry: "technology" as const,
        subject: "AI Development",
      };

      const result = industryStepSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should require subject for subject-first mode", () => {
      const invalidData = {
        wizardMode: "subject-first" as const,
        industry: "technology" as const,
      };

      expect(() => industryStepSchema.parse(invalidData)).toThrow();
    });

    it("should require industry_other when industry is other", () => {
      const invalidData = {
        wizardMode: "industry-first" as const,
        industry: "other" as const,
      };

      const validData = {
        wizardMode: "industry-first" as const,
        industry: "other" as const,
        industry_other: "Custom Industry",
      };

      expect(() => industryStepSchema.parse(invalidData)).toThrow();
      expect(() => industryStepSchema.parse(validData)).not.toThrow();
    });
  });

  describe("audienceStepSchema", () => {
    it("should validate valid audience data", () => {
      const validData = {
        audience: ["developers", "tech-leads"],
      };

      const result = audienceStepSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should require at least one audience", () => {
      const invalidData = {
        audience: [],
      };

      expect(() => audienceStepSchema.parse(invalidData)).toThrow(
        "Please select at least one audience type",
      );
    });
  });

  describe("contentFormatStepSchema", () => {
    it("should validate blog post content type", () => {
      const validData = {
        content_type: "blog-post" as const,
      };

      const result = contentFormatStepSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should require platform when content_type is social-media", () => {
      const invalidData = {
        content_type: "social-media" as const,
      };

      const validData = {
        content_type: "social-media" as const,
        platform: "facebook" as const,
      };

      expect(() => contentFormatStepSchema.parse(invalidData)).toThrow();
      expect(() => contentFormatStepSchema.parse(validData)).not.toThrow();
    });

    it("should not require platform for blog post content", () => {
      const validData = {
        content_type: "blog-post" as const,
      };

      expect(() => contentFormatStepSchema.parse(validData)).not.toThrow();
    });
  });

  describe("goalsStepSchema", () => {
    it("should validate valid goals data", () => {
      const validData = {
        purpose: ["educate-inform", "entertain-engage"],
        tone: ["professional-formal", "friendly-warm"],
      };

      const result = goalsStepSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should require at least one of each goal type", () => {
      const invalidPurpose = {
        purpose: [],
        tone: ["professional-formal"],
      };

      const invalidTone = {
        purpose: ["educate-inform"],
        tone: [],
      };

      expect(() => goalsStepSchema.parse(invalidPurpose)).toThrow();
      expect(() => goalsStepSchema.parse(invalidTone)).toThrow();
    });
  });

  describe("generatedTopicSchema", () => {
    const validTopic: GeneratedTopic = {
      id: "1",
      title: "Test Topic",
      angle: "Test Angle",
      description: "Test Description",
      channel_fit: ["blog", "social-media"],
      audience_fit: ["developers"],
      why_it_works: "Test reason",
      scores: {
        relevance: 0.8,
        freshness: 0.7,
        novelty: 0.6,
      },
      tags: ["tech", "tutorial"],
      is_saved: false,
    };

    it("should validate valid topic", () => {
      const result = generatedTopicSchema.parse(validTopic);
      expect(result).toEqual(validTopic);
    });

    it("should validate score ranges", () => {
      const invalidScores = {
        ...validTopic,
        scores: {
          relevance: 1.5, // Invalid: > 1
          freshness: -0.1, // Invalid: < 0
          novelty: 0.5,
        },
      };

      expect(() => generatedTopicSchema.parse(invalidScores)).toThrow();
    });

    it("should work without optional fields", () => {
      const minimalTopic = {
        id: "1",
        title: "Test Topic",
        angle: "Test Angle",
        channel_fit: ["blog"],
        audience_fit: ["developers"],
        why_it_works: "Test reason",
        scores: {
          relevance: 0.8,
          freshness: 0.7,
          novelty: 0.6,
        },
        tags: ["tech"],
      };

      const result = generatedTopicSchema.parse(minimalTopic);
      expect(result.description).toBeUndefined();
      expect(result.is_saved).toBeUndefined();
    });
  });

  describe("topicGenerationResponseSchema", () => {
    it("should validate valid response", () => {
      const validResponse = {
        topics: [
          {
            id: "1",
            title: "Test Topic",
            angle: "Test Angle",
            channel_fit: ["blog"],
            audience_fit: ["developers"],
            why_it_works: "Test reason",
            scores: {
              relevance: 0.8,
              freshness: 0.7,
              novelty: 0.6,
            },
            tags: ["tech"],
          },
        ],
        request_id: "test-request-id",
        generated_at: "2024-01-01T00:00:00Z",
        model_used: "gpt-4",
        generation_time_ms: 1500,
      };

      const result = topicGenerationResponseSchema.parse(validResponse);
      expect(result).toEqual(validResponse);
    });

    it("should work without optional fields", () => {
      const minimalResponse = {
        topics: [],
        request_id: "test-request-id",
        generated_at: "2024-01-01T00:00:00Z",
      };

      const result = topicGenerationResponseSchema.parse(minimalResponse);
      expect(result.model_used).toBeUndefined();
      expect(result.generation_time_ms).toBeUndefined();
    });
  });
});
