import type { StreamMode } from "@langchain/langgraph-sdk";

/**
 * The stream modes every generation stream asks LangGraph for. In
 * `messages-tuple` mode each model token arrives once, as `[chunk, metadata]`
 * under the event `messages` (`messages|<namespace>` from a subgraph). The
 * older `messages` mode resent the whole message so far with every token, so
 * a streamed text grew with the square of its length.
 */
export const GENERATION_STREAM_MODES: StreamMode[] = [
  "updates",
  "messages-tuple",
  "custom",
];

/**
 * A run the backend ended early, as the custom stream event it sends then:
 * `{type: "run", step: "run.failed", error_code, message}`. The thread state
 * carries the same message in `content.error`, which the dock's status poll
 * reads.
 */
export type RunFailedEvent = { errorCode: string | null; message: string };

const FALLBACK_MESSAGE = "This run stopped before it finished.";

/**
 * The `content.error_code`s of a run the backend ended on purpose, with a message
 * for the user (rext-backend): a keyword with no search results or a failed
 * search lookup (`no_serp_data`, `rext.py`), a topic step that wrote no titles
 * (`topic_generation_failed`, `topic_generation.py`), a start whose credits
 * couldn't be read (`credit_check_failed`, `rext.py`: "Try again in a moment"),
 * and an outline or article the AI provider couldn't serve
 * (`provider_unavailable`, `provider_unavailable.py`: "busy right now", G75.1).
 * A run short of credits (`insufficient_credits`) has its own popup and isn't
 * one of these.
 */
export const STOPPED_RUN_CODES: readonly string[] = [
  "no_serp_data",
  "topic_generation_failed",
  "credit_check_failed",
  "provider_unavailable",
];

/**
 * The code a stream route sends with the backend's refusal to start a run: the
 * user already has as many in flight as allowed (rext-backend G62, a 429).
 */
export const TOO_MANY_RUNS = "too_many_runs";

export function isStoppedRunCode(code: unknown): boolean {
  return typeof code === "string" && STOPPED_RUN_CODES.includes(code);
}

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
  if (!content || !isStoppedRunCode(content.error_code)) return null;
  return typeof content.error === "string" && content.error.trim()
    ? content.error.trim()
    : FALLBACK_MESSAGE;
}

/**
 * The graph's last nodes (rext-backend's `src/flow/engines/rext.py` and
 * `topic_generation.py`, `provider_unavailable.py`): the article written, or a
 * run the credit gate, an empty search, a topic step without titles or an
 * unavailable AI provider ended. An update from one of them
 * means the run is over.
 */
const LAST_NODES = [
  "content_engine",
  "insufficient_credits",
  "credit_check_failed",
  "no_serp_data",
  "topics_failed",
  "provider_unavailable",
];

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

/** Whether a run, as LangGraph reports its status, is still going on the server. */
export function runIsGoing(status: string | undefined): boolean {
  return status === "pending" || status === "running";
}

/** How one attempt to resume a paused step ended. */
export type ResumeAttempt = {
  /** The server announced the run (`run/created`). */
  created: boolean;
  /** The page aborted the stream on purpose. */
  aborted: boolean;
  /** The stream reached a point the page can show. */
  settled: boolean;
  /** The backend refused to start the run (TOO_MANY_RUNS). */
  refused: boolean;
};

/**
 * Whether no second attempt follows. One that ended with no sign of a run is retried once;
 * a refusal is the backend's answer, already shown, and sending it again would only be
 * refused again (or start a run after the page said it wouldn't).
 */
export function resumeAttemptIsFinal(attempt: ResumeAttempt): boolean {
  return (
    attempt.created || attempt.aborted || attempt.settled || attempt.refused
  );
}

/**
 * Whether the page reloads the thread after a resume: a stream that closed while its run
 * went on, or a refused resume, whose step the page had already moved past while the
 * thread stayed paused there. A caller that puts its own step back opts out of the second.
 */
export function reloadsAfterResume(outcome: {
  unsettled: boolean;
  refused: boolean;
  restoresItsStep: boolean;
}): boolean {
  return outcome.unsettled || (outcome.refused && !outcome.restoresItsStep);
}

/** One model token from the stream, and the graph node whose model wrote it. */
export type MessageToken = { token: string; node: string | null };

function textOf(part: unknown): string {
  if (typeof part === "string") return part;
  if (!part || typeof part !== "object") return "";
  const block = part as { type?: unknown; text?: unknown };
  return block.type === "text" && typeof block.text === "string"
    ? block.text
    : "";
}

/**
 * The token a `messages-tuple` event carries; null for any other event. A
 * chunk's content is a string, or a list of content blocks whose text parts
 * are joined. The token is empty for a chunk that carries no text (a tool
 * call's arguments).
 */
export function readMessageToken(chunk: {
  event?: string;
  data?: unknown;
}): MessageToken | null {
  const name = chunk.event ?? "";
  if (name !== "messages" && !name.startsWith("messages|")) return null;
  if (!Array.isArray(chunk.data)) return null;
  const [message, metadata] = chunk.data as [unknown, unknown];
  const content = (message as { content?: unknown } | null)?.content;
  const token =
    typeof content === "string"
      ? content
      : Array.isArray(content)
        ? content.map(textOf).join("")
        : "";
  const node = (metadata as { langgraph_node?: unknown } | null)
    ?.langgraph_node;
  return { token, node: typeof node === "string" ? node : null };
}

/**
 * Whether a token belongs to the live outline. Only `generate_outline`'s model
 * writes it (rext-backend's content subgraph); the topic step's model streams
 * too, while the outline is already the target.
 */
export function isOutlineToken(message: MessageToken): boolean {
  return message.node === "generate_outline";
}
