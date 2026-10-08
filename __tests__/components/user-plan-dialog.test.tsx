/**
 * The admin's Plan dialog (FB2.29): a user's plan now, the plans, periods and ways of billing the
 * backend offers for them with its own reasons on the ones it refuses, the line that says what
 * will happen, a question before a change that charges now or downgrades, the backend's refusals
 * beside their fields, a trial's later end within the backend's limits, and a close that asks
 * before it drops what was entered. The dialog holds no plan, price, credit amount or limit.
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
import { useState } from "react";
import { UserPlanDialog } from "@/components/admin/users/user-plan-dialog";
import type { AdminUserPlan } from "@/lib/api-client/admin-plan";
import { ApiError } from "@/lib/api-client/core";
import type { User } from "@/lib/api-client/users";
import {
  adminPlan,
  adminTrialPlan,
  adminUnbilledPlan,
  CURRENT_REASON,
  PERIOD_REASON,
  TRIAL_REASON,
} from "../fixtures/admin-plan";

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    adminPlan: { get: jest.fn(), change: jest.fn(), extendTrial: jest.fn() },
  },
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const api = jest.requireMock("@/lib/api-client").apiClient.adminPlan as {
  get: jest.Mock;
  change: jest.Mock;
  extendTrial: jest.Mock;
};
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
const REASON = "Asked by phone";

/** What POST /admin/users/{id}/plan answers. */
const changed = (fields: Record<string, unknown> = {}) => ({
  subscription_id: "sub-1",
  old_plan: { id: "plan-growth", name: "growth", display_name: "Growth" },
  new_plan: { id: "plan-scale", name: "scale", display_name: "Scale" },
  old_billing_period: "monthly",
  new_billing_period: "monthly",
  billing: "next_renewal",
  monthly_credits_before: 320,
  monthly_credits_after: 1320,
  renews_at: "2026-11-01T12:00:00Z",
  audit_id: "audit-1",
  ...fields,
});

/** A refusal as the backend sends one: its message, and the fields it is about. */
const refusal = (
  message: string,
  details: { field: string; message: string }[] = [],
) => new ApiError(422, message, "VALIDATION_ERROR", details);

/** An answer that waits to be given, to look at the dialog while the request is under way. */
function pending() {
  let settle: (value: unknown) => void = () => {};
  const promise = new Promise((resolve) => {
    settle = resolve;
  });
  return { promise, settle };
}

/** The page's part: it holds whose plan is open and, told to close, lets go of the user. */
function Page({ onClose }: { onClose: () => void }) {
  const [user, setUser] = useState<User | null>(USER);
  return (
    <UserPlanDialog
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
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <Page onClose={onClose} />
    </QueryClientProvider>,
  );
  return { onClose, client };
}

const group = (name: string) => screen.getByRole("radiogroup", { name });
const radio = (list: string, name: RegExp) =>
  within(group(list)).getByRole("radio", { name });
const pick = (list: string, name: RegExp) => userEvent.click(radio(list, name));
const reason = () => screen.getByRole("textbox", { name: /Reason/ });
/** The form's own submit button, also while a question lies over the form. */
const submit = (name: string) =>
  screen
    .getAllByRole("button", { name, hidden: true })
    .find((button) => button.getAttribute("type") === "submit") as HTMLElement;

/** The dialog with the Growth customer's plan loaded and its form shown. */
async function openChange(plan: AdminUserPlan = adminPlan()) {
  api.get.mockResolvedValue(plan);
  const rendered = renderDialog();
  await screen.findByRole("heading", { name: "Change the plan" });
  return rendered;
}

/** The dialog with a trial user's plan loaded and the extension form shown. */
async function openTrial(plan: AdminUserPlan = adminTrialPlan()) {
  api.get.mockResolvedValue(plan);
  const rendered = renderDialog();
  await screen.findByRole("heading", { name: "Extend the trial" });
  return {
    ...rendered,
    day: () => screen.getByLabelText(/New end date/) as HTMLInputElement,
  };
}

