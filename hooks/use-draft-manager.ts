/**
 * Draft Management Hook
 *
 * React hook for integrating draft management with the content creation wizard.
 * Provides auto-save, manual save, load, and draft listing functionality.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  type Draft,
  type DraftLoadOptions,
  type DraftSaveOptions,
  draftManager,
} from "@/lib/content-creation/draft-manager";
import { log } from "@/lib/logger";
import type { PartialContentCreationFormData } from "@/types/content-creation";

// ============================================================================
// TYPES
// ============================================================================

export interface UseDraftManagerOptions {
  /** Enable auto-save functionality */
  autoSave?: boolean;
  /** Auto-save interval in milliseconds */
  autoSaveInterval?: number;
  /** Minimum completion percentage for auto-save */
  minCompletionForAutoSave?: number;
  /** Show toast notifications for save operations */
  showToasts?: boolean;
  /** Debug mode for additional logging */
  debug?: boolean;
}

export interface DraftManagerState {
  /** Currently loaded draft */
  currentDraft: Draft | null;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Whether a load operation is in progress */
  isLoading: boolean;
  /** Last successful save timestamp */
  lastSaved: Date | null;
  /** Available drafts list */
  availableDrafts: Draft[];
  /** Whether drafts list is loading */
  isDraftsLoading: boolean;
  /** Auto-save status */
  autoSaveEnabled: boolean;
  /** Storage statistics */
  storageStats: {
    draftCount: number;
    totalSize: number;
    availableSpace: number;
  } | null;
}

export interface DraftManagerActions {
  /** Save current form data as draft */
  saveDraft: (
    formData: PartialContentCreationFormData,
    currentStep: number,
    completionPercentage: number,
    options?: DraftSaveOptions,
  ) => Promise<Draft | null>;

  /** Load draft by ID */
  loadDraft: (
    draftId: string,
    options?: DraftLoadOptions,
  ) => Promise<PartialContentCreationFormData | null>;

  /** Delete draft by ID */
  deleteDraft: (draftId: string) => Promise<void>;

  /** Refresh drafts list */
  refreshDrafts: () => Promise<void>;

  /** Clear all drafts */
  clearAllDrafts: () => Promise<void>;

  /** Enable/disable auto-save */
  setAutoSaveEnabled: (enabled: boolean) => void;

  /** Check if draft exists */
  draftExists: (draftId: string) => Promise<boolean>;

  /** Get draft info without loading full data */
  getDraftInfo: (draftId: string) => Promise<Omit<Draft, "formData"> | null>;

  /** Start auto-save with current data getter */
  startAutoSave: (
    getCurrentData: () => {
      formData: PartialContentCreationFormData;
      currentStep: number;
      completionPercentage: number;
    },
  ) => void;

  /** Stop auto-save */
  stopAutoSave: () => void;

