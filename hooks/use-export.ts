/**
 * Export Hook
 *
 * Custom React hook for managing knowledge export functionality
 * including progress tracking, error handling, and file downloads.
 */

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  createExportResult,
  downloadCsvFile,
  downloadJsonFile,
  filterKnowledgeItems,
  generateCsvExport,
  generateExportFilename,
  generateJsonExport,
  generatePdfContent,
  transformToExportItems,
  validateExport,
} from "@/lib/export-utils";
import type {
  ExportFilters,
  ExportOptions,
  ExportProgress,
  ExportResult,
} from "@/types/export";
import type {
  FileKnowledge,
  TextKnowledge,
  WebKnowledge,
  Workspace,
} from "@/types/workspace";

// ============================================================================
// HOOK STATE TYPES
// ============================================================================

interface UseExportState {
  isExporting: boolean;
  progress: ExportProgress | null;
  lastResult: ExportResult | null;
  error: string | null;
}

interface UseExportActions {
  exportKnowledge: (
    workspace: Workspace,
    webItems: WebKnowledge[],
    fileItems: FileKnowledge[],
    textItems: TextKnowledge[],
    options: ExportOptions,
    filters?: ExportFilters,
  ) => Promise<ExportResult>;
  cancelExport: () => void;
  clearError: () => void;
  resetState: () => void;
}

type UseExportReturn = UseExportState & UseExportActions;

// ============================================================================
// EXPORT HOOK
// ============================================================================

