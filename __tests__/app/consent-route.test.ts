/**
 * @jest-environment node
 */

// The person's analytics choice, set as a cookie by the app's own server (rext-control task 712):
// the one cookie rext.ai and the app share on rext.ai's hosts, and a host's own anywhere else.

import { POST } from "@/app/api/consent/route";

const post = (host: string, choice: unknown, origin = `https://${host}`) =>
  POST(
    new Request(`https://${host}/api/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
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

it("sets a cookie of the host's own anywhere else: a preview shares nothing with rext.ai", async () => {
  const response = await post("rext-abc123-it-rx.vercel.app", "denied");

  expect(response.headers.getSetCookie()).toEqual([
    "rext-consent=denied; Max-Age=15724800; Path=/; SameSite=Lax; Secure",
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
