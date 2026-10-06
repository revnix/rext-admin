import { act, render, screen, waitFor } from "@testing-library/react";
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

function renderWithPlan(status: string) {
  getCurrentPlan.mockResolvedValue({ subscription: { status } });
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
