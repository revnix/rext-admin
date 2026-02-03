/**
 * TypeForm-style Question Card Component
 *
 * Layout wrapper for individual questions with large conversational titles,
 * optional descriptions, and proper accessibility structure.
 */

"use client";

import { motion } from "framer-motion";
import * as React from "react";
import {
  getMotionVariants,
  questionContentVariants,
  questionItemVariants,
  useReducedMotion,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { QuestionCardProps } from "@/types/typeform";

const QuestionCard = React.forwardRef<HTMLFieldSetElement, QuestionCardProps>(
  (
    {
      title,
      description,
      children,
      required = false,
      error,
      helpText,
      className,
      questionId,
      progress,
      ...props
    },
    ref,
  ) => {
    const prefersReducedMotion = useReducedMotion();
    const contentVariants = getMotionVariants(
      questionContentVariants,
      prefersReducedMotion,
    );
    const itemVariants = getMotionVariants(
      questionItemVariants,
      prefersReducedMotion,
    );

    const autoId = React.useId();
    const titleId = `${questionId ?? autoId}-title`;
    const descriptionId = `${questionId ?? autoId}-description`;
    const errorId = `${questionId ?? autoId}-error`;
    const helpId = `${questionId ?? autoId}-help`;

    // Build aria-describedby string
    const ariaDescribedBy = React.useMemo(() => {
      const ids = [];
      if (description) ids.push(descriptionId);
      if (error) ids.push(errorId);
      if (helpText) ids.push(helpId);
      return ids.length > 0 ? ids.join(" ") : undefined;
    }, [description, error, helpText, descriptionId, errorId, helpId]);

    return (
      <motion.fieldset
        ref={ref}
        className={cn(
          "w-full max-w-6xl mx-auto",
          // Responsive spacing with content-aware adjustments (further reduced)
          "px-4 py-1 sm:px-6 sm:py-2 md:px-12 md:py-3",
          // Dynamic spacing based on content length (reduced)
          description && description.length > 100 ? "lg:py-4" : "lg:py-3",
          className,
        )}
        style={
          {
            // CSS custom properties for responsive spacing
            "--question-spacing-base": "1rem",
            "--question-spacing-md": "1.5rem",
            "--question-spacing-lg": "2rem",
          } as React.CSSProperties
        }
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        aria-labelledby={titleId}
        aria-describedby={ariaDescribedBy}
        {...props}
      >
        {/* Progress indicator moved to top in QuestionRenderer */}

        {/* Question Title */}
        <motion.legend
          id={titleId}
          className={cn(
            // Standardized heading hierarchy with responsive sizing
            "text-2xl sm:text-3xl md:text-4xl font-bold leading-tight",
            // Responsive margin using spacing scale
            "mb-1 sm:mb-2 md:mb-3",
            "text-foreground",
            error ? "text-destructive" : "",
          )}
          variants={itemVariants}
          tabIndex={-1} // Allow programmatic focus for screen readers
        >
          {title}
          {required && (
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only">(required)</span>}
        </motion.legend>

        {/* Question Description */}
        {description && (
          <motion.p
            id={descriptionId}
            className={cn(
              // Standardized description typography
              "text-base sm:text-lg text-muted-foreground leading-relaxed",
              // Responsive margin based on content length
              "mb-2 sm:mb-3 md:mb-4",
            )}
            variants={itemVariants}
          >
            {description}
          </motion.p>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            id={errorId}
            role="alert"
            aria-live="polite"
            className={cn(
              // Responsive error spacing
              "mb-2 sm:mb-3 md:mb-4 p-3 sm:p-4 rounded-lg",
              "bg-destructive/10 border border-destructive/20",
              "text-sm sm:text-base text-destructive font-medium",
            )}
            variants={itemVariants}
          >
            <span className="sr-only">Error: </span>
            {error}
          </motion.div>
        )}

        {/* Question Content */}
        <motion.div
          className={cn(
            // Responsive content spacing
            "mb-2 sm:mb-3 md:mb-4",
            // Consistent spacing across all question types
            "[&>*]:mb-3 [&>*:last-child]:mb-0",
          )}
          variants={itemVariants}
        >
          {children}
        </motion.div>

        {/* Help Text */}
        {helpText && (
          <motion.div
            id={helpId}
            className={cn("text-sm text-muted-foreground leading-relaxed")}
            variants={itemVariants}
          >
            {helpText}
          </motion.div>
        )}
      </motion.fieldset>
    );
  },
);

QuestionCard.displayName = "QuestionCard";

export { QuestionCard };
export type { QuestionCardProps };
