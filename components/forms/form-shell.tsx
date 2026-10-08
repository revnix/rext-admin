"use client";

import { Loader2 } from "lucide-react";
import type { FocusEvent, ReactNode } from "react";
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
import { useHydrated } from "@/hooks/use-hydrated";
import { useLeaveGuard } from "./use-leave-guard";

/**
 * The one way a form is laid out (design/app-language.md §5, research 06 §6.6): sections 32 px
 * apart, fields 16 px apart inside them, and the submit row last. Save stays enabled until the
 * submission starts, then shows a spinner and keeps its label; a failed submit focuses the first
 * error (useZodForm). Leaving with unsaved changes asks first. The column's width is FormPage's.
 */
/**
 * A focused field that's already on screen isn't scrolled by the browser, even when the sticky
 * submit row covers it; scrollIntoView honours html's scroll-padding (globals.css), so the field
 * moves up clear of the row (WCAG 2.4.11). The row's own buttons stay where the row is.
 */
function keepClearOfStickyRow(event: FocusEvent<HTMLFormElement>) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest('[data-slot="form-submit-row"]')) return;
  // Optional: jsdom (the tests) has no scrollIntoView.
  target.scrollIntoView?.({ block: "nearest" });
}

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
  dirty = false,
  keepsDraft = false,
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
  /** Unsaved changes the form's own state doesn't hold (a chosen file), for the leave guard. */
  dirty?: boolean;
  /**
   * The page keeps what is typed by itself (the create-workspace form does, for the tab), so
   * leaving loses nothing: no leave guard, neither the dialog nor the browser's own prompt.
   */
  keepsDraft?: boolean;
  children: ReactNode;
  className?: string;
}) {
  // Not "submitted successfully": that holds even when the page catches its own save error.
  const { isDirty, isSubmitting } = form.formState;
  const guard = useLeaveGuard(
    (isDirty || dirty) && !isSubmitting && !keepsDraft,
  );
  const hydrated = useHydrated();

  return (
    // A submit before the page runs is the browser's own: post keeps the fields out of the address.
    <form
      method="post"
      noValidate
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      onFocus={sticky ? keepClearOfStickyRow : undefined}
      className={cn("flex flex-col gap-8", className)}
    >
      {children}
      <div
        data-slot="form-submit-row"
        // globals.css keeps keyboard focus clear above a sticky row (scroll-padding on html).
        data-sticky={sticky || undefined}
        className={cn(
          "flex flex-wrap items-center gap-2",
          sticky &&
            // Above the phone's bottom bar, as the generation dock sits (app-shell.tsx).
            "sticky bottom-(--bottom-bar-height) z-(--z-sticky) -mx-1 border-t bg-background px-1 py-3 lg:bottom-0",
        )}
      >
        <Button type="submit" disabled={!hydrated || isSubmitting}>
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
