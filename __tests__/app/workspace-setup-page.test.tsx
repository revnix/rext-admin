/**
 * The page that sets up a workspace made with "Skip for now" (rext-control task 905): what it
 * shows for each state of the workspace, and to whom.
 */

import { render, screen } from "@testing-library/react";
import WorkspaceSetupPage from "@/app/w/[workspaceSlug]/setup/page";

const mockWizard = jest.fn((_: unknown) => <div>the set-up form</div>);
jest.mock("@/components/workspace", () => ({
  WorkspaceCreateWizard: (props: unknown) => mockWizard(props),
}));
jest.mock("@/hooks/use-page-title", () => ({ usePageTitle: jest.fn() }));
const may = { setUp: true, loading: false };
jest.mock("@/hooks/use-permission", () => ({
  useWorkspacePermission: () => ({
    hasPermission: may.setUp,
    isLoading: may.loading,
  }),
}));
type Run = { status: string; operation_id?: string | null } | null;
const at: {
  workspace: {
    id: string;
    slug: string;
    name: string;
    url: string | null;
    brand_voice?: object;
    pipeline?: Run;
  } | null;
} = { workspace: null };
jest.mock("@/providers/workspace-provider", () => ({
  useWorkspace: () => ({
    workspace: at.workspace ?? undefined,
    workspaceId: "my-workspace",
  }),
}));

const workspace = (pipeline: Run, more: object = {}) => ({
  id: "w1",
  slug: "my-workspace",
  name: "My workspace",
  url: null,
  pipeline,
  ...more,
});

beforeEach(() => {
  mockWizard.mockClear();
  may.setUp = true;
  may.loading = false;
  at.workspace = null;
});

describe("the page that sets a workspace up later", () => {
  it("shows the form for a workspace that has had no analysis", () => {
    at.workspace = workspace({ status: "not_started", operation_id: null });
    render(<WorkspaceSetupPage />);

    expect(screen.getByText("the set-up form")).toBeInTheDocument();
    expect(mockWizard).toHaveBeenCalledWith({
      existing: { id: "w1", slug: "my-workspace", name: "My workspace" },
    });
  });

  it("picks up a set-up that is under way, with the run to follow", () => {
    at.workspace = workspace({ status: "running", operation_id: "op-7" });
    render(<WorkspaceSetupPage />);

    expect(mockWizard).toHaveBeenCalledWith({
      existing: {
        id: "w1",
        slug: "my-workspace",
        name: "My workspace",
        resume: { operationId: "op-7", website: null },
      },
    });
  });

  it("shows the form again after a set-up that ended badly and left no brand voice", () => {
    at.workspace = workspace({ status: "failed", operation_id: "op-7" });
    render(<WorkspaceSetupPage />);

    expect(screen.getByText("the set-up form")).toBeInTheDocument();
  });

  it("sends a workspace that is set up to its brand voice", () => {
    at.workspace = workspace(
      { status: "completed", operation_id: "op-7" },
      { brand_voice: { about: "We bake." } },
    );
    render(<WorkspaceSetupPage />);

    expect(
      screen.getByText("This workspace is already set up"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open the brand voice" }),
    ).toHaveAttribute("href", "/w/my-workspace/settings/brand-voice");
    expect(mockWizard).not.toHaveBeenCalled();
  });

  it("keeps the form from someone who may not change the brand voice", () => {
    may.setUp = false;
    at.workspace = workspace({ status: "not_started", operation_id: null });
    render(<WorkspaceSetupPage />);

    expect(
      screen.getByText("You can't set up this workspace's brand voice"),
    ).toBeInTheDocument();
    expect(mockWizard).not.toHaveBeenCalled();
  });

  it("stays on the first answer while its own run moves the workspace on", () => {
    at.workspace = workspace({ status: "not_started", operation_id: null });
    const view = render(<WorkspaceSetupPage />);

    // The set-up started here: the workspace's detail now says its run is under way.
    at.workspace = workspace({ status: "running", operation_id: "op-9" });
    view.rerender(<WorkspaceSetupPage />);
    at.workspace = workspace(
      { status: "completed", operation_id: "op-9" },
      { brand_voice: { about: "We bake." } },
    );
    view.rerender(<WorkspaceSetupPage />);

    expect(screen.getByText("the set-up form")).toBeInTheDocument();
    expect(screen.queryByText("This workspace is already set up")).toBeNull();
  });
});
