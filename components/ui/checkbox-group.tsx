"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CheckboxOption {
  label: string;
  value: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  className?: string;
  disabled?: boolean;
  columns?: 1 | 2 | 3 | 4;
  showSelectAll?: boolean;
  showSelectedCount?: boolean;
  maxSelections?: number;
}

const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(
  (
    {
      options,
      value = [],
      onValueChange,
      className,
      columns = 2,
      showSelectAll = true,
      showSelectedCount = true,
      maxSelections,
      ...props
    },
    ref,
  ) => {
    const selectedValues = value || [];

    const handleValueChange = (optionValue: string, checked: boolean) => {
      if (!onValueChange) return;

      if (checked) {
        if (maxSelections && selectedValues.length >= maxSelections) return;
        onValueChange([...selectedValues, optionValue]);
      } else {
        onValueChange(selectedValues.filter((v) => v !== optionValue));
      }
    };

    const handleSelectAll = () => {
      if (!onValueChange) return;

      if (selectedValues.length === options.length) {
        onValueChange([]);
      } else {
        const allValues = options.map((opt) => opt.value);
        onValueChange(
          maxSelections ? allValues.slice(0, maxSelections) : allValues,
        );
      }
    };

    const gridCols = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    };

    return (
      <div ref={ref} className={cn("space-y-3", className)} {...props}>
        {/* Header with controls */}
        {(showSelectAll || showSelectedCount) && (
          <div className="flex items-center justify-between">
            {showSelectedCount && (
              <span className="text-sm text-muted-foreground">
                {selectedValues.length} of {options.length} selected
                {maxSelections && ` (max ${maxSelections})`}
              </span>
            )}
            {showSelectAll && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 px-2 text-xs"
                >
                  {selectedValues.length === options.length
                    ? "Clear All"
                    : "Select All"}
                </Button>
                {selectedValues.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onValueChange?.([])}
                    className="h-7 px-2 text-xs"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Checkbox options grid */}
        <div className={cn("grid gap-3", gridCols[columns])}>
          {options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            const isDisabled = !!(
              maxSelections &&
              !isSelected &&
              selectedValues.length >= maxSelections
            );
            const OptionIcon = option.icon;

            return (
              <div key={option.value} className="relative">
                <CheckboxPrimitive.Root
                  id={option.value}
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    handleValueChange(option.value, checked === true)
                  }
                  disabled={isDisabled}
                  className="peer sr-only"
                />
                <label
                  htmlFor={option.value}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground hover:border-accent",
                    isSelected
                      ? "bg-primary/10 border-primary ring-2 ring-primary/30 text-primary shadow-sm"
                      : "border-border bg-background hover:shadow-sm",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border-2 mt-0.5 shrink-0",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground",
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {OptionIcon && (
                        <OptionIcon
                          className={cn(
                            "h-4 w-4",
                            isSelected
                              ? "text-primary"
                              : "text-muted-foreground",
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          "font-medium text-sm",
                          isSelected ? "text-primary" : "text-foreground",
                        )}
                      >
                        {option.label}
                      </span>
                    </div>
                    {option.description && (
                      <p
                        className={cn(
                          "text-xs",
                          isSelected
                            ? "text-primary/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {option.description}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

CheckboxGroup.displayName = "CheckboxGroup";

export { CheckboxGroup };
export type { CheckboxOption };
