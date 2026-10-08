import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen } from "@testing-library/react";
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

beforeEach(() => {
  window.history.replaceState(null, "", "/w/create");
});

describe("Creating a workspace on a new account", () => {
  it("shows no field error when something else takes the focus before any input", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkspaceCreateWizard />
        {/* The first-login questions open over the page as a dialog and take the focus. */}
        <div role="dialog" aria-label="A few questions before you start">
          <button type="button">Your industry</button>
        </div>
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
      screen.getByRole("textbox", { name: /What is your business called/ }),
    ).not.toHaveFocus();
    expect(screen.queryByText("Name is required")).toBeNull();
  });
  it("arrives with the caret in the first field, which holds no example text and asks its question", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkspaceCreateWizard />
      </QueryClientProvider>,
    );

    const name = screen.getByRole("textbox", {
      name: /What is your business called/,
    });
    expect(name).toHaveFocus();
    expect(name).toHaveValue("");
    expect(name).not.toHaveAttribute("placeholder");
    // The example is under the field, where it can't be taken for an answer.
    expect(screen.getByText(/For example: Luna Bakery/)).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /What is its website/ }),
    ).not.toHaveAttribute("placeholder");
    expect(screen.getByText(/yoursite.com is enough/)).toBeInTheDocument();
    // The button says what pressing it starts.
    expect(
      screen.getByRole("button", { name: "Read my website" }),
    ).toBeInTheDocument();
  });

  it("says nothing when the empty name is left: an empty field is no error until the button is pressed", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkspaceCreateWizard />
        <p>Somewhere else on the page</p>
      </QueryClientProvider>,
    );
    expect(
      screen.getByRole("textbox", { name: /What is your business called/ }),
    ).toHaveFocus();

    // A tap anywhere on the page takes the caret out of the first field.
    await userEvent.click(screen.getByText("Somewhere else on the page"));
    // And on through the website, left empty too.
    await userEvent.click(
      screen.getByRole("textbox", { name: /What is its website/ }),
    );
    await userEvent.tab();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(screen.queryByText("Name is required")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(
      screen.getByRole("textbox", { name: /What is your business called/ }),
    ).not.toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByRole("textbox", { name: /What is its website/ }),
    ).not.toHaveAttribute("aria-invalid", "true");
  });

  it("says so when choosing the other way in takes the caret out of the empty name", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkspaceCreateWizard />
      </QueryClientProvider>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "I don't have a website yet" }),
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(
      screen.getByRole("textbox", { name: /What does the business do/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Name is required")).toBeNull();
  });

  it("says what is missing once the button is pressed, and from then as each field is left", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkspaceCreateWizard />
      </QueryClientProvider>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Read my website" }),
    );

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    const name = screen.getByRole("textbox", {
      name: /What is your business called/,
    });
    expect(name).toHaveAttribute("aria-invalid", "true");
    // The first field in error has the caret.
    expect(name).toHaveFocus();
  });

  it("keeps quiet while the window is away and the caret is still in the empty field", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkspaceCreateWizard />
      </QueryClientProvider>,
    );
    const name = screen.getByRole("textbox", {
      name: /What is your business called/,
    });

    // Another tab or window: the field hears a blur and is still the document's active element.
    fireEvent.blur(name);

    expect(name).toHaveFocus();
    expect(screen.queryByText("Name is required")).toBeNull();
  });

  it("checks the name once something was typed in it and it was left", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkspaceCreateWizard />
      </QueryClientProvider>,
    );
    const name = screen.getByRole("textbox", {
      name: /What is your business called/,
    });
    await userEvent.type(name, "12345");
    await userEvent.tab();
    expect(
      await screen.findByText(
        "Workspace name must contain at least one letter",
      ),
    ).toBeInTheDocument();
  });
});

describe("The way in, in the address", () => {
  const open = () =>
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WorkspaceCreateWizard />
      </QueryClientProvider>,
    );
  const name = () =>
    screen.getByRole("textbox", { name: /What is your business called/ });

  it("goes into the address as its own step when it is chosen", async () => {
    open();
    const steps = window.history.length;

    await userEvent.click(
      screen.getByRole("button", { name: "I don't have a website yet" }),
    );

    expect(window.location.search).toBe("?from=description");
    expect(window.history.length).toBe(steps + 1);
  });

  it("comes back to the website on going back, with what was typed still there", async () => {
    open();
    await userEvent.type(name(), "Luna Bakery");
    await userEvent.click(
      screen.getByRole("button", { name: "I don't have a website yet" }),
    );
    expect(
      screen.getByRole("textbox", { name: /What does the business do/ }),
    ).toBeInTheDocument();

    // The phone's back gesture.
    await act(async () => {
      window.history.back();
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(window.location.search).toBe("");
    expect(
      screen.getByRole("textbox", { name: /What is its website/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /What does the business do/ }),
    ).toBeNull();
    expect(name()).toHaveValue("Luna Bakery");
  });

  it("opens on the description when the address says so: a reload keeps the way", async () => {
    window.history.replaceState(null, "", "/w/create?from=description");
    open();

    expect(
      await screen.findByRole("textbox", { name: /What does the business do/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Draft my brand voice" }),
    ).toBeInTheDocument();
  });

  it("drops the way from the address when the website is chosen again", async () => {
    window.history.replaceState(null, "", "/w/create?from=description");
    open();

    await userEvent.click(
      await screen.findByRole("button", { name: "I have a website" }),
    );

    expect(window.location.search).toBe("");
    expect(
      screen.getByRole("textbox", { name: /What is its website/ }),
    ).toBeInTheDocument();
  });
});

describe("What was typed, kept for the tab", () => {
  const tree = () => (
    <QueryClientProvider client={new QueryClient()}>
      <WorkspaceCreateWizard />
    </QueryClientProvider>
  );
  const name = () =>
    screen.getByRole("textbox", { name: /What is your business called/ });

  it("is there again when the page is left and opened again, with the way chosen and no error", async () => {
    const first = render(tree());
    await userEvent.type(name(), "Luna Bakery");
    await userEvent.click(
      screen.getByRole("button", { name: "I don't have a website yet" }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: /What does the business do/ }),
      "Sourdough",
    );
    first.unmount();
    // Home, and the home page sends an account with no workspace back to the form's plain address.
    window.history.replaceState(null, "", "/w/create");

    render(tree());

    expect(name()).toHaveValue("Luna Bakery");
    expect(
      await screen.findByRole("textbox", { name: /What does the business do/ }),
    ).toHaveValue("Sourdough");
    expect(window.location.search).toBe("?from=description");
    // Nothing that came back is checked: no field has been left.
    expect(screen.queryByRole("alert")).toBeNull();
    expect(name()).not.toHaveAttribute("aria-invalid", "true");
  });

  it("asks nothing on leaving: the browser's own prompt has nothing to protect", async () => {
    render(tree());
    await userEvent.type(name(), "Luna Bakery");

    const leaving = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(leaving);

    expect(leaving.defaultPrevented).toBe(false);
  });
});
