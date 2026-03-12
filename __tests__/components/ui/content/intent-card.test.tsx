import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { SearchIntentCard } from "@/components/ui/content/intent-card";

describe("SearchIntentCard", () => {
  it("renders specific intent variant", () => {
    render(<SearchIntentCard intent="commercial" />);

    expect(screen.getByText("commercial")).toBeInTheDocument();
    expect(
      screen.getByText("Researching options and ready to buy."),
    ).toBeInTheDocument();
  });

  it("defaults to transactional if not provided", () => {
    render(<SearchIntentCard />);

    expect(screen.getByText("transactional")).toBeInTheDocument();
    expect(
      screen.getByText("Ready to buy something specific."),
    ).toBeInTheDocument();
  });
});
