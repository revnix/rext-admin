import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "@/components/ui/empty-state";
import { Meter } from "@/components/ui/meter";
import { Notice } from "@/components/ui/notice";
import { ScoreRing } from "@/components/ui/score-ring";

describe("Notice", () => {
  it("announces danger and warning at once, info and success politely", () => {
    const { rerender } = render(
      <Notice tone="danger" title="Content didn't load">
        Reload the page to try again.
      </Notice>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Content didn't loadReload the page to try again.",
    );
    rerender(<Notice tone="success" title="Saved" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("holds one action", () => {
    render(
      <Notice
        tone="warning"
        title="Low credits"
        action={<button type="button">Top up</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Top up" })).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("is a title, one sentence and one action, with no picture", () => {
    const onClick = jest.fn();
    const { container } = render(
      <EmptyState
        title="No content yet"
        description="Articles you generate appear here."
        action={{ label: "Generate content", onClick }}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "No content yet" }),
    ).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeNull();
    return userEvent
      .click(screen.getByRole("button", { name: "Generate content" }))
      .then(() => expect(onClick).toHaveBeenCalled());
  });

  it("can be a page's h1, with a link and an eyebrow", () => {
    render(
      <EmptyState
        as="h1"
        eyebrow="404"
        title="Page not found"
        action={{ label: "Back to the home page", href: "/" }}
      />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to the home page" }),
    ).toHaveAttribute("href", "/");
  });
});

describe("Meter", () => {
  it("is a meter with its values when labelled, hidden when not", () => {
    const { rerender, container } = render(
      <Meter value={412} max={1000} label="Credits left" />,
    );
    const meter = screen.getByRole("meter", { name: "Credits left" });
    expect(meter).toHaveAttribute("aria-valuenow", "412");
    expect(meter).toHaveAttribute("aria-valuemax", "1000");
    rerender(<Meter value={2000} max={1000} />);
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
    // Over the maximum, the bar stops at full.
    expect(container.querySelector('[data-slot="meter"] > span')).toHaveStyle({
      width: "100%",
    });
  });
});

describe("ScoreRing", () => {
  it("names its score and keeps it between 0 and 100", () => {
    const { rerender } = render(
      <ScoreRing value={72.4} label="On-page score" />,
    );
    expect(
      screen.getByTitle("On-page score: 72 out of 100"),
    ).toBeInTheDocument();
    rerender(<ScoreRing value={140} label="On-page score" />);
    expect(
      screen.getByTitle("On-page score: 100 out of 100"),
    ).toBeInTheDocument();
  });
});
