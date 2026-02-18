import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { getWorkspaceDisplayTitle } from "@/lib/workspace";
import type {
  WorkspaceFormData,
  WorkspaceFormStoreState,
} from "@/types/workspace";

/**
 * Default workspace form data
 */
const initialWorkspaceFormData: WorkspaceFormData = {
  name: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  url: "",
};

/**
 * Workspace Form Store
 *
 * Manages workspace form UI state for creation and editing.
 * Handles form open/close, data updates, submission state, and validation errors.
 */
export const useWorkspaceFormStore = create<WorkspaceFormStoreState>()(
  devtools(
    (set) => ({
      // Initial state
      workspaceForm: {
        isOpen: false,
        mode: "create",
        data: initialWorkspaceFormData,
        isSubmitting: false,
        errors: {},
      },

      // ============================================================================
      // WORKSPACE FORM ACTIONS
      // ============================================================================

      openWorkspaceForm: (mode, workspace) => {
        set({
          workspaceForm: {
            isOpen: true,
            mode,
            data: workspace
              ? {
                  name: getWorkspaceDisplayTitle(workspace),
                  timezone:
                    workspace.timezone ||
                    Intl.DateTimeFormat().resolvedOptions().timeZone,
                  url: workspace.url,
                }
              : initialWorkspaceFormData,
            isSubmitting: false,
            errors: {},
          },
        });
      },

      closeWorkspaceForm: () => {
        set({
          workspaceForm: {
            isOpen: false,
            mode: "create",
            data: initialWorkspaceFormData,
            isSubmitting: false,
            errors: {},
          },
        });
      },

      updateWorkspaceFormData: (data) => {
        set((state) => ({
          workspaceForm: {
            ...state.workspaceForm,
            data: { ...state.workspaceForm.data, ...data },
            // Clear errors for updated fields
            errors: Object.keys(data).reduce((acc, key) => {
              const { [key]: _, ...rest } = acc;
              return rest;
            }, state.workspaceForm.errors),
          },
        }));
      },

      setWorkspaceFormSubmitting: (isSubmitting) => {
        set((state) => ({
          workspaceForm: { ...state.workspaceForm, isSubmitting },
        }));
      },

      setWorkspaceFormErrors: (errors) => {
        set((state) => ({
          workspaceForm: { ...state.workspaceForm, errors },
        }));
      },

      resetWorkspaceForm: () => {
        set((state) => ({
          workspaceForm: {
            ...state.workspaceForm,
            data: initialWorkspaceFormData,
            errors: {},
          },
        }));
      },
    }),
    {
      name: "workspace-form-store",
    },
  ),
);

// ============================================================================
// SELECTOR HOOKS FOR PERFORMANCE
// ============================================================================

/**
 * Hook to get workspace form state
 */
export const useWorkspaceForm = () => {
  return useWorkspaceFormStore((state) => state.workspaceForm);
};
