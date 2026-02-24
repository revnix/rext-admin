/**
 * Test for BackendService deleteTopics direct API implementation
 */

import { BackendService } from "@/services/backend";
import { resolveApiBaseUrl } from "@/lib/api-base-url";

// Mock fetch globally
global.fetch = jest.fn();

describe("BackendService deleteTopics", () => {
  let backendService: BackendService;

  beforeEach(() => {
    // Reset mock and create new service instance
    (fetch as jest.Mock).mockClear();
    backendService = new BackendService({
      baseUrl: resolveApiBaseUrl(),
      timeout: 5000,
    });

    // API key authentication handled by backend - no client-side key needed
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("direct delete implementation", () => {
    it("should make direct request to backend API", async () => {
      const mockResponse = {
        success: true,
        deleted_count: 2,
        message: "2 topics deleted successfully",
        topic_ids: ["topic_1", "topic_2"],
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const topicIds = ["topic_1", "topic_2"];
      const result = await backendService.deleteTopics(
        topicIds,
        "test-workspace-id",
      );

      // Verify the direct API call
      expect(fetch).toHaveBeenCalledWith(
        `${resolveApiBaseUrl()}/api/v1/topic/delete-topic`,
        expect.objectContaining({
          method: "DELETE",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "content-api-key": "test-api-key",
            "X-Request-ID": expect.any(String),
          }),
          body: JSON.stringify({ topic_ids: topicIds }),
          signal: expect.any(AbortSignal),
        }),
      );

      // Verify the response
      expect(result).toEqual(mockResponse);
    });

    it("should validate configuration before making request", async () => {
      // Create service without proper configuration
      const unconfiguredService = new BackendService({
        baseUrl: "",
      });

      await expect(
        unconfiguredService.deleteTopics(["topic_1"], "test-workspace-id"),
      ).rejects.toThrow("Backend API URL is not configured");
    });

    it("should throw error for empty topic IDs", async () => {
      await expect(
        backendService.deleteTopics([], "test-workspace-id"),
      ).rejects.toThrow("No topic IDs provided for deletion");

      await expect(
        backendService.deleteTopics([], "test-workspace-id"),
      ).rejects.toThrow("No topic IDs provided for deletion");
    });

    it("should handle backend API errors properly", async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: () => Promise.resolve("Server error occurred"),
      });

      await expect(
        backendService.deleteTopics(["topic_1"], "test-workspace-id"),
      ).rejects.toThrow("Backend API error: 500 Internal Server Error");

      // Verify it made the direct API call
      expect(fetch).toHaveBeenCalledWith(
        `${resolveApiBaseUrl()}/api/v1/topic/delete-topic`,
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });

    it("should include request timeout", async () => {
      const timeoutService = new BackendService({
        baseUrl: "http://localhost:2024",
        timeout: 100, // Very short timeout for testing
      });

      // Mock a hanging request
      (fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const deletePromise = timeoutService.deleteTopics(
        ["topic_1"],
        "test-workspace-id",
      );

      // Should timeout quickly
      await expect(deletePromise).rejects.toThrow();
    }, 10000); // Increase Jest timeout for this test

    it("should use DELETE method instead of proxy route", async () => {
      const mockResponse = {
        success: true,
        deleted_count: 1,
        message: "1 topic deleted successfully",
        topic_ids: ["topic_1"],
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await backendService.deleteTopics(["topic_1"], "test-workspace-id");

      // Verify it's NOT calling the Next.js API route
      expect(fetch).not.toHaveBeenCalledWith(
        "/api/v1/topics/delete",
        expect.any(Object),
      );

      // Verify it IS calling the backend directly with DELETE method
      expect(fetch).toHaveBeenCalledWith(
        `${resolveApiBaseUrl()}/api/v1/topic/delete-topic`,
        expect.objectContaining({
          method: "DELETE",
        }),
      );
    });

    it("should handle network errors", async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      await expect(
        backendService.deleteTopics(["topic_1"], "test-workspace-id"),
      ).rejects.toThrow("Network error");
    });

    it("should pass correct payload format", async () => {
      const mockResponse = { success: true, deleted_count: 1 };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const topicIds = ["topic_1", "topic_2", "topic_3"];
      await backendService.deleteTopics(topicIds, "test-workspace-id");

      // Verify the payload format matches backend expectation
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ topic_ids: topicIds }),
        }),
      );
    });
  });

  describe("comparison with other direct endpoints", () => {
    it("should follow same pattern as generateTopics and saveTopics", async () => {
      const mockResponse = { success: true, deleted_count: 1 };
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await backendService.deleteTopics(["topic_1"], "test-workspace-id");

      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const [url, options] = fetchCall;

      // Should use base URL like other direct endpoints
      expect(url).toBe(`${resolveApiBaseUrl()}/api/v1/topic/delete-topic`);

      // Should include API key header like other direct endpoints
      expect(options.headers["content-api-key"]).toBe("test-api-key");

      // Should include request ID like other direct endpoints
      expect(options.headers["X-Request-ID"]).toBeDefined();

      // Should have timeout support like other direct endpoints
      expect(options.signal).toBeInstanceOf(AbortSignal);
    });
  });
});
