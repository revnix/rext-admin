/**
 * FB2.19: the outline's brand choice says what each option does to the article, in the words
 * the backend holds the article to, and says plainly how well the subject matches the brand.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OutlineBrief } from "@/components/generate-content/outline-review/outline-brief";
import type { BrandProminence } from "@/lib/generate-content/outline-review";
import type { Outline } from "@/types/generate-content";

jest.mock("@/hooks/use-personas", () => ({
  usePersonas: () => ({ data: [] }),
}));

const PROMOTION = {
  brand_name: "Acme Tools",
  brand_url: "https://acme.test",
  about: "",
  selling_position: "",
  score: 0.41,
  recommended: true,
};

const brief = (
  prominence: BrandProminence,
  onProminenceChange = jest.fn(),
  recommended: BrandProminence | null = "subtle",
) =>
  render(
    <OutlineBrief
      outline={
        { title: "How to plan a garden", sections: [] } as unknown as Outline
      }
      canEdit
      personas={[]}
      personaRecommendations={[]}
      personaId={null}
      onPersonaChange={jest.fn()}
      brandPromotion={PROMOTION}
      recommendedProminence={recommended}
      prominence={prominence}
      onProminenceChange={onProminenceChange}
      internalLinks={[]}
      selectedLinkUrls={new Set()}
      onToggleLink={jest.fn()}
    />,
  );

describe("the outline's brand choice", () => {
  it("offers three options, each with what the article will do", () => {
    brief("subtle");
    const group = screen.getByRole("radiogroup", {
      name: "How prominently Acme Tools is mentioned",
    });

    expect(within(group).getAllByRole("radio")).toHaveLength(3);
    expect(
      within(group).getByText(
        "Named in the opening and in the closing call to action, with what it offers.",
      ),
    ).toBeInTheDocument();
    expect(
      within(group).getByText(
        "One natural mention early in the body. Never in the title, a heading or the call to action.",
      ),
    ).toBeInTheDocument();
    expect(
      within(group).getByText(
        "Not named and not linked anywhere: the title, the body, the call to action or the meta tags.",
      ),
    ).toBeInTheDocument();
  });

  it("marks the chosen option and the recommended one", () => {
    brief("none");

    expect(screen.getByRole("radio", { name: /^None/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /^Subtle/ })).not.toBeChecked();
    expect(
      screen.getByRole("radio", { name: /Subtle · recommended/ }),
    ).toBeInTheDocument();
  });

  it("says how well the subject matches the brand, in a sentence", () => {
    brief("subtle");

    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          element.textContent ===
            "This article's subject matches what Acme Tools offers by 41%.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/linked to https:\/\/acme\.test/),
    ).toBeInTheDocument();
  });

  it("sends the choice the user makes", async () => {
    const onChange = jest.fn();
    brief("subtle", onChange);

    await userEvent.click(screen.getByRole("radio", { name: /^None/ }));

    expect(onChange).toHaveBeenCalledWith("none");
  });
});
