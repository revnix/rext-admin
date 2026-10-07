import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceCreateWizard } from "@/components/workspace/workspace-create-wizard";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
jest.mock("@/components/subscription/limit-check-wrapper", () => ({
  useCheckLimit: () => ({
    checkLimit: () => true,
    canCreate: true,
    isLimitReached: false,
  }),
}));
jest.mock("@/hooks/use-sse-channel", () => ({
  useSSEChannel: () => ({
    events: [],
    connect: jest.fn(),
    disconnect: jest.fn(),
  }),
}));
jest.mock("@/providers/sse-provider", () => ({
  useSSE: () => ({ clearCompletedOperation: jest.fn() }),
}));
jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
jest.mock("@/stores/workspace", () => {
  const state = {
    createWorkspace: jest.fn(),
    workspaceList: [],
    setCurrentWorkspace: jest.fn(),
  };
  return {
    useWorkspaceStore: (selector: (s: typeof state) => unknown) =>
      selector(state),
    useWorkspaceCrudStore: { getState: () => ({ currentOperation: null }) },
  };
});

describe("Creating a workspace on a new account", () => {
  it("shows no field error when something else takes the focus before any input", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkspaceCreateWizard />
        {/* The first-login questions open over the page as a dialog and take the focus. */}
        <button type="button">Your industry</button>
      </QueryClientProvider>,
    );

    // The way a dialog takes the focus: whatever had it loses it (a blur), then the dialog's field has it.
    await userEvent.click(
      screen.getByRole("button", { name: "Your industry" }),
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(
      screen.getByRole("textbox", { name: /Workspace name/ }),
    ).not.toHaveFocus();
    expect(screen.queryByText("Name is required")).toBeNull();
  });
});
