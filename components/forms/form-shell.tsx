"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import type {
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormReturn,
} from "react-hook-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { useLeaveGuard } from "./use-leave-guard";

/**
 * The one way a form is laid out (design/app-language.md §5, research 06 §6.6): sections 32 px
 * apart, fields 16 px apart inside them, and the submit row last. Save stays enabled until the
 * submission starts, then shows a spinner and keeps its label; a failed submit focuses the first
 * error (useZodForm). Leaving with unsaved changes asks first. The column's width is FormPage's.
 */
export function FormShell<
  TInput extends FieldValues,
  TOutput extends FieldValues,
>({
  form,
  onSubmit,
  onInvalid,
  submitLabel,
  cancel,
  sticky = false,
  status,
  children,
  className,
}: {
  form: UseFormReturn<TInput, unknown, TOutput>;
  onSubmit: SubmitHandler<TOutput>;
  onInvalid?: SubmitErrorHandler<TInput>;
  submitLabel: string;
  /** The plain button beside Save: leaves the form, asking first when it is dirty. */
  cancel?: { label?: string; onCancel: () => void };
  /** Keeps the submit row at the bottom of the window, for forms longer than a screen. */
  sticky?: boolean;
  /** Beside Save, announced to screen readers: the inline "Saved" after a section saves. */
  status?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  // Not "submitted successfully": that holds even when the page catches its own save error.
  const { isDirty, isSubmitting } = form.formState;
  const guard = useLeaveGuard(isDirty && !isSubmitting);

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      className={cn("flex flex-col gap-8", className)}
    >
      {children}
      <div
        data-slot="form-submit-row"
        className={cn(
          "flex flex-wrap items-center gap-2",
          sticky &&
            "sticky bottom-0 z-(--z-sticky) -mx-1 border-t bg-background px-1 py-3",
        )}
      >
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" aria-hidden />}
          {submitLabel}
        </Button>
        {cancel && (
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={() => guard.confirm(cancel.onCancel)}
          >
            {cancel.label ?? "Cancel"}
          </Button>
        )}
        <span role="status" className="text-sm text-muted-foreground">
          {status}
        </span>
      </div>

      <AlertDialog
        open={guard.isAsking}
        onOpenChange={(open) => !open && guard.stay()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              Your changes on this page haven't been saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={guard.leave}>
              Leave without saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

/** A titled group of fields; sections are 32 px apart and fields 16 px apart within one. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-section">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <FieldGroup>{children}</FieldGroup>
    </section>
  );
}
