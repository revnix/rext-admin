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
import { stepValidationSchemas } from "@/types/schemas";
import type { SelectOption } from "@/types/shared";
import type {
  CurrentStep,
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

/**
 * Get audience strings for a specific industry (as required by Task 2.2)
 *
 * @param industry - The selected industry
 * @returns Array of relevant audience strings for the industry
 */
export const getAudienceForIndustry = (industry: string): string[] => {
  if (!industry || typeof industry !== "string") {
    console.warn(
      "getAudienceForIndustry: Invalid industry input provided:",
      industry,
    );
    return [];
  }

  const audienceOptions = getAudienceOptionsForIndustry(industry);
  return audienceOptions.map((option) => option.value);
};

// ============================================================================
// INTERDEPENDENT FIELD VALIDATION HELPERS
// ============================================================================

/**
 * Validates if a subject is relevant to the selected industry
 *
 * @param subject - The user's subject input
 * @param industry - The selected industry
 * @returns true if subject is relevant to industry, false otherwise
 */
export const validateSubjectIndustryRelevance = (
  subject: string,
  industry: string,
): boolean => {
  if (
    !subject ||
    !industry ||
    typeof subject !== "string" ||
    typeof industry !== "string"
  ) {
    return true; // Allow if either is missing - let other validation handle required fields
  }

  const subjectLower = subject.toLowerCase().trim();
  const industryLower = industry.toLowerCase().trim();

  // If industry is "other", we can't validate relevance
  if (industryLower === "other") {
    return true;
  }

  // Industry-specific keyword mapping for relevance checking
  const industryKeywords: Record<string, string[]> = {
    technology: [
      "tech",
      "software",
      "ai",
      "machine learning",
      "app",
      "web",
      "mobile",
      "cloud",
      "data",
      "digital",
      "programming",
      "development",
      "computer",
      "internet",
      "automation",
    ],
    healthcare: [
      "health",
      "medical",
      "medicine",
      "patient",
      "doctor",
      "nurse",
      "hospital",
      "clinic",
      "therapy",
      "treatment",
      "diagnosis",
      "wellness",
      "fitness",
      "nutrition",
    ],
    finance: [
      "money",
      "investment",
      "banking",
      "loan",
      "credit",
      "financial",
      "budget",
      "savings",
      "insurance",
      "tax",
      "accounting",
      "trading",
      "stock",
      "crypto",
    ],
    education: [
      "learn",
      "teach",
      "student",
      "school",
      "university",
      "course",
      "training",
      "skill",
      "knowledge",
      "academic",
      "curriculum",
      "lesson",
    ],
    travel: [
      "travel",
      "trip",
      "vacation",
      "hotel",
      "flight",
      "tourism",
      "destination",
      "adventure",
      "journey",
      "explore",
    ],
    food: [
      "food",
      "recipe",
      "cooking",
      "restaurant",
      "cuisine",
      "culinary",
      "meal",
      "nutrition",
      "diet",
      "chef",
    ],
    fashion: [
      "fashion",
      "style",
      "clothing",
      "apparel",
      "design",
      "trend",
      "beauty",
      "makeup",
      "wardrobe",
    ],
    business: [
      "business",
      "entrepreneur",
      "startup",
      "company",
      "management",
      "strategy",
      "leadership",
      "growth",
      "productivity",
    ],
    marketing: [
      "marketing",
      "advertising",
      "brand",
      "campaign",
      "social media",
      "promotion",
      "seo",
      "content",
      "audience",
    ],
    legal: [
      "legal",
      "law",
      "attorney",
      "lawyer",
      "court",
      "rights",
      "contract",
      "regulation",
      "compliance",
    ],
    sports: [
      "sport",
      "fitness",
      "exercise",
      "training",
      "athlete",
      "competition",
      "game",
      "workout",
      "physical",
    ],
  };

  const relevantKeywords = industryKeywords[industryLower] || [];

  // Check if subject contains any industry-relevant keywords
  const hasRelevantKeywords = relevantKeywords.some((keyword) =>
    subjectLower.includes(keyword),
  );

  // Also check if industry name appears in subject
  const hasIndustryMention = subjectLower.includes(industryLower);

  return hasRelevantKeywords || hasIndustryMention;
};

// ============================================================================
// FORM VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates form data for a specific wizard step with detailed results
 *
 * @param step - The current wizard step number (1-based)
 * @param formData - The current form data to validate
 * @returns ValidationResult with validity status and any error messages
 */
export const validateFormStepDetailed = (
  step: number,
  formData: Partial<TopicBuilderFormData>,
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (step) {
    case 1: // Industry/Domain + Approach Selection (merged step)
      if (!formData.wizardMode) {
        errors.push("Please choose how you'd like to start creating topics");
      }
      if (!formData.industry) {
        errors.push("Please select your field or industry to continue");
      }
      if (formData.industry === "other" && !formData.industry_other?.trim()) {
        errors.push("Please tell us what industry you're in");
      }
      if (
        formData.wizardMode === "subject-first" &&
        !formData.subject?.trim()
      ) {
        errors.push("Please enter the topic you want to explore");
      }
      // Interdependent validation: subject relevance to industry
      if (
        formData.wizardMode === "subject-first" &&
        formData.subject &&
        formData.industry
      ) {
        const actualIndustry =
          formData.industry === "other"
            ? formData.industry_other
            : formData.industry;
        if (
          actualIndustry &&
          !validateSubjectIndustryRelevance(formData.subject, actualIndustry)
        ) {
          warnings.push(
            "The subject might not be closely related to the selected industry. Consider adjusting either the subject or industry for better topic generation.",
          );
        }
      }
      break;

    case 2: // Audience & Targeting
      if (!formData.audience || formData.audience.length === 0) {
        errors.push("Please tell us who you're creating content for");
      }
      // Enhanced validation: ensure audience makes sense for industry
      if (
        formData.audience &&
        formData.audience.length > 0 &&
        formData.industry
      ) {
        const audienceOptions = getAudienceForIndustry(formData.industry);
        if (
          audienceOptions.length > 0 &&
          !formData.audience.some((aud) => audienceOptions.includes(aud))
        ) {
          warnings.push(
            "Consider selecting an audience that's more specific to your industry for better results",
          );
        }
      }
      break;

    case 3: // Content Format & Platform
      if (!formData.content_type) {
        errors.push("Please choose what type of content you'll create");
      }
      // Platform required only for social media content
      if (formData.content_type === "social-media" && !formData.platform) {
        errors.push("Please choose where you'll publish this content");
      }
      break;

    case 4: // Content Goals & Style
      if (!formData.purpose || formData.purpose.length === 0) {
        errors.push("Please choose what you want to achieve with this content");
      }
      if (!formData.tone || formData.tone.length === 0) {
        warnings.push("Consider choosing a tone to help us match your style");
      }
      break;

    case 5: // Advanced Options (all optional)
      // No required validations for advanced options
      if (
        formData.num_topics &&
        (formData.num_topics < 1 || formData.num_topics > 20)
      ) {
        errors.push("Please choose between 1 and 20 topics");
      }
      break;

    case 6: {
      // Review & Generate (final step)
      // Comprehensive final validation before generation
      const step1Validation = validateFormStepDetailed(1, formData);
      const step2Validation = validateFormStepDetailed(2, formData);
      const step3Validation = validateFormStepDetailed(3, formData);
      const step4Validation = validateFormStepDetailed(4, formData);
      const step5Validation = validateFormStepDetailed(5, formData);

      errors.push(
        ...step1Validation.errors,
        ...step2Validation.errors,
        ...step3Validation.errors,
        ...step4Validation.errors,
        ...step5Validation.errors,
      );

      // Additional generation-specific validation
      if (!formData.num_topics || formData.num_topics < 1) {
        errors.push("Please choose how many topics you need");
      }
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

/**
 * Validates form data for a specific wizard step (Task 2.3 requirement)
 *
 * @param step - The current wizard step number (1-based)
 * @param data - Partial form data to validate
 * @returns boolean indicating if the step data is valid
 */
export const validateFormStep = (
  step: number,
  data: Partial<TopicBuilderFormData>,
): boolean => {
  const result = validateFormStepDetailed(step, data);
  return result.isValid;
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
    purpose,
    purpose_other,
    tone,
    tone_other,
    num_topics,
    notes,
  } = formData;

  // Determine the actual industry and content type
  const actualIndustry = industry === "other" ? industry_other : industry;
  const actualContentType =
    content_type === "other" ? content_type_other : content_type;
  const actualPlatform = platform === "other" ? platform_other : platform;

  // Build the prompt sections
  let prompt = `Generate ${num_topics} engaging content topics with the following specifications:\n\n`;

  // Core context
  if (wizardMode === "subject-first" && subject) {
    prompt += `SUBJECT: ${subject}\n`;
  }
  prompt += `INDUSTRY: ${actualIndustry}\n`;

  // Audience and targeting
  if (audience && audience.length > 0) {
    prompt += `TARGET AUDIENCE: ${audience.join(", ")}\n`;
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
  if (tone.length > 0) {
    const toneList = tone
      .map((t) => (t === "other" ? tone_other : t))
      .join(", ");
    prompt += `TONE: ${toneList}\n`;
  }

  // Advanced options (simplified)
  // Only include additional notes if provided

  // Additional context
  if (notes) {
    prompt += `\nADDITIONAL CONTEXT: ${notes}\n`;
  }

  // Response format instructions
  prompt += `\nReturn exactly ${num_topics} topics in the following JSON array format:\n`;
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
    purpose: [],
    tone: [],
    num_topics: 5,
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
  const availableAudiences = getAudienceForIndustry(newIndustry);
  const currentAudiences = formData.audience || [];

  // Filter current audiences to keep only those valid for the new industry
  const validAudiences = currentAudiences.filter((audience) =>
    availableAudiences.includes(audience),
  );

  // Keep only valid audiences, do not auto-select
  const audienceSelection = validAudiences;

  return {
    ...formData,
    industry: newIndustry as TopicBuilderFormData["industry"],
    industry_other:
      newIndustry === "other" ? formData.industry_other : undefined,
    // Update audience with smart filtering/defaults
    audience: audienceSelection,
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
  const needsPlatform = newContentType === "social-media";

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
  console.log("Raw form data:", formData);

  // Just return the form data - backend service handles transformation
  const apiData = {
    ...formData,
    timestamp: new Date().toISOString(),
  };

  console.log("Prepared API data:", apiData);
  return apiData;
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
    contentType: formData.content_type,
  });
};

// ============================================================================
// TYPEFORM WIZARD STEP NAVIGATION UTILITIES
// ============================================================================

/**
 * Step order definition for TypeForm wizard navigation
 */
export const STEP_ORDER: CurrentStep[] = [
  "wizard-mode",
  "industry",
  "subject",
  "audience",
  "content-type",
  "platform",
  "purpose",
  "tone",
  "notes",
  "num-topics",
];

/**
 * Get the next step in the wizard flow based on form data and current step
 *
 * @param currentStep - Current step in the wizard
 * @param formData - Current form data to determine conditional steps
 * @returns Next step or null if at the end
 */
export const getNextStep = (
  currentStep: CurrentStep,
  formData: Partial<TopicBuilderFormData>,
): CurrentStep | null => {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === STEP_ORDER.length - 1) {
    return null;
  }

  let nextIndex = currentIndex + 1;
  let nextStep = STEP_ORDER[nextIndex];

  // Skip conditional steps based on form data
  while (nextStep && shouldSkipStep(nextStep, formData)) {
    nextIndex++;
    if (nextIndex >= STEP_ORDER.length) {
      return null;
    }
    nextStep = STEP_ORDER[nextIndex];
  }

  return nextStep;
};

/**
 * Get the previous step in the wizard flow
 *
 * @param currentStep - Current step in the wizard
 * @param stepHistory - History of visited steps
 * @returns Previous step or null if at the beginning
 */
export const getPreviousStep = (
  currentStep: CurrentStep,
  stepHistory: CurrentStep[],
): CurrentStep | null => {
  const currentIndex = stepHistory.indexOf(currentStep);
  if (currentIndex <= 0) {
    return null;
  }
  return stepHistory[currentIndex - 1];
};

/**
 * Determine if a step should be skipped based on form data
 *
 * @param step - Step to check
 * @param formData - Current form data
 * @returns True if step should be skipped
 */
export const shouldSkipStep = (
  step: CurrentStep,
  formData: Partial<TopicBuilderFormData>,
): boolean => {
  switch (step) {
    case "subject":
      // Skip subject step if using industry-first mode
      return formData.wizardMode === "industry-first";

    case "platform":
      // Skip platform step unless content type is social-media
      return formData.content_type !== "social-media";

    case "notes":
    case "num-topics":
      // These are optional steps, never skip
      return false;

    default:
      return false;
  }
};

/**
 * Validate a specific step using the step-specific validation schemas
 *
 * @param step - Step to validate
 * @param formData - Current form data
 * @returns Validation result
 */
export const validateStep = (
  step: CurrentStep,
  formData: Partial<TopicBuilderFormData>,
): ValidationResult => {
  try {
    const schema = stepValidationSchemas[step];
    if (!schema) {
      return { isValid: true, errors: [] };
    }

    // Extract only the fields relevant to this step
    const stepData = extractStepData(step, formData);
    const result = schema.safeParse(stepData);

    if (result.success) {
      return { isValid: true, errors: [] };
    }

    const errors = result.error.issues.map((issue) => issue.message);
    return { isValid: false, errors };
  } catch (error) {
    console.error(`Error validating step ${step}:`, error);
    return { isValid: false, errors: ["Validation error occurred"] };
  }
};

/**
 * Extract data relevant to a specific step from form data
 *
 * @param step - Step to extract data for
 * @param formData - Complete form data
 * @returns Step-specific data object
 */
export const extractStepData = (
  step: CurrentStep,
  formData: Partial<TopicBuilderFormData>,
): Partial<TopicBuilderFormData> => {
  switch (step) {
    case "wizard-mode":
      return { wizardMode: formData.wizardMode };

    case "industry":
      return {
        industry: formData.industry,
        industry_other: formData.industry_other,
      };

    case "subject":
      return { subject: formData.subject };

    case "audience":
      return { audience: formData.audience };

    case "content-type":
      return {
        content_type: formData.content_type,
        content_type_other: formData.content_type_other,
      };

    case "platform":
      return {
        platform: formData.platform,
        platform_other: formData.platform_other,
      };

    case "purpose":
      return {
        purpose: formData.purpose,
        purpose_other: formData.purpose_other,
      };

    case "tone":
      return {
        tone: formData.tone,
        tone_other: formData.tone_other,
      };

    case "notes":
      return { notes: formData.notes };

    case "num-topics":
      return { num_topics: formData.num_topics };

    default:
      return {};
  }
};

/**
 * Calculate wizard progress based on current step and form completion
 *
 * @param currentStep - Current step in the wizard
 * @param formData - Current form data
 * @returns Progress information
 */
export const calculateWizardProgress = (
  currentStep: CurrentStep,
  formData: Partial<TopicBuilderFormData>,
): { current: number; total: number; percentage: number } => {
  // Get all applicable steps (excluding skipped ones)
  const applicableSteps = STEP_ORDER.filter(
    (step) => !shouldSkipStep(step, formData),
  );
  const current = applicableSteps.indexOf(currentStep) + 1;
  const total = applicableSteps.length;
  const percentage = Math.round((current / total) * 100);

  return { current, total, percentage };
};
