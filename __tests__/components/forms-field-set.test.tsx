/**
 * C4a (#392): the remaining forms on the field set. A toggle sits beside its label and shows its
 * error; the password change checks its fields on blur, says how strong a new password is, and
 * sends what was typed.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { z } from "zod";
import { ToggleController } from "@/components/forms/toggle-controller";
import { useZodForm } from "@/components/forms/use-zod-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
}));

jest.mock("@/lib/api-client", () => ({
  apiClient: { profile: { changePassword: jest.fn() } },
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const changePassword = jest.requireMock("@/lib/api-client").apiClient.profile
  .changePassword as jest.Mock;

function withQuery(node: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

const agreeSchema = z.object({
  agreed: z.boolean().refine((value) => value, "Tick this to go on"),
  public: z.boolean(),
});

function AgreeForm({ onSubmit }: { onSubmit: (values: unknown) => void }) {
  const form = useZodForm(agreeSchema, {
    defaultValues: { agreed: false, public: true },
  });
  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <ToggleController
        control={form.control}
        name="agreed"
        label="I agree"
        description="Read the terms first."
      />
      <ToggleController
        control={form.control}
        name="public"
        kind="switch"
        label="Public"
      />
      <button type="submit">Go</button>
    </form>
  );
}

describe("a toggle on the field set", () => {
  it("is named by its label, and its label toggles it", async () => {
    render(<AgreeForm onSubmit={jest.fn()} />);
    const box = screen.getByRole("checkbox", { name: "I agree" });
    expect(box).toHaveAccessibleDescription("Read the terms first.");
    await userEvent.click(screen.getByText("I agree"));
    expect(box).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Public" })).toBeChecked();
  });

  it("shows its error in place of the help text, and the form doesn't send", async () => {
    const onSubmit = jest.fn();
    render(<AgreeForm onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole("button", { name: "Go" }));
    const box = screen.getByRole("checkbox", { name: "I agree" });
    expect(await screen.findByText("Tick this to go on")).toBeInTheDocument();
    expect(box).toHaveAttribute("aria-invalid", "true");
    expect(box).toHaveAccessibleDescription("Tick this to go on");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("the password change", () => {
  beforeEach(() => changePassword.mockReset());

  it("checks a field when it loses focus", async () => {
    render(withQuery(<ChangePasswordForm />));
    await userEvent.click(screen.getByLabelText(/Current password/));
    await userEvent.tab();
    expect(
      await screen.findByText("Current password is required"),
    ).toBeInTheDocument();
  });

  it("says how strong the new password is", async () => {
    render(withQuery(<ChangePasswordForm />));
    await userEvent.type(screen.getByLabelText(/^\*?New password/), "abc");
    expect(screen.getByText("Weak")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/^\*?New password/), "DEF12!xy");
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("sends the three passwords as the backend names them", async () => {
    changePassword.mockResolvedValue({});
    render(withQuery(<ChangePasswordForm />));
    await userEvent.type(
      screen.getByLabelText(/Current password/),
      "old-Pass1!",
    );
    await userEvent.type(
      screen.getByLabelText(/^\*?New password/),
      "New-Pass1!",
    );
    await userEvent.type(
      screen.getByLabelText(/Confirm new password/),
      "New-Pass1!",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Change password" }),
    );
    await waitFor(() =>
      expect(changePassword).toHaveBeenCalledWith({
        current_password: "old-Pass1!",
        new_password: "New-Pass1!",
        confirm_password: "New-Pass1!",
      }),
    );
  });
});
