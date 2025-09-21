/**
 * Comprehensive Tests for TopicActions Component
 * Covers save functionality, optimistic updates, error handling, and user interactions
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopicActions } from "@/components/topic-builder/results/TopicActions";
import * as useTopicMutationsModule from "@/hooks/useTopicMutations";
import * as errorUtilsModule from "@/lib/error-utils";
import type { BackendError } from "@/types/backend";
import type { GeneratedTopic } from "@/types/topic-builder";

// Mock the custom hooks and utilities
jest.mock("@/hooks/useTopicMutations");
jest.mock("@/lib/error-utils");

// Mock UI components that aren't critical for save functionality testing
jest.mock("@/components/ui/error-alert", () => ({
  ErrorAlert: ({
    error,
    operation,
    onRetry,
  }: {
    error: { type: string };
    operation: string;
    onRetry: () => void;
  }) => (
    <div data-testid="error-alert">
      <div>Error: {error.type}</div>
      <div>Operation: {operation}</div>
      <button type="button" onClick={onRetry} data-testid="retry-button">
        Retry
      </button>
    </div>
  ),
  SuccessAlert: ({ message }: { message: string }) => (
    <div data-testid="success-alert">{message}</div>
  ),
}));

const mockTopic: GeneratedTopic = {
  id: "test-topic-1",
  title: "Test Topic",
  angle: "Test angle",
  description: "Test description",
  channel_fit: ["blog", "social-media"],
  audience_fit: ["developers", "marketers"],
  why_it_works: "Test reasoning",
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
  tags: ["tech", "marketing"],
  is_saved: false,
  created_at: "2024-01-01T00:00:00Z",
  _optimisticSaved: false,
  _isBeingSaved: false,
};

const mockSavedTopic: GeneratedTopic = {
  ...mockTopic,
  is_saved: true,
};

const mockOptimisticTopic: GeneratedTopic = {
  ...mockTopic,
  _optimisticSaved: true,
};

const mockBackendError: BackendError = {
  type: "network_error",
  message: "Network request failed",
  severity: "high",
  recoveryActions: ["retry", "contact_support"],
  isRetryable: true,
  timestamp: new Date().toISOString(),
};

describe("TopicActions Component", () => {
  let queryClient: QueryClient;
  let mockMutate: jest.Mock;
  let mockMutateAsync: jest.Mock;
  let mockClassifyError: jest.Mock;

  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    // Create a new QueryClient for each test to ensure isolation
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Setup mocks
    mockMutate = jest.fn();
    mockMutateAsync = jest.fn();
    mockClassifyError = jest.fn();

    // Mock the useTopicSaveMutation hook
    const mockUseTopicSaveMutation = jest.mocked(
      useTopicMutationsModule.useTopicSaveMutation,
    );
    mockUseTopicSaveMutation.mockReturnValue({
      mutate: mockMutate,
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: undefined,
      reset: jest.fn(),
      // biome-ignore lint/suspicious/noExplicitAny: Required for mock typing
    } as any);

    // Mock classifyError utility
    const mockClassifyErrorFn = jest.mocked(errorUtilsModule.classifyError);
    mockClassifyErrorFn.mockImplementation(mockClassifyError);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render dropdown variant by default", () => {
      render(<TopicActions topic={mockTopic} />, { wrapper: createWrapper });

      const dropdownTrigger = screen.getByRole("button");
      expect(dropdownTrigger).toBeInTheDocument();
      expect(dropdownTrigger).toHaveClass("h-8", "w-8", "p-0"); // Dropdown variant styles
    });

    it("should render button variant when specified", () => {
      render(
        <TopicActions
          topic={mockTopic}
          variant="buttons"
          onSave={jest.fn()}
          onEdit={jest.fn()}
        />,
        { wrapper: createWrapper },
      );

      // Should render multiple buttons instead of dropdown
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(1);
    });

    it("should show labels when showLabels is true", () => {
      render(
        <TopicActions
          topic={mockTopic}
          variant="buttons"
          showLabels={true}
          onSave={jest.fn()}
        />,
        { wrapper: createWrapper },
      );

      expect(screen.getByText("Save")).toBeInTheDocument();
    });

    it("should only render available actions based on props", () => {
      render(
        <TopicActions
          topic={mockTopic}
          onSave={jest.fn()}
          // Only onSave provided, others should not appear
        />,
        { wrapper: createWrapper },
      );

      userEvent.click(screen.getByRole("button"));

      waitFor(() => {
        expect(screen.getByText("Save Topic")).toBeInTheDocument();
        expect(screen.queryByText("Edit Topic")).not.toBeInTheDocument();
        expect(screen.queryByText("Delete")).not.toBeInTheDocument();
      });
    });
  });

  describe("Save Operation - Success Cases", () => {
    it("should call mutation when save is clicked", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({ saved_count: 1 });

      render(<TopicActions topic={mockTopic} onSave={jest.fn()} />, {
        wrapper: createWrapper,
      });

      // Open dropdown and click save
      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Save Topic"));

      expect(mockMutateAsync).toHaveBeenCalledWith(mockTopic);
    });

    it("should call onSave callback after successful mutation", async () => {
      const user = userEvent.setup();
      const mockOnSave = jest.fn();
      mockMutateAsync.mockResolvedValue({ saved_count: 1 });

      render(<TopicActions topic={mockTopic} onSave={mockOnSave} />, {
        wrapper: createWrapper,
      });

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Save Topic"));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(mockTopic.id);
      });
    });

    it("should display success message after successful save", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({ saved_count: 1 });

      render(<TopicActions topic={mockTopic} onSave={jest.fn()} />, {
        wrapper: createWrapper,
      });

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Save Topic"));

      await waitFor(() => {
        expect(screen.getByTestId("success-alert")).toHaveTextContent(
          'Topic "Test Topic" saved successfully!',
        );
      });
    });

    it("should work without onSave callback", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({ saved_count: 1 });

      render(<TopicActions topic={mockTopic} />, { wrapper: createWrapper });

      // If no onSave is provided, the Save Topic option shouldn't appear in dropdown
      await user.click(screen.getByRole("button"));
      expect(screen.queryByText("Save Topic")).not.toBeInTheDocument();
    });
  });

  describe("Save Operation - Loading States", () => {
    it("should show loading state during save operation", async () => {
      // Mock isPending state
      const mockUseTopicSaveMutation = jest.mocked(
        useTopicMutationsModule.useTopicSaveMutation,
      );
      mockUseTopicSaveMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        mutate: jest.fn(),
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
        // biome-ignore lint/suspicious/noExplicitAny: Required for mock typing
      } as any);

      render(<TopicActions topic={mockTopic} onSave={jest.fn()} />, {
        wrapper: createWrapper,
      });

      // Button should show loading state
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();

      // Should show loading spinner (lucide's Loader2 component)
      expect(screen.getByRole("button")).toContainHTML("animate-spin");
    });

    it("should disable all actions when any operation is loading", async () => {
      const mockUseTopicSaveMutation = jest.mocked(
        useTopicMutationsModule.useTopicSaveMutation,
      );
      mockUseTopicSaveMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        mutate: jest.fn(),
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
        // biome-ignore lint/suspicious/noExplicitAny: Required for mock typing
      } as any);

      render(
        <TopicActions
          topic={mockTopic}
          onSave={jest.fn()}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
        />,
        { wrapper: createWrapper },
      );

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("Save Operation - Error Handling", () => {
    it("should display error message when save fails", async () => {
      const user = userEvent.setup();
      const mockError = new Error("Save failed");
      mockMutateAsync.mockRejectedValue(mockError);
      mockClassifyError.mockReturnValue(mockBackendError);

      render(<TopicActions topic={mockTopic} onSave={jest.fn()} />, {
        wrapper: createWrapper,
      });

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Save Topic"));

      await waitFor(() => {
        expect(mockClassifyError).toHaveBeenCalledWith(mockError);
        expect(screen.getByTestId("error-alert")).toBeInTheDocument();
      });
    });

    it("should support retry functionality on error", async () => {
      const user = userEvent.setup();
      const mockError = new Error("Save failed");
      mockMutateAsync
        .mockRejectedValueOnce(mockError) // First call fails
        .mockResolvedValueOnce({ saved_count: 1 }); // Second call succeeds
      mockClassifyError.mockReturnValue(mockBackendError);

      render(<TopicActions topic={mockTopic} onSave={jest.fn()} />, {
        wrapper: createWrapper,
      });

      // Initial save fails
      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Save Topic"));

      await waitFor(() => {
        expect(screen.getByTestId("error-alert")).toBeInTheDocument();
      });

      // Retry should work
      await user.click(screen.getByTestId("retry-button"));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId("success-alert")).toBeInTheDocument();
      });
    });

    it("should clear previous errors when retrying", async () => {
      const user = userEvent.setup();
      const mockError = new Error("Save failed");
      mockMutateAsync
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({ saved_count: 1 });
      mockClassifyError.mockReturnValue(mockBackendError);

      render(<TopicActions topic={mockTopic} onSave={jest.fn()} />, {
        wrapper: createWrapper,
      });

      // Cause error
      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Save Topic"));

      await waitFor(() => {
        expect(screen.getByTestId("error-alert")).toBeInTheDocument();
      });

      // Retry
      await user.click(screen.getByTestId("retry-button"));

      await waitFor(() => {
        expect(screen.queryByTestId("error-alert")).not.toBeInTheDocument();
        expect(screen.getByTestId("success-alert")).toBeInTheDocument();
      });
    });

    it("should log errors to console", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const user = userEvent.setup();
      const mockError = new Error("Save failed");
      mockMutateAsync.mockRejectedValue(mockError);
      mockClassifyError.mockReturnValue(mockBackendError);

      render(<TopicActions topic={mockTopic} onSave={jest.fn()} />, {
        wrapper: createWrapper,
      });

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Save Topic"));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          `Failed to save topic ${mockTopic.id}:`,
          mockError,
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Optimistic Updates Integration", () => {
    it("should handle optimistic saved state in UI", () => {
      render(<TopicActions topic={mockOptimisticTopic} onSave={jest.fn()} />, {
        wrapper: createWrapper,
      });

      // Component should be aware of optimistic state
      // (This would be tested through integration with TopicCard which shows optimistic indicators)
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should handle permanently saved state", () => {
      render(<TopicActions topic={mockSavedTopic} onSave={jest.fn()} />, {
        wrapper: createWrapper,
      });

      // Should still allow saving even if already saved (for updates)
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("User Interactions and Accessibility", () => {
    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();

      render(<TopicActions topic={mockTopic} onSave={jest.fn()} />, {
        wrapper: createWrapper,
      });

      const button = screen.getByRole("button");

      // Focus and activate with keyboard
      button.focus();
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(screen.getByText("Save Topic")).toBeInTheDocument();
      });
    });

    it("should prevent interaction when disabled", async () => {
      const mockUseTopicSaveMutation = jest.mocked(
        useTopicMutationsModule.useTopicSaveMutation,
      );
      mockUseTopicSaveMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true, // This should disable the button
        mutate: jest.fn(),
        isError: false,
        isSuccess: false,
        error: null,
        data: undefined,
        reset: jest.fn(),
        // biome-ignore lint/suspicious/noExplicitAny: Required for mock typing
      } as any);

      render(<TopicActions topic={mockTopic} onSave={jest.fn()} />, {
        wrapper: createWrapper,
      });

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();

      // Disabled buttons don't trigger dropdown in radix-ui
      // The test should focus on the disabled state
      expect(button).toHaveAttribute("disabled");
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple rapid clicks gracefully", async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValue({ saved_count: 1 });

      render(<TopicActions topic={mockTopic} onSave={jest.fn()} />, {
        wrapper: createWrapper,
      });

      await user.click(screen.getByRole("button"));

      // Rapid clicks on save
      const saveButton = screen.getByText("Save Topic");
      await user.click(saveButton);
      await user.click(saveButton);
      await user.click(saveButton);

      // Should only call mutation once due to loading state protection
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
      });
    });

    it("should handle component unmounting during operation", async () => {
      const user = userEvent.setup();
      // biome-ignore lint/suspicious/noExplicitAny: Required for promise callback typing
      let resolvePromise: (value: any) => void = () => {};
      const savePromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockMutateAsync.mockReturnValue(savePromise);

      const { unmount } = render(
        <TopicActions topic={mockTopic} onSave={jest.fn()} />,
        { wrapper: createWrapper },
      );

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Save Topic"));

      // Unmount while operation is pending
      unmount();

      // Resolve the promise after unmount
      resolvePromise?.({ saved_count: 1 });

      // Should not cause any errors
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    it("should handle missing topic properties gracefully", () => {
      const minimalTopic: GeneratedTopic = {
        id: "minimal-topic",
        title: "Minimal Topic",
        scores: { relevance: 0.5, freshness: 0.5, novelty: 0.5 },
        // biome-ignore lint/suspicious/noExplicitAny: Required for minimal topic mock
      } as any;

      render(<TopicActions topic={minimalTopic} onSave={jest.fn()} />, {
        wrapper: createWrapper,
      });

      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Success Message Auto-Clear", () => {
    it("should auto-clear success messages after 5 seconds", async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      mockMutateAsync.mockResolvedValue({ saved_count: 1 });

      render(<TopicActions topic={mockTopic} onSave={jest.fn()} />, {
        wrapper: createWrapper,
      });

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByText("Save Topic"));

      // Success message should appear
      await waitFor(() => {
        expect(screen.getByTestId("success-alert")).toBeInTheDocument();
      });

      // Fast-forward 5 seconds
      jest.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.queryByTestId("success-alert")).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });
});
