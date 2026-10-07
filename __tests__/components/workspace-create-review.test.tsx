/**
 * FB2.1 (rext-control#682): once the website's analysis completes, the creation flow shows what it
 * read, editable, and Finish opens Generate content. Finish saves only what was changed here: the
 * analysis has saved the draft already.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceCreateWizard } from "@/components/workspace/workspace-create-wizard";
import { apiClient } from "@/lib/api-client";
import { workspaceRoutes } from "@/lib/routes";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
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
let mockComplete: (() => void) | undefined;
jest.mock("@/hooks/use-sse-channel", () => ({
  useSSEChannel: (_id: string | null, options: { onComplete: () => void }) => {
    mockComplete = options.onComplete;
    return { events: [], connect: jest.fn(), disconnect: jest.fn() };
  },
}));
jest.mock("@/providers/sse-provider", () => ({
  useSSE: () => ({ clearCompletedOperation: jest.fn() }),
}));
jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
jest.mock("@/hooks/use-personas", () => ({
  usePersonas: () => ({
    isSuccess: true,
    data: { personas: [{ full_name: "Ana Ruiz", name: "Ana" }] },
  }),
}));
jest.mock("@/lib/api-client", () => ({
  apiClient: {
    workspaces: { getBrandVoice: jest.fn(), updateBrandVoice: jest.fn() },
  },
}));
jest.mock("@/stores/workspace", () => {
  const state = {
    createWorkspace: jest.fn().mockResolvedValue({
      id: "ws-1",
      slug: "acme",
    }),
    workspaceList: [],
    setCurrentWorkspace: jest.fn(),
  };
  return {
    useWorkspaceStore: (selector: (s: typeof state) => unknown) =>
      selector(state),
    useWorkspaceCrudStore: {
      getState: () => ({ currentOperation: { operationId: "op-1" } }),
    },
  };
});

const workspaces = apiClient.workspaces as jest.Mocked<
  typeof apiClient.workspaces
>;
const drafted = {
  brand_voice: {
    brand_name: "Acme",
    about: "Acme makes anvils.",
    selling_position: "They last.",
    customer_profile: "Builders.",
    target_audience: ["Builders"],
    brand_voice: ["Plain"],
    content_pillar: ["Anvils"],
    competitors: ["Bolt Co"],
  },
};

async function createAndFinishTheAnalysis() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <WorkspaceCreateWizard />
    </QueryClientProvider>,
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: /Workspace name/ }),
    "Acme",
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: /Website/ }),
    "https://acme.example",
  );
  await userEvent.click(
    screen.getByRole("button", { name: "Create workspace" }),
  );
  expect(
    await screen.findByText(/Reading https:\/\/acme.example/),
  ).toBeTruthy();
  await act(async () => mockComplete?.());
  return screen.findByRole("textbox", { name: /About/ });
}

describe("The drafted details in the creation flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    workspaces.getBrandVoice.mockResolvedValue(drafted as never);
    workspaces.updateBrandVoice.mockResolvedValue(drafted as never);
  });

  it("shows what the analysis read, editable, and Finish opens Generate content", async () => {
    const about = await createAndFinishTheAnalysis();

    expect(about).toHaveValue("Acme makes anvils.");
    expect(screen.getByRole("textbox", { name: /Competitors/ })).toHaveValue(
      "Bolt Co",
    );
    expect(screen.getByText(/Ana Ruiz/)).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Finish" }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        workspaceRoutes.generate_content("acme"),
      ),
    );
    // Nothing was changed here: the analysis's draft is saved already.
    expect(workspaces.updateBrandVoice).not.toHaveBeenCalled();
  });

  it("saves what was changed before it opens Generate content", async () => {
    const about = await createAndFinishTheAnalysis();

    await userEvent.clear(about);
    await userEvent.type(about, "Acme makes anvils that last.");
    await userEvent.click(screen.getByRole("button", { name: "Finish" }));

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith(
        workspaceRoutes.generate_content("acme"),
      ),
    );
    expect(workspaces.updateBrandVoice).toHaveBeenCalledWith(
      "ws-1",
      expect.objectContaining({ about: "Acme makes anvils that last." }),
    );
  });

  it("stays on the step and says so when the change can't be saved", async () => {
    workspaces.updateBrandVoice.mockRejectedValue(new Error("The API is down"));
    const about = await createAndFinishTheAnalysis();

    await userEvent.type(about, " More.");
    await userEvent.click(screen.getByRole("button", { name: "Finish" }));

    expect(await screen.findByText("The API is down")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
