import {
  validateBrandName,
  validateBrandVoiceItems,
  validateBrandVoiceText,
} from "@/lib/validation/brand-voice-validation";

describe("brand voice validation", () => {
  it.each(["Rext AI", "Élan Studio", "R&D 2026", "Café @ Home!"])(
    "accepts brand names with letters: %s",
    (value) => {
      expect(validateBrandName(value)).toBeUndefined();
    },
  );

  it.each(["12345", "!@#$%^&*()"])(
    "rejects brand names without letters: %s",
    (value) => {
      expect(validateBrandName(value)).toBe(
        "Brand name must contain at least one letter",
      );
    },
  );

  it.each(["12345", "!@#$%^&*()"])(
    "requires letters in ordinary text containing only %s",
    (value) => {
      expect(validateBrandVoiceText(value, "About")).toBe(
        "About must contain at least one letter",
      );
    },
  );

  it("allows punctuation and numbers in ordinary text when it has letters", () => {
    expect(validateBrandVoiceText("R&D for 2026!", "About")).toBeUndefined();
  });

  it("checks every list entry for at least one letter", () => {
    expect(validateBrandVoiceItems(["Adults 25+", "!!!"], "Audience")).toBe(
      "Audience entries must each contain at least one letter",
    );
    expect(
      validateBrandVoiceItems(
        ["Adults 25+", "Small business / SaaS"],
        "Audience",
      ),
    ).toBeUndefined();
  });
});