beforeEach(() => {
  api.get.mockReset();
  api.change.mockReset();
  api.extendTrial.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

describe("the Plan dialog's summary", () => {
  it("shows whose plan it is, the plan with its period, the renewal, the credits and who bills it", async () => {
    await openChange();
    const dialog = screen.getByRole("dialog", { name: "Plan" });
    expect(dialog).toHaveAccessibleDescription(
      /Xavier Young \(x@example\.com\)/,
    );

    const value = (label: string) =>
      within(dialog).getByText(label, { selector: "dt" }).nextElementSibling;
    expect(value("Plan")).toHaveTextContent("Growth, monthly");
    expect(value("Status")).toHaveTextContent("Active");
    expect(value("Renews")).toHaveTextContent("Nov 1, 2026");
    expect(value("Monthly credits")).toHaveTextContent("320 of 500 left");
    expect(value("Billing")).toHaveTextContent("Through Lemon Squeezy");
    expect(api.get).toHaveBeenCalledWith("user-1");
  });

  it("says so when the plan doesn't load, with a way to try again", async () => {
    api.get.mockRejectedValue(new Error("Service unavailable"));
    renderDialog();

    expect(await screen.findByText("The plan didn't load")).toBeInTheDocument();
    expect(screen.getByText("Service unavailable")).toBeInTheDocument();

    api.get.mockResolvedValue(adminPlan());
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("heading", { name: "Change the plan" }),
    ).toBeInTheDocument();
  });

  it("shows the backend's reason and no form for a user whose plan can't be changed", async () => {
    api.get.mockResolvedValue(
      adminPlan({
        change: {
          allowed: false,
          refused_reason: "A Super Admin's plan can't be changed.",
          default_billing: null,
        },
      }),
    );
    renderDialog();

    expect(
      await screen.findByText("The plan can't be changed"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A Super Admin's plan can't be changed."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Change the plan" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Extend the trial" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Change plan" })).toBeNull();
  });

  it("says there is nothing to change for a user with no plan", async () => {
    api.get.mockResolvedValue(
      adminPlan({
        subscription: null,
        change: { allowed: false, refused_reason: null, default_billing: null },
      }),
    );
    renderDialog();

    expect(await screen.findByText("Nothing to change")).toBeInTheDocument();
    expect(
      screen.getByText("This user has no plan that grants access."),
    ).toBeInTheDocument();
    expect(screen.getByText("No plan")).toBeInTheDocument();
  });
});

