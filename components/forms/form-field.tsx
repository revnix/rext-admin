"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
}

/**
 * Standard form field wrapper with label, description, error display
 *
 * @example
 * ```tsx
 * <FormField
 *   label="Workspace Name"
 *   description="A unique name for your workspace"
 *   error={errors.name}
 *   required
 * >
 *   <Input
 *     value={name}
 *     onChange={(e) => setName(e.target.value)}
 *     placeholder="My Workspace"
 *   />
 * </FormField>
 * ```
 */
export function FormField({
  label,
  description,
  error,
  required,
  htmlFor,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      {/* Label */}
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {/* Description */}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Input/Control */}
      {children}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
