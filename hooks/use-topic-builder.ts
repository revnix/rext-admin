"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { classifyError, isOnline } from "@/lib/error-utils";
import {
  createInitialFormData,
  prepareFormDataForAPI,
  updateFormDataForContentTypeChange,
  updateFormDataForIndustryChange,
  validateFormStepDetailed,
} from "@/lib/topic-builder-utils";
import type { BackendError } from "@/types/backend";
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
  generationError: BackendError | null;
  isOnline: boolean;

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
  validateField: (field: keyof TopicBuilderFormData) => ValidationResult;
  getFieldError: (field: keyof TopicBuilderFormData) => string | undefined;

  // Topic generation
  generateTopics: () => Promise<void>;
  clearTopics: () => void;
  retryGeneration: () => Promise<void>;
  cancelGeneration: () => void;
  clearGenerationError: () => void;

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

  // Step tracking state - track which steps user has actually visited
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));

  // Generation state
  const [generatedTopics, setGeneratedTopics] = useState<GeneratedTopic[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<BackendError | null>(
    null,
  );
  const [connectionStatus, setConnectionStatus] = useState(isOnline());
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // Draft persistence state
  const [hasDraft, setHasDraft] = useState(false);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus(true);
      // Clear network-related errors when coming back online
      setGenerationError((prev) =>
        prev && prev.type === "network_error" ? null : prev,
      );
    };
    const handleOffline = () => setConnectionStatus(false);

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

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

  // Ensure visited steps includes all steps up to current step (for draft loading)
  useEffect(() => {
    setVisitedSteps((prev) => {
      const newVisited = new Set(prev);
      // Add all steps from 1 to currentStep
      for (let i = 1; i <= currentStep; i++) {
        newVisited.add(i);
      }
      return newVisited;
    });
  }, [currentStep]);

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
    setVisitedSteps(new Set([1])); // Reset to only step 1 visited
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

  // Step completion check - only completed if valid AND user has visited the step
  const isStepCompleted = useCallback(
    (step: number): boolean => {
      // A step is only completed if:
      // 1. User has visited it (or it's before current step), AND
      // 2. It passes validation
      const hasBeenVisited = visitedSteps.has(step) || step < currentStep;
      const validation = validateStep(step);

      return hasBeenVisited && validation.isValid;
    },
    [validateStep, visitedSteps, currentStep],
  );

  // Real-time field validation for immediate feedback
  const validateField = useCallback(
    (field: keyof TopicBuilderFormData): ValidationResult => {
      const validation = validateStep(currentStep);

      // Create a mapping of field names to validation keywords (simplified)
      const fieldKeywords: Record<string, string[]> = {
        wizardMode: ["select how", "start"],
        industry: ["industry", "domain"],
        industry_other: ["custom industry", "specify"],
        subject: ["subject", "topic"],
        audience: ["audience"],
        content_type: ["content type"],
        content_type_other: ["custom content type"],
        platform: ["platform"],
        platform_other: ["custom platform"],
        purpose: ["purpose"],
        tone: ["tone"],
        num_ideas: ["number of ideas"],
        notes: ["notes"],
      };

      const keywords = fieldKeywords[field] || [field];
      const fieldErrors = validation.errors.filter((error) =>
        keywords.some((keyword) =>
          error.toLowerCase().includes(keyword.toLowerCase()),
        ),
      );

      return {
        isValid: fieldErrors.length === 0,
        errors: fieldErrors,
        warnings: validation.warnings || [],
      };
    },
    [currentStep, validateStep],
  );

  // Get specific field error for UI display
  const getFieldError = useCallback(
    (field: keyof TopicBuilderFormData): string | undefined => {
      const validation = validateField(field);
      return validation.errors[0];
    },
    [validateField],
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
      const nextStepNumber = currentStep + 1;
      setCurrentStep(nextStepNumber);
      setVisitedSteps((prev) => new Set([...prev, nextStepNumber]));
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
      setVisitedSteps((prev) => new Set([...prev, step]));
      setErrors({});
      return true;
    },
    [currentStep, validateStep],
  );

  // Topic generation with enhanced error handling
  const generateTopics = useCallback(async (): Promise<void> => {
    // Check online status first
    if (!connectionStatus) {
      const offlineError = classifyError(new Error("No internet connection"));
      setGenerationError(offlineError);
      return;
    }

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
    setGenerationError(null);

    // Create new AbortController for this request
    const controller = new AbortController();
    setAbortController(controller);

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentRequestId(requestId);

    console.log(`Starting topic generation request: ${requestId}`);

    try {
      const apiData = prepareFormDataForAPI(formData);

      // Debug logging to see what's being sent
      console.log("Form data being sent:", apiData);
      console.log("Required fields check:", {
        wizardMode: apiData.wizardMode,
        industry: apiData.industry,
        content_type: apiData.content_type,
        purpose: apiData.purpose,
        tone: apiData.tone,
      });

      const response = await fetch("/api/generate-topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
        },
        body: JSON.stringify({ formData: apiData }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(
          `Backend API error: ${response.status} ${errorMessage}`,
        );
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
        setGenerationError(null); // Clear any previous errors
      } else {
        throw new Error("Invalid response format from topic generation API");
      }
    } catch (error) {
      // Handle AbortError specifically (user-initiated cancellation)
      if (error instanceof Error && error.name === "AbortError") {
        console.log(`Topic generation aborted: ${requestId}`);

        // Enhanced analytics logging for cancellations
        console.log("ANALYTICS: AbortError caught in generateTopics", {
          requestId,
          timestamp: new Date().toISOString(),
          source: "fetch_abort",
        });

        // Don't set error state for user-initiated cancellations
        setGenerationError(null);
        setErrors({});

        // Toast notification handled in cancelGeneration function
        // No additional toast here to avoid double notifications
      } else {
        const classifiedError = classifyError(error, requestId);
        console.error("Topic generation failed:", classifiedError);

        // Enhanced error logging
        console.log("ANALYTICS: Generation error", {
          requestId,
          errorType: classifiedError.type,
          timestamp: new Date().toISOString(),
          technicalMessage: classifiedError.technicalMessage,
        });

        setGenerationError(classifiedError);

        // Also set legacy error format for backward compatibility
        setErrors({
          generation: classifiedError.message,
        });

        // Error toast notification
        toast.error("Generation failed", {
          description: classifiedError.message,
          action: classifiedError.recoveryActions.includes("retry")
            ? {
                label: "Retry",
                onClick: () => generateTopics(),
              }
            : undefined,
          duration: 6000,
        });
      }
    } finally {
      setIsGenerating(false);
      setCurrentRequestId(null);
      setAbortController(null);
    }
  }, [formData, validateStep, connectionStatus]);

  const clearTopics = useCallback(() => {
    setGeneratedTopics([]);
    setErrors({});
    setGenerationError(null);
  }, []);

  // Retry generation function
  const retryGeneration = useCallback(async (): Promise<void> => {
    await generateTopics();
  }, [generateTopics]);

  // Cancel current generation
  const cancelGeneration = useCallback(() => {
    if (abortController && currentRequestId) {
      console.log(`Cancelling topic generation request: ${currentRequestId}`);
      // Abort the in-flight request
      abortController.abort();

      // Clear states immediately for better UX
      setIsGenerating(false);
      setCurrentRequestId(null);
      setAbortController(null);
      setGenerationError(null);
      setErrors({});

      // Add user feedback with toast
      toast.success("Generation cancelled", {
        description:
          "Topic generation was cancelled successfully. You can start over anytime.",
        duration: 4000,
      });

      // Enhanced logging for analytics
      console.log("ANALYTICS: Topic generation cancelled", {
        requestId: currentRequestId,
        timestamp: new Date().toISOString(),
        userAgent:
          typeof window !== "undefined"
            ? window.navigator.userAgent
            : "unknown",
        formDataSnapshot: {
          industry: formData.industry,
          content_type: formData.content_type,
          num_ideas: formData.num_ideas,
        },
      });
    }
  }, [abortController, currentRequestId, formData]);

  // Clear generation error
  const clearGenerationError = useCallback(() => {
    setGenerationError(null);
    // Also clear legacy errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.generation;
      return newErrors;
    });
  }, []);

  return {
    // Form state
    formData,
    currentStep,
    errors,

    // Generated topics state
    generatedTopics,
    isGenerating,
    generationError,
    isOnline: connectionStatus,

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
    validateField,
    getFieldError,

    // Topic generation
    generateTopics,
    clearTopics,
    retryGeneration,
    cancelGeneration,
    clearGenerationError,

    // Draft management
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
  };
};
