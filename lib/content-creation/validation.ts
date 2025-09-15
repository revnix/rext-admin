/**
 * Content Creation Wizard Validation System
 *
 * This module provides comprehensive validation logic for the content creation wizard,
 * including field-level validation, step validation, and error aggregation.
 */

import type {
  ContentCreationFormData,
  PartialContentCreationFormData,
  WizardField,
  WizardStep,
} from "@/types/content-creation";

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Field validation result with field-specific information
 */
export interface FieldValidationResult extends ValidationResult {
  fieldId: string;
  severity: "error" | "warning";
}

/**
 * Step validation result with step-level information
 */
export interface StepValidationResult extends ValidationResult {
  stepId: string;
  fieldErrors: Record<string, string[]>;
  completionPercentage: number;
  requiredFieldsMissing: string[];
}

/**
 * Complete wizard validation result
 */
export interface WizardValidationResult extends ValidationResult {
  steps: StepValidationResult[];
  overallCompletion: number;
  readyForSubmission: boolean;
  readyForDraft: boolean;
  criticalErrors: string[];
}

/**
 * Validation rule function type
 */
export type ValidationRule<T = any> = (
  value: T,
  formData: PartialContentCreationFormData,
  field?: WizardField,
) => ValidationResult;

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Common validation rules
 */
export const ValidationRules = {
  // Required field validation
  required: (message = "This field is required"): ValidationRule => {
    return (value) => ({
      isValid: value !== null && value !== undefined && value !== "",
      errors:
        value !== null && value !== undefined && value !== "" ? [] : [message],
    });
  },

  // Minimum length validation
  minLength: (min: number, message?: string): ValidationRule<string> => {
    return (value) => {
      const actualMessage = message || `Minimum ${min} characters required`;
      const isValid = !value || value.length >= min;
      return {
        isValid,
        errors: isValid ? [] : [actualMessage],
      };
    };
  },

  // Maximum length validation
  maxLength: (max: number, message?: string): ValidationRule<string> => {
    return (value) => {
      const actualMessage = message || `Maximum ${max} characters allowed`;
      const isValid = !value || value.length <= max;
      return {
        isValid,
        errors: isValid ? [] : [actualMessage],
      };
    };
  },

  // Array minimum items validation
  minItems: (min: number, itemName = "items"): ValidationRule<any[]> => {
    return (value) => ({
      isValid: !value || value.length >= min,
      errors:
        !value || value.length >= min
          ? []
          : [`At least ${min} ${itemName} required`],
    });
  },

  // Array maximum items validation
  maxItems: (max: number, itemName = "items"): ValidationRule<any[]> => {
    return (value) => ({
      isValid: !value || value.length <= max,
      errors:
        !value || value.length <= max
          ? []
          : [`Maximum ${max} ${itemName} allowed`],
    });
  },

  // Email validation
  email: (message = "Invalid email address"): ValidationRule<string> => {
    return (value) => {
      if (!value) return { isValid: true, errors: [] };
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: emailRegex.test(value),
        errors: emailRegex.test(value) ? [] : [message],
      };
    };
  },

  // URL validation
  url: (message = "Invalid URL"): ValidationRule<string> => {
    return (value) => {
      if (!value) return { isValid: true, errors: [] };
      try {
        new URL(value);
        return { isValid: true, errors: [] };
      } catch {
        return { isValid: false, errors: [message] };
      }
    };
  },

  // Custom validation function
  custom: (
    validatorFn: (
      value: any,
      formData: PartialContentCreationFormData,
    ) => ValidationResult,
  ): ValidationRule => {
    return validatorFn;
  },
};

// ============================================================================
// FIELD-SPECIFIC VALIDATION SCHEMAS
// ============================================================================

/**
 * Validation schema for each field in the content creation wizard
 */
export const FIELD_VALIDATION_SCHEMAS: Record<
  keyof ContentCreationFormData,
  ValidationRule[]
