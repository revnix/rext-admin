import {
  isOutlineToken,
  readMessageToken,
  readRunFailedEvent,
  readStoppedRun,
  runIsGoing,
  settlesRun,
} from "@/lib/generate-content/run-events";

// Recorded from LangGraph's own stream in messages-tuple mode (langgraph
// 1.2.12, langgraph-api 0.12.6): the content subgraph's topic step, then its
// outline step, each model streaming its JSON token by token. The model was a
// fake one, so the run cost nothing; the fields the dashboard does not read
// were dropped.
import recorded from "../fixtures/generation-stream/messages-tuple.json";

describe("readRunFailedEvent", () => {
  it("reads the backend's run.failed event", () => {
    expect(
      readRunFailedEvent({
        type: "run",
        step: "run.failed",
        error_code: "no_serp_data",
        serp_status: "no_results",
        message: "No search results were found for this keyword.",
      }),
    ).toEqual({
      errorCode: "no_serp_data",
      message: "No search results were found for this keyword.",
    });
  });

  it("falls back to a plain message", () => {
    expect(readRunFailedEvent({ type: "run", step: "run.failed" })).toEqual({
      errorCode: null,
      message: "This run stopped before it finished.",
    });
  });

  it.each([
    null,
    undefined,
    "run.failed",
    { type: "credits", step: "credits.exhausted" },
    { type: "run", step: "run.started" },
  ])("ignores %p", (data) => {
    expect(readRunFailedEvent(data)).toBeNull();
  });
});

describe("readStoppedRun", () => {
  it("reads a run that ended for want of search results from its state", () => {
    expect(
      readStoppedRun({
        content: {
          error: "No search results were found for this keyword.",
          error_code: "no_serp_data",
        },
      }),
    ).toBe("No search results were found for this keyword.");
    expect(readStoppedRun({ content: { error_code: "no_serp_data" } })).toBe(
      "This run stopped before it finished.",
    );
  });

  it("reads a run whose topic step wrote no titles from its state", () => {
    const message =
      "Title ideas could not be written for this keyword just now. Please try again in a few minutes.";
    expect(
      readStoppedRun({
        content: { error: message, error_code: "topic_generation_failed" },
      }),
    ).toBe(message);
  });

  it.each([
    undefined,
    null,
    {},
    { content: {} },
    {
      content: {
        error: "Insufficient credits.",
        error_code: "insufficient_credits",
      },
    },
    { content: { error: "Something broke." } },
    { content: { error: "Something broke.", error_code: "some_other_code" } },
  ])("leaves other states to the restore path: %p", (values) => {
    expect(readStoppedRun(values)).toBeNull();
  });
});

describe("settlesRun", () => {
  it.each([
    [
      "a pause for the user",
      { event: "updates", data: { __interrupt__: [{ value: {} }] } },
    ],
    [
      "a pause inside a subgraph",
      {
        event: "updates|content_engine:1",
        data: { __interrupt__: [{ value: { type: "outline_review" } }] },
      },
    ],
    [
      "the finished article",
      { event: "updates", data: { content_engine: { content: {} } } },
    ],
    [
      "the credit gate",
      { event: "updates", data: { insufficient_credits: { content: {} } } },
    ],
    ["an empty search", { event: "updates", data: { no_serp_data: {} } }],
    [
      "a topic step without titles",
      { event: "updates|content_engine:1", data: { topics_failed: {} } },
    ],
    [
      "a failure the backend reported",
      {
        event: "custom",
        data: { type: "run", step: "run.failed", message: "No results." },
      },
    ],
  ])("settles on %s", (_label, chunk) => {
    expect(settlesRun(chunk)).toBe(true);
  });

  it.each([
    ["run/created", { event: "run/created", data: { run_id: "r1" } }],
    [
      "a node inside the writing stage",
      {
        event: "updates|content_engine:1",
        data: { generate_content: { content: {} } },
      },
    ],
    [
      "a token",
      {
        event: "messages|content_engine:1",
        data: [{ content: "Hello" }, { langgraph_node: "generate_outline" }],
      },
    ],
    [
      "a progress event",
      { event: "custom", data: { type: "tool_start", name: "web_search" } },
    ],
    ["metadata", { event: "metadata", data: { run_id: "r1" } }],
    ["an empty update", { event: "updates", data: null }],
  ])("leaves the run open on %s", (_label, chunk) => {
    expect(settlesRun(chunk)).toBe(false);
  });
});

describe("runIsGoing", () => {
  it.each(["pending", "running"])("is going while %s", (status) => {
    expect(runIsGoing(status)).toBe(true);
  });

  it.each(["success", "error", "timeout", "interrupted", undefined])(
    "is over when %p",
    (status) => {
      expect(runIsGoing(status)).toBe(false);
    },
  );
});

describe("readMessageToken", () => {
  it("reads one token and the node that wrote it", () => {
    expect(
      readMessageToken({
        event: "messages|content_engine:1",
        data: [
          { content: "Cold", type: "AIMessageChunk" },
          { langgraph_node: "generate_outline" },
        ],
      }),
    ).toEqual({ token: "Cold", node: "generate_outline" });
  });

  it("joins the text parts of a list of content blocks", () => {
    expect(
      readMessageToken({
        event: "messages",
        data: [
          {
            content: [
              { type: "text", text: "Cold " },
              { type: "tool_use", input: "{}" },
              "brew",
            ],
          },
          {},
        ],
      }),
    ).toEqual({ token: "Cold brew", node: null });
  });

  it("reads a chunk with no text as an empty token", () => {
    expect(
      readMessageToken({
        event: "messages",
        data: [
          { content: "", tool_call_chunks: [{ args: '{"body' }] },
          { langgraph_node: "generate_content" },
        ],
      }),
    ).toEqual({ token: "", node: "generate_content" });
  });

  it.each([
    ["the older whole-message event", "messages/partial"],
    ["its metadata event", "messages/metadata"],
    ["an update", "updates|content_engine:1"],
    ["a custom event", "custom"],
  ])("ignores %s", (_label, event) => {
    expect(readMessageToken({ event, data: [{ content: "x" }, {}] })).toBe(
      null,
    );
  });
});

describe("the live outline from a recorded stream", () => {
  const outlineText = (events: Array<{ event: string; data: unknown }>) =>
    events
      .map(readMessageToken)
      .filter((message) => message !== null && isOutlineToken(message))
      .map((message) => message?.token)
      .join("");

  it("gets the outline's text once, as written", () => {
    const text = outlineText(recorded);
    expect(JSON.parse(text)).toMatchObject({
      title: "Cold brew at home",
      sections: [{ heading: "What you need" }],
      tone: "Friendly",
    });
    expect(text.match(/"title"/g)).toHaveLength(1);
  });

  it("leaves out the topic step's tokens", () => {
    expect(
      recorded.some((e) => readMessageToken(e)?.node === "topic_generation"),
    ).toBe(true);
    expect(outlineText(recorded)).not.toContain("topics");
  });
});
