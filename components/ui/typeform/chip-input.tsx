/**
 * Chip Input Component
 *
 * TypeForm-style chip/tag input for multi-value input with dual enter logic.
 * First Enter adds chip, second Enter (or Enter on empty input) advances wizard.
 *
 * Features:
 * - Full accessibility support with ARIA attributes and keyboard navigation
 * - Fallback to standard text input if chip functionality fails
 * - Screen reader announcements for all interactions
 * - WCAG 2.1 AA compliant keyboard navigation
 */

import { AlertTriangle, Plus, X } from "lucide-react";
import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { log } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { useChipInputOperations } from "./use-chip-input-operations";
import { useChipInputKeyboard } from "./use-chip-input-keyboard";

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

  /** Callback for wizard step advancement (dual enter behavior) */
  onStepAdvance?: () => void;

  /** Whether to enable dual enter behavior (default: false) */
  enableDualEnter?: boolean;

  /** Accessibility label for the input */
  ariaLabel?: string;

  /** Accessibility description for the input */
  ariaDescription?: string;

  /** Whether to enable fallback to plain text input */
  enableFallback?: boolean;

  /** Callback when fallback is triggered */
  onFallbackTriggered?: (error: Error) => void;
}

export interface ControlledChipInputProps
  extends Omit<ChipInputProps, "value" | "onChange"> {
  /** React Hook Form field props */
  field: ControllerRenderProps<FieldValues, string>;
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
  onStepAdvance,
  enableDualEnter = false,
  ariaLabel,
  ariaDescription,
  enableFallback = true,
  onFallbackTriggered,
}: ChipInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [focusedChipIndex, setFocusedChipIndex] = useState<number>(-1);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");

  const [internalError, setInternalError] = useState<string | undefined>(
    undefined,
  );

  const inputRef = React.useRef<HTMLInputElement>(null);
  const chipRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const fallbackInputRef = React.useRef<HTMLInputElement>(null);
  const liveRegionRef = React.useRef<HTMLOutputElement>(null);
  const announcementTimeoutRef = React.useRef<number | null>(null);

  // Generate unique IDs for accessibility
  const inputId = React.useId();
  const descriptionId = React.useId();
  const errorId = React.useId();
  const liveRegionId = React.useId();

  // Announce to screen readers
  const announce = useCallback((message: string) => {
    setAnnouncementText(message);

    // Clear any existing timeout before creating a new one
    if (announcementTimeoutRef.current !== null) {
      window.clearTimeout(announcementTimeoutRef.current);
    }

    // Clear after a short delay to allow for multiple announcements
    announcementTimeoutRef.current = window.setTimeout(() => {
      setAnnouncementText("");
      announcementTimeoutRef.current = null;
    }, 100);
  }, []);

  //  Automatically add one chip on mount
  useEffect(() => {
    if (value.length === 0) {
      onChange(["Small business owners"]);
      setInternalError(undefined);
    }
  }, [value.length, onChange]);

  // Cleanup announcement timeout on unmount
  React.useEffect(() => {
    return () => {
      if (announcementTimeoutRef.current !== null) {
        window.clearTimeout(announcementTimeoutRef.current);
        announcementTimeoutRef.current = null;
      }
    };
  }, []);

  //  Clear error when at least one chip exists
  useEffect(() => {
    if (value.length > 0 && internalError) {
      setInternalError(undefined);
    }
  }, [value.length, internalError]);

  // Keyboard navigation helpers
  const focusChip = useCallback(
    (index: number) => {
      if (index >= 0 && index < value.length && chipRefs.current[index]) {
        setFocusedChipIndex(index);
        chipRefs.current[index]?.focus();
        announce(`Focused on "${value[index]}" chip. Press Delete to remove.`);
      }
    },
    [value, announce],
  );

  const focusInput = useCallback(() => {
    setFocusedChipIndex(-1);
    inputRef.current?.focus();
  }, []);

  const { addChip, removeChip, safeOperation } = useChipInputOperations({
    value,
    onChange,
    maxItems,
    enableFallback,
    onFallbackTriggered,
    announce,
    setInputValue,
    setInternalError,
    setIsFallbackMode,
    focusedChipIndex,
    setFocusedChipIndex,
    focusInput,
  });

  const { handleInputKeyDown } = useChipInputKeyboard({
    valueLength: value.length,
    inputValue,
    enableDualEnter,
    onStepAdvance,
    addChip,
    removeLastChip: () => removeChip(value.length - 1),
    focusLastChip: () => focusChip(value.length - 1),
    safeOperation,
  });

  const handleChipKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      safeOperation(() => {
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          removeChip(index);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          if (index < value.length - 1) focusChip(index + 1);
          else focusInput();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          if (index > 0) focusChip(index - 1);
        } else if (e.key === "Escape") {
          e.preventDefault();
          focusInput();
        }
      }, "handleChipKeyDown");
    },
    [removeChip, focusChip, focusInput, value.length, safeOperation],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setInputValue(e.target.value);

  const handleFallbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    onChange(newValue);
  };

  const fallbackValue = value.join(", ");
  const isAtMax = maxItems && value.length >= maxItems;

  useEffect(() => {
    chipRefs.current = chipRefs.current.slice(0, value.length);
  }, [value.length]);

  if (isFallbackMode) {
    return (
      <div className="space-y-2" data-chip-input data-fallback-mode>
        <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm text-amber-800 dark:text-amber-200">
            Using fallback text input mode. Enter comma-separated values.
          </span>
        </div>

        <Input
          ref={fallbackInputRef}
          value={fallbackValue}
          onChange={handleFallbackChange}
          placeholder={
            placeholder
              ? `${placeholder} (comma-separated)`
              : "Enter comma-separated values"
          }
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn(
            "w-full",
            (error || internalError) && "border-destructive",
          )}
          aria-label={ariaLabel || "Text input (fallback mode)"}
          aria-describedby={ariaDescription ? descriptionId : undefined}
          aria-invalid={!!(error || internalError)}
        />

        {(error || internalError) && (
          <p
            id={errorId}
            className="text-sm text-destructive font-medium"
            role="alert"
          >
            {error || internalError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2" data-chip-input>
      <output
        ref={liveRegionRef}
        id={liveRegionId}
        aria-live="polite"
        aria-atomic="false"
        className="sr-only"
      >
        {announcementText}
      </output>

      <div
        className={cn(
          "relative min-h-12 p-3 border-2 rounded-md transition-all duration-200",
          "focus-within:border-primary",
          (error || internalError) && "border-destructive",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
        role="combobox"
        tabIndex={0}
        aria-expanded="false"
        aria-haspopup="listbox"
        aria-label={ariaLabel || "Multi-select input"}
      >
        {icon && (
          <div
            className="absolute left-3 top-3 text-muted-foreground"
            aria-hidden="true"
          >
            {icon}
          </div>
        )}

        <div className={cn("flex flex-wrap gap-2", icon && "ml-7")}>
          {value.map((chip, index) => (
            <Badge
              key={chip}
              variant="default"
              className={cn(
                "px-2 py-1 text-sm flex items-center gap-1 transition-all duration-200",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                focusedChipIndex === index &&
                  "ring-2 ring-primary ring-offset-1",
              )}
            >
              <span>{chip}</span>
              <Button
                ref={(el) => {
                  chipRefs.current[index] = el;
                }}
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent focus:ring-2 focus:ring-primary focus:ring-offset-1"
                onClick={() => removeChip(index)}
                onKeyDown={(e) => handleChipKeyDown(e, index)}
                disabled={disabled}
                aria-label={`Remove ${chip}`}
                tabIndex={focusedChipIndex === index ? 0 : -1}
              >
                <X className="w-3 h-3 hover:text-destructive" />
              </Button>
            </Badge>
          ))}

          {!isAtMax && (
            <div className="flex-1 min-w-[120px]">
              <Input
                ref={inputRef}
                id={inputId}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder={value.length === 0 ? placeholder : ""}
                disabled={disabled}
                autoFocus={autoFocus}
                className="border-0 p-0 h-auto text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          )}
        </div>

        {inputValue.trim() && !isAtMax && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0 focus:ring-2 focus:ring-primary focus:ring-offset-1"
            onClick={() => addChip(inputValue)}
            disabled={disabled}
            aria-label={`Add "${inputValue}"`}
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex justify-between items-center min-h-5">
        <div>
          {(error || internalError) && (
            <p
              id={errorId}
              className="text-sm text-destructive font-medium"
              role="alert"
            >
              {error || internalError}
            </p>
          )}
        </div>

        {maxItems && (
          <output
            className={cn(
              "text-xs text-muted-foreground",
              value.length > maxItems * 0.8 && "text-amber-600",
              value.length === maxItems && "text-destructive",
            )}
          >
            {value.length}/{maxItems}
          </output>
        )}
      </div>
    </div>
  );
}

/**
 * Controller-compatible ChipInput wrapper for React Hook Form
 * Includes enhanced accessibility and fallback support
 */
export function ControlledChipInput({
  field,
  ...props
}: ControlledChipInputProps) {
  const handleFallbackTriggered = useCallback(
    (error: Error) => {
      log.warn("ChipInput fallback triggered for field:", field.name, error);
      props.onFallbackTriggered?.(error);
    },
    [field.name, props.onFallbackTriggered],
  );

  return (
    <ChipInput
      {...props}
      value={field.value || []}
      onChange={(values) => field.onChange(values)}
      onFallbackTriggered={handleFallbackTriggered}
      ariaLabel={props.ariaLabel || `${field.name} selection`}
    />
  );
}
