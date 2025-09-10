/**
 * Contextual Suggestions Hook
 *
 * Manages dynamic suggestions based on form data changes.
 * Implements Task 7.3 requirements for effect hooks that monitor
 * relevant fields and update suggestions in real time.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  getContextualAudienceSuggestions,
  getContextualToneRecommendations,
  shouldUpdateSuggestions,
} from "@/lib/contextual-suggestions";
import { useTopicBuilderStore } from "@/stores/topic-builder-store";
import type {
  Industry,
  PurposeType,
  ToneType,
  TopicBuilderFormData,
} from "@/types/topic-builder";

export interface ContextualSuggestionsState {
  /** Industry-specific audience suggestions */
  audienceSuggestions: string[];
  /** Purpose-based tone recommendations */
  toneRecommendations: ToneType[];
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
  /** Update only tone recommendations */
  updateToneRecommendations: (purposes: PurposeType[]) => void;
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
  const {
    contextualSuggestions,
    setAudienceSuggestions,
    setToneRecommendations,
    updateContextualSuggestions,
  } = useTopicBuilderStore((state) => ({
    contextualSuggestions: state.contextualSuggestions,
    setAudienceSuggestions: state.setAudienceSuggestions,
    setToneRecommendations: state.setToneRecommendations,
    updateContextualSuggestions: state.updateContextualSuggestions,
  }));

  // Track previous form data to detect changes
  const previousFormDataRef = useRef<Partial<TopicBuilderFormData>>(formData);

  // Memoize current suggestions state
  const suggestionsState: ContextualSuggestionsState = useMemo(
    () => ({
      audienceSuggestions: contextualSuggestions.audienceByIndustry,
      toneRecommendations: contextualSuggestions.tonesByPurpose,
      isUpdating: false, // Will be managed by store if needed
    }),
    [
      contextualSuggestions.audienceByIndustry,
      contextualSuggestions.tonesByPurpose,
    ],
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

  const updateToneRecommendations = useCallback(
    (purposes: PurposeType[]) => {
      const currentTones = formData.tone || [];
      const recommendations = getContextualToneRecommendations(
        purposes,
        currentTones,
      );
      setToneRecommendations(recommendations);
    },
    [formData.tone, setToneRecommendations],
  );

  const updateAllSuggestions = useCallback(() => {
    if (formData.industry) {
      updateAudienceSuggestions(formData.industry);
    }
    if (formData.purpose) {
      updateToneRecommendations(formData.purpose);
    }
  }, [
    formData.industry,
    formData.purpose,
    updateAudienceSuggestions,
    updateToneRecommendations,
  ]);

  const resetSuggestions = useCallback(() => {
    setAudienceSuggestions([]);
    setToneRecommendations([]);
  }, [setAudienceSuggestions, setToneRecommendations]);

  // Effect hook to monitor form data changes and update suggestions automatically
  useEffect(() => {
    if (!enableAutoUpdate) return;

    const previousFormData = previousFormDataRef.current;
    const hasChanges = shouldUpdateSuggestions(previousFormData, formData);

    if (hasChanges) {
      console.log(
        "🔄 Contextual suggestions updating due to form data changes",
      );

      // Update audience suggestions if industry changed
      if (
        previousFormData?.industry !== formData?.industry &&
        formData.industry
      ) {
        updateAudienceSuggestions(formData.industry);
      }

      // Update tone recommendations if purpose changed
      if (
        JSON.stringify(previousFormData?.purpose) !==
          JSON.stringify(formData?.purpose) &&
        formData.purpose
      ) {
        updateToneRecommendations(formData.purpose);
      }

      // Update the store's updateContextualSuggestions if needed
      updateContextualSuggestions();
    }

    // Update the ref for next comparison
    previousFormDataRef.current = formData;
  }, [
    formData,
    enableAutoUpdate,
    updateAudienceSuggestions,
    updateToneRecommendations,
    updateContextualSuggestions,
  ]);

  // Initialize suggestions on mount if form data is available
  useEffect(() => {
    if (
      formData.industry &&
      contextualSuggestions.audienceByIndustry.length === 0
    ) {
      updateAudienceSuggestions(formData.industry);
    }
    if (formData.purpose && contextualSuggestions.tonesByPurpose.length === 0) {
      updateToneRecommendations(formData.purpose);
    }
  }, [
    formData.industry,
    formData.purpose,
    contextualSuggestions.audienceByIndustry.length,
    contextualSuggestions.tonesByPurpose.length,
    updateAudienceSuggestions,
    updateToneRecommendations,
  ]);

  return {
    ...suggestionsState,
    updateAllSuggestions,
    updateAudienceSuggestions,
    updateToneRecommendations,
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

/**
 * Simplified hook for getting tone recommendations only
 */
export function useToneRecommendations(
  purposes: PurposeType[] | undefined,
  existingTones: ToneType[] = [],
): ToneType[] {
  return useMemo(() => {
    if (!purposes || purposes.length === 0) return [];
    return getContextualToneRecommendations(purposes, existingTones);
  }, [purposes, existingTones]);
}
