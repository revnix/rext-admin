import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { WorkspaceCreateWizard } from "@/components/workspace/workspace-create-wizard";
import { ApiError } from "@/lib/api-client/core";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
// Whether the page already knows the plan's workspaces are all in use.
const limit = { isLimitReached: false };
jest.mock("@/components/subscription/limit-check-wrapper", () => ({
  useCheckLimit: () => ({
    checkLimit: () => true,
    canCreate: !limit.isLimitReached,
    isLimitReached: limit.isLimitReached,
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
const createWorkspace = jest.fn();
jest.mock("@/stores/workspace", () => {
  const state = {
    createWorkspace: (...args: unknown[]) => createWorkspace(...args),
    workspaceList: [],
    setCurrentWorkspace: jest.fn(),
  };
  return {
    useWorkspaceStore: (selector: (s: typeof state) => unknown) =>
      selector(state),
    useWorkspaceCrudStore: { getState: () => ({ currentOperation: null }) },
  };
});

async function submit(client = new QueryClient()) {
  render(
    <QueryClientProvider client={client}>
      <WorkspaceCreateWizard />
    </QueryClientProvider>,
  );
  // Pasted, not typed key by key: typing the whole form took over 5 s on a busy CI runner.
  await userEvent.click(
    screen.getByRole("textbox", { name: /Workspace name/ }),
  );
  await userEvent.paste("Second");
  await userEvent.click(screen.getByRole("textbox", { name: /Website/ }));
  await userEvent.paste("https://second.example");
  await userEvent.click(
    screen.getByRole("button", { name: "Create workspace" }),
  );
}

beforeEach(() => {
  limit.isLimitReached = false;
  createWorkspace.mockReset();
  jest.mocked(toast.error).mockClear();
});

describe("A workspace past the plan's limit (G72)", () => {
  it("shows the backend's refusal as a notice with the way to a bigger plan", async () => {
    createWorkspace.mockRejectedValue(
      new ApiError(
        429,
        "Workspace limit reached (1/1). Please upgrade your plan to create more workspaces.",
      ),
    );
    const client = new QueryClient();
    const invalidate = jest.spyOn(client, "invalidateQueries");
    await submit(client);

    const notice = await screen.findByRole(
      "alert",
      {},
      // Validation and the submit can take more than the default second on a busy CI runner.
      { timeout: 5000 },
    );
    expect(notice).toHaveTextContent("Workspace limit reached");
    expect(screen.getByRole("link", { name: "View plans" })).toHaveAttribute(
      "href",
      "/pricing",
    );
    expect(toast.error).not.toHaveBeenCalled();
    // The count above the form reads the usage again.
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["subscriptions", "usage"],
    });
  }, 15_000);

  it("says so when the page already knows the limit is reached, instead of doing nothing", async () => {
    limit.isLimitReached = true;
    await submit();

    expect(
      await screen.findByRole("alert", {}, { timeout: 5000 }),
    ).toHaveTextContent("Workspace limit reached");
    expect(createWorkspace).not.toHaveBeenCalled();
  }, 15_000);

  it("leaves any other refusal to its field or a toast, as before", async () => {
    createWorkspace.mockRejectedValue(new ApiError(500, "Something broke"));
    await submit();

    await waitFor(
      () => expect(toast.error).toHaveBeenCalledWith("Something broke"),
      { timeout: 5000 },
    );
    expect(screen.queryByText("Workspace limit reached")).toBeNull();
  }, 15_000);
});
