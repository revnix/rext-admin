"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type FieldValues, type UseFormProps, useForm } from "react-hook-form";
import type { z } from "zod";

/**
 * A form on a zod schema from `schemas/`, with the validation timing of design/app-language.md §5:
 * a field is checked when it loses focus, then on every change once it has an error, and a failed
 * submit moves focus to the first error (research 06 §6.1).
 */
export function useZodForm<
  TInput extends FieldValues,
  TOutput extends FieldValues = TInput,
>(
  schema: z.ZodType<TOutput, TInput>,
  options: Omit<UseFormProps<TInput, unknown, TOutput>, "resolver"> = {},
) {
  return useForm<TInput, unknown, TOutput>({
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
    ...options,
    resolver: zodResolver(schema),
  });
}
