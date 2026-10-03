/**
 * PDF Export Options Component
 *
 * Handles PDF-specific export customization including layout,
 * typography, sections, and styling options.
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
import type {
  PdfCustomization,
  PdfSection,
} from "@/types/export-customization";

interface PdfExportOptionsProps {
  customization: PdfCustomization;
  onChange: (updates: Partial<PdfCustomization>) => void;
}

export function PdfExportOptions({
  customization,
  onChange,
}: PdfExportOptionsProps) {
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
                  className="flex items-center gap-4 p-3 border rounded-md"
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
