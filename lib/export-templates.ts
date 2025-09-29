/**
 * Export Template Management
 *
 * Utilities for managing export templates including default configurations,
 * validation, and CRUD operations.
 */

import type {
  CsvColumn,
  CsvCustomization,
  DefaultCustomizations,
  ExportTemplate,
  JsonCustomization,
  JsonField,
  PdfCustomization,
  PdfSection,
  TemplateValidation,
} from "@/types/export-customization";

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Default CSV columns for knowledge exports
 */
const DEFAULT_CSV_COLUMNS: CsvColumn[] = [
  {
    id: "id",
    label: "ID",
    field: "id",
    type: "string",
    included: true,
    order: 1,
    formatter: "default",
  },
  {
    id: "type",
    label: "Type",
    field: "type",
    type: "string",
    included: true,
    order: 2,
    formatter: "default",
  },
  {
    id: "title",
    label: "Title",
    field: "title",
    type: "string",
    included: true,
    order: 3,
    formatter: "default",
  },
  {
    id: "content",
    label: "Content",
    field: "content",
    type: "string",
    included: true,
    order: 4,
    formatter: "truncate",
    maxLength: 200,
  },
  {
    id: "created_at",
    label: "Created At",
    field: "created_at",
    type: "date",
    included: true,
    order: 5,
    formatter: "date-iso",
  },
  {
    id: "updated_at",
    label: "Updated At",
    field: "updated_at",
    type: "date",
    included: true,
    order: 6,
    formatter: "date-iso",
  },
  {
    id: "url",
    label: "URL",
    field: "url",
    type: "string",
    included: false,
    order: 7,
    formatter: "default",
  },
  {
    id: "file_name",
    label: "File Name",
    field: "file_name",
    type: "string",
    included: false,
    order: 8,
    formatter: "default",
  },
  {
    id: "char_count",
    label: "Character Count",
    field: "char_count",
    type: "number",
    included: false,
    order: 9,
    formatter: "default",
  },
  {
    id: "word_count",
    label: "Word Count",
    field: "word_count",
    type: "number",
    included: false,
    order: 10,
    formatter: "default",
  },
];

/**
 * Default JSON fields for knowledge exports
 */
