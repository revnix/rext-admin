import { parseOperationEvent } from "@/lib/sse-message";

const operationEvent = {
  id: "5b0c6c1e-2f0a-4a8e-9a43-4a9c2a6f2b11",
  operation_id: "user-notifications-1",
  scope: "workspace",
  step: "scrape.started",
  status: "started",
  message: "Scraping website",
  progress: 10,
  payload: null,
  timestamp: "2026-10-06T01:50:00+00:00",
};
const json = JSON.stringify(operationEvent);

describe("parseOperationEvent", () => {
  it("reads a single frame: the event names it and data is the JSON", () => {
    const parsed = parseOperationEvent({
      event: "workspace.scrape.started",
      data: json,
    });

    expect(parsed).toEqual({
      event: { ...operationEvent, payload: undefined },
      nested: false,
    });
  });

  it("reads the older backend's frame nested inside data:", () => {
    // fetchEventSource joins the outer data: lines with newlines.
    const nestedData = `id: ${operationEvent.id}\nevent: workspace.scrape.started\ndata: ${json}\n\n`;

    const parsed = parseOperationEvent({ event: "", data: nestedData });

    expect(parsed).toEqual({
      event: { ...operationEvent, payload: undefined },
      nested: true,
    });
  });

  it("reads JSON sent without an event name", () => {
    expect(parseOperationEvent({ data: json })).toMatchObject({
      event: { step: "scrape.started" },
      nested: false,
    });
  });

  it("refuses data that is not JSON", () => {
    expect(
      parseOperationEvent({ event: "workspace.scrape.started", data: "nope" }),
    ).toHaveProperty("error");
  });

  it("refuses an event the schema does not accept", () => {
    const parsed = parseOperationEvent({
      event: "workspace.scrape.started",
      data: JSON.stringify({ ...operationEvent, status: "exploded" }),
    });

    expect(parsed).toHaveProperty("error");
    expect("error" in parsed && parsed.error).toContain("status");
  });
});
