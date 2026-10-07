/**
 * FB2.2 (rext-control#683): Generate's address is kebab-case, /w/<slug>/generate-content, and the
 * old /w/<slug>/generate_content keeps working with a permanent (308) redirect, after the library's
 * own redirect to Keywords.
 */
jest.mock("@next/bundle-analyzer", () => () => (config: unknown) => config);

import nextConfig from "@/next.config";
import { workspaceRoutes } from "@/lib/routes";

describe("Generate's address", () => {
  it("is kebab-case", () => {
    expect(workspaceRoutes.generate_content("acme")).toBe(
      "/w/acme/generate-content",
    );
  });

  it("redirects the old address permanently, after the library's redirect", async () => {
    const redirects = (await nextConfig.redirects?.()) ?? [];
    const sources = redirects.map((r) => r.source);
    const generic = redirects.find(
      (r) => r.source === "/w/:workspaceSlug/generate_content/:path*",
    );

    expect(generic).toMatchObject({
      destination: "/w/:workspaceSlug/generate-content/:path*",
      permanent: true,
    });
    expect(
      sources.indexOf("/w/:workspaceSlug/generate_content/library/:path*"),
    ).toBeLessThan(
      sources.indexOf("/w/:workspaceSlug/generate_content/:path*"),
    );
    // The retired topic wizard opens the new address directly.
    expect(
      redirects.find((r) => r.source === "/w/:workspaceSlug/content/create")
        ?.destination,
    ).toBe("/w/:workspaceSlug/generate-content");
  });
});
