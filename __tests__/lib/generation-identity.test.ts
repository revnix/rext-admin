import type { Session } from "next-auth";

import { generationIdentity } from "@/lib/generate-content/generation-identity";

const base64Url = (value: object) =>
  btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const token = (claims: object) =>
  `${base64Url({ alg: "HS256" })}.${base64Url(claims)}.signature`;

const session = (accessToken: string | undefined, id = "session-user") =>
  ({ user: { id, accessToken } }) as unknown as Session;

describe("generationIdentity", () => {
  it("speaks for the user the token names", () => {
    const accessToken = token({ id: "token-user" });

    expect(generationIdentity(session(accessToken))).toEqual({
      userId: "token-user",
      accessToken,
    });
  });

  it("follows the token while a super admin impersonates someone", () => {
    const accessToken = token({
      id: "impersonated-user",
      is_impersonating: true,
      original_user_id: "admin",
    });

    expect(generationIdentity(session(accessToken, "admin"))?.userId).toBe(
      "impersonated-user",
    );
  });

  it.each([
    ["no session", null],
    ["no token", session(undefined)],
    ["a token that is not a JWT", session("opaque")],
    ["a payload that is not JSON", session("a.%%%.c")],
    ["no id claim", session(token({ sub: "someone" }))],
    ["an empty id claim", session(token({ id: "" }))],
  ])("refuses %s", (_label, value) => {
    expect(generationIdentity(value)).toBeNull();
  });
});
