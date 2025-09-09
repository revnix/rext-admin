/**
 * Chip Input Component
 *
 * TypeForm-style chip/tag input for multi-value input.
 */

"use client";

import { Plus, X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ChipInputProps {
  /** Current value array */
  value: string[];

  /** Change handler */
  onChange: (values: string[]) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Whether input is disabled */
  disabled?: boolean;

  /** Error message */
  error?: string;

  /** Maximum number of chips */
  maxItems?: number;

  /** Icon to display */
  icon?: React.ReactNode;

  /** Auto focus */
  autoFocus?: boolean;

  /** Custom class name */
  className?: string;
}

export function ChipInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  maxItems,
  icon,
  autoFocus = false,
  className,
}: ChipInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addChip = React.useCallback(
    (chipValue: string) => {
      const trimmedValue = chipValue.trim();
      if (
        trimmedValue &&
        !value.includes(trimmedValue) &&
        (!maxItems || value.length < maxItems)
      ) {
        onChange([...value, trimmedValue]);
        setInputValue("");
      }
    },
    [value, onChange, maxItems],
  );

  const removeChip = React.useCallback(
    (index: number) => {
      const newValue = value.filter((_, i) => i !== index);
      onChange(newValue);
    },
    [value, onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addChip(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      removeChip(value.length - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const isAtMax = maxItems && value.length >= maxItems;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative min-h-12 p-3 border-2 rounded-md transition-all duration-200",
          "focus-within:border-primary",
          error && "border-destructive",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        {icon && (
          <div className="absolute left-3 top-3 text-muted-foreground">
            {icon}
          </div>
        )}

        <div className={cn("flex flex-wrap gap-2", icon && "ml-7")}>
          {/* Existing chips */}
          {value.map((chip, index) => (
            <Badge
              key={chip}
              variant="secondary"
              className="px-2 py-1 text-sm flex items-center gap-1"
            >
              <span>{chip}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => removeChip(index)}
                disabled={disabled}
              >
                <X className="w-3 h-3 hover:text-destructive" />
              </Button>
            </Badge>
          ))}

          {/* Input field */}
          {!isAtMax && (
            <div className="flex-1 min-w-[120px]">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={value.length === 0 ? placeholder : ""}
                disabled={disabled}
                autoFocus={autoFocus}
                className="border-0 p-0 h-auto text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          )}
        </div>

        {/* Add button for visual feedback */}
        {inputValue.trim() && !isAtMax && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0"
            onClick={() => addChip(inputValue)}
            disabled={disabled}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Error message and max items indicator */}
      <div className="flex justify-between items-center min-h-[20px]">
        <div>
          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}
        </div>

        {maxItems && (
          <p
            className={cn(
              "text-xs text-muted-foreground",
              value.length > maxItems * 0.8 && "text-amber-600",
              value.length === maxItems && "text-destructive",
            )}
          >
            {value.length}/{maxItems}
          </p>
        )}
      </div>

      {/* Help text */}
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Type and press Enter to add items
        </p>
      )}
    </div>
  );
}
