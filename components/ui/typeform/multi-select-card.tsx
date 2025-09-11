/**
 * Multi Select Card Component
 *
 * Interactive card component for multi-selection questions.
 */

"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import {
  getMotionVariants,
  questionItemVariants,
  useReducedMotion,
} from "@/lib/animations";
import { cn } from "@/lib/utils";

export interface MultiSelectCardProps {
  /** Option label */
  label: string;

  /** Option description */
  description?: string;

  /** Option value */
  value: string;

  /** Whether this option is selected */
  selected: boolean;

  /** Toggle handler */
  onToggle: () => void;

  /** Optional icon */
  icon?: React.ReactNode;

  /** Whether the option is disabled */
  disabled?: boolean;

  /** Custom class name */
  className?: string;

  /** Animation delay */
  delay?: number;
}

export function MultiSelectCard({
  label,
  description,
  value: _value,
  selected,
  onToggle,
  icon,
  disabled = false,
  className,
  delay = 0,
}: MultiSelectCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const itemVariants = getMotionVariants(
    questionItemVariants,
    prefersReducedMotion,
  );

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      className={className}
    >
      <Button
        variant="outline"
        onClick={onToggle}
        disabled={disabled}
        className={cn(
          "w-full h-auto min-h-[80px] p-4 text-left justify-start relative",
          "border-2 transition-all duration-150",
          "hover:shadow-md hover:border-primary/50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
          selected && [
            "border-primary bg-primary/5 shadow-md",
            "hover:border-primary hover:bg-primary/10",
          ],
        )}
      >
        {/* Selection indicator - Rounded checkbox style for multi-select */}
        <div
          className={cn(
            "absolute top-3 right-3 w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
            selected
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-muted-foreground/30",
          )}
        >
          {selected && <Check className="w-3 h-3" />}
        </div>

        {/* Content */}
        <div className="flex items-start gap-3 pr-8">
          {icon && (
            <div
              className={cn(
                "flex-shrink-0 mt-0.5 w-5 h-5",
                selected ? "text-primary" : "text-muted-foreground",
              )}
            >
              {icon}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "font-medium text-base mb-1",
                selected ? "text-foreground" : "text-foreground",
              )}
            >
              {label}
            </div>

            {description && (
              <div
                className={cn(
                  "text-sm leading-relaxed break-words",
                  selected
                    ? "text-muted-foreground"
                    : "text-muted-foreground/80",
                )}
              >
                {description}
              </div>
            )}
          </div>
        </div>
      </Button>
    </motion.div>
  );
}
