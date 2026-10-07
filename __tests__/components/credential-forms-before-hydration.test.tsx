/**
 * The credential forms are in the server's HTML (the sign-in pages render without a spinner first),
 * so a submit before React runs is the browser's own. They post, so the fields never go into the
 * address, and their submit waits for the page to run, so nothing is sent before then.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { z } from "zod";
import { FieldController } from "@/components/forms/field-controller";
import { FormShell } from "@/components/forms/form-shell";
import { useZodForm } from "@/components/forms/use-zod-form";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import { Input } from "@/components/ui/input";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/login",
}));
jest.mock("next-auth/react", () => ({ signIn: jest.fn() }));
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: { success: jest.fn(), error: jest.fn() } }),
}));
jest.mock("@/hooks/use-invitation-validation", () => ({
  useInvitationValidation: () => ({
    invitationToken: null,
    invitation: null,
    isLoading: false,
    isValid: false,
    error: null,
  }),
}));
jest.mock("@/lib/analytics", () => ({ analytics: { track: jest.fn() } }));
jest.mock("@/lib/auth-utils", () => ({
  getAuthHeaders: async () => ({}),
  resetAuthRedirectState: jest.fn(),
}));

const schema = z.object({ name: z.string() });

function ShellForm() {
  const form = useZodForm(schema, { defaultValues: { name: "" } });
  return (
    <FormShell form={form} onSubmit={jest.fn()} submitLabel="Save">
      <FieldController control={form.control} name="name" label="Name">
        {(field) => <Input {...field} />}
      </FieldController>
    </FormShell>
  );
}

const withQuery = (ui: ReactElement) => (
  <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>
);

const FORMS: [string, () => ReactElement, RegExp][] = [
  ["log in", () => withQuery(<LoginForm />), /^Log in$/],
  ["sign up", () => withQuery(<SignupForm />), /^Create account$/],
  ["forgot password", () => withQuery(<ForgotPasswordForm />), /Reset|Send/],
  ["a FormShell form", () => <ShellForm />, /^Save$/],
];

describe.each(FORMS)("the %s form", (_name, ui, submit) => {
  it("posts, and its submit is disabled in the server's HTML", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(ui());
    const form = container.querySelector("form");
    expect(form?.getAttribute("method")).toBe("post");
    const button = container.querySelector<HTMLButtonElement>(
      'form button[type="submit"]',
    );
    expect(button?.textContent ?? "").toMatch(submit);
    expect(button?.disabled).toBe(true);
  });

  it("enables its submit once the page runs", () => {
    render(ui());
    const button = screen
      .getAllByRole("button")
      .find((b) => b.getAttribute("type") === "submit");
    expect(button).toBeDefined();
    expect(button).toBeEnabled();
  });
});
