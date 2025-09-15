/**
 * Validation Message Component
 *
 * A reusable component for displaying validation errors and warnings
 * with consistent styling and animation.
 */

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface ValidationMessageProps {
  /**
   * Field ID for accessibility
   */
  fieldId: string;

  /**
   * Error messages to display
   */
  errors?: string[];

  /**
   * Warning messages to display
   */
  warnings?: string[];

  /**
   * Success message to display
   */
  success?: string;

  /**
   * Whether the field has been touched by the user
   */
  isTouched?: boolean;

  /**
   * Whether to show icons with messages
   */
  showIcon?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Whether to show all errors or just the first one
   */
  showAllErrors?: boolean;

  /**
   * Custom animation duration (ms)
   */
  animationDuration?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ValidationMessage component with animations and accessibility
 */
export const ValidationMessage = memo<ValidationMessageProps>(
  ({
    fieldId,
    errors = [],
    warnings = [],
    success,
    isTouched = false,
    showIcon = true,
    className,
    showAllErrors = false,
    animationDuration = 200,
  }) => {
    // Don't show validation messages until the field has been touched
    if (!isTouched) return null;

    // Determine message type and content
    const hasErrors = errors.length > 0;
    const hasWarnings = warnings.length > 0 && !hasErrors;
    const hasSuccess = success && !hasErrors && !hasWarnings;
    const hasMessage = hasErrors || hasWarnings || hasSuccess;

    if (!hasMessage) return null;

    // Get message content
    let message = "";
    let messageType: "error" | "warning" | "success" = "error";
    let Icon = AlertCircle;
    let iconColor = "text-red-500";
    let textColor = "text-red-600";

    if (hasErrors) {
      if (showAllErrors) {
        message = errors.join(", ");
      } else {
        message =
          errors.length > 1
            ? `${errors[0]} (${errors.length - 1} more issue${errors.length > 2 ? "s" : ""})`
            : errors[0];
      }
      messageType = "error";
      Icon = AlertCircle;
      iconColor = "text-red-500";
      textColor = "text-red-600";
    } else if (hasWarnings) {
      message = warnings[0];
      messageType = "warning";
      Icon = AlertTriangle;
      iconColor = "text-yellow-500";
      textColor = "text-yellow-600";
    } else if (hasSuccess) {
      message = success;
      messageType = "success";
      Icon = CheckCircle;
      iconColor = "text-green-500";
      textColor = "text-green-600";
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`${fieldId}-${messageType}`}
          id={`${fieldId}-validation`}
          role="alert"
          aria-live="polite"
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: animationDuration / 1000 }}
          className={cn(
            "flex items-start gap-2 mt-1 text-sm overflow-hidden",
            textColor,
            className,
          )}
        >
          {showIcon && (
            <Icon
              size={16}
              className={cn("mt-0.5 flex-shrink-0", iconColor)}
              aria-hidden="true"
            />
          )}
          <span className="leading-5">{message}</span>
        </motion.div>
      </AnimatePresence>
    );
  },
);

ValidationMessage.displayName = "ValidationMessage";

// ============================================================================
// VALIDATION MESSAGE GROUP
// ============================================================================

interface ValidationMessageGroupProps {
  /**
   * Multiple validation messages to display
   */
  messages: Array<{
    fieldId: string;
    errors?: string[];
    warnings?: string[];
    success?: string;
    isTouched?: boolean;
  }>;

  /**
   * Whether to show icons with messages
   */
  showIcon?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Maximum number of messages to show
   */
  maxMessages?: number;
}

/**
 * Component for displaying multiple validation messages
 */
export const ValidationMessageGroup = memo<ValidationMessageGroupProps>(
  ({ messages, showIcon = true, className, maxMessages = 5 }) => {
    const visibleMessages = messages
      .filter(
        (msg) =>
          msg.isTouched &&
          ((msg.errors && msg.errors.length > 0) ||
            (msg.warnings && msg.warnings.length > 0) ||
            msg.success),
      )
      .slice(0, maxMessages);

    if (visibleMessages.length === 0) return null;

    return (
      <div className={cn("space-y-1", className)}>
        {visibleMessages.map((msg) => (
          <ValidationMessage
            key={msg.fieldId}
            fieldId={msg.fieldId}
            errors={msg.errors}
            warnings={msg.warnings}
            success={msg.success}
            isTouched={msg.isTouched}
            showIcon={showIcon}
          />
        ))}
        {messages.length > maxMessages && (
          <div className="text-xs text-muted-foreground mt-1">
            ... and {messages.length - maxMessages} more validation issues
          </div>
        )}
      </div>
    );
  },
);

ValidationMessageGroup.displayName = "ValidationMessageGroup";

// ============================================================================
// FIELD VALIDATION WRAPPER
// ============================================================================

interface FieldValidationWrapperProps {
  /**
   * Field configuration
   */
  field: {
    id: string;
    label: string;
    required?: boolean;
  };

  /**
   * Field value
   */
  value: any;

  /**
   * Form data for context
   */
  formData: any;

  /**
   * Whether field has been touched
   */
  isTouched?: boolean;

  /**
   * Validation errors
   */
  errors?: string[];

  /**
   * Validation warnings
   */
  warnings?: string[];

  /**
   * Children to render (the form field)
   */
  children: React.ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Wrapper component that adds validation styling and messages to any field
 */
export const FieldValidationWrapper = memo<FieldValidationWrapperProps>(
  ({
    field,
    value,
    formData,
    isTouched = false,
    errors = [],
    warnings = [],
    children,
    className,
  }) => {
    const hasErrors = errors.length > 0;
    const hasWarnings = warnings.length > 0 && !hasErrors;
    const hasValue =
      value !== null &&
      value !== undefined &&
      value !== "" &&
      (!Array.isArray(value) || value.length > 0);

    return (
      <div className={cn("space-y-1", className)}>
        <div className="relative">
          {children}

          {/* Validation status indicator */}
          {isTouched && hasValue && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {hasErrors ? (
                <AlertCircle size={16} className="text-red-500" />
              ) : hasWarnings ? (
                <AlertTriangle size={16} className="text-yellow-500" />
              ) : (
                <CheckCircle size={16} className="text-green-500" />
              )}
            </div>
          )}
        </div>

        <ValidationMessage
          fieldId={field.id}
          errors={errors}
          warnings={warnings}
          isTouched={isTouched}
          showIcon={true}
        />
      </div>
    );
  },
);

FieldValidationWrapper.displayName = "FieldValidationWrapper";
