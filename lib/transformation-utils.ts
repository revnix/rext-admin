/**
 * Enhanced TypeScript Transformation Utilities
 *
 * This module provides comprehensive transformation utilities for converting between
 * frontend and backend data formats with robust error handling, validation, and
 * performance optimizations.
 *
 * @see /types/schemas.ts for basic transformation helpers and Zod schemas
 * @see /types/topic-builder.ts for frontend data structures
 * @see /types/backend.ts for backend API formats
 */

import type { SaveTopicItem } from "@/types/api";
import type { BackendTopicGenerationPayload } from "@/types/backend";
import {
  createUserFriendlyErrors,
  extractValidationErrors,
  GeneratedTopicSchema,
  SaveTopicItemSchema,
  TopicBuilderFormDataSchema,
  transformTopicForSaving,
} from "@/types/schemas";
import type {
  GeneratedTopic,
  TopicBuilderFormData,
} from "@/types/topic-builder";
import type {
  BatchTransformationOptions,
  BatchTransformationResult,
  BenchmarkResult,
  FormDataTransformationOptions,
  TopicTransformationOptions,
  TransformationError,
  TransformationErrorOptions,
  TransformationErrorType,
  TransformationResult,
} from "@/types/transformation";

// ============================================================================
// ENHANCED TRANSFORMATION UTILITIES
// ============================================================================

/**
 * Creates a standardized transformation error with recovery suggestions
 *
 * @param type - Error classification
 * @param message - Human-readable error message
 * @param originalData - Input data that caused the error
 * @param options - Additional error options
 * @returns Structured transformation error
 */
export const createTransformationError = (
  type: TransformationErrorType,
  message: string,
  originalData?: unknown,
  options: TransformationErrorOptions = {},
): TransformationError => {
  const error = new Error(message) as TransformationError;
  error.type = type;
  error.originalData = originalData;
  error.fieldPath = options.fieldPath;
  error.isRecoverable = options.isRecoverable ?? true;
  error.validationIssues = options.validationIssues;

  // Default recovery actions based on error type
  const defaultRecoveryActions: Record<TransformationError["type"], string[]> =
    {
      validation: [
        "Check that all required fields are present",
        "Verify field types match expected formats",
        "Review field value constraints (min/max lengths, etc.)",
      ],
      conversion: [
        "Ensure input data is in the expected format",
        "Check for circular references or invalid nested structures",
        "Validate that arrays contain the expected element types",
      ],
      missing_field: [
        "Add the missing required field to your input data",
        "Check if field name spelling is correct",
        "Verify that the field is not undefined or null",
      ],
      type_mismatch: [
        "Convert field value to the expected type",
        "Check for string/number/boolean type mismatches",
        "Ensure arrays are used where array types are expected",
      ],
      unknown: [
        "Check the error message for specific details",
        "Verify input data format matches expectations",
        "Contact support if the issue persists",
      ],
    };

  error.recoveryActions =
    options.recoveryActions ?? defaultRecoveryActions[type];

  return error;
};

/**
 * Enhanced transformation from GeneratedTopic to SaveTopicItem with comprehensive error handling
 *
 * @param topic - Frontend GeneratedTopic object
 * @param options - Transformation options
 * @returns Transformation result with success/error details
 *
 * @example
 * ```typescript
 * const result = transformTopicForSavingEnhanced(topic);
 * if (result.success) {
 *   console.log('Transformed successfully:', result.data);
 * } else {
 *   console.error('Transformation failed:', result.error);
 *   console.log('Recovery actions:', result.error.recoveryActions);
 * }
 * ```
 */
