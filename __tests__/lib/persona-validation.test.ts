/**
 * The rules behind PER-003, PER-006, PER-011, PER-012 and PER-014.
 *
 * Each block names the case from the test plan it exists for, so a rule that
 * is loosened later fails here rather than quietly reopening the bug.
 */

import {
  PERSONA_LIMITS,
  isServerOwnedAvatar,
  isValidHttpUrl,
  normalizePersonaName,
  validatePersona,
} from "@/lib/validation/persona-validation";

describe("PER-006 — avatar URL validation", () => {
  it.each([
    "https:///example.com",
    "https://-example.com",
    "https://example,com",
    "https://example-.com",
    "https://example",
    "https://exa mple.com",
    "ftp://example.com/photo.jpg",
    "javascript:alert(1)",
    "not a url at all",
  ])("rejects %s", (url) => {
    expect(isValidHttpUrl(url)).toBe(false);
    expect(
      validatePersona({ name: "Marketing Mary", avatar_url: url }).avatar_url,
    ).toBeTruthy();
  });

  it.each([
    "https://example.com/photo.jpg",
    "http://cdn.example.co.uk/a/b/c.png",
    "https://1.2.3.4/photo.png",
    "http://localhost:3000/photo.png",
  ])("accepts %s", (url) => {
    expect(isValidHttpUrl(url)).toBe(true);
    expect(
      validatePersona({ name: "Marketing Mary", avatar_url: url }).avatar_url,
    ).toBeUndefined();
  });
});

describe("PER-003 — display name is required and stands alone", () => {
  it("reports a missing display name", () => {
    expect(validatePersona({ name: "" }).name).toBe(
      "Persona display name is required",
    );
  });

  it.each(["M", "te", "Mar"])("rejects the too-short name %s", (name) => {
    expect(validatePersona({ name }).name).toContain("at least 4");
  });

  it("does not accept full_name in its place", () => {
    expect(
      validatePersona({ name: "", full_name: "Mary Jane" }).name,
    ).toBeTruthy();
  });

  it("no longer requires a professional title", () => {
    expect(
      validatePersona({ name: "Marketing Mary" }).professional_title,
    ).toBeUndefined();
    expect(
      validatePersona({ name: "Marketing Mary", professional_title: "" })
        .professional_title,
    ).toBeUndefined();
  });

  it("still bounds a title that is provided", () => {
    expect(
      validatePersona({ name: "Marketing Mary", professional_title: "x" })
        .professional_title,
    ).toBeTruthy();
    expect(
      validatePersona({
        name: "Marketing Mary",
        professional_title: "x".repeat(
          PERSONA_LIMITS.professional_title.max + 1,
        ),
      }).professional_title,
    ).toBeTruthy();
  });

  it.each([
    "CEO",
    "SEO Lead",
    "Senior Marketing Manager",
    "Board Certified Dermatologist and Clinical Researcher",
    "Professor of Computer Science",
  ])("accepts the real title %s", (title) => {
    expect(
      validatePersona({ name: "Marketing Mary", professional_title: title })
        .professional_title,
    ).toBeUndefined();
  });
});

