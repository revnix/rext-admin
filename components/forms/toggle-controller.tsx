"use client";

import type { ReactNode } from "react";
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

/**
 * A yes-or-no field of a form (design/app-language.md §5): a checkbox before its label, or a switch
 * after it, with the help text beneath the label and the error replacing it. The field set's
 * FieldController puts the label above the control; a toggle reads better beside it.
 */
export function ToggleController<
  TValues extends FieldValues,
  TName extends FieldPath<TValues>,
>({
  control,
  name,
  label,
  description,
  kind = "checkbox",
  disabled,
}: {
  control: Control<TValues>;
  name: TName;
  label: ReactNode;
  description?: ReactNode;
  kind?: "checkbox" | "switch";
  disabled?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${name}`;
        const helpId = `${id}-help`;
        const invalid = fieldState.invalid;
        const props = {
          id,
          ref: field.ref,
          checked: field.value === true,
          onCheckedChange: (checked: boolean | "indeterminate") =>
            field.onChange(checked === true),
          onBlur: field.onBlur,
          disabled,
          "aria-invalid": invalid,
          "aria-describedby": invalid || description ? helpId : undefined,
        };
        const text = (
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <FieldLabel htmlFor={id} className="font-medium">
              {label}
            </FieldLabel>
            {invalid ? (
              <FieldError id={helpId} errors={[fieldState.error]} />
            ) : (
              description && (
                <p id={helpId} className="text-sm text-muted-foreground">
                  {description}
                </p>
              )
            )}
          </div>
        );
        return (
          <Field
            orientation="horizontal"
            data-invalid={invalid}
            className="rounded-md border border-border p-4"
          >
            {kind === "checkbox" ? (
              <>
                <Checkbox {...props} />
                {text}
              </>
            ) : (
              <>
                {text}
                <Switch {...props} />
              </>
            )}
          </Field>
        );
      }}
    />
  );
}
