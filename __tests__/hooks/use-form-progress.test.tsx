/**
 * How far a person gets in a form on a page that is never recorded (rext-control task 712): that
 * they began, and which fields they left filled. Once each, and never a value.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFormProgress } from "@/hooks/use-form-progress";
import { analytics } from "@/lib/analytics";

jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));

const track = analytics.track as jest.Mock;
const sent = (name: string) =>
  track.mock.calls
    .filter(([event]) => event === name)
    .map(([, properties]) => properties);

function Form({ invited = false }: { invited?: boolean }) {
  const progress = useFormProgress({
    started: "signup_started",
    fieldFilled: "signup_field_filled",
    fields: { full_name: "full_name", confirmPassword: "confirm_password" },
    properties: { method: "credentials", invited },
  });
  return (
    <form {...progress}>
      <input aria-label="Name" name="full_name" />
      <input aria-label="Confirm" name="confirmPassword" />
      <input
        aria-label="Given"
        name="email"
        readOnly
        defaultValue="given@example.com"
      />
      <input aria-label="Unlisted" name="coupon" />
      <button type="button">Elsewhere</button>
    </form>
  );
}

beforeEach(() => {
  track.mockClear();
});

describe("useFormProgress", () => {
  it("says once that the person began, with the properties as they are then", async () => {
    const { rerender } = render(<Form />);
    rerender(<Form invited />);

    await userEvent.type(screen.getByLabelText("Name"), "Ana Writer");
    await userEvent.type(screen.getByLabelText("Confirm"), "a-passphrase");

    expect(sent("signup_started")).toEqual([
      { method: "credentials", invited: true },
    ]);
  });

  it("names a field once, when it is left with something in it, under the event's own name", async () => {
    render(<Form />);

    await userEvent.type(screen.getByLabelText("Confirm"), "a-passphrase");
    expect(sent("signup_field_filled")).toEqual([]);

    await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(sent("signup_field_filled")).toEqual([
      { field: "confirm_password" },
    ]);

    // Back in and out again: nothing more.
    await userEvent.click(screen.getByLabelText("Confirm"));
    await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(sent("signup_field_filled")).toHaveLength(1);
  });

  it("says nothing for a field left empty, one filled in for the person, or one that is not on the list", async () => {
    render(<Form />);

    await userEvent.click(screen.getByLabelText("Name"));
    await userEvent.click(screen.getByLabelText("Given"));
    await userEvent.type(screen.getByLabelText("Unlisted"), "SPRING");
    await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));

    expect(track).not.toHaveBeenCalled();
  });

  it("never sends what was typed", async () => {
    render(<Form />);

    await userEvent.type(screen.getByLabelText("Name"), "Ana Writer");
    await userEvent.type(screen.getByLabelText("Confirm"), "a-passphrase");
    await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));

    const everything = JSON.stringify(track.mock.calls);
    expect(everything).not.toContain("Ana Writer");
    expect(everything).not.toContain("a-passphrase");
    expect(sent("signup_field_filled")).toEqual([
      { field: "full_name" },
      { field: "confirm_password" },
    ]);
  });
});
