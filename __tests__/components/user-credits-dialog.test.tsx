/**
 * The admin's Credits dialog (FB2.28): a user's credits by where they come from, the form that
 * adds, deducts or resets them within the limits the API sent (a deduct and a reset ask first),
 * the line that says what will happen, the backend's refusals beside their fields, one history of
 * every change, and a close that asks before it drops what was entered.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { UserCreditsDialog } from "@/components/admin/users/user-credits-dialog";
import type { AdminCreditLimits } from "@/lib/api-client/admin-credits";
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

/** `limits` as GET /admin/users/{id}/credits sends them: the dashboard holds no copy. */
const LIMITS: AdminCreditLimits = {
  amount_max: 100000,
  reason_min: 3,
  reason_max: 500,
};

/**
 * GET /admin/users/{id}/credits: a Growth plan, one add with its grant, one deduct, and the
 * limits (`null` for an API that doesn't send them yet).
 */
const credits = (
  breakdown: Record<string, unknown> = {},
  limits: AdminCreditLimits | null = LIMITS,
) => ({
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
  ...(limits ? { limits } : {}),
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

/** An answer that waits to be given, to look at the dialog while the request is under way. */
function pending() {
  let settle: (value: unknown) => void = () => {};
  const promise = new Promise((resolve) => {
    settle = resolve;
  });
  return { promise, settle };
}

const queryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

/** The page's part: it holds whose credits are open and, told to close, lets go of the user. */
function Page({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState<User | null>(USER);
  return (
    <UserCreditsDialog
      open={user !== null}
      // As the admin users page does: its handler closes whatever it is told.
      onOpenChange={() => {
        onClose();
        setUser(null);
      }}
      user={user}
    />
  );
}

function renderDialog() {
  const onClose = jest.fn();
  const client = queryClient();
  render(
    <QueryClientProvider client={client}>
      <Page onClose={onClose} />
    </QueryClientProvider>,
  );
  return { onClose, client };
}

/** The Credits dialog in the page, whether or not a question lies over it. */
const creditsDialog = () =>
  document.querySelector('[data-slot="dialog-content"]');

const spinner = (button: HTMLElement) =>
  button.querySelector("svg.animate-spin");

/** The dialog with the credits loaded, its form's controls, and the page's close. */
async function openForm(
  breakdown: Record<string, unknown> = {},
  limits: AdminCreditLimits | null = LIMITS,
) {
  adminCredits.get.mockResolvedValue(credits(breakdown, limits));
  const { onClose, client } = renderDialog();
  await screen.findByRole("heading", { name: "Change the credits" });
  return {
    onClose,
    client,
    amount: () => screen.getByRole("textbox", { name: /Amount/ }),
    reason: () => screen.getByRole("textbox", { name: /Reason/ }),
    choose: (action: RegExp) =>
      userEvent.click(screen.getByRole("radio", { name: action })),
    /** The form's own submit button, also while a question lies over the form. */
    submit: (name: string) =>
      screen
        .getAllByRole("button", { name, hidden: true })
        .find(
          (button) => button.getAttribute("type") === "submit",
        ) as HTMLElement,
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
  it("states what each action will do before it is sent, and names its button for it", async () => {
    const form = await openForm();
    const says = (text: string) =>
      expect(screen.getByText(text)).toBeInTheDocument();

    says("Complete the fields above to see what will happen.");

    await userEvent.type(form.amount(), "200");
    says("Add 200 credits to x@example.com");
    expect(form.submit("Add credits")).toBeEnabled();

    await form.choose(/^Deduct/);
    says("Deduct 200 credits from x@example.com");
    expect(form.submit("Deduct credits")).toBeEnabled();

    await form.choose(/^Reset/);
    says("Reset x@example.com's monthly credits to the plan's 500");
    expect(form.submit("Reset monthly credits")).toBeEnabled();
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

  it("doesn't offer a reset the backend says isn't possible, as for a trial's credits", async () => {
    await openForm({ credits_per_month: 60, can_reset: false });
    const reset = screen.getByRole("radio", { name: /^Reset/ });
    expect(reset).toBeDisabled();
    expect(reset).toHaveAccessibleName(
      /This plan has no monthly credits to reset to\./,
    );
  });

  it("offers a reset the backend says is possible", async () => {
    await openForm({ credits_per_month: 500, can_reset: true });
    expect(screen.getByRole("radio", { name: /^Reset/ })).toBeEnabled();
  });

  it("refuses an empty form beside its fields, and sends nothing", async () => {
    const form = await openForm();
    await userEvent.click(form.submit("Add credits"));

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
    await userEvent.click(form.submit("Add credits"));

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
    await userEvent.click(form.submit("Add credits"));

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
    // The dialog stays, for the new balance and the history.
    expect(form.onClose).not.toHaveBeenCalled();
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
      screen.getByText(
        "Add 200 credits to x@example.com, expiring at the end of Dec 31, 2099",
      ),
    ).toBeInTheDocument();
    await userEvent.click(form.submit("Add credits"));

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
    await userEvent.click(form.submit("Deduct credits"));

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
    // What was typed is still there, and can be sent after all.
    expect(form.amount()).toHaveValue("50");
    await waitFor(() => expect(form.submit("Deduct credits")).toBeEnabled());
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
    await userEvent.click(form.submit("Deduct credits"));
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
    await userEvent.click(form.submit("Reset monthly credits"));

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
    await userEvent.click(form.submit("Add credits"));

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
    await userEvent.click(form.submit("Add credits"));

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

describe("the Credits dialog's limits", () => {
  it("takes the range, the counter and the refusals from the limits the API sent", async () => {
    // Not the numbers the backend has today: whatever it sends is what the form says.
    const form = await openForm(
      {},
      { amount_max: 2500, reason_min: 5, reason_max: 120 },
    );
    expect(form.amount()).toHaveAccessibleDescription(
      "A whole number of credits from 1 to 2,500.",
    );
    expect(screen.getByText("0 / 120")).toBeInTheDocument();

    await userEvent.type(form.amount(), "2501");
    await userEvent.type(form.reason(), "Good");
    expect(screen.getByText("4 / 120")).toBeInTheDocument();
    await userEvent.click(form.submit("Add credits"));

    await waitFor(() =>
      expect(form.amount()).toHaveAccessibleDescription(
        "Enter a whole number from 1 to 2,500",
      ),
    );
    expect(form.amount()).toHaveAttribute("aria-invalid", "true");
    expect(form.reason()).toHaveAccessibleDescription(
      "Give a reason of at least 5 characters",
    );
    // Nothing will happen as typed, so the line promises nothing.
    expect(
      screen.getByText("Complete the fields above to see what will happen."),
    ).toBeInTheDocument();
    expect(adminCredits.adjust).not.toHaveBeenCalled();
  });

  it("holds no ceiling of its own: without limits the API's refusal shows beside the amount", async () => {
    adminCredits.adjust.mockRejectedValue(
      new ApiError(422, "Validation failed", "VALIDATION_FAILED", {
        detail: [
          {
            loc: ["body", "amount"],
            msg: "Input should be less than or equal to 100000",
          },
        ],
      }),
    );
    const form = await openForm({}, null);
    expect(form.amount()).toHaveAccessibleDescription(
      "A whole number of credits.",
    );
    // No counter: the reason's longest length isn't known.
    expect(screen.queryByText(/^\d+ \/ \d+$/)).not.toBeInTheDocument();

    await userEvent.type(form.amount(), "250000");
    await userEvent.type(form.reason(), "ok");
    expect(
      screen.getByText("Add 250,000 credits to x@example.com"),
    ).toBeInTheDocument();
    await userEvent.click(form.submit("Add credits"));

    await waitFor(() =>
      expect(adminCredits.adjust).toHaveBeenCalledWith("user-1", {
        action: "add",
        amount: 250000,
        reason: "ok",
      }),
    );
    await waitFor(() =>
      expect(form.amount()).toHaveAccessibleDescription(
        "Input should be less than or equal to 100000",
      ),
    );
    expect(form.amount()).toHaveAttribute("aria-invalid", "true");
    expect(form.amount()).toHaveValue("250000");
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("without limits, still asks for an amount and a reason before it sends", async () => {
    const form = await openForm({}, null);
    await userEvent.click(form.submit("Add credits"));

    await waitFor(() =>
      expect(form.amount()).toHaveAccessibleDescription(
        "Enter how many credits",
      ),
    );
    expect(form.reason()).toHaveAccessibleDescription("Give a reason");
    expect(adminCredits.adjust).not.toHaveBeenCalled();
  });
});

describe("the Credits dialog's submit button", () => {
  it("is disabled with its spinner from the click until an add's request ends", async () => {
    const sent = pending();
    adminCredits.adjust.mockReturnValue(sent.promise);
    const form = await openForm();
    await userEvent.type(form.amount(), "200");
    await userEvent.type(form.reason(), REASON);
    expect(form.submit("Add credits")).toBeEnabled();
    expect(spinner(form.submit("Add credits"))).toBeNull();

    await userEvent.click(form.submit("Add credits"));
    expect(form.submit("Add credits")).toBeDisabled();
    expect(spinner(form.submit("Add credits"))).not.toBeNull();
    await waitFor(() => expect(adminCredits.adjust).toHaveBeenCalledTimes(1));

    // Under way: another click sends nothing more.
    await userEvent.click(form.submit("Add credits"));
    expect(form.submit("Add credits")).toBeDisabled();
    expect(adminCredits.adjust).toHaveBeenCalledTimes(1);

    sent.settle(answer());
    await waitFor(() => expect(form.submit("Add credits")).toBeEnabled());
    expect(spinner(form.submit("Add credits"))).toBeNull();
    expect(adminCredits.adjust).toHaveBeenCalledTimes(1);
  });

  it("is disabled with its spinner while a deduct's question is open, and on until the request ends", async () => {
    const sent = pending();
    adminCredits.adjust.mockReturnValue(sent.promise);
    const form = await openForm();
    await form.choose(/^Deduct/);
    await userEvent.type(form.amount(), "50");
    await userEvent.type(form.reason(), REASON);
    await userEvent.click(form.submit("Deduct credits"));

    // The question is open: nothing is sent yet, and the form already waits for its answer.
    const question = await screen.findByRole("alertdialog", {
      name: "Deduct 50 credits from x@example.com?",
    });
    expect(adminCredits.adjust).not.toHaveBeenCalled();
    expect(form.submit("Deduct credits")).toBeDisabled();
    expect(spinner(form.submit("Deduct credits"))).not.toBeNull();

    await userEvent.click(
      within(question).getByRole("button", { name: "Deduct credits" }),
    );
    await waitFor(() => expect(adminCredits.adjust).toHaveBeenCalledTimes(1));
    expect(form.submit("Deduct credits")).toBeDisabled();
    expect(spinner(form.submit("Deduct credits"))).not.toBeNull();

    sent.settle(
      answer({
        action: "deduct",
        requested_amount: 50,
        amount: 50,
        balance_after: 470,
        grant_id: null,
      }),
    );
    // Sent: the form is empty again, back on its first action.
    await waitFor(() => expect(form.submit("Add credits")).toBeEnabled());
    expect(spinner(form.submit("Add credits"))).toBeNull();
  });

  it("takes Escape on the question as keeping the credits: nothing is sent and the form waits no longer", async () => {
    const form = await openForm();
    await form.choose(/^Deduct/);
    await userEvent.type(form.amount(), "50");
    await userEvent.type(form.reason(), REASON);
    await userEvent.click(form.submit("Deduct credits"));
    await screen.findByRole("alertdialog", {
      name: "Deduct 50 credits from x@example.com?",
    });
    expect(form.submit("Deduct credits")).toBeDisabled();

    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(form.submit("Deduct credits")).toBeEnabled());
    expect(spinner(form.submit("Deduct credits"))).toBeNull();
    // Only the question went: the dialog is still there, with what was typed.
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(form.amount()).toHaveValue("50");
    expect(adminCredits.adjust).not.toHaveBeenCalled();
    expect(form.onClose).not.toHaveBeenCalled();
  });
});

describe("closing the Credits dialog", () => {
  it("asks before Escape drops what was typed, keeps it on Keep editing, and closes on Discard change", async () => {
    const form = await openForm();
    await userEvent.type(form.amount(), "50");

    await userEvent.keyboard("{Escape}");
    const question = await screen.findByRole("alertdialog", {
      name: "Discard this change?",
    });
    expect(question).toHaveAccessibleDescription(
      "What you've entered hasn't been sent.",
    );
    expect(form.onClose).not.toHaveBeenCalled();
    await userEvent.click(
      within(question).getByRole("button", { name: "Keep editing" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(form.amount()).toHaveValue("50");
    expect(form.onClose).not.toHaveBeenCalled();

    await userEvent.keyboard("{Escape}");
    await userEvent.click(
      await screen.findByRole("button", { name: "Discard change" }),
    );
    await waitFor(() => expect(creditsDialog()).not.toBeInTheDocument());
    expect(form.onClose).toHaveBeenCalledTimes(1);
    expect(adminCredits.adjust).not.toHaveBeenCalled();
  });

  it("asks the same of the close button and of a click outside", async () => {
    const form = await openForm();
    await userEvent.type(form.reason(), "Goodwill");

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    const question = await screen.findByRole("alertdialog", {
      name: "Discard this change?",
    });
    await userEvent.click(
      within(question).getByRole("button", { name: "Keep editing" }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(form.reason()).toHaveValue("Goodwill");

    await userEvent.click(
      document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement,
    );
    expect(
      await screen.findByRole("alertdialog", { name: "Discard this change?" }),
    ).toBeInTheDocument();
    expect(creditsDialog()).toBeInTheDocument();
    expect(form.onClose).not.toHaveBeenCalled();
  });

  it("closes at once when nothing was entered", async () => {
    const form = await openForm();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(creditsDialog()).not.toBeInTheDocument());
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(form.onClose).toHaveBeenCalledTimes(1);
  });

  it("closes without asking after a successful add", async () => {
    adminCredits.adjust.mockResolvedValue(answer());
    const form = await openForm();
    await userEvent.type(form.amount(), "200");
    await userEvent.type(form.reason(), REASON);
    await userEvent.click(form.submit("Add credits"));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    await waitFor(() => expect(form.submit("Add credits")).toBeEnabled());
    // The change is sent and the form is empty: nothing is left to discard.
    expect(form.amount()).toHaveValue("");
    expect(creditsDialog()).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(creditsDialog()).not.toBeInTheDocument());
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(form.onClose).toHaveBeenCalledTimes(1);
  });

  it("ignores the close while the request is under way", async () => {
    const sent = pending();
    adminCredits.adjust.mockReturnValue(sent.promise);
    const form = await openForm();
    await userEvent.type(form.amount(), "200");
    await userEvent.type(form.reason(), REASON);
    await userEvent.click(form.submit("Add credits"));
    await waitFor(() => expect(adminCredits.adjust).toHaveBeenCalled());

    // The request is out and can't be taken back: neither Escape nor the close button closes the
    // dialog, and neither offers to discard.
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(creditsDialog()).toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(form.onClose).not.toHaveBeenCalled();

    sent.settle(answer());
    await waitFor(() => expect(form.submit("Add credits")).toBeEnabled());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(creditsDialog()).not.toBeInTheDocument());
    expect(form.onClose).toHaveBeenCalledTimes(1);
  });

  it("can still be closed when the credits don't load again after a change", async () => {
    adminCredits.adjust.mockResolvedValue(answer());
    const form = await openForm();
    // The change goes through, then reading the credits again fails: the form gives way to that.
    adminCredits.get.mockRejectedValue(new Error("Service unavailable"));
    await userEvent.type(form.amount(), "200");
    await userEvent.type(form.reason(), REASON);
    await userEvent.click(form.submit("Add credits"));
    expect(
      await screen.findByText("The credits didn't load"),
    ).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalled();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(creditsDialog()).not.toBeInTheDocument());
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(form.onClose).toHaveBeenCalledTimes(1);
  });

  it("isn't left waiting on a form that a failed read took away while its request was out", async () => {
    const sent = pending();
    adminCredits.adjust.mockReturnValue(sent.promise);
    const form = await openForm();
    await userEvent.type(form.amount(), "200");
    await userEvent.type(form.reason(), REASON);
    await userEvent.click(form.submit("Add credits"));
    await waitFor(() => expect(adminCredits.adjust).toHaveBeenCalled());

    // The credits are read again meanwhile (the window came back into view) and that read fails:
    // the form, still submitting, gives way to "didn't load" and can report nothing more.
    adminCredits.get.mockRejectedValue(new Error("Service unavailable"));
    await act(async () => {
      await form.client.invalidateQueries();
    });
    expect(
      await screen.findByText("The credits didn't load"),
    ).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(creditsDialog()).not.toBeInTheDocument());
    expect(form.onClose).toHaveBeenCalledTimes(1);

    // The change itself still lands, and is still told.
    await act(async () => {
      sent.settle(answer());
      await sent.promise;
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("starts with nothing unsaved when the page opens another user's credits", async () => {
    adminCredits.get.mockResolvedValue(credits());
    const onOpenChange = jest.fn();
    const client = queryClient();
    const other: User = { ...USER, id: "user-2", email: "y@example.com" };
    const page = (user: User) => (
      <QueryClientProvider client={client}>
        <UserCreditsDialog open onOpenChange={onOpenChange} user={user} />
      </QueryClientProvider>
    );
    const amount = () => screen.getByRole("textbox", { name: /Amount/ });
    const { rerender } = render(page(USER));
    await screen.findByRole("heading", { name: "Change the credits" });
    rerender(page(other));
    await screen.findByRole("heading", { name: "Change the credits" });
    expect(adminCredits.get).toHaveBeenLastCalledWith("user-2");
    await userEvent.type(amount(), "50");

    // Back to the first user, whose credits are already read: no loading state comes between,
    // and what was typed for the other user must not carry over.
    rerender(page(USER));
    expect(
      screen.getByRole("dialog", { name: "Credits" }),
    ).toHaveAccessibleDescription(/x@example\.com/);
    expect(amount()).toHaveValue("");

    // Nothing was entered for this user, so the page is told to close at once: with `false`.
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledTimes(1));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
