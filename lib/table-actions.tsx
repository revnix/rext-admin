import { Download, FileText, Printer, Share2 } from "lucide-react";
import React from "react";
import type { ExportOptions, TableLevelAction } from "@/types/data-table";

/**
 * Utility functions for common table actions
 */

/**
 * Export table data to CSV format
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string = "table-export.csv",
  options: ExportOptions = {},
): void {
  const { includeHeaders = true, delimiter = ",", columns } = options;

  try {
    if (data.length === 0) {
      throw new Error("No data to export");
    }

    // Determine columns to export
    const exportColumns = columns || Object.keys(data[0]);

    // Create CSV content
    let csvContent = "";

    // Add headers if requested
    if (includeHeaders) {
      csvContent += `${exportColumns.map((col) => `"${col}"`).join(delimiter)}\n`;
    }

    // Add data rows
    data.forEach((row) => {
      const values = exportColumns.map((col) => {
        const value = row[col];

        // Handle different data types
        if (value === null || value === undefined) {
          return '""';
        }

        if (Array.isArray(value)) {
          return `"${value.join("; ")}"`;
        }

        if (typeof value === "object") {
          return `"${JSON.stringify(value)}"`;
        }

        // Handle dates
        if (value instanceof Date) {
          return `"${value.toISOString().split("T")[0]}"`;
        }

        // Escape quotes in string values
        const stringValue = String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      });

      csvContent += `${values.join(delimiter)}\n`;
    });

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        filename.endsWith(".csv") ? filename : `${filename}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Failed to export CSV:", error);
    throw error;
  }
}

/**
 * Export table data to JSON format
 */
export function exportToJSON<T extends Record<string, unknown>>(
  data: T[],
  filename: string = "table-export.json",
  options: ExportOptions = {},
): void {
  const { columns } = options;

  try {
    if (data.length === 0) {
      throw new Error("No data to export");
    }

    // Filter columns if specified
    const exportData = columns
      ? data.map((row) => {
          const filteredRow: Partial<T> = {};
          columns.forEach((col) => {
            if (col in row) {
              filteredRow[col as keyof T] = row[col] as T[keyof T];
            }
          });
          return filteredRow;
        })
      : data;

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], {
      type: "application/json;charset=utf-8;",
    });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        filename.endsWith(".json") ? filename : `${filename}.json`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error("Failed to export JSON:", error);
    throw error;
  }
}

/**
 * Print table data
 */
export function printTable(title?: string): void {
  try {
    // Find the table element
    const tableElement =
      document.querySelector('[data-slot="table"]') ||
      document.querySelector("table") ||
      document.querySelector('[role="table"]');

    if (!tableElement) {
      throw new Error("No table found to print");
    }

    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) {
      throw new Error("Failed to open print window");
    }

    const tableHTML = tableElement.outerHTML;
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || "Table Data"}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            @media print {
              body { margin: 0; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          ${title ? `<h1>${title}</h1>` : ""}
          ${tableHTML}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  } catch (error) {
    console.error("Failed to print table:", error);
    throw error;
  }
}

/**
 * Create common table actions
 */
export function createCommonTableActions<T extends Record<string, unknown>>(
  data: T[],
  options: {
    onExportCSV?: (data: T[]) => void;
    onExportJSON?: (data: T[]) => void;
    onPrint?: () => void;
    onShare?: () => void;
    filename?: string;
    exportOptions?: ExportOptions;
  } = {},
): TableLevelAction[] {
  const {
    onExportCSV,
    onExportJSON,
    onPrint,
    onShare,
    filename = "table-data",
    exportOptions = {},
  } = options;

  const actions: TableLevelAction[] = [];

  // Export CSV action
  actions.push({
    id: "export-csv",
    label: "Export CSV",
    icon: React.createElement(Download, { className: "h-4 w-4" }),
    onClick: () => {
      try {
        if (onExportCSV) {
          onExportCSV(data);
        } else {
          exportToCSV(data, filename, exportOptions);
        }
      } catch (error) {
        console.error("Export failed:", error);
        // You could show a toast notification here
      }
    },
    tooltip: "Export table data as CSV file",
    shortcut: "⌘+E",
  });

  // Export JSON action
  actions.push({
    id: "export-json",
    label: "Export JSON",
    icon: React.createElement(FileText, { className: "h-4 w-4" }),
    onClick: () => {
      try {
        if (onExportJSON) {
          onExportJSON(data);
        } else {
          exportToJSON(data, filename, exportOptions);
        }
      } catch (error) {
        console.error("Export failed:", error);
        // You could show a toast notification here
      }
    },
    tooltip: "Export table data as JSON file",
  });

  // Print action
  actions.push({
    id: "print",
    label: "Print",
    icon: React.createElement(Printer, { className: "h-4 w-4" }),
    onClick: () => {
      try {
        if (onPrint) {
          onPrint();
        } else {
          printTable("Table Data");
        }
      } catch (error) {
        console.error("Print failed:", error);
        // You could show a toast notification here
      }
    },
    tooltip: "Print table data",
    shortcut: "⌘+P",
  });

  // Share action (optional)
  if (onShare) {
    actions.push({
      id: "share",
      label: "Share",
      icon: React.createElement(Share2, { className: "h-4 w-4" }),
      onClick: onShare,
      tooltip: "Share table data",
    });
  }

  return actions;
}

/**
 * Create a refresh action
 */
export function createRefreshAction(onRefresh: () => void): TableLevelAction {
  return {
    id: "refresh",
    label: "Refresh",
    icon: React.createElement("span", { className: "h-4 w-4" }, "🔄"),
    onClick: onRefresh,
    tooltip: "Refresh table data",
    shortcut: "⌘+R",
  };
}

/**
 * Create bulk selection helpers
 */
export function createBulkActionHelpers<T extends Record<string, unknown>>(
  selectedItems: Set<string>,
  allItems: T[],
  onSelectionChange: (selected: Set<string>) => void,
) {
  return {
    selectAll: () => {
      const allIds = allItems.map((item) => String(item.id));
      onSelectionChange(new Set(allIds));
    },

    selectNone: () => {
      onSelectionChange(new Set());
    },

    toggleItem: (id: string) => {
      const newSelection = new Set(selectedItems);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      onSelectionChange(newSelection);
    },

    isSelected: (id: string) => selectedItems.has(id),

    isAllSelected:
      selectedItems.size === allItems.length && allItems.length > 0,

    selectedCount: selectedItems.size,

    selectedData: allItems.filter((item) => selectedItems.has(String(item.id))),
  };
}
