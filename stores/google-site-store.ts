import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface GoogleSiteStore {
  /** Selected WordPress site (WorkspaceIntegration.id) per workspace. */
  siteByWorkspace: Record<string, string>;
  setSite: (workspaceId: string, siteId: string) => void;
}

/**
 * Which site the Google Analytics section (Dashboard / Content Inventory /
 * Content Health / Opportunity Score) is scoped to. Shared across those
 * pages and persisted, so picking a site on the Dashboard carries over when
 * the user switches tabs or reloads.
 */
export const useGoogleSiteStore = create<GoogleSiteStore>()(
  persist(
    (set) => ({
      siteByWorkspace: {},
      setSite: (workspaceId, siteId) =>
        set((state) => ({
          siteByWorkspace: {
            ...state.siteByWorkspace,
            [workspaceId]: siteId,
          },
        })),
    }),
    {
      name: "google-selected-site",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
