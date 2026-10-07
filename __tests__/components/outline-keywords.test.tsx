/**
 * FB2.18: the outline's keywords are shown as what they are (the primary keyword and the
 * others), and the user can remove a keyword or add one. What they leave is what approval sends.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MAX_SECONDARY_KEYWORDS,
  OutlineBrief,
} from "@/components/generate-content/outline-review/outline-brief";
import type { Outline } from "@/types/generate-content";

jest.mock("@/hooks/use-personas", () => ({
  usePersonas: () => ({ data: [] }),
}));

const OUTLINE = {
  title: "How to plan a garden",
  sections: [],
  focus_keyphrase: "vegetable garden plan",
  schema_type: "How To Guide",
  keywords_to_include: [
    "vegetable garden plan",
    "raised beds",
    "companion planting",
  ],
} as unknown as Outline;

const brief = (
  outline: Outline = OUTLINE,
  canEdit = true,
  onUpdate = jest.fn(),
) => {
  render(
    <OutlineBrief
      outline={outline}
      canEdit={canEdit}
      onUpdate={onUpdate}
      personas={[]}
      personaRecommendations={[]}
      personaId={null}
      onPersonaChange={jest.fn()}
      brandPromotion={null}
      recommendedProminence={null}
      prominence="none"
      onProminenceChange={jest.fn()}
      internalLinks={[]}
      selectedLinkUrls={new Set()}
      onToggleLink={jest.fn()}
    />,
  );
  return onUpdate;
};

const keywords = () =>
  within(screen.getByRole("list", { name: "Keywords the article uses" }))
    .getAllByRole("listitem")
    .map((item) => item.textContent);

describe("the outline's keywords", () => {
  it("shows the primary keyword apart from the others, once", () => {
    brief();

    expect(keywords()).toEqual([
      "vegetable garden planPrimary",
      "raised beds",
      "companion planting",
    ]);
    // The primary keyword is the search the article answers: it can't be removed here.
    expect(
      screen.queryByRole("button", { name: "Remove vegetable garden plan" }),
    ).not.toBeInTheDocument();
  });

  it("names the content type as what it is", () => {
    brief();

    expect(screen.getByText("Content type")).toBeInTheDocument();
    expect(screen.queryByText("Schema type")).not.toBeInTheDocument();
  });

  it("removes a keyword, keeping the primary one first", async () => {
    const onUpdate = brief();

    await userEvent.click(
      screen.getByRole("button", { name: "Remove raised beds" }),
    );

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        keywords_to_include: ["vegetable garden plan", "companion planting"],
      }),
    );
  });

  it("adds a keyword on Enter, on a comma and with the button, tidied", async () => {
    const onUpdate = brief();
    const input = screen.getByRole("textbox", { name: "Add a keyword" });

    await userEvent.type(input, "  crop   rotation {Enter}");
    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        keywords_to_include: [
          "vegetable garden plan",
          "raised beds",
          "companion planting",
          "crop rotation",
        ],
      }),
    );
    expect(input).toHaveValue("");

    await userEvent.type(input, "mulch,");
    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        keywords_to_include: expect.arrayContaining(["mulch"]),
      }),
    );

    await userEvent.type(input, "compost");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onUpdate).toHaveBeenCalledTimes(3);
  });

  it("ignores a keyword it already has, the primary one included", async () => {
    const onUpdate = brief();
    const input = screen.getByRole("textbox", { name: "Add a keyword" });

    await userEvent.type(input, "Raised Beds{Enter}");
    await userEvent.type(input, "VEGETABLE GARDEN PLAN{Enter}");
    await userEvent.type(input, "   {Enter}");

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("takes no more than the backend does", () => {
    const many = {
      ...OUTLINE,
      keywords_to_include: [
        "vegetable garden plan",
        ...Array.from(
          { length: MAX_SECONDARY_KEYWORDS },
          (_, index) => `keyword ${index + 1}`,
        ),
      ],
    } as unknown as Outline;
    brief(many);

    expect(
      screen.getByRole("textbox", { name: "Add a keyword" }),
    ).toBeDisabled();
    expect(
      screen.getByText(/That's the most an article takes \(20\)/),
    ).toBeInTheDocument();
  });

  it("only shows the keywords when the outline can't be edited", () => {
    brief(OUTLINE, false);

    expect(keywords()).toHaveLength(3);
    expect(
      screen.queryByRole("textbox", { name: "Add a keyword" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove raised beds" }),
    ).not.toBeInTheDocument();
  });
});
