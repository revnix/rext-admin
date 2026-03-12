import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { OptionCard } from "@/components/ui/typeform/option-card";

describe("OptionCard", () => {
  it("renders label and responds to click", () => {
    const onClick = jest.fn();
    render(
      <OptionCard
        label="Test Option"
        value="test-val"
        selected={false}
        onClick={onClick}
      />,
    );

    expect(screen.getByText("Test Option")).toBeInTheDocument();

    // Using aria-label query as the component uses motion.button
    const button = screen.getByRole("option", { name: "Select Test Option" });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledWith("test-val");
  });
});