describe("choosing a plan", () => {
  it("lists the backend's plans with their credits and the prices this user can take, and its reason on the one that can't be chosen", async () => {
    await openChange();

    expect(radio("New plan", /Starter/)).toBeEnabled();
    expect(
      screen.getByText("$29.00 a month · 150 credits a month"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("$199.00 a month · 1,500 credits a month"),
    ).toBeInTheDocument();
    expect(radio("New plan", /Growth/)).toBeDisabled();
    expect(screen.getByText(CURRENT_REASON)).toBeInTheDocument();
    expect(screen.queryByText(PERIOD_REASON)).not.toBeInTheDocument();
  });

  it("asks nothing about the period or the billing before a plan is picked", async () => {
    await openChange();

    expect(
      screen.queryByRole("radiogroup", { name: "Billing period" }),
    ).toBeNull();
    expect(screen.queryByRole("radiogroup", { name: "Billing" })).toBeNull();
    expect(
      screen.getByText("Choose a plan above to see what will happen."),
    ).toBeInTheDocument();
  });

  it("starts a picked plan on the user's own period and the backend's default billing, and says what will happen", async () => {
    await openChange();
    await pick("New plan", /Scale/);

    expect(radio("Billing period", /Monthly/)).toBeChecked();
    expect(screen.getByText("$199.00 a month · Upgrade")).toBeInTheDocument();
    // A subscription Lemon Squeezy bills keeps its period: the other one is listed with the
    // backend's reason, and can't be picked.
    expect(radio("Billing period", /Yearly/)).toBeDisabled();
    expect(screen.getByText(PERIOD_REASON)).toBeInTheDocument();
    expect(radio("Billing", /New price from the next renewal/)).toBeChecked();
    expect(radio("Billing", /Charge the difference now/)).not.toBeChecked();
    expect(
      screen.getByText(
        "Move x@example.com to Scale, monthly, now. The month's credits become 1,320 (320 now). Nothing is charged now. The new price applies from Nov 1, 2026.",
      ),
    ).toBeInTheDocument();
  });

  it("offers a downgrade only the billing the backend offers for it", async () => {
    await openChange();
    await pick("New plan", /Starter/);

    expect(screen.getByText("$29.00 a month · Downgrade")).toBeInTheDocument();
    expect(within(group("Billing")).getAllByRole("radio")).toHaveLength(1);
    expect(radio("Billing", /New price from the next renewal/)).toBeChecked();
    expect(
      screen.getByText(/The month's credits become 0 \(320 now\)\./),
    ).toBeInTheDocument();
  });

  it("never keeps a billing the newly picked plan doesn't offer", async () => {
    await openChange();
    await pick("New plan", /Scale/);
    await pick("Billing", /Charge the difference now/);
    expect(
      screen.getByText(/Lemon Squeezy invoices the prorated difference now\./, {
        selector: "p",
      }),
    ).toBeInTheDocument();

    await pick("New plan", /Starter/);
    expect(radio("Billing", /New price from the next renewal/)).toBeChecked();
    expect(
      screen.queryByText(/prorated difference/, { selector: "p" }),
    ).not.toBeInTheDocument();
  });

  it("shows a user nobody bills the one way there is, and lets them change period", async () => {
    await openChange(adminUnbilledPlan());
    await pick("New plan", /Scale/);

    expect(
      screen.getByText(
        "$199.00 a month or $1,990.00 a year · 1,500 credits a month",
      ),
    ).toBeInTheDocument();
    expect(within(group("Billing")).getAllByRole("radio")).toHaveLength(1);
    expect(radio("Billing", /Not billed/)).toBeChecked();
    await pick("Billing period", /Yearly/);
    expect(radio("Billing", /Not billed/)).toBeChecked();
    expect(
      screen.getByText(
        "Move x@example.com to Scale, yearly, now. The month's credits become 1,320 (320 now). This user isn't billed through Lemon Squeezy, so nothing is charged.",
      ),
    ).toBeInTheDocument();
  });
});

describe("sending a plan change", () => {
  it("sends an upgrade billed from the next renewal at once, then says what was done", async () => {
    api.change.mockResolvedValue(changed());
    await openChange();
    await pick("New plan", /Scale/);
    await userEvent.type(reason(), REASON);
    await userEvent.click(submit("Change plan"));

    await waitFor(() =>
      expect(api.change).toHaveBeenCalledWith("user-1", {
        plan_id: "plan-scale",
        billing_period: "monthly",
        billing: "next_renewal",
        reason: REASON,
      }),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "x@example.com moved to Scale, monthly",
        {
          description:
            "The month's credits are now 1,320 (320 before). The new price applies from Nov 1, 2026.",
        },
      ),
    );
    // The plan is read again, and the form starts over with nothing picked.
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(reason()).toHaveValue(""));
  });

  it("asks before a change that charges the customer now, and sends it on a yes", async () => {
    api.change.mockResolvedValue(changed({ billing: "charge_now" }));
    await openChange();
    await pick("New plan", /Scale/);
    await pick("Billing", /Charge the difference now/);
    await userEvent.type(reason(), REASON);
    await userEvent.click(submit("Change plan"));

    const question = await screen.findByRole("alertdialog", {
      name: "Move x@example.com to Scale, monthly?",
    });
    expect(question).toHaveTextContent(
      "Lemon Squeezy charges the customer the prorated difference now.",
    );
    expect(api.change).not.toHaveBeenCalled();

    await userEvent.click(
      within(question).getByRole("button", { name: "Change plan" }),
    );
    await waitFor(() =>
      expect(api.change).toHaveBeenCalledWith("user-1", {
        plan_id: "plan-scale",
        billing_period: "monthly",
        billing: "charge_now",
        reason: REASON,
      }),
    );
  });

  it("asks before a downgrade, and sends nothing on a no", async () => {
    await openChange();
    await pick("New plan", /Starter/);
    await userEvent.type(reason(), REASON);
    await userEvent.click(submit("Change plan"));

    const question = await screen.findByRole("alertdialog", {
      name: "Move x@example.com to Starter, monthly?",
    });
    expect(question).toHaveTextContent(
      "The customer moves to a smaller plan now, and nothing is credited for the rest of the period already paid.",
    );
    await userEvent.click(
      within(question).getByRole("button", { name: "Keep the current plan" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(api.change).not.toHaveBeenCalled();
    // What was entered is still there.
    expect(reason()).toHaveValue(REASON);
    expect(radio("New plan", /Starter/)).toBeChecked();
  });

  it("sends nothing without a plan or a reason, and says which is missing", async () => {
    await openChange();
    await userEvent.click(submit("Change plan"));

    expect(await screen.findByText("Choose a plan")).toBeInTheDocument();
    expect(
      screen.getByText("Give a reason of at least 3 characters"),
    ).toBeInTheDocument();
    expect(group("New plan")).toHaveAttribute("aria-invalid", "true");
    // Focus goes to the first thing that is missing: the plan's choices.
    expect(group("New plan")).toContainElement(
      document.activeElement as HTMLElement,
    );
    expect(api.change).not.toHaveBeenCalled();
  });

  it("puts the backend's refusal beside the field it names", async () => {
    api.change.mockRejectedValue(
      refusal("Validation failed", [
        { field: "body -> reason", message: "The reason is too short." },
      ]),
    );
    await openChange();
    await pick("New plan", /Scale/);
    await userEvent.type(reason(), REASON);
    await userEvent.click(submit("Change plan"));

    expect(
      await screen.findByText("The reason is too short."),
    ).toBeInTheDocument();
    expect(screen.queryByText("The plan change didn't complete")).toBeNull();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("shows a refusal that names no field above the form, in the backend's words, and reads the plan again", async () => {
    api.change.mockRejectedValue(
      new ApiError(
        400,
        "Lemon Squeezy refused the change (status 502). Nothing was changed.",
      ),
    );
    await openChange();
    await pick("New plan", /Scale/);
    await userEvent.type(reason(), REASON);
    await userEvent.click(submit("Change plan"));

    expect(
      await screen.findByText("The plan change didn't complete"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Lemon Squeezy refused the change (status 502). Nothing was changed.",
      ),
    ).toBeInTheDocument();
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    // Nothing entered is lost.
    expect(reason()).toHaveValue(REASON);
    expect(radio("New plan", /Scale/)).toBeChecked();
  });
});

describe("a refusal that says the plan did change", () => {
  it("claims nothing in its title, says it in the backend's words, and shows the plan as it is now", async () => {
    const said =
      "Lemon Squeezy has changed the plan, but the change could not be recorded here. The plan here follows when Lemon Squeezy's update arrives; the team has been alerted.";
    api.change.mockRejectedValue(new ApiError(400, said));
    await openChange();
    await pick("New plan", /Scale/);
    await userEvent.type(reason(), REASON);
    // What the read answers after the refusal: the plan as the backend has it by then.
    const after = adminPlan();
    api.get.mockResolvedValue({
      ...after,
      subscription: after.subscription && {
        ...after.subscription,
        plan_id: "plan-scale",
        plan_display_name: "Scale",
        monthly_credits: 1320,
        credits_per_month: 1500,
      },
    });
    await userEvent.click(submit("Change plan"));

    const notice = (
      await screen.findByText("The plan change didn't complete")
    ).closest('[role="alert"]');
    expect(notice).toHaveTextContent(said);
    // Not a word of the dashboard's own about what did or didn't change.
    expect(notice).not.toHaveTextContent(/nothing was changed/i);
    expect(screen.queryByText(/wasn't changed/)).toBeNull();
    const dialog = screen.getByRole("dialog", { name: "Plan" });
    await waitFor(() =>
      expect(
        within(dialog).getByText("Plan", { selector: "dt" }).nextElementSibling,
      ).toHaveTextContent("Scale, monthly"),
    );
  });
});

describe("the reason", () => {
  it("is said to be kept with the audit entry, not shown to the customer", async () => {
    await openChange();
    expect(
      screen.getByText(
        "Kept with the audit entry. The customer doesn't see it.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Plan" }),
    ).toHaveAccessibleDescription(
      /The customer's activity shows the change, not the reason\./,
    );
    expect(screen.queryByText(/customer sees/i)).toBeNull();
  });
});

describe("closing the Plan dialog", () => {
  it("closes at once with nothing entered", async () => {
    const { onClose } = await openChange();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("asks before dropping what was entered, and keeps it on Keep editing", async () => {
    const { onClose } = await openChange();
    await pick("New plan", /Scale/);
    await userEvent.keyboard("{Escape}");

    const question = await screen.findByRole("alertdialog", {
      name: "Discard this change?",
    });
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(
      within(question).getByRole("button", { name: "Keep editing" }),
    );
    expect(radio("New plan", /Scale/)).toBeChecked();

    await userEvent.keyboard("{Escape}");
    await userEvent.click(
      within(
        await screen.findByRole("alertdialog", {
          name: "Discard this change?",
        }),
      ).getByRole("button", { name: "Discard change" }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open while a change is under way", async () => {
    const request = pending();
    api.change.mockReturnValue(request.promise);
    const { onClose } = await openChange();
    await pick("New plan", /Scale/);
    await userEvent.type(reason(), REASON);
    await userEvent.click(submit("Change plan"));
    await waitFor(() => expect(api.change).toHaveBeenCalled());

    await userEvent.keyboard("{Escape}");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    request.settle(changed());
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });
});

describe("a trial user's plan", () => {
  it("says why the plan can't be changed, and offers the extension", async () => {
    await openTrial();

    expect(screen.getByText("The plan can't be changed")).toBeInTheDocument();
    expect(screen.getByText(TRIAL_REASON)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Change the plan" }),
    ).not.toBeInTheDocument();
    const dialog = screen.getByRole("dialog", { name: "Plan" });
    expect(
      within(dialog).getByText("Trial ends", { selector: "dt" })
        .nextElementSibling,
    ).toHaveTextContent("Oct 12, 2026");
  });

  it("holds the date field to the backend's two limits, and says them", async () => {
    const { day } = await openTrial();

    expect(day()).toHaveAttribute("min", "2026-10-13");
    expect(day()).toHaveAttribute("max", "2026-11-07");
    expect(
      screen.getByText(
        "A day from Oct 13, 2026 to Nov 7, 2026. The trial ends that day at the time of day it ends now.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Choose a day above to see what will happen."),
    ).toBeInTheDocument();
  });

  it("sends the new end as an instant at the trial's own time of day, then says what was done", async () => {
    api.extendTrial.mockResolvedValue({
      subscription_id: "sub-2",
      trial_ended_at_before: "2026-10-12T12:00:00Z",
      trial_ends_at: "2026-10-26T12:00:00Z",
      audit_id: "audit-2",
    });
    const { day } = await openTrial();
    fireEvent.change(day(), { target: { value: "2026-10-26" } });
    expect(
      screen.getByText(/Extend x@example\.com's trial to Oct 26, 2026/),
    ).toBeInTheDocument();
    await userEvent.type(reason(), REASON);
    await userEvent.click(submit("Extend trial"));

    await waitFor(() =>
      expect(api.extendTrial).toHaveBeenCalledWith("user-1", {
        ends_at: "2026-10-26T12:00:00.000Z",
        reason: REASON,
      }),
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        "x@example.com's trial now ends Oct 26, 2026",
        { description: "Before, its end was Oct 12, 2026." },
      ),
    );
  });

  it("refuses a day outside the limits before anything is sent", async () => {
    const { day } = await openTrial();
    fireEvent.change(day(), { target: { value: "2026-11-08" } });
    await userEvent.type(reason(), REASON);
    await userEvent.click(submit("Extend trial"));

    expect(
      await screen.findByText("Choose a day from Oct 13, 2026 to Nov 7, 2026"),
    ).toBeInTheDocument();
    expect(api.extendTrial).not.toHaveBeenCalled();
  });

  it("puts the backend's refusal of the end beside the date field", async () => {
    api.extendTrial.mockRejectedValue(
      refusal("Validation failed", [
        { field: "body -> ends_at", message: "That end is too far away." },
      ]),
    );
    const { day } = await openTrial();
    fireEvent.change(day(), { target: { value: "2026-10-26" } });
    await userEvent.type(reason(), REASON);
    await userEvent.click(submit("Extend trial"));

    expect(
      await screen.findByText("That end is too far away."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("The trial extension didn't complete"),
    ).toBeNull();
  });

  it("says why when the trial can't be extended either", async () => {
    api.get.mockResolvedValue(
      adminTrialPlan({
        trial_extension: {
          allowed: false,
          refused_reason: "This trial was already extended as far as it goes.",
          earliest_ends_at: null,
          latest_ends_at: null,
        },
      }),
    );
    renderDialog();

    expect(
      await screen.findByText("The trial can't be extended"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This trial was already extended as far as it goes."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Extend the trial" }),
    ).not.toBeInTheDocument();
  });

  it("shows the reason when a trial that already ends too far away comes with no window at all", async () => {
    // The backend sends a refusal and leaves the two limits out.
    api.get.mockResolvedValue(
      adminTrialPlan({
        trial_extension: {
          allowed: false,
          refused_reason: "This trial already ends more than 30 days from now.",
        },
      }),
    );
    renderDialog();

    expect(
      await screen.findByText(
        "This trial already ends more than 30 days from now.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Extend the trial" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/New end/i)).not.toBeInTheDocument();
  });
});