export const transformTopicForSavingEnhanced = (
  topic: unknown,
  options: TopicTransformationOptions = {},
): TransformationResult<SaveTopicItem> => {
  const startTime = performance.now();

  try {
    // Step 1: Validate input as GeneratedTopic
    const validationResult = GeneratedTopicSchema.safeParse(topic);
    if (!validationResult.success) {
      const fieldErrors = extractValidationErrors(validationResult.error);
      const friendlyErrors = createUserFriendlyErrors(fieldErrors);

      return {
        success: false,
        error: createTransformationError(
          "validation",
          `Invalid GeneratedTopic input: ${friendlyErrors.join("; ")}`,
          topic,
          {
            validationIssues: validationResult.error.issues,
            recoveryActions: [
              "Ensure the topic object has all required fields",
              "Check field types match the GeneratedTopic schema",
              "Verify arrays are not empty where required",
            ],
          },
        ),
      };
    }

    const validTopic = validationResult.data;

    // Step 2: Apply automatic fixes if enabled
    let processedTopic = validTopic;
    if (options.autoFix) {
      processedTopic = applyTopicAutoFixes(validTopic);
    }

    // Step 3: Perform transformation using base utility
    let transformedTopic: SaveTopicItem;
    try {
      transformedTopic = transformTopicForSaving(processedTopic);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Classify error type based on message
      let errorType: TransformationErrorType = "unknown";
      if (errorMessage.includes("empty")) {
        errorType = "missing_field";
      } else if (errorMessage.includes("validation")) {
        errorType = "validation";
      } else {
        errorType = "conversion";
      }

      return {
        success: false,
        error: createTransformationError(
          errorType,
          `Transformation failed: ${errorMessage}`,
          topic,
          {
            isRecoverable: true,
          },
        ),
      };
    }

    // Step 4: Apply custom field mappings if provided
    if (options.customMappings) {
      transformedTopic = applyCustomMappings(
        transformedTopic,
        options.customMappings,
      );
    }

    // Step 5: Final validation of output
    const outputValidation = SaveTopicItemSchema.safeParse(transformedTopic);
    if (!outputValidation.success) {
      const fieldErrors = extractValidationErrors(outputValidation.error);
      const friendlyErrors = createUserFriendlyErrors(fieldErrors);

      return {
        success: false,
        error: createTransformationError(
          "validation",
          `Transformed output validation failed: ${friendlyErrors.join("; ")}`,
          transformedTopic,
          {
            validationIssues: outputValidation.error.issues,
            recoveryActions: [
              "Check transformation logic for field mapping issues",
              "Verify all required backend fields are populated",
              "Ensure array fields are not empty",
            ],
          },
        ),
      };
    }

    const endTime = performance.now();
    const result: TransformationResult<SaveTopicItem> = {
      success: true,
      data: outputValidation.data,
    };

    if (options.includeMetrics) {
      result.metrics = {
        durationMs: endTime - startTime,
        inputSize: JSON.stringify(topic).length,
        outputSize: JSON.stringify(outputValidation.data).length,
      };
    }

    return result;
  } catch (error) {
    const endTime = performance.now();
    return {
      success: false,
      error: createTransformationError(
        "unknown",
        error instanceof Error
          ? error.message
          : "Unexpected transformation error",
        topic,
        { isRecoverable: false },
      ),
      metrics: options.includeMetrics
        ? {
            durationMs: endTime - startTime,
            inputSize: JSON.stringify(topic).length,
            outputSize: 0,
          }
        : undefined,
    };
  }
};

/**
 * Enhanced batch transformation for arrays of GeneratedTopics
 *
 * @param topics - Array of GeneratedTopic objects
 * @param options - Batch transformation options
 * @returns Batch transformation result with per-item success/error details
 *
 * @example
 * ```typescript
 * const result = transformTopicsForSavingEnhanced(topics, {
 *   continueOnError: true,
 *   includeMetrics: true
 * });
 * console.log(`Success: ${result.successCount}/${topics.length}`);
 * ```
 */
