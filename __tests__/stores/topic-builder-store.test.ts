/**
 * Tests for Topic Builder Zustand Store
 */

import { act, renderHook } from "@testing-library/react";
import { useTopicBuilderStore } from "@/stores/topic-builder-store";
import type { GeneratedTopic } from "@/types/topic-builder";

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

const mockTopics: GeneratedTopic[] = [
  {
    id: "1",
    title: "Test Topic 1",
    angle: "Test angle 1",
    description: "Test description 1",
    channel_fit: ["blog"],
    audience_fit: ["developers"],
    why_it_works: "Test reason 1",
    scores: { relevance: 0.8, freshness: 0.7, novelty: 0.6 },
    tags: ["tech"],
  },
  {
    id: "2",
    title: "Test Topic 2",
    angle: "Test angle 2",
    description: "Test description 2",
    channel_fit: ["social-media"],
    audience_fit: ["marketers"],
    why_it_works: "Test reason 2",
    scores: { relevance: 0.9, freshness: 0.8, novelty: 0.7 },
    tags: ["marketing"],
  },
];

describe("useTopicBuilderStore", () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset store to initial state
    const { result } = renderHook(() => useTopicBuilderStore());
    act(() => {
      result.current.resetWizard();
    });
  });

  describe("Step Navigation", () => {
    it("should initialize with step 1", () => {
      const { result } = renderHook(() => useTopicBuilderStore());
      expect(result.current.currentStep).toBe(1);
    });

    it("should update current step and visited steps", () => {
      const { result } = renderHook(() => useTopicBuilderStore());

      act(() => {
        result.current.setCurrentStep(3);
      });

      expect(result.current.currentStep).toBe(3);
      expect(result.current.visitedSteps).toContain(1);
      expect(result.current.visitedSteps).toContain(3);
    });
  });

  describe("Form Data Management", () => {
    it("should update form data", () => {
      const { result } = renderHook(() => useTopicBuilderStore());

      act(() => {
        result.current.updateFormData({
          industry: "technology",
          subject: "AI trends",
        });
      });

      expect(result.current.formData.industry).toBe("technology");
      expect(result.current.formData.subject).toBe("AI trends");
    });

    it("should merge form data updates", () => {
      const { result } = renderHook(() => useTopicBuilderStore());

      act(() => {
        result.current.updateFormData({ industry: "technology" });
        result.current.updateFormData({ subject: "AI trends" });
      });

      expect(result.current.formData.industry).toBe("technology");
      expect(result.current.formData.subject).toBe("AI trends");
    });
  });

  describe("Topic Selection", () => {
    it("should set generated topics and reset selection", () => {
      const { result } = renderHook(() => useTopicBuilderStore());

      act(() => {
        result.current.setGeneratedTopics(mockTopics);
      });

      expect(result.current.generatedTopics).toEqual(mockTopics);
      expect(result.current.selectedTopicIds).toEqual([]);
    });

    it("should toggle topic selection", () => {
      const { result } = renderHook(() => useTopicBuilderStore());

      act(() => {
        result.current.setGeneratedTopics(mockTopics);
        result.current.toggleTopicSelection("1");
      });

      expect(result.current.selectedTopicIds).toContain("1");

      act(() => {
        result.current.toggleTopicSelection("1");
      });

      expect(result.current.selectedTopicIds).not.toContain("1");
    });

    it("should select all topics", () => {
      const { result } = renderHook(() => useTopicBuilderStore());

      act(() => {
        result.current.setGeneratedTopics(mockTopics);
        result.current.selectAllTopics();
      });

      expect(result.current.selectedTopicIds).toEqual(["1", "2"]);
    });

    it("should deselect all topics", () => {
      const { result } = renderHook(() => useTopicBuilderStore());

      act(() => {
        result.current.setGeneratedTopics(mockTopics);
        result.current.selectAllTopics();
        result.current.deselectAllTopics();
      });

      expect(result.current.selectedTopicIds).toEqual([]);
    });
  });

  describe("UI State", () => {
    it("should manage generating state", () => {
      const { result } = renderHook(() => useTopicBuilderStore());

      expect(result.current.isGenerating).toBe(false);

      act(() => {
        result.current.setIsGenerating(true);
      });

      expect(result.current.isGenerating).toBe(true);
    });

    it("should manage validation display state", () => {
      const { result } = renderHook(() => useTopicBuilderStore());

      expect(result.current.showValidation).toBe(false);

      act(() => {
        result.current.setShowValidation(true);
      });

      expect(result.current.showValidation).toBe(true);
    });
  });

  describe("Reset Functionality", () => {
    it("should reset wizard to initial state", () => {
      const { result } = renderHook(() => useTopicBuilderStore());

      act(() => {
        result.current.setCurrentStep(3);
        result.current.updateFormData({ industry: "technology" });
        result.current.setIsGenerating(true);
        result.current.setGeneratedTopics(mockTopics);
        result.current.selectAllTopics();
      });

      act(() => {
        result.current.resetWizard();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generatedTopics).toEqual([]);
      expect(result.current.selectedTopicIds).toEqual([]);
    });
  });
});
