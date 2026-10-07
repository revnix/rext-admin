import { fetchAllContent } from "@/hooks/use-content";
import type { ContentItem } from "@/types/content";

const items = (count: number, from = 0) =>
  Array.from(
    { length: count },
    (_, i) => ({ id: `c${from + i}` }) as ContentItem,
  );

/** A backend with `total` items, answering `limit` and `offset` as content_retrieval.py does. */
function backend(total: number) {
  const calls: Array<{ limit: number; offset: number }> = [];
  const listPage = async ({
    limit,
    offset,
  }: {
    limit: number;
    offset: number;
  }) => {
    calls.push({ limit, offset });
    const count = Math.max(0, Math.min(limit, total - offset));
    return { content: items(count, offset), total_count: total };
  };
  return { calls, listPage };
}

describe("loading the whole content list", () => {
  it("reads past the old page of 100, 500 at a time", async () => {
    const { calls, listPage } = backend(1203);
    const all = await fetchAllContent(listPage);
    expect(all).toHaveLength(1203);
    expect(new Set(all.map((item) => item.id)).size).toBe(1203);
    expect(calls).toEqual([
      { limit: 500, offset: 0 },
      { limit: 500, offset: 500 },
      { limit: 500, offset: 1000 },
    ]);
  });

  it("stops after a full last page when the total is reached", async () => {
    const { calls, listPage } = backend(1000);
    expect(await fetchAllContent(listPage)).toHaveLength(1000);
    expect(calls).toHaveLength(2);
  });

  it("makes one request for a small or empty workspace", async () => {
    const small = backend(4);
    expect(await fetchAllContent(small.listPage)).toHaveLength(4);
    expect(small.calls).toHaveLength(1);
    const empty = backend(0);
    expect(await fetchAllContent(empty.listPage)).toEqual([]);
  });

  it("gives up after 40 pages when the backend repeats a full page", async () => {
    let calls = 0;
    const stuck = async () => {
      calls++;
      return { content: items(500), total_count: Number.NaN };
    };
    await fetchAllContent(stuck);
    expect(calls).toBe(40);
  });
});
