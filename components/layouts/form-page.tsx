"use client";

import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
}

interface FormPageProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  children: ReactNode;
}

/**
 * Standard layout for create/edit form pages
 *
 * @example
 * ```tsx
 * <FormPage
 *   title="Create Workspace"
 *   description="Set up a new workspace"
 *   breadcrumbs={[
 *     { label: 'Workspaces', href: '/workspaces' },
 *     { label: 'New Workspace' }
 *   ]}
 *   onSubmit={handleSubmit}
 *   onCancel={() => router.back()}
 *   isSubmitting={isLoading}
 * >
 *   <FormSection title="Basic Information">
 *     <FormField label="Name">
 *       <Input {...register('name')} />
 *     </FormField>
 *   </FormSection>
 * </FormPage>
 * ```
 */
export function FormPage({
  title,
  description,
  breadcrumbs,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  children,
}: FormPageProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Form Card */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit}>
            {/* Form Fields */}
            <div className="space-y-6">{children}</div>

            {/* Form Actions */}
            <div className="flex gap-3 mt-8 pt-6 border-t">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : submitLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {cancelLabel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
