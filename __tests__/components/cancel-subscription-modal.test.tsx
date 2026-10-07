/**
 * The cancel dialog states the refund rule (F19): the founder's rule, in the refund dialog's
 * words and the plan catalogue's numbers, never "No refunds for the current billing period".
 */

import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CancelSubscriptionModal } from "@/components/subscription/cancel-subscription-modal";
import { apiClient } from "@/lib/api-client";

jest.mock("@/lib/api-client", () => ({
  apiClient: { subscriptions: { getCatalog: jest.fn() } },
}));

const renderDialog = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <CancelSubscriptionModal
        open
        onOpenChange={() => {}}
        currentPeriodEnd="2026-10-31T00:00:00Z"
      />
    </QueryClientProvider>,
  );

describe("CancelSubscriptionModal", () => {
  it("says a payment can be refunded in full, in the catalogue's numbers, from Invoices", async () => {
    jest.mocked(apiClient.subscriptions.getCatalog).mockResolvedValue({
      refund: { window_days: 14, credit_limit: 100 },
    } as never);

    renderDialog();

    expect(
      await screen.findByText(
        /Within 14 days of a payment, the whole payment comes back if fewer than 100 credits were used since it\./,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Invoices" })).toHaveAttribute(
      "href",
      "/settings/invoices",
    );
    expect(screen.queryByText(/No refunds/)).not.toBeInTheDocument();
  });

  it("points to the refund policy when the backend sends no rule", async () => {
    jest
      .mocked(apiClient.subscriptions.getCatalog)
      .mockResolvedValue({} as never);

    renderDialog();

    expect(
      await screen.findByRole("link", { name: "refund policy" }),
    ).toHaveAttribute("href", "/legal/refund-policy");
    expect(screen.queryByText(/No refunds/)).not.toBeInTheDocument();
  });
});
