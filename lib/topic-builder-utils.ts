/**
 * Topic Builder Utility Functions
 *
 * This module provides utility functions for the Topic Builder wizard,
 * including YMYL detection, form validation, and data processing helpers.
 */

import {
  DEFAULT_AUDIENCE_OPTIONS,
  getAudienceOptionsForIndustry,
  YMYL_INDUSTRIES,
} from "@/data/topic-builder-options";
import type { SelectOption } from "@/types/shared";
import type {
  TopicBuilderFormData,
  ValidationResult,
  WizardStep,
} from "@/types/topic-builder";

// ============================================================================
// YMYL DETECTION FUNCTIONALITY
// ============================================================================

/**
 * Detects if an industry falls under YMYL (Your Money or Your Life) category
 *
 * YMYL content affects a person's future happiness, health, financial stability, or safety.
 * This function performs case-insensitive matching and supports partial string matching.
 *
 * @param industry - The industry string to check
 * @returns true if the industry is considered YMYL, false otherwise
 *
 * @example
 * detectYMYL("Healthcare") // returns true
 * detectYMYL("Healthcare Services") // returns true
 * detectYMYL("Technology") // returns false
 * detectYMYL("") // returns false
 */
export const detectYMYL = (industry: string): boolean => {
  if (!industry || typeof industry !== "string") {
    console.warn("detectYMYL: Invalid industry input provided:", industry);
    return false;
  }

  const industryLower = industry.toLowerCase().trim();

  if (industryLower === "") {
    return false;
  }

  const isYMYL = YMYL_INDUSTRIES.some(
    (ymylIndustry) =>
      industryLower.includes(ymylIndustry.toLowerCase()) ||
      ymylIndustry.toLowerCase().includes(industryLower),
  );

  console.log(`YMYL Detection - Industry: "${industry}" → YMYL: ${isYMYL}`);

  return isYMYL;
};

// ============================================================================
// AUDIENCE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Get audience options dynamically based on selected industry
 *
 * @param industry - The selected industry
 * @returns Array of relevant audience options for the industry
 */
export const getAudienceOptions = (industry: string): SelectOption[] => {
  if (!industry || typeof industry !== "string") {
    return DEFAULT_AUDIENCE_OPTIONS;
  }

  return getAudienceOptionsForIndustry(industry);
};

// ============================================================================
// FORM VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates form data for a specific wizard step
 *
 * @param step - The current wizard step number (1-based)
 * @param formData - The current form data to validate
 * @returns ValidationResult with validity status and any error messages
 */
