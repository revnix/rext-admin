import { z } from "zod";

/**
 * Zod Validation Schemas for Integrations
 */

const domainRegex =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;

const urlSchema = z
  .string()
  .min(1, "Site URL is required")
  .url("Please enter a valid URL")
  .refine((url) => url.startsWith("https://"), {
    message: "URL must start with https://",
  })
  .refine(
    (url) => {
      try {
        return domainRegex.test(new URL(url).hostname);
      } catch {
        return false;
      }
    },
    {
      message: "URL must include a valid domain with a TLD (e.g. yoursite.com)",
    },
  );

const endpointSchema = z
  .string()
  .min(1, "API Endpoint is required")
  .url("Please enter a valid URL")
  .refine(
    (url) => url.includes("/wp-json/"),
    "Endpoint should be a valid WordPress REST API path",
  );

export const integrationSchema = z.object({
  site_url: urlSchema,
  api_key: z.string().min(1, "API Key is required"),
  api_endpoint: endpointSchema,
  is_active: z.boolean(),
});

export type IntegrationFormData = z.infer<typeof integrationSchema>;

export const updateIntegrationSchema = integrationSchema.partial().extend({
  // Add any update-specific refinements if needed
});

export type UpdateIntegrationFormData = z.infer<typeof updateIntegrationSchema>;

// ── Shopify ──────────────────────────────────────────────────────────────────

export const shopifyIntegrationSchema = z.object({
  store_url: z
    .string()
    .min(1, "Store URL is required")
    .transform((v) => {
      // Strip protocol and trailing slash, then re-add https://
      const stripped = v
        .trim()
        .replace(/^https?:\/\//i, "")
        .replace(/\/$/, "");
      return `https://${stripped}`;
    })
    .pipe(
      z.string().refine(
        (url) => {
          try {
            const hostname = new URL(url).hostname;
            return hostname.includes(".");
          } catch {
            return false;
          }
        },
        {
          message:
            "Must be a valid Shopify store URL (e.g. yourstore.myshopify.com)",
        },
      ),
    ),
  access_token: z.string().min(1, "Admin API access token is required"),
  is_active: z.boolean(),
});

export type ShopifyIntegrationFormData = z.infer<
  typeof shopifyIntegrationSchema
>;
