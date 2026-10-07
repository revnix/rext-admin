import type { RunStreamEvent } from "@/types/generate-content";
import { RunStreamEventSchema } from "@/schemas/sse-schemas";
import {
  isNetworkFailure,
  SERVER_UNREACHABLE,
  SERVER_UNREACHABLE_MESSAGE,
} from "@/lib/api-client/server-away";
import { authenticatedFetch } from "@/lib/auth-utils";
import { isAwayResponse } from "@/lib/generate-content/backend-away";
import { log } from "@/lib/logger";

const sseLogger = log.forComponent("sse-stream");

/**
 * A run's stream ended on an error the proxy route reported, with its code when the route gave one
 * (`TOO_MANY_RUNS`: the backend refused to start the run).
 */
export class RunStreamError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "RunStreamError";
  }
}

/**
 * A start or a step the server couldn't be reached for (a deploy restarts the backend for about a
 * minute, task 759): nothing ran, and it isn't sent again by itself, since it may have arrived.
 * The error carries the sentence to show and `SERVER_UNREACHABLE`.
 */
async function reaching(send: () => Promise<Response>): Promise<Response> {
  let res: Response;
  try {
    res = await send();
  } catch (error) {
    if (!isNetworkFailure(error)) throw error;
    throw new RunStreamError(SERVER_UNREACHABLE_MESSAGE, SERVER_UNREACHABLE);
  }
  if (isAwayResponse(res.status)) {
    throw new RunStreamError(SERVER_UNREACHABLE_MESSAGE, SERVER_UNREACHABLE);
  }
  return res;
}

/**
 * A new generation thread in the workspace. The backend refuses it unless the
 * user may create content there; the error carries the server's words.
 */
export async function createThread(workspaceId: string): Promise<string> {
  const res = await reaching(() =>
    authenticatedFetch("/api/generate/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId }),
    }),
  );
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error || "Failed to create thread");
  }
  const json = await res.json();
  return json.data.thread_id;
}

export async function* streamFromSSE(
  url: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): AsyncGenerator<RunStreamEvent> {
  const res = await reaching(() =>
    authenticatedFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    }),
  );

  if (!res.ok || !res.body) throw new Error("Stream failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (signal?.aborted) {
      reader.cancel();
      return;
    }
    let chunk: Awaited<ReturnType<typeof reader.read>>;
    try {
      chunk = await reader.read();
    } catch (error) {
      // The connection was cut after the stream had opened: the same error as a request that
      // never arrived, so a step is never sent a second time on it (it may have started a run).
      if (!isNetworkFailure(error)) throw error;
      throw new RunStreamError(SERVER_UNREACHABLE_MESSAGE, SERVER_UNREACHABLE);
    }
    const { done, value } = chunk;
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") return;
      let parsed: unknown;
      try {
        parsed = JSON.parse(payload);
      } catch (error) {
        sseLogger.warn("Malformed SSE event: JSON parse failed", {
          error: error instanceof Error ? error.message : String(error),
          payloadPreview: payload.substring(0, 200),
        });
        continue;
      }

      // The proxy route reports a failed run as `{ error }`, which is not a
      // stream event: swallowing it as "malformed" is what makes a failed
      // resume look like a click that did nothing.
      const streamError = (parsed as { error?: unknown })?.error;
      if (typeof streamError === "string") {
        const code = (parsed as { code?: unknown }).code;
        throw new RunStreamError(
          streamError,
          typeof code === "string" ? code : undefined,
        );
      }

      const result = RunStreamEventSchema.safeParse(parsed);

      if (result.success) {
        yield result.data as RunStreamEvent;
      } else {
        sseLogger.warn("Malformed SSE event: schema validation failed", {
          errors: result.error.issues.map(
            (i) => `${i.path.join(".")}: ${i.message}`,
          ),
          payloadPreview: payload.substring(0, 200),
        });
      }
    }
  }
}

// Words that must always render fully uppercase in node/tool labels.
const UPPERCASE_WORDS = new Set(["seo", "serp", "eeat", "ai", "url", "llm"]);

export function formatNodeName(name: string): string {
  return name
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) =>
      UPPERCASE_WORDS.has(word.toLowerCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}
