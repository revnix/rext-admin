import { redirect } from "next/navigation";

/**
 * Settings Billing Page - Deprecated
 *
 * This page has been deprecated in favor of the canonical subscription settings page.
 * All requests are redirected to /settings/subscription.
 *
 * The redirect is also configured at the Next.js level in next.config.ts for
 * direct URL hits.
 *
 * @deprecated Use /settings/subscription instead
 */
export default function SettingsBillingPage() {
  redirect("/settings/subscription");
}
