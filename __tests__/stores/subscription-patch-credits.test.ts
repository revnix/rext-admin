/**
 * The stream's credit updates (F6): a spend takes the bonus first, then the plan's credits, as the
 * backend does, so the meters that set the plan's own credits against its allowance stay right.
 */

import { useSubscriptionStore } from "@/stores/subscription-store";
import type { CreditBalance, CreditBonus } from "@/types/subscription";

const bonus = (left: number): CreditBonus => ({
  label: "Launch bonus",
  promotion: "launch",
  credits: left,
  granted: 1000,
  expires_at: null,
});

const credits = (fields: Partial<CreditBalance>): CreditBalance => ({
  current_credits: 1500,
  credits_per_month: 1000,
  credits_reset_date: null,
  articles_remaining: 100,
  plan_name: "Growth",
  monthly_credits: 500,
  bonus: bonus(1000),
  ...fields,
});

describe("patchCredits", () => {
  it("spends the bonus first", () => {
    useSubscriptionStore.setState({ credits: credits({}) });
    useSubscriptionStore.getState().patchCredits(1485);
    const after = useSubscriptionStore.getState().credits;
    expect(after?.bonus?.credits).toBe(985);
    expect(after?.monthly_credits).toBe(500);
  });

  it("then the plan's credits, once the bonus is gone", () => {
    useSubscriptionStore.setState({
      credits: credits({
        current_credits: 510,
        monthly_credits: 500,
        bonus: bonus(10),
      }),
    });
    useSubscriptionStore.getState().patchCredits(490);
    const after = useSubscriptionStore.getState().credits;
    expect(after?.bonus?.credits).toBe(0);
    expect(after?.monthly_credits).toBe(490);
  });

  it("puts a refund back into the plan's credits", () => {
    useSubscriptionStore.setState({
      credits: credits({
        current_credits: 400,
        monthly_credits: 400,
        bonus: null,
      }),
    });
    useSubscriptionStore.getState().patchCredits(415);
    expect(useSubscriptionStore.getState().credits?.monthly_credits).toBe(415);
  });
});
