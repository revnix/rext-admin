/**
 * The workspace's Trash (D13b): its deleted articles and personas on the one trash table, the
 * purge stated in the backend's days, Restore and Delete forever by kind, each only for whoever
 * may delete that kind.
 */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WorkspaceTrashSection } from "@/components/workspace-settings/workspace-trash-section";
import { apiClient } from "@/lib/api-client";

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    workspaces: {
      getTrash: jest.fn(),
      restoreTrashItem: jest.fn(),
      deleteTrashItemForever: jest.fn(),
    },
  },
}));
// On /w/<slug> pages the provider's workspaceId is the slug; the trash uses the workspace's id.
const mockWorkspace: {
  workspaceId: string;
  workspace: { id: string } | undefined;
  error: Error | null;
} = { workspaceId: "acme", workspace: { id: "w1" }, error: null };
jest.mock("@/providers/workspace-provider", () => ({
  useWorkspace: () => mockWorkspace,
}));
const mockCan: Record<string, boolean> = {};
jest.mock("@/hooks/use-permission", () => ({
  useWorkspacePermission: (permission: string) => ({
    hasPermission: mockCan[permission] ?? true,
  }),
}));

const workspaces = apiClient.workspaces as unknown as Record<string, jest.Mock>;

const ARTICLE = {
  kind: "article",
  id: "a1",
  name: "Content calendar guide",
  deleted_at: "2026-10-05T10:00:00Z",
  deleted_by: { id: "u1", name: "Mary" },
  recovery_deadline: "2026-11-04T10:00:00Z",
  days_remaining: 28,
};
const PERSONA = {
  kind: "persona",
  id: "p1",
  name: "Marketing lead",
  deleted_at: "2026-10-06T10:00:00Z",
  deleted_by: null,
  recovery_deadline: "2026-11-05T10:00:00Z",
  days_remaining: 29,
};

function renderTrash(items = [ARTICLE, PERSONA]) {
  workspaces.getTrash.mockResolvedValue({
    items,
    total_count: items.length,
    retention_days: 30,
  });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <WorkspaceTrashSection />
    </QueryClientProvider>,
  );
  return client;
}

async function chooseFromMenu(item: string, action: RegExp) {
  const menus = await screen.findAllByRole("button", {
    name: `Actions for ${item}`,
  });
  await userEvent.click(menus[0]);
  await userEvent.click(await screen.findByRole("menuitem", { name: action }));
}

describe("WorkspaceTrashSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(mockCan)) delete mockCan[key];
    mockWorkspace.workspace = { id: "w1" };
    mockWorkspace.error = null;
  });

  it("lists deleted articles and personas, and says when they go for good", async () => {
    renderTrash();

    expect(
      (await screen.findAllByText("Content calendar guide")).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Marketing lead").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Article").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Persona").length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /Deleted articles and personas stay here for 30 days, then they're deleted for good\./,
      ),
    ).toBeInTheDocument();
    expect(workspaces.getTrash).toHaveBeenCalledWith("w1");
  });

  it("restores an article through its own kind's route", async () => {
    workspaces.restoreTrashItem.mockResolvedValue(undefined);
    renderTrash();

    await chooseFromMenu("Content calendar guide", /Restore/);

    await waitFor(() =>
      expect(workspaces.restoreTrashItem).toHaveBeenCalledWith(
        "w1",
        "article",
        "a1",
      ),
    );
  });

  it("deletes a persona for good only after the confirmation, saying what goes", async () => {
    workspaces.deleteTrashItemForever.mockResolvedValue(undefined);
    renderTrash();

    await chooseFromMenu("Marketing lead", /Delete forever/);
    const dialog = await screen.findByRole("alertdialog");
    expect(
      within(dialog).getByText(/The persona and its photo go\./),
    ).toBeInTheDocument();
    expect(workspaces.deleteTrashItemForever).not.toHaveBeenCalled();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Delete forever" }),
    );

    await waitFor(() =>
      expect(workspaces.deleteTrashItemForever).toHaveBeenCalledWith(
        "w1",
        "persona",
        "p1",
      ),
    );
  });

  it("offers no actions on a kind the person may not delete", async () => {
    mockCan["persona.delete"] = false;
    renderTrash();

    expect(
      await screen.findAllByRole("button", {
        name: "Actions for Content calendar guide",
      }),
    ).not.toHaveLength(0);
    expect(
      screen.queryByRole("button", { name: "Actions for Marketing lead" }),
    ).not.toBeInTheDocument();
  });

  it("says what lands here when the trash is empty", async () => {
    renderTrash([]);

    expect(await screen.findByText("Nothing in the trash")).toBeInTheDocument();
  });

  it("says the workspace didn't load, not that the trash is empty, and reads it again", async () => {
    mockWorkspace.workspace = undefined;
    mockWorkspace.error = new Error("The workspace didn't load");
    const client = renderTrash();
    const refetch = jest.spyOn(client, "refetchQueries");

    expect(
      await screen.findByText("The trash didn't load"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Nothing in the trash")).not.toBeInTheDocument();
    expect(workspaces.getTrash).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(refetch).toHaveBeenCalledWith({
      queryKey: expect.arrayContaining(["acme"]),
    });
  });
});
