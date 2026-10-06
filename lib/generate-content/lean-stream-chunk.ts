/** A chunk of a LangGraph run's stream, as the generation routes pass it on. */
export interface StreamChunk {
  event?: string;
  data?: unknown;
}

/**
 * What a token event carries to the browser (E21). The generation routes pass LangGraph's stream on
 * as it comes, and each `messages` chunk is one model token beside LangGraph's run metadata: about
 * 1.4 KB of it per token (the step, its triggers and path, checkpoint namespaces, `ls_*` keys), of
 * which the view reads only the node's name (`readMessageToken` in run-events.ts). So a token keeps
 * its message's content, id and type and its node; every other chunk passes on as it came.
 */
export function leanChunk(chunk: StreamChunk): StreamChunk {
  const name = chunk.event ?? "";
  if (name !== "messages" && !name.startsWith("messages|")) return chunk;
  if (!Array.isArray(chunk.data)) return chunk;
  const [message, metadata] = chunk.data as [unknown, unknown];
  const { content, id, type } = (message ?? {}) as {
    content?: unknown;
    id?: unknown;
    type?: unknown;
  };
  const node = (metadata as { langgraph_node?: unknown } | null)
    ?.langgraph_node;
  return {
    ...chunk,
    data: [{ content, id, type }, { langgraph_node: node }],
  };
}
