/**
 * JSON Export Options Component
 *
 * Handles JSON-specific export customization including structure,
 * indentation, date format, and field configuration.
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
import type { JsonCustomization } from "@/types/export-customization";

interface JsonExportOptionsProps {
  customization: JsonCustomization;
  onChange: (updates: Partial<JsonCustomization>) => void;
}

export function JsonExportOptions({
  customization,
  onChange,
}: JsonExportOptionsProps) {
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
              <div key={field.id} className="p-3 border rounded-md">
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
