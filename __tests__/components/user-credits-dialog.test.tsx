/**
 * The admin's Credits dialog (FB2.28): a user's credits by where they come from, the form that
 * adds, deducts or resets them (a deduct and a reset ask first), the line that says what will
 * happen, the backend's refusals beside their fields, and one history of every change.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserCreditsDialog } from "@/components/admin/users/user-credits-dialog";
import { ApiError } from "@/lib/api-client/core";
import type { User } from "@/lib/api-client/users";

jest.mock("@/lib/api-client", () => ({
  apiClient: { adminCredits: { get: jest.fn(), adjust: jest.fn() } },
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const adminCredits = jest.requireMock("@/lib/api-client").apiClient
  .adminCredits as { get: jest.Mock; adjust: jest.Mock };
const toast = jest.requireMock("sonner").toast as {
  success: jest.Mock;
  error: jest.Mock;
};

const USER: User = {
  id: "user-1",
  email: "x@example.com",
  display_name: "Xavier Young",
  status: "active",
  email_verified: true,
};
const REASON = "Compensation for the outage";

/** GET /admin/users/{id}/credits: a Growth plan, one add with its grant, one deduct. */
const credits = (breakdown: Record<string, unknown> = {}) => ({
  user_id: "user-1",
  credits: {
    subscription_id: "sub-1",
    plan_name: "Growth",
    current_credits: 520,
    monthly_credits: 320,
    credits_per_month: 500,
    credits_reset_date: "2026-11-01T12:00:00Z",
    bonus: null,
    added_credits: {
      credits: 200,
      granted: 250,
      expires_at: "2099-10-31T12:00:00Z",
    },
    period_adjustment: 0,
    ...breakdown,
  },
  grants: [
    {
      id: "grant-1",
      subscription_id: "sub-1",
      amount: 250,
      remaining: 200,
      forfeited: 50,
      reason: REASON,
      granted_by: "admin-id",
      granted_by_email: "admin@example.com",
      expires_at: "2099-10-31T12:00:00Z",
      created_at: "2026-10-05T10:00:00Z",
    },
  ],
  adjustments: [
    {
      id: "audit-2",
      action: "deduct",
      amount: 50,
      requested_amount: 50,
      balance_before: 570,
      balance_after: 520,
      reason: "Added too many by mistake",
      expires_at: null,
      grant_id: null,
      adjusted_by: null,
      adjusted_by_email: null,
      created_at: "2026-10-06T10:00:00Z",
    },
    {
      id: "audit-1",
      action: "add",
      amount: 250,
      requested_amount: 250,
      balance_before: 320,
      balance_after: 570,
      reason: REASON,
      expires_at: "2099-10-31T12:00:00+00:00",
      grant_id: "grant-1",
      adjusted_by: "admin-id",
      adjusted_by_email: "admin@example.com",
      created_at: "2026-10-05T10:00:00Z",
    },
  ],
});

/** POST /admin/users/{id}/credits (AdminCreditAdjustmentResult). */
const answer = (fields: Record<string, unknown> = {}) => ({
  action: "add",
  requested_amount: 200,
  amount: 200,
  balance_before: 520,
  balance_after: 720,
  monthly_credits: 320,
  admin_credits: 400,
  subscription_id: "sub-1",
  grant_id: "grant-2",
  audit_id: "audit-3",
  ...fields,
});

function renderDialog() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <UserCreditsDialog open onOpenChange={() => {}} user={USER} />
    </QueryClientProvider>,
  );
}

/** The dialog with the credits loaded, and its form's controls. */
async function openForm(breakdown: Record<string, unknown> = {}) {
  adminCredits.get.mockResolvedValue(credits(breakdown));
  renderDialog();
  await screen.findByRole("heading", { name: "Change the credits" });
  return {
    amount: () => screen.getByRole("textbox", { name: /Amount/ }),
    reason: () => screen.getByRole("textbox", { name: /Reason/ }),
    choose: (action: RegExp) =>
      userEvent.click(screen.getByRole("radio", { name: action })),
  };
}

