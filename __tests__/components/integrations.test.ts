/**
 * Integrations (D4): a WordPress site's fields are checked before the backend asks the plugin, the
 * endpoint is suggested from the address, a blank key in the settings keeps the saved one, and a
 * site is named by its host.
 */

import { siteHost } from "@/components/integrations/site-host";
import { WORDPRESS_PLUGIN_PATH } from "@/config/integrations";
import {
  pluginEndpointFor,
  wordPressSiteSchema,
  wordPressSiteUpdateSchema,
} from "@/schemas/integration-schemas";

const site = {
  site_url: "https://example.com",
  api_key: "rext_abc",
  api_endpoint: "https://example.com/wp-json/rext-ai/v1/",
};

describe("wordPressSiteSchema", () => {
  it("takes a site on https with its plugin endpoint and key", () => {
    expect(wordPressSiteSchema.safeParse(site).success).toBe(true);
  });

  it("trims what was pasted", () => {
    const parsed = wordPressSiteSchema.parse({
      ...site,
      site_url: "  https://example.com ",
      api_key: " rext_abc\n",
    });
    expect(parsed.site_url).toBe("https://example.com");
    expect(parsed.api_key).toBe("rext_abc");
  });

  it.each([
    ["an address on http", { site_url: "http://example.com" }],
    ["an address with no domain", { site_url: "https://localhost" }],
    [
      "an endpoint outside /wp-json/",
      { api_endpoint: "https://example.com/api/" },
    ],
    ["no key", { api_key: "   " }],
  ])("refuses %s", (_case, change) => {
    expect(wordPressSiteSchema.safeParse({ ...site, ...change }).success).toBe(
      false,
    );
  });
});

describe("wordPressSiteUpdateSchema", () => {
  it("lets the key stay blank, so the saved one is kept", () => {
    expect(
      wordPressSiteUpdateSchema.safeParse({ ...site, api_key: "" }).success,
    ).toBe(true);
  });
});

describe("pluginEndpointFor", () => {
  it("puts the plugin's path on the site's origin", () => {
    expect(
      pluginEndpointFor("https://example.com/blog/", WORDPRESS_PLUGIN_PATH),
    ).toBe("https://example.com/wp-json/rext-ai/v1/");
  });

  it("suggests nothing for an address that doesn't parse", () => {
    expect(pluginEndpointFor("example", WORDPRESS_PLUGIN_PATH)).toBe("");
  });
});

describe("siteHost", () => {
  it("names a site by its host", () => {
    expect(siteHost({ site_url: "https://www.example.com/blog" })).toBe(
      "www.example.com",
    );
  });

  it("falls back to the stored address, then to words", () => {
    expect(siteHost({ site_url: "not a url" })).toBe("not a url");
    expect(siteHost({ site_url: null })).toBe("A WordPress site");
  });
});
