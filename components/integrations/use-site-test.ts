"use client";

import { useTestWordPress } from "@/hooks/use-integrations";
import type {
  ConnectionTestResult,
  Integration,
} from "@/lib/api-client/integrations";

/**
 * Testing a site's saved settings with its plugin. A failed test is an answer (`ok` false and why);
 * a test that couldn't run is turned into one, so the caller shows a single kind of result.
 */
export function useSiteTest(workspaceId: string) {
  const test = useTestWordPress(workspaceId);

  const run = async (site: Integration): Promise<ConnectionTestResult> => {
    try {
      return await test.mutateAsync(site.id);
    } catch (error) {
      return {
        site_id: site.id,
        ok: false,
        status: "error",
        message:
          error instanceof Error && error.message
            ? error.message
            : "The test couldn't run. Try again in a moment.",
        checked_at: new Date().toISOString(),
      };
    }
  };

  return { run, isPending: test.isPending };
}
