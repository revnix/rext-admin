/**
 * The billed buttons' figures are the backend's (`runs` in GET /subscriptions/credits): a live
 * balance moves `can_run` and `balance_after` on its costs and minimums, and the gate's popup
 * says what a run needs in the same numbers.
 */

import { shortfall, withBalance } from "@/lib/billing/credits";
import type { CreditBalance } from "@/types/subscription";

// What the backend returns for a 4,540 balance (plan_catalog.run_costs).
const balance = (current: number): CreditBalance => ({
  current_credits: current,
  credits_per_month: 5000,
  credits_reset_date: null,
  articles_remaining: Math.floor(current / 15),
  plan_name: "Growth",
  runs: {
    analyze: {
      cost: 1,
      minimum_balance: 15,
      can_run: current >= 15,
      balance_after: current >= 15 ? current - 1 : null,
      stages: [{ key: "serp_seo", credits: 1 }],
    },
    change_keyword: {
      cost: 1,
      minimum_balance: 1,
      can_run: current >= 1,
      balance_after: current >= 1 ? current - 1 : null,
      stages: [{ key: "serp_seo", credits: 1 }],
    },
    regenerate_outline: {
      cost: 1,
      minimum_balance: 1,
      can_run: current >= 1,
      balance_after: current >= 1 ? current - 1 : null,
      stages: [{ key: "generate_outline", credits: 1 }],
    },
    generate: {
      cost: 12,
      minimum_balance: 12,
      can_run: current >= 12,
      balance_after: current >= 12 ? current - 12 : null,
      stages: [
        { key: "deep_research", credits: 4 },
        { key: "content_drafting", credits: 1 },
        { key: "featured_image", credits: 1 },
        { key: "humanization", credits: 5 },
        { key: "eeat_optimization", credits: 1 },
      ],
    },
  },
});

describe("withBalance", () => {
  it("gives the figures the backend gives for the new balance", () => {
    for (const next of [4528, 14, 12, 11, 0]) {
      expect(withBalance(balance(4540), next)).toEqual(balance(next));
    }
  });

  it("keeps an unlimited plan's articles unlimited", () => {
    const unlimited = {
      ...balance(4540),
      credits_per_month: null,
      articles_remaining: null,
    };
    expect(withBalance(unlimited, 100).articles_remaining).toBeNull();
  });

  it("leaves a balance without the cost table as it was, but for the balance", () => {
    const { runs: _runs, ...bare } = balance(4540);
    expect(withBalance(bare, 30)).toEqual({ ...bare, current_credits: 30 });
  });
});

describe("shortfall", () => {
  it("is nothing when the run can start", () => {
    expect(shortfall("analyze", balance(15))).toBeNull();
    expect(shortfall("generate", balance(12))).toBeNull();
  });

  it("names a new article's whole-article minimum", () => {
    expect(shortfall("analyze", balance(7))).toBe(
      "Starting an article needs 15 credits in hand, a whole article's worth, and you have 7 credits.",
    );
  });

  it("names the article's cost on Approve", () => {
    expect(shortfall("generate", balance(5))).toBe(
      "Writing the article costs 12 credits, and you have 5 credits.",
    );
  });

  it("says one credit in the singular", () => {
    expect(shortfall("change_keyword", balance(0))).toBe(
      "Changing the keyword costs 1 credit, and you have 0 credits.",
    );
  });
});
