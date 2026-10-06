import { z } from "zod";

/**
 * A WordPress site's connection, as the connect dialog and the settings sheet edit it. The backend
 * keeps 500 characters of each address, checks the plugin answers before it saves, and refuses an
 * address on a private network.
 */

const domainRegex =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;

const siteUrl = z
  .string()
  .trim()
  .min(1, "Enter your site's address")
  .max(500, "Use at most 500 characters")
  .url("Enter the full address, such as https://example.com")
  .refine((url) => url.startsWith("https://"), {
    message: "The address starts with https://",
  })
  .refine(
    (url) => {
      try {
        return domainRegex.test(new URL(url).hostname);
      } catch {
        return false;
      }
    },
    { message: "Use your site's domain, such as example.com" },
  );

const apiEndpoint = z
  .string()
  .trim()
  .min(1, "Enter the plugin's endpoint")
  .max(500, "Use at most 500 characters")
  .url(
    "Enter the full address, such as https://example.com/wp-json/rext-ai/v1/",
  )
  .refine(
    (url) => url.includes("/wp-json/"),
    "The endpoint is under /wp-json/ on your site",
  );

export const wordPressSiteSchema = z.object({
  site_url: siteUrl,
  api_key: z.string().trim().min(1, "Paste the key from the plugin's settings"),
  api_endpoint: apiEndpoint,
});

export type WordPressSiteFormData = z.infer<typeof wordPressSiteSchema>;

export const wordPressSiteUpdateSchema = wordPressSiteSchema.extend({
  // The saved key never comes back from the backend: left blank, it stays.
  api_key: z.string().trim(),
});

export type WordPressSiteUpdateFormData = z.infer<
  typeof wordPressSiteUpdateSchema
>;

/** The plugin's endpoint on a site, for an address typed without one. */
export function pluginEndpointFor(siteUrl: string, pluginPath: string) {
  try {
    const { origin } = new URL(siteUrl.trim());
    return `${origin}${pluginPath}`;
  } catch {
    return "";
  }
}
