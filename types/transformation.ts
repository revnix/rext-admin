/**
 * Enhanced Transformation Types and Interfaces
 *
 * This module defines comprehensive types for transformation utilities,
 * error handling, and performance metrics for data transformation operations.
 *
 * @see /lib/transformation-utils.ts for implementation utilities
 * @see /types/schemas.ts for basic transformation helpers and Zod schemas
 */

import type { z } from "zod";
import type { BackendTopicGenerationPayload } from "./backend";

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

/**
 * Comprehensive transformation error structure with recovery suggestions
 */
export interface TransformationError extends Error {
  /** Error type for classification */
  type:
    | "validation"
    | "conversion"
    | "missing_field"
    | "type_mismatch"
    | "field_required"
    | "array_empty"
    | "schema_mismatch"
    | "size_limit_exceeded"
    | "circular_reference"
    | "network_timeout"
    | "rate_limit_exceeded"
    | "memory_limit_exceeded"
    | "unknown";
  /** Original input data that caused the error */
  originalData?: unknown;
  /** Field path where the error occurred */
  fieldPath?: string;
  /** Suggested recovery actions */
  recoveryActions: string[];
  /** Whether the error is recoverable with data fixes */
  isRecoverable: boolean;
  /** Detailed validation issues if applicable */
  validationIssues?: z.ZodIssue[];
  /** Expected data type/format */
  expectedType?: string;
  /** Actual received data type/format */
  actualType?: string;
  /** Additional contextual information */
  context?: Record<string, unknown>;
  /** Error severity level */
  severity?: "low" | "medium" | "high" | "critical";
  /** Timestamp when error occurred */
  timestamp?: string;
}

/**
 * Performance metrics for transformation operations
 */
export interface TransformationMetrics {
  /** Transformation duration in milliseconds */
  durationMs: number;
  /** Size of input data */
  inputSize: number;
  /** Size of output data */
  outputSize: number;
}

/**
 * Result of a transformation operation with success/error details
 */
export interface TransformationResult<T> {
  /** Whether the transformation succeeded */
  success: boolean;
  /** Transformed data (only present if success=true) */
  data?: T;
  /** Error details (only present if success=false) */
  error?: TransformationError;
  /** Performance metrics */
  metrics?: TransformationMetrics;
}

/**
 * Batch transformation metrics for arrays
 */
export interface BatchTransformationMetrics {
  /** Total processing time in milliseconds */
  totalDurationMs: number;
  /** Number of successful transformations */
  successCount: number;
  /** Number of failed transformations */
  errorCount: number;
  /** Average transformation time per item */
  avgDurationMs: number;
}

/**
 * Batch transformation result for arrays
 */
export interface BatchTransformationResult<T> {
  /** Whether the entire batch succeeded */
  success: boolean;
  /** Successfully transformed items */
  data: T[];
  /** Errors for failed items with their original indices */
  errors: Array<{
    index: number;
    error: TransformationError;
    originalItem: unknown;
  }>;
  /** Performance metrics for the entire batch */
  metrics?: BatchTransformationMetrics;
}

// ============================================================================
// TRANSFORMATION OPTIONS
// ============================================================================

/**
 * Options for enhanced topic transformation
 */
export interface TopicTransformationOptions {
  /** Whether to attempt automatic field fixes */
  autoFix?: boolean;
  /** Whether to include performance metrics */
  includeMetrics?: boolean;
  /** Custom field mappings to override defaults */
  customMappings?: Record<string, string>;
  /** Maximum input size allowed (in characters) */
  maxInputSize?: number;
  /** Maximum processing time allowed (in milliseconds) */
  timeoutMs?: number;
  /** Fallback behavior for recoverable errors */
  fallbackBehavior?: "strict" | "lenient" | "skip";
  /** Whether to enable detailed error context */
  enableDetailedErrors?: boolean;
  /** Whether to sanitize sensitive data in error logs */
  sanitizeLogs?: boolean;
}

/**
 * Options for batch transformation operations
 */
export interface BatchTransformationOptions extends TopicTransformationOptions {
  /** Whether to continue processing after individual item errors */
  continueOnError?: boolean;
  /** Maximum number of concurrent transformations */
  maxConcurrency?: number;
}

/**
 * Options for form data transformation
 */
export interface FormDataTransformationOptions {
  /** Whether to validate required fields strictly */
  validateRequired?: boolean;
  /** Whether to normalize field values */
  normalizeFields?: boolean;
  /** Whether to include performance metrics */
  includeMetrics?: boolean;
  /** Default values for missing optional fields */
  defaultValues?: Partial<BackendTopicGenerationPayload>;
}

/**
 * Options for creating transformation errors
 */
export interface TransformationErrorOptions {
  fieldPath?: string;
  recoveryActions?: string[];
  isRecoverable?: boolean;
  validationIssues?: z.ZodIssue[];
  expectedType?: string;
  actualType?: string;
  context?: Record<string, unknown>;
  severity?: "low" | "medium" | "high" | "critical";
  constraints?: string[];
}

/**
 * Edge case handling options
 */
export interface EdgeCaseOptions {
  /** How to handle null/undefined input */
  handleNullInput?: "error" | "return_null" | "return_empty";
  /** How to handle circular references */
  handleCircularRefs?: "error" | "serialize" | "remove";
  /** How to handle oversized input */
  handleOversizedInput?: "error" | "truncate" | "compress";
  /** How to handle memory limits */
  handleMemoryLimits?: "error" | "chunk" | "stream";
  /** Maximum retry attempts for recoverable errors */
  maxRetryAttempts?: number;
  /** Delay between retry attempts (in ms) */
  retryDelayMs?: number;
}

// ============================================================================
// PERFORMANCE BENCHMARKING TYPES
// ============================================================================

/**
 * Performance benchmark results
 */
export interface BenchmarkResult {
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  throughputPerSecond: number;
  memoryUsageKB?: number;
}

/**
 * Benchmark configuration options
 */
export interface BenchmarkOptions {
  /** Number of benchmark iterations */
  iterations?: number;
  /** Whether to include memory usage metrics */
  includeMemory?: boolean;
  /** Whether to warm up before benchmarking */
  warmup?: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for transformation error types
 */
export type TransformationErrorType = TransformationError["type"];

/**
 * Type for transformation result that can be either success or failure
 */
export type AnyTransformationResult<T> =
  | (TransformationResult<T> & { success: true; data: T })
  | (TransformationResult<T> & { success: false; error: TransformationError });

/**
 * Type for batch transformation result that can be either success or failure
 */
export type AnyBatchTransformationResult<T> =
  | (BatchTransformationResult<T> & { success: true })
  | (BatchTransformationResult<T> & { success: false });

/**
 * Generic transformation function type
 */
export type TransformationFunction<TInput, TOutput> = (
  input: TInput,
  options?: Record<string, unknown>,
) => TransformationResult<TOutput>;

/**
 * Batch transformation function type
 */
export type BatchTransformationFunction<TInput, TOutput> = (
  inputs: TInput[],
  options?: Record<string, unknown>,
) => Promise<BatchTransformationResult<TOutput>>;
