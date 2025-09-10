/**
 * TypeScript type definitions for topic adapter utility functions
 *
 * This module defines comprehensive types for transforming backend topic objects
 * to frontend TopicData objects with enhanced error handling, validation, and
 * performance optimization.
 *
 * @see /docs/field-mapping-documentation.md for detailed field mapping rules
 * @see /lib/topic-adapter-utils.ts for implementation
 */

import type { ZodIssue } from "zod";
import type { TopicData } from "./data-table";
import type { GeneratedTopic } from "./topic-builder";

// ============================================================================
// CORE TRANSFORMATION TYPES
// ============================================================================

/**
 * Result type for topic-to-topic transformations with comprehensive error handling
 */
export interface TopicAdapterResult<T> {
  success: boolean;
  data?: T;
  error?: TopicAdapterError;
  metrics?: TopicAdapterMetrics;
  warnings?: TopicAdapterWarning[];
}

/**
 * Batch transformation result for processing multiple topics
 */
export interface BatchTopicAdapterResult<T> {
  success: boolean;
  data: T[];
  errors: Array<{
    index: number;
    error: TopicAdapterError;
    originalItem: unknown;
  }>;
  metrics?: BatchTopicAdapterMetrics;
  warnings?: TopicAdapterWarning[];
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

/**
 * Comprehensive error classification for topic adapter operations
 */
export type TopicAdapterErrorType =
  | "validation_failed"
  | "field_mapping_error"
  | "type_conversion_error"
  | "missing_required_field"
  | "invalid_field_value"
  | "schema_mismatch"
  | "circular_reference"
  | "size_limit_exceeded"
  | "transformation_timeout"
  | "unknown_error";

/**
 * Detailed error information for topic adapter failures
 */
export interface TopicAdapterError extends Error {
  type: TopicAdapterErrorType;
  fieldPath?: string;
  expectedValue?: unknown;
  actualValue?: unknown;
  originalData?: unknown;
  validationIssues?: ZodIssue[];
  recoveryActions: string[];
  isRecoverable: boolean;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  context?: Record<string, unknown>;
}

/**
 * Warning information for non-critical transformation issues
 */
export interface TopicAdapterWarning {
  type: "fallback_used" | "field_defaulted" | "data_truncated" | "type_coerced";
  message: string;
  fieldPath?: string;
  originalValue?: unknown;
  transformedValue?: unknown;
  timestamp: string;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Options for single topic transformation
 */
export interface TopicToDisplayOptions {
  /** Enable automatic fixes for common data issues */
  autoFix?: boolean;

  /** Include performance metrics in result */
  includeMetrics?: boolean;

  /** Include warnings for non-critical issues */
  includeWarnings?: boolean;

  /** Fallback behavior on transformation errors */
  fallbackBehavior?: "strict" | "lenient" | "skip";

  /** Custom field mappings to override defaults */
  customFieldMappings?: Partial<TopicFieldMappings>;

  /** Default values for missing optional fields */
  defaultValues?: Partial<TopicData>;

  /** Maximum allowed input size (bytes) */
  maxInputSize?: number;

  /** Timeout for transformation (ms) */
  transformationTimeout?: number;
}

/**
 * Options for batch topic transformation
 */
export interface BatchTopicToDisplayOptions extends TopicToDisplayOptions {
  /** Continue processing on individual item errors */
  continueOnError?: boolean;

  /** Maximum concurrent transformations */
  maxConcurrency?: number;

  /** Chunk size for batch processing */
  chunkSize?: number;
}

/**
 * Custom field mapping configuration
 */
export interface TopicFieldMappings {
  name: (topic: GeneratedTopic) => string;
  description: (topic: GeneratedTopic) => string;
  category: (topic: GeneratedTopic) => string;
  status: (topic: GeneratedTopic) => string;
  priority: (topic: GeneratedTopic) => string;
  tags: (topic: GeneratedTopic) => string[];
  estimatedEffort: (topic: GeneratedTopic) => string;
  score: (topic: GeneratedTopic) => number;
  contentType: (topic: GeneratedTopic) => string;
  ranking: (topic: GeneratedTopic, index: number) => string;
}

// ============================================================================
// PERFORMANCE METRICS TYPES
// ============================================================================

/**
 * Performance metrics for single topic transformation
 */
export interface TopicAdapterMetrics {
  /** Transformation duration in milliseconds */
  durationMs: number;

