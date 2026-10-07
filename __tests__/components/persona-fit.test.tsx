/**
 * E26: an article's author is a persona whose expertise fits the subject, or nobody. The picker
 * marks only a fitting persona as recommended, and the brief says when none fits. The setup's
 * notice names the people the personas were drafted from.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OutlineBrief } from "@/components/generate-content/outline-review/outline-brief";
import { PersonaPicker } from "@/components/generate-content/outline-review/persona-picker";
import { namedPeople } from "@/components/workspace-settings/brand-voice-section";
import type { Outline, PersonaRecommendation } from "@/types/generate-content";
import type { Persona } from "@/types/workspace";

const FOUNDER: Persona = {
  id: "founder-1",
  name: "Sania",
  full_name: "Sania Usman",
  professional_title: "Founder",
  description: "",
};
const PODCASTER: Persona = {
  id: "podcaster-1",
  name: "Tom",
  full_name: "Tom Reyes",
  professional_title: "Podcast producer",
  description: "",
};

const offTopic: PersonaRecommendation[] = [
  { persona_id: "founder-1", name: "Sania", score: 41, fits_topic: false },
];
const oneFits: PersonaRecommendation[] = [
  { persona_id: "founder-1", name: "Sania", score: 52, fits_topic: false },
  { persona_id: "podcaster-1", name: "Tom", score: 48, fits_topic: true },
];

// cmdk scrolls the active option into view, which jsdom doesn't implement.
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

async function openPicker(recommendations: PersonaRecommendation[]) {
  render(
    <PersonaPicker
      personas={[FOUNDER, PODCASTER]}
      recommendations={recommendations}
      selectedId={null}
      onSelect={jest.fn()}
    />,
  );
  await userEvent.click(screen.getByRole("combobox"));
  return screen.findByRole("listbox");
}

describe("PersonaPicker", () => {
  it("recommends no persona when none fits the subject", async () => {
    const list = await openPicker(offTopic);
    expect(within(list).queryByText("Recommended")).not.toBeInTheDocument();
  });

  it("recommends the fitting persona, not the higher-scored one that doesn't fit", async () => {
    const list = await openPicker(oneFits);
    const tom = within(list).getByRole("option", { name: /Tom Reyes/ });
    expect(within(tom).getByText("Recommended")).toBeInTheDocument();
    const sania = within(list).getByRole("option", { name: /Sania Usman/ });
    expect(within(sania).queryByText("Recommended")).not.toBeInTheDocument();
  });
});

describe("OutlineBrief's author", () => {
  const brief = (recommendations: PersonaRecommendation[]) =>
    render(
      <OutlineBrief
        outline={
          {
            title: "How to start a podcast",
            sections: [],
          } as unknown as Outline
        }
        canEdit={false}
        personas={[FOUNDER, PODCASTER]}
        personaRecommendations={recommendations}
        personaId={null}
        onPersonaChange={jest.fn()}
        brandPromotion={null}
        recommendedProminence={null}
        prominence="subtle"
        onProminenceChange={jest.fn()}
        internalLinks={[]}
        selectedLinkUrls={new Set()}
        onToggleLink={jest.fn()}
      />,
    );

  it("says so when no persona covers the subject", () => {
    brief(offTopic);
    expect(
      screen.getByText(/None of your personas covers this subject/),
    ).toBeInTheDocument();
  });

  it("explains the recommendation when one fits", () => {
    brief(oneFits);
    expect(screen.getByText(/Recommended by fit with/)).toBeInTheDocument();
  });
});

describe("namedPeople", () => {
  it("names the people, then how many more", () => {
    expect(namedPeople(["Ana Ruiz"])).toBe("Ana Ruiz");
    expect(namedPeople(["Ana Ruiz", "Ben Ode"])).toBe("Ana Ruiz and Ben Ode");
    expect(namedPeople(["A", "B", "C", "D", "E", "F", "G"])).toBe(
      "A, B, C, D, E, and 2 more",
    );
  });
});
