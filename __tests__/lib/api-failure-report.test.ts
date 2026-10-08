/**
 * A request the backend failed is reported (rext-control task 894): which route, as the backend's
 * own spec names it, the method and the status. Never an id, a workspace's name or a keyword from
 * the address, never the answer's words, and not a refusal the backend meant.
 */
import fs from "node:fs";
import path from "node:path";
import { analytics } from "@/lib/analytics";
import {
  apiPathShape,
  forgetReportedFailures,
  reportApiFailure,
  UNREACHABLE_CODE,
} from "@/lib/analytics-failures";
import { ApiClient, ApiError } from "@/lib/api-client/core";
import { API_ROUTE_TREE } from "@/lib/api-client/route-tree";
import {
  noteServerAnswered,
  SERVER_UNREACHABLE,
  stopWatchingServer,
} from "@/lib/api-client/server-away";

jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
jest.mock("@/lib/auth-utils", () => ({
  authenticatedFetch: jest.fn(),
  redirectToLogin: jest.fn(),
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

const track = analytics.track as jest.Mock;
const send = jest.requireMock("@/lib/auth-utils")
  .authenticatedFetch as jest.Mock;
const sent = () =>
  track.mock.calls
    .filter(([event]) => event === "api_request_failed")
    .map(([, properties]) => properties);

const WORKSPACE = "6f1c2d3e-0000-4000-8000-000000000001";

beforeEach(() => {
  track.mockReset();
  // Analytics takes the event, as it does for a person who allows it.
  track.mockReturnValue(true);
  send.mockReset();
  forgetReportedFailures();
});
afterEach(() => {
  noteServerAnswered();
  stopWatchingServer();
});

describe("apiPathShape", () => {
  it("names a route as the spec does, with a star where the route takes a parameter", () => {
    expect(apiPathShape(`/api/v1/workspaces/${WORKSPACE}/brand-voice`)).toBe(
      "/api/v1/workspaces/*/brand-voice",
    );
    expect(apiPathShape("/api/v1/admin/platform/invitations")).toBe(
      "/api/v1/admin/platform/invitations",
    );
    expect(apiPathShape("/api/v1/workspaces/slug/acme-corp")).toBe(
      "/api/v1/workspaces/slug/*",
    );
  });

  it("drops the query whole, and turns what the spec doesn't have into stars", () => {
    expect(
      apiPathShape("/api/v1/workspaces/all?search=ana%40example.com&page=2"),
    ).toBe("/api/v1/workspaces/all");
    expect(apiPathShape("/api/v1/not-a-route/acme-corp/secret")).toBe(
      "/api/v1/*/*/*",
    );
  });

  it("never keeps what stands where a parameter is, whatever it says", () => {
    // A workspace whose address is a word the API also uses is still a workspace's own name.
    expect(apiPathShape("/api/v1/workspaces/slug/invitations")).toBe(
      "/api/v1/workspaces/slug/*",
    );
  });
});

describe("reportApiFailure", () => {
  const route = `/api/v1/workspaces/${WORKSPACE}/brand-voice`;

  it("says which route failed, how and with what status, never the answer's words", () => {
    reportApiFailure(
      "post",
      route,
      new ApiError(500, "Workspace acme-corp of ana@example.com broke"),
    );

    expect(sent()).toEqual([
      {
        route: "/api/v1/workspaces/*/brand-voice",
        method: "POST",
        status: 500,
      },
    ]);
    const everything = JSON.stringify(track.mock.calls);
    for (const kept of ["acme-corp", "ana@example.com", WORKSPACE]) {
      expect(everything).not.toContain(kept);
    }
  });

  it("says nothing for a refusal the backend meant", () => {
    for (const status of [400, 401, 403, 404, 409, 422, 429]) {
      reportApiFailure("GET", route, new ApiError(status, "no"));
    }
    reportApiFailure("GET", route, new TypeError("not the client's error"));

    expect(sent()).toEqual([]);
  });

  it("marks a server that could not be reached, with or without a gateway's answer", () => {
    expect(UNREACHABLE_CODE).toBe(SERVER_UNREACHABLE);

    reportApiFailure(
      undefined,
      "/api/v1/plans",
      new ApiError(0, "Couldn't reach", SERVER_UNREACHABLE),
    );
    reportApiFailure(
      "GET",
      "/api/v1/notifications",
      new ApiError(503, "Couldn't reach", SERVER_UNREACHABLE),
    );

    expect(sent()).toEqual([
      { route: "/api/v1/plans", method: "GET", status: 0, away: true },
      {
        route: "/api/v1/notifications",
        method: "GET",
        status: 503,
        away: true,
      },
    ]);
  });

  it("reports each kind of failure once for a page, and a handful in all", () => {
    for (let i = 0; i < 5; i += 1) {
      reportApiFailure("GET", route, new ApiError(500, "again"));
    }
    reportApiFailure("GET", route, new ApiError(502, "another status"));
    reportApiFailure("DELETE", route, new ApiError(500, "another method"));
    expect(sent()).toHaveLength(3);

    for (let i = 0; i < 60; i += 1) {
      reportApiFailure("GET", route, new ApiError(500 + i, "many"));
    }
    expect(sent()).toHaveLength(30);
  });

  it("holds a failure as said only when analytics took it", () => {
    // After a no, or while an admin acts as a customer: nothing is taken.
    track.mockReturnValue(false);
    reportApiFailure("GET", route, new ApiError(500, "not taken"));
    reportApiFailure("GET", route, new ApiError(500, "not taken"));
    expect(sent()).toHaveLength(2);

    // The switch is turned on, or the acting ends: the same failure is still new, once.
    track.mockReturnValue(true);
    reportApiFailure("GET", route, new ApiError(500, "taken"));
    reportApiFailure("GET", route, new ApiError(500, "said already"));
    expect(sent()).toHaveLength(3);
  });

  it("says nothing from a browser that is offline: that failure is its connection's", () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      get: () => false,
    });
    try {
      reportApiFailure("GET", route, new ApiError(0, "x", SERVER_UNREACHABLE));
      expect(sent()).toEqual([]);
    } finally {
      // Back to the browser's own answer.
      Reflect.deleteProperty(window.navigator, "onLine");
    }
  });
});