> = {
  // Step 1: Topic & Content
  topicId: [ValidationRules.required("Please select a topic")],
  platform: [ValidationRules.required("Please select a platform")],
  contentType: [ValidationRules.required("Please select a content type")],
  industry: [ValidationRules.required("Please select an industry")],

  // Step 2: Audience & Goals
  audienceSize: [ValidationRules.required("Please select audience size")],
  audienceType: [
    ValidationRules.required("Please select at least one audience type"),
    ValidationRules.minItems(1, "audience types"),
    ValidationRules.maxItems(3, "audience types"),
  ],
  readingLevel: [ValidationRules.required("Please select a reading level")],
  goals: [
    ValidationRules.required("Please select at least one goal"),
    ValidationRules.minItems(1, "goals"),
    ValidationRules.maxItems(4, "goals"),
  ],

  // Step 3: Voice & Style
  tone: [
    ValidationRules.required("Please select at least one tone"),
    ValidationRules.minItems(1, "tones"),
    ValidationRules.maxItems(3, "tones"),
  ],
  region: [ValidationRules.required("Please select a target region")],
  language: [ValidationRules.required("Please select a language")],

  // Step 4: Content Structure
  contentLength: [
    ValidationRules.required("Please select content length"),
    ValidationRules.custom((value, _formData) => {
      if (!value)
        return { isValid: false, errors: ["Content length is required"] };

      if (value.type === "custom") {
        if (!value.custom?.value || value.custom.value <= 0) {
          return {
            isValid: false,
            errors: ["Custom length must be greater than 0"],
          };
        }
        if (value.custom.value > 50000) {
          return {
            isValid: false,
            errors: ["Custom length cannot exceed 50,000 words"],
            warnings: [
              "Very long content may take significant time to generate",
            ],
          };
        }
      }

      return { isValid: true, errors: [] };
    }),
  ],
  primaryKeywords: [
    ValidationRules.maxItems(10, "keywords"),
    ValidationRules.custom((value) => {
      if (!value || value.length === 0) {
        return {
          isValid: true,
          errors: [],
          warnings: [
            "Adding keywords helps optimize content for search engines",
          ],
        };
      }

      // Check for very short keywords
      const shortKeywords = value.filter(
        (keyword: string) => keyword.length < 2,
      );
      if (shortKeywords.length > 0) {
        return {
          isValid: false,
          errors: ["Keywords must be at least 2 characters long"],
        };
      }

      // Check for very long keywords
      const longKeywords = value.filter(
        (keyword: string) => keyword.length > 100,
      );
      if (longKeywords.length > 0) {
        return {
          isValid: false,
          errors: ["Keywords cannot exceed 100 characters"],
        };
      }

      return { isValid: true, errors: [] };
    }),
  ],
  searchIntent: [ValidationRules.maxItems(5, "search intents")],
  includeTOC: [],
  includeSummary: [],
  includeCTA: [],
  includeKeyTakeaways: [],

  // Step 5: Research Settings
  researchLevel: [ValidationRules.required("Please select a research level")],
  includeLatestInfo: [],
  includeExamples: [],
  factChecking: [ValidationRules.required("Please select fact checking level")],
  contentFreshness: [
    ValidationRules.required("Please select content freshness requirement"),
  ],
  includeStatistics: [],
  includeQuotes: [],
  competitorAnalysis: [],

  // Step 6: Human Review
  enableHumansInLoop: [],
  humanReviewers: [
    ValidationRules.custom((value, formData) => {
      if (formData.enableHumansInLoop) {
        if (!value || value.length === 0) {
          return {
            isValid: false,
            errors: [
              "Please select at least one reviewer when human review is enabled",
            ],
          };
        }
        if (value.length > 3) {
          return { isValid: false, errors: ["Maximum 3 reviewers allowed"] };
        }
      }
      return { isValid: true, errors: [] };
    }),
  ],

  // Auto-handled fields
  projectId: [],
  flowName: [],
  format: [],
  includeFrontMatter: [],
};

// ============================================================================
// VALIDATION ENGINE
// ============================================================================

/**
 * Content Creation Wizard Validation Engine
 */
