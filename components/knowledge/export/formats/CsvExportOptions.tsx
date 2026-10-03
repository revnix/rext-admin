/**
 * CSV Export Options Component
 *
 * Handles CSV-specific export customization including separator,
 * encoding, quote style, and column configuration.
 */

"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CsvColumn, CsvCustomization } from "@/types/export-customization";

interface CsvExportOptionsProps {
  customization: CsvCustomization;
  onChange: (updates: Partial<CsvCustomization>) => void;
}

export function CsvExportOptions({
  customization,
  onChange,
}: CsvExportOptionsProps) {
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
                  className="flex items-center gap-4 p-3 border rounded-md"
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