  /** Get storage statistics */
  getStorageStats: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useDraftManager(options: UseDraftManagerOptions = {}): {
  state: DraftManagerState;
  actions: DraftManagerActions;
} {
  const {
    autoSave = true,
    autoSaveInterval: _autoSaveInterval = 30000,
    minCompletionForAutoSave: _minCompletionForAutoSave = 25,
    showToasts = true,
    debug = false,
  } = options;

  // State
  const [state, setState] = useState<DraftManagerState>({
    currentDraft: null,
    isSaving: false,
    isLoading: false,
    lastSaved: null,
    availableDrafts: [],
    isDraftsLoading: false,
    autoSaveEnabled: autoSave,
    storageStats: null,
  });

  // Refs for stable references
  const autoSaveRef = useRef<boolean>(autoSave);
  const getCurrentDataRef = useRef<
    | (() => {
        formData: PartialContentCreationFormData;
        currentStep: number;
        completionPercentage: number;
      })
    | null
  >(null);

  // Update auto-save enabled state
  useEffect(() => {
    autoSaveRef.current = state.autoSaveEnabled;
  }, [state.autoSaveEnabled]);

  // Define refreshDrafts first since it's used by other callbacks
  const refreshDrafts = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, isDraftsLoading: true }));

    try {
      const drafts = await draftManager.listDrafts();

      setState((prev) => ({
        ...prev,
        availableDrafts: drafts,
        isDraftsLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, isDraftsLoading: false }));
      log.error("Failed to refresh drafts:", error);
    }
  }, []);

  // Actions
  const saveDraft = useCallback(
    async (
      formData: PartialContentCreationFormData,
      currentStep: number,
      completionPercentage: number,
      options: DraftSaveOptions = {},
    ): Promise<Draft | null> => {
      setState((prev) => ({ ...prev, isSaving: true }));

      try {
        const draft = await draftManager.saveDraft(
          formData,
          currentStep,
          completionPercentage,
          options,
        );

        setState((prev) => ({
          ...prev,
          currentDraft: draft,
          lastSaved: new Date(),
          isSaving: false,
        }));

        if (showToasts && !options.isAutoSave) {
          toast.success(`Draft saved: ${draft.title}`, {
            description: `Progress: ${completionPercentage}% complete`,
          });
        } else if (debug && options.isAutoSave) {
          log.info(
            `Auto-saved: ${draft.title} (${completionPercentage}% complete)`,
          );
        }

        // Refresh drafts list
        await refreshDrafts();

        return draft;
      } catch (error) {
        setState((prev) => ({ ...prev, isSaving: false }));

        // Don't show error for "no changes" - this is normal
        if (
          error instanceof Error &&
          error.message.includes("No changes detected")
        ) {
          if (debug) {
            log.info("Auto-save skipped: no changes detected");
          }
          return null;
        }

        log.error("Failed to save draft:", error);

        if (showToasts) {
          toast.error("Failed to save draft", {
            description:
              error instanceof Error ? error.message : "Unknown error occurred",
          });
        }

        return null;
      }
    },
    [showToasts, debug, refreshDrafts],
  );

  const loadDraft = useCallback(
    async (
      draftId: string,
      options: DraftLoadOptions = {},
    ): Promise<PartialContentCreationFormData | null> => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const formData = await draftManager.loadDraft(draftId, options);
        const draftInfo = await draftManager.getDraftInfo(draftId);

        setState((prev) => ({
          ...prev,
          currentDraft: draftInfo
            ? ({ ...draftInfo, formData: formData || {} } as Draft)
            : null,
          isLoading: false,
        }));

        if (showToasts && formData && draftInfo) {
          toast.success(`Draft loaded: ${draftInfo.title}`, {
            description: `Progress: ${draftInfo.completionPercentage}% complete`,
          });
        }

        return formData;
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));

        log.error("Failed to load draft:", error);

        if (showToasts) {
          toast.error("Failed to load draft", {
            description:
              error instanceof Error ? error.message : "Unknown error occurred",
          });
        }

        return null;
      }
    },
    [showToasts],
  );

  const deleteDraft = useCallback(
    async (draftId: string): Promise<void> => {
      try {
        await draftManager.deleteDraft(draftId);

        setState((prev) => ({
          ...prev,
          currentDraft:
            prev.currentDraft?.id === draftId ? null : prev.currentDraft,
        }));

        if (showToasts) {
          toast.success("Draft deleted successfully");
        }

        // Refresh drafts list
        await refreshDrafts();
      } catch (error) {
        log.error("Failed to delete draft:", error);

        if (showToasts) {
          toast.error("Failed to delete draft", {
            description:
              error instanceof Error ? error.message : "Unknown error occurred",
          });
        }
      }
    },
    [showToasts, refreshDrafts],
  );

  const clearAllDrafts = useCallback(async (): Promise<void> => {
    try {
      await draftManager.clearAllDrafts();

      setState((prev) => ({
        ...prev,
        currentDraft: null,
        availableDrafts: [],
        lastSaved: null,
      }));

      if (showToasts) {
        toast.success("All drafts cleared");
      }
    } catch (error) {
      log.error("Failed to clear drafts:", error);

      if (showToasts) {
        toast.error("Failed to clear drafts", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }
  }, [showToasts]);

  const startAutoSave = useCallback(
    (
      getCurrentData: () => {
        formData: PartialContentCreationFormData;
        currentStep: number;
        completionPercentage: number;
      },
    ): void => {
      getCurrentDataRef.current = getCurrentData;

      if (!autoSaveRef.current) return;

      draftManager.startAutoSave(
        getCurrentData,
        // onAutoSave
        (draft) => {
          setState((prev) => ({
            ...prev,
            currentDraft: draft,
            lastSaved: new Date(),
          }));

          if (debug) {
            log.info("Auto-save completed:", draft.title);
          }
        },
        // onError
        (error) => {
          log.error("Auto-save error:", error);

          if (showToasts && !error.message.includes("No changes detected")) {
            toast.error("Auto-save failed", {
              description: "Your progress may not be saved automatically",
            });
          }
        },
      );
    },
    [debug, showToasts],
  );

  const setAutoSaveEnabled = useCallback(
    (enabled: boolean): void => {
      setState((prev) => ({ ...prev, autoSaveEnabled: enabled }));

      if (!enabled) {
        draftManager.stopAutoSave();
      } else if (getCurrentDataRef.current) {
        startAutoSave(getCurrentDataRef.current);
      }
    },
    [startAutoSave],
  );

  const draftExists = useCallback(async (draftId: string): Promise<boolean> => {
    try {
      return await draftManager.draftExists(draftId);
    } catch (error) {
      log.error("Failed to check draft existence:", error);
      return false;
    }
  }, []);

  const getDraftInfo = useCallback(
    async (draftId: string): Promise<Omit<Draft, "formData"> | null> => {
      try {
        return await draftManager.getDraftInfo(draftId);
      } catch (error) {
        log.error("Failed to get draft info:", error);
        return null;
      }
    },
    [],
  );

  const stopAutoSave = useCallback((): void => {
    draftManager.stopAutoSave();
    getCurrentDataRef.current = null;
  }, []);

  const getStorageStats = useCallback(async (): Promise<void> => {
    try {
      const stats = await draftManager.getStorageStats();

      setState((prev) => ({
        ...prev,
        storageStats: {
          draftCount: stats.draftCount,
          totalSize: stats.totalSize,
          availableSpace: stats.availableSpace,
        },
      }));
    } catch (error) {
      log.error("Failed to get storage stats:", error);
    }
  }, []);

  // Initialize drafts list on mount
  useEffect(() => {
    refreshDrafts();
    getStorageStats();
  }, [refreshDrafts, getStorageStats]);

  // Cleanup auto-save on unmount
  useEffect(() => {
    return () => {
      draftManager.stopAutoSave();
    };
  }, []);

  return {
    state,
    actions: {
      saveDraft,
      loadDraft,
      deleteDraft,
      refreshDrafts,
      clearAllDrafts,
      setAutoSaveEnabled,
      draftExists,
      getDraftInfo,
      startAutoSave,
      stopAutoSave,
      getStorageStats,
    },
  };
}