const DEFAULT_JSON_FIELDS: JsonField[] = [
  {
    id: "metadata",
    label: "Metadata",
    path: "metadata",
    type: "object",
    included: true,
    nested: [
      {
        id: "id",
        label: "ID",
        path: "metadata.id",
        type: "string",
        included: true,
      },
      {
        id: "type",
        label: "Type",
        path: "metadata.type",
        type: "string",
        included: true,
      },
      {
        id: "created_at",
        label: "Created At",
        path: "metadata.created_at",
        type: "date",
        included: true,
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    path: "content",
    type: "object",
    included: true,
    nested: [
      {
        id: "title",
        label: "Title",
        path: "content.title",
        type: "string",
        included: true,
      },
      {
        id: "body",
        label: "Body",
        path: "content.body",
        type: "string",
        included: true,
      },
      {
        id: "url",
        label: "URL",
        path: "content.url",
        type: "string",
        included: false,
      },
    ],
  },
  {
    id: "statistics",
    label: "Statistics",
    path: "statistics",
    type: "object",
    included: false,
    nested: [
      {
        id: "char_count",
        label: "Character Count",
        path: "statistics.char_count",
        type: "number",
        included: true,
      },
      {
        id: "word_count",
        label: "Word Count",
        path: "statistics.word_count",
        type: "number",
        included: true,
      },
    ],
  },
];

/**
 * Default PDF sections for knowledge exports
 */
const DEFAULT_PDF_SECTIONS: PdfSection[] = [
  {
    id: "header",
    type: "header",
    title: "Knowledge Export Report",
    included: true,
    order: 1,
    pageBreak: "none",
  },
  {
    id: "summary",
    type: "summary",
    title: "Export Summary",
    included: true,
    order: 2,
    pageBreak: "none",
  },
  {
    id: "statistics",
    type: "statistics",
    title: "Content Statistics",
    included: true,
    order: 3,
    pageBreak: "none",
  },
  {
    id: "content",
    type: "content",
    title: "Knowledge Items",
    included: true,
    order: 4,
    pageBreak: "before",
  },
  {
    id: "footer",
    type: "footer",
    title: "Export Information",
    included: true,
    order: 5,
    pageBreak: "none",
  },
];

/**
 * Default customization configurations
 */
export const DEFAULT_CUSTOMIZATIONS: DefaultCustomizations = {
  csv: {
    separator: "comma",
    encoding: "utf8",
    includeHeaders: true,
    quoteStyle: "minimal",
    escapeChar: '"',
    lineEnding: "lf",
    columns: DEFAULT_CSV_COLUMNS,
  },
  json: {
    structure: "nested",
    indentation: 2,
    includedFields: DEFAULT_JSON_FIELDS,
    arrayWrapping: true,
    nullHandling: "exclude",
    dateFormat: "iso",
    contentTruncation: {
      enabled: false,
      maxLength: 1000,
      suffix: "...",
    },
  },
  pdf: {
    layout: "portrait",
    pageSize: "a4",
    margins: {
      top: 72,
      right: 72,
      bottom: 72,
      left: 72,
    },
    typography: {
      fontFamily: "helvetica",
      fontSize: {
        title: 24,
        subtitle: 18,
        body: 12,
        caption: 10,
      },
      lineHeight: 1.4,
    },
    sections: DEFAULT_PDF_SECTIONS,
    styling: {
      primaryColor: "#1f2937",
      accentColor: "#3b82f6",
      backgroundColor: "#ffffff",
      borderStyle: "light",
    },
    includeTableOfContents: true,
    includePageNumbers: true,
  },
};

// ============================================================================
// SYSTEM TEMPLATES
// ============================================================================

/**
 * System default templates that cannot be deleted
 */
export const SYSTEM_TEMPLATES: ExportTemplate[] = [
  {
    id: "csv-standard",
    name: "Standard CSV",
    description: "Basic CSV export with essential fields",
    format: "csv",
    isDefault: true,
    isSystem: true,
    customization: DEFAULT_CUSTOMIZATIONS.csv,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    },
    tags: ["standard", "basic"],
  },
  {
    id: "csv-detailed",
    name: "Detailed CSV",
    description: "CSV export with all available fields",
    format: "csv",
    isDefault: false,
    isSystem: true,
    customization: {
      ...DEFAULT_CUSTOMIZATIONS.csv,
      columns: DEFAULT_CSV_COLUMNS.map((col) => ({ ...col, included: true })),
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    },
    tags: ["detailed", "complete"],
  },
  {
    id: "json-compact",
    name: "Compact JSON",
    description: "Minimal JSON export with essential data",
    format: "json",
    isDefault: true,
    isSystem: true,
    customization: {
      ...DEFAULT_CUSTOMIZATIONS.json,
      structure: "flat",
      indentation: 0,
      contentTruncation: {
        enabled: true,
        maxLength: 200,
        suffix: "...",
      },
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    },
    tags: ["compact", "minimal"],
  },
  {
    id: "json-structured",
    name: "Structured JSON",
    description: "Well-organized JSON with nested structure",
    format: "json",
    isDefault: false,
    isSystem: true,
    customization: DEFAULT_CUSTOMIZATIONS.json,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    },
    tags: ["structured", "organized"],
  },
  {
    id: "pdf-report",
    name: "Professional Report",
    description: "Professional PDF report with full formatting",
    format: "pdf",
    isDefault: true,
    isSystem: true,
    customization: DEFAULT_CUSTOMIZATIONS.pdf,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    },
    tags: ["professional", "report"],
  },
  {
    id: "pdf-simple",
    name: "Simple PDF",
    description: "Basic PDF export without advanced formatting",
    format: "pdf",
    isDefault: false,
    isSystem: true,
    customization: {
      ...DEFAULT_CUSTOMIZATIONS.pdf,
      sections: DEFAULT_PDF_SECTIONS.filter((section) =>
        ["header", "content"].includes(section.type),
      ),
      includeTableOfContents: false,
      styling: {
        ...DEFAULT_CUSTOMIZATIONS.pdf.styling,
        borderStyle: "none",
      },
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    },
    tags: ["simple", "basic"],
  },
];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate CSV customization
 */
