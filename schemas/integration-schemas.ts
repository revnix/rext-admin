import { z } from "zod";

/**
 * Zod Validation Schemas for Integrations
 */

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
        const hostname = new URL(url).hostname;
        return hostname.endsWith(".com");
      } catch {
        return false;
      }
    },
    {
      message: "URL must be a .com domain",
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
