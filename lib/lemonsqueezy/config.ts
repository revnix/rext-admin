/**
 * LemonSqueezy Configuration
 *
 * Central configuration for LemonSqueezy payment integration.
 * Handles API setup, store configuration, and checkout options.
 *
 * @module lib/lemonsqueezy/config
 */

import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
import { buildUrl } from "../url-utils";

/**
 * LemonSqueezy configuration type
 */
export interface LemonSqueezyConfig {
  storeId: string;
  apiKey: string;
  webhookSecret: string;
}

/**
 * Get LemonSqueezy configuration from environment variables
 *
 * @throws {Error} If required environment variables are missing
 * @returns {LemonSqueezyConfig} Configuration object
 */
export function getLemonSqueezyConfig(): LemonSqueezyConfig {
  const requiredVars = [
    "LEMONSQUEEZY_API_KEY",
    "LEMONSQUEEZY_STORE_ID",
    "LEMONSQUEEZY_WEBHOOK_SECRET",
  ] as const;

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required LEMONSQUEEZY environment variables: ${missingVars.join(", ")}. ` +
        "Please check your .env.local file and ensure all required variables are set.",
    );
  }

  return {
    storeId: process.env.LEMONSQUEEZY_STORE_ID as string,
    apiKey: process.env.LEMONSQUEEZY_API_KEY as string,
    webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET as string,
  };
}

/**
 * Configure and initialize the LemonSqueezy SDK
 *
 * This function should be called before making any API calls to LemonSqueezy.
 * It sets up the API key and error handling.
 *
 * @throws {Error} If configuration is invalid or missing
 *
 * @example
 * ```typescript
 * import { configureLemonSqueezy } from '@/lib/lemonsqueezy/config';
 *
 * // In an API route or Server Action
 * configureLemonSqueezy();
 *
 * // Now you can use LemonSqueezy SDK functions
 * const user = await getAuthenticatedUser();
 * ```
 */
export function configureLemonSqueezy(): void {
  const config = getLemonSqueezyConfig();

  lemonSqueezySetup({
    apiKey: config.apiKey,
    onError: (error) => {
      throw new Error(`LemonSqueezy API Error: ${error.message || error}`);
    },
  });
}

/**
 * Get the public store ID for client-side checkout URLs
 *
 * @returns {string} The LemonSqueezy store ID
 */
export function getPublicStoreId(): string {
  const storeId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID;

  if (!storeId) {
    throw new Error(
      "NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID is not set. " +
        "This environment variable is required for checkout URLs.",
    );
  }

  return storeId;
}

/**
 * Build a checkout URL for a specific variant
 *
 * This is used for creating checkout links that open the LemonSqueezy overlay.
 *
 * @param {string} variantId - The LemonSqueezy variant ID
 * @returns {string} Complete checkout URL
 *
 * @example
 * ```typescript
 * const checkoutUrl = buildCheckoutUrl('123456');
 * // Returns: "https://[store].lemonsqueezy.com/checkout/buy/123456"
 * ```
 */
export function buildCheckoutUrl(variantId: string): string {
  const storeId = getPublicStoreId();
  return `https://${storeId}.lemonsqueezy.com/checkout/buy/${variantId}`;
}

/**
 * Checkout options for customizing the checkout experience
 */
export interface CheckoutOptions {
  /** Checkout overlay mode (default: true) */
  embed?: boolean;
  /** Dark mode (default: false) */
  dark?: boolean;
  /** Logo URL to display in checkout */
  logo?: string;
  /** Discount code to pre-apply */
  discount?: string;
  /** Custom data to pass through checkout */
  customData?: Record<string, string>;
}

/**
 * Build a checkout URL with additional options
 *
 * @param {string} variantId - The LemonSqueezy variant ID
 * @param {CheckoutOptions} options - Checkout customization options
 * @returns {string} Complete checkout URL with query parameters
 *
 * @example
 * ```typescript
 * const url = buildCheckoutUrlWithOptions('123456', {
 *   embed: true,
 *   dark: true,
 *   discount: 'LAUNCH50'
 * });
 * ```
 */
export function buildCheckoutUrlWithOptions(
  variantId: string,
  options: CheckoutOptions = {},
): string {
  const baseUrl = buildCheckoutUrl(variantId);

  const url = buildUrl(baseUrl, {
    embed: options.embed ? "1" : "0",
    dark: options.dark ? "1" : "0",
    logo: options.logo,
    discount: options.discount,
    ...options.customData,
  });

  return url;
}

/**
 * Type guard to check if LemonSqueezy is configured
 *
 * @returns {boolean} True if all required environment variables are set
 */
export function isLemonSqueezyConfigured(): boolean {
  try {
    getLemonSqueezyConfig();
    return true;
  } catch {
    return false;
  }
}
