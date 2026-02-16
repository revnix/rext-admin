import type { RunStreamEvent } from "@/types/generate-content";

export async function createThread(): Promise<string> {
  const res = await fetch("/api/generate/threads", { method: "POST" });
  if (!res.ok) throw new Error("Failed to create thread");
  const json = await res.json();
  return json.data.thread_id;
}

export async function* streamFromSSE(
  url: string,
  body: Record<string, unknown>,
): AsyncGenerator<RunStreamEvent> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) throw new Error("Stream failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") return;
      try {
        yield JSON.parse(payload) as RunStreamEvent;
      } catch {
        // Skip malformed chunks
      }
    }
  }
}

export function formatNodeName(name: string): string {
  return name
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}