import { PostHog } from "posthog-node";

let _client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  if (!_client) {
    _client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      // Flush immediately — required in serverless/edge environments
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return _client;
}

type ServerEventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: ServerEventProperties,
): void {
  const client = getClient();
  if (!client) return;
  client.capture({ distinctId, event, properties });
}

export function identifyServerUser(
  distinctId: string,
  properties?: ServerEventProperties,
): void {
  const client = getClient();
  if (!client) return;
  client.identify({ distinctId, properties });
}

export async function shutdownPostHogServer(): Promise<void> {
  if (_client) {
    await _client.shutdown();
  }
}
