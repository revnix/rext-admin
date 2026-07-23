import { handlers } from "@/auth";
import type { NextRequest } from "next/server";

/**
 * Auth.js 5 beta re-encodes its JWT and emits Set-Cookie on every session
 * read. With several tabs, an older GET can finish after an intentional
 * refresh POST and overwrite the newly rotated backend credentials.
 *
 * Session reads are side-effect free in our jwt callback, so preserve the
 * response body while removing only the cookie write. Login/callback routes
 * and explicit POST updates keep their normal Auth.js cookie behavior.
 */
export async function GET(request: NextRequest) {
  const response = await handlers.GET(request);
  const pathname = new URL(request.url).pathname.replace(/\/$/, "");

  if (!pathname.endsWith("/api/auth/session")) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.delete("set-cookie");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export const POST = handlers.POST;
