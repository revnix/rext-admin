import { renderHook } from "@testing-library/react";
import { useWorkspaceAutoSelect } from "@/hooks/use-workspace-auto-select";

const mockUseQuery = jest.fn();
const mockSetCurrentWorkspace = jest.fn();
const mockSetWorkspaceList = jest.fn();

const mockWorkspaceStoreState = {
  currentWorkspace: null,
  workspaceList: [] as Array<{ id: string }>,
  setCurrentWorkspace: mockSetCurrentWorkspace,
  setWorkspaceList: mockSetWorkspaceList,
  recentWorkspaces: [] as string[],
};

jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    workspaces: {
      list: jest.fn(),
    },
  },
}));

jest.mock("@/stores/workspace", () => ({
  useWorkspaceStore: (
    selector: (state: typeof mockWorkspaceStoreState) => unknown,
  ) => selector(mockWorkspaceStoreState),
}));

describe("useWorkspaceAutoSelect", () => {
  beforeEach(() => {
    mockWorkspaceStoreState.currentWorkspace = null;
    mockWorkspaceStoreState.workspaceList = [];
    mockWorkspaceStoreState.recentWorkspaces = [];
  });

  it("reports fetched workspaces before the persisted store is synchronized", () => {
    const fetchedWorkspace = { id: "workspace-1", slug: "workspace-1" };
    mockUseQuery.mockReturnValue({
      data: { workspaces: [fetchedWorkspace] },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useWorkspaceAutoSelect());

    expect(result.current.hasWorkspaces).toBe(true);
    expect(mockSetWorkspaceList).toHaveBeenCalledWith([fetchedWorkspace]);
  });

  it("does not report stale persisted workspaces after an empty response", () => {
    mockWorkspaceStoreState.workspaceList = [{ id: "stale-workspace" }];
    mockUseQuery.mockReturnValue({
      data: { workspaces: [] },
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useWorkspaceAutoSelect());

    expect(result.current.hasWorkspaces).toBe(false);
  });
});
