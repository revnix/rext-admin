import { z } from "zod";

import type { BrandVoice } from "@/types/workspace";

/**
 * The brand voice as edited in workspace settings. The limits are the backend's
 * (BrandVoiceUpdateSchema in rext-backend's knowledge_schema.py): text fields of 255 or 2,000
 * characters, lists of at most 50 entries of 255 characters each, every entry unique, and each
 * needing a letter. The lists are edited one entry per line, since an entry may hold a comma.
 */
export const BRAND_VOICE_LIMITS = {
  brand_name: 255,
  about: 2000,
  customer_profile: 2000,
  selling_position: 2000,
  listItems: 50,
  listItem: 255,
} as const;

const HAS_LETTER = /\p{L}/u;

/** A list field's entries: one per line, trimmed, blank lines dropped. */
export function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function text(label: string, max: number) {
  return z
    .string()
    .max(
      max,
      `${label} must be ${max.toLocaleString("en")} characters or fewer`,
    )
    .refine(
      (value) => !value.trim() || HAS_LETTER.test(value),
      `${label} needs at least one letter`,
    );
}

function list(label: string) {
  return z.string().superRefine((value, ctx) => {
    const items = splitLines(value);
    if (items.length > BRAND_VOICE_LIMITS.listItems) {
      ctx.addIssue({
        code: "custom",
        message: `${label} can have at most ${BRAND_VOICE_LIMITS.listItems} entries`,
      });
      return;
    }
    const seen = new Set<string>();
    for (const item of items) {
      const shown = item.length > 40 ? `${item.slice(0, 40)}…` : item;
      if (item.length > BRAND_VOICE_LIMITS.listItem) {
        ctx.addIssue({
          code: "custom",
          message: `"${shown}" is longer than ${BRAND_VOICE_LIMITS.listItem} characters`,
        });
        return;
      }
      if (!HAS_LETTER.test(item)) {
        ctx.addIssue({
          code: "custom",
          message: `"${shown}" needs at least one letter`,
        });
        return;
      }
      const key = item.toLocaleLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: `"${shown}" is listed twice`,
        });
        return;
      }
      seen.add(key);
    }
  });
}

export const brandVoiceFormSchema = z
  .object({
    brand_name: text("The brand name", BRAND_VOICE_LIMITS.brand_name),
    about: text("About", BRAND_VOICE_LIMITS.about),
    selling_position: text(
      "What sets it apart",
      BRAND_VOICE_LIMITS.selling_position,
    ),
    customer_profile: text("Customers", BRAND_VOICE_LIMITS.customer_profile),
    target_audience: list("Audiences"),
    brand_voice: list("Voice"),
    content_pillar: list("Content pillars"),
    competitors: list("Competitors"),
  })
  .superRefine((values, ctx) => {
    const brand = values.brand_name.trim().toLocaleLowerCase();
    if (
      brand &&
      splitLines(values.competitors).some(
        (item) => item.toLocaleLowerCase() === brand,
      )
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["competitors"],
        message: "Your own brand can't be one of its competitors",
      });
    }
  });

export type BrandVoiceFormValues = z.infer<typeof brandVoiceFormSchema>;

/** The saved brand voice as the form's values (lists one entry per line). */
export function toBrandVoiceFormValues(
  voice?: BrandVoice | null,
): BrandVoiceFormValues {
  return {
    brand_name: voice?.brand_name ?? "",
    about: voice?.about ?? "",
    selling_position: voice?.selling_position ?? "",
    customer_profile: voice?.customer_profile ?? "",
    target_audience: (voice?.target_audience ?? []).join("\n"),
    brand_voice: (voice?.brand_voice ?? []).join("\n"),
    content_pillar: (
      voice?.content_pillar ??
      voice?.content_strategy ??
      []
    ).join("\n"),
    competitors: (voice?.competitors ?? []).join("\n"),
  };
}
