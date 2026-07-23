const authGetMock = jest.fn();
const authPostMock = jest.fn();

jest.mock("@/auth", () => ({
  handlers: {
    GET: (...args: unknown[]) => authGetMock(...args),
    POST: (...args: unknown[]) => authPostMock(...args),
  },
}));

import { GET, POST } from "@/app/api/auth/[...nextauth]/route";

describe("Auth.js session route cookie safety", () => {
  const originalResponse = global.Response;

  class TestResponse {
    readonly body: BodyInit | null;
    readonly headers: Headers;
    readonly status: number;
    readonly statusText: string;

    constructor(body: BodyInit | null = null, init: ResponseInit = {}) {
      this.body = body;
      this.headers = new Headers(init.headers);
      this.status = init.status ?? 200;
      this.statusText = init.statusText ?? "";
    }

    async json() {
      return JSON.parse(String(this.body ?? "null"));
    }
  }

  beforeAll(() => {
    global.Response = TestResponse as unknown as typeof Response;
  });

  afterAll(() => {
    global.Response = originalResponse;
  });

  beforeEach(() => {
    authGetMock.mockReset();
    authPostMock.mockReset();
  });

  it("removes Set-Cookie from session GET responses", async () => {
    authGetMock.mockResolvedValue(
      new Response(JSON.stringify({ user: { id: "user-1" } }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "set-cookie": "authjs.session-token=stale; Path=/; HttpOnly",
        },
      }),
    );

    const request = new Request("https://admin.example/api/auth/session");
    const response = await GET(request as never);

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeNull();
    await expect(response.json()).resolves.toEqual({ user: { id: "user-1" } });
  });

  it("preserves cookies for other Auth.js GET actions", async () => {
    authGetMock.mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: {
          location: "https://admin.example/",
          "set-cookie": "authjs.session-token=fresh; Path=/; HttpOnly",
        },
      }),
    );

    const request = new Request(
      "https://admin.example/api/auth/callback/google",
    );
    const response = await GET(request as never);

    expect(response.headers.get("set-cookie")).toContain("fresh");
  });

  it("leaves explicit POST actions unchanged", () => {
    expect(POST).toBeDefined();
    expect(authPostMock).not.toHaveBeenCalled();
  });
});
