import type { RunStreamEvent } from "@/types/generate-content";
import { RunStreamEventSchema } from "@/schemas/sse-schemas";
import { log } from "@/lib/logger";

const sseLogger = log.forComponent("sse-stream");

export async function createThread(): Promise<string> {
  const res = await fetch("/api/generate/threads", { method: "POST" });
  if (!res.ok) throw new Error("Failed to create thread");
  const json = await res.json();
  return json.data.thread_id;
}

export async function* streamFromSSE(
  url: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): AsyncGenerator<RunStreamEvent> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) throw new Error("Stream failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (signal?.aborted) {
      reader.cancel();
      return;
    }
    const { done, value } = await reader.read();
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
      if (typeof streamError === "string") throw new Error(streamError);

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
