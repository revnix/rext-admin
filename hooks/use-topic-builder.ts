"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createInitialFormData,
  detectYMYL,
  prepareFormDataForAPI,
  updateFormDataForContentTypeChange,
  updateFormDataForIndustryChange,
  validateFormStepDetailed,
} from "@/lib/topic-builder-utils";
import type {
  GeneratedTopic,
  TopicBuilderDraft,
  TopicBuilderFormData,
  ValidationResult,
} from "@/types/topic-builder";

const STORAGE_KEY = "topic-builder-draft";

interface UseTopicBuilderReturn {
  // Form state
  formData: TopicBuilderFormData;
  currentStep: number;
  errors: Record<string, string>;

  // Generated topics state
  generatedTopics: GeneratedTopic[];
  isGenerating: boolean;

  // Form management
  updateFormData: (
    field: keyof TopicBuilderFormData,
    value: string | string[] | number | boolean,
  ) => void;
  resetForm: () => void;

  // Step navigation
  nextStep: () => boolean;
  prevStep: () => boolean;
  goToStep: (step: number) => boolean;
  canProceedToNextStep: () => boolean;
  isStepCompleted: (step: number) => boolean;

  // Validation
  validateCurrentStep: () => ValidationResult;
  validateStep: (step: number) => ValidationResult;

  // Topic generation
  generateTopics: () => Promise<void>;
  clearTopics: () => void;

  // Draft management
  saveDraft: (draftName?: string) => void;
  loadDraft: () => TopicBuilderDraft | null;
  clearDraft: () => void;
  hasDraft: boolean;
}

