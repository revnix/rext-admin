"use client";

import type { ReactNode } from "react";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/**
 * Standard form section for grouping related form fields
 *
 * @example
 * ```tsx
 * <FormSection
 *   title="Basic Information"
 *   description="Provide basic details about your workspace"
 * >
 *   <FormField label="Name">
 *     <Input {...register('name')} />
 *   </FormField>
 *   <FormField label="Description">
 *     <Textarea {...register('description')} />
 *   </FormField>
 * </FormSection>
 * ```
 */
export function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
