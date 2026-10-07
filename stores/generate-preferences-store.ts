import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * What the generate screen remembers on this browser, per workspace: the country the last keyword
 * was searched in (plans/app/E-workflow.md §4 step 1), so the next search starts there.
 */
interface GeneratePreferencesStore {
  countryByWorkspace: Record<string, string>;
  setCountry: (workspaceId: string, country: string) => void;
}

export const useGeneratePreferencesStore = create<GeneratePreferencesStore>()(
  persist(
    (set) => ({
      countryByWorkspace: {},
      setCountry: (workspaceId, country) =>
        set((state) => ({
          countryByWorkspace: {
            ...state.countryByWorkspace,
            [workspaceId]: country,
          },
        })),
    }),
    {
      name: "generate-preferences",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ countryByWorkspace: state.countryByWorkspace }),
    },
  ),
);
