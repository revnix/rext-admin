/**
 * Text Input Component
 *
 * TypeForm-style text input with enhanced UX.
 */

"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TextInputProps {
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

  /** Custom class name */
  className?: string;

  /** Input type */
  type?: string;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
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
      className,
      type = "text",
      ...props
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
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
            type={type}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            maxLength={maxLength}
            className={cn(
              "text-lg h-12 transition-all duration-150",
              "border-2 focus:border-ring",
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

TextInput.displayName = "TextInput";

export { TextInput };
