/**
 * The full-screen article editor (task 706): the article saves by itself and says so; a failed save
 * shows an alert with a retry; text an earlier visit couldn't save is offered again; leaving asks
 * only while a change isn't saved.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArticleEditPage } from "@/components/editor/article-edit-page";
import { writeLocalDraft } from "@/lib/content/local-draft";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/providers/workspace-provider", () => ({
  useWorkspace: () => ({ workspace: { id: "w1", slug: "nextly" } }),
}));

let canUpdate = true;
jest.mock("@/hooks/use-permission", () => ({
  useWorkspacePermission: () => ({
    hasPermission: canUpdate,
    isLoading: false,
  }),
}));

jest.mock("@/hooks/use-awaiting-data", () => ({
  useAwaitingData: () => false,
}));

jest.mock("@/hooks/use-content", () => ({
  ...jest.requireActual("@/hooks/use-content"),
  useContentDetail: () => ({
    data: {
      content: {
        id: "c1",
        title: "How to start a podcast",
        body_markdown: "Hello",
      },
    },
  }),
}));

// The editor itself is Lexical's; a text box stands in for it here.
jest.mock("@/components/ui/safe-lexical-editor", () => ({
  SafeLexicalEditor: ({
    initialValue,
    onChange,
    toolbar,
    bare,
    plugins,
  }: {
    initialValue: string;
    onChange: (markdown: string) => void;
    toolbar?: boolean;
    bare?: boolean;
    plugins?: unknown;
  }) => (
    <>
      <textarea
        aria-label="Article text"
        defaultValue={initialValue}
        onChange={(event) => onChange(event.target.value)}
      />
      <output aria-label="Editor options">
        {`toolbar=${toolbar} bare=${bare} plugins=${plugins ? "yes" : "no"}`}
      </output>
    </>
  ),
}));

// marked ships as an ES module jest can't load.
jest.mock("@/lib/content/article-html", () => ({
  articleHtml: (markdown: string) => `<p>${markdown}</p>`,
}));

jest.mock("@/lib/api-client", () => ({
  apiClient: { content: { update: jest.fn() } },
}));
const update = jest.requireMock("@/lib/api-client").apiClient.content
  .update as jest.Mock;

let unmountPage: () => void = () => {};
function renderPage() {
  const { unmount } = render(
    <QueryClientProvider client={new QueryClient()}>
      <ArticleEditPage workspaceSlug="nextly" contentId="c1" />
    </QueryClientProvider>,
  );
  unmountPage = unmount;
  return userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
}

const wait = (ms: number) => act(async () => jest.advanceTimersByTime(ms));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  window.localStorage.clear();
  canUpdate = true;
  update.mockResolvedValue({});
});
afterEach(() => {
  jest.useRealTimers();
});

describe("The full-screen article editor", () => {
  it("saves by itself after the typing stops, with the HTML and the images", async () => {
    const user = renderPage();
    expect(screen.getByText("Saved")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Article text"), " world");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();

    await wait(2000);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith("w1", "c1", {
      title: "How to start a podcast",
      body_markdown: "Hello world",
      body_html: "<p>Hello world</p>",
      images_data: expect.objectContaining({ images: [] }),
    });
    expect(await screen.findByText(/^Saved · /)).toBeInTheDocument();
  });

  it("brings its own tools: no fixed toolbar, no frame, its plugins", () => {
    renderPage();
    expect(screen.getByLabelText("Editor options")).toHaveTextContent(
      "toolbar=false bare=true plugins=yes",
    );
    expect(screen.getByText(/Type \/ for blocks/)).toBeInTheDocument();
  });

  it("doesn't save the editor's own first rewrite of the text", async () => {
    renderPage();
    // What Lexical does when the cursor is first placed: it reports its own form of the text.
    const box = screen.getByLabelText("Article text") as HTMLTextAreaElement;
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    act(() => {
      setValue?.call(box, "Hello\n");
      box.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await wait(5000);
    expect(update).not.toHaveBeenCalled();
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("shows a failed save, keeps the text on this device, and saves on Retry now", async () => {
    update.mockRejectedValueOnce(new Error("offline"));
    const user = renderPage();
    await user.type(screen.getByLabelText("Article text"), "!");
    await wait(2000);

    expect(
      await screen.findByText("Your last changes aren't saved yet"),
    ).toBeInTheDocument();
    expect(screen.getByText("Not saved")).toBeInTheDocument();
    expect(window.localStorage.getItem("rext:article-draft:c1")).toContain(
      "Hello!",
    );

    await user.click(screen.getByRole("button", { name: "Retry now" }));
    expect(await screen.findByText(/^Saved · /)).toBeInTheDocument();
    expect(screen.queryByText("Your last changes aren't saved yet")).toBeNull();
    expect(window.localStorage.getItem("rext:article-draft:c1")).toBeNull();
  });

  it("copies an edit made just before leaving to this device", async () => {
    const user = renderPage();
    await user.type(screen.getByLabelText("Article text"), "!");
    // Gone at once: neither the half-second wait for the copy nor the save has run.
    unmountPage();

    expect(window.localStorage.getItem("rext:article-draft:c1")).toContain(
      "Hello!",
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("offers text an earlier visit couldn't save, and saves it once restored", async () => {
    writeLocalDraft("c1", "Hello from before");
    const user = renderPage();

    expect(
      screen.getByText("Changes from an earlier visit weren't saved"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restore them" }));
    expect(screen.getByLabelText("Article text")).toHaveValue(
      "Hello from before",
    );
    await wait(2000);
    expect(update).toHaveBeenCalledWith(
      "w1",
      "c1",
      expect.objectContaining({ body_markdown: "Hello from before" }),
    );
  });

  it("drops that text on request", async () => {
    writeLocalDraft("c1", "Hello from before");
    const user = renderPage();
    await user.click(screen.getByRole("button", { name: "Discard them" }));
    expect(window.localStorage.getItem("rext:article-draft:c1")).toBeNull();
    expect(screen.getByLabelText("Article text")).toHaveValue("Hello");
  });

  it("saves what's left and goes back to the article on Done", async () => {
    const user = renderPage();
    await user.type(screen.getByLabelText("Article text"), "?");
    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(update).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/w/nextly/content/c1");
  });

  it("stays on the page when Done's save fails", async () => {
    update.mockRejectedValue(new Error("offline"));
    const user = renderPage();
    await user.type(screen.getByLabelText("Article text"), "?");
    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(push).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Your last changes aren't saved yet"),
    ).toBeInTheDocument();
  });

  it("says so, without an editor, when the person can't edit", () => {
    canUpdate = false;
    renderPage();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "You can't edit this article",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Article text")).toBeNull();
  });
});
