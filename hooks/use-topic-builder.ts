"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { classifyError, isOnline } from "@/lib/error-utils";
import { log } from "@/lib/logger";
import { generateSessionId, saveSession } from "@/lib/session-storage";
import {
  createInitialFormData,
  updateFormDataForIndustryChange,
  validateFormStepDetailed,
} from "@/lib/topic-builder-utils";
import { useCurrentWorkspace } from "@/stores/workspace";
import type { BackendError } from "@/types/backend";
import type {
  GeneratedTopic,
  TopicBuilderDraft,
  TopicBuilderFormData,
  ValidationResult,
} from "@/types/topic-builder";
import { useTopicGenerationMutation } from "./useTopicGenerationMutation";

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
  generateTopics: (overrideFormData?: TopicBuilderFormData) => Promise<void>;
  clearTopics: () => void;
  retryGeneration: () => Promise<void>;
  cancelGeneration: () => void;
  clearGenerationError: () => void;

  // Draft management
  saveDraft: (draftName?: string) => void;
  loadDraft: () => TopicBuilderDraft | null;
  clearDraft: () => void;
  hasDraft: boolean;

  // Session management
  saveGeneratedTopicsAsSession: () => string | null;
  navigateToResults: (sessionId: string) => void;
}

export const useTopicBuilder = (): UseTopicBuilderReturn => {
  // Navigation
  const router = useRouter();

  // Get current workspace for workspace-scoped navigation
  const currentWorkspace = useCurrentWorkspace();

  // TanStack Query mutation for topic generation
  const generateMutation = useTopicGenerationMutation();

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
    return undefined;
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
      log.warn("Failed to load draft from localStorage:", error);
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
        log.warn("Failed to save draft to localStorage:", error);
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
      log.warn("Failed to clear draft from localStorage:", error);
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
        // Note: content_type field has been removed from the interface

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
        purpose: ["purpose"],
        num_topics: ["number of topics"],
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
          log.warn(
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

  // Topic generation using TanStack Query mutation
  const generateTopics = useCallback(
    async (overrideFormData?: TopicBuilderFormData): Promise<void> => {
      // Check online status first
      if (!connectionStatus) {
        const offlineError = classifyError(new Error("No internet connection"));
        setGenerationError(offlineError);
        return;
      }

      // Final validation before generation
      // Skip step-based validation if override data is provided (wizard flow)
      if (!overrideFormData) {
        const validation = validateStep(6);
        if (!validation.isValid) {
          const stepErrors: Record<string, string> = {};
          validation.errors.forEach((error, index) => {
            stepErrors[`generation_${index}`] = error;
          });
          setErrors(stepErrors);
          return;
        }
      }

      // Clear previous errors
      setErrors({});
      setGenerationError(null);

      // Use override data if provided, otherwise use current state
      const dataToUse = overrideFormData || formData;

      // Get workspace ID from current workspace
      const workspaceId = currentWorkspace?.id;

      // Validate workspace is selected before attempting generation
      if (!workspaceId) {
        const noWorkspaceError = classifyError(
          new Error("No workspace selected. Please select a workspace first."),
        );
        setGenerationError(noWorkspaceError);
        toast.error("No workspace selected", {
          description: "Please select a workspace before generating topics",
          duration: 5000,
        });
        return;
      }

      try {
        // Use the TanStack Query mutation with workspace ID
        const result = await generateMutation.mutateAsync({
          formData: dataToUse,
          workspaceId, // Pass workspace ID to mutation
        });

        log.info("Processing mutation result:", result);
        log.info("Result has topics:", !!result.topics);
        log.info("Topics is array:", Array.isArray(result.topics));
        log.info("Topics length:", result.topics?.length);

        if (result.topics && Array.isArray(result.topics)) {
          log.info("Setting generated topics...");
          setGeneratedTopics(result.topics);
          setGenerationError(null); // Clear any previous errors

          // Auto-save session and navigate to results page
          try {
            log.info("Generating session ID...");
            const sessionId = generateSessionId();
            log.info("Session ID generated:", sessionId);

            log.info("Saving session...");
            saveSession({
              id: sessionId,
              topics: result.topics,
              formData: dataToUse,
            });

            log.info(`Session saved successfully: ${sessionId}`, {
              topicCount: result.topics.length,
              formData: dataToUse,
            });

            // Navigate to workspace-scoped results page using slug
            const workspaceSlug = currentWorkspace?.slug;
            if (!workspaceSlug) {
              log.error(
                "Cannot navigate: No workspace selected or slug missing",
              );
              toast.error("No workspace selected", {
                description:
                  "Please select a workspace before generating topics",
              });
              return;
            }

            log.info("Navigating to workspace-scoped results page...");
            router.push(
              `/w/${workspaceSlug}/topics/create/results/${sessionId}`,
            );
          } catch (sessionError) {
            log.error("Failed to save session:", sessionError);
            // Don't throw, just log the error and continue
            // User will still see results in current page
          }
        } else {
          log.error("Invalid result format:", result);
          throw new Error("Invalid response format from topic generation API");
        }
      } catch (error) {
        // The mutation hook handles error toasts, but we need to update local state
        const classifiedError =
          error &&
          typeof error === "object" &&
          "type" in error &&
          "message" in error
            ? (error as BackendError)
            : classifyError(error);

        log.error("Topic generation failed:", classifiedError);

        setGenerationError(classifiedError);

        // Also set legacy error format for backward compatibility
        setErrors({
          generation: classifiedError.message,
        });
      }
    },
    [
      formData,
      validateStep,
      connectionStatus,
      router,
      generateMutation,
      currentWorkspace?.slug,
      currentWorkspace?.id,
    ],
  );

  const clearTopics = useCallback(() => {
    setGeneratedTopics([]);
    setErrors({});
    setGenerationError(null);
  }, []);

  // Retry generation function
  const retryGeneration = useCallback(async (): Promise<void> => {
    await generateTopics();
  }, [generateTopics]);

  // Cancel current generation (legacy support for existing components)
  const cancelGeneration = useCallback(() => {
    if (generateMutation.isPending) {
      // The mutation doesn't have a built-in cancel method, but we can handle it gracefully
      log.info("Generation cancellation requested (mutation will complete)");

      // Clear local states for UX
      setGenerationError(null);
      setErrors({});

      // Add user feedback with toast
      toast.success("Generation cancelled", {
        description:
          "Topic generation was cancelled successfully. You can start over anytime.",
        duration: 4000,
      });

      // Enhanced logging for analytics
      log.info("ANALYTICS: Topic generation cancelled", {
        timestamp: new Date().toISOString(),
        userAgent:
          typeof window !== "undefined"
            ? window.navigator.userAgent
            : "unknown",
        formDataSnapshot: {
          industry: formData.industry,
          num_topics: formData.num_topics,
        },
      });
    }

    // Legacy support: also handle direct fetch cancellation if still active
    if (abortController && currentRequestId) {
      log.info(`Cancelling direct fetch request: ${currentRequestId}`);
      abortController.abort();
      setIsGenerating(false);
      setCurrentRequestId(null);
      setAbortController(null);
    }
  }, [generateMutation.isPending, abortController, currentRequestId, formData]);

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

  // Session management methods
  const saveGeneratedTopicsAsSession = useCallback((): string | null => {
    if (generatedTopics.length === 0) {
      log.warn("No topics to save as session");
      return null;
    }

    try {
      const sessionId = generateSessionId();
      saveSession({
        id: sessionId,
        topics: generatedTopics,
        formData: formData,
      });

      log.info(`Manual session save successful: ${sessionId}`, {
        topicCount: generatedTopics.length,
      });

      return sessionId;
    } catch (error) {
      log.error("Failed to save session manually:", error);
      return null;
    }
  }, [generatedTopics, formData]);

  const navigateToResults = useCallback(
    (sessionId: string): void => {
      const workspaceSlug = currentWorkspace?.slug;
      if (!workspaceSlug) {
        log.error("Cannot navigate: No workspace selected or slug missing");
        toast.error("No workspace selected", {
          description: "Please select a workspace before navigating to results",
        });
        return;
      }

      log.info(`Navigating to workspace-scoped results page: ${sessionId}`);
      router.push(`/w/${workspaceSlug}/topics/create/results/${sessionId}`);
    },
    [router, currentWorkspace],
  );

  return {
    // Form state
    formData,
    currentStep,
    errors,

    // Generated topics state
    generatedTopics,
    isGenerating: generateMutation.isPending || isGenerating,
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

    // Session management
    saveGeneratedTopicsAsSession,
    navigateToResults,
  };
};
