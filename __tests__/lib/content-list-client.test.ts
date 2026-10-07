/**
 * The content list's query (rext-control#381): lists go to the backend comma-separated, and empty
 * ones and a blank search are left out.
 */

import { createContentNamespace } from "@/lib/api-client/content";
import type { ApiClient } from "@/lib/api-client/core";

describe("content.list", () => {
  const request = jest.fn().mockResolvedValue({ content: [], total_count: 0 });
  const content = createContentNamespace({ request } as unknown as ApiClient);

  beforeEach(() => request.mockClear());

  it("sends the statuses and personas comma-separated, with the search and the sort", async () => {
    await content.list("w1", {
      q: " seo ",
      status: ["draft", "review"],
      persona: ["p1", "none"],
      sort: "title.asc",
      limit: 25,
      offset: 50,
    });

    const [url] = request.mock.calls[0];
    const params = new URL(url, "http://x").searchParams;
    expect(params.get("q")).toBe("seo");
    expect(params.get("status")).toBe("draft,review");
    expect(params.get("persona")).toBe("p1,none");
    expect(params.get("sort")).toBe("title.asc");
    expect(params.get("offset")).toBe("50");
  });

  it("leaves out empty lists and a blank search", async () => {
    await content.list("w1", { q: "  ", status: [], persona: [], limit: 25 });

    const params = new URL(request.mock.calls[0][0], "http://x").searchParams;
    expect([...params.keys()].sort()).toEqual(["limit", "workspace_id"]);
  });
});
