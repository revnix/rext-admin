/**
 * Enhanced TypeScript Adapter Utility Functions
 *
 * This module provides comprehensive transformation utilities for converting backend
 * topic objects (GeneratedTopic) to frontend TopicData objects with robust error
 * handling, Zod validation, and performance optimization.
 *
 * @see /docs/field-mapping-documentation.md for detailed field mapping rules
 * @see /types/topic-adapter.ts for type definitions
 * @see /types/schemas.ts for Zod validation schemas
 */

import type { ZodIssue } from "zod";
import type { TopicData } from "@/types/data-table";
import {
  createUserFriendlyErrors,
  extractValidationErrors,
  GeneratedTopicSchema,
  TopicDataSchema,
} from "@/types/schemas";
import type {
  BatchTopicAdapterResult,
  BatchTopicToDisplayOptions,
  BenchmarkConfig,
  BenchmarkResults,
  TopicAdapterError,
  TopicAdapterErrorType,
  TopicAdapterMetrics,
  TopicAdapterResult,
  TopicAdapterWarning,
  TopicFieldMappings,
  TopicToDisplayOptions,
  TransformationDebugInfo,
} from "@/types/topic-adapter";
import type { GeneratedTopic } from "@/types/topic-builder";

// ============================================================================
// CORE TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Enhanced transformation from GeneratedTopic to TopicData with comprehensive error handling
 *
 * This function implements the field mapping rules documented in /docs/field-mapping-documentation.md
 * with robust validation, error recovery, and performance metrics.
 *
 * @param topic - Backend GeneratedTopic object
 * @param options - Transformation configuration options
 * @returns Comprehensive transformation result with success/error details
 *
 * @example
 * ```typescript
 * const result = transformTopicToDisplayEnhanced(topic, {
 *   autoFix: true,
 *   includeMetrics: true,
 *   fallbackBehavior: 'lenient'
 * });
 *
 * if (result.success && result.data) {
 *   console.log('Transformed topic:', result.data);
 * } else if (result.error) {
 *   console.error('Transformation failed:', result.error.message);
 *   console.log('Recovery actions:', result.error.recoveryActions);
 * }
 * ```
 */
export const transformTopicToDisplayEnhanced = (
  topic: unknown,
  options: TopicToDisplayOptions = {},
): TopicAdapterResult<TopicData> => {
  const startTime = performance.now();
  const warnings: TopicAdapterWarning[] = [];

  try {
    // Step 1: Validate input as GeneratedTopic
    const inputValidation = GeneratedTopicSchema.safeParse(topic);
    if (!inputValidation.success) {
      const fieldErrors = extractValidationErrors(inputValidation.error);
      const friendlyErrors = createUserFriendlyErrors(fieldErrors);

      return {
        success: false,
        error: createTopicAdapterError(
          "validation_failed",
          `Invalid GeneratedTopic input: ${friendlyErrors.join("; ")}`,
          topic,
          {
            validationIssues: inputValidation.error.issues,
            fieldPath: "input",
          },
        ),
        metrics: options.includeMetrics
          ? createSingleTransformationMetrics(startTime, 0, 0)
          : undefined,
      };
    }

    const validTopic = inputValidation.data;

    // Step 2: Apply automatic fixes if enabled
    let processedTopic = validTopic;
    if (options.autoFix) {
      const autoFixResult = applyAutoFixesToTopic(validTopic);
      processedTopic = autoFixResult.fixedTopic;
      warnings.push(...autoFixResult.warnings);
    }

    // Step 3: Transform fields according to mapping documentation
    const transformationResult = transformTopicFieldsToTopic(
      processedTopic,
      options,
    );

    if (!transformationResult.success) {
      return {
        success: false,
        error: transformationResult.error as TopicAdapterError,
        warnings: options.includeWarnings ? warnings : undefined,
        metrics: options.includeMetrics
          ? createSingleTransformationMetrics(
              startTime,
              JSON.stringify(topic).length,
              0,
            )
          : undefined,
      };
    }

    const topicData = transformationResult.data as TopicData;

    // Step 4: Apply default values if provided
    const finalTopicData = options.defaultValues
      ? { ...topicData, ...options.defaultValues }
      : topicData;

    // Step 5: Final validation of output
    const outputValidation = TopicDataSchema.safeParse(finalTopicData);
    if (!outputValidation.success) {
      const fieldErrors = extractValidationErrors(outputValidation.error);
      const friendlyErrors = createUserFriendlyErrors(fieldErrors);

      return {
        success: false,
        error: createTopicAdapterError(
          "validation_failed",
          `Transformed TopicData validation failed: ${friendlyErrors.join("; ")}`,
          finalTopicData,
          {
            validationIssues: outputValidation.error.issues,
            fieldPath: "output",
          },
        ),
        warnings: options.includeWarnings ? warnings : undefined,
        metrics: options.includeMetrics
          ? createSingleTransformationMetrics(
              startTime,
              JSON.stringify(topic).length,
              JSON.stringify(finalTopicData).length,
            )
          : undefined,
      };
    }

    return {
      success: true,
      data: outputValidation.data,
      warnings:
        options.includeWarnings && warnings.length > 0 ? warnings : undefined,
      metrics: options.includeMetrics
        ? createSingleTransformationMetrics(
            startTime,
            JSON.stringify(topic).length,
            JSON.stringify(outputValidation.data).length,
            warnings.filter(
              (w) => w.type === "fallback_used" || w.type === "field_defaulted",
            ).length,
          )
        : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: createTopicAdapterError(
        "unknown_error",
        error instanceof Error
          ? error.message
          : "Unexpected transformation error",
        topic,
        {
          isRecoverable: false,
          context: { originalError: String(error) },
        },
      ),
      warnings:
        options.includeWarnings && warnings.length > 0 ? warnings : undefined,
      metrics: options.includeMetrics
        ? createSingleTransformationMetrics(
            startTime,
            JSON.stringify(topic).length,
            0,
          )
        : undefined,
    };
  }
};

