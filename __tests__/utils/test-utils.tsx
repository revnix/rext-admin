/**
 * Custom testing utilities for React components
 *
 * Provides pre-configured providers and custom render function
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type React from "react";
import type { ReactElement } from "react";

/**
 * Create a fresh QueryClient for each test
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

/**
 * All providers wrapper for testing
 */
function AllTheProviders({ children }: { children: React.ReactNode }) {
  const testQueryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Custom render function with providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything
export * from "@testing-library/react";
export { customRender as render, createTestQueryClient };

/**
 * Mock Zustand store creator for testing
 */
export function createMockStore<T>(initialState: T) {
  let state = initialState;

  const setState = jest.fn(
    (newState: Partial<T> | ((state: T) => Partial<T>)) => {
      if (typeof newState === "function") {
        state = { ...state, ...newState(state) };
      } else {
        state = { ...state, ...newState };
      }
    },
  );

  const getState = jest.fn(() => state);

  return {
    getState,
    setState,
    subscribe: jest.fn(),
    destroy: jest.fn(),
  };
}

/**
 * Mock API response helpers
 */
export const mockApiResponse = {
  success: <T,>(data: T) => ({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  }),
  error: (status: number, message: string) => ({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
  }),
};

/**
 * Wait for async operations to complete
 */
export const waitForAsync = () =>
  new Promise((resolve) => setTimeout(resolve, 0));
