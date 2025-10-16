/**
 * Hook for exporting topics
 */

import { useState } from "react";
import { classifyError } from "@/lib/error-utils";
import { log } from "@/lib/logger";
import type { GeneratedTopic } from "@/types/topic-builder";
import type { ActionResult, ExportFormat } from "../types";

export function useExportTopic() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");

  const exportTopics = async (
    topics: GeneratedTopic[],
    onExport?: (
      topics: GeneratedTopic[],
      format: ExportFormat,
    ) => Promise<void> | void,
  ): Promise<ActionResult> => {
    if (!onExport) {
      return {
        success: false,
        message: "No export handler provided",
      };
    }

    setIsExporting(true);

    try {
      await onExport(topics, exportFormat);

      log.info(`Exported ${topics.length} topic(s) as ${exportFormat}`);

      return {
        success: true,
        message: `Topic exported as ${exportFormat.toUpperCase()} successfully!`,
      };
    } catch (error) {
      log.error(`Failed to export topics:`, error);
      const classifiedError = classifyError(error);

      return {
        success: false,
        error: classifiedError,
        message: "Failed to export topics",
      };
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportTopics,
    isExporting,
    exportFormat,
    setExportFormat,
  };
}
