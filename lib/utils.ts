// File: lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { logger } from "@/lib/logger";
import type { z } from "zod";

// The type roles in app/globals.css are font sizes. Unregistered, tailwind-merge reads
// `text-page-title` as a colour and drops it next to `text-foreground`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display",
        "page-title",
        "section",
        "body",
        "table",
        "label",
        "caption",
        "data",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeJsonParse<T>(
  data: unknown,
  fallback: T | null = null,
  context?: string,
): T | null {
  if (data === null || data === undefined) return fallback;
  if (typeof data !== "string") return data as T;
  if (data.trim() === "") return fallback;

  try {
    return JSON.parse(data) as T;
  } catch (error) {
    logger.error(
      `Failed to parse JSON${context ? ` for ${context}` : ""}`,
      error instanceof Error ? error : new Error(String(error)),
      { rawDataLength: data.length, rawDataPreview: data.slice(0, 100) },
    );
    return fallback;
  }
}

export function safeJsonParseWithSchema<T>(
  data: unknown,
  schema: z.ZodType<T>,
  fallback: T | null = null,
  context?: string,
): T | null {
  const parsed = safeJsonParse<unknown>(data, null, context);
  if (parsed === null) return fallback;

  const result = schema.safeParse(parsed);
  if (!result.success) {
    logger.error(
      `JSON schema validation failed${context ? ` for ${context}` : ""}`,
      result.error,
      { issueCount: result.error.issues.length },
    );
    return fallback;
  }

  return result.data;
}