export class ContentCreationValidator {
  /**
   * Validate a single field
   */
  static validateField(
    fieldId: keyof ContentCreationFormData,
    value: any,
    formData: PartialContentCreationFormData,
    field?: WizardField,
  ): FieldValidationResult {
    const rules = FIELD_VALIDATION_SCHEMAS[fieldId] || [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let isValid = true;

    for (const rule of rules) {
      try {
        const result = rule(value, formData, field);
        if (!result.isValid) {
          isValid = false;
          errors.push(...result.errors);
        }
        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      } catch (error) {
        console.error(`Validation error for field ${fieldId}:`, error);
        isValid = false;
        errors.push("Validation error occurred");
      }
    }

    return {
      fieldId,
      isValid,
      errors,
      warnings,
      severity: errors.length > 0 ? "error" : "warning",
    };
  }

  /**
   * Validate all fields in a step
   */
  static validateStep(
    step: WizardStep,
    formData: PartialContentCreationFormData,
    visibleFields?: WizardField[],
  ): StepValidationResult {
    const fieldsToValidate = visibleFields || step.fields;
    const fieldErrors: Record<string, string[]> = {};
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    let validFieldCount = 0;

    for (const field of fieldsToValidate) {
      const fieldResult = ContentCreationValidator.validateField(
        field.id as keyof ContentCreationFormData,
        formData[field.id as keyof ContentCreationFormData],
        formData,
        field,
      );

      if (fieldResult.errors.length > 0) {
        fieldErrors[field.id] = fieldResult.errors;
        allErrors.push(...fieldResult.errors);
      } else {
        validFieldCount++;
      }

      if (fieldResult.warnings) {
        allWarnings.push(...fieldResult.warnings);
      }
    }

    const completionPercentage =
      fieldsToValidate.length > 0
        ? Math.round((validFieldCount / fieldsToValidate.length) * 100)
        : 100;

    const requiredFieldsMissing = fieldsToValidate
      .filter((field) => field.required !== false)
      .filter((field) => {
        const value = formData[field.id as keyof ContentCreationFormData];
        return (
          value === null ||
          value === undefined ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        );
      })
      .map((field) => field.id);

    return {
      stepId: step.id,
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      fieldErrors,
      completionPercentage,
      requiredFieldsMissing,
    };
  }

  /**
   * Validate the entire wizard
   */
  static validateWizard(
    steps: WizardStep[],
    formData: PartialContentCreationFormData,
    getVisibleFields?: (step: WizardStep) => WizardField[],
  ): WizardValidationResult {
    const stepResults: StepValidationResult[] = [];
    const allErrors: string[] = [];
    const criticalErrors: string[] = [];
    let totalValidFields = 0;
    let totalFields = 0;

    for (const step of steps) {
      const visibleFields = getVisibleFields
        ? getVisibleFields(step)
        : step.fields;
      const stepResult = ContentCreationValidator.validateStep(
        step,
        formData,
        visibleFields,
      );

      stepResults.push(stepResult);
      allErrors.push(...stepResult.errors);

      // Add critical errors (required fields in early steps)
      if (["topic-content", "audience-goals"].includes(step.id)) {
        criticalErrors.push(...stepResult.errors);
      }

      totalFields += visibleFields.length;
      totalValidFields += Math.round(
        (stepResult.completionPercentage / 100) * visibleFields.length,
      );
    }

    const overallCompletion =
      totalFields > 0
        ? Math.round((totalValidFields / totalFields) * 100)
        : 100;
    const readyForDraft =
      overallCompletion >= 60 && criticalErrors.length === 0;
    const readyForSubmission =
      overallCompletion >= 90 && allErrors.length === 0;

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      steps: stepResults,
      overallCompletion,
      readyForSubmission,
      readyForDraft,
      criticalErrors,
    };
  }

  /**
   * Get user-friendly error messages for a field
   */
  static getFieldErrorMessage(
    _fieldId: keyof ContentCreationFormData,
    errors: string[],
  ): string {
    if (errors.length === 0) return "";
    if (errors.length === 1) return errors[0];
    return `${errors[0]} (${errors.length - 1} more issues)`;
  }

  /**
   * Check if wizard step can be completed
   */
  static canCompleteStep(
    step: WizardStep,
    formData: PartialContentCreationFormData,
    visibleFields?: WizardField[],
  ): boolean {
    const stepResult = ContentCreationValidator.validateStep(
      step,
      formData,
      visibleFields,
    );
    return (
      stepResult.completionPercentage >= 80 &&
      stepResult.requiredFieldsMissing.length === 0
    );
  }

  /**
   * Get next incomplete step
   */
  static getNextIncompleteStep(
    steps: WizardStep[],
    formData: PartialContentCreationFormData,
    getVisibleFields?: (step: WizardStep) => WizardField[],
  ): WizardStep | null {
    for (const step of steps) {
      const visibleFields = getVisibleFields
        ? getVisibleFields(step)
        : step.fields;
      const stepResult = ContentCreationValidator.validateStep(
        step,
        formData,
        visibleFields,
      );

      if (
        stepResult.completionPercentage < 80 ||
        stepResult.requiredFieldsMissing.length > 0
      ) {
        return step;
      }
    }
    return null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Combine multiple validation results
 */
export function combineValidationResults(
  ...results: ValidationResult[]
): ValidationResult {
  const allErrors = results.flatMap((r) => r.errors);
  const allWarnings = results.flatMap((r) => r.warnings || []);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
  };
}

/**
 * Create a debounced validation function
 */
export function createDebouncedValidator<T extends (...args: any[]) => any>(
  validatorFn: T,
  delay = 300,
): T {
  let timeoutId: NodeJS.Timeout;

  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    return new Promise<ReturnType<T>>((resolve) => {
      timeoutId = setTimeout(() => {
        resolve(validatorFn(...args));
      }, delay);
    });
  }) as T;
}
