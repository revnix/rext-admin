import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

/**
 * Helper to get and open the LemonSqueezy customer portal URL.
 */
export async function openCustomerPortal() {
  try {
    const response = await apiClient.subscriptions.getCustomerPortalUrl();
    if (response.portal_url) {
      window.open(response.portal_url, "_blank");
      return true;
    }
    return false;
  } catch (error) {
    const _errorMessage =
      error instanceof Error ? error.message : "Failed to open billing portal";
    toast.error("Failed to open billing portal", {
      description: "Please try again or contact support.",
    });
    throw error;
  }
}
