"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Download, FileText, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useExport, useExportValidation } from "@/hooks/use-export";
import { formatFileSize } from "@/lib/export-utils";
import { log } from "@/lib/logger";
import { cn } from "@/lib/utils";
import type {
  ExportFormat,
  ExportKnowledgeType,
  ExportOptions,
  ExportScope,
} from "@/types/export";
import type {
  FileKnowledge,
  TextKnowledge,
  WebKnowledge,
  Workspace,
} from "@/types/workspace";

// ============================================================================
// FORM SCHEMA
// ============================================================================

const exportFormSchema = z.object({
  format: z.enum(["json", "csv", "pdf"]),
  scope: z.enum(["single", "selected", "all", "filtered"]),
  knowledgeTypes: z
    .array(z.enum(["web", "file", "text"]))
    .min(1, "Select at least one knowledge type"),
  includeContent: z.boolean(),
  includeMetadata: z.boolean(),
  includeStats: z.boolean(),
  maxItems: z.number().min(1).max(100000).optional(),
  dateRange: z
    .object({
      start: z.date().optional(),
      end: z.date().optional(),
    })
    .optional(),
});

type ExportFormData = z.infer<typeof exportFormSchema>;

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
  webItems: WebKnowledge[];
  fileItems: FileKnowledge[];
  textItems: TextKnowledge[];
  selectedIds?: string[];
  initialScope?: ExportScope;
  initialKnowledgeTypes?: ExportKnowledgeType[];
}

// ============================================================================
// EXPORT DIALOG COMPONENT
// ============================================================================