export const transformTopicsForSavingEnhanced = async (
  topics: unknown[],
  options: BatchTransformationOptions = {},
): Promise<BatchTransformationResult<SaveTopicItem>> => {
  const startTime = performance.now();
  const results: SaveTopicItem[] = [];
  const errors: BatchTransformationResult<SaveTopicItem>["errors"] = [];

  // Process items with optional concurrency limiting
  const maxConcurrency = options.maxConcurrency ?? topics.length;
  const chunks = chunkArray(topics, maxConcurrency);

  for (const chunk of chunks) {
    const chunkResults = chunk.map((topic, chunkIndex) => {
      const result = transformTopicForSavingEnhanced(topic, {
        autoFix: options.autoFix,
        includeMetrics: false, // Metrics handled at batch level
        customMappings: options.customMappings,
      });
      return { result, originalIndex: chunkIndex };
    });

    for (const { result, originalIndex } of chunkResults) {
      if (result.success && result.data) {
        results.push(result.data);
      } else if (result.error) {
        errors.push({
          index: originalIndex,
          error: result.error,
          originalItem: topics[originalIndex],
        });

        if (!options.continueOnError) {
          break;
        }
      }
    }

    if (!options.continueOnError && errors.length > 0) {
      break;
    }
  }

  const endTime = performance.now();
  const totalDuration = endTime - startTime;

  const batchResult: BatchTransformationResult<SaveTopicItem> = {
    success: errors.length === 0,
    data: results,
    errors,
  };

  if (options.includeMetrics) {
    batchResult.metrics = {
      totalDurationMs: totalDuration,
      successCount: results.length,
      errorCount: errors.length,
      avgDurationMs: totalDuration / topics.length,
    };
  }

  return batchResult;
};

/**
 * Enhanced transformation from TopicBuilderFormData to BackendTopicGenerationPayload
 *
 * @param formData - Frontend form data
 * @param options - Transformation options
 * @returns Transformation result with success/error details
 *
 * @example
 * ```typescript
 * const result = transformFormDataToBackendEnhanced(formData, {
 *   validateRequired: true,
 *   normalizeFields: true
 * });
 * ```
 */
