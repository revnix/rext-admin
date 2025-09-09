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
          "w-full max-w-5xl mx-auto",
          "px-6 py-8 md:px-8 md:py-12",
          className,
        )}
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        aria-labelledby={titleId}
        aria-describedby={ariaDescribedBy}
        {...props}
      >
        {/* Progress indicator (if provided) */}
        {progress && (
          <motion.div
            className="mb-8 text-sm text-muted-foreground"
            variants={itemVariants}
          >
            Question {progress.current} of {progress.total}
          </motion.div>
        )}

        {/* Question Title */}
        <motion.legend
          id={titleId}
          className={cn(
            "text-3xl md:text-4xl font-bold leading-tight mb-4",
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
              "text-lg text-muted-foreground mb-8 leading-relaxed",
              "max-w-prose",
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
              "mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20",
              "text-destructive font-medium",
            )}
            variants={itemVariants}
          >
            <span className="sr-only">Error: </span>
            {error}
          </motion.div>
        )}

        {/* Question Content */}
        <motion.div className="mb-8" variants={itemVariants}>
          {children}
        </motion.div>

        {/* Help Text */}
        {helpText && (
          <motion.div
            id={helpId}
            className={cn(
              "text-sm text-muted-foreground leading-relaxed",
              "max-w-prose",
            )}
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
