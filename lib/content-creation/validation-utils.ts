/**
 * Validation Utilities for Content Creation Wizard
 *
 * This module provides utility functions and hooks for integrating
 * the comprehensive validation system with React components.
 */

import { useMemo } from "react";
import type {
  ContentCreationFormData,
  PartialContentCreationFormData,
  WizardField,
} from "@/types/content-creation";
import type { FormFieldValue } from "@/types/shared";
import { validateField } from "./validation";

// ============================================================================
// VALIDATION HOOK
// ============================================================================

/**
 * Hook for real-time field validation
 */
export function useFieldValidation(
  field: WizardField,
  value: FormFieldValue,
  formData: PartialContentCreationFormData,
  isTouched: boolean = false,
) {
  const validationResult = useMemo(() => {
    return validateField(
      field.id as keyof ContentCreationFormData,
      value,
      formData,
      field,
    );
  }, [field, value, formData]);

  const shouldShowError = isTouched && !validationResult.isValid;
  const shouldShowWarning =
    isTouched &&
    validationResult.warnings &&
    validationResult.warnings.length > 0;

  return {
    isValid: validationResult.isValid,
    errors: validationResult.errors,
    warnings: validationResult.warnings || [],
    shouldShowError,
    shouldShowWarning,
    errorMessage: shouldShowError ? validationResult.errors[0] : undefined,
    warningMessage: shouldShowWarning
      ? validationResult.warnings?.[0]
      : undefined,
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Get validation state classes for styling components
 */
export function getValidationClasses(
  isValid: boolean,
  isTouched: boolean,
  hasWarnings: boolean = false,
): string {
  if (!isTouched) return "";

  if (!isValid) {
    return "border-red-300 focus:border-red-500 focus:ring-red-200";
  }

  if (hasWarnings) {
    return "border-yellow-300 focus:border-yellow-500 focus:ring-yellow-200";
  }

  return "border-green-300 focus:border-green-500 focus:ring-green-200";
}

/**
 * Get validation icon for visual feedback
 */
export function getValidationIcon(
  isValid: boolean,
  isTouched: boolean,
  hasWarnings: boolean = false,
): { icon: string; color: string } | null {
  if (!isTouched) return null;

  if (!isValid) {
    return { icon: "❌", color: "text-red-500" };
  }

  if (hasWarnings) {
    return { icon: "⚠️", color: "text-yellow-500" };
  }

  return { icon: "✅", color: "text-green-500" };
}

/**
 * Format validation message for display
 */
export function formatValidationMessage(
  errors: string[],
  warnings: string[] = [],
  showAllErrors: boolean = false,
): string {
  if (errors.length > 0) {
    if (showAllErrors) {
      return errors.join(", ");
    }
    return errors.length > 1
      ? `${errors[0]} (${errors.length - 1} more issues)`
      : errors[0];
  }

  if (warnings.length > 0) {
    return warnings[0];
  }

  return "";
}

/**
 * Get field completion status for progress tracking
 */
export function getFieldCompletionStatus(
  field: WizardField,
  value: FormFieldValue,
  formData: PartialContentCreationFormData,
): {
  isComplete: boolean;
  isValid: boolean;
  completionPercentage: number;
} {
  const validationResult = validateField(
    field.id as keyof ContentCreationFormData,
    value,
    formData,
    field,
  );

  const hasValue =
    value !== null &&
    value !== undefined &&
    value !== "" &&
    (!Array.isArray(value) || value.length > 0);

  const isComplete = hasValue && validationResult.isValid;

  let completionPercentage = 0;
  if (hasValue) {
    completionPercentage = validationResult.isValid ? 100 : 75;
  } else if (field.required) {
    completionPercentage = 0;
  } else {
    completionPercentage = 50; // Optional field with no value
  }

  return {
    isComplete,
    isValid: validationResult.isValid,
    completionPercentage,
  };
}

// ============================================================================
// VALIDATION COMPONENTS HELPERS
// ============================================================================

/**
 * Create validation props for input components
 */
export function createValidationProps(
  field: WizardField,
  value: FormFieldValue,
  formData: PartialContentCreationFormData,
  isTouched: boolean = false,
) {
  const validation = useFieldValidation(field, value, formData, isTouched);

  return {
    "aria-invalid": validation.shouldShowError,
    "aria-describedby":
      validation.shouldShowError || validation.shouldShowWarning
        ? `${field.id}-validation`
        : undefined,
    className: getValidationClasses(
      validation.isValid,
      isTouched,
      validation.shouldShowWarning,
    ),
    ...validation,
  };
}

/**
 * Get validation summary for a group of fields
 */
export function getFieldGroupValidationSummary(
  fields: WizardField[],
  formData: PartialContentCreationFormData,
  touchedFields: Record<string, boolean> = {},
): {
  totalFields: number;
  validFields: number;
  invalidFields: number;
  warningFields: number;
  completionPercentage: number;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
} {
  const errors: Array<{ field: string; message: string }> = [];
  const warnings: Array<{ field: string; message: string }> = [];
  let validFields = 0;
  let warningFields = 0;

  fields.forEach((field) => {
    const value = formData[field.id as keyof PartialContentCreationFormData];
    const validationResult = validateField(
      field.id as keyof ContentCreationFormData,
      value,
      formData,
      field,
    );

    if (validationResult.isValid) {
      validFields++;
    } else if (touchedFields[field.id]) {
      errors.push({
        field: field.id,
        message: validationResult.errors[0] || "Invalid value",
      });
    }

    if (validationResult.warnings && validationResult.warnings.length > 0) {
      warningFields++;
      if (touchedFields[field.id]) {
        warnings.push({
          field: field.id,
          message: validationResult.warnings[0],
        });
      }
    }
  });

  return {
    totalFields: fields.length,
    validFields,
    invalidFields: fields.length - validFields,
    warningFields,
    completionPercentage:
      fields.length > 0 ? Math.round((validFields / fields.length) * 100) : 100,
    errors,
    warnings,
  };
}

// ============================================================================
// VALIDATION MESSAGE COMPONENTS
// ============================================================================

/**
 * Props for validation message component
 */
export interface ValidationMessageProps {
  fieldId: string;
  errors: string[];
  warnings: string[];
  showIcon?: boolean;
  className?: string;
}

/**
 * Validation message component data
 */
export function getValidationMessageData(
  errors: string[],
  warnings: string[] = [],
  showIcon: boolean = true,
): {
  hasMessage: boolean;
  message: string;
  type: "error" | "warning" | "none";
  icon: string | null;
  className: string;
} {
  if (errors.length > 0) {
    return {
      hasMessage: true,
      message: formatValidationMessage(errors),
      type: "error",
      icon: showIcon ? "❌" : null,
      className: "text-red-600 text-sm mt-1",
    };
  }

  if (warnings.length > 0) {
    return {
      hasMessage: true,
      message: formatValidationMessage([], warnings),
      type: "warning",
      icon: showIcon ? "⚠️" : null,
      className: "text-yellow-600 text-sm mt-1",
    };
  }

  return {
    hasMessage: false,
    message: "",
    type: "none",
    icon: null,
    className: "",
  };
}

// ============================================================================
// DEBOUNCED VALIDATION
// ============================================================================

/**
 * Hook for debounced validation (useful for expensive validations)
 */
export function useDebouncedValidation(
  field: WizardField,
  value: FormFieldValue,
  formData: PartialContentCreationFormData,
  isTouched: boolean = false,
  delay: number = 300,
) {
  const _debouncedValidation = useMemo(() => {
    const timeoutId = setTimeout(() => {
      return validateField(
        field.id as keyof ContentCreationFormData,
        value,
        formData,
        field,
      );
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [field, value, formData, delay]);

  return useFieldValidation(field, value, formData, isTouched);
}

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

/**
 * Common validation patterns and messages
 */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  KEYWORD: /^[a-zA-Z0-9\s-_]+$/,
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: "This field is required",
  EMAIL: "Please enter a valid email address",
  URL: "Please enter a valid URL",
  MIN_LENGTH: (min: number) => `Minimum ${min} characters required`,
  MAX_LENGTH: (max: number) => `Maximum ${max} characters allowed`,
  MIN_ITEMS: (min: number, item: string = "items") =>
    `At least ${min} ${item} required`,
  MAX_ITEMS: (max: number, item: string = "items") =>
    `Maximum ${max} ${item} allowed`,
} as const;
