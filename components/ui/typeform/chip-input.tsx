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

"use client";

import { AlertTriangle, Plus, X } from "lucide-react";
import * as React from "react";
import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { log } from "@/lib/logger";
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
  const [inputValue, setInputValue] = React.useState("");
  const [lastEnterTime, setLastEnterTime] = React.useState<number | null>(null);
  const [focusedChipIndex, setFocusedChipIndex] = React.useState<number>(-1);
  const [isFallbackMode, setIsFallbackMode] = React.useState(false);
  const [announcementText, setAnnouncementText] = React.useState("");

  //  internal error state for dynamic validation
  const [internalError, setInternalError] = React.useState<string | undefined>(
    undefined,
  );

  const inputRef = React.useRef<HTMLInputElement>(null);
  const chipRefs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const fallbackInputRef = React.useRef<HTMLInputElement>(null);
  const liveRegionRef = React.useRef<HTMLOutputElement>(null);

  // Dual enter timeout (500ms window for second enter)
  // const DUAL_ENTER_TIMEOUT = 500;

  // Generate unique IDs for accessibility
  const inputId = React.useId();
  const descriptionId = React.useId();
  const errorId = React.useId();
  const liveRegionId = React.useId();

  // Announce to screen readers
  const announce = React.useCallback((message: string) => {
    setAnnouncementText(message);
    // Clear after a short delay to allow for multiple announcements
    setTimeout(() => setAnnouncementText(""), 100);
  }, []);

  // Error boundary for fallback functionality
  const triggerFallback = React.useCallback(
    (error: Error) => {
      log.error("ChipInput error, falling back to text input:", error);
      setIsFallbackMode(true);
      announce("Switched to text input mode due to an error");
      onFallbackTriggered?.(error);
    },
    [announce, onFallbackTriggered],
  );

  // Safe wrapper for operations that might fail
  const safeOperation = React.useCallback(
    (operation: () => void, context: string) => {
      if (!enableFallback) {
        operation();
        return;
      }

      try {
        operation();
      } catch (error) {
        log.error(`ChipInput operation failed (${context}):`, error);
        triggerFallback(error as Error);
      }
    },
    [enableFallback, triggerFallback],
  );

  const addChip = React.useCallback(
    (chipValue: string) => {
      return (
        safeOperation(() => {
          const trimmedValue = chipValue.trim();
          if (
            trimmedValue &&
            !value.includes(trimmedValue) &&
            (!maxItems || value.length < maxItems)
          ) {
            onChange([...value, trimmedValue]);
            setInputValue("");
            announce(
              `Added "${trimmedValue}". ${value.length + 1} item${value.length === 0 ? "" : "s"} selected.`,
            );
            setInternalError(undefined); //  clear error once added
            return true;
          } else if (!trimmedValue) {
            announce("Cannot add empty item");
          } else if (value.includes(trimmedValue)) {
            announce(`"${trimmedValue}" is already selected`);
          } else if (maxItems && value.length >= maxItems) {
            announce(`Maximum ${maxItems} items allowed`);
          }
          return false;
        }, "addChip") ?? false
      );
    },
    [value, onChange, maxItems, announce, safeOperation],
  );

  const removeChip = React.useCallback(
    (index: number) => {
      safeOperation(() => {
        const removedChip = value[index];
        const newValue = value.filter((_, i) => i !== index);
        onChange(newValue);
        announce(
          `Removed "${removedChip}". ${newValue.length} item${newValue.length === 1 ? "" : "s"} remaining.`,
        );

        //  if all chips removed, show error
        if (newValue.length === 0) {
          setInternalError("At least one item is required");
        }

        if (focusedChipIndex === index) {
          setFocusedChipIndex(-1);
          inputRef.current?.focus();
        } else if (focusedChipIndex > index) {
          setFocusedChipIndex(focusedChipIndex - 1);
        }
      }, "removeChip");
    },
    [value, onChange, announce, safeOperation, focusedChipIndex],
  );

  //  Automatically add one chip on mount
  React.useEffect(() => {
    if (value.length === 0) {
      onChange(["Small business owners"]);
      setInternalError(undefined);
    }
  }, [value.length, onChange]);

  //  Clear error when at least one chip exists
  React.useEffect(() => {
    if (value.length > 0 && internalError) {
      setInternalError(undefined);
    }
  }, [value.length, internalError]);

  // Keyboard navigation helpers
  const focusChip = React.useCallback(
    (index: number) => {
      if (index >= 0 && index < value.length && chipRefs.current[index]) {
        setFocusedChipIndex(index);
        chipRefs.current[index]?.focus();
        announce(`Focused on "${value[index]}" chip. Press Delete to remove.`);
      }
    },
    [value, announce],
  );

  const focusInput = React.useCallback(() => {
    setFocusedChipIndex(-1);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    safeOperation(() => {
      if (e.key === "Enter") {
        e.preventDefault();

        if (!enableDualEnter) {
          addChip(inputValue);
          return;
        }

        const now = Date.now();
        const hasContent = inputValue.trim().length > 0;

        if (hasContent) {
          const chipAdded = addChip(inputValue);
          if (chipAdded) {
            setLastEnterTime(now);
            log.info("🏷️ Chip added, ready for step advance on next enter");
          }
        } else {
          if (lastEnterTime && now - lastEnterTime <= 500) {
            log.info("⏭️ Dual enter detected, advancing step");
            setLastEnterTime(null);
            onStepAdvance?.();
          } else {
            log.info("⏭️ Enter on empty input, advancing step");
            onStepAdvance?.();
          }
        }
      } else if (
        e.key === "Backspace" &&
        inputValue === "" &&
        value.length > 0
      ) {
        removeChip(value.length - 1);
        setLastEnterTime(null);
      } else if (
        e.key === "ArrowLeft" &&
        inputValue === "" &&
        value.length > 0
      ) {
        e.preventDefault();
        focusChip(value.length - 1);
      } else {
        setLastEnterTime(null);
      }
    }, "handleKeyDown");
  };

  const handleChipKeyDown = React.useCallback(
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

  React.useEffect(() => {
    chipRefs.current = chipRefs.current.slice(0, value.length);
  }, [value.length]);

  if (isFallbackMode) {
    return (
      <div className="space-y-2" data-chip-input data-fallback-mode>
        <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
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
                onKeyDown={handleKeyDown}
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

      <div className="flex justify-between items-center min-h-[20px]">
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
  const handleFallbackTriggered = React.useCallback(
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
