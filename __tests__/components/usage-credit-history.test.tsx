/**
 * Account settings, Usage (FB2.28): the credits Rext support added show beside the bonus, and
 * "Credit history" lists what Rext support changed, newest first, each change once and never with
 * an admin's name; with nothing changed it says so.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { addedWords } from "@/components/billing/billing-format";
import { UsageSection } from "@/components/billing/usage-section";

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    subscriptions: {
      getCredits: jest.fn(),
      getUsageStats: jest.fn(),
      getCatalog: jest.fn(),
      getCurrentPlan: jest.fn(),
      getCreditHistory: jest.fn(),
    },
  },
}));

const subscriptions = jest.requireMock("@/lib/api-client").apiClient
  .subscriptions as Record<
  | "getCredits"
  | "getUsageStats"
  | "getCatalog"
  | "getCurrentPlan"
  | "getCreditHistory",
  jest.Mock
>;

/** GET /subscriptions/credits on a Growth plan with a live bonus. */
const balance = (fields: Record<string, unknown> = {}) => ({
  current_credits: 1520,
  monthly_credits: 320,
  credits_per_month: 500,
  credits_reset_date: "2099-11-01T12:00:00Z",
  articles_remaining: 101,
  plan_name: "Growth",
  bonus: {
    label: "Launch bonus",
    promotion: "launch",
    credits: 1000,
    granted: 1000,
    expires_at: "2099-10-14T12:00:00Z",
  },
  added_credits: null,
  ...fields,
});

/** GET /subscriptions/credits/history: one add (its grant and its audit entry), then a deduct and a reset. */
const HISTORY = {
  grants: [
    {
      id: "grant-1",
      amount: 250,
      remaining: 200,
      forfeited: 50,
      reason: "Compensation for the outage",
      expires_at: "2099-10-31T12:00:00Z",
      created_at: "2026-10-05T10:00:00.100Z",
      granted_by: "Rext support",
    },
  ],
  adjustments: [
    {
      id: "audit-3",
      action: "reset",
      amount: 180,
      balance_before: 520,
      balance_after: 700,
      reason: "A fresh month after the outage",
      expires_at: null,
      created_at: "2026-10-07T10:00:00Z",
      adjusted_by: "Rext support",
    },
    {
      id: "audit-2",
      action: "deduct",
      amount: 50,
      balance_before: 570,
      balance_after: 520,
      reason: "Added too many by mistake",
      expires_at: null,
      created_at: "2026-10-06T10:00:00Z",
      adjusted_by: "Rext support",
    },
    {
      id: "audit-1",
      action: "add",
      amount: 250,
      balance_before: 320,
      balance_after: 570,
      reason: "Compensation for the outage",
      expires_at: "2099-10-31T12:00:00+00:00",
      created_at: "2026-10-05T10:00:00.300Z",
      adjusted_by: "Rext support",
    },
  ],
};

function renderUsage() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <UsageSection />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  subscriptions.getCredits.mockResolvedValue(balance());
  subscriptions.getUsageStats.mockResolvedValue({
    workspaces: { used: 1, limit: 3, unlimited: false },
    members: { limit: 5, unlimited: false },
  });
  subscriptions.getCatalog.mockResolvedValue({ credits: { per_article: 15 } });
  subscriptions.getCurrentPlan.mockResolvedValue({ subscription: null });
  subscriptions.getCreditHistory.mockResolvedValue({
    grants: [],
    adjustments: [],
  });
});

describe("addedWords", () => {
  it("says what Rext support added and the soonest expiry", () => {
    expect(
      addedWords({
        added_credits: {
          credits: 1200,
          granted: 1250,
          expires_at: "2099-10-31T12:00:00Z",
        },
      }),
    ).toBe(
      "Plus 1,200 credits added by Rext support; the soonest expiry is Oct 31, 2099.",
    );
  });

  it("says added credits with no expiry don't expire", () => {
    expect(
      addedWords({
        added_credits: { credits: 200, granted: 200, expires_at: null },
      }),
    ).toBe("Plus 200 credits added by Rext support, which don't expire.");
    expect(
      addedWords({
        added_credits: { credits: 1, granted: 200, expires_at: null },
      }),
    ).toBe("Plus 1 credit added by Rext support, which doesn't expire.");
  });

  it("says nothing when none were added, none are left, or the backend doesn't send them", () => {
    expect(addedWords({ added_credits: null })).toBeNull();
    expect(addedWords({})).toBeNull();
    expect(
      addedWords({
        added_credits: { credits: 0, granted: 200, expires_at: null },
      }),
    ).toBeNull();
  });
});

describe("Usage, the credits card", () => {
  it("shows the added credits beside the bonus", async () => {
    subscriptions.getCredits.mockResolvedValue(
      balance({
        added_credits: {
          credits: 200,
          granted: 250,
          expires_at: "2099-10-31T12:00:00Z",
        },
      }),
    );
    renderUsage();

    const words = await screen.findByText(/Plus 1,000 launch bonus credits/);
    expect(words).toHaveTextContent(
      "Plus 1,000 launch bonus credits, until Oct 14, 2099. Plus 200 credits added by Rext support; the soonest expiry is Oct 31, 2099.",
    );
  });

  it("says nothing about added credits when there are none", async () => {
    renderUsage();
    expect(
      await screen.findByText(/Plus 1,000 launch bonus credits/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/added by Rext support/)).not.toBeInTheDocument();
  });

  it("says nothing about added credits once they are all spent", async () => {
    subscriptions.getCredits.mockResolvedValue(
      balance({
        added_credits: { credits: 0, granted: 250, expires_at: null },
      }),
    );
    renderUsage();
    expect(
      await screen.findByText(/Plus 1,000 launch bonus credits/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/added by Rext support/)).not.toBeInTheDocument();
  });
});

describe("Usage, the credit history", () => {
  it("says so when Rext support has changed nothing", async () => {
    renderUsage();

    expect(
      screen.getByRole("heading", { name: "Credit history" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "No changes yet" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "When Rext support adds, deducts or resets credits on your account, it shows here.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Credit history" }),
    ).not.toBeInTheDocument();
  });

  it("lists what Rext support changed, newest first, each change once", async () => {
    subscriptions.getCreditHistory.mockResolvedValue(HISTORY);
    renderUsage();

    const rows = within(
      await screen.findByRole("list", { name: "Credit history" }),
    ).getAllByRole("listitem");

    // Three changes, though the add comes as a grant and as an adjustment.
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent(
      "Monthly credits reset, 180 more than before",
    );
    expect(rows[0]).toHaveTextContent("Reason: A fresh month after the outage");
    expect(rows[1]).toHaveTextContent("50 credits deducted");
    expect(rows[1]).toHaveTextContent("Reason: Added too many by mistake");
    expect(rows[2]).toHaveTextContent("250 credits added");
    expect(rows[2]).toHaveTextContent("Reason: Compensation for the outage");
    expect(rows[2]).toHaveTextContent(
      "200 left · 50 taken back · Expires Oct 31, 2099 · Balance from 320 to 570",
    );
    for (const row of rows) expect(row).toHaveTextContent("by Rext support");
    expect(
      screen.queryByRole("heading", { name: "No changes yet" }),
    ).not.toBeInTheDocument();
  });

  it("says so when the history doesn't load, and still shows the credits", async () => {
    subscriptions.getCreditHistory.mockRejectedValue(new Error("Not found"));
    renderUsage();

    expect(
      await screen.findByText("Your credit history didn't load"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Plus 1,000 launch bonus credits/),
    ).toBeInTheDocument();
  });
});
