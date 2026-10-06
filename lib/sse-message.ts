import { SSEEventSchema } from "@/schemas/sse-schemas";
import type { SSEEvent } from "@/types/sse";

/** What fetchEventSource hands `onmessage`: the frame's fields. */
export interface SSEMessage {
  event?: string;
  data: string;
}

export type ParsedSSEMessage =
  | { event: SSEEvent; nested: boolean }
  | { error: string };

// The backend before rextaihq/rext-backend G28 (#338 in rext-control) sent each event
// as a whole frame inside a data: field, so the outer frame has no event name and
// the JSON sits on the inner data: line. Remove once that backend is on main.
const NESTED_DATA_LINE = /(?:^|\n)data: (.+)/;

function eventJson(message: SSEMessage): { json: string; nested: boolean } {
  if (message.event) {
    return { json: message.data, nested: false };
  }
  const inner = message.data.match(NESTED_DATA_LINE);
  return inner
    ? { json: inner[1], nested: true }
    : { json: message.data, nested: false };
}

/**
 * Reads one operation event from an SSE frame: `event` names it
 * (`<scope>.<step>`) and `data` is the backend's OperationEvent as JSON.
 */
export function parseOperationEvent(message: SSEMessage): ParsedSSEMessage {
  const { json, nested } = eventJson(message);

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  const result = SSEEventSchema.safeParse(parsed);
  if (!result.success) {
    return {
      error: result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    };
  }
  return { event: result.data as SSEEvent, nested };
}
