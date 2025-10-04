/**
 * Contextual Suggestions Hook
 *
 * Manages dynamic suggestions based on form data changes.
 * Implements Task 7.3 requirements for effect hooks that monitor
 * relevant fields and update suggestions in real time.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { getContextualAudienceSuggestions } from "@/lib/contextual-suggestions";
import { log } from "@/lib/logger";
import { useTopicBuilderStore } from "@/stores/topic-builder-store";
import type { Industry, TopicBuilderFormData } from "@/types/topic-builder";

export interface ContextualSuggestionsState {
  /** Industry-specific audience suggestions */
  audienceSuggestions: string[];
  /** Whether suggestions are being updated */
  isUpdating: boolean;
}

export interface UseContextualSuggestionsProps {
  /** Current form data to monitor for changes */
  formData: Partial<TopicBuilderFormData>;
  /** Whether to enable automatic updates */
  enableAutoUpdate?: boolean;
}

export interface UseContextualSuggestionsReturn
  extends ContextualSuggestionsState {
  /** Manually update all suggestions */
  updateAllSuggestions: () => void;
  /** Update only audience suggestions */
  updateAudienceSuggestions: (industry: Industry) => void;
  /** Reset suggestions to defaults */
  resetSuggestions: () => void;
}

/**
 * Hook for managing contextual suggestions based on form data
 */
export function useContextualSuggestions({
  formData,
  enableAutoUpdate = true,
}: UseContextualSuggestionsProps): UseContextualSuggestionsReturn {
  // Get contextual suggestion state and actions from store
  // Use separate selectors to avoid object recreation
  const contextualSuggestions = useTopicBuilderStore(
    (state) => state.contextualSuggestions,
  );
  const setAudienceSuggestions = useTopicBuilderStore(
    (state) => state.setAudienceSuggestions,
  );
  // Removed unused updateContextualSuggestions

  // Track previous form data to detect changes
  const previousFormDataRef = useRef<Partial<TopicBuilderFormData>>(formData);

  // Memoize current suggestions state
  const suggestionsState: ContextualSuggestionsState = useMemo(
    () => ({
      audienceSuggestions: contextualSuggestions.audienceByIndustry,
      isUpdating: false, // Will be managed by store if needed
    }),
    [contextualSuggestions.audienceByIndustry],
  );

  // Manual update functions
  const updateAudienceSuggestions = useCallback(
    (industry: Industry) => {
      const currentAudience = formData.audience || [];
      const suggestions = getContextualAudienceSuggestions(
        industry,
        currentAudience,
      );
      setAudienceSuggestions(suggestions);
    },
    [formData.audience, setAudienceSuggestions],
  );

  const updateAllSuggestions = useCallback(() => {
    if (formData.industry) {
      updateAudienceSuggestions(formData.industry);
    }
  }, [formData.industry, updateAudienceSuggestions]);

  const resetSuggestions = useCallback(() => {
    setAudienceSuggestions([]);
  }, [setAudienceSuggestions]);

  // Effect hook to monitor form data changes and update suggestions automatically
  useEffect(() => {
    if (!enableAutoUpdate) return;

    const previousFormData = previousFormDataRef.current;

    // Only check for specific field changes to avoid infinite loops
    const industryChanged = previousFormData?.industry !== formData?.industry;

    if (industryChanged) {
      log.info("🔄 Contextual suggestions updating due to form data changes");

      // Update audience suggestions if industry changed
      if (industryChanged && formData.industry) {
        updateAudienceSuggestions(formData.industry);
      }

      // Update the ref only after processing changes
      previousFormDataRef.current = {
        ...previousFormData,
        industry: formData.industry,
        audience: formData.audience,
      };
    }
  }, [
    formData?.industry,
    formData?.audience,
    enableAutoUpdate,
    updateAudienceSuggestions,
  ]);

  // Initialize suggestions on mount if form data is available
  useEffect(() => {
    const industry = formData.industry;
    const hasAudienceSuggestions =
      contextualSuggestions.audienceByIndustry.length > 0;

    if (industry && !hasAudienceSuggestions) {
      updateAudienceSuggestions(industry);
    }
  }, [
    formData.industry,
    contextualSuggestions.audienceByIndustry.length,
    updateAudienceSuggestions,
  ]);

  return {
    ...suggestionsState,
    updateAllSuggestions,
    updateAudienceSuggestions,
    resetSuggestions,
  };
}

/**
 * Simplified hook for getting audience suggestions only
 */
export function useAudienceSuggestions(
  industry: Industry | undefined,
  existingAudience: string[] = [],
): string[] {
  return useMemo(() => {
    if (!industry) return [];
    return getContextualAudienceSuggestions(industry, existingAudience);
  }, [industry, existingAudience]);
}
