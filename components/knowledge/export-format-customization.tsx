/**
 * Export Format Customization Component
 *
 * Advanced UI for customizing export formats including CSV column selection,
 * JSON structure options, PDF layout settings, and template management.
 */

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Info,
  RefreshCw,
  Save,
  Settings,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useExportTemplates } from "@/hooks/use-export-templates";
import { cn } from "@/lib/utils";
import type {
  CsvColumn,
  CsvCustomization,
  ExportTemplate,
  JsonCustomization,
  PdfCustomization,
  PdfSection,
} from "@/types/export-customization";

// ============================================================================
// FORM SCHEMAS
// ============================================================================

const saveTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  tags: z.string().optional(),
});

type SaveTemplateFormData = z.infer<typeof saveTemplateSchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface ExportFormatCustomizationProps {
  format: "csv" | "json" | "pdf";
  onCustomizationChange: (
    customization: CsvCustomization | JsonCustomization | PdfCustomization,
  ) => void;
  onTemplateApplied?: (template: ExportTemplate) => void;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

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
    previewVisible,
    isSavingTemplate,
    updateCsvCustomization,
    updateJsonCustomization,
    updatePdfCustomization,
    applyTemplate,
    saveTemplate,
    deleteTemplate,
    duplicateTemplate,
    resetCustomization,
    setPreviewVisible,
    initializeTemplates,
  } = useExportTemplates();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] =
    useState<ExportTemplate | null>(null);

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

  // Form for saving templates
  const saveForm = useForm<SaveTemplateFormData>({
    resolver: zodResolver(saveTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      tags: "",
    },
  });

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
  const handleSaveTemplate = async (data: SaveTemplateFormData) => {
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

      setSaveDialogOpen(false);
      saveForm.reset();
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  // Handle template deletion
  const handleDeleteTemplate = async () => {
    if (templateToDelete && !templateToDelete.isSystem) {
      await deleteTemplate(templateToDelete.id);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

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
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div className="flex flex-wrap gap-2">
            {formatTemplates.map((template) => (
              <Button
                key={template.id}
                variant={
                  selectedTemplate?.id === template.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => handleApplyTemplate(template)}
                className="text-xs"
              >
                {template.name}
                {template.isSystem && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    System
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Template Actions */}
          <div className="flex items-center gap-2">
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  Save Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Export Template</DialogTitle>
                  <DialogDescription>
                    Save your current customization as a reusable template
                  </DialogDescription>
                </DialogHeader>

                <Form {...saveForm}>
                  <form
                    onSubmit={saveForm.handleSubmit(handleSaveTemplate)}
                    className="space-y-4"
                  >
                    <FormField
                      control={saveForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter template name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={saveForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe this template's purpose"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={saveForm.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter tags separated by commas"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Use tags to organize and find templates easily
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSaveDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSavingTemplate}>
                        {isSavingTemplate ? "Saving..." : "Save Template"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={() => resetCustomization(format)}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewVisible(!previewVisible)}
            >
              {previewVisible ? (
                <EyeOff className="h-4 w-4 mr-1" />
              ) : (
                <Eye className="h-4 w-4 mr-1" />
              )}
              Preview
            </Button>
          </div>

          {/* Selected Template Info */}
          {selectedTemplate && (
            <div className="p-3 bg-muted rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedTemplate.name}</p>
                  {selectedTemplate.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplate.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {selectedTemplate.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                {!selectedTemplate.isSystem && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => duplicateTemplate(selectedTemplate)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTemplateToDelete(selectedTemplate);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
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
            <CsvCustomizationPanel
              customization={csvCustomization}
              onChange={handleCustomizationChange}
            />
          )}
          {format === "json" && (
            <JsonCustomizationPanel
              customization={jsonCustomization}
              onChange={handleCustomizationChange}
            />
          )}
          {format === "pdf" && (
            <PdfCustomizationPanel
              customization={pdfCustomization}
              onChange={handleCustomizationChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Validation Messages */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validation.isValid ? (
                <Info className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              Validation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {validation.errors.map((error, index) => (
              <div
                key={`error-${error.field}-${index}`}
                className="flex items-center gap-2 text-destructive"
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  <strong>{error.field}:</strong> {error.message}
                </span>
              </div>
            ))}
            {validation.warnings.map((warning, index) => (
              <div
                key={`warning-${warning.field}-${index}`}
                className="flex items-center gap-2 text-amber-600"
              >
                <Info className="h-4 w-4" />
                <span className="text-sm">
                  <strong>{warning.field}:</strong> {warning.message}
                  {warning.suggestion && (
                    <span className="italic"> ({warning.suggestion})</span>
                  )}
                </span>
              </div>
            ))}
            {validation.isValid &&
              validation.errors.length === 0 &&
              validation.warnings.length === 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <Info className="h-4 w-4" />
                  <span className="text-sm">Configuration is valid</span>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      {/* Delete Template Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the template "
              {templateToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// CSV CUSTOMIZATION PANEL
// ============================================================================

interface CsvCustomizationPanelProps {
  customization: CsvCustomization;
  onChange: (updates: Partial<CsvCustomization>) => void;
}

function CsvCustomizationPanel({
  customization,
  onChange,
}: CsvCustomizationPanelProps) {
  const [columnsExpanded, setColumnsExpanded] = useState(true);

  const handleColumnToggle = (columnId: string, included: boolean) => {
    const updatedColumns = customization.columns.map((col) =>
      col.id === columnId ? { ...col, included } : col,
    );
    onChange({ columns: updatedColumns });
  };

  const handleColumnUpdate = (
    columnId: string,
    updates: Partial<CsvColumn>,
  ) => {
    const updatedColumns = customization.columns.map((col) =>
      col.id === columnId ? { ...col, ...updates } : col,
    );
    onChange({ columns: updatedColumns });
  };

  return (
    <div className="space-y-6">
      {/* Basic Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Separator</Label>
          <Select
            value={customization.separator}
            onValueChange={(value) =>
              onChange({ separator: value as CsvCustomization["separator"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comma">Comma (,)</SelectItem>
              <SelectItem value="semicolon">Semicolon (;)</SelectItem>
              <SelectItem value="tab">Tab (\t)</SelectItem>
              <SelectItem value="pipe">Pipe (|)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Encoding</Label>
          <Select
            value={customization.encoding}
            onValueChange={(value) =>
              onChange({ encoding: value as CsvCustomization["encoding"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="utf8">UTF-8</SelectItem>
              <SelectItem value="utf16">UTF-16</SelectItem>
              <SelectItem value="ascii">ASCII</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Quote Style</Label>
          <Select
            value={customization.quoteStyle}
            onValueChange={(value) =>
              onChange({ quoteStyle: value as CsvCustomization["quoteStyle"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="all">All Fields</SelectItem>
              <SelectItem value="nonnumeric">Non-numeric</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Line Ending</Label>
          <Select
            value={customization.lineEnding}
            onValueChange={(value) =>
              onChange({ lineEnding: value as CsvCustomization["lineEnding"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lf">LF (Unix)</SelectItem>
              <SelectItem value="crlf">CRLF (Windows)</SelectItem>
              <SelectItem value="cr">CR (Mac)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Header Options */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="includeHeaders"
          checked={customization.includeHeaders}
          onCheckedChange={(checked) => onChange({ includeHeaders: !!checked })}
        />
        <Label htmlFor="includeHeaders">Include column headers</Label>
      </div>

      {/* Column Configuration */}
      <Collapsible open={columnsExpanded} onOpenChange={setColumnsExpanded}>
        <CollapsibleTrigger className="flex items-center gap-2 font-medium">
          {columnsExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Column Configuration
          <Badge variant="secondary">
            {customization.columns.filter((col) => col.included).length}{" "}
            selected
          </Badge>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="space-y-3">
            {customization.columns
              .sort((a, b) => a.order - b.order)
              .map((column) => (
                <div
                  key={column.id}
                  className="flex items-center gap-4 p-3 border rounded-lg"
                >
                  <Checkbox
                    checked={column.included}
                    onCheckedChange={(checked) =>
                      handleColumnToggle(column.id, !!checked)
                    }
                  />

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Label
                      </Label>
                      <Input
                        value={column.label}
                        onChange={(e) =>
                          handleColumnUpdate(column.id, {
                            label: e.target.value,
                          })
                        }
                        className="text-sm"
                        disabled={!column.included}
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Formatter
                      </Label>
                      <Select
                        value={column.formatter}
                        onValueChange={(value) =>
                          handleColumnUpdate(column.id, {
                            formatter: value as CsvColumn["formatter"],
                          })
                        }
                        disabled={!column.included}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="uppercase">Uppercase</SelectItem>
                          <SelectItem value="lowercase">Lowercase</SelectItem>
                          <SelectItem value="truncate">Truncate</SelectItem>
                          <SelectItem value="date-iso">Date (ISO)</SelectItem>
                          <SelectItem value="date-local">
                            Date (Local)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {column.formatter === "truncate" && (
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Max Length
                        </Label>
                        <Input
                          type="number"
                          value={column.maxLength || ""}
                          onChange={(e) =>
                            handleColumnUpdate(column.id, {
                              maxLength: e.target.value
                                ? parseInt(e.target.value, 10)
                                : undefined,
                            })
                          }
                          className="text-sm"
                          disabled={!column.included}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================================================
// JSON CUSTOMIZATION PANEL
// ============================================================================

interface JsonCustomizationPanelProps {
  customization: JsonCustomization;
  onChange: (updates: Partial<JsonCustomization>) => void;
}

function JsonCustomizationPanel({
  customization,
  onChange,
}: JsonCustomizationPanelProps) {
  const [fieldsExpanded, setFieldsExpanded] = useState(true);

  return (
    <div className="space-y-6">
      {/* Structure Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Structure</Label>
          <Select
            value={customization.structure}
            onValueChange={(value) =>
              onChange({ structure: value as JsonCustomization["structure"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Flat</SelectItem>
              <SelectItem value="nested">Nested</SelectItem>
              <SelectItem value="grouped">Grouped by Type</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Indentation</Label>
          <Select
            value={customization.indentation.toString()}
            onValueChange={(value) =>
              onChange({
                indentation: parseInt(
                  value,
                  10,
                ) as JsonCustomization["indentation"],
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Compact (0 spaces)</SelectItem>
              <SelectItem value="2">2 spaces</SelectItem>
              <SelectItem value="4">4 spaces</SelectItem>
              <SelectItem value="8">8 spaces</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Date Format</Label>
          <Select
            value={customization.dateFormat}
            onValueChange={(value) =>
              onChange({ dateFormat: value as JsonCustomization["dateFormat"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="iso">ISO 8601</SelectItem>
              <SelectItem value="timestamp">Unix Timestamp</SelectItem>
              <SelectItem value="local">Local Format</SelectItem>
              <SelectItem value="relative">
                Relative (e.g., "2 days ago")
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Null Handling</Label>
          <Select
            value={customization.nullHandling}
            onValueChange={(value) =>
              onChange({
                nullHandling: value as JsonCustomization["nullHandling"],
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="include">Include as null</SelectItem>
              <SelectItem value="exclude">Exclude field</SelectItem>
              <SelectItem value="empty_string">Empty string</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="arrayWrapping"
            checked={customization.arrayWrapping}
            onCheckedChange={(checked) =>
              onChange({ arrayWrapping: !!checked })
            }
          />
          <Label htmlFor="arrayWrapping">Wrap results in array</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="contentTruncation"
            checked={customization.contentTruncation?.enabled || false}
            onCheckedChange={(checked) =>
              onChange({
                contentTruncation: {
                  maxLength: 500,
                  suffix: "...",
                  ...customization.contentTruncation,
                  enabled: !!checked,
                },
              })
            }
          />
          <Label htmlFor="contentTruncation">Enable content truncation</Label>
        </div>

        {customization.contentTruncation?.enabled && (
          <div className="grid grid-cols-2 gap-4 ml-6">
            <div className="space-y-2">
              <Label>Max Length</Label>
              <Input
                type="number"
                value={customization.contentTruncation.maxLength}
                onChange={(e) =>
                  onChange({
                    contentTruncation: {
                      enabled: false,
                      suffix: "...",
                      ...customization.contentTruncation,
                      maxLength: parseInt(e.target.value, 10) || 1000,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Suffix</Label>
              <Input
                value={customization.contentTruncation.suffix}
                onChange={(e) =>
                  onChange({
                    contentTruncation: {
                      enabled: false,
                      maxLength: 500,
                      ...customization.contentTruncation,
                      suffix: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Field Configuration */}
      <Collapsible open={fieldsExpanded} onOpenChange={setFieldsExpanded}>
        <CollapsibleTrigger className="flex items-center gap-2 font-medium">
          {fieldsExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Field Configuration
          <Badge variant="secondary">
            {
              customization.includedFields.filter((field) => field.included)
                .length
            }{" "}
            selected
          </Badge>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="space-y-3">
            {customization.includedFields.map((field) => (
              <div key={field.id} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={field.included}
                    onCheckedChange={(checked) => {
                      const updatedFields = customization.includedFields.map(
                        (f) =>
                          f.id === field.id ? { ...f, included: !!checked } : f,
                      );
                      onChange({ includedFields: updatedFields });
                    }}
                  />
                  <Label className="font-medium">{field.label}</Label>
                  <Badge variant="outline" className="text-xs">
                    {field.type}
                  </Badge>
                </div>

                {field.nested && field.included && (
                  <div className="ml-6 space-y-2">
                    {field.nested.map((nestedField) => (
                      <div
                        key={nestedField.id}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          checked={nestedField.included}
                          onCheckedChange={(checked) => {
                            const updatedFields =
                              customization.includedFields.map((f) =>
                                f.id === field.id
                                  ? {
                                      ...f,
                                      nested: f.nested?.map((nf) =>
                                        nf.id === nestedField.id
                                          ? { ...nf, included: !!checked }
                                          : nf,
                                      ),
                                    }
                                  : f,
                              );
                            onChange({ includedFields: updatedFields });
                          }}
                        />
                        <Label className="text-sm">{nestedField.label}</Label>
                        <Badge variant="outline" className="text-xs">
                          {nestedField.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================================================
// PDF CUSTOMIZATION PANEL
// ============================================================================

interface PdfCustomizationPanelProps {
  customization: PdfCustomization;
  onChange: (updates: Partial<PdfCustomization>) => void;
}

function PdfCustomizationPanel({
  customization,
  onChange,
}: PdfCustomizationPanelProps) {
  const [sectionsExpanded, setSectionsExpanded] = useState(true);
  const [stylingExpanded, setStylingExpanded] = useState(false);

  return (
    <div className="space-y-6">
      {/* Layout Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Page Layout</Label>
          <Select
            value={customization.layout}
            onValueChange={(value) =>
              onChange({ layout: value as PdfCustomization["layout"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="landscape">Landscape</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Page Size</Label>
          <Select
            value={customization.pageSize}
            onValueChange={(value) =>
              onChange({ pageSize: value as PdfCustomization["pageSize"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="a4">A4</SelectItem>
              <SelectItem value="letter">Letter</SelectItem>
              <SelectItem value="legal">Legal</SelectItem>
              <SelectItem value="a3">A3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Typography */}
      <div className="space-y-4">
        <Label className="font-medium">Typography</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Font Family</Label>
            <Select
              value={customization.typography.fontFamily}
              onValueChange={(value) =>
                onChange({
                  typography: {
                    ...customization.typography,
                    fontFamily:
                      value as PdfCustomization["typography"]["fontFamily"],
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="helvetica">Helvetica</SelectItem>
                <SelectItem value="arial">Arial</SelectItem>
                <SelectItem value="times">Times</SelectItem>
                <SelectItem value="courier">Courier</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Line Height</Label>
            <Input
              type="number"
              step="0.1"
              min="1"
              max="3"
              value={customization.typography.lineHeight}
              onChange={(e) =>
                onChange({
                  typography: {
                    ...customization.typography,
                    lineHeight: parseFloat(e.target.value) || 1.4,
                  },
                })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Title Size</Label>
            <Input
              type="number"
              value={customization.typography.fontSize.title}
              onChange={(e) =>
                onChange({
                  typography: {
                    ...customization.typography,
                    fontSize: {
                      ...customization.typography.fontSize,
                      title: parseInt(e.target.value, 10) || 24,
                    },
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Subtitle Size</Label>
            <Input
              type="number"
              value={customization.typography.fontSize.subtitle}
              onChange={(e) =>
                onChange({
                  typography: {
                    ...customization.typography,
                    fontSize: {
                      ...customization.typography.fontSize,
                      subtitle: parseInt(e.target.value, 10) || 18,
                    },
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Body Size</Label>
            <Input
              type="number"
              value={customization.typography.fontSize.body}
              onChange={(e) =>
                onChange({
                  typography: {
                    ...customization.typography,
                    fontSize: {
                      ...customization.typography.fontSize,
                      body: parseInt(e.target.value, 10) || 12,
                    },
                  },
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Caption Size</Label>
            <Input
              type="number"
              value={customization.typography.fontSize.caption}
              onChange={(e) =>
                onChange({
                  typography: {
                    ...customization.typography,
                    fontSize: {
                      ...customization.typography.fontSize,
                      caption: parseInt(e.target.value, 10) || 10,
                    },
                  },
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="includeTableOfContents"
            checked={customization.includeTableOfContents}
            onCheckedChange={(checked) =>
              onChange({ includeTableOfContents: !!checked })
            }
          />
          <Label htmlFor="includeTableOfContents">
            Include table of contents
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="includePageNumbers"
            checked={customization.includePageNumbers}
            onCheckedChange={(checked) =>
              onChange({ includePageNumbers: !!checked })
            }
          />
          <Label htmlFor="includePageNumbers">Include page numbers</Label>
        </div>
      </div>

      {/* Section Configuration */}
      <Collapsible open={sectionsExpanded} onOpenChange={setSectionsExpanded}>
        <CollapsibleTrigger className="flex items-center gap-2 font-medium">
          {sectionsExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Document Sections
          <Badge variant="secondary">
            {
              customization.sections.filter((section) => section.included)
                .length
            }{" "}
            selected
          </Badge>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="space-y-3">
            {customization.sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <div
                  key={section.id}
                  className="flex items-center gap-4 p-3 border rounded-lg"
                >
                  <Checkbox
                    checked={section.included}
                    onCheckedChange={(checked) => {
                      const updatedSections = customization.sections.map((s) =>
                        s.id === section.id ? { ...s, included: !!checked } : s,
                      );
                      onChange({ sections: updatedSections });
                    }}
                  />

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Title
                      </Label>
                      <Input
                        value={section.title}
                        onChange={(e) => {
                          const updatedSections = customization.sections.map(
                            (s) =>
                              s.id === section.id
                                ? { ...s, title: e.target.value }
                                : s,
                          );
                          onChange({ sections: updatedSections });
                        }}
                        className="text-sm"
                        disabled={!section.included}
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Page Break
                      </Label>
                      <Select
                        value={section.pageBreak}
                        onValueChange={(value) => {
                          const updatedSections = customization.sections.map(
                            (s) =>
                              s.id === section.id
                                ? {
                                    ...s,
                                    pageBreak: value as PdfSection["pageBreak"],
                                  }
                                : s,
                          );
                          onChange({ sections: updatedSections });
                        }}
                        disabled={!section.included}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="before">Before</SelectItem>
                          <SelectItem value="after">After</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Badge variant="outline" className="text-xs">
                    {section.type}
                  </Badge>
                </div>
              ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Styling Options */}
      <Collapsible open={stylingExpanded} onOpenChange={setStylingExpanded}>
        <CollapsibleTrigger className="flex items-center gap-2 font-medium">
          {stylingExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Advanced Styling
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <Input
                type="color"
                value={customization.styling.primaryColor}
                onChange={(e) =>
                  onChange({
                    styling: {
                      ...customization.styling,
                      primaryColor: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Accent Color</Label>
              <Input
                type="color"
                value={customization.styling.accentColor}
                onChange={(e) =>
                  onChange({
                    styling: {
                      ...customization.styling,
                      accentColor: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Background Color</Label>
              <Input
                type="color"
                value={customization.styling.backgroundColor}
                onChange={(e) =>
                  onChange({
                    styling: {
                      ...customization.styling,
                      backgroundColor: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Border Style</Label>
              <Select
                value={customization.styling.borderStyle}
                onValueChange={(value) =>
                  onChange({
                    styling: {
                      ...customization.styling,
                      borderStyle:
                        value as PdfCustomization["styling"]["borderStyle"],
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="heavy">Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
