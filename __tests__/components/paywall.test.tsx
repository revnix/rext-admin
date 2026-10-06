/**
 * The paywall (F4): the trial's end or a balance that can't start an article, in the backend's
 * numbers. The home's first card says so and leads to the plans; the dialog a billed action opens
 * shows why and the plan grid inline. A member of someone else's workspace is told to ask its owner.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PaywallDialog } from "@/components/billing/paywall-dialog";
import {
  paywallBalanceWords,
  paywallState,
  paywallTitle,
} from "@/components/billing/paywall-state";
import { PaywallCard } from "@/components/home/paywall-card";
import { apiClient } from "@/lib/api-client";
import type { CreditBalance, RunCost } from "@/types/subscription";

jest.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => ({ user: { id: "u1" } }),
}));
jest.mock("@/components/billing/plan-grid", () => ({
  PlanGrid: () => <p>The plan grid</p>,
}));
jest.mock("@/lib/api-client", () => ({
  apiClient: {
    subscriptions: {
      getCredits: jest.fn(),
      getTrialStatus: jest.fn(),
      getCatalog: jest.fn(),
    },
  },
}));

const subscriptions = apiClient.subscriptions as unknown as Record<
  string,
  jest.Mock
>;

const run = (canRun: boolean): RunCost =>
  ({ cost: 15, minimum_balance: 15, can_run: canRun }) as RunCost;

const runs = (analyzeCanRun: boolean) => ({
  analyze: run(analyzeCanRun),
  change_keyword: run(true),
  regenerate_outline: run(true),
  generate: run(false),
});

const credits = (overrides: Partial<CreditBalance> = {}): CreditBalance => ({
  current_credits: 3,
  credits_per_month: 400,
  credits_reset_date: null,
  articles_remaining: 0,
  plan_name: "Starter",
  target_user_id: "u1",
  runs: runs(false),
  ...overrides,
});

const ended = {
  is_in_trial: false,
  trial_end_date: "2026-10-05T12:00:00Z",
  days_remaining: 0,
  trial_expired: true,
};

describe("paywallState", () => {
  it("reads the trial's end first, then the balance", () => {
    expect(paywallState({ trial: ended, credits: credits() })).toEqual({
      kind: "trial-ended",
      endedOn: "2026-10-05T12:00:00Z",
    });
    expect(paywallState({ credits: credits(), perArticle: 15 })).toEqual({
      kind: "no-credits",
      balance: 3,
      perArticle: 15,
    });
  });

  it("locks nothing an article can start with, or on an unlimited plan", () => {
    const enough = credits({
      current_credits: 40,
      runs: runs(true),
    });
    expect(paywallState({ credits: enough })).toBeNull();
    expect(
      paywallState({ credits: credits({ credits_per_month: null }) }),
    ).toBeNull();
    expect(paywallState({})).toBeNull();
  });

  it("words the state in the backend's numbers", () => {
    expect(
      paywallTitle({ kind: "trial-ended", endedOn: ended.trial_end_date }),
    ).toBe("Your trial ended on October 5");
    expect(paywallBalanceWords(3, 15)).toBe(
      "You have 3 credits; one article is 15 credits.",
    );
  });
});

function withQueries(ui: React.ReactElement) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {ui}
    </QueryClientProvider>,
  );
}

describe("PaywallCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    subscriptions.getCatalog.mockResolvedValue({
      credits: { per_article: 15 },
    });
  });

  it("says the trial ended and leads to the plans", async () => {
    subscriptions.getCredits.mockResolvedValue(credits());
    subscriptions.getTrialStatus.mockResolvedValue(ended);
    withQueries(<PaywallCard workspaceId="ws-1" />);

    expect(
      await screen.findByText("Your trial ended on October 5"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Choose a plan" })).toHaveAttribute(
      "href",
      "/settings/plan",
    );
  });

  it("tells a member to ask the owner, with no plan to choose", async () => {
    subscriptions.getCredits.mockResolvedValue(
      credits({ target_user_id: "owner" }),
    );
    withQueries(<PaywallCard workspaceId="ws-1" />);

    expect(
      await screen.findByText("Not enough credits for a new article"),
    ).toBeInTheDocument();
    expect(screen.getByText(/ask them to choose a plan/)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(subscriptions.getTrialStatus).not.toHaveBeenCalled();
  });

  it("shows nothing when an article can start", async () => {
    subscriptions.getCredits.mockResolvedValue(credits({ runs: runs(true) }));
    subscriptions.getTrialStatus.mockResolvedValue({
      ...ended,
      trial_expired: false,
    });
    const { container } = withQueries(<PaywallCard workspaceId="ws-1" />);

    await waitFor(() => expect(subscriptions.getCredits).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});

describe("PaywallDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    subscriptions.getCatalog.mockResolvedValue({
      credits: { per_article: 15 },
    });
  });

  it("says why and shows the plan grid inline", async () => {
    subscriptions.getTrialStatus.mockResolvedValue({
      ...ended,
      trial_expired: false,
    });
    withQueries(
      <PaywallDialog
        open
        onOpenChange={() => {}}
        reason="Writing an article needs 15 credits in hand, a whole article's worth, and you have 3."
        credits={credits()}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Not enough credits for this",
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/One article is 15 credits/),
    ).toBeInTheDocument();
    expect(screen.getByText("The plan grid")).toBeInTheDocument();
  });

  it("names the trial's end when that's why", async () => {
    subscriptions.getTrialStatus.mockResolvedValue(ended);
    withQueries(
      <PaywallDialog
        open
        onOpenChange={() => {}}
        reason="Your credits have run out."
        credits={credits()}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Your trial ended on October 5",
      }),
    ).toBeInTheDocument();
  });
});
