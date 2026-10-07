/**
 * Settings, Usage (task 784): a balance above the plan's allowance (credits an admin added) stands
 * alone with a full bar, never "157 of 60"; a launch buyer's plan credits read against the
 * allowance with the bonus named beside them.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { UsageSection } from "@/components/billing/usage-section";
import { subscriptionQueries } from "@/lib/query-keys";
import type { CreditBalance } from "@/types/subscription";

function renderUsage(credits: Partial<CreditBalance>) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Number.POSITIVE_INFINITY, retry: false },
    },
  });
  client.setQueryData(subscriptionQueries.myCredits().queryKey, {
    credits_reset_date: null,
    plan_name: "Growth",
    bonus: null,
    ...credits,
  } as never);
  client.setQueryData(subscriptionQueries.usage().queryKey, {
    workspaces: { used: 1, limit: 3, unlimited: false },
    members: { limit: 5, unlimited: false },
  } as never);
  client.setQueryData(subscriptionQueries.catalog().queryKey, {
    credits: { per_article: 15 },
  } as never);
  client.setQueryData(subscriptionQueries.current().queryKey, {
    subscription: null,
  } as never);
  render(
    <QueryClientProvider client={client}>
      <UsageSection />
    </QueryClientProvider>,
  );
}

it("reads N of M credits left under the allowance", () => {
  renderUsage({
    current_credits: 412,
    monthly_credits: 412,
    credits_per_month: 1000,
    articles_remaining: 27,
  });
  expect(screen.getByText("412")).toBeInTheDocument();
  expect(screen.getByText(/of 1,000 credits left/)).toBeInTheDocument();
  expect(
    screen.getByRole("meter", { name: "Credits left this period" }),
  ).toHaveAttribute("aria-valuenow", "412");
});

it("lets a balance above the allowance stand alone, with the bar full and no warning", () => {
  renderUsage({
    current_credits: 157,
    monthly_credits: 157,
    credits_per_month: 60,
    articles_remaining: 10,
  });
  expect(screen.getByText("157")).toBeInTheDocument();
  expect(screen.getByText("credits left")).toBeInTheDocument();
  expect(screen.queryByText(/of 60/)).not.toBeInTheDocument();
  const meter = screen.getByRole("meter", { name: "Credits left this period" });
  expect(meter).toHaveAttribute("aria-valuenow", "60");
  expect(meter).toHaveAttribute("aria-valuemax", "60");
  expect(screen.queryByText(/credits are used/)).not.toBeInTheDocument();
});

it("shows a launch buyer the plan's credits against the allowance, and the bonus beside them", () => {
  renderUsage({
    current_credits: 2000,
    monthly_credits: 1000,
    credits_per_month: 1000,
    articles_remaining: 133,
    bonus: {
      label: "Launch bonus",
      promotion: "launch",
      credits: 1000,
      granted: 1000,
      expires_at: "2026-10-14T06:59:00Z",
    },
  });
  expect(screen.getByText("1,000")).toBeInTheDocument();
  expect(screen.getByText(/of 1,000 credits left/)).toBeInTheDocument();
  expect(
    screen.getByText(/Plus 1,000 launch bonus credits, until Oct 14, 2026\./),
  ).toBeInTheDocument();
});
