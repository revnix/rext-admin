/**
 * Feature gate for the generation run-finished webhook.
 *
 * Runs are submitted with `webhook: "/api/v1/content/generation/run-finished"`
 * (a relative loopback URL delivered in-process to the backend) so a run that
 * dies mid-generation still notifies its owner. Newer langgraph runtimes
 * disable loopback webhooks by default — relative URLs bypass authentication
 * via the in-process ASGI transport — and reject the submission with 422
 * before a run is ever created. That left every content item stuck on
 * "Queued for generation" while status polls kept returning 202.
 *
 * The server must opt in via `webhooks.url.disable_loopback: false` in
 * langgraph.json (or LANGGRAPH_WEBHOOKS) before this flag is turned on for
 * the environment; the webhook route itself re-validates everything it is
 * told and never trusts the request body.
 */
export const runWebhookEnabled = process.env.LANGGRAPH_RUN_WEBHOOKS === "true";

/**
 * The `webhook` option for `runs.stream` / `runs.create`; absent unless the
 * gate is on, so servers with loopback webhooks disabled accept the run.
 */
export const runWebhookOption = runWebhookEnabled
  ? ({ webhook: "/api/v1/content/generation/run-finished" } as const)
  : {};
