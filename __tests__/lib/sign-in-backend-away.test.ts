/**
 * A sign-in the backend gives no answer of its own to (revnix/rext-control#858): a backend deploy
 * takes the API away for under a minute, and "Log in" pressed then ended in silence. The server's
 * sign-in reports it under one code, apart from anything about the email or the password.
 */

jest.mock("next-auth", () => {
  class CredentialsSignin extends Error {
    code = "credentials";
  }
  return { CredentialsSignin };
});
jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: (options: unknown) => ({ id: "credentials", options }),
}));
jest.mock("next-auth/providers/github", () => ({
  __esModule: true,
  default: (options: unknown) => ({ id: "github", options }),
}));
jest.mock("next-auth/providers/google", () => ({
  __esModule: true,
  default: (options: unknown) => ({ id: "google", options }),
}));
jest.mock("@/lib/logger", () => {
  const quiet = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const logger = { ...quiet, forComponent: () => quiet };
  return { logger, log: logger };
});

import authConfig from "@/auth.config";
import {
  BACKEND_AWAY_CODE,
  isGatewayAway,
  SIGN_IN_ANSWER_WITHIN_MS,
} from "@/lib/auth/backend-away";

type Authorize = (credentials: Record<string, string>) => Promise<unknown>;
const authorize = (
  authConfig.providers[0] as unknown as { options: { authorize: Authorize } }
).options.authorize;

const DETAILS = { email: "ana@example.com", password: "a-password" };

/** The sign-in's failure, or null when it did not fail. */
const failure = (attempt: Promise<unknown>) =>
  attempt.then(
    () => null,
    (error: Error & { code?: string }) => error,
  );

/** An answer, as much of a Response as the sign-in reads. */
function answer(status: number, body: unknown) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  const response = {
    ok: status < 400,
    status,
    statusText: "",
    headers: new Headers(),
    json: async () => JSON.parse(text),
    text: async () => text,
    clone: () => response,
  };
  return response;
}

let send: jest.Mock;

beforeEach(() => {
  send = jest.fn();
  global.fetch = send as unknown as typeof fetch;
});

describe("the server's sign-in when the backend is away", () => {
  it("reports it when the request fails outright", async () => {
    send.mockRejectedValue(new TypeError("fetch failed"));

    const error = await failure(authorize(DETAILS));

    expect(error?.code).toBe(BACKEND_AWAY_CODE);
  });

  it("waits a limited time for the answer", async () => {
    send.mockRejectedValue(new DOMException("timed out", "TimeoutError"));

    const error = await failure(authorize(DETAILS));

    expect(error?.code).toBe(BACKEND_AWAY_CODE);
    const [, init] = send.mock.calls[0];
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(SIGN_IN_ANSWER_WITHIN_MS).toBeLessThanOrEqual(10_000);
  });

  it.each([502, 503, 504])(
    "reports it for the gateway's %s, whose words are not the backend's",
    async (status) => {
      send.mockResolvedValue(answer(status, "no available server"));

      const error = await failure(authorize(DETAILS));

      expect(error?.code).toBe(BACKEND_AWAY_CODE);
    },
  );

  it.each([
    [401, { error: { message: "Invalid email or password" } }],
    [500, { error: { message: "Failed to user login" } }],
  ])("keeps the backend's own %s as it was", async (status, body) => {
    send.mockResolvedValue(answer(status, body));

    const error = await failure(authorize(DETAILS));

    expect(error).not.toBeNull();
    expect(error?.code).not.toBe(BACKEND_AWAY_CODE);
  });
});

describe("which statuses mean the backend is away", () => {
  it("are the gateway's three", () => {
    expect([500, 502, 503, 504, 401, 200].filter(isGatewayAway)).toEqual([
      502, 503, 504,
    ]);
  });
});
