/**
 * Wizard Dependency Engine
 *
 * This module provides a comprehensive dependency engine for handling conditional
 * field logic in the content creation wizard, including visibility, option filtering,
 * value suggestions, and validation.
 */

import { log } from "@/lib/logger";
import type {
  ContentCreationFormData,
  FieldDependency,
  PartialContentCreationFormData,
  WizardField,
  WizardStep,
} from "@/types/content-creation";
import type { FormFieldValue, SelectOption } from "@/types/shared";
import {
  canCompleteStep,
  getNextIncompleteStep,
  validateField,
  validateStep,
  validateWizard,
} from "./validation";

// ============================================================================
// DEPENDENCY ENGINE CLASS
// ============================================================================

/**
 * Core dependency engine for wizard field interactions
 */
export class WizardDependencyEngine {
  private formData: PartialContentCreationFormData;
  private steps: WizardStep[];

  constructor(
    steps: WizardStep[],
    initialFormData: PartialContentCreationFormData = {},
  ) {
    this.steps = steps;
    this.formData = { ...initialFormData };
  }

  /**
   * Update the form data used for dependency calculations
   */
  updateFormData(newFormData: PartialContentCreationFormData): void {
    this.formData = { ...newFormData };
  }

  /**
   * Get current form data
   */
  getFormData(): PartialContentCreationFormData {
    return { ...this.formData };
  }

  // ========================================================================
  // FIELD VISIBILITY LOGIC
  // ========================================================================

  /**
   * Determine if a field should be visible based on current form state
   */
  isFieldVisible(field: WizardField): boolean {
    // If field has custom visibility function, use it
    if (field.visible && typeof field.visible === "function") {
      try {
        return field.visible(this.formData);
      } catch (error) {
        log.warn(`Error in visibility function for field ${field.id}:`, error);
        return true; // Default to visible on error
      }
    }

    // If field has dependencies, evaluate them
    if (field.dependsOn && field.dependsOn.length > 0) {
      return this.evaluateDependencies(field.dependsOn);
    }

    // Default to visible
    return true;
  }

  /**
   * Get all visible fields for a step
   */
  getVisibleFields(step: WizardStep): WizardField[] {
    return step.fields.filter((field) => this.isFieldVisible(field));
  }

  /**
   * Get progressively visible fields for a step
   * Shows fields one by one as previous required fields are completed
   */
  getProgressivelyVisibleFields(step: WizardStep): WizardField[] {
    const allVisibleFields = this.getVisibleFields(step);
    const requiredFields = allVisibleFields.filter((field) => field.required);
    const optionalFields = allVisibleFields.filter((field) => !field.required);

    const progressiveFields: WizardField[] = [];

    // Always show the first required field (like topic selection)
    if (requiredFields.length > 0) {
      progressiveFields.push(requiredFields[0]);

      // Process remaining required fields progressively
      for (let i = 1; i < requiredFields.length; i++) {
        const previousField = requiredFields[i - 1];

        // Only show this field if the previous field is filled
        if (!this.isValueEmpty(this.formData[previousField.id])) {
          const field = requiredFields[i];
          progressiveFields.push(field);

          // If this field is not filled, stop here
          if (this.isValueEmpty(this.formData[field.id])) {
            break;
          }
        } else {
          break;
        }
      }
    }

    // If all required fields are completed, show all optional fields
    const allRequiredCompleted = requiredFields.every(
      (field) => !this.isValueEmpty(this.formData[field.id]),
    );

    if (allRequiredCompleted) {
      progressiveFields.push(...optionalFields);
    }

    return progressiveFields;
  }

  /**
   * Check if there are more fields to reveal in progressive disclosure
   */
  hasMoreFieldsToReveal(step: WizardStep): boolean {
    const allVisible = this.getVisibleFields(step).length;
    const progressive = this.getProgressivelyVisibleFields(step).length;
    return progressive < allVisible;
  }