export const transformFormDataToBackendEnhanced = (
  formData: unknown,
  options: FormDataTransformationOptions = {},
): TransformationResult<BackendTopicGenerationPayload> => {
  const startTime = performance.now();

  try {
    // Step 1: Validate input as TopicBuilderFormData
    const validationResult = TopicBuilderFormDataSchema.safeParse(formData);
    if (!validationResult.success) {
      const fieldErrors = extractValidationErrors(validationResult.error);
      const friendlyErrors = createUserFriendlyErrors(fieldErrors);

      return {
        success: false,
        error: createTransformationError(
          "validation",
          `Invalid TopicBuilderFormData input: ${friendlyErrors.join("; ")}`,
          formData,
          {
            validationIssues: validationResult.error.issues,
          },
        ),
      };
    }

    const validFormData = validationResult.data;

    // Step 2: Apply normalization if enabled
    let processedFormData = validFormData;
    if (options.normalizeFields) {
      processedFormData = normalizeFormData(validFormData);
    }

    // Step 3: Transform to backend format using the backend service transformation
    // We need to use the actual backend service transformation here
    const finalPayload: BackendTopicGenerationPayload = {
      wizardMode: processedFormData.wizardMode || "industry-first",
      industry:
        processedFormData.industry_other || processedFormData.industry || "",
      industry_other: processedFormData.industry_other || null,
      industry_specific_focus: processedFormData.focus || null,
      content_type:
        processedFormData.content_type_other ||
        processedFormData.content_type ||
        "",
      content_type_other: processedFormData.content_type_other || null,
      platform:
        processedFormData.platform_other || processedFormData.platform || null,
      platform_other: processedFormData.platform_other || null,
      audience:
        Array.isArray(processedFormData.audience) &&
        processedFormData.audience.length > 0
          ? processedFormData.audience.join(", ")
          : "",
      reader_level: processedFormData.reader_level || "",
      audience_size: processedFormData.audience_size || "",
      demographic_age: Array.isArray(processedFormData.demographic_age)
        ? processedFormData.demographic_age.filter(Boolean)
        : processedFormData.demographic_age
          ? [processedFormData.demographic_age]
          : [],
      demographic_location: Array.isArray(
        processedFormData.demographic_location,
      )
        ? processedFormData.demographic_location.filter(Boolean)
        : processedFormData.demographic_location
          ? [processedFormData.demographic_location]
          : [],
      purpose: Array.isArray(processedFormData.purpose)
        ? processedFormData.purpose
        : [],
      purpose_other: processedFormData.purpose_other || null,
      content_goal: Array.isArray(processedFormData.content_goal)
        ? processedFormData.content_goal
        : [],
      tone: Array.isArray(processedFormData.tone) ? processedFormData.tone : [],
      tone_other: processedFormData.tone_other || null,
      keywords: processedFormData.keywords || null,
      notes: processedFormData.notes || null,
      additional_notes: processedFormData.notes || null,
      num_ideas: processedFormData.num_ideas || 5,
      region: processedFormData.region || null,
      language: processedFormData.language || "English",
      content_timing_preference: processedFormData.fresh_vs_evergreen || null,
      content_originality_preference:
        processedFormData.safe_vs_original || null,
      fresh_vs_evergreen: processedFormData.fresh_vs_evergreen || null,
      safe_vs_original: processedFormData.safe_vs_original || null,
      exclude: processedFormData.exclude || null,
      focus: processedFormData.focus || null,
      subject: processedFormData.subject || null,
      timestamp: new Date().toISOString(),
      // Apply default values if provided
      ...options.defaultValues,
    };

    // Step 5: Additional validation for required fields if requested
    if (options.validateRequired) {
      const requiredFieldErrors = validateRequiredBackendFields(finalPayload);
      if (requiredFieldErrors.length > 0) {
        return {
          success: false,
          error: createTransformationError(
            "missing_field",
            `Required backend fields are missing: ${requiredFieldErrors.join(", ")}`,
            formData,
            {
              recoveryActions: requiredFieldErrors.map(
                (field) => `Provide a value for the '${field}' field`,
              ),
            },
          ),
        };
      }
    }

    const endTime = performance.now();
    const result: TransformationResult<BackendTopicGenerationPayload> = {
      success: true,
      data: finalPayload,
    };

    if (options.includeMetrics) {
      result.metrics = {
        durationMs: endTime - startTime,
        inputSize: JSON.stringify(formData).length,
        outputSize: JSON.stringify(finalPayload).length,
      };
    }

    return result;
  } catch (error) {
    const endTime = performance.now();
    return {
      success: false,
      error: createTransformationError(
        "unknown",
        error instanceof Error
          ? error.message
          : "Unexpected transformation error",
        formData,
        { isRecoverable: false },
      ),
      metrics: options.includeMetrics
        ? {
            durationMs: endTime - startTime,
            inputSize: JSON.stringify(formData).length,
            outputSize: 0,
          }
        : undefined,
    };
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Applies automatic fixes to a GeneratedTopic object
 * @private
 */
const applyTopicAutoFixes = (topic: GeneratedTopic): GeneratedTopic => {
  const fixed: GeneratedTopic = { ...topic };

  // Fix empty required arrays by adding defaults
  if (fixed.channel_fit.length === 0) {
    fixed.channel_fit = ["blog", "social-media"];
  }
  if (fixed.audience_fit.length === 0) {
    fixed.audience_fit = ["general-audience"];
  }
  if (fixed.tags.length === 0) {
    fixed.tags = ["content", "topic"];
  }

  // Ensure scores are within valid range
  fixed.scores = {
    relevance: Math.max(0, Math.min(100, fixed.scores.relevance)),
    freshness: Math.max(0, Math.min(100, fixed.scores.freshness)),
    novelty: Math.max(0, Math.min(100, fixed.scores.novelty)),
  };

  // Trim and limit text fields
  fixed.title = fixed.title.trim().substring(0, 200);
  fixed.angle = fixed.angle.trim().substring(0, 500);
  fixed.why_it_works = fixed.why_it_works.trim();

  return fixed;
};

/**
 * Applies custom field mappings to a SaveTopicItem
 * @private
 */
const applyCustomMappings = (
  item: SaveTopicItem,
  _mappings: Record<string, string>,
): SaveTopicItem => {
  const mapped = { ...item };

  // Note: This is a placeholder for custom mapping logic
  // In a real implementation, this would apply field name remapping
  // based on the mappings object

  return mapped;
};

/**
 * Normalizes form data field values
 * @private
 */
const normalizeFormData = (
  formData: TopicBuilderFormData,
): TopicBuilderFormData => {
  const normalized: TopicBuilderFormData = { ...formData };

  // Normalize string fields
  if (normalized.industry) {
    normalized.industry =
      normalized.industry.trim() as TopicBuilderFormData["industry"];
  }
  if (normalized.content_type) {
    normalized.content_type =
      normalized.content_type.trim() as TopicBuilderFormData["content_type"];
  }
  if (normalized.audience) {
    normalized.audience = normalized.audience.map((a) => a.trim());
  }

  // Normalize array fields - remove empty strings and duplicates
  if (Array.isArray(normalized.demographic_age)) {
    normalized.demographic_age = Array.from(
      new Set(normalized.demographic_age.filter(Boolean)),
    );
  }
  if (typeof normalized.demographic_location === "string") {
    normalized.demographic_location = normalized.demographic_location.trim();
  }
  normalized.purpose = Array.from(new Set(normalized.purpose.filter(Boolean)));
  normalized.content_goal = Array.from(
    new Set(normalized.content_goal.filter(Boolean)),
  );
  normalized.tone = Array.from(new Set(normalized.tone.filter(Boolean)));

  return normalized;
};

/**
 * Validates required backend fields
 * @private
 */
const validateRequiredBackendFields = (
  payload: BackendTopicGenerationPayload,
): string[] => {
  const errors: string[] = [];
  const requiredFields = ["industry", "content_type", "audience", "num_ideas"];

  for (const field of requiredFields) {
    const value = payload[field as keyof BackendTopicGenerationPayload];
    if (!value || (Array.isArray(value) && value.length === 0)) {
      errors.push(field);
    }
  }

  return errors;
};

/**
 * Splits an array into chunks of specified size
 * @private
 */
const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// ============================================================================
// PERFORMANCE AND DEBUGGING UTILITIES
// ============================================================================

/**
 * Benchmarks transformation performance with a dataset
 *
 * @param topics - Array of topics to benchmark
 * @param iterations - Number of iterations to run
 * @returns Performance benchmark results
 */
export const benchmarkTransformations = async (
  topics: GeneratedTopic[],
  iterations: number = 5,
): Promise<BenchmarkResult> => {
  const durations: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    await transformTopicsForSavingEnhanced(topics, { includeMetrics: false });
    const endTime = performance.now();
    durations.push(endTime - startTime);
  }

  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const throughput = (topics.length * 1000) / avgDuration;

  return {
    avgDurationMs: avgDuration,
    minDurationMs: minDuration,
    maxDurationMs: maxDuration,
    throughputPerSecond: throughput,
    // Memory usage would require Node.js process.memoryUsage()
    // memoryUsageKB: process?.memoryUsage?.()?.heapUsed / 1024
  };
};

/**
 * Debug utility that logs detailed transformation information
 *
 * @param input - Input data to transform
 * @param transformResult - Result from transformation
 */
export const debugTransformation = (
  input: unknown,
  transformResult: TransformationResult<unknown>,
): void => {
  console.group("🔧 Transformation Debug");
  console.log("📥 Input:", JSON.stringify(input, null, 2));
  console.log("✅ Success:", transformResult.success);

  if (transformResult.success) {
    console.log("📤 Output:", JSON.stringify(transformResult.data, null, 2));
  } else if (transformResult.error) {
    console.log("❌ Error Type:", transformResult.error.type);
    console.log("❌ Error Message:", transformResult.error.message);
    console.log("🔧 Recovery Actions:", transformResult.error.recoveryActions);
    if (transformResult.error.validationIssues) {
      console.log(
        "📋 Validation Issues:",
        transformResult.error.validationIssues,
      );
    }
  }

  if (transformResult.metrics) {
    console.log("📊 Metrics:", transformResult.metrics);
  }
  console.groupEnd();
};

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================================

/**
 * Legacy wrapper for backward compatibility with existing code
 * @deprecated Use transformTopicForSavingEnhanced instead
 */
export const safeTransformTopicForSaving = (
  topic: GeneratedTopic,
): SaveTopicItem | null => {
  const result = transformTopicForSavingEnhanced(topic);
  return result.success && result.data ? result.data : null;
};

/**
 * Legacy wrapper for batch transformations
 * @deprecated Use transformTopicsForSavingEnhanced instead
 */
export const safeTransformTopicsForSaving = async (
  topics: GeneratedTopic[],
): Promise<SaveTopicItem[]> => {
  const result = await transformTopicsForSavingEnhanced(topics, {
    continueOnError: true,
  });
  return result.data;
};
