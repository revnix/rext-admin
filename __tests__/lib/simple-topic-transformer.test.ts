import {
  transformTopicForDisplay,
  transformTopicsForDisplay,
} from "@/lib/simple-topic-transformer";
import type { GeneratedTopic } from "@/types/topic-builder";

describe("Simple Topic Transformer", () => {
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
      seo_potential: 0.85,
      trend_level: 0.73,
      uniqueness: 0.81,
      reader_interest: 0.88,
      actionable_potential: 0.79,
      brand_alignment: 0.91,
      controversy: 0.15,
    },
    tags: ["AI", "marketing", "content-strategy", "tools"],
    is_saved: false,
    created_at: "2024-01-01T00:00:00Z",
  };

  describe("Single Topic Transformation", () => {
    it("should transform a valid topic correctly", () => {
      const result = transformTopicForDisplay(validTopic, 0);

      expect(result).toBeDefined();
      expect(result.id).toBe("topic-1");
      expect(result.name).toBe(
        "10 AI Tools That Will Transform Your Content Marketing Strategy",
      );
      expect(result.description).toBe(
        "Comprehensive guide covering the latest AI tools for content creators",
      );
      expect(result.category).toBe("AI");
      expect(result.status).toBe("pending");
      expect(result.priority).toBe("high"); // High score (92 relevance)
      expect(result.source).toBe("AI Generated");
      expect(result.tags).toEqual([
        "AI",
        "marketing",
        "content-strategy",
        "tools",
      ]);
      expect(result.assignee).toBe("AI Assistant");
      expect(result.estimatedEffort).toBe("Medium");
      expect(result.ranking).toBe("#1");
      expect(result.author).toBe("AI Assistant");
      expect(result.contentType).toBe("General");
      expect(typeof result.score).toBe("number");
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("should handle topic with minimal data", () => {
      const minimalTopic: GeneratedTopic = {
        id: "topic-minimal",
        title: "Simple Topic",
        angle: "Basic approach",
        channel_fit: ["blog"],
        audience_fit: ["general"],
        why_it_works: "Simple and clear messaging",
        scores: {
          relevance: 0.5,
          seo_potential: 0.5,
          trend_level: 0.5,
          uniqueness: 0.5,
          reader_interest: 0.5,
          actionable_potential: 0.5,
          brand_alignment: 0.5,
          controversy: 0.2,
        },
        tags: [],
        created_at: "2024-01-01T00:00:00Z",
      };

      const result = transformTopicForDisplay(minimalTopic, 1);

      expect(result).toBeDefined();
      expect(result.id).toBe("topic-minimal");
      expect(result.name).toBe("Simple Topic");
      expect(result.category).toBe("General");
      expect(result.status).toBe("pending");
      expect(result.priority).toBe("medium");
      expect(result.tags).toEqual([]);
      expect(result.ranking).toBe("#2");
      expect(result.score).toBe(50); // Default score
    });

    it("should calculate scores correctly", () => {
      const topicWithHighScores: GeneratedTopic = {
        id: "high-score",
        title: "High Score Topic",
        angle: "Comprehensive deep-dive approach",
        channel_fit: ["blog", "newsletter"],
        audience_fit: ["professionals", "experts"],
        why_it_works: "High-quality content with proven value",
        scores: {
          relevance: 1.0,
          seo_potential: 0.9,
          trend_level: 0.8,
          uniqueness: 0.9,
          reader_interest: 0.95,
          actionable_potential: 0.85,
          brand_alignment: 0.9,
          controversy: 0.1,
        },
        tags: ["high-quality", "professional"],
        created_at: "2024-01-01T00:00:00Z",
      };

      const result = transformTopicForDisplay(topicWithHighScores);
      expect(result.score).toBeGreaterThan(80);
      expect(result.priority).toBe("high");
    });

    it("should handle topics with channel_fit for category", () => {
      const topicWithChannelFit: GeneratedTopic = {
        id: "channel-topic",
        title: "Channel Topic",
        angle: "Video-first approach",
        channel_fit: ["youtube", "tiktok"],
        audience_fit: ["content creators", "influencers"],
        why_it_works: "Visual content performs well on these platforms",
        scores: {
          relevance: 0.8,
          seo_potential: 0.6,
          trend_level: 0.9,
          uniqueness: 0.7,
          reader_interest: 0.8,
          actionable_potential: 0.7,
          brand_alignment: 0.8,
          controversy: 0.3,
        },
        tags: ["video", "social-media"],
        created_at: "2024-01-01T00:00:00Z",
      };

      const result = transformTopicForDisplay(topicWithChannelFit);
      expect(result.category).toBe("Youtube");
    });

    it("should handle saved topics", () => {
      const savedTopic: GeneratedTopic = {
        ...validTopic,
        is_saved: true,
        approved: true, // When approved, status should be "approved"
      };

      const result = transformTopicForDisplay(savedTopic);
      expect(result.status).toBe("approved");
    });
  });

  describe("Batch Topic Transformation", () => {
    it("should transform multiple topics", () => {
      const topics = [
        validTopic,
        { ...validTopic, id: "topic-2", title: "Second Topic" },
        { ...validTopic, id: "topic-3", title: "Third Topic" },
      ];

      const results = transformTopicsForDisplay(topics);

      expect(results).toHaveLength(3);
      expect(results[0].id).toBe("topic-1");
      expect(results[1].id).toBe("topic-2");
      expect(results[2].id).toBe("topic-3");
      expect(results[0].ranking).toBe("#1");
      expect(results[1].ranking).toBe("#2");
      expect(results[2].ranking).toBe("#3");
    });

    it("should handle empty array", () => {
      const results = transformTopicsForDisplay([]);
      expect(results).toEqual([]);
    });

    it("should handle invalid input gracefully", () => {
      const results = transformTopicsForDisplay(
        "not an array" as unknown as GeneratedTopic[],
      );
      expect(results).toEqual([]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined optional fields", () => {
      const topicWithUndefined: GeneratedTopic = {
        id: "undefined-fields",
        title: "Topic with undefined fields",
        angle: "Basic angle", // angle is required
        channel_fit: ["blog"], // required
        audience_fit: ["general"], // required
        why_it_works: "Standard approach", // required
        scores: {
          relevance: 0.5,
          seo_potential: 0.5,
          trend_level: 0.5,
          uniqueness: 0.5,
          reader_interest: 0.5,
          actionable_potential: 0.5,
          brand_alignment: 0.5,
          controversy: 0.2,
        }, // scores is required
        tags: [], // tags is required but can be empty
        created_at: "2024-01-01T00:00:00Z",
        description: undefined, // description is optional
      };

      const result = transformTopicForDisplay(topicWithUndefined);

      expect(result).toBeDefined();
      expect(result.description).toBe("");
      expect(result.tags).toEqual([]);
      expect(result.score).toBe(50);
    });

    it("should handle null scores", () => {
      const topicWithNullScores: GeneratedTopic = {
        id: "null-scores",
        title: "Null Scores Topic",
        angle: "Test angle",
        channel_fit: ["blog"],
        audience_fit: ["general"],
        why_it_works: "Test reasoning",
        scores: null as unknown as GeneratedTopic["scores"],
        tags: ["test"],
        created_at: "2024-01-01T00:00:00Z",
      };

      const result = transformTopicForDisplay(topicWithNullScores);
      expect(result.score).toBe(50);
      expect(result.priority).toBe("medium");
    });
  });
});