export function validateCsvCustomization(
  customization: CsvCustomization,
): TemplateValidation {
  const errors: TemplateValidation["errors"] = [];
  const warnings: TemplateValidation["warnings"] = [];

  // Check if at least one column is included
  const includedColumns = customization.columns.filter((col) => col.included);
  if (includedColumns.length === 0) {
    errors.push({
      field: "columns",
      message: "At least one column must be included",
      severity: "error",
    });
  }

  // Check for duplicate column orders
  const orders = includedColumns.map((col) => col.order);
  const duplicateOrders = orders.filter(
    (order, index) => orders.indexOf(order) !== index,
  );
  if (duplicateOrders.length > 0) {
    warnings.push({
      field: "columns",
      message: "Duplicate column orders detected",
      suggestion: "Columns will be reordered automatically",
    });
  }

  // Check escape character
  if (customization.escapeChar.length !== 1) {
    errors.push({
      field: "escapeChar",
      message: "Escape character must be a single character",
      severity: "error",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate JSON customization
 */
export function validateJsonCustomization(
  customization: JsonCustomization,
): TemplateValidation {
  const errors: TemplateValidation["errors"] = [];
  const warnings: TemplateValidation["warnings"] = [];

  // Check if at least one field is included
  const hasIncludedFields = customization.includedFields.some(
    (field) => field.included,
  );
  if (!hasIncludedFields) {
    errors.push({
      field: "includedFields",
      message: "At least one field must be included",
      severity: "error",
    });
  }

  // Check content truncation settings
  if (
    customization.contentTruncation?.enabled &&
    customization.contentTruncation.maxLength <= 0
  ) {
    errors.push({
      field: "contentTruncation.maxLength",
      message: "Maximum length must be greater than 0",
      severity: "error",
    });
  }

  // Warn about large indentation
  if (customization.indentation > 4) {
    warnings.push({
      field: "indentation",
      message: "Large indentation may result in oversized files",
      suggestion: "Consider using 2 or 4 spaces for better performance",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate PDF customization
 */
export function validatePdfCustomization(
  customization: PdfCustomization,
): TemplateValidation {
  const errors: TemplateValidation["errors"] = [];
  const warnings: TemplateValidation["warnings"] = [];

  // Check if at least one section is included
  const includedSections = customization.sections.filter(
    (section) => section.included,
  );
  if (includedSections.length === 0) {
    errors.push({
      field: "sections",
      message: "At least one section must be included",
      severity: "error",
    });
  }

  // Check margin values
  const { margins } = customization;
  if (
    margins.top < 0 ||
    margins.right < 0 ||
    margins.bottom < 0 ||
    margins.left < 0
  ) {
    errors.push({
      field: "margins",
      message: "Margins cannot be negative",
      severity: "error",
    });
  }

  // Check font sizes
  const { fontSize } = customization.typography;
  if (
    fontSize.title <= fontSize.subtitle ||
    fontSize.subtitle <= fontSize.body
  ) {
    warnings.push({
      field: "typography.fontSize",
      message: "Font size hierarchy may be confusing",
      suggestion:
        "Title should be larger than subtitle, subtitle larger than body",
    });
  }

  // Check watermark opacity
  if (
    customization.watermark &&
    (customization.watermark.opacity < 0 || customization.watermark.opacity > 1)
  ) {
    errors.push({
      field: "watermark.opacity",
      message: "Watermark opacity must be between 0 and 1",
      severity: "error",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate template
 */
export function validateTemplate(template: ExportTemplate): TemplateValidation {
  const baseErrors: TemplateValidation["errors"] = [];
  const baseWarnings: TemplateValidation["warnings"] = [];

  // Check template name
  if (!template.name.trim()) {
    baseErrors.push({
      field: "name",
      message: "Template name is required",
      severity: "error",
    });
  }

  // Validate customization based on format
  let customizationValidation: TemplateValidation;
  switch (template.format) {
    case "csv":
      customizationValidation = validateCsvCustomization(
        template.customization as CsvCustomization,
      );
      break;
    case "json":
      customizationValidation = validateJsonCustomization(
        template.customization as JsonCustomization,
      );
      break;
    case "pdf":
      customizationValidation = validatePdfCustomization(
        template.customization as PdfCustomization,
      );
      break;
    default:
      customizationValidation = {
        isValid: false,
        errors: [
          {
            field: "format",
            message: "Invalid format specified",
            severity: "error",
          },
        ],
        warnings: [],
      };
  }

  return {
    isValid: baseErrors.length === 0 && customizationValidation.isValid,
    errors: [...baseErrors, ...customizationValidation.errors],
    warnings: [...baseWarnings, ...customizationValidation.warnings],
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique template ID
 */
export function generateTemplateId(): string {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get default template for format
 */
export function getDefaultTemplate(
  format: "csv" | "json" | "pdf",
): ExportTemplate {
  const defaultTemplate = SYSTEM_TEMPLATES.find(
    (template) => template.format === format && template.isDefault,
  );
  if (!defaultTemplate) {
    throw new Error(`No default template found for format: ${format}`);
  }
  return defaultTemplate;
}

/**
 * Clone template with new metadata
 */
export function cloneTemplate(
  template: ExportTemplate,
  overrides: Partial<ExportTemplate> = {},
): ExportTemplate {
  return {
    ...template,
    ...overrides,
    id: generateTemplateId(),
    isDefault: false,
    isSystem: false,
    metadata: {
      ...template.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
      lastUsed: undefined,
      ...overrides.metadata,
    },
  };
}

/**
 * Update template usage
 */
export function updateTemplateUsage(template: ExportTemplate): ExportTemplate {
  return {
    ...template,
    metadata: {
      ...template.metadata,
      usageCount: template.metadata.usageCount + 1,
      lastUsed: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}
