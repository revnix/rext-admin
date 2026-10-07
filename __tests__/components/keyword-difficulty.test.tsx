import { render, screen } from "@testing-library/react";

import { KeywordDifficulty } from "@/components/keywords/keyword-card";

describe("KeywordDifficulty, a ring in the level's colour (FB2.9 #690)", () => {
  it.each([
    [8, "Easy", "text-success-600"],
    [24, "Medium", "text-warning-600"],
    [55, "Hard", "text-danger-500"],
    [84, "Very hard", "text-danger-700"],
  ])(
    "shows %i as %s, in its colour, with the number and the level",
    (score, band, colour) => {
      render(<KeywordDifficulty score={score} />);

      const meter = screen.getByRole("meter", {
        name: `Keyword difficulty, ${score} of 100`,
      });
      expect(meter).toHaveAttribute("aria-valuenow", String(score));
      expect(meter.querySelectorAll("circle")[1]).toHaveClass(colour);
      expect(screen.getByText(`${score}%`)).toBeInTheDocument();
      expect(screen.getByText(band)).toBeInTheDocument();
    },
  );

  it("is a small ring with the level and the number in a table cell", () => {
    render(<KeywordDifficulty score={42} compact />);

    expect(
      screen.getByRole("meter", { name: "Keyword difficulty, 42 of 100" }),
    ).toHaveClass("size-5");
    expect(screen.getByText("Hard")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.queryByText("42%")).toBeNull();
  });

  it("says unknown, with no meter, when there is no score", () => {
    render(<KeywordDifficulty score={null} />);

    expect(screen.queryByRole("meter")).toBeNull();
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
