import type { Integration } from "@/lib/api-client/integrations";

/** A site by its host name (example.com), the way people say it; the stored address when it won't parse. */
export function siteHost(site: Pick<Integration, "site_url">): string {
  const url = site.site_url ?? "";
  try {
    return new URL(url).hostname || url;
  } catch {
    return url || "A WordPress site";
  }
}
