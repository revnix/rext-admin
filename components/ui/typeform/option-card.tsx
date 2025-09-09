/**
 * TypeForm-style Option Card Component
 *
 * Interactive card component for single and multi-select options with animations,
 * icons, and full accessibility support. Designed to match TypeForm's visual patterns.
 */

"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import * as React from "react";
import {
  getMotionVariants,
  optionCardVariants,
  selectionIndicatorVariants,
  useReducedMotion,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { OptionCardProps } from "@/types/typeform";

const OptionCard = React.forwardRef<HTMLButtonElement, OptionCardProps>(
  (
    {
      value,
      label,
      description,
      icon: Icon,
      selected = false,
      disabled = false,
      onClick,
      className,
      size = "md",
      variant = "default",
      showSelection = true,
      animateOnSelect = true,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const motionVariants = getMotionVariants(
      optionCardVariants,
      prefersReducedMotion,
    );
    const indicatorVariants = getMotionVariants(
      selectionIndicatorVariants,
      prefersReducedMotion,
    );

    const handleClick = React.useCallback(() => {
      if (!disabled && onClick) {
        onClick(value);
      }
    }, [disabled, onClick, value]);

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleClick();
        }
      },
      [handleClick],
    );

    // Size variants
    const sizeClasses = {
      sm: "p-3 text-sm",
      md: "p-4 text-base",
      lg: "p-6 text-lg",
    };

    // Variant styles
    const variantClasses = {
      default: "flex items-start gap-3",
      compact: "flex items-center gap-2",
      detailed: "flex flex-col items-center text-center gap-2",
    };

    return (
      <motion.button
        ref={ref}
        type="button"
        className={cn(
          // Base styles
          "relative w-full rounded-lg border-2 bg-card text-card-foreground transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-60",
          // Touch-friendly minimum height
          "min-h-[44px]",
          // Layout based on variant
          variantClasses[variant],
          // Size-based padding and text
          sizeClasses[size],
          className,
        )}
        variants={motionVariants}
        initial="idle"
        animate={selected ? "selected" : disabled ? "disabled" : "idle"}
        whileHover={!disabled ? "hover" : undefined}
        whileTap={!disabled ? "tap" : undefined}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel || `${selected ? "Selected" : "Select"} ${label}`}
        aria-pressed={selected}
        role="option"
        aria-selected={selected}
        {...props}
      >
        {/* Icon */}
        {Icon && (
          <div
            className={cn(
              "flex-shrink-0",
              variant === "detailed" ? "mb-1" : "",
              size === "sm" ? "w-4 h-4" : size === "lg" ? "w-7 h-7" : "w-5 h-5",
            )}
          >
            <Icon
              className={cn(
                "w-full h-full",
                selected ? "text-primary" : "text-muted-foreground",
              )}
              aria-hidden="true"
            />
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            "flex-1 text-left",
            variant === "detailed" ? "text-center" : "",
            variant === "compact" ? "flex items-center gap-2" : "",
          )}
        >
          <div
            className={cn(
              "font-medium",
              selected ? "text-foreground" : "text-foreground",
              size === "sm"
                ? "text-sm"
                : size === "lg"
                  ? "text-lg"
                  : "text-base",
            )}
          >
            {label}
          </div>

          {description && variant !== "compact" && (
            <div
              className={cn(
                "text-muted-foreground mt-1",
                size === "sm"
                  ? "text-xs"
                  : size === "lg"
                    ? "text-sm"
                    : "text-sm",
              )}
            >
              {description}
            </div>
          )}
        </div>

        {/* Selection Indicator */}
        {showSelection && (
          <div className="flex-shrink-0 ml-2">
            {selected ? (
              <motion.div
                variants={indicatorVariants}
                initial="hidden"
                animate="visible"
                className={cn(
                  "rounded-full bg-primary text-primary-foreground flex items-center justify-center",
                  size === "sm"
                    ? "w-4 h-4"
                    : size === "lg"
                      ? "w-6 h-6"
                      : "w-5 h-5",
                )}
                aria-hidden="true"
              >
                <Check
                  className={cn(
                    size === "sm"
                      ? "w-2.5 h-2.5"
                      : size === "lg"
                        ? "w-4 h-4"
                        : "w-3 h-3",
                  )}
                />
              </motion.div>
            ) : (
              <div
                className={cn(
                  "rounded-full border-2 border-muted-foreground/30",
                  size === "sm"
                    ? "w-4 h-4"
                    : size === "lg"
                      ? "w-6 h-6"
                      : "w-5 h-5",
                )}
                aria-hidden="true"
              />
            )}
          </div>
        )}
      </motion.button>
    );
  },
);

OptionCard.displayName = "OptionCard";

export { OptionCard };
export type { OptionCardProps };
