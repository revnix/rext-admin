/**
 * The dialog an in-page purchase ends on (F7a) names the plan and the new balance, read from the
 * backend, and its buttons say what they do: "Close", never "Cancel".
 */

import { render, screen } from "@testing-library/react";
import { PurchaseCompleteDialog } from "@/components/subscription/purchase-complete-dialog";
import type { CreditBalance } from "@/types/subscription";

const balance = (overrides: Partial<CreditBalance> = {}): CreditBalance => ({
  current_credits: 400,
  monthly_credits: 400,
  credits_per_month: 400,
  credits_reset_date: null,
  articles_remaining: 26,
  plan_name: "Starter",
  bonus: null,
  ...overrides,
});

const dialog = (props: Partial<Parameters<typeof PurchaseCompleteDialog>[0]>) =>
  render(
    <PurchaseCompleteDialog
      open
      status="active"
      planName="Starter"
      credits={balance()}
      onClose={() => {}}
      onGoToDashboard={() => {}}
      {...props}
    />,
  );

describe("PurchaseCompleteDialog", () => {
  it("names the plan and the new balance once the purchase shows", () => {
    dialog({});
    expect(screen.getByRole("heading")).toHaveTextContent("You're on Starter");
    expect(
      screen.getByText("Your balance is 400 of 400 credits."),
    ).toBeInTheDocument();
  });

  it("adds an unexpired bonus to the balance line", () => {
    dialog({
      credits: balance({
        current_credits: 1400,
        bonus: {
          label: "Launch bonus",
          promotion: "launch-2026-10",
          credits: 1000,
          granted: 1000,
          expires_at: null,
        } as CreditBalance["bonus"],
      }),
    });
    expect(
      screen.getByText(
        "Your balance is 400 of 400 credits. Plus 1,000 launch bonus credits.",
      ),
    ).toBeInTheDocument();
  });

  it("says the balance is loading, then where it shows if it didn't load", () => {
    const { rerender } = dialog({ credits: null });
    expect(screen.getByText("Loading your balance…")).toBeInTheDocument();
    rerender(
      <PurchaseCompleteDialog
        open
        status="active"
        planName="Starter"
        credits={null}
        creditsFailed
        onClose={() => {}}
        onGoToDashboard={() => {}}
      />,
    );
    expect(
      screen.getByText(
        "Your balance didn't load; the header shows it in a moment.",
      ),
    ).toBeInTheDocument();
  });

  it("closes with a button that reads as closing, not cancelling", () => {
    dialog({});
    // The footer's "Close" (the dialog's corner icon carries the same name for assistive tech).
    const close = screen
      .getAllByRole("button", { name: "Close" })
      .filter((button) => button.getAttribute("data-slot") === "button");
    expect(close).toHaveLength(1);
    expect(
      screen.getByRole("button", { name: "Go to dashboard" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the waiting and the unconfirmed words while the purchase doesn't show", () => {
    const { rerender } = dialog({
      status: "confirming",
      planName: null,
      credits: null,
    });
    expect(screen.getByRole("heading")).toHaveTextContent(
      "Confirming your subscription",
    );
    rerender(
      <PurchaseCompleteDialog
        open
        status="unconfirmed"
        planName={null}
        credits={null}
        onClose={() => {}}
        onGoToDashboard={() => {}}
      />,
    );
    expect(screen.getByRole("heading")).toHaveTextContent("Payment received");
  });
});
