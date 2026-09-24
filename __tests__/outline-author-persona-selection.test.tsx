import { fireEvent, render, screen } from "@testing-library/react";
import { OutlineDisplay } from "@/components/generate-content/outline";
import { usePersonas } from "@/hooks/use-personas";
import type { Outline } from "@/types/generate-content";

Element.prototype.scrollIntoView = jest.fn();

jest.mock("@/hooks/use-personas", () => ({
  usePersonas: jest.fn(),
}));

const baseOutline: Outline = {
  title: "Test Outline",
  brief: "Example brief",
  sections: [],
  selected_persona_id: "persona-1",
  persona_recommendations: [
    { persona_id: "persona-1", name: "Alpha Persona", score: 72.5 },
    { persona_id: "persona-2", name: "Bravo Persona", score: 18.25 },
  ],
  status: "approved",
  outline_retries: 0,
  draft_retries: 0,
  review_retries: 0,
  max_retries: 0,
  keywords_to_include: [],
  target_audience: ["General"],
  tone: "Professional",
} as unknown as Outline;

/** The dropdown row with this label — never the trigger, which shows it too. */
function option(label: string) {
  const match = screen
    .getAllByRole("option")
    .find((element) => element.textContent?.includes(label));
  if (!match) throw new Error(`No dropdown option labelled "${label}"`);
  return match;
}

function renderOutline(
  overrides: Partial<Outline> = {},
  onApprove = jest.fn(),
) {
  const view = render(
    <OutlineDisplay
      outline={{ ...baseOutline, ...overrides } as Outline}
      rawTokens='{"title":"Test Outline"}'
      isLoading={false}
      onApprove={onApprove}
      onReject={jest.fn()}
    />,
  );
  const rerenderWith = (next: Partial<Outline>) =>
    view.rerender(
      <OutlineDisplay
        outline={{ ...baseOutline, ...overrides, ...next } as Outline}
        rawTokens='{"title":"Test Outline"}'
        isLoading={false}
        onApprove={onApprove}
        onReject={jest.fn()}
      />,
    );
  return { onApprove, rerenderWith };
}

describe("OutlineDisplay author persona selection", () => {
  beforeEach(() => {
    (usePersonas as jest.Mock).mockReturnValue({
      data: {
        personas: [
          {
            id: "persona-1",
            name: "alpha",
            full_name: "Alpha Persona",
            professional_title: "SEO Strategist",
            description: "An SEO specialist.",
          },
          {
            id: "persona-2",
            name: "bravo",
            full_name: "Bravo Persona",
            professional_title: "Content Lead",
            description: "A content specialist.",
          },
        ],
      },
    });
  });

  it("defaults to the persona the outline recommends", () => {
    renderOutline();

    expect(screen.getByRole("combobox")).toHaveTextContent("Alpha Persona");
  });

  it("updates the selected persona when a different item is chosen from the dropdown", () => {
    renderOutline();

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(option("Bravo Persona"));

    expect(screen.getByRole("combobox")).toHaveTextContent("Bravo Persona");
  });

  it("shows the relevance score and marks the recommended persona", () => {
    renderOutline();

    fireEvent.click(screen.getByRole("combobox"));

    expect(screen.getByText("Recommended")).toBeInTheDocument();
    expect(screen.getByText("73% fit")).toBeInTheDocument();
    expect(screen.getByText("18% fit")).toBeInTheDocument();
  });

  it("clears the persona when the selected one is chosen again", () => {
    renderOutline();

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(option("Alpha Persona"));

    expect(screen.getByRole("combobox")).toHaveTextContent("No author persona");
  });

  it("clears the persona from the explicit 'No author persona' option", () => {
    renderOutline();

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(option("No author persona"));

    expect(screen.getByRole("combobox")).toHaveTextContent("No author persona");
  });

  it("approves with null when the persona has been cleared", () => {
    const { onApprove } = renderOutline();

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(option("Alpha Persona"));
    fireEvent.click(screen.getByText(/Approve & Generate/i));

    expect(onApprove).toHaveBeenCalledWith(expect.anything(), false, null);
  });

  it("approves with the persona the user picked", () => {
    const { onApprove } = renderOutline();

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(option("Bravo Persona"));
    fireEvent.click(screen.getByText(/Approve & Generate/i));

    expect(onApprove).toHaveBeenCalledWith(
      expect.anything(),
      false,
      "persona-2",
    );
  });

  it("keeps the user's persona when an unrelated outline edit arrives", () => {
    const { rerenderWith } = renderOutline();

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(option("Bravo Persona"));
    // Editing the tone replaces the outline object; the author must survive it.
    rerenderWith({ tone: "Conversational" });

    expect(screen.getByRole("combobox")).toHaveTextContent("Bravo Persona");
  });

  it("keeps a cleared persona when an unrelated outline edit arrives", () => {
    const { rerenderWith } = renderOutline();

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(option("No author persona"));
    rerenderWith({ tone: "Conversational" });

    expect(screen.getByRole("combobox")).toHaveTextContent("No author persona");
  });

  it("adopts the new recommendation when the outline is regenerated", () => {
    const { rerenderWith } = renderOutline();

    rerenderWith({
      selected_persona_id: "persona-2",
      persona_recommendations: [
        { persona_id: "persona-2", name: "Bravo Persona", score: 55 },
      ],
    });

    expect(screen.getByRole("combobox")).toHaveTextContent("Bravo Persona");
  });

  it("selects no persona when the outline recommends none", () => {
    renderOutline({ selected_persona_id: null, persona_recommendations: [] });

    expect(screen.getByRole("combobox")).toHaveTextContent("No author persona");
  });
});