export const useTopicBuilder = (): UseTopicBuilderReturn => {
  // Core state
  const [formData, setFormData] = useState<TopicBuilderFormData>(
    createInitialFormData(),
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generation state
  const [generatedTopics, setGeneratedTopics] = useState<GeneratedTopic[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Draft persistence state
  const [hasDraft, setHasDraft] = useState(false);

  // Draft management functions (defined early to avoid dependency issues)
  const loadDraft = useCallback((): TopicBuilderDraft | null => {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const draft: TopicBuilderDraft = JSON.parse(stored);
        return draft;
      }
    } catch (error) {
      console.warn("Failed to load draft from localStorage:", error);
    }

    return null;
  }, []);

  const saveDraft = useCallback(
    (draftName?: string) => {
      if (typeof window === "undefined") return;

      const draft: TopicBuilderDraft = {
        formData,
        currentStep,
        savedAt: new Date().toISOString(),
        draftName,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        setHasDraft(true);
      } catch (error) {
        console.warn("Failed to save draft to localStorage:", error);
      }
    },
    [formData, currentStep],
  );

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasDraft(false);
    } catch (error) {
      console.warn("Failed to clear draft from localStorage:", error);
    }
  }, []);

  // Check for existing draft on mount
  useEffect(() => {
    const draft = loadDraft();
    setHasDraft(!!draft);
  }, [loadDraft]);

  // Auto-save draft when form data changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveDraft();
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [saveDraft]);

  // Form data update with conditional field logic
  const updateFormData = useCallback(
    (
      field: keyof TopicBuilderFormData,
      value: string | string[] | number | boolean,
    ) => {
      setFormData((prev) => {
        let updated = { ...prev, [field]: value };

        // Handle industry change - reset dependent fields
        if (field === "industry" && typeof value === "string") {
          updated = updateFormDataForIndustryChange(prev, value);
        }

        // Handle content type change - reset platform if not needed
        else if (field === "content_type" && typeof value === "string") {
          updated = updateFormDataForContentTypeChange(prev, value);
        }

        // Auto-detect YMYL for any industry-related changes
        else if (field === "industry_other" && typeof value === "string") {
          updated.is_ymyl = detectYMYL(value);
        }

        return updated;
      });

      // Clear field-specific errors when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors],
  );

  // Form reset
  const resetForm = useCallback(() => {
    setFormData(createInitialFormData());
    setCurrentStep(1);
    setErrors({});
    setGeneratedTopics([]);
    setIsGenerating(false);
    clearDraft();
  }, [clearDraft]);

  // Validation functions
  const validateStep = useCallback(
    (step: number): ValidationResult => {
      return validateFormStepDetailed(step, formData);
    },
    [formData],
  );

  const validateCurrentStep = useCallback((): ValidationResult => {
    return validateStep(currentStep);
  }, [currentStep, validateStep]);

  const canProceedToNextStep = useCallback((): boolean => {
    const validation = validateCurrentStep();
    return validation.isValid;
  }, [validateCurrentStep]);

  // Step completion check
  const isStepCompleted = useCallback(
    (step: number): boolean => {
      const validation = validateStep(step);
      return validation.isValid;
    },
    [validateStep],
  );

  // Step navigation with validation
  const nextStep = useCallback((): boolean => {
    const validation = validateCurrentStep();

    if (!validation.isValid) {
      // Set errors for display
      const stepErrors: Record<string, string> = {};
      validation.errors.forEach((error, index) => {
        stepErrors[`step${currentStep}_${index}`] = error;
      });
      setErrors(stepErrors);
      return false;
    }

    // Clear errors and proceed
    setErrors({});

    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
      return true;
    }

    return false;
  }, [currentStep, validateCurrentStep]);

  const prevStep = useCallback((): boolean => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({}); // Clear errors when going back
      return true;
    }
    return false;
  }, [currentStep]);

  const goToStep = useCallback(
    (step: number): boolean => {
      if (step < 1 || step > 6) {
        return false;
      }

      // Allow navigation to any completed step or the next uncompleted step
      if (step <= currentStep) {
        // Can always go back to previous or current step
        setCurrentStep(step);
        setErrors({});
        return true;
      }

      // For forward navigation, validate all steps up to the target step
      for (let i = 1; i < step; i++) {
        const validation = validateStep(i);
        if (!validation.isValid) {
          console.warn(
            `Cannot navigate to step ${step}: Step ${i} validation failed`,
            validation.errors,
          );
          return false;
        }
      }

      setCurrentStep(step);
      setErrors({});
      return true;
    },
    [currentStep, validateStep],
  );

  // Topic generation
  const generateTopics = useCallback(async (): Promise<void> => {
    // Final validation before generation
    const validation = validateStep(6);
    if (!validation.isValid) {
      const stepErrors: Record<string, string> = {};
      validation.errors.forEach((error, index) => {
        stepErrors[`generation_${index}`] = error;
      });
      setErrors(stepErrors);
      return;
    }

    setIsGenerating(true);
    setErrors({});

    try {
      const apiData = prepareFormDataForAPI(formData);

      const response = await fetch("/api/generate-topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate topics: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.topics && Array.isArray(result.topics)) {
        // Add unique IDs to topics if not present
        const topicsWithIds = result.topics.map(
          (topic: unknown, index: number) => ({
            ...(topic as GeneratedTopic),
            id: (topic as GeneratedTopic).id || `topic_${Date.now()}_${index}`,
          }),
        );

        setGeneratedTopics(topicsWithIds);
      } else {
        throw new Error("Invalid response format from topic generation API");
      }
    } catch (error) {
      console.error("Topic generation failed:", error);
      setErrors({
        generation:
          error instanceof Error
            ? error.message
            : "Failed to generate topics. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [formData, validateStep]);

  const clearTopics = useCallback(() => {
    setGeneratedTopics([]);
    setErrors({});
  }, []);

  return {
    // Form state
    formData,
    currentStep,
    errors,

    // Generated topics state
    generatedTopics,
    isGenerating,

    // Form management
    updateFormData,
    resetForm,

    // Step navigation
    nextStep,
    prevStep,
    goToStep,
    canProceedToNextStep,
    isStepCompleted,

    // Validation
    validateCurrentStep,
    validateStep,

    // Topic generation
    generateTopics,
    clearTopics,

    // Draft management
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
  };
};
