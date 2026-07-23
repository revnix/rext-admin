/**
 * Credit gate — the single guard every generation flow calls before firing a request.
 *
 * The backend bills per pipeline stage (15 per article), so the load-bearing case
 * is a *partial* balance: starting with 5 credits burns them on a run that dies
 * halfway. Fails if a partial balance stops blocking a fresh start, if it starts
 * blocking a resume (stranding an article whose stages are already paid for), or
 * if a loading/unlimited balance blocks at all.
 */

import { renderHook, act } from "@testing-library/react";
import { useCreditGate } from "@/hooks/use-credit-gate";
import { useSubscriptionStore } from "@/stores/subscription-store";
import type { CreditBalance } from "@/types/subscription";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const balance = (over: Partial<CreditBalance>): CreditBalance => ({
  current_credits: 100,
  credits_per_month: 300,
  credits_reset_date: null,
  articles_remaining: 6,
  plan_name: "Starter",
  ...over,
});

function setCredits(credits: CreditBalance | null) {
  useSubscriptionStore.setState({ credits });
}

beforeEach(() => {
  // The gate refetches on mount — keep it from hitting the network.
  useSubscriptionStore.setState({ fetchCredits: async () => {} });
});

describe("useCreditGate — starting a new generation", () => {
  it("blocks a partial balance that cannot cover a whole article", () => {
    // 5 credits: enough to start, not enough to finish — the wasted-credits case
    setCredits(balance({ current_credits: 5, articles_remaining: 0 }));

    const { result } = renderHook(() => useCreditGate());

    expect(result.current.isBlocked).toBe(true);
    act(() => {
      expect(result.current.ensureCredits()).toBe(false);
    });
  });

  it("blocks an exhausted balance", () => {
    setCredits(balance({ current_credits: 0, articles_remaining: 0 }));

    const { result } = renderHook(() => useCreditGate());

    act(() => {
      expect(result.current.ensureCredits()).toBe(false);
    });
  });

  it("allows a balance covering at least one full article", () => {
    setCredits(balance({ current_credits: 15, articles_remaining: 1 }));

    const { result } = renderHook(() => useCreditGate());

    expect(result.current.isBlocked).toBe(false);
    expect(result.current.ensureCredits()).toBe(true);
  });

  it("does not block unlimited plans reporting a zero balance", () => {
    setCredits(balance({ current_credits: 0, articles_remaining: null }));

    const { result } = renderHook(() => useCreditGate());

    expect(result.current.isBlocked).toBe(false);
    expect(result.current.ensureCredits()).toBe(true);
  });

  it("does not block while the balance is still loading", () => {
    setCredits(null);

    const { result } = renderHook(() => useCreditGate());

    expect(result.current.isBlocked).toBe(false);
    expect(result.current.ensureCredits()).toBe(true);
  });
});

describe("useCreditGate — resuming an in-flight generation", () => {
  it("lets a part-spent article finish on a partial balance", () => {
    // Mid-article: started with 15, 7 already spent. Requiring a fresh 15 here
    // would strand an article the user has already paid for.
    setCredits(balance({ current_credits: 8, articles_remaining: 0 }));

    const { result } = renderHook(() => useCreditGate());

    expect(result.current.ensureCreditsToContinue()).toBe(true);
  });

  it("stops once the balance is fully exhausted", () => {
    setCredits(balance({ current_credits: 0, articles_remaining: 0 }));

    const { result } = renderHook(() => useCreditGate());

    act(() => {
      expect(result.current.ensureCreditsToContinue()).toBe(false);
    });
  });

  it("does not block unlimited plans", () => {
    setCredits(balance({ current_credits: 0, articles_remaining: null }));

    const { result } = renderHook(() => useCreditGate());

    expect(result.current.ensureCreditsToContinue()).toBe(true);
  });
});
