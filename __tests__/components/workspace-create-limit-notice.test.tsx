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
// Whether the page already knows the plan's workspaces are all in use, and whether it knows the
// plan at all (its call can still be loading, or have failed).
const limit = { isLimitReached: false, planKnown: true };
jest.mock("@/components/subscription/limit-check-wrapper", () => ({
  useCheckLimit: () => ({
    checkLimit: () => limit.planKnown,
    canCreate: limit.planKnown && !limit.isLimitReached,
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
// The workspaces the account has when the page opens.
const account: { workspaces: Array<{ id: string }> } = { workspaces: [] };
jest.mock("@/stores/workspace", () => {
  const state = {
    createWorkspace: (...args: unknown[]) => createWorkspace(...args),
    get workspaceList() {
      return account.workspaces;
    },
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
    screen.getByRole("textbox", { name: /What is your business called/ }),
  );
  await userEvent.paste("Second");
  await userEvent.click(
    screen.getByRole("textbox", { name: /What is its website/ }),
  );
  await userEvent.paste("https://second.example");
  await userEvent.click(
    screen.getByRole("button", { name: "Read my website" }),
  );
}

beforeEach(() => {
  limit.isLimitReached = false;
  limit.planKnown = true;
  account.workspaces = [];
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

  it("sends the create when the plan isn't known: the backend holds the limit", async () => {
    // The plan's or the usage's call still loading, or failed: the button did nothing at all.
    limit.planKnown = false;
    createWorkspace.mockRejectedValue(
      new ApiError(429, "Workspace limit reached (1/1)."),
    );
    await submit();

    await waitFor(() => expect(createWorkspace).toHaveBeenCalledTimes(1), {
      timeout: 5000,
    });
    expect(
      await screen.findByRole("alert", {}, { timeout: 5000 }),
    ).toHaveTextContent("Workspace limit reached");
  }, 15_000);
});

describe("A refusal that names no field", () => {
  it("is said above the form in our words when the server failed, and stays there", async () => {
    createWorkspace.mockRejectedValue(new ApiError(500, "Something broke"));
    await submit();

    const notice = await screen.findByRole("alert", {}, { timeout: 5000 });
    expect(notice).toHaveTextContent("The workspace wasn't created");
    expect(notice).toHaveTextContent(
      "Something went wrong on our side. Try again in a moment.",
    );
    expect(screen.queryByText(/Something broke/)).toBeNull();
    expect(toast.error).not.toHaveBeenCalled();
    expect(screen.queryByText("Workspace limit reached")).toBeNull();
  }, 15_000);

  it("says the server couldn't be reached as that", async () => {
    createWorkspace.mockRejectedValue(
      new ApiError(
        0,
        "We couldn't reach the server. Try again.",
        "SERVER_UNREACHABLE",
        null,
      ),
    );
    await submit();

    expect(
      await screen.findByRole("alert", {}, { timeout: 5000 }),
    ).toHaveTextContent("We couldn't reach the server. Try again in a moment.");
  }, 15_000);

  it("keeps the backend's sentence for a refusal of the request itself", async () => {
    createWorkspace.mockRejectedValue(
      new ApiError(400, "Verify your email before you create a workspace."),
    );
    await submit();

    expect(
      await screen.findByRole("alert", {}, { timeout: 5000 }),
    ).toHaveTextContent("Verify your email before you create a workspace.");
  }, 15_000);

  it("goes when the next try gets through", async () => {
    createWorkspace
      .mockRejectedValueOnce(new ApiError(500, "Something broke"))
      .mockResolvedValueOnce({ id: "w1", slug: "second", name: "Second" });
    await submit();
    await screen.findByRole("alert", {}, { timeout: 5000 });

    await userEvent.click(
      screen.getByRole("button", { name: "Read my website" }),
    );

    await waitFor(
      () =>
        expect(screen.queryByText("The workspace wasn't created")).toBeNull(),
      { timeout: 5000 },
    );
  }, 15_000);
});

describe("The form's way out", () => {
  const open = () =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkspaceCreateWizard />
      </QueryClientProvider>,
    );

  it("has no Cancel for a first workspace: the home page leads straight back to this form", () => {
    open();
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
  });

  it("keeps Cancel for an account that has a workspace to go back to", () => {
    account.workspaces = [{ id: "w0" }];
    open();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});