  /**
   * Get the next field that will be revealed in progressive disclosure
   */
  getNextFieldToReveal(step: WizardStep): WizardField | null {
    const allVisible = this.getVisibleFields(step);
    const progressive = this.getProgressivelyVisibleFields(step);

    if (progressive.length >= allVisible.length) {
      return null;
    }

    // Find the next field that's not yet progressively visible
    return (
      allVisible.find(
        (field) => !progressive.some((progField) => progField.id === field.id),
      ) || null
    );
  }

  /**
   * Get all visible fields across all steps
   */
  getAllVisibleFields(): WizardField[] {
    return this.steps.flatMap((step) => this.getVisibleFields(step));
  }

  // ========================================================================
  // OPTION FILTERING LOGIC
  // ========================================================================

  /**
   * Get filtered options for a field based on current form state
   */
  getFieldOptions(field: WizardField): SelectOption[] {
    // If field has function-based options, call it with current form data
    if (typeof field.options === "function") {
      try {
        return field.options(this.formData);
      } catch (error) {
        log.warn(`Error in options function for field ${field.id}:`, error);
        return [];
      }
    }

    // If field has static options, return them
    if (Array.isArray(field.options)) {
      return field.options;
    }

    // No options defined
    return [];
  }

  /**
   * Get suggested values for a field based on dependencies
   */
  getSuggestedValues(field: WizardField): FormFieldValue[] {
    if (!field.dependsOn) return [];

    const suggestions: FormFieldValue[] = [];

    for (const dependency of field.dependsOn) {
      if (dependency.action === "suggest-values") {
        const dependentValue = this.formData[dependency.field];
        if (
          dependentValue &&
          typeof dependentValue === "string" &&
          dependency.values.includes(dependentValue)
        ) {
          // Add logic for specific suggestions based on field combinations
          const fieldSuggestions = this.calculateSuggestions(
            field,
            dependency,
            dependentValue,
          );
          suggestions.push(...fieldSuggestions);
        }
      }
    }

    return [...new Set(suggestions)]; // Remove duplicates
  }

  // ========================================================================
  // VALIDATION LOGIC
  // ========================================================================

  /**
   * Validate a single field using the comprehensive validation system
   */
  validateField(field: WizardField): {
    isValid: boolean;
    error?: string;
    warnings?: string[];
  } {
    // Check if field is visible first
    if (!this.isFieldVisible(field)) {
      return { isValid: true }; // Hidden fields are always valid
    }

    const value = this.formData[field.id];
    const validationResult = validateField(
      field.id as keyof ContentCreationFormData,
      value,
      this.formData,
      field,
    );

    return {
      isValid: validationResult.isValid,
      error:
        validationResult.errors.length > 0
          ? validationResult.errors[0]
          : undefined,
      warnings: validationResult.warnings,
    };
  }

  /**
   * Validate all visible fields in a step using the comprehensive validation system
   */
  validateStep(step: WizardStep): {
    isValid: boolean;
    errors: Record<string, string>;
    warnings?: Record<string, string[]>;
    completionPercentage: number;
  } {
    const visibleFields = this.getVisibleFields(step);
    const stepValidationResult = validateStep(
      step,
      this.formData,
      visibleFields,
    );

    // Convert field errors to the format expected by the UI
    const errors: Record<string, string> = {};
    const warnings: Record<string, string[]> = {};

    Object.entries(stepValidationResult.fieldErrors).forEach(
      ([fieldId, fieldErrors]) => {
        if (fieldErrors.length > 0) {
          errors[fieldId] = fieldErrors[0]; // Show first error
        }
      },
    );

    // Get warnings for each field
    for (const field of visibleFields) {
      const fieldValidation = this.validateField(field);
      if (fieldValidation.warnings && fieldValidation.warnings.length > 0) {
        warnings[field.id] = fieldValidation.warnings;
      }
    }

    return {
      isValid: stepValidationResult.isValid,
      errors,
      warnings: Object.keys(warnings).length > 0 ? warnings : undefined,
      completionPercentage: stepValidationResult.completionPercentage,
    };
  }

