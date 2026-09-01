import { fireEvent, render, screen } from "@testing-library/react";
import { OutlineDisplay } from "@/components/generate-content/outline";
import { usePersonas } from "@/hooks/use-personas";

Element.prototype.scrollIntoView = jest.fn();

jest.mock("@/hooks/use-personas", () => ({
  usePersonas: jest.fn(),
}));

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

  it("updates the selected persona when a different item is chosen from the dropdown", () => {
    render(
      <OutlineDisplay
        outline={{
          title: "Test Outline",
          brief: "Example brief",
          sections: [],
          selected_persona_id: "persona-1",
          status: "approved",
          outline_retries: 0,
          draft_retries: 0,
          review_retries: 0,
          max_retries: 0,
          keywords_to_include: [],
          target_audience: ["General"],
          tone: "Professional",
        }}
        rawTokens='{"title":"Test Outline"}'
        isLoading={false}
        onApprove={jest.fn()}
        onReject={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Bravo Persona"));

    expect(screen.getByText("Bravo Persona")).toBeInTheDocument();
  });
});
