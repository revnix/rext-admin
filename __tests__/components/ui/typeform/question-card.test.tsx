import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { QuestionCard } from "@/components/ui/typeform/question-card";

describe("QuestionCard", () => {
  it("renders title, description, and children", () => {
    render(
      <QuestionCard
        title="What is your favorite color?"
        description="Pick one from the list."
        questionId="q1"
      >
        <div data-testid="child-content">Child content</div>
      </QuestionCard>,
    );

    expect(
      screen.getByText("What is your favorite color?"),
    ).toBeInTheDocument();
    expect(screen.getByText("Pick one from the list.")).toBeInTheDocument();
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("displays error message and required indicator", () => {
    render(
      <QuestionCard
        title="Required Question"
        required
        error="This field is required"
      >
        <div>Content</div>
      </QuestionCard>,
    );

    expect(screen.getByText("*")).toBeInTheDocument();
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });
});
