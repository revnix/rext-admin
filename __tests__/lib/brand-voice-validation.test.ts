import {
  validateBrandName,
  validateBrandVoiceItems,
  validateBrandVoiceText,
} from "@/lib/validation/brand-voice-validation";

describe("brand voice validation", () => {
  it.each(["Rext AI", "Élan Studio"])("accepts letter-only brand names: %s", (value) => {
    expect(validateBrandName(value)).toBeUndefined();
  });

  it.each(["REXT 2", "Rext+AI", "!!!"])("rejects invalid brand names: %s", (value) => {
    expect(validateBrandName(value)).toBe(
      "Brand name may only contain letters and spaces",
    );
  });

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
      validateBrandVoiceItems(["Adults 25+", "Small business / SaaS"], "Audience"),
    ).toBeUndefined();
  });
});