describe("the API client", () => {
  const answer = (status: number, body: unknown) => ({
    ok: status < 400,
    status,
    statusText: "",
    text: async () => JSON.stringify(body),
    json: async () => body,
  });

  it("reports a request the backend failed, and hands the error on as it was", async () => {
    send.mockResolvedValue(answer(500, { message: "boom for acme-corp" }));

    const failed = await new ApiClient()
      .request("/api/v1/admin/platform/invitations", { method: "GET" })
      .then(
        () => null,
        (error: unknown) => error,
      );

    expect(failed).toBeInstanceOf(ApiError);
    expect((failed as ApiError).statusCode).toBe(500);
    expect(sent()).toEqual([
      {
        route: "/api/v1/admin/platform/invitations",
        method: "GET",
        status: 500,
      },
    ]);
  });

  it("reports nothing for a request that went through, or one the backend refused", async () => {
    send
      .mockResolvedValueOnce(answer(200, { success: true, data: { ok: 1 } }))
      .mockResolvedValueOnce(answer(422, { message: "not like that" }));
    const client = new ApiClient();

    await client.request("/api/v1/plans");
    await client
      .request("/api/v1/workspaces/", { method: "POST" })
      .catch(() => {});

    expect(sent()).toEqual([]);
  });
});

describe("API_ROUTE_TREE", () => {
  it("is what the spec gives: run node scripts/api-route-tree.mjs after api/openapi.json changes", () => {
    const spec = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "api/openapi.json"), "utf8"),
    ) as { paths: Record<string, unknown> };
    const tree: Record<string, unknown> = {};
    for (const route of Object.keys(spec.paths)) {
      let node = tree as Record<string, Record<string, unknown>>;
      for (const part of route.split("/").filter(Boolean)) {
        const key = part.startsWith("{") ? "*" : part;
        node[key] ??= {};
        node = node[key] as Record<string, Record<string, unknown>>;
      }
    }
    expect(API_ROUTE_TREE).toEqual(tree);
  });
});