  /**
   * Validate all steps using the comprehensive validation system
   */
  validateAll(): {
    isValid: boolean;
    errors: Record<string, string>;
    warnings?: Record<string, string[]>;
    stepResults: Record<
      string,
      { isValid: boolean; completionPercentage: number }
    >;
    overallCompletion: number;
    readyForDraft: boolean;
    readyForSubmission: boolean;
  } {
    const wizardValidationResult = validateWizard(
      this.steps,
      this.formData,
      (step) => this.getVisibleFields(step),
    );

    // Convert to the format expected by the UI
    const errors: Record<string, string> = {};
    const warnings: Record<string, string[]> = {};
    const stepResults: Record<
      string,
      { isValid: boolean; completionPercentage: number }
    > = {};

    wizardValidationResult.steps.forEach((stepResult) => {
      stepResults[stepResult.stepId] = {
        isValid: stepResult.isValid,
        completionPercentage: stepResult.completionPercentage,
      };

      // Merge field errors
      Object.entries(stepResult.fieldErrors).forEach(
        ([fieldId, fieldErrors]) => {
          if (fieldErrors.length > 0) {
            errors[fieldId] = fieldErrors[0];
          }
        },
      );
    });

    // Get warnings from individual field validations
    for (const step of this.steps) {
      const visibleFields = this.getVisibleFields(step);
      for (const field of visibleFields) {
        const fieldValidation = this.validateField(field);
        if (fieldValidation.warnings && fieldValidation.warnings.length > 0) {
          warnings[field.id] = fieldValidation.warnings;
        }
      }
    }

    return {
      isValid: wizardValidationResult.isValid,
      errors,
      warnings: Object.keys(warnings).length > 0 ? warnings : undefined,
      stepResults,
      overallCompletion: wizardValidationResult.overallCompletion,
      readyForDraft: wizardValidationResult.readyForDraft,
      readyForSubmission: wizardValidationResult.readyForSubmission,
    };
  }

  // ========================================================================
  // PROGRESS TRACKING
  // ========================================================================

  /**
   * Calculate completion percentage for the wizard
   */
  calculateProgress(): {
    completionPercentage: number;
    completedFields: number;
    totalFields: number;
    requiredFieldsCompleted: number;
    totalRequiredFields: number;
  } {
    const visibleFields = this.getAllVisibleFields();
    const requiredFields = visibleFields.filter((field) => field.required);

    const completedFields = visibleFields.filter(
      (field) => !this.isValueEmpty(this.formData[field.id]),
    );

    const completedRequiredFields = requiredFields.filter(
      (field) => !this.isValueEmpty(this.formData[field.id]),
    );

    const completionPercentage =
      visibleFields.length > 0
        ? Math.round((completedFields.length / visibleFields.length) * 100)
        : 0;

    return {
      completionPercentage,
      completedFields: completedFields.length,
      totalFields: visibleFields.length,
      requiredFieldsCompleted: completedRequiredFields.length,
      totalRequiredFields: requiredFields.length,
    };
  }

  /**
   * Get step completion status for each step
   */
  getStepCompletionStatus(): Record<
    string,
    { completed: boolean; progress: number; errors: string[] }
  > {
    const status: Record<
      string,
      { completed: boolean; progress: number; errors: string[] }
    > = {};

    for (const step of this.steps) {
      const visibleFields = this.getVisibleFields(step);
      const requiredFields = visibleFields.filter((field) => field.required);
      const completedRequired = requiredFields.filter(
        (field) => !this.isValueEmpty(this.formData[field.id]),
      );

      const validation = this.validateStep(step);
      const progress =
        requiredFields.length > 0
          ? Math.round((completedRequired.length / requiredFields.length) * 100)
          : 100;

      status[step.id] = {
        completed:
          validation.isValid &&
          completedRequired.length === requiredFields.length,
        progress,
        errors: Object.values(validation.errors),
      };
    }

    return status;
  }

  // ========================================================================
  // SMART SUGGESTIONS
  // ========================================================================

  /**
   * Get smart default values for fields based on current form state
   */
  getSmartDefaults(field: WizardField): FormFieldValue | undefined {
    // Return existing value if present
    const existingValue = this.formData[field.id];
    if (!this.isValueEmpty(existingValue)) {
      return existingValue;
    }

    // Use field's default value
    if (field.defaultValue !== undefined) {
      return field.defaultValue;
    }

    // Calculate smart defaults based on other fields
    return this.calculateSmartDefault(field);
  }

