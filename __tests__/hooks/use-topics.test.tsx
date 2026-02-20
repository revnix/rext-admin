/**
 * Tests for useTopics hook - modern TanStack Query testing approach
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useTopic, useTopics } from "@/hooks/use-topics";
import { renderHook, waitFor } from "../utils/test-utils";
import { resolveApiBaseUrl } from "@/lib/api-base-url";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock environment variables - backend URL is safe to expose, API key handled server-side

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useTopics", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("should fetch topics successfully", async () => {
    const mockTopics = [
      {
        id: "1",
        title: "Test Topic",
        description: "Test Description",
        scores: {
          relevance: 0.8,
          seo_potential: 0.7,
          trend_level: 0.6,
          uniqueness: 0.9,
          reader_interest: 0.8,
          actionable_potential: 0.7,
          brand_alignment: 0.8,
          controversy: 0.2,
        },
        tags: ["test"],
        channel_fit: ["blog"],
        audience_fit: ["developers"],
        why_it_works: "It's relevant",
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: { topics: mockTopics },
        status: "success",
      }),
    });

    const { result } = renderHook(() => useTopics("test-workspace-id"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTopics);
    expect(mockFetch).toHaveBeenCalledWith(
      `${resolveApiBaseUrl()}/api/v1/topic/get-topics`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Content-API-Key": "test-api-key",
        },
      },
    );
  });

  it("should handle fetch error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useTopics("test-workspace-id"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe("useTopic", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("should fetch single topic successfully", async () => {
    const mockTopic = {
      id: "1",
      title: "Test Topic",
      description: "Test Description",
      scores: {
        relevance: 0.8,
        seo_potential: 0.7,
        trend_level: 0.6,
        uniqueness: 0.9,
        reader_interest: 0.8,
        actionable_potential: 0.7,
        brand_alignment: 0.8,
        controversy: 0.2,
      },
      tags: ["test"],
      channel_fit: ["blog"],
      audience_fit: ["developers"],
      why_it_works: "It's relevant",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: mockTopic,
        status: "success",
      }),
    });

    const { result } = renderHook(() => useTopic("1", "test-workspace-id"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockTopic);
    expect(mockFetch).toHaveBeenCalledWith(
      `${resolveApiBaseUrl()}/api/v1/topic/get-topic/1`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Content-API-Key": "test-api-key",
        },
      },
    );
  });

  it("should handle 404 error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "Not found",
    });

    const { result } = renderHook(
      () => useTopic("nonexistent", "test-workspace-id"),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it("should not fetch when id is empty", async () => {
    const { result } = renderHook(() => useTopic("", "test-workspace-id"), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