  /** Input data size in bytes */
  inputSize: number;

  /** Output data size in bytes */
  outputSize: number;

  /** Number of fields successfully mapped */
  fieldsMapped: number;

  /** Number of auto-fixes applied */
  autoFixesApplied: number;

  /** Memory usage peak during transformation (if available) */
  memoryUsageKB?: number;
}

/**
 * Performance metrics for batch topic transformation
 */
export interface BatchTopicAdapterMetrics {
  /** Total processing duration in milliseconds */
  totalDurationMs: number;

  /** Average duration per item in milliseconds */
  avgDurationMs: number;

  /** Number of items successfully processed */
  successCount: number;

  /** Number of items that failed processing */
  errorCount: number;

  /** Number of warnings generated */
  warningCount: number;

  /** Processing throughput (items per second) */
  throughputPerSecond: number;

  /** Memory efficiency metrics */
  memoryMetrics?: {
    peakUsageKB: number;
    avgUsageKB: number;
    garbageCollections: number;
  };
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation context for detailed error reporting
 */
export interface ValidationContext {
  /** Current field being validated */
  fieldPath: string;

  /** Parent object context */
  parentObject: unknown;

  /** Validation step being performed */
  validationStep: "input" | "transformation" | "output";

  /** Additional context data */
  metadata?: Record<string, unknown>;
}

/**
 * Field validation result
 */
export interface FieldValidationResult {
  isValid: boolean;
  value?: unknown;
  error?: TopicAdapterError;
  warnings?: TopicAdapterWarning[];
  appliedFixes?: string[];
}

// ============================================================================
// UTILITY FUNCTION TYPES
// ============================================================================

/**
 * Function signature for field transformation utilities
 */
export type FieldTransformer<TInput, TOutput> = (
  input: TInput,
  context?: ValidationContext,
) => FieldValidationResult & { value?: TOutput };

/**
 * Function signature for validation utilities
 */
export type FieldValidator<T> = (
  value: unknown,
  context?: ValidationContext,
) => FieldValidationResult & { value?: T };

/**
 * Function signature for auto-fix utilities
 */
export type FieldAutoFixer<T> = (
  value: T,
  issues: ZodIssue[],
) => {
  fixedValue: T;
  appliedFixes: string[];
  warnings: TopicAdapterWarning[];
};

// ============================================================================
// DEBUGGING AND INSPECTION TYPES
// ============================================================================

/**
 * Debug information for transformation inspection
 */
export interface TransformationDebugInfo {
  /** Original input data */
  originalInput: GeneratedTopic;

  /** Processed input after validation */
  processedInput: GeneratedTopic;

  /** Intermediate transformation steps */
  transformationSteps: Array<{
    step: string;
    input: unknown;
    output: unknown;
    duration: number;
  }>;

  /** Final transformation result */
  finalOutput?: TopicData;

  /** Applied field mappings */
  fieldMappings: Record<
    string,
    {
      sourceField: string;
      targetField: string;
      transformer: string;
      success: boolean;
    }
  >;

  /** Performance breakdown */
  performanceBreakdown: {
    validation: number;
    transformation: number;
    postProcessing: number;
    total: number;
  };
}

/**
 * Benchmark test configuration
 */
export interface BenchmarkConfig {
  /** Number of test iterations */
  iterations: number;

  /** Dataset size for testing */
  datasetSize: number;

  /** Include memory profiling */
  profileMemory?: boolean;

  /** Include detailed timing breakdown */
  detailedTiming?: boolean;
}

/**
 * Benchmark test results
 */
export interface BenchmarkResults {
  /** Average processing time per item (ms) */
  avgProcessingTimeMs: number;

  /** Minimum processing time (ms) */
  minProcessingTimeMs: number;

  /** Maximum processing time (ms) */
  maxProcessingTimeMs: number;

  /** Standard deviation of processing times */
  standardDeviationMs: number;

  /** Processing throughput (items/second) */
  throughputPerSecond: number;

  /** Memory usage statistics */
  memoryStats?: {
    avgMemoryUsageKB: number;
    peakMemoryUsageKB: number;
    memoryEfficiency: number;
  };

  /** Success rate percentage */
  successRate: number;

  /** Error distribution */
  errorDistribution: Record<TopicAdapterErrorType, number>;
}
