/**
 * Home's Credits card (F5a.1 #479): an account with nothing that grants access has no plan, which is
 * not the unlimited plan's "no monthly limit".
 */
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { creditsPlan } from "@/components/billing/billing-format";
import { CreditsCard } from "@/components/home/credits-card";
import { subscriptionQueries } from "@/lib/query-keys";
import type { CreditBalance } from "@/types/subscription";

jest.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => ({ user: { id: "me" } }),
}));

const WORKSPACE = "w1";

/** The backend's answer when nothing grants access (subscription_routes.py, the credits route). */
const noPlan = (owner: string): CreditBalance =>
  ({
    current_credits: 0,
    monthly_credits: 0,
    bonus: null,
    credits_per_month: null,
    credits_reset_date: null,
    articles_remaining: 0,
    plan_name: null,
    target_user_id: owner,
  }) as unknown as CreditBalance;

const unlimited: CreditBalance = {
  ...noPlan("me"),
  current_credits: 120,
  monthly_credits: 120,
  articles_remaining: null,
  plan_name: "Agency",
} as unknown as CreditBalance;

function renderCard(credits: CreditBalance) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Number.POSITIVE_INFINITY, retry: false },
    },
  });
  client.setQueryData(
    subscriptionQueries.workspaceCredits(WORKSPACE).queryKey,
    credits,
  );
  client.setQueryData(subscriptionQueries.current().queryKey, {
    subscription: null,
  } as never);
  client.setQueryData(subscriptionQueries.catalog().queryKey, {
    credits: { per_article: 15 },
  } as never);
  render(
    <QueryClientProvider client={client}>
      <CreditsCard workspaceId={WORKSPACE} />
    </QueryClientProvider>,
  );
}

describe("creditsPlan", () => {
  it("tells no plan from the unlimited plan and from an allowance", () => {
    expect(creditsPlan(noPlan("me"))).toBe("none");
    expect(creditsPlan(unlimited)).toBe("unlimited");
    expect(
      creditsPlan({ credits_per_month: 400, articles_remaining: 26 }),
    ).toBe("metered");
  });
});

describe("Home's Credits card", () => {
  it("says a lapsed account has no plan, with Choose a plan", () => {
    renderCard(noPlan("me"));
    expect(
      screen.getByText(/No plan: choose one to keep writing\./),
    ).toBeInTheDocument();
    expect(screen.queryByText(/No monthly limit/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Choose a plan" })).toHaveAttribute(
      "href",
      "/pricing",
    );
  });

  it("says a workspace owner's lapse is the owner's, with nothing to buy here", () => {
    renderCard(noPlan("owner"));
    expect(
      screen.getByText(
        /The workspace's owner has no plan, so it can't write\./,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("still says the unlimited plan has no monthly limit", () => {
    renderCard(unlimited);
    expect(screen.getByText(/No monthly limit\./)).toBeInTheDocument();
    expect(screen.queryByText(/No plan/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Plan and billing" }),
    ).toBeInTheDocument();
  });

  it("reads N of M under the allowance, and the balance alone above it (task 784)", () => {
    const growth = {
      ...noPlan("me"),
      current_credits: 412,
      monthly_credits: 412,
      credits_per_month: 1000,
      articles_remaining: 27,
      plan_name: "Growth",
    } as unknown as CreditBalance;
    renderCard(growth);
    expect(screen.getByText("412")).toBeInTheDocument();
    expect(screen.getByText(/of 1,000/)).toBeInTheDocument();
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuenow", "412");
  });

  it("never writes a balance above its allowance as N of M: the balance alone, the bar full", () => {
    // 150 credits added to a trial of 60.
    const granted = {
      ...noPlan("me"),
      current_credits: 157,
      monthly_credits: 157,
      credits_per_month: 60,
      articles_remaining: 10,
      plan_name: "Trial",
    } as unknown as CreditBalance;
    renderCard(granted);
    expect(screen.getByText("157")).toBeInTheDocument();
    expect(screen.queryByText(/of 60/)).not.toBeInTheDocument();
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "60");
    expect(meter).toHaveAttribute("aria-valuemax", "60");
  });
});
