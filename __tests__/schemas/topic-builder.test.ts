/**
 * Tests for Topic Builder Zod Schemas
 */

import {
  audienceStepSchema,
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
      audience: ["business-leaders"],
      purpose: ["educate-inform"],
      num_topics: 5,
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

      expect(result.num_topics).toBe(5);
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

    it("should validate num_topics range", () => {
      const invalidMin = { ...validFormData, num_topics: 0 };
      const invalidMax = { ...validFormData, num_topics: 25 };
      const validRange = { ...validFormData, num_topics: 10 };

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

  // contentFormatStepSchema tests skipped - schema not implemented

  describe("goalsStepSchema", () => {
    it("should validate valid goals data", () => {
      const validData = {
        purpose: ["educate-inform", "entertain-engage"],
      };

      const result = goalsStepSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it("should require at least one purpose", () => {
      const invalidPurpose = {
        purpose: [],
      };

      expect(() => goalsStepSchema.parse(invalidPurpose)).toThrow();
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
        seo_potential: 0.7,
        trend_level: 0.6,
        uniqueness: 0.8,
        reader_interest: 0.7,
        actionable_potential: 0.6,
        brand_alignment: 0.8,
        controversy: 0.2,
      },
      tags: ["tech", "tutorial"],
      is_saved: false,
      created_at: "2024-01-01T00:00:00Z",
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
          seo_potential: -0.1, // Invalid: < 0
          trend_level: 0.5,
          uniqueness: 0.8,
          reader_interest: 0.7,
          actionable_potential: 0.6,
          brand_alignment: 0.8,
          controversy: 0.2,
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
          seo_potential: 0.7,
          trend_level: 0.6,
          uniqueness: 0.8,
          reader_interest: 0.7,
          actionable_potential: 0.6,
          brand_alignment: 0.8,
          controversy: 0.2,
        },
        tags: ["tech"],
        created_at: "2024-01-01T00:00:00Z",
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
              seo_potential: 0.7,
              trend_level: 0.6,
              uniqueness: 0.8,
              reader_interest: 0.7,
              actionable_potential: 0.6,
              brand_alignment: 0.8,
              controversy: 0.2,
            },
            tags: ["tech"],
            created_at: "2024-01-01T00:00:00Z",
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
