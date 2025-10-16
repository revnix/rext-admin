/**
 * Topic Prefilling Hook
 *
 * This hook manages automatic form prefilling from topic data.
 * It handles:
 * - Loading topic data
 * - Prefilling form fields from topic suggested defaults
 * - Tracking which fields were auto-filled
 * - Clearing auto-filled values
 *
 * This is a scalable approach that can easily support additional
 * prefilling sources in the future.
 */

import { useCallback, useEffect, useMemo } from "react";
import { useTopic } from "@/hooks/use-topics";
import type { PartialContentCreationFormData } from "@/types/content-creation";

export interface UseTopicPrefillingParams {
  initialTopicId?: string;
  workspaceId: string;
  formData: PartialContentCreationFormData;
  prefillFromTopic: (
    topicData: unknown,
    suggestedDefaults: Record<string, unknown> | undefined,
    userSettings: Record<string, unknown> | undefined,
  ) => void;
  clearAutoFilledValues: () => void;
  touched: Record<string, boolean>;
}

export interface UseTopicPrefillingReturn {
  // Topic data
  isTopicLoading: boolean;
  topicData: unknown | null;

  // Auto-fill management
  clearableFieldsCount: number;
  hasAutoFilledFields: boolean;
  handleClearAutoFilledValues: () => void;
}

/**
 * Custom hook for topic prefilling functionality
 *
 * This hook handles the complete lifecycle of topic prefilling:
 * 1. Fetches topic data when initialTopicId is provided
 * 2. Automatically prefills form fields from topic data
 * 3. Tracks which fields were auto-filled
 * 4. Provides methods to clear auto-filled values
 *
 * The hook is designed to be scalable - additional prefilling sources
 * can be added without modifying the core logic.
 *
 * @param params - Prefilling parameters
 * @returns Prefilling state and handlers
 */
export function useTopicPrefilling({
  initialTopicId,
  workspaceId,
  formData,
  prefillFromTopic,
  clearAutoFilledValues,
  touched,
}: UseTopicPrefillingParams): UseTopicPrefillingReturn {
  // Fetch topic data if initialTopicId is provided
  const {
    data: initialTopic,
    isSuccess: isInitialTopicLoaded,
    isLoading,
  } = useTopic(initialTopicId || "", workspaceId);

  // Handle pre-filling from initial topic
  useEffect(() => {
    if (
      initialTopicId &&
      isInitialTopicLoaded &&
      initialTopic &&
      !formData.topicId
    ) {
      // Only pre-fill if we haven't already set a topic
      prefillFromTopic(
        initialTopic,
        initialTopic.suggested_defaults,
        undefined, // user_settings not implemented yet
      );
    }
  }, [
    initialTopicId,
    isInitialTopicLoaded,
    initialTopic,
    formData.topicId,
    prefillFromTopic,
  ]);

  // Calculate clearable fields count
  const clearableFieldsCount = useMemo(() => {
    const metadata = formData._topicPrefillingMetadata;
    if (!metadata?.prefilledFields) return 0;

    return Object.entries(metadata.prefilledFields).filter(
      ([field, isAutofilled]) =>
        isAutofilled && !touched[field as keyof PartialContentCreationFormData],
    ).length;
  }, [formData._topicPrefillingMetadata, touched]);

  // Check if there are any auto-filled fields
  const hasAutoFilledFields = useMemo(() => {
    return clearableFieldsCount > 0;
  }, [clearableFieldsCount]);

  // Handle clearing auto-filled values
  const handleClearAutoFilledValues = useCallback(() => {
    clearAutoFilledValues();
  }, [clearAutoFilledValues]);

  return {
    isTopicLoading: isLoading,
    topicData: initialTopic || null,
    clearableFieldsCount,
    hasAutoFilledFields,
    handleClearAutoFilledValues,
  };
}