beforeEach(() => {
  adminCredits.get.mockReset();
  adminCredits.adjust.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

describe("the Credits dialog's summary", () => {
  it("shows the plan, the month's credits, the added credits and the period's end", async () => {
    await openForm();
    const dialog = screen.getByRole("dialog", { name: "Credits" });
    expect(dialog).toHaveAccessibleDescription(
      /Xavier Young \(x@example\.com\)/,
    );

    const value = (label: string) =>
      within(dialog).getByText(label).nextElementSibling;
    expect(value("Plan")).toHaveTextContent("Growth");
    expect(value("Monthly credits")).toHaveTextContent("320 of 500 left");
    expect(value("Added credits")).toHaveTextContent(
      "200 left of 250, soonest expiry Oct 31, 2099",
    );
    expect(value("Bonus")).toHaveTextContent("None");
    expect(value("Period ends")).toHaveTextContent("Nov 1, 2026");
    expect(adminCredits.get).toHaveBeenCalledWith("user-1");
  });

  it("says there is nothing to change for a user with no plan, and shows no form", async () => {
    adminCredits.get.mockResolvedValue(
      credits({
        subscription_id: null,
        plan_name: null,
        current_credits: 0,
        monthly_credits: 0,
        credits_per_month: null,
        credits_reset_date: null,
        added_credits: null,
      }),
    );
    renderDialog();

    expect(await screen.findByText("Nothing to change")).toBeInTheDocument();
    expect(
      screen.getByText(/This user has no plan that grants access/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Change the credits" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add credits" }),
    ).not.toBeInTheDocument();
  });

  it("says so when the credits don't load, with a way to try again", async () => {
    adminCredits.get.mockRejectedValue(new Error("Service unavailable"));
    renderDialog();

    expect(
      await screen.findByText("The credits didn't load"),
    ).toBeInTheDocument();
    expect(screen.getByText("Service unavailable")).toBeInTheDocument();

    adminCredits.get.mockResolvedValue(credits());
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("heading", { name: "Change the credits" }),
    ).toBeInTheDocument();
  });
});

