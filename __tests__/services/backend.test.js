/**
 * Tests for Backend Service (JS version)
 */

import { BackendService } from "@/services/backend";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("BackendService", () => {
  let service;
  const mockFormData = {
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
      retry: {
        maxAttempts: 1,
        initialDelay: 1,
        maxDelay: 1,
        backoffMultiplier: 1,
        jitterFactor: 0,
        retryableErrors: [
          "network_error",
          "timeout_error",
          "server_error",
          "rate_limit_error",
          "abort_error",
        ],
      },
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
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
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

      await expect(service.generateTopics(mockFormData)).rejects.toMatchObject({
        type: "validation_error",
        message: "Please check your inputs and try again.",
      });
    });

    it("should handle malformed JSON responses", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error("Invalid JSON")),
        text: () => Promise.resolve(""),
      });

      await expect(service.generateTopics(mockFormData)).rejects.toMatchObject({
        type: "unknown_error",
        message:
          "An unexpected error occurred. Please try again or contact support.",
      });
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

      const complexFormData = {
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
        audience: "developers, tech-leads",
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
        wizardMode: "industry-first",
      });
    });
  });

  it("should handle network errors with retry logic", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      return Promise.reject(new Error("fetch failed"));
    });

    await expect(service.generateTopics(mockFormData)).rejects.toMatchObject({
      type: "network_error",
      message:
        "Unable to connect to our servers. Please check your internet connection and try again.",
    });
    expect(callCount).toBe(1); // With maxAttempts=1
  });

  it("should handle timeout errors", async () => {
    const timeoutErr = new Error("Timeout");
    timeoutErr.name = "TimeoutError";
    mockFetch.mockRejectedValue(timeoutErr);

    await expect(service.generateTopics(mockFormData)).rejects.toMatchObject({
      type: "timeout_error",
      message: "The request is taking longer than expected. Please try again.",
    });
  });

  it("should validate response format", async () => {
    const invalidResponse = {
      invalid: "response",
      missing_topics: true,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(invalidResponse),
      text: () => Promise.resolve(""),
    });

    await expect(service.generateTopics(mockFormData)).rejects.toMatchObject({
      type: "parsing_error",
      message:
        "We received an unexpected response. Please try generating topics again.",
    });
  });

  describe("Data Transformation Edge Cases", () => {
    beforeEach(() => {
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
    });

    it("should handle all undefined optional fields", async () => {
      const minimalFormData = {
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

      await service.generateTopics(minimalFormData);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.subject).toBeNull();
      expect(requestBody.keywords).toBeNull();
      expect(requestBody.exclude).toBeNull();
      expect(requestBody.focus).toBeNull();
      expect(requestBody.notes).toBeNull();
      expect(requestBody.region).toBeNull();
    });

    it("should handle custom industry and content type", async () => {
      const customFormData = {
        ...mockFormData,
        industry: "other",
        industry_other: "Cryptocurrency",
        content_type: "other",
        content_type_other: "Interactive Tutorial",
      };

      await service.generateTopics(customFormData);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.industry).toBe("Cryptocurrency");
      expect(requestBody.industry_other).toBe("Cryptocurrency");
      expect(requestBody.content_type).toBe("Interactive Tutorial");
      expect(requestBody.content_type_other).toBe("Interactive Tutorial");
    });

    it("should filter out empty values from arrays", async () => {
      const formDataWithEmptyValues = {
        ...mockFormData,
        demographic_age: ["", "25-34", "", "35-44", ""],
        demographic_location: "us",
      };

      await service.generateTopics(formDataWithEmptyValues);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.demographic_age).toEqual(["25-34", "35-44"]);
      expect(requestBody.demographic_location).toEqual(["us"]);
    });
  });

  describe("Error Handling", () => {
    it("should classify different error types correctly", async () => {
      const errorScenarios = [
        {
          mockError: new Error("Backend API error: 500 Internal Server Error"),
          expectedType: "server_error",
        },
        {
          mockError: new Error("Backend API error: 429 Too Many Requests"),
          expectedType: "rate_limit_error",
        },
        {
          mockError: new Error("Backend API error: 400 Bad Request"),
          expectedType: "validation_error",
        },
        {
          mockError: (() => {
            const error = new Error("Request aborted");
            error.name = "AbortError";
            return error;
          })(),
          expectedType: "abort_error",
        },
      ];

      for (const scenario of errorScenarios) {
        mockFetch.mockRejectedValue(scenario.mockError);

        await expect(
          service.generateTopics(mockFormData),
        ).rejects.toMatchObject({
          type: scenario.expectedType,
        });
      }
    });
  });

  describe("Configuration", () => {
    it("should validate backend configuration", () => {
      expect(() => {
        new BackendService({ baseUrl: "" });
      }).not.toThrow(); // Constructor doesn't validate, validation happens on request
    });

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

    it("should handle invalid URL configuration", async () => {
      const invalidService = new BackendService({ baseUrl: "invalid-url" });

      await expect(invalidService.generateTopics(mockFormData)).rejects.toThrow(
        "Invalid BACKEND_API_URL format",
      );
    });

    it("should handle missing URL configuration", async () => {
      const noUrlService = new BackendService({ baseUrl: "" });

      await expect(noUrlService.generateTopics(mockFormData)).rejects.toThrow(
        "Backend API URL is not configured",
      );
    });
  });
});