export function useExport(): UseExportReturn {
  const [state, setState] = useState<UseExportState>({
    isExporting: false,
    progress: null,
    lastResult: null,
    error: null,
  });

  // Track export cancellation
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  /**
   * Update export progress
   */
  const updateProgress = useCallback((progress: Partial<ExportProgress>) => {
    setState((prev) => ({
      ...prev,
      progress: prev.progress ? { ...prev.progress, ...progress } : null,
    }));
  }, []);

  /**
   * Simulate processing delay for progress tracking
   */
  const delay = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }, []);

  /**
   * Main export function
   */
  const exportKnowledge = useCallback(
    async (
      workspace: Workspace,
      webItems: WebKnowledge[],
      fileItems: FileKnowledge[],
      textItems: TextKnowledge[],
      options: ExportOptions,
      filters: ExportFilters = {},
    ): Promise<ExportResult> => {
      const startTime = Date.now();
      const exportId = `export_${startTime}`;

      // Create abort controller for cancellation
      const controller = new AbortController();
      setAbortController(controller);

      try {
        // Reset state
        setState({
          isExporting: true,
          progress: {
            id: exportId,
            status: "preparing",
            progress: 0,
            totalItems: 0,
            processedItems: 0,
            startTime,
          },
          lastResult: null,
          error: null,
        });

        // Step 1: Filter data based on criteria
        updateProgress({ status: "preparing", progress: 10 });
        await delay(100);

        if (controller.signal.aborted) {
          throw new Error("Export cancelled");
        }

        const filteredWebItems = filterKnowledgeItems(webItems, filters);
        const filteredFileItems = filterKnowledgeItems(fileItems, filters);
        const filteredTextItems = filterKnowledgeItems(textItems, filters);

        // Step 2: Apply selection filters
        let finalWebItems = filteredWebItems;
        let finalFileItems = filteredFileItems;
        let finalTextItems = filteredTextItems;

        if (options.scope === "selected" && options.selectedIds) {
          finalWebItems = filteredWebItems.filter((item) =>
            options.selectedIds?.includes(item.id),
          );
          finalFileItems = filteredFileItems.filter((item) =>
            options.selectedIds?.includes(item.id),
          );
          finalTextItems = filteredTextItems.filter((item) =>
            options.selectedIds?.includes(item.id),
          );
        }

        const totalItems =
          finalWebItems.length + finalFileItems.length + finalTextItems.length;

        // Step 3: Validate export
        updateProgress({
          status: "preparing",
          progress: 20,
          totalItems,
          currentItem: "Validating export options...",
        });
        await delay(100);

        if (controller.signal.aborted) {
          throw new Error("Export cancelled");
        }

        const validation = validateExport(options, totalItems);
        if (!validation.valid) {
          throw new Error(validation.errors.join(", "));
        }

        // Show warnings if any
        if (validation.warnings.length > 0) {
          validation.warnings.forEach((warning) => {
            toast.warning(warning);
          });
        }

        // Step 4: Process data based on format
        updateProgress({
          status: "processing",
          progress: 30,
          currentItem: "Processing knowledge items...",
        });
        await delay(200);

        if (controller.signal.aborted) {
          throw new Error("Export cancelled");
        }

        // Generate filename
        const filename = generateExportFilename(workspace.name, options);

        // Step 5: Generate export based on format
        updateProgress({
          status: "generating",
          progress: 60,
          currentItem: `Generating ${options.format.toUpperCase()} file...`,
        });
        await delay(300);

        if (controller.signal.aborted) {
          throw new Error("Export cancelled");
        }

        let fileSize = 0;

        if (options.format === "json") {
          const exportData = generateJsonExport(
            workspace,
            finalWebItems,
            finalFileItems,
            finalTextItems,
            options,
          );

          updateProgress({
            progress: 80,
            currentItem: "Downloading JSON file...",
          });
          await delay(100);

          downloadJsonFile(exportData, filename);
          fileSize = JSON.stringify(exportData).length;
        } else if (options.format === "csv") {
          const exportItems = transformToExportItems(
            finalWebItems,
            finalFileItems,
            finalTextItems,
            options,
          );

          updateProgress({
            progress: 70,
            currentItem: "Generating CSV content...",
          });
          await delay(200);

          const csvContent = generateCsvExport(exportItems, options);

          updateProgress({
            progress: 80,
            currentItem: "Downloading CSV file...",
          });
          await delay(100);

          downloadCsvFile(csvContent, filename);
          fileSize = csvContent.length;
        } else if (options.format === "pdf") {
          const exportItems = transformToExportItems(
            finalWebItems,
            finalFileItems,
            finalTextItems,
            options,
          );

          updateProgress({
            progress: 70,
            currentItem: "Generating PDF content...",
          });
          await delay(300);

          const htmlContent = generatePdfContent(
            workspace,
            exportItems,
            options,
          );

          updateProgress({ progress: 80, currentItem: "Converting to PDF..." });
          await delay(500);

          // For PDF export, we'll use the browser's print-to-PDF capability
          // In a production environment, you might want to use a dedicated PDF library
          const printWindow = window.open("", "_blank");
          if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.print();
          }

          fileSize = htmlContent.length;
        }

        // Step 6: Complete export
        updateProgress({
          status: "completed",
          progress: 100,
          processedItems: totalItems,
          currentItem: "Export completed successfully!",
        });
        await delay(200);

        const result = createExportResult(
          true,
          `${filename}.${options.format}`,
          fileSize,
          startTime,
          totalItems,
        );

        setState((prev) => ({
          ...prev,
          isExporting: false,
          lastResult: result,
          progress: prev.progress
            ? { ...prev.progress, status: "completed" }
            : null,
        }));

        toast.success(
          `Export completed! ${totalItems} items exported to ${options.format.toUpperCase()}`,
        );
        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Export failed";

        updateProgress({
          status: "failed",
          error: errorMessage,
        });

        const result = createExportResult(
          false,
          "",
          0,
          startTime,
          0,
          errorMessage,
        );

        setState((prev) => ({
          ...prev,
          isExporting: false,
          error: errorMessage,
          lastResult: result,
        }));

        if (errorMessage !== "Export cancelled") {
          toast.error(`Export failed: ${errorMessage}`);
        }

        return result;
      } finally {
        setAbortController(null);
      }
    },
    [updateProgress, delay],
  );

  /**
   * Cancel current export operation
   */
  const cancelExport = useCallback(() => {
    if (abortController) {
      abortController.abort();
      toast.info("Export cancelled");
    }
  }, [abortController]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Reset entire hook state
   */
  const resetState = useCallback(() => {
    if (abortController) {
      abortController.abort();
    }
    setState({
      isExporting: false,
      progress: null,
      lastResult: null,
      error: null,
    });
    setAbortController(null);
  }, [abortController]);

  return {
    ...state,
    exportKnowledge,
    cancelExport,
    clearError,
    resetState,
  };
}

// ============================================================================
// UTILITY HOOK FOR EXPORT VALIDATION
// ============================================================================

/**
 * Hook for validating export options without performing the export
 */
export function useExportValidation() {
  return useCallback(
    (
      options: ExportOptions,
      webItems: WebKnowledge[] = [],
      fileItems: FileKnowledge[] = [],
      textItems: TextKnowledge[] = [],
      filters: ExportFilters = {},
    ) => {
      // Apply filters to get final item count
      const filteredWebItems = filterKnowledgeItems(webItems, filters);
      const filteredFileItems = filterKnowledgeItems(fileItems, filters);
      const filteredTextItems = filterKnowledgeItems(textItems, filters);

      let finalCount =
        filteredWebItems.length +
        filteredFileItems.length +
        filteredTextItems.length;

      // Apply selection filter if applicable
      if (options.scope === "selected" && options.selectedIds) {
        const selectedWebItems = filteredWebItems.filter((item) =>
          options.selectedIds?.includes(item.id),
        );
        const selectedFileItems = filteredFileItems.filter((item) =>
          options.selectedIds?.includes(item.id),
        );
        const selectedTextItems = filteredTextItems.filter((item) =>
          options.selectedIds?.includes(item.id),
        );
        finalCount =
          selectedWebItems.length +
          selectedFileItems.length +
          selectedTextItems.length;
      }

      return validateExport(options, finalCount);
    },
    [],
  );
}
