"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

export interface Choice {
  value: string;
  label: ReactNode;
  /** Under the label: what the choice does, or why it can't be made. */
  description?: ReactNode;
  disabled?: boolean;
}

/**
 * One choice among a few, each with a line under its name: a radio group drawn as one bordered
 * list, the checked one on the inset surface. For a `FieldController`, which labels it and shows
 * its error: pass the field's `id`, `value`, `onChange` and its two aria attributes.
 */
export function ChoiceList({
  id,
  label,
  value,
  onChange,
  choices,
  className,
  "aria-invalid": invalid,
  "aria-describedby": describedBy,
}: {
  id?: string;
  /** The group's name for assistive technology: the field's label in plain words. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  choices: Choice[];
  className?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  const ids = useId();
  return (
    <RadioGroupPrimitive.Root
      id={id}
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      value={value}
      onValueChange={onChange}
      className={cn(
        "divide-y divide-border rounded-md border border-border aria-invalid:border-destructive",
        className,
      )}
    >
      {choices.map((choice) => (
        <label
          key={choice.value}
          htmlFor={`${ids}-${choice.value}`}
          className="flex cursor-pointer items-start gap-3 px-3 py-2.5 first:rounded-t-md last:rounded-b-md hover:bg-surface-inset has-data-disabled:cursor-not-allowed has-data-disabled:opacity-60 has-data-[state=checked]:bg-surface-inset"
        >
          <RadioGroupPrimitive.Item
            id={`${ids}-${choice.value}`}
            value={choice.value}
            disabled={choice.disabled}
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border-strong outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:border-primary"
          >
            <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-primary" />
          </RadioGroupPrimitive.Item>
          <span className="min-w-0 space-y-0.5">
            <span className="block text-label text-foreground">
              {choice.label}
            </span>
            {choice.description && (
              <span className="block wrap-anywhere text-caption text-muted-foreground">
                {choice.description}
              </span>
            )}
          </span>
        </label>
      ))}
    </RadioGroupPrimitive.Root>
  );
}
