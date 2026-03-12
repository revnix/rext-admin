import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { SingleSelectCard } from "@/components/ui/typeform/single-select-card";

describe("SingleSelectCard", () => {
  it("renders label and description correctly", () => {
    render(
      <SingleSelectCard
        label="Option 1"
        description="Description 1"
        selected={false}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Description 1")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", () => {
    const onSelect = jest.fn();
    render(
      <SingleSelectCard
        label="Click Me"
        selected={false}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
