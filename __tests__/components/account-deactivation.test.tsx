/**
 * Closing an account: a plan that renews (or a past-due one) must be cancelled first, with the
 * person's say; a trial Lemon Squeezy doesn't bill just ends, with no subscription to cancel and
 * no box to tick (D24, rext-control#580).
 */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AccountDeactivation } from "@/components/account-settings/account-deactivation";
import { apiClient } from "@/lib/api-client";

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    profile: { get: jest.fn().mockResolvedValue({ email: "ana@example.com" }) },
    subscriptions: { getCurrentPlan: jest.fn() },
    account: { deactivate: jest.fn() },
  },
}));
jest.mock("@/lib/logout-utils", () => ({ performLogout: jest.fn() }));

const getCurrentPlan = apiClient.subscriptions.getCurrentPlan as jest.Mock;
const deactivate = apiClient.account.deactivate as jest.Mock;

function renderWithPlan(status: string, lemonsqueezyId: string | null = null) {
  getCurrentPlan.mockResolvedValue({
    subscription: { status, lemonsqueezy_subscription_id: lemonsqueezyId },
  });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AccountDeactivation />
    </QueryClientProvider>,
  );
}

describe("AccountDeactivation", () => {
  it("counts a past-due plan as one that closing the account stops", async () => {
    renderWithPlan("past_due");

    expect(
      await screen.findByText("Active subscriptions detected"),
    ).toBeInTheDocument();
  });

  it("asks nothing about a plan that is already cancelled", async () => {
    renderWithPlan("cancelled");

    await waitFor(() => expect(getCurrentPlan).toHaveBeenCalled());
    // Let the plan's answer render before looking for what it would show.
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(
      screen.queryByText("Active subscriptions detected"),
    ).not.toBeInTheDocument();
  });
});

/** Opens the dialog and fills what every closing needs. */
async function fillTheDialog() {
  fireEvent.click(
    screen.getByRole("button", { name: "Deactivate my account" }),
  );
  fireEvent.change(await screen.findByLabelText(/to confirm/), {
    target: { value: "DEACTIVATE" },
  });
  fireEvent.change(screen.getByLabelText(/Your password/), {
    target: { value: "my-password" },
  });
  fireEvent.click(
    screen.getByRole("checkbox", { name: /I understand that my account/ }),
  );
}

describe("AccountDeactivation and a trial", () => {
  beforeEach(() => {
    deactivate.mockReset();
    deactivate.mockResolvedValue({ message: "Closed." });
  });

  it("says a trial ends now, asks nothing about a subscription, and ends it", async () => {
    renderWithPlan("trial");

    expect(await screen.findByText("Your trial ends now")).toBeInTheDocument();
    expect(
      screen.queryByText("Active subscriptions detected"),
    ).not.toBeInTheDocument();

    await fillTheDialog();
    expect(
      screen.queryByRole("checkbox", { name: /Cancel my/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Deactivate account" }));

    await waitFor(() => expect(deactivate).toHaveBeenCalledTimes(1));
    expect(deactivate.mock.calls[0][0]).toMatchObject({
      confirm: true,
      cancel_subscriptions: true,
    });
  });

  it("still asks to cancel a paid plan first", async () => {
    renderWithPlan("active", "ls-sub-1");

    expect(
      await screen.findByText("Active subscriptions detected"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Your trial ends now")).not.toBeInTheDocument();

    await fillTheDialog();
    fireEvent.click(screen.getByRole("button", { name: "Deactivate account" }));
    // Not without the cancellation ticked.
    expect(
      await screen.findByText(
        "You must confirm subscription cancellation before deactivation",
      ),
    ).toBeInTheDocument();
    expect(deactivate).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("checkbox", { name: /Cancel my 1 active subscription/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Deactivate account" }));
    await waitFor(() => expect(deactivate).toHaveBeenCalledTimes(1));
    expect(deactivate.mock.calls[0][0]).toMatchObject({
      cancel_subscriptions: true,
    });
  });

  it("treats a trial that Lemon Squeezy bills as a paid plan", async () => {
    renderWithPlan("trial", "ls-sub-2");

    expect(
      await screen.findByText("Active subscriptions detected"),
    ).toBeInTheDocument();
  });
});
