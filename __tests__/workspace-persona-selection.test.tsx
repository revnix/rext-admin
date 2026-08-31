import { render, screen } from "@testing-library/react";
import { PersonaSelection } from "@/components/workspace/persona-selection";

describe("PersonaSelection", () => {
  it("shows a visible checkbox when multi-select is enabled", () => {
    const persona = {
      id: "persona-1",
      name: "marketing-lead",
      full_name: "Maya Patel",
      professional_title: "Marketing Lead",
      areas_of_expertise: ["SEO", "Brand Strategy"],
      tone_of_voice: "Warm and confident",
    };

    render(
      <PersonaSelection
        personas={[persona]}
        selectedPersonaIds={["persona-1"]}
        onSelect={jest.fn()}
        multiSelect
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: /select maya patel/i }),
    ).toBeInTheDocument();
  });
});
