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
