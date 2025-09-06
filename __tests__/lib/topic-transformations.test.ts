import { transformTopicsToIdeas } from "@/lib/topic-transformations";
import type { GeneratedTopic } from "@/types/topic-builder";

describe("Topic Transformations", () => {
  const mockTopic: GeneratedTopic = {
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

  const mockSavedTopic: GeneratedTopic = {
    ...mockTopic,
    id: "topic-2",
    title: "Building Sustainable Content Workflows with AI",
    is_saved: true,
  };

  const mockTopicWithMissingData: GeneratedTopic = {
    id: "topic-3",
    title: "Minimal Topic",
    angle: "",
    description: "",
    channel_fit: [],
    audience_fit: [],
    why_it_works: "",
    scores: {
      relevance: 0.5,
      freshness: 0.4,
      novelty: 0.3,
    },
    tags: [],
    is_saved: false,
  };

  describe("transformTopicsToIdeas", () => {
    it("should transform a single topic correctly", () => {
      const result = transformTopicsToIdeas([mockTopic]);

      expect(result).toHaveLength(1);
      const transformedTopic = result[0];

      expect(transformedTopic.id).toBe("topic-1");
      expect(transformedTopic.name).toBe(
        "10 AI Tools That Will Transform Your Content Marketing Strategy",
      );
      expect(transformedTopic.description).toBe(
        "Focus on practical implementation and ROI measurement • Comprehensive guide covering the latest AI tools for content creators",
      );
      expect(transformedTopic.category).toBe("Ai"); // First tag capitalized
      expect(transformedTopic.status).toBe("generated");
      expect(transformedTopic.priority).toBe("high"); // Weighted score should be high
      expect(transformedTopic.contentType).toBe("Blog Post"); // Inferred from channel_fit
      expect(transformedTopic.score).toBe(86); // Calculated weighted score: (0.92*0.5 + 0.85*0.3 + 0.73*0.2) * 100 = 86
      expect(transformedTopic.ranking).toBe("#1");
      expect(transformedTopic.author).toBe("AI Assistant");
      expect(transformedTopic.source).toBe("AI Generated");
    });

    it("should handle saved topics correctly", () => {
      const result = transformTopicsToIdeas([mockSavedTopic]);

      expect(result[0].status).toBe("saved");
    });

    it("should handle topics with missing data gracefully", () => {
      const result = transformTopicsToIdeas([mockTopicWithMissingData]);

      const transformedTopic = result[0];
      expect(transformedTopic.description).toBe("AI-generated topic idea"); // Fallback description
      expect(transformedTopic.category).toBe("General"); // Fallback category
      expect(transformedTopic.priority).toBe("low"); // Lower weighted score: (0.5*0.5 + 0.4*0.3 + 0.3*0.2) = 0.43
      expect(transformedTopic.contentType).toBe("General Content"); // Fallback content type
      expect(transformedTopic.score).toBe(43); // Calculated from low scores: 0.43 * 100 = 43
    });

    it("should handle multiple topics with correct ranking", () => {
      const topics = [mockTopic, mockSavedTopic, mockTopicWithMissingData];
      const result = transformTopicsToIdeas(topics);

      expect(result).toHaveLength(3);
      expect(result[0].ranking).toBe("#1");
      expect(result[1].ranking).toBe("#2");
      expect(result[2].ranking).toBe("#3");
    });

    it("should enhance tags correctly", () => {
      const result = transformTopicsToIdeas([mockTopic]);

      const tags = result[0].tags;
      expect(tags).toContain("AI");
      expect(tags).toContain("marketing");
      expect(tags).toContain("content-strategy");
      expect(tags).toContain("tools");
      expect(tags).toContain("channel:blog");
      expect(tags).toContain("channel:linkedin");
      expect(tags).toContain("audience:marketing professionals");
      expect(tags).toContain("audience:content creators");
      expect(tags.length).toBeLessThanOrEqual(8); // Should be limited to 8 tags
    });

    it("should calculate priority based on weighted scores", () => {
      const highScoreTopic: GeneratedTopic = {
        ...mockTopic,
        scores: { relevance: 0.9, freshness: 0.8, novelty: 0.7 },
      };

      const mediumScoreTopic: GeneratedTopic = {
        ...mockTopic,
        scores: { relevance: 0.7, freshness: 0.6, novelty: 0.5 },
      };

      const lowScoreTopic: GeneratedTopic = {
        ...mockTopic,
        scores: { relevance: 0.4, freshness: 0.3, novelty: 0.2 },
      };

      const results = transformTopicsToIdeas([
        highScoreTopic,
        mediumScoreTopic,
        lowScoreTopic,
      ]);

      expect(results[0].priority).toBe("high");
      expect(results[1].priority).toBe("medium");
      expect(results[2].priority).toBe("low");
    });

    it("should infer content type from channel fit", () => {
      const testCases = [
        { channel_fit: ["blog"], expected: "Blog Post" },
        { channel_fit: ["youtube"], expected: "Video Content" },
        { channel_fit: ["social"], expected: "Social Media" },
        { channel_fit: ["email"], expected: "Newsletter" },
        { channel_fit: ["podcast"], expected: "Podcast" },
        {
          channel_fit: ["unknown-channel"],
          expected: "Unknown-channel Content",
        },
        { channel_fit: [], expected: "General Content" },
      ];

      testCases.forEach(({ channel_fit, expected }) => {
        const topic = { ...mockTopic, channel_fit };
        const result = transformTopicsToIdeas([topic]);
        expect(result[0].contentType).toBe(expected);
      });
    });

    it("should handle empty topics array", () => {
      const result = transformTopicsToIdeas([]);
      expect(result).toEqual([]);
    });

    it("should handle invalid topics array", () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid input scenarios
      const result = transformTopicsToIdeas(null as any);
      expect(result).toEqual([]);
    });

    it("should format dates correctly", () => {
      const result = transformTopicsToIdeas([mockTopic]);

      expect(result[0].created).toBeDefined();
      expect(result[0].lastModified).toBeDefined();
      expect(result[0].updated).toMatch(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/); // e.g., "Dec 6, 2024"
    });

    it("should calculate estimated effort based on novelty", () => {
      const highNoveltyTopic = {
        ...mockTopic,
        scores: { ...mockTopic.scores, novelty: 0.9 },
      };
      const mediumNoveltyTopic = {
        ...mockTopic,
        scores: { ...mockTopic.scores, novelty: 0.5 },
      };
      const lowNoveltyTopic = {
        ...mockTopic,
        scores: { ...mockTopic.scores, novelty: 0.2 },
      };

      const results = transformTopicsToIdeas([
        highNoveltyTopic,
        mediumNoveltyTopic,
        lowNoveltyTopic,
      ]);

      expect(results[0].estimatedEffort).toBe("High");
      expect(results[1].estimatedEffort).toBe("Medium");
      expect(results[2].estimatedEffort).toBe("Low");
    });

    it("should handle topics with optimistic saving states", () => {
      const savingTopic: GeneratedTopic = {
        ...mockTopic,
        _isBeingSaved: true,
      };

      const optimisticallySavedTopic: GeneratedTopic = {
        ...mockTopic,
        _optimisticSaved: true,
      };

      const results = transformTopicsToIdeas([
        savingTopic,
        optimisticallySavedTopic,
      ]);

      expect(results[0].status).toBe("saving");
      expect(results[1].status).toBe("saved");
    });
  });
});
