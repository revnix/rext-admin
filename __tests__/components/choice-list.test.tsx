/**
 * The choice list (a radio group as one bordered list): each choice with its line, the picked one
 * checked, a choice that can't be made not pickable, and the field's label and error tied to it.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChoiceList } from "@/components/forms/choice-list";

const CHOICES = [
  { value: "starter", label: "Starter", description: "$29.00 a month" },
  {
    value: "growth",
    label: "Growth",
    description: "This is the current plan.",
    disabled: true,
  },
  { value: "scale", label: "Scale" },
];

describe("the choice list", () => {
  it("is a named radio group whose choices carry their lines", () => {
    render(
      <ChoiceList
        label="New plan"
        value="scale"
        onChange={() => {}}
        choices={CHOICES}
      />,
    );
    const group = screen.getByRole("radiogroup", { name: "New plan" });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: /Starter/ })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: /Scale/ })).toBeChecked();
    expect(screen.getByText("$29.00 a month")).toBeInTheDocument();
  });

  it("reports the choice picked, by the radio or by its line", async () => {
    const onChange = jest.fn();
    render(
      <ChoiceList
        label="New plan"
        value=""
        onChange={onChange}
        choices={CHOICES}
      />,
    );
    await userEvent.click(screen.getByRole("radio", { name: /Scale/ }));
    expect(onChange).toHaveBeenLastCalledWith("scale");
    await userEvent.click(screen.getByText("$29.00 a month"));
    expect(onChange).toHaveBeenLastCalledWith("starter");
  });

  it("doesn't let a disabled choice be picked, and still shows why", async () => {
    const onChange = jest.fn();
    render(
      <ChoiceList
        label="New plan"
        value=""
        onChange={onChange}
        choices={CHOICES}
      />,
    );
    expect(screen.getByRole("radio", { name: /Growth/ })).toBeDisabled();
    await userEvent.click(screen.getByText("This is the current plan."));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("carries the field's id, its error state and its help", () => {
    render(
      <>
        <ChoiceList
          id="field-plan_id"
          label="New plan"
          value=""
          onChange={() => {}}
          choices={CHOICES}
          aria-invalid
          aria-describedby="field-plan_id-help"
        />
        <p id="field-plan_id-help">Choose a plan</p>
      </>,
    );
    const group = screen.getByRole("radiogroup", { name: "New plan" });
    expect(group).toHaveAttribute("id", "field-plan_id");
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAccessibleDescription("Choose a plan");
  });

  it("tells the field when focus leaves the group, not when it moves inside it", async () => {
    const onBlur = jest.fn();
    render(
      <>
        <ChoiceList
          label="New plan"
          value="starter"
          onChange={() => {}}
          onBlur={onBlur}
          choices={CHOICES}
        />
        <button type="button">Next</button>
      </>,
    );
    await userEvent.tab();
    expect(screen.getByRole("radio", { name: /Starter/ })).toHaveFocus();
    // The arrow keys move between the group's radios: still in the field.
    await userEvent.keyboard("{ArrowDown}");
    expect(onBlur).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("hands the field's ref the radio that takes focus: the checked one, else the first that can be picked", () => {
    let target: HTMLButtonElement | null = null;
    const ref = (node: HTMLButtonElement | null) => {
      target = node;
    };
    const { rerender } = render(
      <ChoiceList
        label="New plan"
        value=""
        onChange={() => {}}
        ref={ref}
        choices={CHOICES}
      />,
    );
    expect(target).toBe(screen.getByRole("radio", { name: /Starter/ }));

    rerender(
      <ChoiceList
        label="New plan"
        value="scale"
        onChange={() => {}}
        ref={ref}
        choices={CHOICES}
      />,
    );
    expect(target).toBe(screen.getByRole("radio", { name: /Scale/ }));

    // A checked choice that can't be picked (the current plan) is not where focus goes.
    rerender(
      <ChoiceList
        label="New plan"
        value="growth"
        onChange={() => {}}
        ref={ref}
        choices={CHOICES}
      />,
    );
    expect(target).toBe(screen.getByRole("radio", { name: /Starter/ }));
  });
});
