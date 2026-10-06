import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { useTrashContent } from "@/hooks/use-content";

jest.mock("@/lib/api-client", () => ({
  apiClient: { content: { delete: jest.fn() } },
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const remove = jest.requireMock("@/lib/api-client").apiClient.content
  .delete as jest.Mock;
const toast = jest.requireMock("sonner").toast as {
  success: jest.Mock;
  error: jest.Mock;
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("moving articles to the trash", () => {
  beforeEach(() => {
    remove.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it("moves each one and says so once", async () => {
    remove.mockResolvedValue(undefined);
    const { result } = renderHook(() => useTrashContent(), { wrapper });
    await act(() =>
      result.current.mutateAsync({
        workspaceId: "ws-1",
        contentIds: ["a", "b", "c"],
      }),
    );
    expect(remove.mock.calls).toEqual([
      ["ws-1", "a"],
      ["ws-1", "b"],
      ["ws-1", "c"],
    ]);
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("Moved 3 articles to the trash");
  });

  it("says how many were not moved when some fail", async () => {
    remove
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Not found"));
    const { result } = renderHook(() => useTrashContent(), { wrapper });
    await act(() =>
      result.current.mutateAsync({
        workspaceId: "ws-1",
        contentIds: ["a", "b"],
      }),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(
      "1 of 2 articles weren't moved to the trash. Try them again.",
    );
  });
});
