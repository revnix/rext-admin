"use client";

import type { ReactNode } from "react";
import {
  type Control,
  Controller,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

/** What the control receives: react-hook-form's binding plus the ids that tie it to its label. */
export type FieldControlProps<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
> = ControllerRenderProps<TValues, TName> & {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
};

/**
 * One field of a form (design/app-language.md §5): the label above the control, marked with a
 * leading asterisk when required; the help text beneath, which an error replaces; the control's edge
 * and the message in the danger colour. `maxLength` adds a count beside the label.
 */
export function FieldController<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  control,
  name,
  label,
  description,
  required = false,
  maxLength,
  className,
  children,
}: {
  control: Control<TValues>;
  name: TName;
  label: ReactNode;
  description?: ReactNode;
  required?: boolean;
  maxLength?: number;
  className?: string;
  children: (field: FieldControlProps<TValues, TName>) => ReactNode;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${name}`;
        const helpId = `${id}-help`;
        const invalid = fieldState.invalid;
        const hasHelp = invalid || Boolean(description);
        const length =
          typeof field.value === "string" ? field.value.trim().length : 0;
        return (
          <Field data-invalid={invalid} className={className}>
            <div className="flex items-baseline justify-between gap-3">
              <FieldLabel htmlFor={id}>
                {required && (
                  <span aria-hidden className="-mr-1.5 text-destructive">
                    *
                  </span>
                )}
                {label}
                {required && <span className="sr-only">(required)</span>}
              </FieldLabel>
              {maxLength !== undefined && (
                <span
                  className={cn(
                    "num text-xs text-muted-foreground",
                    length > maxLength && "text-destructive",
                  )}
                >
                  {length} / {maxLength}
                </span>
              )}
            </div>
            {children({
              ...field,
              id,
              "aria-invalid": invalid,
              "aria-describedby": hasHelp ? helpId : undefined,
            })}
            {invalid ? (
              <FieldError id={helpId} errors={[fieldState.error]} />
            ) : (
              description && (
                <FieldDescription id={helpId}>{description}</FieldDescription>
              )
            )}
          </Field>
        );
      }}
    />
  );
}
