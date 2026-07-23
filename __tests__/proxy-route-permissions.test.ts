const mockGetToken = jest.fn();
jest.mock("next-auth/jwt", () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
}));
jest.mock("@/lib/csp", () => ({ getCSPHeader: () => "default-src 'self'" }));
jest.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: URL) => ({ type: "redirect", url }),
    next: () => ({ type: "next", headers: new Headers() }),
  },
}));

import proxyHandler from "@/proxy";

describe("admin route permission precedence", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-auth-secret";
    mockGetToken.mockReset();
  });

  it("checks the most-specific admin route before the /admin role rule", async () => {
    mockGetToken.mockResolvedValue({
      id: "user-1",
      role: "admin",
      permissions: [],
    });

    const result = await (
      proxyHandler as unknown as (request: Record<string, unknown>) => Promise<{
        type: string;
        url: URL;
      }>
    )({
      nextUrl: new URL("https://admin.rext.test/admin/users"),
      headers: new Headers(),
    });

    expect(result.type).toBe("redirect");
    expect(result.url.pathname).toBe("/unauthorized");
    expect(result.url.searchParams.get("required")).toBe("user.read");
    expect(mockGetToken).toHaveBeenCalledTimes(1);
  });
});
