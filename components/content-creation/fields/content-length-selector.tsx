"use client";

import { Edit, FileText } from "lucide-react";
import { useCallback, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ContentLengthOption } from "@/types/content-creation";
import type { SelectOption } from "@/types/shared";

interface ContentLengthSelectorProps {
  value?: ContentLengthOption;
  options: SelectOption[];
  label?: string;
  description?: string;
  placeholder?: string;
  contentType?: string;
  error?: string;
  touched?: boolean;
  onChange: (value: ContentLengthOption) => void;
  onTouch?: () => void;
}

/**
 * Specialized Content Length Selector Component
 *
 * Handles both preset and custom content length selection with a modal
 * for custom length configuration. Supports different units based on content type.
 */
export function ContentLengthSelector({
  value,
  options,
  label = "Content Length",
  description,
  placeholder: _placeholder = "Select content length...",
  contentType,
  error,
  touched,
  onChange,
  onTouch,
}: ContentLengthSelectorProps) {
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customValue, setCustomValue] = useState<number>(
    value?.custom?.value || 500,
  );
  const [customUnit, setCustomUnit] = useState<
    "words" | "characters" | "tweets"
  >(value?.custom?.unit || "words");

  // Get available units based on content type
  const getAvailableUnits = useCallback(() => {
    const baseUnits = ["words", "characters"];

    if (contentType === "Thread" || contentType === "Post") {
      return [...baseUnits, "tweets"];
    }

    return baseUnits;
  }, [contentType]);

  // Handle preset selection
  const handlePresetChange = useCallback(
    (preset: string) => {
      const newValue: ContentLengthOption = {
        type: "preset",
        preset: preset as "Short" | "Medium" | "Long",
      };

      onChange(newValue);
      onTouch?.();
    },
    [onChange, onTouch],
  );

  // Handle custom length modal
  const handleCustomLength = useCallback(() => {
    setIsCustomModalOpen(true);
    onTouch?.();
  }, [onTouch]);

  // Handle custom length confirmation
  const handleCustomConfirm = useCallback(() => {
    const newValue: ContentLengthOption = {
      type: "custom",
      custom: {
        value: customValue,
        unit: customUnit,
      },
    };

    onChange(newValue);
    setIsCustomModalOpen(false);
  }, [customValue, customUnit, onChange]);

  // Handle custom length cancel
  const handleCustomCancel = useCallback(() => {
    // Reset to current values if canceling
    if (value?.custom) {
      setCustomValue(value.custom.value);
      setCustomUnit(value.custom.unit);
    }
    setIsCustomModalOpen(false);
  }, [value]);

  const availableUnits = getAvailableUnits();
  const selectedPreset = value?.type === "preset" ? value.preset : "";

  return (
    <>
      <Card
        className={`wizard-card ${error && touched ? "wizard-card-error" : ""}`}
      >
        <CardHeader className="pb-4">
          <CardTitle className="wizard-field-label">
            <FileText className="h-5 w-5 text-foreground" />
            {label}
          </CardTitle>
          <CardDescription className="wizard-field-description">
            {description ||
              "Choose a preset length or specify custom requirements"}
            {contentType && ` for ${contentType}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preset Options */}
          <RadioGroup
            options={options.map((option) => ({
              label: option.label,
              value: option.value,
              description: option.description,
            }))}
            value={selectedPreset}
            onValueChange={handlePresetChange}
            columns={2}
          />

          {/* Enhanced Custom Length Section */}
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={handleCustomLength}
              type="button"
              className="wizard-button-secondary flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Set Custom Length
            </Button>

            {/* Enhanced Custom Length Preview */}
            {value?.type === "custom" && value.custom && (
              <div className="wizard-card-success p-4 rounded-md">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-foreground" />
                  <div>
                    <div className="font-semibold text-green-700">
                      Custom Length Set
                    </div>
                    <div className="text-sm text-green-600">
                      {value.custom.value} {value.custom.unit}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Error Display */}
          {error && touched && (
            <div className="wizard-field-error">
              <FileText className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Length Modal */}
      <Dialog open={isCustomModalOpen} onOpenChange={setIsCustomModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Custom Content Length</DialogTitle>
            <DialogDescription>
              Specify the exact length you want for your content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-value">Length</Label>
              <Input
                id="custom-value"
                type="number"
                min="1"
                value={customValue}
                onChange={(e) =>
                  setCustomValue(parseInt(e.target.value, 10) || 1)
                }
                placeholder="Enter length..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-unit">Unit</Label>
              <Select
                value={customUnit}
                onValueChange={(value: typeof customUnit) =>
                  setCustomUnit(value)
                }
              >
                <SelectTrigger id="custom-unit">
                  <SelectValue placeholder="Select unit..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUnits.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Preview:</strong> {customValue} {customUnit}
              </AlertDescription>
            </Alert>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCustomCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleCustomConfirm}
              disabled={!customValue || customValue <= 0}
            >
              Set Custom Length
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
