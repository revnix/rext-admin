import { createContentNamespace } from "@/lib/api-client/content";
import type { ApiClient } from "@/lib/api-client/core";
import type { WordPressPostStatus } from "@/types/content";

const statuses: WordPressPostStatus[] = ["publish", "draft", "pending"];

function createMockContentApi() {
  const request = jest.fn().mockResolvedValue({});
  const api = createContentNamespace({
    request,
  } as unknown as ApiClient);
  return { api, request };
}

describe("content API WordPress post status", () => {
  it.each(statuses)(
    "passes %s as a query parameter when saving and publishing new content",
    async (status) => {
      const { api, request } = createMockContentApi();

      await api.save_publish("workspace-1", { title: "Test" }, status);

      expect(request).toHaveBeenCalledWith(
        `/api/v1/content/publish?workspace_id=workspace-1&publish_status=${status}`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ title: "Test" }),
        }),
      );
    },
  );

  it.each(statuses)(
    "passes %s in the request body when publishing existing content",
    async (status) => {
      const { api, request } = createMockContentApi();

      await api.publish(
        "workspace-1",
        { title: "Test", status: "ignored" },
        "content-1",
        status,
      );

      expect(request).toHaveBeenCalledWith(
        "/api/v1/content/content-1/publish?workspace_id=workspace-1",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ title: "Test", status }),
        }),
      );
    },
  );

  it("preserves publish as the existing default", async () => {
    const { api, request } = createMockContentApi();

    await api.save_publish("workspace-1", { title: "Test" });

    expect(request.mock.calls[0][0]).toContain("publish_status=publish");
  });
});
