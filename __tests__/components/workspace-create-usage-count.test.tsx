import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
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
// The workspace the backend creates.
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

describe("The plan's workspace count during setup (D22)", () => {
  it("is read again once the workspace exists, so it counts the new one", async () => {
    createWorkspace.mockResolvedValue({ id: "ws-1", slug: "acme" });
    const client = new QueryClient();
    const invalidate = jest.spyOn(client, "invalidateQueries");
    render(
      <QueryClientProvider client={client}>
        <WorkspaceCreateWizard />
      </QueryClientProvider>,
    );

    // Pasted, not typed key by key: typing the whole form took over 5 s on a busy CI runner.
    await userEvent.click(
      screen.getByRole("textbox", { name: /What is your business called/ }),
    );
    await userEvent.paste("Acme");
    await userEvent.click(
      screen.getByRole("textbox", { name: /What is its website/ }),
    );
    await userEvent.paste("https://acme.example");
    await userEvent.click(
      screen.getByRole("button", { name: "Read my website" }),
    );

    // Typing, validation and the submit can take more than waitFor's default second on a busy CI
    // runner (it took 1.2 s there).
    await waitFor(() => expect(createWorkspace).toHaveBeenCalled(), {
      timeout: 5000,
    });
    // The page's count reads this query (app/w/create/page.tsx).
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["subscriptions", "usage"],
    });
  }, 15_000);
});
