import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  GeneratedTopic,
  TopicBuilderFormData,
} from "@/types/topic-builder";

/**
 * Topic Builder Store Interface
 *
 * Manages client-side state for the topic builder wizard.
 * Separated from server state (handled by TanStack Query).
 */
interface TopicBuilderState {
  // Form state
  currentStep: number;
  formData: Partial<TopicBuilderFormData>;
  visitedSteps: Set<number>;

  // UI state
  isGenerating: boolean;
  showValidation: boolean;

  // Results state
  generatedTopics: GeneratedTopic[];
  selectedTopicIds: string[];

  // Actions
  setCurrentStep: (step: number) => void;
  updateFormData: (data: Partial<TopicBuilderFormData>) => void;
  setVisitedSteps: (steps: Set<number>) => void;
  setIsGenerating: (generating: boolean) => void;
  setShowValidation: (show: boolean) => void;
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
 * Default form data for the topic builder
 */
const initialFormData: Partial<TopicBuilderFormData> = {
  wizardMode: "industry-first",
  num_ideas: 5,
  purpose: [],
  content_goal: [],
  tone: [],
  demographic_age: [],
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
        // Initial state
        currentStep: 1,
        formData: initialFormData,
        visitedSteps: new Set([1]),
        isGenerating: false,
        showValidation: false,
        generatedTopics: [],
        selectedTopicIds: [],

        // Actions
        setCurrentStep: (step) => {
          const { visitedSteps } = get();
          const newVisitedSteps = new Set(visitedSteps);
          newVisitedSteps.add(step);

          set({
            currentStep: step,
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
            currentStep: 1,
            formData: initialFormData,
            visitedSteps: new Set([1]),
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
