/**
 * @jest-environment node
 */

// The person's analytics choice, set as a cookie by the app's own server (rext-control task 712):
// the one cookie rext.ai and the app share on rext.ai's hosts, and a host's own anywhere else.

import { POST } from "@/app/api/consent/route";

// The suite's setup stands in for Response with an object that can't be constructed, and this
// route builds its answer with `new Response`: the test brings one that keeps what it is given.
class KeptResponse {
  status: number;
  headers: Headers;
  constructor(_body: null, init: { status: number; headers: HeadersInit }) {
    this.status = init.status;
    this.headers =
      init.headers instanceof Headers
        ? init.headers
        : new Headers(init.headers);
  }
}
const setupResponse = global.Response;
beforeAll(() => {
  global.Response = KeptResponse as unknown as typeof Response;
});
afterAll(() => {
  global.Response = setupResponse;
});

// The setup's Request reads a header by the name it was given under, so they are given as the
// route asks for them.
const post = (host: string, choice: unknown, origin = `https://${host}`) =>
  POST(
    new Request(`https://${host}/api/consent`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ choice }),
    }),
  );

it("sets the shared cookie on the app's own address, and takes the host's own away", async () => {
  const response = await post("app.rext.ai", "granted");

  expect(response.status).toBe(204);
  expect(response.headers.getSetCookie()).toEqual([
    "rext-consent=; Max-Age=0; Path=/; SameSite=Lax; Secure",
    "rext-consent=granted; Max-Age=15724800; Path=/; SameSite=Lax; Domain=.rext.ai; Secure",
  ]);
});

it("sets a cookie of the host's own anywhere else: staging and a preview share nothing with rext.ai", async () => {
  const preview = await post("rext-abc123-it-rx.vercel.app", "denied");
  expect(preview.headers.getSetCookie()).toEqual([
    "rext-consent=denied; Max-Age=15724800; Path=/; SameSite=Lax; Secure",
  ]);

  // Staging is under rext.ai, so the browser sends it the live cookie too: its own has another name.
  const staging = await post("staging.rext.ai", "denied");
  expect(staging.headers.getSetCookie()).toEqual([
    "rext-consent-own=denied; Max-Age=15724800; Path=/; SameSite=Lax; Secure",
  ]);
});

it("sets nothing for another site's request, or for a choice that isn't one", async () => {
  const fromElsewhere = await post(
    "app.rext.ai",
    "granted",
    "https://evil.example",
  );
  const nonsense = await post("app.rext.ai", "maybe");

  for (const response of [fromElsewhere, nonsense]) {
    expect(response.status).toBe(400);
    expect(response.headers.getSetCookie()).toEqual([]);
  }
});
