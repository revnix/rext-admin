/**
 * Tests for Topic Generation API Route
 */

import type { NextRequest } from "next/server";
import { POST } from "@/app/api/generate-topics/route";
import { backendService } from "@/services/backend";
import type {
  BackendError,
  BackendTopicGenerationResponse,
} from "@/types/backend";
import type { TopicBuilderFormData } from "@/types/topic-builder";

// Mock the backend service
jest.mock("@/services/backend", () => ({
  backendService: {
    generateTopics: jest.fn(),
  },
}));

const mockBackendService = backendService as jest.Mocked<typeof backendService>;

describe("/api/generate-topics", () => {
  const mockFormData: TopicBuilderFormData = {
    wizardMode: "industry-first",
    industry: "technology",
    content_type: "blog-post",
    purpose: ["educate-inform"],
    tone: ["professional-formal"],
    num_ideas: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn(); // Mock console.error to avoid noise in tests
  });

  describe("Valid Requests", () => {
    it("should successfully generate topics with valid request", async () => {
      const mockBackendResponse: BackendTopicGenerationResponse = {
        topics: [
          {
            id: "1",
            title: "Introduction to TypeScript for React Developers",
            angle:
              "Step-by-step guide for JavaScript developers transitioning to TypeScript",
            channel_fit: ["blog", "tutorial"],
            audience_fit: ["developers", "javascript-developers"],
            why_it_works:
              "Addresses common pain points when learning TypeScript",
            scores: {
              relevance: 0.9,
              freshness: 0.7,
              novelty: 0.6,
            },
            tags: ["typescript", "react", "javascript", "tutorial"],
          },
        ],
        request_id: "req_test_123",
        model_used: "gpt-4",
        generation_time_ms: 2500,
      };

      mockBackendService.generateTopics.mockResolvedValue(mockBackendResponse);

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ formData: mockFormData }),
      });

      const response = await POST(request as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.topics).toEqual(mockBackendResponse.topics);
      expect(responseData.request_id).toBe("req_test_123");
      expect(responseData.model_used).toBe("gpt-4");
      expect(responseData.generation_time_ms).toBe(2500);
      expect(responseData.generated_at).toBeDefined();

      expect(mockBackendService.generateTopics).toHaveBeenCalledWith(
        mockFormData,
      );
    });

    it("should handle minimal valid form data", async () => {
      const minimalFormData: TopicBuilderFormData = {
        wizardMode: "industry-first",
        industry: "education",
        content_type: "blog-post",
        purpose: ["educate-inform"],
        tone: ["friendly-warm"],
        num_ideas: 3,
      };

      const mockResponse: BackendTopicGenerationResponse = {
        topics: [],
        request_id: "req_minimal_123",
      };

      mockBackendService.generateTopics.mockResolvedValue(mockResponse);

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: minimalFormData }),
      });

      const response = await POST(request as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.topics).toEqual([]);
      expect(responseData.request_id).toBe("req_minimal_123");
    });
  });

  describe("Invalid Requests", () => {
    it("should return 400 for missing form data", async () => {
      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const response = await POST(request as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe("Invalid request data");
      expect(responseData.error_code).toBe("validation_failed");
      expect(responseData.details).toContain(
        "Missing required field: industry",
      );
    });

    it("should return 400 for null form data", async () => {
      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: null }),
      });

      const response = await POST(request as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe("Invalid request data");
    });

    it("should return 400 for missing industry field", async () => {
      const invalidFormData = {
        wizardMode: "industry-first",
        content_type: "blog-post",
        // industry field missing
      };

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: invalidFormData }),
      });

      const response = await POST(request as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error_code).toBe("validation_failed");
    });

    it("should handle malformed JSON in request body", async () => {
      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json{",
      });

      const response = await POST(request as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBeDefined();
    });
  });

  describe("Backend Error Handling", () => {
    it("should handle validation errors from backend service", async () => {
      const validationError: BackendError = {
        type: "validation_error",
        message: "Invalid input parameters",
        technicalMessage: "Field validation failed",
        severity: "low",
        recoveryActions: ["go_back", "retry_with_changes"],
        isRetryable: false,
        timestamp: new Date().toISOString(),
      };

      mockBackendService.generateTopics.mockRejectedValue(validationError);

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: mockFormData }),
      });

      const response = await POST(request as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(422);
      expect(responseData.error_code).toBe("validation_error");
      expect(responseData.error).toBe("Invalid input parameters");
      expect(responseData.details).toBe("Field validation failed");
      expect(responseData.fallback_available).toBe(false);
    });

    it("should handle server errors from backend service", async () => {
      const serverError: BackendError = {
        type: "server_error",
        message: "Internal server error",
        statusCode: 500,
        severity: "high",
        recoveryActions: ["retry", "contact_support"],
        isRetryable: true,
        timestamp: new Date().toISOString(),
      };

      mockBackendService.generateTopics.mockRejectedValue(serverError);

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: mockFormData }),
      });

      const response = await POST(request as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(503);
      expect(responseData.error_code).toBe("server_error");
      expect(responseData.error).toBe("Internal server error");
    });

    it("should handle rate limit errors with retry-after header", async () => {
      const rateLimitError: BackendError = {
        type: "rate_limit_error",
        message: "Too many requests",
        severity: "medium",
        recoveryActions: ["retry"],
        isRetryable: true,
        timestamp: new Date().toISOString(),
      };

      mockBackendService.generateTopics.mockRejectedValue(rateLimitError);

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: mockFormData }),
      });

      const response = await POST(request as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(429);
      expect(responseData.error_code).toBe("rate_limit_error");
      expect(responseData.retry_after).toBe(60);
      expect(response.headers.get("Retry-After")).toBe("60");
    });

    it("should handle timeout errors", async () => {
      const timeoutError: BackendError = {
        type: "timeout_error",
        message: "Request timed out",
        severity: "medium",
        recoveryActions: ["retry", "go_back"],
        isRetryable: true,
        timestamp: new Date().toISOString(),
      };

      mockBackendService.generateTopics.mockRejectedValue(timeoutError);

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: mockFormData }),
      });

      const response = await POST(request as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(504);
      expect(responseData.error_code).toBe("timeout_error");
      expect(responseData.error).toBe("Request timed out");
    });

    it("should handle configuration errors", async () => {
      const configError: BackendError = {
        type: "configuration_error",
        message: "Backend API URL is not configured",
        severity: "critical",
        recoveryActions: ["contact_support"],
        isRetryable: false,
        timestamp: new Date().toISOString(),
      };

      mockBackendService.generateTopics.mockRejectedValue(configError);

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: mockFormData }),
      });

      const response = await POST(request as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error_code).toBe("configuration_error");
    });

    it("should handle unknown errors gracefully", async () => {
      const unknownError = new Error("Something unexpected happened");

      mockBackendService.generateTopics.mockRejectedValue(unknownError);

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: mockFormData }),
      });

      const response = await POST(request as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error_code).toBe("unknown_error");
      expect(responseData.error).toBeDefined();
    });
  });

  describe("Request Headers and Logging", () => {
    beforeEach(() => {
      // Reset console.error mock
      (console.error as jest.Mock).mockClear();
    });

    it("should log errors with request context", async () => {
      const testError = new Error("Test error for logging");
      mockBackendService.generateTopics.mockRejectedValue(testError);

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "TestBot/1.0",
          "X-Request-ID": "req_test_456",
        },
        body: JSON.stringify({ formData: mockFormData }),
      });

      await POST(request as NextRequest);

      expect(console.error).toHaveBeenCalledWith(
        "Topic generation API error:",
        expect.objectContaining({
          type: "unknown_error",
          endpoint: "/api/generate-topics",
          userAgent: "TestBot/1.0",
          requestId: "req_test_456",
        }),
      );
    });

    it("should handle missing headers gracefully", async () => {
      const testError = new Error("Test error");
      mockBackendService.generateTopics.mockRejectedValue(testError);

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: mockFormData }),
      });

      await POST(request as NextRequest);

      expect(console.error).toHaveBeenCalledWith(
        "Topic generation API error:",
        expect.objectContaining({
          userAgent: null,
          requestId: null,
        }),
      );
    });
  });

  describe("Response Format Validation", () => {
    it("should include all required response fields for successful requests", async () => {
      const mockResponse: BackendTopicGenerationResponse = {
        topics: [
          {
            id: "topic-1",
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
            tags: ["test"],
          },
        ],
        request_id: "req_format_test",
        model_used: "test-model",
        generation_time_ms: 1500,
      };

      mockBackendService.generateTopics.mockResolvedValue(mockResponse);

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: mockFormData }),
      });

      const response = await POST(request as NextRequest);
      const responseData = await response.json();

      expect(responseData).toHaveProperty("topics");
      expect(responseData).toHaveProperty("request_id");
      expect(responseData).toHaveProperty("generated_at");
      expect(responseData).toHaveProperty("model_used");
      expect(responseData).toHaveProperty("generation_time_ms");

      expect(Array.isArray(responseData.topics)).toBe(true);
      expect(typeof responseData.request_id).toBe("string");
      expect(new Date(responseData.generated_at)).toBeInstanceOf(Date);
    });

    it("should include all required error response fields", async () => {
      const testError: BackendError = {
        type: "network_error",
        message: "Connection failed",
        technicalMessage: "ECONNRESET",
        severity: "high",
        recoveryActions: ["retry"],
        isRetryable: true,
        requestId: "req_error_test",
        timestamp: new Date().toISOString(),
      };

      mockBackendService.generateTopics.mockRejectedValue(testError);

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: mockFormData }),
      });

      const response = await POST(request as NextRequest);
      const responseData = await response.json();

      expect(responseData).toHaveProperty("error");
      expect(responseData).toHaveProperty("error_code");
      expect(responseData).toHaveProperty("details");
      expect(responseData).toHaveProperty("fallback_available");
      expect(responseData).toHaveProperty("request_id");

      expect(responseData.error).toBe("Connection failed");
      expect(responseData.error_code).toBe("network_error");
      expect(responseData.details).toBe("ECONNRESET");
      expect(responseData.fallback_available).toBe(false);
      expect(responseData.request_id).toBe("req_error_test");
    });
  });

  describe("Form Data Validation Edge Cases", () => {
    it("should handle empty string industry", async () => {
      const invalidFormData = {
        ...mockFormData,
        industry: "",
      };

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: invalidFormData }),
      });

      const response = await POST(request as NextRequest);
      expect(response.status).toBe(400);
    });

    it("should handle whitespace-only industry", async () => {
      const invalidFormData = {
        ...mockFormData,
        industry: "   ",
      };

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: invalidFormData }),
      });

      const response = await POST(request as NextRequest);
      expect(response.status).toBe(400);
    });
  });

  describe("Status Code Mapping", () => {
    it("should map error types to correct HTTP status codes", async () => {
      const errorMappings = [
        { errorType: "validation_error", expectedStatus: 422 },
        { errorType: "authentication_error", expectedStatus: 401 },
        { errorType: "rate_limit_error", expectedStatus: 429 },
        { errorType: "server_error", expectedStatus: 503 },
        { errorType: "configuration_error", expectedStatus: 500 },
        { errorType: "parsing_error", expectedStatus: 502 },
        { errorType: "timeout_error", expectedStatus: 504 },
        { errorType: "network_error", expectedStatus: 503 },
        { errorType: "cors_error", expectedStatus: 500 },
        { errorType: "abort_error", expectedStatus: 499 },
        { errorType: "unknown_error", expectedStatus: 500 },
      ];

      for (const mapping of errorMappings) {
        const testError: BackendError = {
          type: mapping.errorType,
          message: `Test ${mapping.errorType}`,
          severity: "medium",
          recoveryActions: ["retry"],
          isRetryable: true,
          timestamp: new Date().toISOString(),
        };

        mockBackendService.generateTopics.mockRejectedValue(testError);

        const request = new Request(
          "http://localhost:3000/api/generate-topics",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ formData: mockFormData }),
          },
        );

        const response = await POST(request as NextRequest);
        expect(response.status).toBe(mapping.expectedStatus);
      }
    });
  });

  describe("Integration Flow", () => {
    it("should complete successful end-to-end flow", async () => {
      const completeFormData: TopicBuilderFormData = {
        wizardMode: "subject-first",
        subject: "AI in Healthcare",
        industry: "healthcare",
        content_type: "blog-post",
        platform: "linkedin",
        audience: ["doctors", "healthcare-administrators"],
        purpose: ["educate-inform", "thought-leadership"],
        tone: ["professional-formal", "technical-analytical"],
        num_ideas: 7,
        notes: "Focus on practical applications",
      };

      const comprehensiveResponse: BackendTopicGenerationResponse = {
        topics: [
          {
            id: "healthcare-ai-1",
            title:
              "AI-Powered Diagnostic Tools: Revolutionizing Healthcare Decision Making",
            angle:
              "Practical implementation guide for healthcare professionals",
            description: "Comprehensive overview of AI diagnostic applications",
            channel_fit: ["linkedin", "blog", "whitepaper"],
            audience_fit: [
              "doctors",
              "healthcare-administrators",
              "medical-professionals",
            ],
            why_it_works:
              "Addresses current needs in healthcare AI adoption with practical focus",
            scores: {
              relevance: 0.95,
              freshness: 0.85,
              novelty: 0.75,
            },
            tags: ["ai", "healthcare", "diagnostics", "machine-learning"],
          },
        ],
        request_id: "req_comprehensive_789",
        model_used: "gpt-4-turbo",
        generation_time_ms: 3200,
      };

      mockBackendService.generateTopics.mockResolvedValue(
        comprehensiveResponse,
      );

      const request = new Request("http://localhost:3000/api/generate-topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "NextJS/15.5.0",
          "X-Request-ID": "frontend-req-123",
        },
        body: JSON.stringify({ formData: completeFormData }),
      });

      const response = await POST(request as NextRequest);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.topics).toHaveLength(1);
      expect(responseData.topics[0]).toMatchObject({
        id: "healthcare-ai-1",
        title: expect.stringContaining("AI-Powered"),
        angle: expect.stringContaining("implementation"),
        scores: {
          relevance: 0.95,
          freshness: 0.85,
          novelty: 0.75,
        },
        tags: expect.arrayContaining(["ai", "healthcare"]),
      });
      expect(responseData.request_id).toBe("req_comprehensive_789");
      expect(responseData.model_used).toBe("gpt-4-turbo");
      expect(responseData.generation_time_ms).toBe(3200);

      expect(mockBackendService.generateTopics).toHaveBeenCalledWith(
        completeFormData,
      );
    });
  });
});
