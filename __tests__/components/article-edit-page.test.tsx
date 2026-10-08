/**
 * The full-screen article editor (task 706): the article saves by itself and says so; a failed save
 * shows an alert with a retry; text an earlier visit couldn't save is offered again; leaving asks
 * only while a change isn't saved.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArticleEditPage } from "@/components/editor/article-edit-page";
import { analytics } from "@/lib/analytics";
import { readLocalDraft, writeLocalDraft } from "@/lib/content/local-draft";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/providers/workspace-provider", () => ({
  useWorkspace: () => ({ workspace: { id: "w1", slug: "nextly" } }),
}));

let canUpdate = true;
let canPublish = true;
jest.mock("@/hooks/use-permission", () => ({
  useWorkspacePermission: (permission: string) => ({
    hasPermission: permission === "content.publish" ? canPublish : canUpdate,
    isLoading: false,
  }),
}));

jest.mock("@/hooks/use-awaiting-data", () => ({
  useAwaitingData: () => false,
}));

const plainArticle: Record<string, unknown> = {
  id: "c1",
  title: "How to start a podcast",
  body_markdown: "Hello",
};
let mockArticle = plainArticle;
jest.mock("@/hooks/use-content", () => ({
  ...jest.requireActual("@/hooks/use-content"),
  useContentDetail: () => ({ data: { content: mockArticle } }),
}));

// The editor itself is Lexical's; a text box stands in for it here.
jest.mock("@/components/ui/safe-lexical-editor", () => ({
  SafeLexicalEditor: ({
    initialValue,
    onChange,
    toolbar,
    bare,
    plugins,
    readOnly,
  }: {
    initialValue: string;
    onChange?: (markdown: string) => void;
    toolbar?: boolean;
    bare?: boolean;
    plugins?: unknown;
    readOnly?: boolean;
  }) =>
    // A version shown in the History is the same component, read-only.
    readOnly ? (
      <textarea aria-label="Version text" readOnly value={initialValue} />
    ) : (
      <>
        <textarea
          aria-label="Article text"
          defaultValue={initialValue}
          onChange={(event) => onChange?.(event.target.value)}
        />
        {/* The article's main headings, as the real editor would draw them. */}
        {initialValue
          .split("\n")
          .filter((line) => line.startsWith("## "))
          .map((line, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list, and two may read the same
            <h2 key={index}>{line.slice(3)}</h2>
          ))}
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
  apiClient: {
    content: {
      update: jest.fn(),
      get: jest.fn(),
      versions: jest.fn(),
      version: jest.fn(),
      restoreVersion: jest.fn(),
    },
  },
}));
const contentApi = jest.requireMock("@/lib/api-client").apiClient.content as {
  update: jest.Mock;
  get: jest.Mock;
  versions: jest.Mock;
  version: jest.Mock;
  restoreVersion: jest.Mock;
};
const update = contentApi.update;

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
const track = jest.spyOn(analytics, "track").mockImplementation(() => {});
const tracked = (name: string) =>
  track.mock.calls.filter(([event]) => event === name);

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  window.localStorage.clear();
  canUpdate = true;
  canPublish = true;
  mockArticle = plainArticle;
  update.mockResolvedValue({});
  // A backend that keeps no versions: the route isn't there.
  contentApi.versions.mockRejectedValue(new Error("Not Found"));
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

  it("reports that it opened, once, and each save that reached the server with what set it off", async () => {
    const user = renderPage();
    await wait(50);
    expect(tracked("editor_opened")).toEqual([
      ["editor_opened", { content_id: "c1" }],
    ]);
    expect(tracked("article_saved")).toEqual([]);

    // A save by itself, after a pause in the typing.
    await user.type(screen.getByLabelText("Article text"), "!");
    await wait(4000);
    expect(update).toHaveBeenCalledTimes(1);
    expect(tracked("article_saved")).toEqual([
      ["article_saved", { content_id: "c1", trigger: "autosave" }],
    ]);

    // Done saves what is still unsaved: that save is the person's.
    await user.type(screen.getByLabelText("Article text"), "?");
    await user.click(screen.getByRole("button", { name: "Done" }));
    await wait(50);
    expect(update).toHaveBeenCalledTimes(2);
    expect(tracked("article_saved").at(-1)).toEqual([
      "article_saved",
      { content_id: "c1", trigger: "done" },
    ]);
    expect(tracked("editor_opened")).toHaveLength(1);
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

/** Records each heading scrolled to: its text, and its place among the page's h2s. */
function watchScrolls() {
  const scrolled = jest.fn();
  Element.prototype.scrollIntoView = function scrollIntoView() {
    scrolled(
      this.textContent,
      Array.from(document.querySelectorAll("h2")).indexOf(
        this as HTMLHeadingElement,
      ),
    );
  };
  return scrolled;
}

describe("The editor's drawers", () => {
  const withHeadings = {
    ...plainArticle,
    body_markdown:
      "Intro.\n\n## Pick a show idea\n\nText.\n\n### Choose one listener\n\nMore.\n\n## Choose a format\n\nText.",
  };

  it("lists the headings in the Outline drawer by level, and goes to the one picked", async () => {
    mockArticle = withHeadings;
    const scrolled = watchScrolls();
    const user = renderPage();

    await user.click(screen.getByRole("button", { name: "Outline" }));
    const drawer = screen.getByRole("dialog", { name: "Outline" });
    expect(
      within(drawer)
        .getAllByRole("listitem")
        .map((row) => row.textContent),
    ).toEqual([
      "H2Pick a show idea",
      "H3Choose one listener",
      "H2Choose a format",
    ]);

    await user.click(
      within(drawer).getByRole("button", { name: /Choose a format/ }),
    );
    await wait(50);
    expect(screen.queryByRole("dialog", { name: "Outline" })).toBeNull();
    expect(scrolled).toHaveBeenCalledWith("Choose a format", 1);

    // Looking at the outline is not an edit: nothing is saved.
    await wait(3000);
    expect(update).not.toHaveBeenCalled();
  });

  it("goes to the second of two headings that read the same", async () => {
    mockArticle = {
      ...plainArticle,
      body_markdown:
        "## Overview\n\nA.\n\n## Setup\n\nB.\n\n## 3. Overview\n\nC.",
    };
    const scrolled = watchScrolls();
    const user = renderPage();

    await user.click(screen.getByRole("button", { name: "Outline" }));
    const rows = within(
      screen.getByRole("dialog", { name: "Outline" }),
    ).getAllByRole("button", { name: /Overview/ });
    expect(rows).toHaveLength(2);
    await user.click(rows[1]);
    await wait(50);

    // The third heading on the page, not the first one of that name.
    expect(scrolled).toHaveBeenCalledTimes(1);
    expect(scrolled).toHaveBeenCalledWith("3. Overview", 2);
  });

  it("lists a heading typed since the editor opened", async () => {
    mockArticle = withHeadings;
    const user = renderPage();
    await user.type(screen.getByLabelText("Article text"), "\n\n## A new part");

    await user.click(screen.getByRole("button", { name: "Outline" }));
    expect(
      within(screen.getByRole("dialog", { name: "Outline" })).getByRole(
        "button",
        { name: /A new part/ },
      ),
    ).toBeInTheDocument();
  });

  it("says so in the Outline drawer when the article has no headings", async () => {
    const user = renderPage();
    await user.click(screen.getByRole("button", { name: "Outline" }));
    expect(
      within(screen.getByRole("dialog", { name: "Outline" })).getByText(
        /No headings yet/,
      ),
    ).toBeInTheDocument();
  });

  it("shows the article's stored checks in the Checklist drawer, and says when they are from", async () => {
    mockArticle = {
      ...plainArticle,
      seo_data: {
        seo_details: JSON.stringify({ seo_health_score: 92, issues: [] }),
        trust_score: 79,
      },
    };
    const user = renderPage();

    await user.click(screen.getByRole("button", { name: "Checklist" }));
    const drawer = screen.getByRole("dialog", { name: "Checklist" });
    expect(
      within(drawer).getByText(/From when the article was written/),
    ).toBeInTheDocument();
    expect(within(drawer).getByText("79%")).toBeInTheDocument();
    expect(within(drawer).getAllByText(/On-page score/).length).toBeGreaterThan(
      0,
    );
  });

  it("offers no Checklist for an article that has no checks", () => {
    renderPage();
    expect(screen.queryByRole("button", { name: "Checklist" })).toBeNull();
    expect(screen.getByRole("button", { name: "Outline" })).toBeInTheDocument();
  });
});

describe("The editor's Publish menu", () => {
  /** Opened by the keyboard: the menu takes its pointer events from a real browser. */
  async function choose(
    user: ReturnType<typeof userEvent.setup>,
    item: string,
  ) {
    screen.getByRole("button", { name: "Publish" }).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: item }));
  }

  it("offers the article page's four choices", async () => {
    const user = renderPage();
    screen.getByRole("button", { name: "Publish" }).focus();
    await user.keyboard("{Enter}");
    expect(
      (await screen.findAllByRole("menuitem")).map((item) => item.textContent),
    ).toEqual([
      "Publish",
      "Save as draft",
      "Submit for review",
      "Schedule for later",
    ]);
  });

  it("saves what is unsaved, then goes to the article with the choice", async () => {
    const user = renderPage();
    await user.type(screen.getByLabelText("Article text"), "?");
    await choose(user, "Save as draft");

    expect(update).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/w/nextly/content/c1?publish=draft");
  });

  it("goes straight there when everything is saved", async () => {
    const user = renderPage();
    await choose(user, "Schedule for later");

    expect(update).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/w/nextly/content/c1?publish=schedule");
  });

  it("waits for a save already under way, then goes with the choice", async () => {
    let finish: () => void = () => {};
    update.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({});
        }),
    );
    const user = renderPage();
    await user.type(screen.getByLabelText("Article text"), "?");
    // The menu is opened, and the autosave starts before a choice is made.
    screen.getByRole("button", { name: "Publish" }).focus();
    await user.keyboard("{Enter}");
    const choice = await screen.findByRole("menuitem", { name: "Publish" });
    await wait(2000);
    expect(update).toHaveBeenCalledTimes(1);

    await user.click(choice);
    await wait(50);
    expect(push).not.toHaveBeenCalled();

    await act(async () => finish());
    await wait(50);
    expect(update).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/w/nextly/content/c1?publish=publish");
  });

  it("stays in the editor when that save fails", async () => {
    update.mockRejectedValue(new Error("offline"));
    const user = renderPage();
    await user.type(screen.getByLabelText("Article text"), "?");
    await choose(user, "Publish");

    expect(push).not.toHaveBeenCalled();
    expect(
      screen.getByText("Your last changes aren't saved yet"),
    ).toBeInTheDocument();
  });

  it("isn't offered to someone who may not publish", () => {
    canPublish = false;
    renderPage();
    expect(screen.queryByRole("button", { name: "Publish" })).toBeNull();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
  });
});

