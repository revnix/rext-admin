import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  CurrentStep,
  GeneratedTopic,
  StepHistory,
  TopicBuilderFormData,
  ValidationResult,
} from "@/types/topic-builder";

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

  // Legacy step tracking (for backward compatibility)
  currentStepNumber: number;
  visitedSteps: Set<number>;

  // Form state
  formData: Partial<TopicBuilderFormData>;

  // UI state
  isGenerating: boolean;
  showValidation: boolean;

  // Results state
  generatedTopics: GeneratedTopic[];
  selectedTopicIds: string[];

  // TypeForm wizard actions
  setCurrentStep: (step: CurrentStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  validateCurrentStep: () => boolean;
  setStepValidation: (step: CurrentStep, validation: ValidationResult) => void;

  // Form data actions
  updateFormData: (data: Partial<TopicBuilderFormData>) => void;

  // Legacy actions (for backward compatibility)
  setCurrentStepNumber: (step: number) => void;
  setVisitedSteps: (steps: Set<number>) => void;

  // UI state actions
  setIsGenerating: (generating: boolean) => void;
  setShowValidation: (show: boolean) => void;

  // Results actions
  setGeneratedTopics: (topics: GeneratedTopic[]) => void;
  toggleTopicSelection: (topicId: string) => void;
  selectAllTopics: () => void;
  deselectAllTopics: () => void;
  resetWizard: () => void;

  // Optimistic update actions
  optimisticallyMarkTopicSaved: (topicId: string) => void;
  revertOptimisticSave: (topicId: string) => void;
  updateTopicSaveState: (topicId: string, isBeingSaved: boolean) => void;
}

/**
 * Default form data for the topic builder - clean, no deprecated fields
 */
const initialFormData: Partial<TopicBuilderFormData> = {
  wizardMode: "industry-first",
  num_ideas: 5,
  purpose: [],
  tone: [],
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
  "content-type": { isValid: false, errors: [] },
  platform: { isValid: true, errors: [] }, // Optional step
  purpose: { isValid: false, errors: [] },
  tone: { isValid: false, errors: [] },
  notes: { isValid: true, errors: [] }, // Optional step
  "num-ideas": { isValid: true, errors: [] }, // Has default value
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

        // Legacy initial state (for backward compatibility)
        currentStepNumber: 1,
        visitedSteps: new Set([1]),

        // Form state
        formData: initialFormData,

        // UI state
        isGenerating: false,
        showValidation: false,

        // Results state
        generatedTopics: [],
        selectedTopicIds: [],

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
            "content-type",
            "platform",
            "purpose",
            "tone",
            "notes",
            "num-ideas",
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

        // Legacy action (for backward compatibility)
        setCurrentStepNumber: (step) => {
          const { visitedSteps } = get();
          const newVisitedSteps = new Set(visitedSteps);
          newVisitedSteps.add(step);

          set({
            currentStepNumber: step,
            visitedSteps: newVisitedSteps,
          });
        },

        updateFormData: (data) => {
          set((state) => ({
            formData: { ...state.formData, ...data },
          }));
        },

        setVisitedSteps: (steps) => {
          set({ visitedSteps: steps });
        },

        setIsGenerating: (generating) => {
          set({ isGenerating: generating });
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

            // Legacy state reset (for backward compatibility)
            currentStepNumber: 1,
            visitedSteps: new Set([1]),

            // Form and UI state reset
            formData: initialFormData,
            isGenerating: false,
            showValidation: false,
            generatedTopics: [],
            selectedTopicIds: [],
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
      }),
      {
        name: "topic-builder-store",
        // Only persist form data and current step for draft saving
        partialize: (state) => ({
          currentStep: state.currentStep,
          formData: state.formData,
          visitedSteps: Array.from(state.visitedSteps), // Convert Set to Array for JSON
        }),
        // Custom storage to handle Set serialization
        storage: {
          getItem: (name) => {
            const str = localStorage.getItem(name);
            if (!str) return null;

            const parsed = JSON.parse(str);
            // Convert visitedSteps array back to Set
            if (parsed.state?.visitedSteps) {
              parsed.state.visitedSteps = new Set(parsed.state.visitedSteps);
            }
            return parsed;
          },
          setItem: (name, value) => {
            // Convert Set to Array for JSON serialization
            const serialized = {
              ...value,
              state: {
                ...value.state,
                visitedSteps: Array.from(value.state.visitedSteps || []),
              },
            };
            localStorage.setItem(name, JSON.stringify(serialized));
          },
          removeItem: (name) => localStorage.removeItem(name),
        },
      },
    ),
    {
      name: "topic-builder-store",
    },
  ),
);
