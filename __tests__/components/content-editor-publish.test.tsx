/**
 * The article's Publish menu (#676): on an article that is live on a site, "Save as Draft" warns that
 * the post leaves the site, and keeping it live sends nothing. A publish links to the post.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContentEditor } from "@/components/generate-content/content";

jest.mock("marked", () => ({
  marked: { parse: (text: string) => text, use: jest.fn() },
}));

jest.mock("@/providers/workspace-provider", () => {
  const workspace = {
    workspace: { id: "w1", slug: "nextly", name: "Nextly" },
    workspaceSlug: "nextly",
    workspaceId: "w1",
    isLoading: false,
  };
  return {
    useWorkspace: () => workspace,
    useWorkspaceOptional: () => workspace,
    WorkspaceProvider: ({ children }: { children: React.ReactNode }) =>
      children,
  };
});

jest.mock("@/stores/workspace/use-workspace-context-store", () => ({
  ...jest.requireActual("@/stores/workspace/use-workspace-context-store"),
  useCurrentWorkspaceId: () => "w1",
  useCurrentWorkspaceSlug: () => "nextly",
}));

jest.mock("@/hooks/use-permission", () => ({
  ...jest.requireActual("@/hooks/use-permission"),
  useWorkspacePermission: () => ({ hasPermission: true, isLoading: false }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/w/nextly/content/c1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ workspaceSlug: "nextly" }),
}));

jest.mock("@/lib/api-client", () => ({
  ApiError: jest.requireActual("@/lib/api-client/core").ApiError,
  apiClient: {
    profile: { get: jest.fn().mockResolvedValue({}) },
    integrations: {
      list: jest
        .fn()
        .mockResolvedValue([
          { id: "s1", is_active: true, integration_type: "wordpress" },
        ]),
    },
    content: {
      update: jest.fn().mockResolvedValue({}),
      publish: jest.fn(),
    },
  },
}));

const api = jest.requireMock("@/lib/api-client").apiClient as {
  content: { update: jest.Mock; publish: jest.Mock };
};

const editor = (isLive: boolean) => (
  <QueryClientProvider client={new QueryClient()}>
    <ContentEditor
      contentId="c1"
      isLive={isLive}
      allContent={{ title: "How to start a podcast" } as never}
      readabilityScore={{ flesch_reading_ease: 60 } as never}
      trustScore={{ score: 70 } as never}
      seoScore={{ seo_health_score: 90, issues: [] } as never}
      generatedContent="Body"
      isEditing={false}
      userKeyword="start a podcast"
      outline={null}
      onEditToggle={jest.fn()}
      onContentChange={jest.fn()}
    />
  </QueryClientProvider>
);

async function choose(item: string) {
  const user = userEvent.setup();
  const trigger = screen.getAllByRole("button", { name: "Publish" })[0];
  trigger.focus();
  await user.keyboard("{Enter}");
  await user.click(await screen.findByRole("menuitem", { name: item }));
  return { user, dialog: await screen.findByRole("alertdialog") };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("The article's Publish menu", () => {
  it("warns before a draft save takes a live post down, and keeping it live sends nothing", async () => {
    render(editor(true));
    const { user, dialog } = await choose("Save as Draft");

    expect(
      within(dialog).getByText("Take the post down from your site?"),
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Keep it live" }),
    );

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    expect(api.content.update).not.toHaveBeenCalled();
    expect(api.content.publish).not.toHaveBeenCalled();
  });

  it("takes the post down only when the user says so", async () => {
    api.content.publish.mockResolvedValue({ content: {} });
    render(editor(true));
    const { user, dialog } = await choose("Submit for Review");

    await user.click(
      within(dialog).getByRole("button", { name: "Take the post down" }),
    );

    await waitFor(
      () =>
        expect(api.content.publish).toHaveBeenCalledWith(
          "w1",
          expect.anything(),
          "c1",
          "pending",
        ),
      { timeout: 4000 },
    );
  });

  it.each([
    [
      "every site took the draft",
      { failed: 0, successful: 1 },
      "Save as a draft on your site?",
    ],
    [
      "a site missed it",
      { failed: 1, successful: 1 },
      "Take the post down from your site?",
    ],
  ])(
    "after a draft save where %s, the next one asks accordingly",
    async (_, outcome, nextTitle) => {
      api.content.publish.mockResolvedValue({
        content: {},
        publish_results: { total_sites: 2, all_failed: false, ...outcome },
      });
      render(editor(true));
      const first = await choose("Save as Draft");
      await first.user.click(
        within(first.dialog).getByRole("button", {
          name: "Take the post down",
        }),
      );
      expect(
        await screen.findByText("Saved as a draft on your site", undefined, {
          timeout: 4000,
        }),
      ).toBeInTheDocument();
      await first.user.click(
        within(screen.getByRole("dialog")).getAllByRole("button", {
          name: "Close",
        })[0],
      );
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

      const second = await choose("Save as Draft");
      expect(within(second.dialog).getByText(nextTitle)).toBeInTheDocument();
    },
  );

  it("asks plainly on an article that isn't live", async () => {
    render(editor(false));
    const { dialog } = await choose("Save as Draft");

    expect(
      within(dialog).getByText("Save as a draft on your site?"),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Save as draft" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Confirm" }),
    ).toBeNull();
  });

  it("links to the post after a publish", async () => {
    api.content.publish.mockResolvedValue({
      content: { wordpress_url: "https://example.com/how-to-start/" },
    });
    render(editor(false));
    const { user, dialog } = await choose("Publish");

    await user.click(
      within(dialog).getByRole("button", { name: "Publish article" }),
    );

    expect(
      await screen.findByText("The article is live", undefined, {
        timeout: 4000,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the post" })).toHaveAttribute(
      "href",
      "https://example.com/how-to-start/",
    );
  });
});
