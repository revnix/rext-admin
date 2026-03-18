/**
 * Tests for InvitedUserOnboardingModal Component
 *
 * Focuses on testing the core business logic:
 * - Calls backend API to complete onboarding
 * - Invalidates React Query caches on success
 * - Shows error toast and keeps modal open on failure
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { InvitedUserOnboardingModal } from "@/components/onboarding/invited-user-onboarding-modal";
import { apiClient } from "@/lib/api-client";
import type { Workspace } from "@/types/workspace";

// Mock the API client
jest.mock("@/lib/api-client");

// Mock the step components with simpler implementations
jest.mock("@/components/onboarding/steps/invited-user-welcome", () => ({
  InvitedUserWelcome: ({ onNext }: { onNext: () => void }) => (
    <button type="button" onClick={onNext}>
      Next Step
    </button>
  ),
}));

jest.mock("@/components/onboarding/steps/invited-user-permissions", () => ({
  InvitedUserPermissions: ({ onNext }: { onNext: () => void }) => (
    <button type="button" onClick={onNext}>
      Next Step
    </button>
  ),
  getRolePermissions: () => [],
}));

jest.mock("@/components/onboarding/steps/invited-user-quick-tour", () => ({
  InvitedUserQuickTour: ({ onNext }: { onNext: () => void }) => (
    <button type="button" onClick={onNext}>
      Next Step
    </button>
  ),
}));

jest.mock("@/components/onboarding/steps/invited-user-first-tasks", () => ({
  InvitedUserFirstTasks: ({ onComplete }: { onComplete: () => void }) => (
    <button type="button" onClick={onComplete}>
      Complete Onboarding
    </button>
  ),
}));

// Mock sonner toast with factory function
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Mock framer-motion to disable animations in tests
jest.mock("framer-motion", () => ({
  ...(jest.requireActual("framer-motion") as object),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => (
      <div {...(typeof props === "object" && props !== null ? props : {})}>
        {children}
      </div>
    ),
  },
}));

// Create a query client for testing
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper(queryClient?: QueryClient) {
  const client = queryClient || createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe("InvitedUserOnboardingModal", () => {
  const mockWorkspace: Workspace = {
    id: "workspace-123",
    name: "Test Workspace",
    slug: "test-workspace",
    url: "https://test-workspace.com",
    // description: "A test workspace",
    // owner_id: "user-123",
    user_id: "",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  };

  const mockOnClose = jest.fn();
  const defaultProps = {
    open: true,
    onClose: mockOnClose,
    workspace: mockWorkspace,
    inviterName: "John Doe",
    roleName: "editor",
    roleDescription: "Can create and edit content",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.onboarding.complete as jest.Mock) = jest.fn().mockResolvedValue({
      completed: true,
      completed_at: "2025-01-01T00:00:00Z",
    });
  });

  describe("Rendering", () => {
    it("should render the modal when open is true", () => {
      render(<InvitedUserOnboardingModal {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      const headings = screen.getAllByText(/Welcome to Test Workspace/i);
      expect(headings.length).toBeGreaterThan(0);
    });

    it("should not render the modal when open is false", () => {
      const { container } = render(
        <InvitedUserOnboardingModal {...defaultProps} open={false} />,
        {
          wrapper: createWrapper(),
        },
      );

      expect(container.querySelector("[role=dialog]")).not.toBeInTheDocument();
    });
  });

  describe("Completion Flow", () => {
    it("should call apiClient.onboarding.complete() when completing onboarding", async () => {
      const user = userEvent.setup({ delay: null });

      render(<InvitedUserOnboardingModal {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Click through steps until we reach the complete button
      for (let i = 0; i < 4; i++) {
        const nextButtons = screen.queryAllByRole("button", {
          name: "Next Step",
        });
        if (nextButtons.length > 0) {
          await user.click(nextButtons[0]);
          await waitFor(
            () => {
              // Wait for animation to settle
            },
            { timeout: 500 },
          );
        }
      }

      // Wait for complete button to appear
      const completeButton = await screen.findByRole("button", {
        name: /Complete Onboarding/i,
      });

      await user.click(completeButton);

      await waitFor(() => {
        expect(apiClient.onboarding.complete).toHaveBeenCalledTimes(1);
      });
    });

    it("should invalidate query caches on successful completion", async () => {
      const queryClient = createTestQueryClient();
      const invalidateQueries = jest.spyOn(queryClient, "invalidateQueries");

      const user = userEvent.setup({ delay: null });
      render(<InvitedUserOnboardingModal {...defaultProps} />, {
        wrapper: createWrapper(queryClient),
      });

      // Click through steps until we reach the complete button
      for (let i = 0; i < 4; i++) {
        const nextButtons = screen.queryAllByRole("button", {
          name: "Next Step",
        });
        if (nextButtons.length > 0) {
          await user.click(nextButtons[0]);
          await waitFor(
            () => {
              // Wait for animation to settle
            },
            { timeout: 500 },
          );
        }
      }

      // Wait for complete button to appear
      const completeButton = await screen.findByRole("button", {
        name: /Complete Onboarding/i,
      });

      await user.click(completeButton);

      await waitFor(() => {
        expect(invalidateQueries).toHaveBeenCalledWith({
          queryKey: ["onboarding", "status"],
        });
        expect(invalidateQueries).toHaveBeenCalledWith({
          queryKey: ["onboarding", "should-show"],
        });
      });
    });

    it("should close modal on successful completion", async () => {
      const user = userEvent.setup({ delay: null });
      render(<InvitedUserOnboardingModal {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Click through steps until we reach the complete button
      for (let i = 0; i < 4; i++) {
        const nextButtons = screen.queryAllByRole("button", {
          name: "Next Step",
        });
        if (nextButtons.length > 0) {
          await user.click(nextButtons[0]);
          await waitFor(
            () => {
              // Wait for animation to settle
            },
            { timeout: 500 },
          );
        }
      }

      // Wait for complete button to appear
      const completeButton = await screen.findByRole("button", {
        name: /Complete Onboarding/i,
      });

      await user.click(completeButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Error Handling", () => {
    it("should show error toast and keep modal open on completion failure", async () => {
      const errorMessage = "Failed to complete onboarding";
      (apiClient.onboarding.complete as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage),
      );

      const user = userEvent.setup({ delay: null });
      render(<InvitedUserOnboardingModal {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Click through steps until we reach the complete button
      for (let i = 0; i < 4; i++) {
        const nextButtons = screen.queryAllByRole("button", {
          name: "Next Step",
        });
        if (nextButtons.length > 0) {
          await user.click(nextButtons[0]);
          await waitFor(
            () => {
              // Wait for animation to settle
            },
            { timeout: 500 },
          );
        }
      }

      // Wait for complete button to appear
      const completeButton = await screen.findByRole("button", {
        name: /Complete Onboarding/i,
      });

      await user.click(completeButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
      });

      // Modal should not be closed
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should show generic error message for unknown errors", async () => {
      (apiClient.onboarding.complete as jest.Mock).mockRejectedValueOnce({});

      const user = userEvent.setup({ delay: null });
      render(<InvitedUserOnboardingModal {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Click through steps until we reach the complete button
      for (let i = 0; i < 4; i++) {
        const nextButtons = screen.queryAllByRole("button", {
          name: "Next Step",
        });
        if (nextButtons.length > 0) {
          await user.click(nextButtons[0]);
          await waitFor(
            () => {
              // Wait for animation to settle
            },
            { timeout: 500 },
          );
        }
      }

      // Wait for complete button to appear
      const completeButton = await screen.findByRole("button", {
        name: /Complete Onboarding/i,
      });

      await user.click(completeButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to complete onboarding",
        );
      });
    });
  });
});
