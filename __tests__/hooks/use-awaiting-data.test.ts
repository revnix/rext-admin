import { awaitingData } from "@/hooks/use-awaiting-data";

const pending = { isPending: true };
const settled = { isPending: false };
const loaded = { id: "w1", error: null };

describe("awaitingData", () => {
  it("waits while the workspace is being read, whatever the query says", () => {
    expect(awaitingData(settled, { error: null })).toBe(true);
    expect(awaitingData(pending, { error: null }, false)).toBe(true);
  });

  it("stops once reading the workspace failed, so the page can say so", () => {
    expect(awaitingData(pending, { error: new Error("502") })).toBe(false);
  });

  it("then waits while the query has no data, fetching or held back", () => {
    expect(awaitingData(pending, loaded)).toBe(true);
    expect(awaitingData(settled, loaded)).toBe(false);
  });

  it("doesn't wait for a query that never runs here", () => {
    expect(awaitingData(pending, loaded, false)).toBe(false);
  });
});
