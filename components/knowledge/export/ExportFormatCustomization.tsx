/**
 * Export Format Customization Component
 *
 * Main orchestrator component for export customization that handles
 * format-specific options, template management, and validation.
 */

"use client";

import { Settings } from "lucide-react";
import { useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useExportTemplates } from "@/hooks/use-export-templates";
import { log } from "@/lib/logger";
import { cn } from "@/lib/utils";
import type {
  CsvCustomization,
  ExportTemplate,
  JsonCustomization,
  PdfCustomization,
} from "@/types/export-customization";
import {
  CsvExportOptions,
  JsonExportOptions,
  PdfExportOptions,
} from "./formats";
import { TemplateManager, ValidationDisplay } from "./shared";

interface ExportFormatCustomizationProps {
  format: "csv" | "json" | "pdf";
  onCustomizationChange: (
    customization: CsvCustomization | JsonCustomization | PdfCustomization,
  ) => void;
  onTemplateApplied?: (template: ExportTemplate) => void;
  className?: string;
}

export function ExportFormatCustomization({
  format,
  onCustomizationChange,
  onTemplateApplied,
  className,
}: ExportFormatCustomizationProps) {
  const {
    csvCustomization,
    jsonCustomization,
    pdfCustomization,
    templates,
    selectedTemplate,
    validation,
    isSavingTemplate,
    updateCsvCustomization,
    updateJsonCustomization,
    updatePdfCustomization,
    applyTemplate,
    saveTemplate,
    deleteTemplate,
    duplicateTemplate,
    resetCustomization,
    initializeTemplates,
  } = useExportTemplates();

  // Initialize templates on mount
  useEffect(() => {
    initializeTemplates();
  }, [initializeTemplates]);

  // Get current customization based on format
  const currentCustomization =
    format === "csv"
      ? csvCustomization
      : format === "json"
        ? jsonCustomization
        : pdfCustomization;

  // Handle customization changes
  const handleCustomizationChange = useCallback(
    (
      updates: Partial<CsvCustomization | JsonCustomization | PdfCustomization>,
    ) => {
      let updatedCustomization:
        | CsvCustomization
        | JsonCustomization
        | PdfCustomization;

      switch (format) {
        case "csv":
          updateCsvCustomization(updates as Partial<CsvCustomization>);
          updatedCustomization = { ...csvCustomization, ...updates };
          break;
        case "json":
          updateJsonCustomization(updates as Partial<JsonCustomization>);
          updatedCustomization = { ...jsonCustomization, ...updates };
          break;
        case "pdf":
          updatePdfCustomization(updates as Partial<PdfCustomization>);
          updatedCustomization = { ...pdfCustomization, ...updates };
          break;
      }

      onCustomizationChange(updatedCustomization);
    },
    [
      format,
      csvCustomization,
      jsonCustomization,
      pdfCustomization,
      onCustomizationChange,
      updateCsvCustomization,
      updateJsonCustomization,
      updatePdfCustomization,
    ],
  );

  // Handle template application
  const handleApplyTemplate = useCallback(
    (template: ExportTemplate) => {
      applyTemplate(template);
      onCustomizationChange(template.customization);
      onTemplateApplied?.(template);
    },
    [applyTemplate, onCustomizationChange, onTemplateApplied],
  );

  // Handle template save
  const handleSaveTemplate = async (data: {
    name: string;
    description?: string;
    tags?: string;
  }) => {
    try {
      const tags = data.tags
        ? data.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      await saveTemplate({
        name: data.name,
        description: data.description || undefined,
        format,
        customization: currentCustomization,
        tags,
        isDefault: false,
        isSystem: false,
      });
    } catch (error) {
      log.error("Error saving template:", error);
    }
  };

  // Handle reset customization
  const handleResetCustomization = useCallback(() => {
    resetCustomization(format);
  }, [format, resetCustomization]);

  // Handle template deletion
  const handleDeleteTemplate = useCallback(
    (template: ExportTemplate) => {
      deleteTemplate(template.id);
    },
    [deleteTemplate],
  );

  // Get templates for current format
  const formatTemplates = templates.filter((t) => t.format === format);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Template Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Export Templates
          </CardTitle>
          <CardDescription>
            Save and manage custom export configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateManager
            templates={formatTemplates}
            selectedTemplate={selectedTemplate}
            isSavingTemplate={isSavingTemplate}
            onApplyTemplate={handleApplyTemplate}
            onSaveTemplate={handleSaveTemplate}
            onDuplicateTemplate={duplicateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onResetCustomization={handleResetCustomization}
          />
        </CardContent>
      </Card>

      {/* Format-Specific Customization */}
      <Card>
        <CardHeader>
          <CardTitle>{format.toUpperCase()} Customization</CardTitle>
          <CardDescription>
            Configure format-specific export options
          </CardDescription>
        </CardHeader>
        <CardContent>
          {format === "csv" && (
            <CsvExportOptions
              customization={csvCustomization}
              onChange={handleCustomizationChange}
            />
          )}
          {format === "json" && (
            <JsonExportOptions
              customization={jsonCustomization}
              onChange={handleCustomizationChange}
            />
          )}
          {format === "pdf" && (
            <PdfExportOptions
              customization={pdfCustomization}
              onChange={handleCustomizationChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Validation Messages */}
      {validation && <ValidationDisplay validation={validation} />}
    </div>
  );
}
