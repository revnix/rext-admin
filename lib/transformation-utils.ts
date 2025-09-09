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
  EdgeCaseOptions,
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
 * Determines error severity based on error type
 * @private
 */
const determineSeverity = (
  type: TransformationErrorType,
): "low" | "medium" | "high" | "critical" => {
  const severityMap: Record<
    TransformationErrorType,
    "low" | "medium" | "high" | "critical"
  > = {
    validation: "medium",
    conversion: "medium",
    missing_field: "high",
    type_mismatch: "high",
    field_required: "high",
    array_empty: "medium",
    schema_mismatch: "high",
    size_limit_exceeded: "medium",
    circular_reference: "high",
    network_timeout: "low",
    rate_limit_exceeded: "low",
    memory_limit_exceeded: "critical",
    unknown: "medium",
  };
  return severityMap[type];
};

/**
 * Determines if an error type is recoverable
 * @private
 */
const isErrorRecoverable = (type: TransformationErrorType): boolean => {
  const recoverableErrors: TransformationErrorType[] = [
    "validation",
    "missing_field",
    "type_mismatch",
    "field_required",
    "array_empty",
    "size_limit_exceeded",
    "network_timeout",
    "rate_limit_exceeded",
  ];
  return recoverableErrors.includes(type);
};

/**
 * Determines the specific error type based on Zod validation issues
 * @private
 */
const determineValidationErrorType = (
  issues: import("zod").ZodIssue[],
): TransformationErrorType => {
  for (const issue of issues) {
    switch (issue.code) {
      case "invalid_type":
        return "type_mismatch";
      case "too_small":
        if ("type" in issue && issue.type === "array") return "array_empty";
        return "field_required";
      case "invalid_format":
        return "schema_mismatch";
      case "custom":
        return "validation";
      default:
        if (issue.message.toLowerCase().includes("required")) {
          return "field_required";
        }
        if (issue.message.toLowerCase().includes("empty")) {
          return "array_empty";
        }
    }
  }
  return "validation";
};

/**
 * Classifies transformation errors based on error message content
 * @private
 */
const classifyTransformationError = (
  errorMessage: string,
): TransformationErrorType => {
  const message = errorMessage.toLowerCase();

  if (message.includes("empty") || message.includes("required")) {
    return "field_required";
  }
  if (message.includes("type") || message.includes("mismatch")) {
    return "type_mismatch";
  }
  if (message.includes("validation") || message.includes("invalid")) {
    return "validation";
  }
  if (message.includes("size") || message.includes("limit")) {
    return "size_limit_exceeded";
  }
  if (message.includes("circular") || message.includes("reference")) {
    return "circular_reference";
  }

  return "conversion";
};

/**
 * Creates a fallback SaveTopicItem with minimal valid data
 * @private
 */
const createFallbackSaveTopicItem = (input: unknown): SaveTopicItem | null => {
  try {
    const fallbackData: SaveTopicItem = {
      title: extractStringValue(input, "title") || "Untitled Topic",
      angle: extractStringValue(input, "angle") || "General angle",
      channel_fit: extractArrayValue(input, "channel_fit") || ["blog"],
      audience_fit: extractArrayValue(input, "audience_fit") || [
        "general-audience",
      ],
      scores: {
        relevance: extractNumberValue(input, "scores.relevance") || 50,
        freshness: extractNumberValue(input, "scores.freshness") || 50,
        novelty: extractNumberValue(input, "scores.novelty") || 50,
      },
      why_it_works:
        extractStringValue(input, "why_it_works") ||
        "Standard content approach",
      tags: extractArrayValue(input, "tags") || ["content"],
    };

    // Validate the fallback data
    const validation = SaveTopicItemSchema.safeParse(fallbackData);
    return validation.success ? validation.data : null;
  } catch {
    return null;
  }
};

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
  error.expectedType = options.expectedType;
  error.actualType = options.actualType;
  error.context = options.context;
  error.severity = options.severity ?? determineSeverity(type);
  error.timestamp = new Date().toISOString();
  error.isRecoverable = options.isRecoverable ?? isErrorRecoverable(type);
  error.validationIssues = options.validationIssues;

  // Enhanced recovery actions based on error type and context
  const defaultRecoveryActions: Record<TransformationError["type"], string[]> =
    {
      validation: [
        "Check that all required fields are present",
        "Verify field types match expected formats",
        "Review field value constraints (min/max lengths, etc.)",
        ...(options.constraints
          ? [
              `Ensure values meet constraints: ${options.constraints.join(", ")}`,
            ]
          : []),
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
        ...(options.expectedType
          ? [`Expected type: ${options.expectedType}`]
          : []),
      ],
      type_mismatch: [
        "Convert field value to the expected type",
        "Check for string/number/boolean type mismatches",
        "Ensure arrays are used where array types are expected",
        ...(options.expectedType && options.actualType
          ? [
              `Expected ${options.expectedType}, but received ${options.actualType}`,
            ]
          : []),
      ],
      field_required: [
        "This field is mandatory and cannot be empty",
        "Provide a valid value for this field",
        "Check if the field is properly initialized",
      ],
      array_empty: [
        "Arrays marked as required cannot be empty",
        "Add at least one valid element to the array",
        "Verify array initialization before processing",
      ],
      schema_mismatch: [
        "Input data structure doesn't match expected schema",
        "Review the required schema format",
        "Check for missing or extra fields",
      ],
      size_limit_exceeded: [
        "Input data exceeds maximum allowed size",
        "Reduce data size or split into smaller chunks",
        "Consider data compression techniques",
      ],
      circular_reference: [
        "Remove circular references from input data",
        "Use JSON.stringify replacer to handle cycles",
        "Restructure data to avoid self-referencing objects",
      ],
      network_timeout: [
        "Check network connectivity",
        "Retry the operation after a delay",
        "Consider increasing timeout limits",
      ],
      rate_limit_exceeded: [
        "Wait before retrying the operation",
        "Implement exponential backoff strategy",
        "Check API rate limit documentation",
      ],
      memory_limit_exceeded: [
        "Reduce memory usage by processing data in chunks",
        "Clear unused variables and references",
        "Consider streaming data processing",
      ],
      unknown: [
        "Check the error message for specific details",
        "Verify input data format matches expectations",
        "Enable debug mode for more detailed error information",
        "Contact support if the issue persists",
      ],
    };

  error.recoveryActions =
    options.recoveryActions ?? defaultRecoveryActions[type];

  return error;
};

