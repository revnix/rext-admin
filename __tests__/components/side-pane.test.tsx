import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SidePaneTrigger, WithSidePane } from "@/components/layouts";

describe("WithSidePane, the button that opens its sheet under 1024 px", () => {
  it("floats by default, and opens the pane in a sheet", async () => {
    const user = userEvent.setup();
    render(
      <WithSidePane side={<p>The evidence</p>} sideTitle="Evidence">
        <p>The step</p>
      </WithSidePane>,
    );

    const button = screen.getByRole("button", { name: "Evidence" });
    expect(button).toHaveClass("fixed", "lg:hidden");

    await user.click(button);
    const sheet = await screen.findByRole("dialog", { name: "Evidence" });
    expect(within(sheet).getByText("The evidence")).toBeInTheDocument();
  });

  it("sits where the page puts it with trigger=inline, and opens the same sheet", async () => {
    const user = userEvent.setup();
    render(
      <WithSidePane side={<p>The brief</p>} sideTitle="Brief" trigger="inline">
        <div data-testid="bar">
          <SidePaneTrigger size="default" />
        </div>
      </WithSidePane>,
    );

    const buttons = screen.getAllByRole("button", { name: "Brief" });
    expect(buttons).toHaveLength(1);
    expect(within(screen.getByTestId("bar")).getByRole("button")).toBe(
      buttons[0],
    );
    expect(buttons[0]).not.toHaveClass("fixed");
    expect(buttons[0]).toHaveClass("lg:hidden");

    await user.click(buttons[0]);
    const sheet = await screen.findByRole("dialog", { name: "Brief" });
    expect(within(sheet).getByText("The brief")).toBeInTheDocument();
  });

  it("refuses a trigger outside a WithSidePane", () => {
    // React reports the thrown render to the console; the throw is what's checked.
    const quiet = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<SidePaneTrigger />)).toThrow(
      "SidePaneTrigger renders inside a WithSidePane.",
    );
    quiet.mockRestore();
  });
});
