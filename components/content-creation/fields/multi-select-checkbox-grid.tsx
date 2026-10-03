"use client";

import { Check, TrendingUp } from "lucide-react";
import { useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import type { SelectOption } from "@/types/shared";

interface MultiSelectCheckboxGridProps {
  value?: string[];
  options: SelectOption[];
  label?: string;
  description?: string;
  maxSelections?: number;
  columns?: 1 | 2 | 3 | 4;
  icon?: React.ComponentType<{ className?: string }>;
  error?: string;
  touched?: boolean;
  suggestions?: string[];
  showCount?: boolean;
  onChange: (values: string[]) => void;
  onTouch?: () => void;
}

/**
 * Specialized Multi-Select Checkbox Grid Component
 *
 * Renders a grid of checkbox options with support for limits, suggestions,
 * and visual feedback. Used for audience types, goals, search intent, etc.
 */
export function MultiSelectCheckboxGrid({
  value = [],
  options,
  label = "Select Options",
  description,
  maxSelections = 3,
  columns = 2,
  icon: Icon = Check,
  error,
  touched,
  suggestions = [],
  showCount = true,
  onChange,
  onTouch,
}: MultiSelectCheckboxGridProps) {
  // Handle option change
  const handleOptionChange = useCallback(
    (optionValue: string, isChecked: boolean) => {
      let newValues: string[];

      if (isChecked) {
        // Add if under limit
        if (value.length < maxSelections) {
          newValues = [...value, optionValue];
        } else {
          return; // Don't add if at limit
        }
      } else {
        // Remove
        newValues = value.filter((v) => v !== optionValue);
      }

      onChange(newValues);
      onTouch?.();
    },
    [value, maxSelections, onChange, onTouch],
  );

  // Check if option is suggested
  const isOptionSuggested = useCallback(
    (optionValue: string) => {
      return suggestions.includes(optionValue);
    },
    [suggestions],
  );

  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
  };

  return (
    <Card
      className={`transition-colors ${error && touched ? "border-destructive" : ""}`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {label}
        </CardTitle>
        <CardDescription>
          {description}
          {showCount && maxSelections && (
            <span className="block mt-1 text-xs">
              Select up to {maxSelections} options
              {value.length > 0 &&
                ` (${value.length}/${maxSelections} selected)`}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Options Grid */}
        <div className={`grid gap-3 ${gridClasses[columns]}`}>
          {options.map((option) => {
            const isSelected = value.includes(option.value);
            const isDisabled = !isSelected && value.length >= maxSelections;
            const isSuggested = isOptionSuggested(option.value);

            return (
              <Label
                key={option.value}
                className={`relative flex items-center justify-center border rounded-md p-3 cursor-pointer transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : isDisabled
                      ? "opacity-50 cursor-not-allowed border-muted"
                      : "hover:bg-accent border-border"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={(e) =>
                    handleOptionChange(option.value, e.target.checked)
                  }
                  className="sr-only"
                />
                <div className="flex-1 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <span className="font-medium text-sm">{option.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 ml-2 text-foreground" />
                    )}
                  </div>
                  {option.description && (
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  )}
                </div>

                {/* Suggestion indicator */}
                {isSuggested && !isSelected && (
                  <div className="absolute -top-1 -right-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  </div>
                )}
              </Label>
            );
          })}
        </div>

        {/* Selected items preview */}
        {value.length > 0 && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              <strong>Selected:</strong>
              <div className="flex flex-wrap gap-2 mt-2">
                {value.map((selectedValue) => {
                  const option = options.find(
                    (opt) => opt.value === selectedValue,
                  );
                  return (
                    <Badge
                      key={selectedValue}
                      variant="default"
                      className="text-xs"
                    >
                      {option?.label || selectedValue}
                    </Badge>
                  );
                })}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Suggestions info */}
        {suggestions.length > 0 && (
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <strong>AI Recommendations:</strong> Look for the yellow dots on
              suggested options based on your previous selections.
            </AlertDescription>
          </Alert>
        )}

        {/* Count info */}
        {showCount && (
          <div className="text-sm text-muted-foreground text-center">
            {value.length} / {maxSelections} selected
            {value.length === 0 &&
              ` (recommended: ${Math.min(2, maxSelections)} selections)`}
            {value.length >= maxSelections && " (maximum reached)"}
          </div>
        )}

        {/* Error display */}
        {error && touched && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
