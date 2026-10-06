import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";
import { FieldController } from "@/components/forms/field-controller";
import { FormShell } from "@/components/forms/form-shell";
import { useZodForm } from "@/components/forms/use-zod-form";
import { Input } from "@/components/ui/input";

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: jest.fn(), replace: jest.fn() }),
}));

const schema = z.object({
  name: z.string().trim().min(3, "Name must be at least 3 characters"),
});

function NameForm({ onSubmit }: { onSubmit: (v: { name: string }) => void }) {
  const form = useZodForm(schema, { defaultValues: { name: "" } });
  return (
    <FormShell form={form} onSubmit={onSubmit} submitLabel="Save">
      <FieldController
        control={form.control}
        name="name"
        label="Name"
        required
        description="What people call it."
      >
        {(field) => <Input {...field} />}
      </FieldController>
      <a href="/elsewhere">Elsewhere</a>
    </FormShell>
  );
}

function FileForm({ chosen }: { chosen: boolean }) {
  const form = useZodForm(schema, { defaultValues: { name: "" } });
  return (
    <FormShell
      form={form}
      onSubmit={jest.fn()}
      submitLabel="Save"
      dirty={chosen}
    >
      <a href="/elsewhere">Elsewhere</a>
    </FormShell>
  );
}

describe("the form shell and its fields", () => {
  beforeEach(() => push.mockClear());

  it("marks the field required and ties its help text to the control", () => {
    render(<NameForm onSubmit={jest.fn()} />);
    const input = screen.getByRole("textbox", { name: /name/i });
    expect(screen.getByText("*")).toBeInTheDocument();
    expect(input).toHaveAccessibleDescription("What people call it.");
  });

  it("says nothing while typing, shows the error on blur, then follows each change", async () => {
    const user = userEvent.setup();
    render(<NameForm onSubmit={jest.fn()} />);
    const input = screen.getByRole("textbox", { name: /name/i });

    await user.type(input, "ab");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await user.tab();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Name must be at least 3 characters",
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    // The error replaces the help text.
    expect(screen.queryByText("What people call it.")).not.toBeInTheDocument();

    await user.type(input, "c");
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("What people call it.")).toBeInTheDocument();
  });

  it("keeps Save enabled and focuses the first error on a failed submit", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<NameForm onSubmit={onSubmit} />);
    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeEnabled();

    await user.click(save);
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /name/i })).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("asks before following a link away from a form with unsaved changes", async () => {
    const user = userEvent.setup();
    render(<NameForm onSubmit={jest.fn()} />);
    await user.type(screen.getByRole("textbox", { name: /name/i }), "Acme");

    await user.click(screen.getByRole("link", { name: "Elsewhere" }));
    expect(
      await screen.findByRole("alertdialog", { name: "Leave without saving?" }),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Leave without saving" }),
    );
    expect(push).toHaveBeenCalledWith("/elsewhere");
  });
  it("guards state the form doesn't hold, such as a chosen file", async () => {
    const user = userEvent.setup();
    render(<FileForm chosen />);
    await user.click(screen.getByRole("link", { name: "Elsewhere" }));
    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