describe("The editor's History", () => {
  const VERSIONS = [
    {
      id: "v2",
      created_at: "2026-10-08T05:00:00Z",
      updated_at: "2026-10-08T05:04:00Z",
      created_by: { id: "u1", name: "Sam Rivera" },
      source: "edit",
      title: "How to start a podcast",
      word_count: 1072,
    },
    {
      id: "v1",
      created_at: "2026-10-07T20:00:00Z",
      // A version no later save went into has no time of its own for that yet.
      updated_at: null,
      created_by: null,
      source: "generation",
      title: "How to start a podcast",
      word_count: 1,
    },
  ];

  const openHistory = async (
    user: ReturnType<typeof userEvent.setup>,
  ): Promise<HTMLElement> => {
    await user.click(await screen.findByRole("button", { name: "History" }));
    return screen.getByRole("dialog", { name: "History" });
  };

  it("isn't offered where the backend keeps no versions", async () => {
    renderPage();
    await wait(50);
    expect(contentApi.versions).toHaveBeenCalledWith("w1", "c1");
    expect(screen.queryByRole("button", { name: "History" })).toBeNull();
  });

  it("lists the versions, each with what it is, whose and how long", async () => {
    contentApi.versions.mockResolvedValue({ versions: VERSIONS });
    const user = renderPage();
    const drawer = await openHistory(user);

    expect(
      within(drawer)
        .getAllByRole("listitem")
        .map((row) => row.textContent?.replace(/^.*?(AM|PM)/, "")),
    ).toEqual([
      "Edited · Sam Rivera · 1,072 words",
      "As first written · 1 word",
    ]);
  });

  it("says so when no version is kept yet", async () => {
    contentApi.versions.mockResolvedValue({ versions: [] });
    const user = renderPage();
    const drawer = await openHistory(user);
    expect(
      within(drawer).getByText(/No earlier versions yet/),
    ).toBeInTheDocument();
  });

  it("shows a version's text, and restores it after asking, the unsaved text going with the restore", async () => {
    contentApi.versions.mockResolvedValue({ versions: VERSIONS });
    contentApi.version.mockResolvedValue({
      ...VERSIONS[1],
      body_markdown: "The first text",
    });
    // As the route answers: the article itself, not under `content` as a save's answer is.
    contentApi.restoreVersion.mockResolvedValue({
      id: "c1",
      title: "The first title",
      body_markdown: "The first text",
    });
    const user = renderPage();
    await user.type(screen.getByLabelText("Article text"), "?");

    const drawer = await openHistory(user);
    await user.click(
      within(drawer).getByRole("button", { name: /As first written/ }),
    );
    expect(await within(drawer).findByLabelText("Version text")).toHaveValue(
      "The first text",
    );
    expect(contentApi.version).toHaveBeenCalledWith("w1", "c1", "v1");

    await user.click(
      within(drawer).getByRole("button", { name: "Restore this version" }),
    );
    const question = await screen.findByRole("alertdialog");
    expect(
      within(question).getByText("Restore this version?"),
    ).toBeInTheDocument();
    expect(contentApi.restoreVersion).not.toHaveBeenCalled();
    await user.click(
      within(question).getByRole("button", { name: "Restore version" }),
    );
    await wait(50);

    // The copy of what was typed on this device went with it: nothing is offered back over the
    // restored article, now or on the next visit.
    await wait(3000);
    expect(readLocalDraft("c1")).toBeNull();
    expect(screen.queryByText(/earlier visit/)).toBeNull();
    // What was typed goes with the restore, which keeps it as a version: no save of its own.
    expect(update).not.toHaveBeenCalled();
    expect(contentApi.restoreVersion).toHaveBeenCalledWith(
      "w1",
      "c1",
      "v1",
      expect.objectContaining({ body_markdown: "Hello?" }),
    );
    expect(tracked("article_version_restored")).toEqual([
      ["article_version_restored", { content_id: "c1" }],
    ]);
    // The editor starts again on the restored article, saved.
    expect(screen.getByLabelText("Article text")).toHaveValue("The first text");
    expect(
      screen.getByRole("heading", { level: 1, name: "The first title" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "History" })).toBeNull();
    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("goes on saving what is unsaved when the restore doesn't happen", async () => {
    contentApi.versions.mockResolvedValue({ versions: VERSIONS });
    contentApi.version.mockResolvedValue({
      ...VERSIONS[1],
      body_markdown: "The first text",
    });
    contentApi.restoreVersion.mockRejectedValue(new Error("Server error"));
    const user = renderPage();
    await user.type(screen.getByLabelText("Article text"), "?");

    const drawer = await openHistory(user);
    await user.click(
      within(drawer).getByRole("button", { name: /As first written/ }),
    );
    await within(drawer).findByLabelText("Version text");
    await user.click(
      within(drawer).getByRole("button", { name: "Restore this version" }),
    );
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Restore version",
      }),
    );
    await wait(50);

    expect(contentApi.restoreVersion).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Article text")).toHaveValue("Hello?");
    // The text that went with the failed restore is still unsaved: the editor saves it itself.
    await wait(4000);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it("lets no second restore start while one is on its way", async () => {
    contentApi.versions.mockResolvedValue({ versions: VERSIONS });
    contentApi.version.mockResolvedValue({
      ...VERSIONS[1],
      body_markdown: "The first text",
    });
    let finish: () => void = () => {};
    contentApi.restoreVersion.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () =>
            resolve({
              id: "c1",
              content: {
                id: "c1",
                title: "The first title",
                body_markdown: "The first text",
              },
            });
        }),
    );
    const user = renderPage();
    await user.type(screen.getByLabelText("Article text"), "?");

    const drawer = await openHistory(user);
    await user.click(
      within(drawer).getByRole("button", { name: /As first written/ }),
    );
    await within(drawer).findByLabelText("Version text");
    await user.click(
      within(drawer).getByRole("button", { name: "Restore this version" }),
    );
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Restore version",
      }),
    );
    await wait(50);

    // The restore is slow: until it answers, the button and the way back are off.
    expect(
      within(drawer).getByRole("button", { name: "Restoring…" }),
    ).toBeDisabled();
    expect(
      within(drawer).getByRole("button", { name: "All versions" }),
    ).toBeDisabled();
    expect(contentApi.restoreVersion).toHaveBeenCalledTimes(1);

    await act(async () => finish());
    await wait(50);
    expect(contentApi.restoreVersion).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Article text")).toHaveValue("The first text");
  });

  it("reads the article afresh when a restore's answer holds none, and starts again on it", async () => {
    contentApi.versions.mockResolvedValue({ versions: VERSIONS });
    contentApi.version.mockResolvedValue({
      ...VERSIONS[1],
      body_markdown: "The first text",
    });
    contentApi.restoreVersion.mockImplementation(async () => {
      // The restore has happened: what the server holds from now on is the restored article.
      contentApi.get.mockResolvedValue({
        id: "c1",
        content: {
          id: "c1",
          title: "The first title",
          body_markdown: "The first text",
        },
      });
      return { message: "Version restored" };
    });
    const user = renderPage();

    const drawer = await openHistory(user);
    await user.click(
      within(drawer).getByRole("button", { name: /As first written/ }),
    );
    await within(drawer).findByLabelText("Version text");
    await user.click(
      within(drawer).getByRole("button", { name: "Restore this version" }),
    );
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Restore version",
      }),
    );
    await wait(50);

    expect(screen.getByLabelText("Article text")).toHaveValue("The first text");
    expect(screen.queryByRole("dialog", { name: "History" })).toBeNull();
  });

  it("stops saving and says to reload when a restore went through and the article can't be read back", async () => {
    contentApi.versions.mockResolvedValue({ versions: VERSIONS });
    contentApi.version.mockResolvedValue({
      ...VERSIONS[1],
      body_markdown: "The first text",
    });
    contentApi.restoreVersion.mockImplementation(async () => {
      contentApi.get.mockRejectedValue(new Error("offline"));
      return { message: "Version restored" };
    });
    const user = renderPage();
    await user.type(screen.getByLabelText("Article text"), "?");

    const drawer = await openHistory(user);
    await user.click(
      within(drawer).getByRole("button", { name: /As first written/ }),
    );
    await within(drawer).findByLabelText("Version text");
    await user.click(
      within(drawer).getByRole("button", { name: "Restore this version" }),
    );
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Restore version",
      }),
    );
    await wait(50);

    expect(
      within(drawer).getByText(/The version was restored, but this page/),
    ).toBeInTheDocument();
    // The text from before the restore is never saved over the restored article.
    await wait(6000);
    expect(update).not.toHaveBeenCalled();
  });

  it("says so when the restore itself fails, and changes nothing", async () => {
    contentApi.versions.mockResolvedValue({ versions: VERSIONS });
    contentApi.version.mockResolvedValue({
      ...VERSIONS[1],
      body_markdown: "The first text",
    });
    contentApi.restoreVersion.mockRejectedValue(
      new Error("Another article has this title"),
    );
    const user = renderPage();

    const drawer = await openHistory(user);
    await user.click(
      within(drawer).getByRole("button", { name: /As first written/ }),
    );
    await within(drawer).findByLabelText("Version text");
    await user.click(
      within(drawer).getByRole("button", { name: "Restore this version" }),
    );
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Restore version",
      }),
    );
    await wait(50);

    expect(
      within(drawer).getByText(/Another article has this title/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Article text")).toHaveValue("Hello");
  });
});
