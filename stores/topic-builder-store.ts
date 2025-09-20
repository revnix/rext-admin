import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import type {
  CurrentStep,
  GeneratedTopic,
  StepHistory,
  TopicBuilderFormData,
  ValidationResult,
} from "@/types/topic-builder";

// SSR-safe storage implementation
const getStorage = () => {
  // SSR guard - only access localStorage on client-side
  if (typeof window === "undefined") {
    // Return a no-op storage for SSR
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return localStorage;
};

/**
 * Topic Builder Store Interface
 *
 * Updated for TypeForm-style wizard flow with step navigation.
 * Manages client-side state for the topic builder wizard.
 * Separated from server state (handled by TanStack Query).
 */
interface TopicBuilderState {
  // TypeForm wizard navigation state
  currentStep: CurrentStep;
  stepHistory: StepHistory;
  stepValidation: Record<CurrentStep, ValidationResult>;

  // Form state
  formData: Partial<TopicBuilderFormData>;

  // UI state
  isGenerating: boolean;
  isGeneratingMore: boolean;
  showValidation: boolean;

  // Results state
  generatedTopics: GeneratedTopic[];
  selectedTopicIds: string[];
  newlyAddedTopicIds: string[];

  // Contextual suggestions state (Task 7.3)
  contextualSuggestions: {
    audienceByIndustry: string[];
    // tonesByPurpose removed as ToneType is deprecated
  };

  // TypeForm wizard actions
  setCurrentStep: (step: CurrentStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  validateCurrentStep: () => boolean;
  setStepValidation: (step: CurrentStep, validation: ValidationResult) => void;

  // Form data actions
  updateFormData: (data: Partial<TopicBuilderFormData>) => void;

  // UI state actions
  setIsGenerating: (generating: boolean) => void;
  setIsGeneratingMore: (generating: boolean) => void;
  setShowValidation: (show: boolean) => void;

  // Results actions
  setGeneratedTopics: (topics: GeneratedTopic[]) => void;
  appendGeneratedTopics: (newTopics: GeneratedTopic[]) => void;
  clearNewlyAddedHighlights: () => void;
  toggleTopicSelection: (topicId: string) => void;
  selectAllTopics: () => void;
  deselectAllTopics: () => void;
  resetWizard: () => void;

  // Optimistic update actions
  optimisticallyMarkTopicSaved: (topicId: string) => void;
  revertOptimisticSave: (topicId: string) => void;
  updateTopicSaveState: (topicId: string, isBeingSaved: boolean) => void;

  // Contextual suggestions actions (Task 7.3)
  setAudienceSuggestions: (suggestions: string[]) => void;
  // setToneRecommendations removed as ToneType is deprecated
  updateContextualSuggestions: () => void;
  resetContextualSuggestions: () => void;

  // SSR hydration state
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

/**
 * Default form data for the topic builder with smart defaults per requirements
 * Based on features-requirements-plan.md Section 2.2: Question Defaults & Smart Suggestions
 */
const initialFormData: Partial<TopicBuilderFormData> = {
  industry: "business", // Smart default for broad applicability - now first
  wizardMode: "industry-first", // Default: "I want to explore my industry"
  num_topics: 5,
  purpose: ["educate-inform"], // Smart default
};

/**
 * Default step history for TypeForm wizard flow
 */
const initialStepHistory: StepHistory = {
  visited: ["wizard-mode"],
  current: "wizard-mode",
  canGoBack: false,
  canGoForward: false,
};

/**
 * Default step validation state
 */
const initialStepValidation: Record<CurrentStep, ValidationResult> = {
  "wizard-mode": { isValid: false, errors: [] },
  industry: { isValid: false, errors: [] },
  subject: { isValid: false, errors: [] },
  audience: { isValid: false, errors: [] },
  purpose: { isValid: false, errors: [] },
};

/**
 * Topic Builder Zustand Store
 *
 * Uses devtools for debugging and persistence for form draft saving.
 * Only stores client-side UI state - server state is handled by TanStack Query.
 */
export const useTopicBuilderStore = create<TopicBuilderState>()(
  devtools(
    persist(
      (set, get) => ({
        // TypeForm wizard initial state
        currentStep: "wizard-mode" as CurrentStep,
        stepHistory: initialStepHistory,
        stepValidation: initialStepValidation,

        // Form state
        formData: initialFormData,

        // UI state
        isGenerating: false,
        isGeneratingMore: false,
        showValidation: false,

        // Results state
        generatedTopics: [],
        selectedTopicIds: [],
        newlyAddedTopicIds: [],

        // Contextual suggestions state (Task 7.3)
        contextualSuggestions: {
          audienceByIndustry: [],
        },

        // SSR hydration state
        _hasHydrated: false,

        // TypeForm wizard actions
        setCurrentStep: (step: CurrentStep) => {
          const { stepHistory } = get();
          const newVisited = [...stepHistory.visited];
          if (!newVisited.includes(step)) {
            newVisited.push(step);
          }

          set({
            currentStep: step,
            stepHistory: {
              ...stepHistory,
              visited: newVisited,
              current: step,
              canGoBack: newVisited.length > 1,
              canGoForward: true, // Will be determined by validation
            },
          });
        },

        goToNextStep: () => {
          const { currentStep } = get();
          const stepOrder: CurrentStep[] = [
            "wizard-mode",
            "industry",
            "subject",
            "audience",
            "purpose",
          ];
          const currentIndex = stepOrder.indexOf(currentStep);
          if (currentIndex < stepOrder.length - 1) {
            const nextStep = stepOrder[currentIndex + 1];
            get().setCurrentStep(nextStep);
          }
        },

        goToPreviousStep: () => {
          const { stepHistory } = get();
          const visitedSteps = stepHistory.visited;
          const currentIndex = visitedSteps.indexOf(stepHistory.current);
          if (currentIndex > 0) {
            const previousStep = visitedSteps[currentIndex - 1];
            get().setCurrentStep(previousStep);
          }
        },

        validateCurrentStep: () => {
          // This will be implemented with actual validation logic
          // For now, return true as a placeholder
          return true;
        },

        setStepValidation: (
          step: CurrentStep,
          validation: ValidationResult,
        ) => {
          set((state) => ({
            stepValidation: {
              ...state.stepValidation,
              [step]: validation,
            },
          }));
        },

        updateFormData: (data) => {
          set((state) => ({
            formData: { ...state.formData, ...data },
          }));
        },

        setIsGenerating: (generating) => {
          set({ isGenerating: generating });
        },

        setIsGeneratingMore: (generating) => {
          set({ isGeneratingMore: generating });
        },

        setShowValidation: (show) => {
          set({ showValidation: show });
        },

        setGeneratedTopics: (topics) => {
          set({
            generatedTopics: topics,
            selectedTopicIds: [], // Reset selection when new topics are generated
          });
        },

        appendGeneratedTopics: (newTopics) => {
          set((state) => ({
            generatedTopics: [...state.generatedTopics, ...newTopics],
            newlyAddedTopicIds: newTopics.map((topic) => topic.id),
            // Don't reset selection when appending topics
          }));
        },

        clearNewlyAddedHighlights: () => {
          set({ newlyAddedTopicIds: [] });
        },

        toggleTopicSelection: (topicId) => {
          set((state) => ({
            selectedTopicIds: state.selectedTopicIds.includes(topicId)
              ? state.selectedTopicIds.filter((id) => id !== topicId)
              : [...state.selectedTopicIds, topicId],
          }));
        },

        selectAllTopics: () => {
          const { generatedTopics } = get();
          set({
            selectedTopicIds: generatedTopics.map((topic) => topic.id),
          });
        },

        deselectAllTopics: () => {
          set({ selectedTopicIds: [] });
        },

        resetWizard: () => {
          set({
            // TypeForm wizard state reset
            currentStep: "wizard-mode" as CurrentStep,
            stepHistory: initialStepHistory,
            stepValidation: initialStepValidation,

            // Form and UI state reset
            formData: initialFormData,
            isGenerating: false,
            isGeneratingMore: false,
            showValidation: false,
            generatedTopics: [],
            selectedTopicIds: [],
            newlyAddedTopicIds: [],

            // Reset contextual suggestions (Task 7.3)
            contextualSuggestions: {
              audienceByIndustry: [],
            },
          });
        },

        // Optimistic update actions
        optimisticallyMarkTopicSaved: (topicId) => {
          set((state) => ({
            generatedTopics: state.generatedTopics.map((topic) =>
              topic.id === topicId
                ? { ...topic, _optimisticSaved: true, _isBeingSaved: false }
                : topic,
            ),
          }));
        },

        revertOptimisticSave: (topicId) => {
          set((state) => ({
            generatedTopics: state.generatedTopics.map((topic) =>
              topic.id === topicId
                ? { ...topic, _optimisticSaved: false, _isBeingSaved: false }
                : topic,
            ),
          }));
        },

        updateTopicSaveState: (topicId, isBeingSaved) => {
          set((state) => ({
            generatedTopics: state.generatedTopics.map((topic) =>
              topic.id === topicId
                ? { ...topic, _isBeingSaved: isBeingSaved }
                : topic,
            ),
          }));
        },

        // Contextual suggestions actions (Task 7.3)
        setAudienceSuggestions: (suggestions) => {
          set((state) => ({
            contextualSuggestions: {
              ...state.contextualSuggestions,
              audienceByIndustry: suggestions,
            },
          }));
        },

        // setToneRecommendations removed as ToneType is deprecated

        updateContextualSuggestions: () => {
          // This method can be used to trigger updates based on current form data
          // The actual suggestion logic is handled by the useContextualSuggestions hook
        },

        resetContextualSuggestions: () => {
          set({
            contextualSuggestions: {
              audienceByIndustry: [],
            },
          });
        },

        // SSR hydration actions
        setHasHydrated: (state: boolean) => {
          set({ _hasHydrated: state });
        },
      }),
      {
        name: "topic-builder-store",
        // Modern 2025 pattern: Only persist form data and current step for draft saving
        partialize: (state) => ({
          currentStep: state.currentStep,
          stepHistory: state.stepHistory,
          formData: state.formData,
        }),
        // SSR-safe storage with guard
        storage: createJSONStorage(() => getStorage()),
        // Enhanced hydration control for SSR compatibility
        skipHydration: false,
        onRehydrateStorage: (_state) => {
          console.log("Hydration starts for topic-builder-store");
          return (state, error) => {
            if (error) {
              console.error("An error happened during hydration:", error);
            } else {
              console.log("Hydration finished for topic-builder-store");
              state?.setHasHydrated(true);
            }
          };
        },
      },
    ),
    {
      name: "topic-builder-store",
    },
  ),
);

/**
 * Hydration-aware hook for React 19 compatibility
 *
 * This hook ensures that Zustand store values are not accessed before hydration
 * is complete, preventing SSR mismatches and hydration errors.
 *
 * @param selector - Function to select specific state from the store
 * @returns Selected state value or undefined if not yet hydrated
 */
export const useHydratedTopicBuilderStore = <T>(
  selector: (state: TopicBuilderState) => T,
): T | undefined => {
  const [hydrated, setHydrated] = useState(false);
  const state = useTopicBuilderStore(selector);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated ? state : undefined;
};