/**
 * Comprehensive edge case validation and handling
 * @private
 */
const handleEdgeCases = (
  input: unknown,
  options: TopicTransformationOptions & EdgeCaseOptions = {},
): {
  isValid: boolean;
  error?: TransformationError;
  processedInput?: unknown;
} => {
  // Handle null/undefined input
  if (input === null || input === undefined) {
    if (options.handleNullInput === "return_null") {
      return { isValid: false, processedInput: null };
    }
    if (options.handleNullInput === "return_empty") {
      return { isValid: false, processedInput: {} };
    }
    return {
      isValid: false,
      error: createTransformationError(
        "validation",
        "Input cannot be null or undefined",
        input,
        {
          severity: "high",
          expectedType: "object",
          actualType: typeof input,
        },
      ),
    };
  }

  // Check for circular references
  try {
    JSON.stringify(input);
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("circular")) {
      if (options.handleCircularRefs === "serialize") {
        try {
          const seen = new WeakSet();
          const processedInput = JSON.parse(
            JSON.stringify(input, (_key, value) => {
              if (typeof value === "object" && value !== null) {
                if (seen.has(value)) return "[Circular Reference]";
                seen.add(value);
              }
              return value;
            }),
          );
          return { isValid: true, processedInput };
        } catch {
          // Fallback if serialization fails
        }
      }
      return {
        isValid: false,
        error: createTransformationError(
          "circular_reference",
          "Input contains circular references",
          "[Circular data structure]",
          { severity: "high" },
        ),
      };
    }
  }

  // Check input size limits
  const inputSize = JSON.stringify(input).length;
  const maxSize = options.maxInputSize ?? 1000000; // 1MB default
  if (inputSize > maxSize) {
    if (options.handleOversizedInput === "truncate") {
      const truncatedInput = JSON.stringify(input).substring(0, maxSize);
      try {
        return { isValid: true, processedInput: JSON.parse(truncatedInput) };
      } catch {
        // Fallback to error if truncation breaks JSON
      }
    }
    return {
      isValid: false,
      error: createTransformationError(
        "size_limit_exceeded",
        `Input size (${inputSize} chars) exceeds limit (${maxSize} chars)`,
        input,
        {
          severity: "medium",
          context: { inputSize, maxSize },
        },
      ),
    };
  }

  return { isValid: true, processedInput: input };
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
    // Step 0: Handle edge cases and input validation
    const edgeCaseResult = handleEdgeCases(topic, options);
    if (!edgeCaseResult.isValid) {
      if (edgeCaseResult.error) {
        return {
          success: false,
          error: edgeCaseResult.error,
          metrics: options.includeMetrics
            ? {
                durationMs: performance.now() - startTime,
                inputSize: 0,
                outputSize: 0,
              }
            : undefined,
        };
      }
      // Handle special return cases (null/empty)
      topic = edgeCaseResult.processedInput;
    } else if (edgeCaseResult.processedInput !== undefined) {
      topic = edgeCaseResult.processedInput;
    }

    // Step 1: Validate input as GeneratedTopic
    const validationResult = GeneratedTopicSchema.safeParse(topic);
    if (!validationResult.success) {
      const fieldErrors = extractValidationErrors(validationResult.error);
      const friendlyErrors = createUserFriendlyErrors(fieldErrors);

      // Determine specific error type based on validation issues
      const specificErrorType = determineValidationErrorType(
        validationResult.error.issues,
      );

      return {
        success: false,
        error: createTransformationError(
          specificErrorType,
          `Invalid GeneratedTopic input: ${friendlyErrors.join("; ")}`,
          topic,
          {
            validationIssues: validationResult.error.issues,
            expectedType: "GeneratedTopic",
            actualType: typeof topic,
            context: { validationStep: "input_validation" },
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

    // Step 3: Perform transformation using base utility with fallback handling
    let transformedTopic: SaveTopicItem;
    try {
      transformedTopic = transformTopicForSaving(processedTopic);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Classify error type based on message
      const errorType = classifyTransformationError(errorMessage);

      // Handle fallback behavior for recoverable errors
      if (
        isErrorRecoverable(errorType) &&
        options.fallbackBehavior !== "strict"
      ) {
        if (options.fallbackBehavior === "skip") {
          return {
            success: false,
            error: createTransformationError(
              errorType,
              `Transformation skipped due to error: ${errorMessage}`,
              topic,
              {
                isRecoverable: false,
                context: { fallbackBehavior: "skip" },
              },
            ),
          };
        }

        if (options.fallbackBehavior === "lenient") {
          // Attempt to create a minimal valid SaveTopicItem
          const fallbackTopic = createFallbackSaveTopicItem(processedTopic);
          if (fallbackTopic) {
            const endTime = performance.now();
            return {
              success: true,
              data: fallbackTopic,
              metrics: options.includeMetrics
                ? {
                    durationMs: endTime - startTime,
                    inputSize: JSON.stringify(topic).length,
                    outputSize: JSON.stringify(fallbackTopic).length,
                  }
                : undefined,
            };
          }
        }
      }

      return {
        success: false,
        error: createTransformationError(
          errorType,
          `Transformation failed: ${errorMessage}`,
          topic,
          {
            isRecoverable: isErrorRecoverable(errorType),
            context: { originalError: errorMessage },
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
    // Step 1: Apply normalization if enabled (before validation)
    let preprocessedFormData = formData;
    if (
      options.normalizeFields &&
      typeof formData === "object" &&
      formData !== null
    ) {
      preprocessedFormData = normalizeFormData(
        formData as TopicBuilderFormData,
      );
    }

    // Step 2: Validate input as TopicBuilderFormData
    const validationResult =
      TopicBuilderFormDataSchema.safeParse(preprocessedFormData);
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

    const processedFormData = validationResult.data;

    // Step 3: Transform to backend format using the backend service transformation
    // We need to use the actual backend service transformation here
    const basePayload: BackendTopicGenerationPayload = {
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
      purpose: Array.isArray(processedFormData.purpose)
        ? processedFormData.purpose
        : [],
      purpose_other: processedFormData.purpose_other || null,
      tone: Array.isArray(processedFormData.tone) ? processedFormData.tone : [],
      tone_other: processedFormData.tone_other || null,
      notes: processedFormData.notes || null,
      additional_notes: processedFormData.notes || null,
      num_ideas: processedFormData.num_ideas || 5,
      subject: processedFormData.subject || null,
      timestamp: new Date().toISOString(),
    };

    // Step 4: Apply default values if provided
    const finalPayload: BackendTopicGenerationPayload = options.defaultValues
      ? { ...basePayload, ...options.defaultValues }
      : basePayload;

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
 * Safely extracts a string value from nested object properties
 * @private
 */
const extractStringValue = (obj: unknown, path: string): string | null => {
  try {
    if (!obj || typeof obj !== "object") return null;

    const keys = path.split(".");
    let current: unknown = obj;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return null;
      }
    }

    return typeof current === "string" ? current : null;
  } catch {
    return null;
  }
};

/**
 * Safely extracts a number value from nested object properties
 * @private
 */
const extractNumberValue = (obj: unknown, path: string): number | null => {
  try {
    if (!obj || typeof obj !== "object") return null;

    const keys = path.split(".");
    let current: unknown = obj;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return null;
      }
    }

    return typeof current === "number" ? current : null;
  } catch {
    return null;
  }
};

/**
 * Safely extracts an array value from nested object properties
 * @private
 */
const extractArrayValue = (obj: unknown, path: string): string[] | null => {
  try {
    if (!obj || typeof obj !== "object") return null;

    const keys = path.split(".");
    let current: unknown = obj;

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return null;
      }
    }

    return Array.isArray(current) ? current : null;
  } catch {
    return null;
  }
};

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
    normalized.industry = normalized.industry
      .trim()
      .toLowerCase() as TopicBuilderFormData["industry"];
  }
  if (normalized.content_type) {
    normalized.content_type = normalized.content_type
      .trim()
      .toLowerCase() as TopicBuilderFormData["content_type"];
  }
  if (normalized.audience) {
    normalized.audience = normalized.audience.map((a) => a.trim());
  }

  // Normalize array fields - remove empty strings and duplicates
  normalized.purpose = Array.from(new Set(normalized.purpose.filter(Boolean)));
  normalized.tone = Array.from(new Set(normalized.tone.filter(Boolean)));

  return normalized;
};

/**
 * Validates required backend fields and returns list of missing fields
 * @private
 */
const validateRequiredBackendFields = (
  payload: BackendTopicGenerationPayload,
): string[] => {
  const requiredFields = ["industry", "content_type", "reader_level"];
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    const value = payload[field as keyof BackendTopicGenerationPayload];
    if (!value || (typeof value === "string" && value.trim() === "")) {
      missingFields.push(field);
    }
  }

  return missingFields;
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
