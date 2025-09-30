/**
 * Export Types and Interfaces
 *
 * TypeScript definitions for knowledge export functionality including
 * export formats, options, and data structures.
 */

import type {
  CsvCustomization,
  ExportTemplate,
  JsonCustomization,
  PdfCustomization,
} from "./export-customization";
import type { FileKnowledge, TextKnowledge, WebKnowledge } from "./workspace";

// ============================================================================
// EXPORT TYPES
// ============================================================================

/**
 * Supported export formats
 */
export type ExportFormat = "json" | "csv" | "pdf";

/**
 * Knowledge types available for export
 */
export type ExportKnowledgeType = "web" | "file" | "text" | "all";

/**
 * Export scope - individual item or bulk selection
 */
export type ExportScope = "single" | "selected" | "all" | "filtered";

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

/**
 * Configuration options for export operations
 */
export interface ExportOptions {
  format: ExportFormat;
  knowledgeTypes: ExportKnowledgeType[];
  scope: ExportScope;
  includeMetadata: boolean;
  includeContent: boolean;
  includeStats: boolean; // char/word counts
  dateRange?: {
    start: string;
    end: string;
  };
  selectedIds?: string[];
  maxItems?: number; // limit for large exports

  // Format customization options
  customization?: {
    csv?: CsvCustomization;
    json?: JsonCustomization;
    pdf?: PdfCustomization;
  };

  // Template configuration
  template?: ExportTemplate;
  useCustomization?: boolean;
}

/**
 * Export filter options
 */
export interface ExportFilters {
  searchQuery?: string;
  statusFilter?: string;
  typeFilter?: string;
  tagFilter?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

// ============================================================================
// EXPORT DATA STRUCTURES
// ============================================================================

/**
 * Complete export data package
 */
export interface ExportData {
  metadata: {
    workspace: {
      id: string;
      title: string;
      url: string;
    };
    export: {
      format: ExportFormat;
      timestamp: string;
      totalItems: number;
      options: ExportOptions;
    };
  };
  data: {
    web?: WebKnowledge[];
    file?: FileKnowledge[];
    text?: TextKnowledge[];
  };
}

/**
 * Simplified export item for CSV/basic formats
 */
export interface ExportItem {
  id: string;
  type: "web" | "file" | "text";
  title: string;
  content?: string;
  url?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  tags?: string[];
  charCount?: number;
  wordCount?: number;
  status?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// EXPORT PROGRESS & STATUS
// ============================================================================

/**
 * Export operation progress tracking
 */
export interface ExportProgress {
  id: string;
  status:
    | "preparing"
    | "processing"
    | "generating"
    | "completed"
    | "failed"
    | "cancelled";
  progress: number; // 0-100
  totalItems: number;
  processedItems: number;
  currentItem?: string;
  error?: string;
  startTime: number;
  estimatedTimeRemaining?: number;
}

/**
 * Export result after completion
 */
export interface ExportResult {
  success: boolean;
  fileName: string;
  fileSize: number;
  downloadUrl?: string;
  error?: string;
  duration: number;
  itemCount: number;
}

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

/**
 * Export format specific configuration
 */
export interface ExportFormatConfig {
  format: ExportFormat;
  mimeType: string;
  fileExtension: string;
  maxSize?: number; // in bytes
  features: {
    supportsImages: boolean;
    supportsFormatting: boolean;
    supportsMetadata: boolean;
    supportsBulkExport: boolean;
  };
}

/**
 * Default export configurations
 */
export const EXPORT_FORMATS: Record<ExportFormat, ExportFormatConfig> = {
  json: {
    format: "json",
    mimeType: "application/json",
    fileExtension: "json",
    features: {
      supportsImages: false,
      supportsFormatting: false,
      supportsMetadata: true,
      supportsBulkExport: true,
    },
  },
  csv: {
    format: "csv",
    mimeType: "text/csv",
    fileExtension: "csv",
    maxSize: 50 * 1024 * 1024, // 50MB limit for CSV
    features: {
      supportsImages: false,
      supportsFormatting: false,
      supportsMetadata: true,
      supportsBulkExport: true,
    },
  },
  pdf: {
    format: "pdf",
    mimeType: "application/pdf",
    fileExtension: "pdf",
    maxSize: 100 * 1024 * 1024, // 100MB limit for PDF
    features: {
      supportsImages: true,
      supportsFormatting: true,
      supportsMetadata: true,
      supportsBulkExport: true,
    },
  },
};

// ============================================================================
// EXPORT VALIDATION
// ============================================================================

/**
 * Validation result for export operations
 */
export interface ExportValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  estimatedSize?: number;
  estimatedDuration?: number;
}
