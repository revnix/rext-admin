/**
 * A token event carries only what the view reads (E21): the token and its node, so the outline's
 * live text works as before, at a fraction of the bytes.
 */
import { leanChunk } from "@/lib/generate-content/lean-stream-chunk";
import { readMessageToken } from "@/lib/generate-content/run-events";

/** A `messages` chunk as LangGraph sends one model token, with its run metadata. */
function tokenChunk(content: unknown, event = "messages") {
  return {
    event,
    data: [
      {
        content,
        additional_kwargs: {},
        response_metadata: { model_provider: "openai" },
        type: "AIMessageChunk",
        name: null,
        id: "run--4a1c0e2f-0000-4000-8000-000000000001",
        example: false,
        tool_calls: [],
        invalid_tool_calls: [],
        usage_metadata: null,
        tool_call_chunks: [],
      },
      {
        created_by: "system",
        graph_id: "agent",
        assistant_id: "fe096781-5601-53d2-b2f6-0d3403f7e9ca",
        run_attempt: 1,
        langgraph_version: "1.0.10",
        langgraph_api_version: "0.5.0",
        langgraph_plan: "developer",
        langgraph_host: "self-hosted",
        langgraph_api_url: "http://127.0.0.1:2024",
        run_id: "01a1119b-0000-7000-8000-000000000002",
        thread_id: "01a1119b-0000-7000-8000-000000000003",
        user_id: "b0b0b0b0-0000-4000-8000-000000000004",
        workspace_id: "c1c1c1c1-0000-4000-8000-000000000005",
        langgraph_step: 14,
        langgraph_node: "generate_outline",
        langgraph_triggers: ["branch:to:generate_outline"],
        langgraph_path: ["__pregel_pull", "generate_outline"],
        langgraph_checkpoint_ns:
          "content_engine:1f0a2b3c-0000-6000-8000-000000000006|generate_outline:1f0a2b3c-0000-6000-8000-000000000007",
        checkpoint_ns: "content_engine:1f0a2b3c-0000-6000-8000-000000000006",
        ls_provider: "openai",
        ls_model_name: "gpt-5",
        ls_model_type: "chat",
        ls_temperature: 0.4,
      },
    ],
  };
}

describe("leanChunk", () => {
  it("keeps what the view reads from a token: the text and its node", () => {
    const full = tokenChunk("## Why headless");
    expect(readMessageToken(leanChunk(full))).toEqual(readMessageToken(full));
    expect(readMessageToken(leanChunk(full))).toEqual({
      token: "## Why headless",
      node: "generate_outline",
    });
  });

  it("keeps a token whose content comes in parts, and a subgraph's event name", () => {
    const full = tokenChunk(
      [
        { type: "text", text: "Head" },
        { type: "text", text: "less" },
      ],
      "messages|content_engine:1f0a2b3c",
    );
    const lean = leanChunk(full);
    expect(lean.event).toBe("messages|content_engine:1f0a2b3c");
    expect(readMessageToken(lean)).toEqual(readMessageToken(full));
    expect(readMessageToken(lean)?.token).toBe("Headless");
  });

  it("sends a small part of the bytes", () => {
    const full = tokenChunk(" the");
    const fullBytes = JSON.stringify(full).length;
    const leanBytes = JSON.stringify(leanChunk(full)).length;
    expect(leanBytes).toBeLessThan(fullBytes / 5);
  });

  it("passes every other chunk on as it came", () => {
    const others = [
      { event: "custom", data: { type: "token", content: "x" } },
      { event: "updates", data: { generate_outline: { outline: [] } } },
      { event: "values", data: { keyword: "seo tools" } },
      { event: "run/created", data: { run_id: "r", thread_id: "t" } },
      { event: "messages", data: "not a tuple" },
      { data: [1, 2] },
    ];
    for (const chunk of others) expect(leanChunk(chunk)).toBe(chunk);
  });
});
