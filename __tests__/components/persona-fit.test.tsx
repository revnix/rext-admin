/**
 * E26: an article's author is a persona whose expertise fits the subject, or nobody. The picker
 * marks only a fitting persona as recommended, and the brief says when none fits. The setup's
 * notice names the people the personas were drafted from.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OutlineBrief } from "@/components/generate-content/outline-review/outline-brief";
import { PersonaPicker } from "@/components/generate-content/outline-review/persona-picker";
import {
  DraftedNotice,
  namedPeople,
} from "@/components/workspace-settings/brand-voice-section";
import type { Outline, PersonaRecommendation } from "@/types/generate-content";
import type { Persona } from "@/types/workspace";

// The drafted notice reads the workspace's personas; each test sets the answer.
const mockPersonas = jest.fn();
jest.mock("@/hooks/use-personas", () => ({
  usePersonas: () => mockPersonas(),
}));

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
  const brief = (
    recommendations: PersonaRecommendation[],
    personaId: string | null = null,
  ) =>
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
        personaId={personaId}
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

  it("follows the user's pick when none fits", () => {
    brief(offTopic, "founder-1");
    expect(
      screen.getByText(/the article is written as the one you picked/),
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

describe("DraftedNotice", () => {
  const answer = (personas: Persona[]) => ({
    data: { personas },
    isSuccess: true,
  });

  it("names the people the personas were drafted from, as they were on arrival", () => {
    mockPersonas.mockReturnValue(answer([FOUNDER, PODCASTER]));
    const { rerender } = render(
      <DraftedNotice
        workspaceId="w1"
        workspaceSlug="acme"
        website="https://acme.example/about"
      />,
    );
    expect(
      screen.getByText(
        /2 drafted from the people named on your site: Sania Usman and Tom Reyes/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "We read acme.example" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^Author personas/ }),
    ).toHaveAttribute("href", "/w/acme/personas");

    // A persona deleted afterwards doesn't change who came from the site.
    mockPersonas.mockReturnValue(answer([]));
    rerender(
      <DraftedNotice
        workspaceId="w1"
        workspaceSlug="acme"
        website="https://acme.example"
      />,
    );
    expect(screen.getByText(/Sania Usman and Tom Reyes/)).toBeInTheDocument();
  });

  it("says no personas were drafted when the site names no one", () => {
    mockPersonas.mockReturnValue(answer([]));
    render(<DraftedNotice workspaceId="w1" workspaceSlug="acme" />);
    expect(
      screen.getByText(
        "None drafted: no one is named on your site. Add them in Personas.",
      ),
    ).toBeInTheDocument();
  });

  it("is a plain summary of the three things made, each a row that opens its part (task 846)", () => {
    mockPersonas.mockReturnValue(answer([FOUNDER]));
    const { container } = render(
      <DraftedNotice
        workspaceId="w1"
        workspaceSlug="acme"
        website="https://acme.example"
        competitors={["Northwind", "Contoso"]}
        closing="Check each part, change anything that's off, then finish."
      />,
    );
    // Announced as a status, by its own words; not the tinted box of a notice.
    const summary = screen.getByRole("status", {
      name: "We read acme.example",
    });
    expect(container.querySelector('[data-slot="notice"]')).toBeNull();
    expect(summary).toHaveTextContent(
      "Check each part, change anything that's off, then finish.",
    );
    const rows = within(summary).getAllByRole("link");
    expect(rows.map((row) => row.getAttribute("href"))).toEqual([
      "#field-brand_name",
      "/w/acme/personas",
      "#field-competitors",
    ]);
    expect(rows[0]).toHaveTextContent(
      "Brand voiceWhat the brand does, who it's for and how it sounds.Review",
    );
    expect(rows[1]).toHaveTextContent(
      "1 drafted from the people named on your site: Sania Usman.Open",
    );
    expect(rows[2]).toHaveTextContent("2 found: Northwind and Contoso.Review");
  });

  it("says so when no competitor was found, and waits for the ones still loading", () => {
    mockPersonas.mockReturnValue({ data: undefined, isSuccess: false });
    const { rerender } = render(
      <DraftedNotice workspaceId="w1" workspaceSlug="acme" />,
    );
    expect(
      screen.getByText("From the people named on your site."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The sites yours is compared with."),
    ).toBeInTheDocument();
    rerender(
      <DraftedNotice workspaceId="w1" workspaceSlug="acme" competitors={[]} />,
    );
    expect(screen.getByText("None found. Add them below.")).toBeInTheDocument();
  });
});
