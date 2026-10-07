/**
 * Number Input Component
 *
 * TypeForm-style number input with validation.
 */

"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface NumberInputProps {
  /** Current value */
  value: number;

  /** Change handler */
  onChange: (value: number) => void;

  /** Minimum value */
  min?: number;

  /** Maximum value */
  max?: number;

  /** Step value */
  step?: number;

  /** Placeholder text */
  placeholder?: string;

  /** Whether input is disabled */
  disabled?: boolean;

  /** Error message */
  error?: string;

  /** Icon to display */
  icon?: React.ReactNode;

  /** Auto focus */
  autoFocus?: boolean;

  /** Custom class name */
  className?: string;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      min,
      max,
      step = 1,
      placeholder,
      disabled = false,
      error,
      icon,
      autoFocus = false,
      className,
      ...props
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      if (!Number.isNaN(newValue)) {
        let clampedValue = newValue;

        if (min !== undefined && clampedValue < min) {
          clampedValue = min;
        }
        if (max !== undefined && clampedValue > max) {
          clampedValue = max;
        }

        onChange(clampedValue);
      } else if (e.target.value === "") {
        onChange(min || 0);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const newValue = value + step;
        if (max === undefined || newValue <= max) {
          onChange(newValue);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const newValue = value - step;
        if (min === undefined || newValue >= min) {
          onChange(newValue);
        }
      }
    };

    return (
      <div className="space-y-2">
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}

          <Input
            ref={ref}
            type="number"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            min={min}
            max={max}
            step={step}
            className={cn(
              "text-lg h-12 transition-all duration-200",
              "border-2 focus:border-ring",
              "placeholder:text-muted-foreground/50",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              icon && "pl-10",
              error && "border-destructive focus:border-destructive",
              className,
            )}
            {...props}
          />
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}
      </div>
    );
  },
);

NumberInput.displayName = "NumberInput";

export { NumberInput };
