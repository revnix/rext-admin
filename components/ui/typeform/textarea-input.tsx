/**
 * Textarea Input Component
 *
 * TypeForm-style textarea input for longer text input.
 */

"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface TextAreaInputProps {
  /** Current value */
  value: string;

  /** Change handler */
  onChange: (value: string) => void;

  /** Placeholder text */
  placeholder?: string;

  /** Whether input is disabled */
  disabled?: boolean;

  /** Error message */
  error?: string;

  /** Maximum character length */
  maxLength?: number;

  /** Whether to show character count */
  showCount?: boolean;

  /** Icon to display */
  icon?: React.ReactNode;

  /** Auto focus */
  autoFocus?: boolean;

  /** Number of rows */
  rows?: number;

  /** Custom class name */
  className?: string;
}

const TextAreaInput = React.forwardRef<HTMLTextAreaElement, TextAreaInputProps>(
  (
    {
      value,
      onChange,
      placeholder,
      disabled = false,
      error,
      maxLength,
      showCount = false,
      icon,
      autoFocus = false,
      rows = 3,
      className,
      ...props
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };

    return (
      <div className="space-y-2">
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-3 text-muted-foreground">
              {icon}
            </div>
          )}

          <Textarea
            ref={ref}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            maxLength={maxLength}
            rows={rows}
            className={cn(
              "text-lg resize-none transition-all duration-200",
              "border-2 focus:border-primary",
              "placeholder:text-muted-foreground/50",
              icon && "pl-10",
              error && "border-destructive focus:border-destructive",
              className,
            )}
            {...props}
          />
        </div>

        {/* Character count and error */}
        <div className="flex justify-between items-center min-h-[20px]">
          <div>
            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}
          </div>

          {showCount && maxLength && (
            <p
              className={cn(
                "text-xs text-muted-foreground",
                value.length > maxLength * 0.9 && "text-warning-600",
                value.length === maxLength && "text-destructive",
              )}
            >
              {value.length}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  },
);

TextAreaInput.displayName = "TextAreaInput";

export { TextAreaInput };
