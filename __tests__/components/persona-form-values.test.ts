/**
 * Editing a persona (D3) starts from its saved values. The photo link shows only a link someone
 * typed: an uploaded photo comes back as a presigned address and a Gravatar or drawn initials are
 * the server's, so none of them may be offered (and sent back) as a link to edit.
 */

import { toPersonaFormValues } from "@/components/personas/persona-form";
import type { Persona } from "@/types/workspace";

const base: Persona = {
  id: "p1",
  name: "Marketing Mary",
  description: "Writes about growth",
  areas_of_expertise: ["SEO", "Analytics"],
  goals: "Grow traffic, Build authority",
  pain_points: [],
  behaviors: undefined,
};

describe("toPersonaFormValues", () => {
  it("joins the list fields the way the form splits them", () => {
    const values = toPersonaFormValues(base);
    expect(values.areas_of_expertise).toBe("SEO, Analytics");
    expect(values.goals).toBe("Grow traffic, Build authority");
    expect(values.pain_points).toBe("");
    expect(values.behaviors).toBe("");
  });

  it("offers a typed photo link for editing", () => {
    const values = toPersonaFormValues({
      ...base,
      avatar_url: "https://example.com/mary.jpg",
      avatar_source: "custom",
    });
    expect(values.avatar_url).toBe("https://example.com/mary.jpg");
  });

  it.each([
    [
      "an uploaded photo's object key",
      "avatars/personas/p1/avatar_1.png",
      "custom",
    ],
    [
      "an uploaded photo's storage address",
      "https://storage.example.com/rext/avatars/personas/p1/avatar_1.png?X-Amz-Signature=abc",
      "custom",
    ],
    ["a Gravatar", "https://www.gravatar.com/avatar/abc", "gravatar"],
    ["a photo the site published", "https://example.com/team/mary.jpg", "page"],
    ["drawn initials", "data:image/svg+xml;base64,AAA", "generated"],
  ] as const)(
    "leaves the link empty for %s",
    (_, avatar_url, avatar_source) => {
      expect(
        toPersonaFormValues({ ...base, avatar_url, avatar_source }).avatar_url,
      ).toBe("");
    },
  );

  it("turns missing optional fields into empty text", () => {
    const values = toPersonaFormValues({
      ...base,
      full_name: null,
      email: null,
    });
    expect(values.full_name).toBe("");
    expect(values.email).toBe("");
    expect(values.linkedin_url).toBe("");
  });
});
