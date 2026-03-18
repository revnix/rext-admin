/**
 * Export Utility Functions
 *
 * Comprehensive utilities for exporting knowledge data in various formats
 * including JSON, CSV, and PDF with filtering and formatting support.
 */

import type {
  ExportData,
  ExportFilters,
  ExportItem,
  ExportOptions,
  ExportResult,
  ExportValidation,
} from "@/types/export";
import type {
  CsvColumn,
  CsvCustomization,
  JsonCustomization,
} from "@/types/export-customization";
import type {
  FileKnowledge,
  TextKnowledge,
  WebKnowledge,
  Workspace,
} from "@/types/workspace";

// ============================================================================
// DATA FILTERING AND TRANSFORMATION
// ============================================================================

/**
 * Filter knowledge items based on export filters
 */
export function filterKnowledgeItems<
  T extends WebKnowledge | FileKnowledge | TextKnowledge,
>(items: T[], filters: ExportFilters): T[] {
  return items.filter((item) => {
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [
        "title" in item ? item.title : "",
        "url" in item ? item.url : "",
        "file_name" in item ? item.file_name : "",
        "name" in item ? item.name : "",
        "content" in item ? item.content : "",
        "extracted_text" in item ? item.extracted_text : "",
      ]
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    // Status filter
    if (filters.statusFilter && "status" in item) {
      if (item.status !== filters.statusFilter) {
        return false;
      }
    }

    // Type filter (for file knowledge)
    if (filters.typeFilter && "type" in item) {
      if (item.type !== filters.typeFilter) {
        return false;
      }
    }

    // Tag filter (for text knowledge)
    if (filters.tagFilter && filters.tagFilter.length > 0 && "tags" in item) {
      const itemTags = item.tags || [];
      const hasMatchingTag = filters.tagFilter.some((filterTag) =>
        itemTags.some((itemTag) =>
          itemTag.toLowerCase().includes(filterTag.toLowerCase()),
        ),
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const itemDate = new Date(item.created_at);
      if (
        filters.dateRange.start &&
        itemDate < new Date(filters.dateRange.start)
      ) {
        return false;
      }
      if (filters.dateRange.end && itemDate > new Date(filters.dateRange.end)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Transform knowledge items to unified export format
 */
export function transformToExportItems(
  webItems: WebKnowledge[] = [],
  fileItems: FileKnowledge[] = [],
  textItems: TextKnowledge[] = [],
  options: ExportOptions,
): ExportItem[] {
  const exportItems: ExportItem[] = [];

  // Transform web knowledge
  if (
    options.knowledgeTypes.includes("web") ||
    options.knowledgeTypes.includes("all")
  ) {
    webItems.forEach((item) => {
      exportItems.push({
        id: item.id,
        type: "web",
        title: item.title || "Untitled Web Resource",
        content: options.includeContent ? item.content : undefined,
        url: item.url,
        charCount: options.includeStats ? item.char_count : undefined,
        wordCount: options.includeStats ? item.word_count : undefined,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      });
    });
  }

  // Transform file knowledge
  if (
    options.knowledgeTypes.includes("file") ||
    options.knowledgeTypes.includes("all")
  ) {
    fileItems.forEach((item) => {
      exportItems.push({
        id: item.id,
        type: "file",
        title: item.name || "Untitled File",
        content: options.includeContent ? item.content : undefined,
        fileName: item.name,
        fileType: item.type,
        fileSize: item.size,
        charCount: options.includeStats ? item.char_count : undefined,
        wordCount: options.includeStats ? item.word_count : undefined,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      });
    });
  }

  // Transform text knowledge
  if (
    options.knowledgeTypes.includes("text") ||
    options.knowledgeTypes.includes("all")
  ) {
    textItems.forEach((item) => {
      exportItems.push({
        id: item.id,
        type: "text",
        title: item.title || "Untitled Text",
        content: options.includeContent ? item.content : undefined,
        tags: item.tags,
        charCount: options.includeStats ? item.char_count : undefined,
        wordCount: options.includeStats ? item.word_count : undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      });
    });
  }

  // Sort by creation date (newest first)
  exportItems.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Apply item limit if specified
  if (options.maxItems && options.maxItems > 0) {
    return exportItems.slice(0, options.maxItems);
  }

  return exportItems;
}

// ============================================================================
// JSON EXPORT
// ============================================================================

/**
 * Generate JSON export data
 */
export function generateJsonExport(
  workspace: Workspace,
  webItems: WebKnowledge[],
  fileItems: FileKnowledge[],
  textItems: TextKnowledge[],
  options: ExportOptions,
): ExportData {
  const exportData: ExportData = {
    metadata: {
      workspace: {
        id: workspace.id,
        title: workspace.name,
        url: workspace.url ?? "",
      },
      export: {
        format: "json",
        timestamp: new Date().toISOString(),
        totalItems: webItems.length + fileItems.length + textItems.length,
        options,
      },
    },
    data: {},
  };

  // Include data based on selected types
  if (
    options.knowledgeTypes.includes("web") ||
    options.knowledgeTypes.includes("all")
  ) {
    exportData.data.web = webItems;
  }
  if (
    options.knowledgeTypes.includes("file") ||
    options.knowledgeTypes.includes("all")
  ) {
    exportData.data.file = fileItems;
  }
  if (
    options.knowledgeTypes.includes("text") ||
    options.knowledgeTypes.includes("all")
  ) {
    exportData.data.text = textItems;
  }

  return exportData;
}

/**
 * Download JSON file with customization support
 */
export function downloadJsonFile(
  data: ExportData,
  filename: string,
  customization?: JsonCustomization,
): void {
  const indentation = customization?.indentation ?? 2;
  const jsonString = JSON.stringify(data, null, indentation);
  const blob = new Blob([jsonString], { type: "application/json" });
  downloadFile(blob, filename, "json");
}

// ============================================================================
// CSV EXPORT
// ============================================================================

/**
 * Convert export items to CSV format
 */
export function generateCsvExport(
  items: ExportItem[],
  options: ExportOptions,
): string {
  if (items.length === 0) {
    return "No data to export";
  }

  // Define CSV headers based on options
  const headers = ["ID", "Type", "Title", "Created At", "Updated At"];

  if (options.includeContent) {
    headers.push("Content");
  }

  if (options.includeStats) {
    headers.push("Character Count", "Word Count");
  }

  // Add type-specific headers
  if (items.some((item) => item.type === "web")) {
    headers.push("URL", "Status");
  }
  if (items.some((item) => item.type === "file")) {
    headers.push("File Name", "File Type", "File Size (bytes)");
  }
  if (items.some((item) => item.type === "text")) {
    headers.push("Tags");
  }

  // Build CSV rows
  const csvRows = [headers.join(",")];

  items.forEach((item) => {
    const row: string[] = [
      escapeCsvValue(item.id),
      escapeCsvValue(item.type),
      escapeCsvValue(item.title),
      escapeCsvValue(item.createdAt),
      escapeCsvValue(item.updatedAt || ""),
    ];

    if (options.includeContent) {
      row.push(escapeCsvValue(item.content || ""));
    }

    if (options.includeStats) {
      row.push(
        escapeCsvValue(item.charCount?.toString() || ""),
        escapeCsvValue(item.wordCount?.toString() || ""),
      );
    }

    // Add type-specific data
    if (headers.includes("URL")) {
      row.push(escapeCsvValue(item.url || ""));
    }
    if (headers.includes("Status")) {
      row.push(escapeCsvValue(item.status || ""));
    }
    if (headers.includes("File Name")) {
      row.push(escapeCsvValue(item.fileName || ""));
    }
    if (headers.includes("File Type")) {
      row.push(escapeCsvValue(item.fileType || ""));
    }
    if (headers.includes("File Size (bytes)")) {
      row.push(escapeCsvValue(item.fileSize?.toString() || ""));
    }
    if (headers.includes("Tags")) {
      row.push(escapeCsvValue(item.tags?.join("; ") || ""));
    }

    csvRows.push(row.join(","));
  });

  return csvRows.join("\n");
}

/**
 * Escape CSV values to handle commas, quotes, and newlines
 */
function escapeCsvValue(value: string): string {
  if (!value) return '""';

  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return `"${value}"`;
}

/**
 * Download CSV file
 */
export function downloadCsvFile(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadFile(blob, filename, "csv");
}

// ============================================================================
// PDF EXPORT (Basic Implementation)
// ============================================================================

/**
 * Generate basic PDF content (HTML for conversion)
 */
export function generatePdfContent(
  workspace: Workspace,
  items: ExportItem[],
  options: ExportOptions,
): string {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${workspace.name} - Knowledge Export</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .workspace-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .export-info { color: #666; font-size: 14px; }
        .item { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
        .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .item-title { font-size: 18px; font-weight: bold; }
        .item-type { background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .item-meta { color: #666; font-size: 12px; margin-bottom: 10px; }
        .item-content { margin-top: 10px; }
        .tags { margin-top: 10px; }
        .tag { background: #e3f2fd; color: #1976d2; padding: 2px 6px; border-radius: 3px; font-size: 11px; margin-right: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="workspace-title">${workspace.name}</div>
        <div class="export-info">
          Knowledge Export • ${new Date().toLocaleDateString()} • ${items.length} items
        </div>
      </div>

      ${items
        .map(
          (item) => `
        <div class="item">
          <div class="item-header">
            <div class="item-title">${item.title}</div>
            <div class="item-type">${item.type.toUpperCase()}</div>
          </div>
          <div class="item-meta">
            Created: ${new Date(item.createdAt).toLocaleDateString()}
            ${item.charCount ? `• ${item.charCount} characters` : ""}
            ${item.wordCount ? `• ${item.wordCount} words` : ""}
          </div>
          ${item.url ? `<div class="item-meta">URL: <a href="${item.url}">${item.url}</a></div>` : ""}
          ${item.fileName ? `<div class="item-meta">File: ${item.fileName} (${item.fileType}, ${formatFileSize(item.fileSize || 0)})</div>` : ""}
          ${
            options.includeContent && item.content
              ? `
            <div class="item-content">
              ${item.content.substring(0, 1000)}${item.content.length > 1000 ? "..." : ""}
            </div>
          `
              : ""
          }
          ${
            item.tags && item.tags.length > 0
              ? `
            <div class="tags">
              ${item.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
            </div>
          `
              : ""
          }
        </div>
      `,
        )
        .join("")}
    </body>
    </html>
  `;

  return html;
}

// ============================================================================
// FILE DOWNLOAD UTILITIES
// ============================================================================

/**
 * Generic file download function
 */
export function downloadFile(
  blob: Blob,
  filename: string,
  extension: string,
): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename for export
 */
export function generateExportFilename(
  workspaceTitle: string,
  options: ExportOptions,
): string {
  const sanitizedTitle = workspaceTitle.replace(/[^a-zA-Z0-9]/g, "_");
  const timestamp = new Date().toISOString().split("T")[0];
  const typesSuffix = options.knowledgeTypes.includes("all")
    ? "all"
    : options.knowledgeTypes.join("_");

  return `${sanitizedTitle}_${typesSuffix}_${timestamp}`;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate export options and data
 */
export function validateExport(
  options: ExportOptions,
  itemCount: number,
): ExportValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if any knowledge types are selected
  if (options.knowledgeTypes.length === 0) {
    errors.push("At least one knowledge type must be selected");
  }

  // Check item count limits
  if (itemCount === 0) {
    errors.push("No items match the selected criteria");
  }

  if (itemCount > 10000) {
    warnings.push("Large export may take several minutes to complete");
  }

  // Format-specific validation
  if (options.format === "csv" && itemCount > 1000000) {
    errors.push("CSV export is limited to 1 million items");
  }

  if (options.format === "pdf" && itemCount > 5000) {
    warnings.push("PDF export with many items may result in a very large file");
  }

  // Estimate file size (rough approximation)
  let estimatedSize = 0;
  if (options.format === "json") {
    estimatedSize = itemCount * 2000; // ~2KB per item
  } else if (options.format === "csv") {
    estimatedSize = itemCount * 500; // ~500B per item
  } else if (options.format === "pdf") {
    estimatedSize = itemCount * 5000; // ~5KB per item
  }

  // Estimate duration (rough approximation)
  const estimatedDuration = Math.max(1, Math.ceil(itemCount / 1000)); // 1 second per 1000 items

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    estimatedSize,
    estimatedDuration,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Create export result object
 */
export function createExportResult(
  success: boolean,
  fileName: string,
  fileSize: number,
  startTime: number,
  itemCount: number,
  error?: string,
): ExportResult {
  return {
    success,
    fileName,
    fileSize,
    duration: Date.now() - startTime,
    itemCount,
    error,
  };
}

// ============================================================================
// CUSTOMIZATION-AWARE EXPORT FUNCTIONS
// ============================================================================

/**
 * Format CSV field value based on column configuration
 */
function formatCsvFieldValue(value: unknown, column: CsvColumn): string {
  if (value === null || value === undefined) return "";

  let stringValue = String(value);

  // Apply formatter
  switch (column.formatter) {
    case "uppercase":
      stringValue = stringValue.toUpperCase();
      break;
    case "lowercase":
      stringValue = stringValue.toLowerCase();
      break;
    case "truncate":
      if (column.maxLength && stringValue.length > column.maxLength) {
        stringValue = `${stringValue.substring(0, column.maxLength)}...`;
      }
      break;
    case "date-iso":
      if (value instanceof Date) {
        stringValue = value.toISOString();
      } else if (typeof value === "string") {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          stringValue = date.toISOString();
        }
      }
      break;
    case "date-local":
      if (value instanceof Date) {
        stringValue = value.toLocaleString();
      } else if (typeof value === "string") {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          stringValue = date.toLocaleString();
        }
      }
      break;
    default:
      // Keep as-is
      break;
  }

  return stringValue;
}

/**
 * Generate CSV export with customization support
 */
export function generateCustomizedCsvExport(
  items: ExportItem[],
  _options: ExportOptions,
  customization: CsvCustomization,
): string {
  if (items.length === 0) {
    return "No data to export";
  }

  // Get included columns sorted by order
  const includedColumns = customization.columns
    .filter((col) => col.included)
    .sort((a, b) => a.order - b.order);

  if (includedColumns.length === 0) {
    return "No columns selected for export";
  }

  // Get separator character
  const separatorMap = {
    comma: ",",
    semicolon: ";",
    tab: "\t",
    pipe: "|",
  };
  const separator = separatorMap[customization.separator];

  // Get line ending
  const lineEndingMap = {
    lf: "\n",
    crlf: "\r\n",
    cr: "\r",
  };
  const lineEnding = lineEndingMap[customization.lineEnding];

  const rows: string[] = [];

  // Add headers if enabled
  if (customization.includeHeaders) {
    const headers = includedColumns.map((col) =>
      quoteCsvValue(
        col.label,
        separator,
        customization.quoteStyle,
        customization.escapeChar,
      ),
    );
    rows.push(headers.join(separator));
  }

  // Add data rows
  for (const item of items) {
    const rowValues = includedColumns.map((column) => {
      const value = getFieldValue(item, column.field);
      const formattedValue = formatCsvFieldValue(value, column);
      return quoteCsvValue(
        formattedValue,
        separator,
        customization.quoteStyle,
        customization.escapeChar,
      );
    });
    rows.push(rowValues.join(separator));
  }

  return rows.join(lineEnding);
}

/**
 * Quote CSV value based on quote style
 */
function quoteCsvValue(
  value: string,
  separator: string,
  quoteStyle: CsvCustomization["quoteStyle"],
  escapeChar: string,
): string {
  const needsQuoting =
    value.includes(separator) ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r");

  const isNumeric = !Number.isNaN(Number(value)) && value.trim() !== "";

  let shouldQuote = false;

  switch (quoteStyle) {
    case "all":
      shouldQuote = true;
      break;
    case "minimal":
      shouldQuote = needsQuoting;
      break;
    case "nonnumeric":
      shouldQuote = !isNumeric || needsQuoting;
      break;
    case "none":
      shouldQuote = false;
      break;
  }

  if (shouldQuote) {
    // Escape existing quotes
    const escapedValue = value.replace(/"/g, `${escapeChar}"`);
    return `"${escapedValue}"`;
  }

  return value;
}

/**
 * Get field value from export item
 */
function getFieldValue(item: ExportItem, fieldPath: string): unknown {
  const keys = fieldPath.split(".");
  let value: unknown = item;

  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return "";
    }
  }

  return value;
}

/**
 * Generate JSON export with customization support
 */
export function generateCustomizedJsonExport(
  workspace: Workspace,
  webItems: WebKnowledge[],
  fileItems: FileKnowledge[],
  textItems: TextKnowledge[],
  options: ExportOptions,
  customization: JsonCustomization,
): ExportData {
  const exportData = generateJsonExport(
    workspace,
    webItems,
    fileItems,
    textItems,
    options,
  );

  // Apply JSON customization
  if (customization.structure === "flat") {
    // Flatten the structure
    const flatData: unknown[] = [];

    if (exportData.data.web) {
      flatData.push(
        ...exportData.data.web.map((item) => ({ ...item, type: "web" })),
      );
    }
    if (exportData.data.file) {
      flatData.push(
        ...exportData.data.file.map((item) => ({ ...item, type: "file" })),
      );
    }
    if (exportData.data.text) {
      flatData.push(
        ...exportData.data.text.map((item) => ({ ...item, type: "text" })),
      );
    }

    return {
      ...exportData,
      data: customization.arrayWrapping ? flatData : { items: flatData },
    } as ExportData;
  }

  if (customization.structure === "grouped") {
    // Group by type with metadata
    const groupedData: Record<string, unknown> = {};

    if (exportData.data.web) {
      groupedData.web = {
        count: exportData.data.web.length,
        items: exportData.data.web,
      };
    }
    if (exportData.data.file) {
      groupedData.file = {
        count: exportData.data.file.length,
        items: exportData.data.file,
      };
    }
    if (exportData.data.text) {
      groupedData.text = {
        count: exportData.data.text.length,
        items: exportData.data.text,
      };
    }

    return {
      ...exportData,
      data: groupedData,
    } as ExportData;
  }

  // Default nested structure
  return exportData;
}

/**
 * Download customized CSV file
 */
export function downloadCustomizedCsvFile(
  data: string,
  filename: string,
  customization: CsvCustomization,
): void {
  const mimeType = `text/csv;charset=${customization.encoding}`;
  const blob = new Blob([data], { type: mimeType });
  downloadFile(blob, filename, "csv");
}
