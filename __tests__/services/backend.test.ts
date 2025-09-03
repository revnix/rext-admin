/**
 * Tests for Backend Service
 */

import { BackendService } from "@/services/backend";
import type { TopicBuilderFormData } from "@/types/topic-builder";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("BackendService", () => {
  let service: BackendService;
  const mockFormData: TopicBuilderFormData = {
    wizardMode: "industry-first",
    industry: "technology",
    content_type: "blog-post",
    purpose: ["educate-inform"],
    content_goal: ["tutorial"],
    tone: ["professional-formal"],
    num_ideas: 5,
    demographic_age: [],
    demographic_location: "global",
  };

  beforeEach(() => {
    service = new BackendService({
      baseUrl: "http://localhost:2024",
      timeout: 30000,
    });
    mockFetch.mockClear();
  });

  describe("generateTopics", () => {
    it("should successfully generate topics", async () => {
      const mockResponse = {
        topics: [
          {
            id: "1",
            title: "Test Topic",
            angle: "Test Angle",
            description: "Test Description",
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
        generated_at: "2025-09-03T16:30:00.000Z",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
        text: () => Promise.resolve(""),
      });

      const result = await service.generateTopics(mockFormData);

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:2024/api/topic/generate-topic",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: expect.stringContaining("technology"),
        }),
      );

      expect(result.topics).toEqual(expect.any(Array));
      expect(result.request_id).toBe("test-request-id");
      expect(result.topics.length).toBe(1);
      expect(result.topics[0].title).toBe("Test Topic");
    });

    it("should handle HTTP error responses", async () => {
      const mockErrorResponse = {
        error: "Invalid request",
        details: "Missing required fields",
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve(mockErrorResponse),
        text: () => Promise.resolve("Bad Request"),
        statusText: "Bad Request",
      });

      await expect(service.generateTopics(mockFormData)).rejects.toThrow(
        "Backend API error",
      );
    });

    it("should handle malformed JSON responses", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error("Invalid JSON")),
        text: () => Promise.resolve(""),
      });

      await expect(service.generateTopics(mockFormData)).rejects.toThrow(
        "Invalid JSON",
      );
    });

    it("should transform form data correctly", async () => {
      const mockResponse = {
        topics: [],
        request_id: "test-id",
        generated_at: new Date().toISOString(),
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
        text: () => Promise.resolve(""),
      });

      const complexFormData: TopicBuilderFormData = {
        ...mockFormData,
        subject: "AI Development",
        platform: "linkedin",
        audience: ["developers", "tech-leads"],
        keywords: "machine learning, AI",
        exclude: "basic tutorials",
        focus: "advanced concepts",
        notes: "Technical depth required",
        region: "us",
        language: "english",
        is_ymyl: false,
        fresh_vs_evergreen: "balanced",
        safe_vs_original: "original",
      };

      await service.generateTopics(complexFormData);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody).toMatchObject({
        industry: "technology",
        subject: "AI Development",
        content_type: "blog-post",
        platform: "linkedin",
        audience: ["developers", "tech-leads"],
        purpose: ["educate-inform"],
        tone: ["professional-formal"],
        keywords: "machine learning, AI",
        exclude: "basic tutorials",
        num_ideas: 5,
        industry_specific_focus: "advanced concepts",
        additional_notes: "Technical depth required",
        content_timing_preference: "balanced",
        content_originality_preference: "original",
        demographic_location: ["global"],
        wizard_mode: "industry-first",
      });
    });
  });

  describe("Configuration", () => {
    it("should use custom configuration", () => {
      const customService = new BackendService({
        baseUrl: "https://api.example.com",
        timeout: 60000,
      });

      expect(customService).toBeDefined();
    });

    it("should use default configuration", () => {
      const defaultService = new BackendService();
      expect(defaultService).toBeDefined();
    });
  });
});