  /**
   * Get next recommended field to complete
   */
  getNextRecommendedField(): WizardField | null {
    // Find first incomplete required field
    for (const step of this.steps) {
      const visibleFields = this.getVisibleFields(step);
      const requiredFields = visibleFields.filter((field) => field.required);

      for (const field of requiredFields) {
        if (this.isValueEmpty(this.formData[field.id])) {
          return field;
        }
      }
    }

    // If all required fields are complete, find first incomplete optional field
    for (const step of this.steps) {
      const visibleFields = this.getVisibleFields(step);

      for (const field of visibleFields) {
        if (!field.required && this.isValueEmpty(this.formData[field.id])) {
          return field;
        }
      }
    }

    return null;
  }

  // ========================================================================
  // PRIVATE HELPER METHODS
  // ========================================================================

  /**
   * Evaluate field dependencies to determine if conditions are met
   */
  private evaluateDependencies(dependencies: FieldDependency[]): boolean {
    // All dependencies must be satisfied (AND logic)
    return dependencies.every((dependency) => {
      const dependentValue = this.formData[dependency.field];

      if (dependency.values.length === 0) {
        // Empty values array means any non-empty value satisfies
        return !this.isValueEmpty(dependentValue);
      }

      // Check if dependent value matches any of the required values
      if (Array.isArray(dependentValue)) {
        return dependency.values.some(
          (val) => typeof val === "string" && dependentValue.includes(val),
        );
      }

      return (
        typeof dependentValue === "string" &&
        dependency.values.includes(dependentValue)
      );
    });
  }

  /**
   * Calculate suggestions for a field based on specific dependency
   */
  private calculateSuggestions(
    field: WizardField,
    dependency: FieldDependency,
    dependentValue: FormFieldValue,
  ): FormFieldValue[] {
    const suggestions: FormFieldValue[] = [];

    // Field-specific suggestion logic
    switch (field.id) {
      case "tone":
        if (
          dependency.field === "audienceType" &&
          Array.isArray(dependentValue)
        ) {
          const audienceTypes = dependentValue as string[];
          if (audienceTypes.includes("Enterprises")) {
            suggestions.push("Professional", "Technical");
          }
          if (
            audienceTypes.includes("Students") ||
            audienceTypes.includes("Teens")
          ) {
            suggestions.push("Casual", "Friendly");
          }
          if (audienceTypes.includes("Seniors")) {
            suggestions.push("Simple", "Friendly");
          }
        }
        break;

      case "contentLength":
        if (dependency.field === "contentType") {
          // Default to medium for most content types
          suggestions.push({ type: "preset", preset: "Medium" });
        }
        break;

      case "primaryKeywords":
        // Could suggest keywords based on topic/industry
        // This would typically come from an API
        break;
    }

    return suggestions;
  }

  /**
   * Calculate smart default value for a field
   */
  private calculateSmartDefault(
    field: WizardField,
  ): FormFieldValue | undefined {
    switch (field.id) {
      case "contentType":
        // Default based on platform
        if (this.formData.platform === "Social Media") {
          return "Thread";
        }
        return "Article";

      case "audienceSize":
        return "Medium";

      case "readingLevel":
        // Base on audience type
        if (this.formData.audienceType?.includes("Enterprises")) {
          return "Advanced";
        }
        if (this.formData.audienceType?.includes("Students")) {
          return "Beginner";
        }
        return "Intermediate";

      case "region":
        return "International/Global";

      case "language":
        return "English";

      case "researchLevel":
        return "Comprehensive";

      case "factChecking":
        return "Standard";

      case "contentFreshness":
        return "Recent (6 months)";

      default:
        return undefined;
    }
  }

  /**
   * Check if a value is considered empty
   */
  private isValueEmpty(value: FormFieldValue): boolean {
    if (value === null || value === undefined || value === "") {
      return true;
    }

    if (Array.isArray(value) && value.length === 0) {
      return true;
    }

    return false;
  }

