/**
 * A run the backend ended early, as the custom stream event it sends then:
 * `{type: "run", step: "run.failed", error_code, message}`. Today that is a
 * keyword with no search results, or a search lookup that failed
 * (error_code "no_serp_data"); the thread state carries the same message in
 * `content.error`, which the dock's status poll reads.
 */
export type RunFailedEvent = { errorCode: string | null; message: string };

const FALLBACK_MESSAGE = "This run stopped before it finished.";

export function readRunFailedEvent(data: unknown): RunFailedEvent | null {
  if (!data || typeof data !== "object") return null;
  const event = data as Record<string, unknown>;
  if (event.type !== "run" || event.step !== "run.failed") return null;
  const message =
    typeof event.message === "string" && event.message.trim()
      ? event.message.trim()
      : FALLBACK_MESSAGE;
  return {
    errorCode: typeof event.error_code === "string" ? event.error_code : null,
    message,
  };
}

/**
 * The same early end read from the thread's state, for a run reopened later
 * (from the dock, or after a reload), when the stream event is not replayed.
 * Returns the message to show, or null when the run did not end that way.
 */
export function readStoppedRun(values: unknown): string | null {
  const content = (values as { content?: Record<string, unknown> } | null)
    ?.content;
  if (content?.error_code !== "no_serp_data") return null;
  return typeof content.error === "string" && content.error.trim()
    ? content.error.trim()
    : FALLBACK_MESSAGE;
}

/**
 * The graph's last nodes (rext-backend's `src/flow/engines/rext.py`): the
 * article written, or a run the credit gate or an empty search ended. An
 * update from one of them means the run is over.
 */
const LAST_NODES = ["content_engine", "insufficient_credits", "no_serp_data"];

/**
 * Whether a stream event shows the run reaching a point the page can show: a
 * pause for the user (an interrupt), one of the graph's last nodes, or a
 * failure the backend reported. A stream that closes before any of these left
 * the run going on the server (a dropped connection, a proxy or server
 * timeout), and the page has to catch up with it.
 */
export function settlesRun(chunk: { event?: string; data?: unknown }): boolean {
  const name = chunk.event ?? "";
  if (name === "custom" || name.startsWith("custom|")) {
    return readRunFailedEvent(chunk.data) !== null;
  }
  if (!name.startsWith("updates")) return false;
  const updates = chunk.data;
  if (!updates || typeof updates !== "object") return false;
  return (
    "__interrupt__" in updates || LAST_NODES.some((node) => node in updates)
  );
}
