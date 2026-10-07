/**
 * Scheduling with no connected site (#705, the founder's feedback v2): the schedule dialog says a
 * site comes first and links to set one up in a new tab, instead of failing on Schedule; once a
 * site is connected (read again when the window regains focus), it shows the dates.
 */

import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { act, render, screen, within } from "@testing-library/react";
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
      schedule: jest.fn(),
    },
  },
}));

const api = jest.requireMock("@/lib/api-client").apiClient as {
  integrations: { list: jest.Mock };
  content: { schedule: jest.Mock };
};

const editor = () => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <ContentEditor
      contentId="c1"
      allContent={{ title: "How to start a podcast" } as never}
      readabilityScore={{ flesch_reading_ease: 60 } as never}
      trustScore={{ score: 70 } as never}
      seoScore={{ seo_health_score: 90, issues: [] } as never}
      generatedContent="Body"
      userKeyword="start a podcast"
      outline={null}
    />
  </QueryClientProvider>
);

async function openSchedule() {
  const user = userEvent.setup();
  screen.getAllByRole("button", { name: "Publish" })[0].focus();
  await user.keyboard("{Enter}");
  await user.click(
    await screen.findByRole("menuitem", { name: "Schedule for Later" }),
  );
  return screen.findByRole("dialog");
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Scheduling an article", () => {
  it("asks for a site first, with a link to set one up in a new tab", async () => {
    api.integrations.list.mockResolvedValue([]);
    render(editor());
    const dialog = await openSchedule();

    expect(
      await within(dialog).findByText("Connect a site first"),
    ).toBeInTheDocument();
    const link = within(dialog).getByRole("link", {
      name: "Set up an integration",
    });
    expect(link).toHaveAttribute("href", "/w/nextly/integrations");
    expect(link).toHaveAttribute("target", "_blank");
    expect(
      within(dialog).queryByRole("button", { name: "Schedule" }),
    ).toBeNull();
    expect(within(dialog).queryByLabelText("Time")).toBeNull();
    expect(api.content.schedule).not.toHaveBeenCalled();
  });

  it("shows the dates once a site is connected in another tab", async () => {
    api.integrations.list.mockResolvedValue([]);
    render(editor());
    const dialog = await openSchedule();
    await within(dialog).findByText("Connect a site first");

    api.integrations.list.mockResolvedValue([
      { id: "s1", is_active: true, integration_type: "wordpress" },
    ]);
    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });

    expect(await within(dialog).findByLabelText("Time")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Schedule" }),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText("Connect a site first")).toBeNull();
  });

  it("goes straight to the dates when a site is connected", async () => {
    api.integrations.list.mockResolvedValue([
      { id: "s1", is_active: true, integration_type: "wordpress" },
    ]);
    render(editor());
    const dialog = await openSchedule();

    expect(await within(dialog).findByLabelText("Time")).toBeInTheDocument();
    expect(within(dialog).queryByText("Connect a site first")).toBeNull();
  });

  it("shows no dates when the sites couldn't be checked, and checks again on request", async () => {
    api.integrations.list.mockRejectedValue(new Error("Network error"));
    render(editor());
    const dialog = await openSchedule();

    expect(
      await within(dialog).findByText(
        "Your sites couldn't be checked",
        undefined,
        {
          timeout: 8000,
        },
      ),
    ).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Time")).toBeNull();
    expect(
      within(dialog).queryByRole("button", { name: "Schedule" }),
    ).toBeNull();

    api.integrations.list.mockResolvedValue([
      { id: "s1", is_active: true, integration_type: "wordpress" },
    ]);
    await userEvent
      .setup()
      .click(within(dialog).getByRole("button", { name: "Try again" }));
    expect(await within(dialog).findByLabelText("Time")).toBeInTheDocument();
  });

  it("shows no dates when a later check fails, even with an earlier answer cached", async () => {
    api.integrations.list.mockResolvedValue([
      { id: "s1", is_active: true, integration_type: "wordpress" },
    ]);
    render(editor());
    const dialog = await openSchedule();
    await within(dialog).findByLabelText("Time");

    api.integrations.list.mockRejectedValue(new Error("Network error"));
    act(() => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });

    expect(
      await within(dialog).findByText("Your sites couldn't be checked"),
    ).toBeInTheDocument();
    expect(within(dialog).queryByLabelText("Time")).toBeNull();
    expect(
      within(dialog).queryByRole("button", { name: "Schedule" }),
    ).toBeNull();
  });

  it("treats a paused site as none", async () => {
    api.integrations.list.mockResolvedValue([
      { id: "s1", is_active: false, integration_type: "wordpress" },
    ]);
    render(editor());
    const dialog = await openSchedule();

    expect(
      await within(dialog).findByText("Connect a site first"),
    ).toBeInTheDocument();
  });
});
