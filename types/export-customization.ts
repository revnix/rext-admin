/**
 * Export Customization Types
 *
 * TypeScript definitions for export format customization including
 * CSV, JSON, and PDF customization options and template management.
 */

// ============================================================================
// CSV CUSTOMIZATION
// ============================================================================

/**
 * CSV export customization options
 */
export interface CsvCustomization {
  separator: "comma" | "semicolon" | "tab" | "pipe";
  encoding: "utf8" | "utf16" | "ascii";
  includeHeaders: boolean;
  quoteStyle: "all" | "minimal" | "nonnumeric" | "none";
  escapeChar: string;
  lineEnding: "lf" | "crlf" | "cr";
  columns: CsvColumn[];
}

/**
 * CSV column configuration
 */
export interface CsvColumn {
  id: string;
  label: string;
  field: string;
  type: "string" | "number" | "date" | "boolean";
  included: boolean;
  order: number;
  formatter?:
    | "default"
    | "uppercase"
    | "lowercase"
    | "truncate"
    | "date-iso"
    | "date-local";
  maxLength?: number;
}

// ============================================================================
// JSON CUSTOMIZATION
// ============================================================================

/**
 * JSON export customization options
 */
export interface JsonCustomization {
  structure: "flat" | "nested" | "grouped";
  indentation: 0 | 2 | 4 | 8;
  includedFields: JsonField[];
  arrayWrapping: boolean;
  nullHandling: "include" | "exclude" | "empty_string";
  dateFormat: "iso" | "timestamp" | "local" | "relative";
  contentTruncation?: {
    enabled: boolean;
    maxLength: number;
    suffix: string;
  };
}

/**
 * JSON field configuration
 */
export interface JsonField {
  id: string;
  label: string;
  path: string;
  type: "string" | "number" | "boolean" | "array" | "object" | "date";
  included: boolean;
  nested?: JsonField[];
}

// ============================================================================
// PDF CUSTOMIZATION
// ============================================================================

/**
 * PDF export customization options
 */
export interface PdfCustomization {
  layout: "portrait" | "landscape";
  pageSize: "a4" | "letter" | "legal" | "a3";
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  typography: {
    fontFamily: "arial" | "helvetica" | "times" | "courier";
    fontSize: {
      title: number;
      subtitle: number;
      body: number;
      caption: number;
    };
    lineHeight: number;
  };
  sections: PdfSection[];
  styling: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    borderStyle: "none" | "light" | "medium" | "heavy";
  };
  includeTableOfContents: boolean;
  includePageNumbers: boolean;
  watermark?: {
    text: string;
    opacity: number;
    position: "center" | "corner";
  };
}

/**
 * PDF section configuration
 */
export interface PdfSection {
  id: string;
  type: "header" | "summary" | "content" | "statistics" | "footer";
  title: string;
  included: boolean;
  order: number;
  pageBreak?: "before" | "after" | "both" | "none";
}

// ============================================================================
// TEMPLATE SYSTEM
// ============================================================================

/**
 * Export template for saving/reusing configurations
 */
export interface ExportTemplate {
  id: string;
  name: string;
  description?: string;
  format: "csv" | "json" | "pdf";
  isDefault: boolean;
  isSystem: boolean; // System templates cannot be deleted
  customization: CsvCustomization | JsonCustomization | PdfCustomization;
  metadata: {
    createdAt: string;
    updatedAt: string;
    usageCount: number;
    lastUsed?: string;
  };
  tags?: string[];
}

/**
 * Template validation result
 */
export interface TemplateValidation {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: "error" | "warning";
  }>;
  warnings: Array<{
    field: string;
    message: string;
    suggestion?: string;
  }>;
}

// ============================================================================
// CUSTOMIZATION STORE STATE
// ============================================================================

/**
 * Export customization store state
 */
export interface ExportCustomizationState {
  // Templates
  templates: ExportTemplate[];
  selectedTemplate: ExportTemplate | null;

  // Current customization
  currentFormat: "csv" | "json" | "pdf";
  csvCustomization: CsvCustomization;
  jsonCustomization: JsonCustomization;
  pdfCustomization: PdfCustomization;

  // UI state
  isCustomizing: boolean;
  previewVisible: boolean;

  // Loading states
  isLoadingTemplates: boolean;
  isSavingTemplate: boolean;

  // Error handling
  error: string | null;
  validation: TemplateValidation | null;
}

/**
 * Export customization actions
 */
export interface ExportCustomizationActions {
  // Template management
  loadTemplates: () => Promise<void>;
  saveTemplate: (
    template: Omit<ExportTemplate, "id" | "metadata">,
  ) => Promise<void>;
  updateTemplate: (
    id: string,
    updates: Partial<ExportTemplate>,
  ) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  applyTemplate: (template: ExportTemplate) => void;

  // Customization management
  updateCsvCustomization: (customization: Partial<CsvCustomization>) => void;
  updateJsonCustomization: (customization: Partial<JsonCustomization>) => void;
  updatePdfCustomization: (customization: Partial<PdfCustomization>) => void;
  resetCustomization: (format: "csv" | "json" | "pdf") => void;

  // Validation
  validateCustomization: (format: "csv" | "json" | "pdf") => TemplateValidation;

  // UI actions
  setPreviewVisible: (visible: boolean) => void;
  setCustomizing: (customizing: boolean) => void;
  clearError: () => void;
}

// ============================================================================
// PREVIEW DATA
// ============================================================================

/**
 * Preview configuration for live preview
 */
export interface CustomizationPreview {
  format: "csv" | "json" | "pdf";
  sampleData: string;
  estimatedSize: number;
  itemCount: number;
  warnings?: string[];
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default customization configurations
 */
export interface DefaultCustomizations {
  csv: CsvCustomization;
  json: JsonCustomization;
  pdf: PdfCustomization;
}