/**
 * Enhanced batch transformation for arrays of GeneratedTopics to TopicData
 *
 * Processes multiple topics with error recovery, performance optimization,
 * and detailed per-item error reporting.
 *
 * @param topics - Array of GeneratedTopic objects
 * @param options - Batch transformation configuration options
 * @returns Comprehensive batch transformation result
 *
 * @example
 * ```typescript
 * const result = await transformTopicsForDisplayEnhanced(topics, {
 *   continueOnError: true,
 *   maxConcurrency: 5,
 *   includeMetrics: true,
 *   autoFix: true
 * });
 *
 * console.log(`Success: ${result.data.length}/${topics.length}`);
 * console.log(`Errors: ${result.errors.length}`);
 * if (result.metrics) {
 *   console.log(`Avg duration: ${result.metrics.avgDurationMs}ms`);
 *   console.log(`Throughput: ${result.metrics.throughputPerSecond} items/sec`);
 * }
 * ```
 */
export const transformTopicsForDisplayEnhanced = async (
  topics: unknown[],
  options: BatchTopicToDisplayOptions = {},
): Promise<BatchTopicAdapterResult<TopicData>> => {
  const startTime = performance.now();
  const results: TopicData[] = [];
  const errors: BatchTopicAdapterResult<TopicData>["errors"] = [];
  const allWarnings: TopicAdapterWarning[] = [];

  // Validate input array
  if (!Array.isArray(topics)) {
    return {
      success: false,
      data: [],
      errors: [
        {
          index: 0,
          error: createTopicAdapterError(
            "validation_failed",
            "Input must be an array of topics",
            topics,
          ),
          originalItem: topics,
        },
      ],
      warnings: [],
    };
  }

  if (topics.length === 0) {
    return {
      success: true,
      data: [],
      errors: [],
      warnings: [],
      metrics: options.includeMetrics
        ? {
            totalDurationMs: performance.now() - startTime,
            avgDurationMs: 0,
            successCount: 0,
            errorCount: 0,
            warningCount: 0,
            throughputPerSecond: 0,
          }
        : undefined,
    };
  }

  // Process items with optional concurrency limiting
  const maxConcurrency = options.maxConcurrency ?? Math.min(topics.length, 10);
  const chunkSize =
    options.chunkSize ?? Math.ceil(topics.length / maxConcurrency);
  const chunks = createChunks(topics, chunkSize);

  for (const chunk of chunks) {
    // Process chunk items in parallel
    const chunkPromises = chunk.map(async (topic, chunkIndex) => {
      const globalIndex =
        chunks.slice(0, chunks.indexOf(chunk)).flat().length + chunkIndex;

      const result = transformTopicToDisplayEnhanced(topic, {
        autoFix: options.autoFix,
        includeMetrics: false, // Metrics handled at batch level
        includeWarnings: options.includeWarnings,
        customFieldMappings: options.customFieldMappings,
        defaultValues: options.defaultValues,
        fallbackBehavior: options.fallbackBehavior,
        maxInputSize: options.maxInputSize,
      });

      return { result, originalIndex: globalIndex };
    });

    const chunkResults = await Promise.all(chunkPromises);

    for (const { result, originalIndex } of chunkResults) {
      if (result.success && result.data) {
        results.push(result.data);
        if (result.warnings) {
          allWarnings.push(...result.warnings);
        }
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

  const batchResult: BatchTopicAdapterResult<TopicData> = {
    success: errors.length === 0,
    data: results,
    errors,
    warnings:
      options.includeWarnings && allWarnings.length > 0
        ? allWarnings
        : undefined,
  };

  if (options.includeMetrics) {
    batchResult.metrics = {
      totalDurationMs: totalDuration,
      avgDurationMs: totalDuration / topics.length,
      successCount: results.length,
      errorCount: errors.length,
      warningCount: allWarnings.length,
      throughputPerSecond: (topics.length * 1000) / totalDuration,
    };
  }

  return batchResult;
};

// ============================================================================
// FIELD TRANSFORMATION LOGIC
// ============================================================================

/**
 * Transforms GeneratedTopic fields to TopicData according to mapping documentation
 * @private
 */
const transformTopicFieldsToTopic = (
  topic: GeneratedTopic,
  options: TopicToDisplayOptions = {},
): TopicAdapterResult<TopicData> => {
  try {
    // Use custom mappings if provided, otherwise use default mappings
    const defaultMappings = createDefaultFieldMappings();
    const fieldMappings = options.customFieldMappings
      ? { ...defaultMappings, ...options.customFieldMappings }
      : defaultMappings;

    const topicData: TopicData = {
      // Core fields (direct mappings)
      id: topic.id,
      name: fieldMappings.name(topic),
      description: fieldMappings.description(topic),
      category: fieldMappings.category(topic),
      status: fieldMappings.status(topic),
      priority: fieldMappings.priority(topic),
      source: "AI Generated", // Always constant per documentation
      tags: fieldMappings.tags(topic),
      assignee: "AI Assistant", // Always constant per documentation
      estimatedEffort: fieldMappings.estimatedEffort(topic),

      // Timestamp fields
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),

      // Optional enhanced fields
      score: fieldMappings.score(topic),
      ranking: undefined, // Set by caller with index information
      updated: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      author: "AI Assistant", // Always constant per documentation
      contentType: fieldMappings.contentType(topic),
    };

    return {
      success: true,
      data: topicData,
    };
  } catch (error) {
    return {
      success: false,
      error: createTopicAdapterError(
        "field_mapping_error",
        error instanceof Error ? error.message : "Field mapping failed",
        topic,
        {
          isRecoverable: true,
        },
      ),
    };
  }
};

/**
 * Creates default field mapping functions based on documentation
 * @private
 */
const createDefaultFieldMappings = (): TopicFieldMappings => {
  return {
    name: (topic: GeneratedTopic) => topic.title,

    description: (topic: GeneratedTopic) => {
      const parts: string[] = [];

      if (topic.angle) {
        parts.push(topic.angle);
      }

      if (topic.description) {
        parts.push(topic.description);
      }

      if (parts.length === 0) {
        parts.push("AI-generated topic topic");
      }

      return parts.join(" • ");
    },

    category: (topic: GeneratedTopic) => {
      // Primary category from first tag
      if (topic.tags && topic.tags.length > 0) {
        const primaryTag = topic.tags[0];
        return (
          primaryTag.charAt(0).toUpperCase() + primaryTag.slice(1).toLowerCase()
        );
      }

      // Fallback to channel fit if no tags
      if (topic.channel_fit && topic.channel_fit.length > 0) {
        const channel = topic.channel_fit[0];
        return `${channel.charAt(0).toUpperCase() + channel.slice(1)} Content`;
      }

      return "General";
    },

    status: (topic: GeneratedTopic) => {
      if (topic._isBeingSaved) return "saving";
      if (topic.is_saved || topic._optimisticSaved) return "saved";
      return "generated";
    },

    priority: (topic: GeneratedTopic) => {
      if (!topic.scores || typeof topic.scores !== "object") return "medium";

      const { relevance = 0, trend_level = 0, uniqueness = 0 } = topic.scores;

      // Weighted priority calculation - relevance is most important
      const weightedScore =
        relevance * 0.5 + trend_level * 0.3 + uniqueness * 0.2;

      if (weightedScore >= 0.8) return "high";
      if (weightedScore >= 0.6) return "medium";
      return "low";
    },

    tags: (topic: GeneratedTopic) => {
      const allTags = new Set<string>();

      // Add topic tags
      if (topic.tags && Array.isArray(topic.tags)) {
        for (const tag of topic.tags) {
          allTags.add(tag);
        }
      }

      // Add channel fit as tags
      if (topic.channel_fit && Array.isArray(topic.channel_fit)) {
        for (const channel of topic.channel_fit.slice(0, 2)) {
          allTags.add(`channel:${channel}`);
        }
      }

      // Add audience fit as tags (limit to avoid clutter)
      if (topic.audience_fit && Array.isArray(topic.audience_fit)) {
        for (const audience of topic.audience_fit.slice(0, 2)) {
          allTags.add(`audience:${audience}`);
        }
      }

      return Array.from(allTags).slice(0, 8); // Limit total tags
    },

    estimatedEffort: (topic: GeneratedTopic) => {
      if (!topic.scores || typeof topic.scores !== "object") return "Medium";

      const { uniqueness = 0.5 } = topic.scores;

      // Higher uniqueness = more effort required
      if (uniqueness >= 0.8) return "High";
      if (uniqueness >= 0.4) return "Medium";
      return "Low";
    },

    score: (topic: GeneratedTopic) => {
      if (!topic.scores || typeof topic.scores !== "object") return 50;

      const { relevance = 0, trend_level = 0, uniqueness = 0 } = topic.scores;

      // Weighted scoring - relevance is most important
      const weightedScore =
        relevance * 0.5 + trend_level * 0.3 + uniqueness * 0.2;

      return Math.round(weightedScore * 100);
    },

    contentType: (topic: GeneratedTopic) => {
      if (
        !topic.channel_fit ||
        !Array.isArray(topic.channel_fit) ||
        topic.channel_fit.length === 0
      ) {
        return "General Content";
      }

      const primaryChannel = topic.channel_fit[0].toLowerCase();

      const channelMap: Record<string, string> = {
        blog: "Blog Post",
        social: "Social Media",
        video: "Video Content",
        youtube: "Video Content",
        email: "Newsletter",
        website: "Web Content",
        podcast: "Podcast",
        infographic: "Infographic",
        linkedin: "Professional Content",
        twitter: "Social Media",
        facebook: "Social Media",
        instagram: "Visual Content",
        tiktok: "Short Form Video",
      };

      // Find matching channel type
      for (const [key, value] of Object.entries(channelMap)) {
        if (primaryChannel.includes(key)) {
          return value;
        }
      }

      // Format the channel name as fallback
      return `${primaryChannel.charAt(0).toUpperCase() + primaryChannel.slice(1)} Content`;
    },

    ranking: (_topic: GeneratedTopic, index: number) => `#${index + 1}`,
  };
};

// ============================================================================
// AUTO-FIX AND ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Applies automatic fixes to GeneratedTopic objects
 * @private
 */
const applyAutoFixesToTopic = (
  topic: GeneratedTopic,
): { fixedTopic: GeneratedTopic; warnings: TopicAdapterWarning[] } => {
  const fixed: GeneratedTopic = { ...topic };
  const warnings: TopicAdapterWarning[] = [];

  // Fix empty required arrays by adding defaults
  if (fixed.channel_fit.length === 0) {
    fixed.channel_fit = ["blog", "social-media"];
    warnings.push(
      createTopicAdapterWarning(
        "field_defaulted",
        "Empty channel_fit array populated with default values",
        "channel_fit",
        [],
        fixed.channel_fit,
      ),
    );
  }

  if (fixed.audience_fit.length === 0) {
    fixed.audience_fit = ["general-audience"];
    warnings.push(
      createTopicAdapterWarning(
        "field_defaulted",
        "Empty audience_fit array populated with default values",
        "audience_fit",
        [],
        fixed.audience_fit,
      ),
    );
  }

  if (fixed.tags.length === 0) {
    fixed.tags = ["content", "topic"];
    warnings.push(
      createTopicAdapterWarning(
        "field_defaulted",
        "Empty tags array populated with default values",
        "tags",
        [],
        fixed.tags,
      ),
    );
  }

  // Ensure scores are within valid range (0-100)
  const originalScores = { ...fixed.scores };
  fixed.scores = {
    relevance: Math.max(0, Math.min(1, fixed.scores.relevance)),
    seo_potential: Math.max(0, Math.min(1, fixed.scores.seo_potential)),
    trend_level: Math.max(0, Math.min(1, fixed.scores.trend_level)),
    uniqueness: Math.max(0, Math.min(1, fixed.scores.uniqueness)),
    reader_interest: Math.max(0, Math.min(1, fixed.scores.reader_interest)),
    actionable_potential: Math.max(
      0,
      Math.min(1, fixed.scores.actionable_potential),
    ),
    brand_alignment: Math.max(0, Math.min(1, fixed.scores.brand_alignment)),
    controversy: Math.max(0, Math.min(1, fixed.scores.controversy)),
  };

  // Check if scores were clamped
  if (
    originalScores.relevance !== fixed.scores.relevance ||
    originalScores.seo_potential !== fixed.scores.seo_potential ||
    originalScores.trend_level !== fixed.scores.trend_level ||
    originalScores.uniqueness !== fixed.scores.uniqueness ||
    originalScores.reader_interest !== fixed.scores.reader_interest ||
    originalScores.actionable_potential !== fixed.scores.actionable_potential ||
    originalScores.brand_alignment !== fixed.scores.brand_alignment ||
    originalScores.controversy !== fixed.scores.controversy
  ) {
    warnings.push(
      createTopicAdapterWarning(
        "data_truncated",
        "Scores clamped to valid range (0-100)",
        "scores",
        originalScores,
        fixed.scores,
      ),
    );
  }

  // Trim and limit text fields
  const originalTitle = fixed.title;
  const originalAngle = fixed.angle;

  fixed.title = fixed.title.trim().substring(0, 200);
  fixed.angle = fixed.angle.trim().substring(0, 500);
  fixed.why_it_works = fixed.why_it_works.trim();

  if (originalTitle !== fixed.title) {
    warnings.push(
      createTopicAdapterWarning(
        "data_truncated",
        "Title truncated to maximum length (200 characters)",
        "title",
        originalTitle,
        fixed.title,
      ),
    );
  }

  if (originalAngle !== fixed.angle) {
    warnings.push(
      createTopicAdapterWarning(
        "data_truncated",
        "Angle truncated to maximum length (500 characters)",
        "angle",
        originalAngle,
        fixed.angle,
      ),
    );
  }

  return { fixedTopic: fixed, warnings };
};

/**
 * Creates a TopicAdapterError with comprehensive details
 * @private
 */
const createTopicAdapterError = (
  type: TopicAdapterErrorType,
  message: string,
  originalData?: unknown,
  options: {
    fieldPath?: string;
    expectedValue?: unknown;
    actualValue?: unknown;
    validationIssues?: ZodIssue[];
    isRecoverable?: boolean;
    context?: Record<string, unknown>;
  } = {},
): TopicAdapterError => {
  const error = new Error(message) as TopicAdapterError;
  error.type = type;
  error.fieldPath = options.fieldPath;
  error.expectedValue = options.expectedValue;
  error.actualValue = options.actualValue;
  error.originalData = originalData;
  error.validationIssues = options.validationIssues;
  error.timestamp = new Date().toISOString();
  error.context = options.context;

  // Determine if error is recoverable
  const recoverableErrors: TopicAdapterErrorType[] = [
    "validation_failed",
    "field_mapping_error",
    "type_conversion_error",
    "missing_required_field",
    "invalid_field_value",
  ];
  error.isRecoverable =
    options.isRecoverable ?? recoverableErrors.includes(type);

  // Determine severity
  const severityMap: Record<
    TopicAdapterErrorType,
    TopicAdapterError["severity"]
  > = {
    validation_failed: "high",
    field_mapping_error: "medium",
    type_conversion_error: "medium",
    missing_required_field: "high",
    invalid_field_value: "medium",
    schema_mismatch: "high",
    circular_reference: "high",
    size_limit_exceeded: "medium",
    transformation_timeout: "low",
    unknown_error: "critical",
  };
  error.severity = severityMap[type];

  // Generate recovery actions
  const recoveryActionsMap: Record<TopicAdapterErrorType, string[]> = {
    validation_failed: [
      "Verify all required fields are present and valid",
      "Check field types match the expected schema",
      "Ensure arrays are not empty where required",
    ],
    field_mapping_error: [
      "Review custom field mapping functions for errors",
      "Use default field mappings as fallback",
      "Verify source fields exist in the topic object",
    ],
    type_conversion_error: [
      "Check field value types match expected formats",
      "Use type coercion or conversion utilities",
      "Provide default values for invalid fields",
    ],
    missing_required_field: [
      "Add the missing field to the topic object",
      "Use default values for missing optional fields",
      "Check field name spelling and casing",
    ],
    invalid_field_value: [
      "Validate field values meet constraints",
      "Use validation utilities to check field formats",
      "Apply auto-fix to correct common issues",
    ],
    schema_mismatch: [
      "Update schema to match data structure",
      "Transform data to match expected schema",
      "Use schema migration utilities",
    ],
    circular_reference: [
      "Remove circular references from the object",
      "Use serialization utilities to handle cycles",
      "Restructure data to avoid self-references",
    ],
    size_limit_exceeded: [
      "Reduce data size or split into smaller chunks",
      "Use data compression techniques",
      "Increase size limits if appropriate",
    ],
    transformation_timeout: [
      "Increase transformation timeout limits",
      "Optimize transformation logic for performance",
      "Process data in smaller batches",
    ],
    unknown_error: [
      "Check error logs for more details",
      "Verify input data format is correct",
      "Contact support if the issue persists",
    ],
  };

  error.recoveryActions = recoveryActionsMap[type];

  return error;
};

/**
 * Creates a TopicAdapterWarning for non-critical issues
 * @private
 */
const createTopicAdapterWarning = (
  type: TopicAdapterWarning["type"],
  message: string,
  fieldPath?: string,
  originalValue?: unknown,
  transformedValue?: unknown,
): TopicAdapterWarning => {
  return {
    type,
    message,
    fieldPath,
    originalValue,
    transformedValue,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Creates performance metrics for single transformation
 * @private
 */
const createSingleTransformationMetrics = (
  startTime: number,
  inputSize: number,
  outputSize: number,
  autoFixesApplied: number = 0,
): TopicAdapterMetrics => {
  const endTime = performance.now();

  return {
    durationMs: endTime - startTime,
    inputSize,
    outputSize,
    fieldsMapped: 16, // Based on TopicData interface field count
    autoFixesApplied,
  };
};

/**
 * Creates chunks from an array for batch processing
 * @private
 */
const createChunks = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// ============================================================================
// DEBUGGING AND PERFORMANCE UTILITIES
// ============================================================================

/**
 * Creates detailed debug information for transformation inspection
 *
 * @param topic - Original topic input
 * @param result - Transformation result
 * @returns Comprehensive debug information
 */
export const createTransformationDebugInfo = (
  topic: GeneratedTopic,
  result: TopicAdapterResult<TopicData>,
): TransformationDebugInfo => {
  const _fieldMappings = createDefaultFieldMappings();

  return {
    originalInput: topic,
    processedInput: topic, // Would include auto-fix results in real implementation
    transformationSteps: [
      {
        step: "Input Validation",
        input: topic,
        output: result.success ? "Valid" : "Invalid",
        duration: result.metrics?.durationMs || 0,
      },
      {
        step: "Field Transformation",
        input: topic,
        output: result.data || result.error,
        duration: result.metrics?.durationMs || 0,
      },
    ],
    finalOutput: result.data,
    fieldMappings: {
      name: {
        sourceField: "title",
        targetField: "name",
        transformer: "direct",
        success: !!result.data?.name,
      },
      description: {
        sourceField: "angle + description",
        targetField: "description",
        transformer: "enhanced",
        success: !!result.data?.description,
      },
      category: {
        sourceField: "tags[0] || channel_fit[0]",
        targetField: "category",
        transformer: "conditional",
        success: !!result.data?.category,
      },
      status: {
        sourceField: "_isBeingSaved || is_saved || _optimisticSaved",
        targetField: "status",
        transformer: "conditional",
        success: !!result.data?.status,
      },
      priority: {
        sourceField: "scores",
        targetField: "priority",
        transformer: "calculated",
        success: !!result.data?.priority,
      },
      tags: {
        sourceField: "tags + channel_fit + audience_fit",
        targetField: "tags",
        transformer: "enhanced",
        success: !!result.data?.tags,
      },
    },
    performanceBreakdown: {
      validation: (result.metrics?.durationMs || 0) * 0.2,
      transformation: (result.metrics?.durationMs || 0) * 0.6,
      postProcessing: (result.metrics?.durationMs || 0) * 0.2,
      total: result.metrics?.durationMs || 0,
    },
  };
};

/**
 * Benchmarks transformation performance with a dataset
 *
 * @param topics - Array of topics to benchmark
 * @param config - Benchmark configuration
 * @returns Comprehensive performance results
 */
export const benchmarkTopicTransformations = async (
  topics: GeneratedTopic[],
  config: BenchmarkConfig = { iterations: 5, datasetSize: topics.length },
): Promise<BenchmarkResults> => {
  const durations: number[] = [];
  const errorCounts: Record<TopicAdapterErrorType, number> = {} as Record<
    TopicAdapterErrorType,
    number
  >;
  let successCount = 0;

  for (let i = 0; i < config.iterations; i++) {
    const startTime = performance.now();

    const result = await transformTopicsForDisplayEnhanced(topics, {
      includeMetrics: true,
      continueOnError: true,
    });

    const endTime = performance.now();
    durations.push(endTime - startTime);

    successCount += result.data.length;

    // Count error types
    for (const errorItem of result.errors) {
      const errorType = errorItem.error.type;
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    }
  }

  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const totalItems = topics.length * config.iterations;

  return {
    avgProcessingTimeMs: avgDuration / topics.length,
    minProcessingTimeMs: Math.min(...durations) / topics.length,
    maxProcessingTimeMs: Math.max(...durations) / topics.length,
    standardDeviationMs: calculateStandardDeviation(
      durations.map((d) => d / topics.length),
    ),
    throughputPerSecond:
      (totalItems * 1000) / (avgDuration * config.iterations),
    successRate: (successCount / totalItems) * 100,
    errorDistribution: errorCounts,
  };
};

/**
 * Calculates standard deviation for performance metrics
 * @private
 */
const calculateStandardDeviation = (values: number[]): number => {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDifferences = values.map((value) => (value - mean) ** 2);
  const avgSquaredDiff =
    squaredDifferences.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
};

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================================

/**
 * Legacy wrapper for backward compatibility with existing code
 * @deprecated Use transformTopicToDisplayEnhanced instead
 */
export const safeTransformTopicToDisplay = (
  topic: GeneratedTopic,
): TopicData | null => {
  const result = transformTopicToDisplayEnhanced(topic);
  return result.success && result.data ? result.data : null;
};

/**
 * Legacy wrapper for batch transformations
 * @deprecated Use transformTopicsForDisplayEnhanced instead
 */
export const safeTransformTopicsForDisplay = async (
  topics: GeneratedTopic[],
): Promise<TopicData[]> => {
  const result = await transformTopicsForDisplayEnhanced(topics, {
    continueOnError: true,
  });
  return result.data;
};
