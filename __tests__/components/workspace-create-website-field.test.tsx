/**
 * rext-control#854: on launch morning 30 of 34 newcomers stopped at the Website field, which took
 * only a full https:// address. It takes what people type, adds https:// itself, says the address
 * it will read, and a refusal says what to type.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceCreateWizard } from "@/components/workspace/workspace-create-wizard";

const mockCreate = jest.fn();
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
jest.mock("@/hooks/use-personas", () => ({
  usePersonas: () => ({ isSuccess: false, data: undefined }),
}));
jest.mock("@/stores/workspace", () => {
  const state = {
    createWorkspace: (data: unknown) => mockCreate(data),
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

function form() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <WorkspaceCreateWizard />
    </QueryClientProvider>,
  );
  return {
    name: screen.getByRole("textbox", { name: /Workspace name/ }),
    website: screen.getByRole("textbox", { name: /Website/ }),
    create: screen.getByRole("button", { name: "Create workspace" }),
  };
}

beforeEach(() => {
  mockCreate.mockReset();
  mockCreate.mockResolvedValue({ id: "ws-1", slug: "my-company" });
});

describe("The Website field when creating a workspace", () => {
  it("is a text field the browser doesn't refuse, set up for typing an address", () => {
    const { website } = form();
    // Not type="url": the browser then refuses a bare domain in its own words.
    expect(website).toHaveAttribute("type", "text");
    expect(website).toHaveAttribute("inputmode", "url");
    expect(website).toHaveAttribute("autocapitalize", "none");
    expect(website).toHaveAttribute("autocorrect", "off");
    expect(website).toHaveAttribute("placeholder", "yoursite.com");
  });

  it.each([
    ["mysite.com", "https://mysite.com"],
    ["www.mysite.com", "https://www.mysite.com"],
    ["http://mysite.com", "https://mysite.com"],
    ["  MySite.com/shop ", "https://mysite.com/shop"],
  ])("takes %s and creates the workspace for %s", async (typed, read) => {
    const { name, website, create } = form();
    await userEvent.type(name, "My company");
    await userEvent.type(website, typed);
    // The form says where it will read before anything is sent.
    expect(
      screen.getByText(
        `We'll read ${read} to draft the workspace's brand voice, personas and competitors.`,
      ),
    ).toBeInTheDocument();
    await userEvent.click(create);
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    expect(mockCreate.mock.calls[0][0]).toMatchObject({
      name: "My company",
      url: read,
    });
    // The wait names the address that is read.
    expect(await screen.findByText(new RegExp(`Reading ${read}`))).toBeTruthy();
  });

  it("says what to type when there is no address in it, and sends nothing", async () => {
    const { name, website, create } = form();
    await userEvent.type(name, "My company");
    await userEvent.type(website, "mysite");
    // Nothing is said while the person is still typing.
    expect(screen.queryByText(/Enter your website's address/)).toBeNull();
    await userEvent.click(create);
    expect(
      await screen.findByText(
        "Enter your website's address, like yoursite.com",
      ),
    ).toBeInTheDocument();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
