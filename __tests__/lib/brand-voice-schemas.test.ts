/**
 * The brand voice form's rules (D5): the backend's limits, checked before a save so the person
 * sees which field is wrong, and the one-entry-per-line lists round-tripping the saved voice.
 */

import {
  BRAND_VOICE_LIMITS,
  brandVoiceFormSchema,
  splitLines,
  toBrandVoiceFormValues,
} from "@/schemas/brand-voice-schemas";

const valid = toBrandVoiceFormValues({
  workspace_id: "ws",
  brand_name: "Acme",
  about: "We make anvils, sturdy ones.",
  target_audience: ["Coyotes, mostly", "Hardware stores"],
  brand_voice: ["Plain-spoken"],
  competitors: ["Globex"],
  content_pillar: ["Durability"],
});

function errorsFor(values: Partial<typeof valid>) {
  const result = brandVoiceFormSchema.safeParse({ ...valid, ...values });
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.join("."),
          issue.message,
        ]),
      );
}

describe("toBrandVoiceFormValues", () => {
  it("puts each list entry on its own line, so an entry may hold a comma", () => {
    expect(valid.target_audience).toBe("Coyotes, mostly\nHardware stores");
    expect(splitLines(valid.target_audience)).toEqual([
      "Coyotes, mostly",
      "Hardware stores",
    ]);
  });

  it("reads the content pillars under either of the backend's names", () => {
    expect(
      toBrandVoiceFormValues({ workspace_id: "ws", content_strategy: ["A"] })
        .content_pillar,
    ).toBe("A");
  });

  it("gives empty fields for a workspace with no brand voice yet, or cleared fields", () => {
    expect(toBrandVoiceFormValues(null).about).toBe("");
    expect(
      toBrandVoiceFormValues({
        workspace_id: "ws",
        customer_profile: null,
      }).customer_profile,
    ).toBe("");
  });
});

describe("splitLines", () => {
  it("trims each line and drops blank ones", () => {
    expect(splitLines("  One \n\n Two\n  \n")).toEqual(["One", "Two"]);
  });
});

describe("brandVoiceFormSchema", () => {
  it("accepts a filled form and an empty one", () => {
    expect(errorsFor({})).toEqual({});
    expect(errorsFor(toBrandVoiceFormValues(null))).toEqual({});
  });

  it("holds each text field to the backend's length", () => {
    expect(
      errorsFor({ about: "a".repeat(BRAND_VOICE_LIMITS.about + 1) }).about,
    ).toMatch(/2,000 characters or fewer/);
    expect(
      errorsFor({ brand_name: "a".repeat(BRAND_VOICE_LIMITS.brand_name) })
        .brand_name,
    ).toBeUndefined();
  });

  it("wants a letter in text and in every list entry", () => {
    expect(errorsFor({ about: "12345" }).about).toMatch(/at least one letter/);
    expect(errorsFor({ brand_voice: "Calm\n!!!" }).brand_voice).toBe(
      '"!!!" needs at least one letter',
    );
  });

  it("refuses an entry listed twice, whatever its case", () => {
    expect(errorsFor({ competitors: "Globex\nglobex" }).competitors).toBe(
      '"globex" is listed twice',
    );
  });

  it("caps a list at 50 entries of 255 characters", () => {
    const many = Array.from({ length: 51 }, (_, i) => `Item ${i}`).join("\n");
    expect(errorsFor({ target_audience: many }).target_audience).toMatch(
      /at most 50 entries/,
    );
    expect(
      errorsFor({ content_pillar: `A${"a".repeat(255)}` }).content_pillar,
    ).toMatch(/longer than 255 characters/);
  });

  it("refuses the brand itself as a competitor", () => {
    expect(errorsFor({ competitors: "Globex\nACME" }).competitors).toBe(
      "Your own brand can't be one of its competitors",
    );
  });
});
