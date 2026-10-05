/**
 * The shadcn components added for Plan C (Field, Input Group, Empty, Kbd,
 * Spinner) render with this app's own Label, Separator, Button, Input and
 * Textarea, which differ from the registry's (Input wraps its control in a div).
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";

describe("Field", () => {
  it("ties the label to the control and shows one error as text", () => {
    render(
      <Field data-invalid>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <input id="email" aria-invalid />
        <FieldDescription>We never share it.</FieldDescription>
        <FieldError errors={[{ message: "Enter an email address" }]} />
      </Field>,
    );
    expect(screen.getByRole("group")).toHaveAttribute("data-slot", "field");
    expect(screen.getByLabelText("Email")).toHaveAttribute("id", "email");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter an email address",
    );
  });

  it("lists several different errors once each", () => {
    render(
      <FieldError
        errors={[
          { message: "Too short" },
          { message: "Too short" },
          { message: "No letters" },
        ]}
      />,
    );
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(
      ["Too short", "No letters"],
    );
  });
});

describe("InputGroup", () => {
  it("puts the app's Input inside and focuses it when the addon is clicked", async () => {
    render(
      <InputGroup>
        <InputGroupInput aria-label="Search" />
        <InputGroupAddon>
          <span>Find</span>
        </InputGroupAddon>
      </InputGroup>,
    );
    const input = screen.getByLabelText("Search");
    expect(input).toHaveAttribute("data-slot", "input-group-control");
    await userEvent.click(screen.getByText("Find"));
    expect(input).toHaveFocus();
  });
});

describe("Empty, Kbd and Spinner", () => {
  it("render their content with an accessible spinner", () => {
    render(
      <>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No articles yet</EmptyTitle>
            <EmptyDescription>Generate your first one.</EmptyDescription>
          </EmptyHeader>
        </Empty>
        <Kbd>C</Kbd>
        <Spinner />
      </>,
    );
    expect(screen.getByText("No articles yet")).toBeInTheDocument();
    expect(screen.getByText("C").tagName).toBe("KBD");
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading");
  });
});