export const validateFormStep = (
  step: number,
  formData: TopicBuilderFormData,
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (step) {
    case 1: // Wizard Mode Selection
      if (!formData.wizardMode) {
        errors.push("Please select a wizard mode to continue");
      }
      break;

    case 2: // Industry/Domain + Subject (if subject-first)
      if (!formData.industry) {
        errors.push("Please select an industry or domain");
      }
      if (formData.industry === "other" && !formData.industry_other) {
        errors.push("Please specify the custom industry");
      }
      if (formData.wizardMode === "subject-first" && !formData.subject) {
        errors.push("Please provide a subject for subject-first mode");
      }
      break;

    case 3: // Audience & Targeting
      if (!formData.audience && formData.demographic_age.length === 0) {
        errors.push("Please specify target audience or select age groups");
      }
      if (formData.demographic_location.length === 0) {
        warnings.push(
          "Consider specifying geographic targeting for better results",
        );
      }
      break;

    case 4: // Content Format & Platform
      if (!formData.content_type) {
        errors.push("Please select a content type");
      }
      if (formData.content_type === "other" && !formData.content_type_other) {
        errors.push("Please specify the custom content type");
      }
      // Platform required for social media and video content
      if (
        ["social-media", "video-content"].includes(formData.content_type) &&
        !formData.platform
      ) {
        errors.push("Please select a platform for this content type");
      }
      if (formData.platform === "other" && !formData.platform_other) {
        errors.push("Please specify the custom platform");
      }
      break;

    case 5: // Content Goals & Style
      if (formData.purpose.length === 0) {
        errors.push("Please select at least one content purpose");
      }
      if (formData.content_goal.length === 0) {
        errors.push("Please select at least one content goal type");
      }
      if (formData.tone.length === 0) {
        warnings.push("Consider selecting a tone to guide content style");
      }
      break;

    case 6: // Advanced Options (all optional)
      // No required validations for advanced options
      if (formData.num_ideas < 1 || formData.num_ideas > 20) {
        errors.push("Number of ideas must be between 1 and 20");
      }
      break;

    case 7: {
      // Review & Preferences
      // Final validation - check all required fields
      const finalValidation = validateFormStep(2, formData);
      const contentValidation = validateFormStep(4, formData);
      const goalValidation = validateFormStep(5, formData);

      errors.push(
        ...finalValidation.errors,
        ...contentValidation.errors,
        ...goalValidation.errors,
      );
      break;
    }

    default:
      errors.push("Invalid step number");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

// ============================================================================
// AI PROMPT GENERATION
// ============================================================================

/**
 * Builds a structured AI prompt from the collected form data
 *
 * @param formData - Complete form data from the wizard
 * @returns Formatted prompt string for AI topic generation
 */
export const buildPromptFromFormData = (
  formData: TopicBuilderFormData,
): string => {
  const {
    wizardMode,
    subject,
    industry,
    industry_other,
    content_type,
    content_type_other,
    platform,
    platform_other,
    audience,
    demographic_age,
    demographic_location,
    reader_level,
    purpose,
    purpose_other,
    content_goal,
    tone,
    tone_other,
    keywords,
    exclude,
    focus,
    num_ideas,
    notes,
    region,
    language,
    is_ymyl,
    fresh_vs_evergreen,
    safe_vs_original,
  } = formData;

  // Determine the actual industry and content type
  const actualIndustry = industry === "other" ? industry_other : industry;
  const actualContentType =
    content_type === "other" ? content_type_other : content_type;
  const actualPlatform = platform === "other" ? platform_other : platform;

  // Build the prompt sections
  let prompt = `Generate ${num_ideas} engaging content topic ideas with the following specifications:\n\n`;

  // Core context
  if (wizardMode === "subject-first" && subject) {
    prompt += `SUBJECT: ${subject}\n`;
  }
  prompt += `INDUSTRY: ${actualIndustry}\n`;

  if (wizardMode === "industry-first" && focus) {
    prompt += `FOCUS AREA: ${focus}\n`;
  }

  // Audience and targeting
  if (audience) {
    prompt += `TARGET AUDIENCE: ${audience}\n`;
  }
  if (demographic_age.length > 0) {
    prompt += `AGE GROUPS: ${demographic_age.join(", ")}\n`;
  }
  if (demographic_location.length > 0) {
    prompt += `GEOGRAPHIC FOCUS: ${demographic_location.join(", ")}\n`;
  }
  if (reader_level) {
    prompt += `READER LEVEL: ${reader_level}\n`;
  }

  // Content specifications
  prompt += `CONTENT TYPE: ${actualContentType}\n`;
  if (actualPlatform) {
    prompt += `PLATFORM: ${actualPlatform}\n`;
  }

  // Goals and style
  if (purpose.length > 0) {
    const purposeList = purpose
      .map((p) => (p === "other" ? purpose_other : p))
      .join(", ");
    prompt += `CONTENT PURPOSE: ${purposeList}\n`;
  }
  if (content_goal.length > 0) {
    prompt += `CONTENT GOALS: ${content_goal.join(", ")}\n`;
  }
  if (tone.length > 0) {
    const toneList = tone
      .map((t) => (t === "other" ? tone_other : t))
      .join(", ");
    prompt += `TONE: ${toneList}\n`;
  }

  // Advanced options
  if (keywords) {
    prompt += `KEYWORDS TO INCLUDE: ${keywords}\n`;
  }
  if (exclude) {
    prompt += `TOPICS TO AVOID: ${exclude}\n`;
  }
  if (region) {
    prompt += `TARGET REGION: ${region}\n`;
  }
  if (language) {
    prompt += `LANGUAGE: ${language}\n`;
  }

  // Content preferences
  if (fresh_vs_evergreen) {
    prompt += `CONTENT FRESHNESS: ${fresh_vs_evergreen}\n`;
  }
  if (safe_vs_original) {
    prompt += `ORIGINALITY: ${safe_vs_original}\n`;
  }

  // YMYL compliance
  if (is_ymyl) {
    prompt += `\n⚠️ YMYL CONTENT: This is sensitive content affecting health, finance, or legal matters. Generate topics that are factual, neutral, and non-advisory.\n`;
  }

  // Additional context
  if (notes) {
    prompt += `\nADDITIONAL CONTEXT: ${notes}\n`;
  }

  // Response format instructions
  prompt += `\nReturn exactly ${num_ideas} topic ideas in the following JSON array format:\n`;
  prompt += `[
  {
    "title": "Clear, engaging topic title",
    "angle": "Specific angle or approach for this topic",
    "channel_fit": ["platforms this topic works well on"],
    "audience_fit": ["audience segments this appeals to"],
    "why_it_works": "Brief explanation of why this topic would succeed",
    "scores": {
      "relevance": 0.95,
      "freshness": 0.80,
      "novelty": 0.75
    },
    "tags": ["relevant", "topic", "tags"]
  }
]\n\n`;

  // Final instructions
  prompt += `Ensure each topic:\n`;
  prompt += `- Is highly relevant to the specified industry and audience\n`;
  prompt += `- Matches the requested content type and platform\n`;
  prompt += `- Aligns with the stated purpose and goals\n`;
  prompt += `- Uses the appropriate tone and style\n`;
  if (is_ymyl) {
    prompt += `- Follows YMYL content guidelines (factual, neutral, non-advisory)\n`;
  }
  prompt += `- Includes realistic scores (0.0-1.0) for relevance, freshness, and novelty\n`;
  prompt += `- Has 3-5 relevant tags for categorization`;

  return prompt;
};

// ============================================================================
// STEP NAVIGATION HELPERS
// ============================================================================

/**
 * Determines if a wizard step should be shown based on form data
 *
 * @param step - The wizard step configuration
 * @param formData - Current form data
 * @returns true if the step should be displayed
 */
export const shouldShowStep = (
  step: WizardStep,
  formData: TopicBuilderFormData,
): boolean => {
  if (!step.dependsOn) {
    return true;
  }

  const { field, value } = step.dependsOn;
  const fieldValue = formData[field];

  if (Array.isArray(value)) {
    return Array.isArray(fieldValue)
      ? fieldValue.some((v) => value.includes(v))
      : value.includes(fieldValue as string);
  }

  return fieldValue === value;
};

/**
 * Gets the next valid step number based on current form data
 *
 * @param currentStep - Current step number
 * @param steps - Array of wizard step configurations
 * @param formData - Current form data
 * @returns Next valid step number or null if no next step
 */
export const getNextValidStep = (
  currentStep: number,
  steps: WizardStep[],
  formData: TopicBuilderFormData,
): number | null => {
  for (let i = currentStep; i < steps.length; i++) {
    const step = steps[i];
    if (shouldShowStep(step, formData)) {
      return step.id;
    }
  }
  return null;
};

/**
 * Gets the previous valid step number based on current form data
 *
 * @param currentStep - Current step number
 * @param steps - Array of wizard step configurations
 * @param formData - Current form data
 * @returns Previous valid step number or null if no previous step
 */
export const getPreviousValidStep = (
  currentStep: number,
  steps: WizardStep[],
  formData: TopicBuilderFormData,
): number | null => {
  for (let i = currentStep - 2; i >= 0; i--) {
    const step = steps[i];
    if (shouldShowStep(step, formData)) {
      return step.id;
    }
  }
  return null;
};

// ============================================================================
// FORM DATA HELPERS
// ============================================================================

/**
 * Creates initial form data with smart defaults
 *
 * @returns Default TopicBuilderFormData object
 */
export const createInitialFormData = (): TopicBuilderFormData => {
  return {
    wizardMode: "industry-first",
    industry: "technology",
    content_type: "blog-post",
    demographic_age: [],
    demographic_location: [],
    purpose: [],
    content_goal: [],
    tone: [],
    num_ideas: 5,
  };
};

/**
 * Updates form data when industry changes, resetting dependent fields
 *
 * @param formData - Current form data
 * @param newIndustry - New industry value
 * @returns Updated form data with dependent fields reset
 */
export const updateFormDataForIndustryChange = (
  formData: TopicBuilderFormData,
  newIndustry: string,
): TopicBuilderFormData => {
  return {
    ...formData,
    industry: newIndustry as TopicBuilderFormData["industry"],
    industry_other:
      newIndustry === "other" ? formData.industry_other : undefined,
    // Reset dependent fields
    audience: undefined,
    demographic_age: [],
    demographic_location: [],
    // Auto-detect YMYL
    is_ymyl: detectYMYL(newIndustry),
  };
};

/**
 * Updates form data when content type changes, resetting dependent fields
 *
 * @param formData - Current form data
 * @param newContentType - New content type value
 * @returns Updated form data with dependent fields reset
 */
export const updateFormDataForContentTypeChange = (
  formData: TopicBuilderFormData,
  newContentType: string,
): TopicBuilderFormData => {
  const needsPlatform = ["social-media", "video-content"].includes(
    newContentType,
  );

  return {
    ...formData,
    content_type: newContentType as TopicBuilderFormData["content_type"],
    content_type_other:
      newContentType === "other" ? formData.content_type_other : undefined,
    // Reset platform if not needed
    platform: needsPlatform ? formData.platform : undefined,
    platform_other: needsPlatform ? formData.platform_other : undefined,
  };
};

// ============================================================================
// DATA PROCESSING HELPERS
// ============================================================================

/**
 * Sanitizes and normalizes user input strings
 *
 * @param input - Raw user input string
 * @returns Cleaned and normalized string
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input.trim().replace(/\s+/g, " ");
};

/**
 * Converts form data to a JSON object for API requests
 *
 * @param formData - Complete form data
 * @returns Serializable object ready for API transmission
 */
export const prepareFormDataForAPI = (formData: TopicBuilderFormData) => {
  return {
    ...formData,
    // Sanitize text inputs
    subject: formData.subject ? sanitizeInput(formData.subject) : undefined,
    industry_other: formData.industry_other
      ? sanitizeInput(formData.industry_other)
      : undefined,
    content_type_other: formData.content_type_other
      ? sanitizeInput(formData.content_type_other)
      : undefined,
    platform_other: formData.platform_other
      ? sanitizeInput(formData.platform_other)
      : undefined,
    audience: formData.audience ? sanitizeInput(formData.audience) : undefined,
    purpose_other: formData.purpose_other
      ? sanitizeInput(formData.purpose_other)
      : undefined,
    tone_other: formData.tone_other
      ? sanitizeInput(formData.tone_other)
      : undefined,
    keywords: formData.keywords ? sanitizeInput(formData.keywords) : undefined,
    exclude: formData.exclude ? sanitizeInput(formData.exclude) : undefined,
    focus: formData.focus ? sanitizeInput(formData.focus) : undefined,
    notes: formData.notes ? sanitizeInput(formData.notes) : undefined,
    // Timestamp for tracking
    timestamp: new Date().toISOString(),
  };
};

// ============================================================================
// ERROR HANDLING HELPERS
// ============================================================================

/**
 * Creates a user-friendly error message for form validation failures
 *
 * @param errors - Array of validation error messages
 * @returns Formatted error message string
 */
export const formatValidationErrors = (errors: string[]): string => {
  if (errors.length === 0) {
    return "";
  }

  if (errors.length === 1) {
    return errors[0];
  }

  return `Please fix the following issues:\n• ${errors.join("\n• ")}`;
};

/**
 * Logs form validation results for debugging
 *
 * @param step - Current step number
 * @param result - Validation result
 * @param formData - Form data that was validated
 */
export const logValidationResult = (
  step: number,
  result: ValidationResult,
  formData: TopicBuilderFormData,
): void => {
  console.log(`Form Validation - Step ${step}:`, {
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
    wizardMode: formData.wizardMode,
    industry: formData.industry,
    isYMYL: formData.is_ymyl,
  });
};
