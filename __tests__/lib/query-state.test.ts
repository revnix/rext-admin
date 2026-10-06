import { awaitingData } from "@/lib/query-state";

describe("awaitingData", () => {
  it("waits while a query has no data, fetching or held back until an id is known", () => {
    expect(awaitingData({ isPending: true })).toBe(true);
  });

  it("stops waiting once the query has data or an error", () => {
    expect(awaitingData({ isPending: false })).toBe(false);
  });

  it("doesn't wait for a query that never runs here", () => {
    expect(awaitingData({ isPending: true }, false)).toBe(false);
  });
});
