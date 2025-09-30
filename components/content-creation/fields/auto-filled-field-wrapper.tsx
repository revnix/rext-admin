"use client";

import { Info } from "lucide-react";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AutoFilledFieldWrapperProps {
  /** Whether this field was auto-filled from topic data */
  isAutoFilled: boolean;
  /** Whether the field has been modified by the user after auto-filling */
  isModified?: boolean;
  /** Field label to display */
  label: string;
  /** Field description */
  description: string;
  /** Icon to display next to the label */
  icon: ReactNode;
  /** The form field content */
  children: ReactNode;
  /** Error content to display if validation fails */
  errorContent?: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Auto-filled Field Wrapper Component
 *
 * Wraps form fields that can be auto-filled from topic data and provides
 * visual indicators when fields are pre-filled. Shows:
 * - Subtle background highlighting for auto-filled fields
 * - Info icon with tooltip explaining the pre-fill source
 * - Removes highlighting when user modifies the field
 */
export function AutoFilledFieldWrapper({
  isAutoFilled,
  isModified = false,
  label,
  description,
  icon,
  children,
  errorContent,
  className = "",
}: AutoFilledFieldWrapperProps) {
  // Determine if we should show auto-fill indicators
  const showAutoFillIndicator = isAutoFilled && !isModified;

  return (
    <Card
      className={`wizard-card ${className} ${
        showAutoFillIndicator ? "bg-blue-50/50 border-blue-200/50" : ""
      }`}
    >
      <CardHeader className="pb-4">
        <CardTitle className="wizard-field-label flex items-center gap-2">
          {icon}
          {label}
          {showAutoFillIndicator && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-blue-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pre-filled from topic data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        <CardDescription className="wizard-field-description">
          {description}
          {showAutoFillIndicator && (
            <span className="text-blue-600 text-xs font-medium ml-2">
              (Auto-filled)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {children}
        {errorContent}
      </CardContent>
    </Card>
  );
}