  /**
   * Get detailed validation information for a field
   * This method provides additional context beyond the core validation
   */
  getFieldValidationDetails(field: WizardField): {
    isValid: boolean;
    error?: string;
    warnings?: string[];
    suggestions?: string[];
    canProceed: boolean;
  } {
    const baseValidation = this.validateField(field);
    const suggestions = this.getSuggestedValues(field);

    return {
      isValid: baseValidation.isValid,
      error: baseValidation.error,
      warnings: baseValidation.warnings,
      suggestions: suggestions.map((s) => String(s)),
      canProceed: baseValidation.isValid || !field.required,
    };
  }

  /**
   * Check if a step can be completed (for navigation purposes)
   */
  canCompleteStep(step: WizardStep): boolean {
    const visibleFields = this.getVisibleFields(step);
    return canCompleteStep(step, this.formData, visibleFields);
  }

  /**
   * Get the next incomplete step that needs attention
   */
  getNextIncompleteStep(): WizardStep | null {
    return getNextIncompleteStep(this.steps, this.formData, (step) =>
      this.getVisibleFields(step),
    );
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a new dependency engine instance
 */
export const createDependencyEngine = (
  steps: WizardStep[],
  initialFormData?: PartialContentCreationFormData,
): WizardDependencyEngine => {
  return new WizardDependencyEngine(steps, initialFormData);
};

/**
 * Check if form data meets minimum requirements for draft saving
 */
export const canSaveDraft = (
  engine: WizardDependencyEngine,
  minCompletionPercentage: number = 25,
): boolean => {
  const progress = engine.calculateProgress();
  return progress.completionPercentage >= minCompletionPercentage;
};

/**
 * Check if form data is ready for final submission
 */
export const canSubmitForm = (
  engine: WizardDependencyEngine,
  requiredFields: (keyof ContentCreationFormData)[],
): { canSubmit: boolean; missingFields: string[] } => {
  const formData = engine.getFormData();
  const missingFields: string[] = [];

  for (const fieldId of requiredFields) {
    const value = formData[fieldId];
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      missingFields.push(fieldId);
    }
  }

  return {
    canSubmit: missingFields.length === 0,
    missingFields,
  };
};

/**
 * Get fields that have changed between two form data states
 */
export const getChangedFields = (
  oldData: PartialContentCreationFormData,
  newData: PartialContentCreationFormData,
): (keyof ContentCreationFormData)[] => {
  const changedFields: (keyof ContentCreationFormData)[] = [];

  // Get all possible field keys
  const allKeys = new Set([
    ...(Object.keys(oldData) as (keyof ContentCreationFormData)[]),
    ...(Object.keys(newData) as (keyof ContentCreationFormData)[]),
  ]);

  for (const key of allKeys) {
    const oldValue = oldData[key];
    const newValue = newData[key];

    // Deep comparison for arrays and objects
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changedFields.push(key);
    }
  }

  return changedFields;
};

/**
 * Apply cascading updates when a field value changes
 */
export const applyCascadingUpdates = (
  engine: WizardDependencyEngine,
  changedField: keyof ContentCreationFormData,
  steps: WizardStep[],
): PartialContentCreationFormData => {
  const formData = { ...engine.getFormData() };

  // Find fields that depend on the changed field
  const dependentFields: WizardField[] = [];

  for (const step of steps) {
    for (const field of step.fields) {
      if (field.dependsOn?.some((dep) => dep.field === changedField)) {
        dependentFields.push(field);
      }
    }
  }

  // Clear values of fields that are no longer visible or valid
  for (const field of dependentFields) {
    if (!engine.isFieldVisible(field)) {
      delete formData[field.id];
    } else {
      // Check if current value is still valid with new options
      const currentValue = formData[field.id];
      const newOptions = engine.getFieldOptions(field);

      if (Array.isArray(currentValue)) {
        // Filter out invalid options from multi-select
        const validValues = currentValue.filter((val) =>
          newOptions.some((option) => option.value === val),
        );
        if (validValues.length !== currentValue.length) {
          (formData as Record<string, unknown>)[field.id] = validValues;
        }
      } else if (
        currentValue &&
        !newOptions.some((option) => option.value === currentValue)
      ) {
        // Clear single-select if value is no longer valid
        delete formData[field.id];
      }
    }
  }

  return formData;
};
