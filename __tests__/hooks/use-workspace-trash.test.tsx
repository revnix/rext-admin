import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  useDeleteWorkspaceForever,
  useRestoreWorkspace,
} from "@/hooks/mutations/use-workspace-trash";

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    workspaces: { restore: jest.fn(), deletePermanently: jest.fn() },
  },
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const workspaces = jest.requireMock("@/lib/api-client").apiClient
  .workspaces as { restore: jest.Mock; deletePermanently: jest.Mock };
const toast = jest.requireMock("sonner").toast as {
  success: jest.Mock;
  error: jest.Mock;
};

const ACME = { id: "ws-1", name: "Acme Blog" };

function setup() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const invalidate = jest.spyOn(client, "invalidateQueries");
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return { wrapper, invalidate };
}

describe("the account trash's actions", () => {
  beforeEach(() => {
    workspaces.restore.mockReset();
    workspaces.deletePermanently.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it("restores a workspace, names it, and refreshes the workspace lists", async () => {
    workspaces.restore.mockResolvedValue({});
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(() => useRestoreWorkspace(), { wrapper });

    await act(() => result.current.mutateAsync(ACME));

    expect(workspaces.restore).toHaveBeenCalledWith("ws-1");
    expect(toast.success).toHaveBeenCalledWith('"Acme Blog" was restored');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["workspaces"] });
  });

  it("deletes a workspace for good and refreshes the trash", async () => {
    workspaces.deletePermanently.mockResolvedValue(undefined);
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(() => useDeleteWorkspaceForever(), {
      wrapper,
    });

    await act(() => result.current.mutateAsync(ACME));

    expect(workspaces.deletePermanently).toHaveBeenCalledWith("ws-1");
    expect(toast.success).toHaveBeenCalledWith(
      '"Acme Blog" was deleted for good',
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["workspaces", "deleted"],
    });
  });

  it("says why deleting failed and rejects, so the confirmation stays open", async () => {
    workspaces.deletePermanently.mockRejectedValue(
      new Error("Service unavailable"),
    );
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(() => useDeleteWorkspaceForever(), {
      wrapper,
    });

    await act(async () => {
      await expect(result.current.mutateAsync(ACME)).rejects.toThrow(
        "Service unavailable",
      );
    });

    expect(toast.error).toHaveBeenCalledWith("Service unavailable");
    expect(toast.success).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
  });
});