describe("the Credits dialog's history", () => {
  it("lists every change once, newest first, with who, why and what is left", async () => {
    await openForm();
    const rows = within(
      screen.getByRole("list", { name: "Admin changes to the credits" }),
    ).getAllByRole("listitem");

    // The add and the grant it made are one row, not two.
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("50 credits deducted");
    expect(rows[0]).toHaveTextContent("by an admin whose account is gone");
    expect(rows[0]).toHaveTextContent("Reason: Added too many by mistake");
    expect(rows[0]).toHaveTextContent("Balance from 570 to 520");

    expect(rows[1]).toHaveTextContent("250 credits added");
    expect(rows[1]).toHaveTextContent("by admin@example.com");
    expect(rows[1]).toHaveTextContent(`Reason: ${REASON}`);
    expect(rows[1]).toHaveTextContent(
      "200 left · 50 taken back · Expires Oct 31, 2099 · Balance from 320 to 570",
    );
  });

  it("says when no admin has changed the credits", async () => {
    adminCredits.get.mockResolvedValue({
      ...credits(),
      grants: [],
      adjustments: [],
    });
    renderDialog();
    expect(
      await screen.findByText("No admin has changed this user's credits."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe("the Credits dialog's form", () => {
  it("states what each action will do before it is sent", async () => {
    const form = await openForm();
    const line = () =>
      screen
        .getByRole("button", { name: /credits$/ })
        .getAttribute("aria-describedby") as string;
    const says = (text: string) =>
      expect(document.getElementById(line())).toHaveTextContent(text);

    says("Complete the fields above to see what will happen.");

    await userEvent.type(form.amount(), "200");
    says("Add 200 credits to x@example.com");
    expect(
      screen.getByRole("button", { name: "Add credits" }),
    ).toHaveAccessibleDescription("Add 200 credits to x@example.com");

    await form.choose(/^Deduct/);
    says("Deduct 200 credits from x@example.com");
    expect(
      screen.getByRole("button", { name: "Deduct credits" }),
    ).toHaveAccessibleDescription("Deduct 200 credits from x@example.com");

    await form.choose(/^Reset/);
    says("Reset x@example.com's monthly credits to the plan's 500");
    expect(
      screen.getByRole("button", { name: "Reset monthly credits" }),
    ).toHaveAccessibleDescription(
      "Reset x@example.com's monthly credits to the plan's 500",
    );
  });

  it("asks an amount and an expiry of an add, an amount of a deduct, neither of a reset", async () => {
    const form = await openForm();
    expect(form.amount()).toBeInTheDocument();
    expect(screen.getByLabelText(/Expires on/)).toBeInTheDocument();

    await form.choose(/^Deduct/);
    expect(form.amount()).toBeInTheDocument();
    expect(screen.queryByLabelText(/Expires on/)).not.toBeInTheDocument();

    await form.choose(/^Reset/);
    expect(
      screen.queryByRole("textbox", { name: /Amount/ }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Expires on/)).not.toBeInTheDocument();
    expect(form.reason()).toBeInTheDocument();
  });

  it("counts the reason's characters against the limit", async () => {
    const form = await openForm();
    expect(screen.getByText("0 / 500")).toBeInTheDocument();
    await userEvent.type(form.reason(), "Goodwill");
    expect(screen.getByText("8 / 500")).toBeInTheDocument();
  });

  it("says added credits are the user's, whatever happens to the subscription", async () => {
    await openForm();
    expect(screen.getByRole("radio", { name: /^Add/ })).toHaveAccessibleName(
      /They are the user's: they stay when the subscription changes, for example when a trial user subscribes\./,
    );
  });

  it("doesn't offer a reset on a plan with no monthly credits", async () => {
    await openForm({ credits_per_month: null });
    const reset = screen.getByRole("radio", { name: /^Reset/ });
    expect(reset).toBeDisabled();
    expect(reset).toHaveAccessibleName(
      /This plan has no monthly credits to reset to\./,
    );
  });

  it("refuses an empty form beside its fields, and sends nothing", async () => {
    const form = await openForm();
    await userEvent.click(screen.getByRole("button", { name: "Add credits" }));

    expect(await screen.findByText("Enter how many credits")).toBeVisible();
    expect(form.amount()).toHaveAttribute("aria-invalid", "true");
    expect(form.amount()).toHaveAccessibleDescription("Enter how many credits");
    expect(form.reason()).toHaveAccessibleDescription(
      "Give a reason of at least 3 characters",
    );
    expect(adminCredits.adjust).not.toHaveBeenCalled();
  });

  it("refuses an amount past the limit and an expiry in the past", async () => {
    const form = await openForm();
    await userEvent.type(form.amount(), "100001");
    fireEvent.change(screen.getByLabelText(/Expires on/), {
      target: { value: "2020-01-01" },
    });
    await userEvent.type(form.reason(), REASON);
    await userEvent.click(screen.getByRole("button", { name: "Add credits" }));

    expect(form.amount()).toHaveAccessibleDescription(
      "Enter a whole number from 1 to 100,000",
    );
    expect(screen.getByLabelText(/Expires on/)).toHaveAccessibleDescription(
      "Choose today or a later day",
    );
    expect(adminCredits.adjust).not.toHaveBeenCalled();
  });

  it("sends an add at once, toasts the new balance, clears the form and reads the credits again", async () => {
    adminCredits.adjust.mockResolvedValue(answer());
    const form = await openForm();
    await userEvent.type(form.amount(), "200");
    await userEvent.type(form.reason(), `  ${REASON}  `);
    await userEvent.click(screen.getByRole("button", { name: "Add credits" }));

    await waitFor(() =>
      expect(adminCredits.adjust).toHaveBeenCalledWith("user-1", {
        action: "add",
        amount: 200,
        reason: REASON,
      }),
    );
    // A whole number in the JSON, not the text that was typed.
    expect(JSON.stringify(adminCredits.adjust.mock.calls[0][1])).toBe(
      `{"action":"add","amount":200,"reason":"${REASON}"}`,
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "200 credits added to x@example.com",
        { description: "The balance is now 720 credits." },
      ),
    );
    await waitFor(() => expect(form.amount()).toHaveValue(""));
    expect(form.reason()).toHaveValue("");
    expect(adminCredits.get).toHaveBeenCalledTimes(2);
  });

  it("sends an add's expiry as the end of the chosen day", async () => {
    adminCredits.adjust.mockResolvedValue(answer());
    const form = await openForm();
    await userEvent.type(form.amount(), "200");
    fireEvent.change(screen.getByLabelText(/Expires on/), {
      target: { value: "2099-12-31" },
    });
    await userEvent.type(form.reason(), REASON);
    expect(
      screen.getByRole("button", { name: "Add credits" }),
    ).toHaveAccessibleDescription(
      "Add 200 credits to x@example.com, expiring at the end of Dec 31, 2099",
    );
    await userEvent.click(screen.getByRole("button", { name: "Add credits" }));

    await waitFor(() =>
      expect(adminCredits.adjust).toHaveBeenCalledWith("user-1", {
        action: "add",
        amount: 200,
        reason: REASON,
        expires_at: new Date(2099, 11, 31, 23, 59, 59, 999).toISOString(),
      }),
    );
  });

  it("asks before a deduct, and sends nothing when the credits are kept", async () => {
    const form = await openForm();
    await form.choose(/^Deduct/);
    await userEvent.type(form.amount(), "50");
    await userEvent.type(form.reason(), REASON);
    await userEvent.click(
      screen.getByRole("button", { name: "Deduct credits" }),
    );

    const question = await screen.findByRole("alertdialog", {
      name: "Deduct 50 credits from x@example.com?",
    });
    expect(adminCredits.adjust).not.toHaveBeenCalled();
    await userEvent.click(
      within(question).getByRole("button", { name: "Keep the credits" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(adminCredits.adjust).not.toHaveBeenCalled();
    // What was typed is still there.
    expect(form.amount()).toHaveValue("50");
  });

  it("sends a deduct once it is confirmed, with an amount and no expiry", async () => {
    adminCredits.adjust.mockResolvedValue(
      answer({
        action: "deduct",
        requested_amount: 50,
        amount: 30,
        balance_before: 30,
        balance_after: 0,
        grant_id: null,
      }),
    );
    const form = await openForm();
    // An expiry typed for an add is not sent with a deduct.
    fireEvent.change(screen.getByLabelText(/Expires on/), {
      target: { value: "2099-12-31" },
    });
    await form.choose(/^Deduct/);
    await userEvent.type(form.amount(), "50");
    await userEvent.type(form.reason(), REASON);
    await userEvent.click(
      screen.getByRole("button", { name: "Deduct credits" }),
    );
    const question = await screen.findByRole("alertdialog");
    await userEvent.click(
      within(question).getByRole("button", { name: "Deduct credits" }),
    );

    await waitFor(() =>
      expect(adminCredits.adjust).toHaveBeenCalledWith("user-1", {
        action: "deduct",
        amount: 50,
        reason: REASON,
      }),
    );
    // Less was there than asked for: the toast says what was really taken.
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "30 credits deducted from x@example.com, not the 50 asked for",
        {
          description:
            "That was all there was to take. The balance is now 0 credits.",
        },
      ),
    );
  });

  it("asks before a reset, and sends it with no amount", async () => {
    adminCredits.adjust.mockResolvedValue(
      answer({
        action: "reset",
        requested_amount: null,
        amount: 180,
        monthly_credits: 500,
        balance_after: 700,
        grant_id: null,
      }),
    );
    const form = await openForm();
    // An amount typed for an add is not sent with a reset.
    await userEvent.type(form.amount(), "300");
    await form.choose(/^Reset/);
    await userEvent.type(form.reason(), REASON);
    await userEvent.click(
      screen.getByRole("button", { name: "Reset monthly credits" }),
    );

    const question = await screen.findByRole("alertdialog", {
      name: "Reset x@example.com's monthly credits to the plan's 500?",
    });
    expect(adminCredits.adjust).not.toHaveBeenCalled();
    await userEvent.click(
      within(question).getByRole("button", { name: "Reset monthly credits" }),
    );

    await waitFor(() =>
      expect(adminCredits.adjust).toHaveBeenCalledWith("user-1", {
        action: "reset",
        reason: REASON,
      }),
    );
    expect(adminCredits.adjust.mock.calls[0][1]).not.toHaveProperty("amount");
    expect(JSON.stringify(adminCredits.adjust.mock.calls[0][1])).toBe(
      `{"action":"reset","reason":"${REASON}"}`,
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "x@example.com's monthly credits reset to 500",
        {
          description: "180 more than before. The balance is now 700 credits.",
        },
      ),
    );
  });

  it("puts the backend's field errors beside their fields", async () => {
    adminCredits.adjust.mockRejectedValue(
      new ApiError(422, "Validation failed", "VALIDATION_FAILED", {
        success: false,
        error: {
          code: "VALIDATION_FAILED",
          message: "Validation failed",
          details: [
            {
              field: "body -> amount",
              message: "Input should be less than or equal to 100000",
            },
            { field: "reason", message: "Between 3 and 500 characters" },
          ],
        },
      }),
    );
    const form = await openForm();
    await userEvent.type(form.amount(), "200");
    await userEvent.type(form.reason(), REASON);
    await userEvent.click(screen.getByRole("button", { name: "Add credits" }));

    await waitFor(() =>
      expect(form.amount()).toHaveAccessibleDescription(
        "Input should be less than or equal to 100000",
      ),
    );
    expect(form.amount()).toHaveAttribute("aria-invalid", "true");
    expect(form.reason()).toHaveAccessibleDescription(
      "Between 3 and 500 characters",
    );
    expect(
      screen.queryByText("The credits weren't changed"),
    ).not.toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
    // What was typed stays, to be corrected.
    expect(form.amount()).toHaveValue("200");
  });

  it("shows any other refusal in the backend's words, above the form", async () => {
    adminCredits.adjust.mockRejectedValue(
      new ApiError(
        400,
        "This user has no active subscription whose credits can be changed.",
        "BUSINESS_RULE_VIOLATION",
        { success: false, error: { message: "…" } },
      ),
    );
    const form = await openForm();
    await userEvent.type(form.amount(), "200");
    await userEvent.type(form.reason(), REASON);
    await userEvent.click(screen.getByRole("button", { name: "Add credits" }));

    expect(
      await screen.findByText("The credits weren't changed"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This user has no active subscription whose credits can be changed.",
      ),
    ).toBeInTheDocument();
    expect(form.amount()).toHaveAttribute("aria-invalid", "false");
    expect(toast.success).not.toHaveBeenCalled();
  });
});