export function ExportDialog({
  open,
  onOpenChange,
  workspace,
  webItems,
  fileItems,
  textItems,
  selectedIds = [],
  initialScope = "all",
  initialKnowledgeTypes = ["web", "file", "text"],
}: ExportDialogProps) {
  const [previewData, setPreviewData] = useState<{
    itemCount: number;
    estimatedSize: number;
    estimatedDuration: number;
  } | null>(null);

  const { exportKnowledge, isExporting, progress, cancelExport, clearError } =
    useExport();
  const validateExport = useExportValidation();

  // Form setup
  const form = useForm<ExportFormData>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: {
      format: "json",
      scope: initialScope,
      knowledgeTypes: initialKnowledgeTypes.filter(
        (type) => type !== "all",
      ) as ("web" | "file" | "text")[],
      includeContent: true,
      includeMetadata: true,
      includeStats: true,
      maxItems: undefined,
      dateRange: undefined,
    },
  });

  // Watch specific form values to avoid unnecessary re-renders
  const format = form.watch("format");
  const knowledgeTypes = form.watch("knowledgeTypes");
  const scope = form.watch("scope");
  const includeContent = form.watch("includeContent");
  const includeMetadata = form.watch("includeMetadata");
  const includeStats = form.watch("includeStats");
  const maxItems = form.watch("maxItems");
  const dateRange = form.watch("dateRange");

  // Memoize dateRange string to prevent infinite loops
  const _dateRangeKey = useMemo(() => {
    if (!dateRange?.start || !dateRange?.end) return null;
    return `${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`;
  }, [dateRange?.start, dateRange?.end]);

  // Update preview when form values change
  useEffect(() => {
    const options: ExportOptions = {
      format: format as ExportFormat,
      knowledgeTypes: knowledgeTypes as ExportKnowledgeType[],
      scope: scope as ExportScope,
      includeContent,
      includeMetadata,
      includeStats,
      selectedIds: scope === "selected" ? selectedIds : undefined,
      maxItems,
    };

    const filters = {
      dateRange:
        dateRange?.start && dateRange.end
          ? {
              start: dateRange.start.toISOString(),
              end: dateRange.end.toISOString(),
            }
          : undefined,
    };

    const validation = validateExport(
      options,
      webItems,
      fileItems,
      textItems,
      filters,
    );

    if (validation.valid) {
      setPreviewData({
        itemCount: Math.max(0, 0),
        estimatedSize: validation.estimatedSize || 0,
        estimatedDuration: validation.estimatedDuration || 0,
      });
    } else {
      setPreviewData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    format,
    knowledgeTypes,
    scope,
    includeContent,
    includeMetadata,
    includeStats,
    maxItems,
    selectedIds,
    dateRange?.end,
    dateRange?.start,
    fileItems,
    textItems,
    validateExport,
    webItems,
    // Note: webItems, fileItems, textItems, validateExport excluded to prevent loops
    // They are used but their changes shouldn't trigger this effect
  ]);

  // Handle form submission
  const onSubmit = async (data: ExportFormData) => {
    try {
      const options: ExportOptions = {
        format: data.format as ExportFormat,
        knowledgeTypes: data.knowledgeTypes as ExportKnowledgeType[],
        scope: data.scope as ExportScope,
        includeContent: data.includeContent,
        includeMetadata: data.includeMetadata,
        includeStats: data.includeStats,
        selectedIds: data.scope === "selected" ? selectedIds : undefined,
        maxItems: data.maxItems,
      };

      const filters = {
        dateRange:
          data.dateRange?.start && data.dateRange.end
            ? {
                start: data.dateRange.start.toISOString(),
                end: data.dateRange.end.toISOString(),
              }
            : undefined,
      };

      await exportKnowledge(
        workspace,
        webItems,
        fileItems,
        textItems,
        options,
        filters,
      );

      // Close dialog on successful export
      if (!isExporting) {
        onOpenChange(false);
      }
    } catch (error) {
      // Error handling is done in the hook
      log.error("Export failed:", error);
    }
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        format: "json",
        scope: initialScope,
        knowledgeTypes: initialKnowledgeTypes.filter(
          (type) => type !== "all",
        ) as ("web" | "file" | "text")[],
        includeContent: true,
        includeMetadata: true,
        includeStats: true,
        maxItems: undefined,
        dateRange: undefined,
      });
      clearError();
    }
  }, [open, form, initialScope, initialKnowledgeTypes, clearError]);

  // Get format configuration
  const formatConfig = {
    json: { fileExtension: "json" },
    csv: { fileExtension: "csv" },
    pdf: { fileExtension: "pdf" },
  }[format as ExportFormat];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Knowledge
          </DialogTitle>
          <DialogDescription>
            Export knowledge from <strong>{workspace.name}</strong> in your
            preferred format
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Export Format */}
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Export Format</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select export format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <div>
                            <div className="font-medium">JSON</div>
                            <div className="text-xs text-muted-foreground">
                              Structured data with metadata
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <div>
                            <div className="font-medium">CSV</div>
                            <div className="text-xs text-muted-foreground">
                              Spreadsheet-compatible format
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="pdf">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <div>
                            <div className="font-medium">PDF</div>
                            <div className="text-xs text-muted-foreground">
                              Formatted document for reading
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Export Scope */}
            <FormField
              control={form.control}
              name="scope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Export Scope</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select export scope" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      {selectedIds.length > 0 && (
                        <SelectItem value="selected">
                          Selected Items ({selectedIds.length})
                        </SelectItem>
                      )}
                      <SelectItem value="filtered">Apply Filters</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Knowledge Types */}
            <FormField
              control={form.control}
              name="knowledgeTypes"
              render={() => (
                <FormItem>
                  <FormLabel>Knowledge Types</FormLabel>
                  <div className="grid grid-cols-3 gap-4">
                    {["web", "file", "text"].map((type) => (
                      <FormField
                        key={type}
                        control={form.control}
                        name="knowledgeTypes"
                        render={({ field }) => {
                          const typeLabels = {
                            web: "Web URLs",
                            file: "Files",
                            text: "Text Notes",
                          };
                          const typeCounts = {
                            web: webItems.length,
                            file: fileItems.length,
                            text: textItems.length,
                          };

                          return (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(
                                    type as "web" | "file" | "text",
                                  )}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, type])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== type,
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  {typeLabels[type as keyof typeof typeLabels]}
                                </FormLabel>
                                <FormDescription>
                                  {typeCounts[type as keyof typeof typeCounts]}{" "}
                                  items
                                </FormDescription>
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Export Options */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Export Options</Label>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="includeContent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Include Content</FormLabel>
                        <FormDescription>
                          Export full text content
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="includeMetadata"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Include Metadata</FormLabel>
                        <FormDescription>
                          Export creation dates, IDs, etc.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="includeStats"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Include Statistics</FormLabel>
                        <FormDescription>
                          Export character/word counts
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Advanced Options */}
            {scope === "filtered" && (
              <div className="space-y-4">
                <Label className="text-base font-medium">Filter Options</Label>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateRange.start"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  field.value.toLocaleDateString()
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateRange.end"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? (
                                  field.value.toLocaleDateString()
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() ||
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Max Items */}
                <FormField
                  control={form.control}
                  name="maxItems"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Items (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Leave empty for no limit"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseInt(e.target.value, 10)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Limit the number of items to export
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Export Preview */}
            {previewData && (
              <div className="p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">Export Preview</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Items:</span>
                    <div className="font-medium">{previewData.itemCount}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Size:</span>
                    <div className="font-medium">
                      {formatFileSize(previewData.estimatedSize)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Est. Time:</span>
                    <div className="font-medium">
                      {previewData.estimatedDuration}s
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Export Progress */}
            {isExporting && progress && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {progress.status === "preparing" && "Preparing export..."}
                    {progress.status === "processing" && "Processing data..."}
                    {progress.status === "generating" && "Generating file..."}
                    {progress.status === "completed" && "Export completed!"}
                    {progress.status === "failed" && "Export failed"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {progress.progress}%
                  </span>
                </div>
                <Progress value={progress.progress} className="w-full" />
                {progress.currentItem && (
                  <p className="text-xs text-muted-foreground">
                    {progress.currentItem}
                  </p>
                )}
              </div>
            )}

            <Separator />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (isExporting) {
                    cancelExport();
                  } else {
                    onOpenChange(false);
                  }
                }}
              >
                {isExporting ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Cancel Export
                  </>
                ) : (
                  "Close"
                )}
              </Button>
              <Button
                type="submit"
                disabled={
                  isExporting || !previewData || previewData.itemCount === 0
                }
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export {formatConfig?.fileExtension.toUpperCase()}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