describe("PER-011 — only words, no numbers, no symbols", () => {
  it.each([
    ["name", "<script>alert(1)</script>"],
    ["description", "Hello <b>there</b>"],
    ["bio", "A marketer who writes {{payload}} posts about search"],
    ["demographics", "Urban, `whoami`"],
    ["professional_title", "Head of Growth @ Rext"],
  ] as const)("rejects symbols in %s", (field, value) => {
    expect(
      validatePersona({ name: "Marketing Mary", [field]: value })[field],
    ).toBeTruthy();
  });

  it.each([
    ["name", "Mary2"],
    ["bio", "78e329hrdo3nekdndihidn is what she writes about all day long"],
    ["description", "Marketer with 10 years of experience"],
    ["demographics", "oiwjioj2iohd"],
  ] as const)("rejects numbers in %s", (field, value) => {
    expect(
      validatePersona({ name: "Marketing Mary", [field]: value })[field],
    ).toContain("cannot contain numbers");
  });

  it.each(["areas_of_expertise", "goals", "pain_points", "behaviors"] as const)(
    "rejects numbers in each entry of %s",
    (field) => {
      expect(
        validatePersona({ name: "Marketing Mary", [field]: "2ws2nkdnkn" })[
          field
        ],
      ).toContain("cannot contain numbers");
    },
  );

  it("asks a joined-up expertise to be written out", () => {
    expect(
      validatePersona({
        name: "Marketing Mary",
        areas_of_expertise: "seo-nothing",
      }).areas_of_expertise,
    ).toContain("may only contain letters and spaces");
    expect(
      validatePersona({
        name: "Marketing Mary",
        areas_of_expertise: "seo marketing, analytics",
      }).areas_of_expertise,
    ).toBeUndefined();
  });

  it("keeps the punctuation prose actually needs", () => {
    expect(validatePersona({ name: "Mary-Jane O’Brien" }).name).toBeUndefined();
    expect(
      validatePersona({
        name: "Marketing Mary",
        bio: "She writes about search, analytics and content; clearly, and often!",
        description: "A marketer focused on organic growth.",
        demographics: "Urban professionals, mid to high income.",
      }),
    ).toEqual({});
  });

  it("takes tone of voice as a comma separated list", () => {
    expect(
      validatePersona({
        name: "Marketing Mary",
        tone_of_voice: "Professional, friendly, expert",
      }).tone_of_voice,
    ).toBeUndefined();
    expect(
      validatePersona({
        name: "Marketing Mary",
        tone_of_voice: "friendly |& direct",
      }).tone_of_voice,
    ).toBeTruthy();
  });
});

describe("PER-012 — maximum length", () => {
  it.each([
    ["name", PERSONA_LIMITS.name.max],
    ["description", PERSONA_LIMITS.description.max],
    ["bio", PERSONA_LIMITS.bio.max],
    ["demographics", PERSONA_LIMITS.demographics.max],
    ["tone_of_voice", PERSONA_LIMITS.tone_of_voice.max],
  ] as const)("reports %s over %i characters", (field, max) => {
    const errors = validatePersona({
      name: "Marketing Mary",
      [field]: "a".repeat(max + 1),
    });
    expect(errors[field]).toBeTruthy();
  });

  it("bounds comma separated fields by total length and entry count", () => {
    expect(
      validatePersona({
        name: "Marketing Mary",
        goals: "a".repeat(PERSONA_LIMITS.goals.max + 1),
      }).goals,
    ).toBeTruthy();
    expect(
      validatePersona({
        name: "Marketing Mary",
        areas_of_expertise: Array.from({ length: 21 }, (_, i) => `Topic ${i}`),
      }).areas_of_expertise,
    ).toBeTruthy();
  });

  it("accepts a normal comma separated list", () => {
    expect(
      validatePersona({
        name: "Marketing Mary",
        areas_of_expertise: "SEO, Content Strategy, Analytics",
      }).areas_of_expertise,
    ).toBeUndefined();
  });
});

describe("PER-014 — duplicate name comparison", () => {
  it("ignores case and repeated whitespace", () => {
    expect(normalizePersonaName("  Mary   Jane ")).toBe("mary jane");
    expect(normalizePersonaName("MARY JANE")).toBe(
      normalizePersonaName("mary jane"),
    );
  });

  it("keeps genuinely different names apart", () => {
    expect(normalizePersonaName("Mary Jane")).not.toBe(
      normalizePersonaName("Mary Janes"),
    );
  });
});

describe("avatars the system itself set are not held to the pasted-link rule", () => {
  it("accepts a stored object key and generated initials", () => {
    const key = "avatars/personas/abc/avatar_1.png";
    expect(isServerOwnedAvatar(key)).toBe(true);
    expect(
      validatePersona({ name: "Marketing Mary", avatar_url: key }).avatar_url,
    ).toBeUndefined();
    expect(isServerOwnedAvatar("data:image/svg+xml;base64,AA==")).toBe(true);
  });

  it("does not mistake a bare typed word for a key", () => {
    expect(isServerOwnedAvatar("exampledotcom")).toBe(false);
    expect(
      validatePersona({ name: "Marketing Mary", avatar_url: "exampledotcom" })
        .avatar_url,
    ).toBeTruthy();
  });
});
