/**
 * The billed buttons (E13) show the backend's cost and the balance after it, and the gate's
 * popup uses the same numbers: nothing about credits is typed in the dashboard.
 */

import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  RunBalance,
  RunCostLabel,
} from "@/components/generate-content/run-cost";
import { useCreditGate } from "@/hooks/use-credit-gate";
import { apiClient } from "@/lib/api-client";
import { useSubscriptionStore } from "@/stores/subscription-store";
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
      getTrialStatus: jest.fn().mockResolvedValue({ trial_expired: false }),
      getCatalog: jest.fn().mockResolvedValue({ credits: { per_article: 15 } }),
    },
  },
}));

const run = (cost: number, minimum: number, current: number): RunCost => ({
  cost,
  minimum_balance: minimum,
  can_run: current >= minimum,
  balance_after: current >= minimum ? current - cost : null,
  stages: [],
});

const balance = (current: number, perMonth: number | null = 5000) =>
  ({
    current_credits: current,
    credits_per_month: perMonth,
    credits_reset_date: null,
    articles_remaining: perMonth === null ? null : Math.floor(current / 15),
    plan_name: "Growth",
    runs: {
      analyze: run(1, 15, current),
      change_keyword: run(1, 1, current),
      regenerate_outline: run(1, 1, current),
      generate: run(12, 12, current),
    },
  }) satisfies CreditBalance;

// One query client per test, shared by the gate and its paywall as on a page.
const withQueries = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const useBalance = (credits: CreditBalance | null) =>
  act(() =>
    useSubscriptionStore.setState({
      credits,
      fetchCredits: jest.fn().mockResolvedValue(undefined),
    }),
  );

describe("RunCostLabel", () => {
  it("adds the run's cost and, on Approve, the balance after", () => {
    useBalance(balance(4540));
    const { rerender } = render(<RunCostLabel run="analyze" />);
    expect(screen.getByText(/credit/)).toHaveTextContent("· 1 credit");
    rerender(<RunCostLabel run="generate" showBalance />);
    expect(screen.getByText(/credits/)).toHaveTextContent(
      "· 12 credits · balance after 4,528",
    );
  });

  it("follows the backend's table when a cost changes", () => {
    useBalance({
      ...balance(4540),
      runs: { ...balance(4540).runs, generate: run(14, 14, 4540) },
    });
    render(<RunCostLabel run="generate" showBalance />);
    expect(screen.getByText(/credits/)).toHaveTextContent(
      "· 14 credits · balance after 4,526",
    );
  });

  it("shows no balance on an unlimited plan, and nothing before the costs load", () => {
    useBalance(balance(0, null));
    const { container, rerender } = render(
      <RunCostLabel run="generate" showBalance />,
    );
    expect(container).toHaveTextContent("· 12 credits");
    expect(container).not.toHaveTextContent("balance after");
    useBalance(null);
    rerender(<RunCostLabel run="generate" showBalance />);
    expect(container).toBeEmptyDOMElement();
  });

  it("puts the balance after under the button on a phone", () => {
    useBalance(balance(4540));
    render(<RunBalance run="generate" />);
    expect(screen.getByText(/Balance after/)).toHaveTextContent(
      "Balance after: 4,528 credits",
    );
  });
});

describe("useCreditGate", () => {
  it("blocks Approve below the article's cost, with the numbers in the popup", () => {
    useBalance(balance(5));
    const wrapper = withQueries();
    const { result } = renderHook(() => useCreditGate(), { wrapper });
    let allowed = true;
    act(() => {
      allowed = result.current.ensureCredits("generate");
    });
    expect(allowed).toBe(false);
    render(result.current.creditsModal, { wrapper });
    // The paywall: the backend's numbers, then the plan grid inline.
    expect(
      screen.getByText(
        /Writing the article costs 12 credits, and you have 5 credits\./,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("The plan grid")).toBeInTheDocument();
  });

  it("lets Approve run with the cost in hand, and Analyze only with a whole article", () => {
    useBalance(balance(12));
    const { result } = renderHook(() => useCreditGate(), {
      wrapper: withQueries(),
    });
    expect(result.current.isBlocked).toBe(true);
    let allowed = false;
    act(() => {
      allowed = result.current.ensureCredits("generate");
    });
    expect(allowed).toBe(true);
  });

  it("blocks every billed button once the person's trial ended, whatever is left", async () => {
    jest.mocked(apiClient.subscriptions.getTrialStatus).mockResolvedValueOnce({
      is_in_trial: false,
      trial_end_date: "2026-10-05T12:00:00Z",
      days_remaining: 0,
      trial_expired: true,
    });
    useBalance(balance(60));
    const wrapper = withQueries();
    const { result } = renderHook(() => useCreditGate(), { wrapper });
    await waitFor(() => expect(result.current.isBlocked).toBe(true));
    let allowed = true;
    act(() => {
      allowed = result.current.ensureCredits("change_keyword");
    });
    expect(allowed).toBe(false);
    act(() => {
      allowed = result.current.ensureCreditsToContinue();
    });
    expect(allowed).toBe(false);
    render(result.current.creditsModal, { wrapper });
    expect(
      screen.getByText(/A trial's credits can't be spent once it ends\./),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/^Your trial ended on October 5/),
    ).toBeInTheDocument();
  });

  it("goes by the owner's balance on someone else's workspace, not the person's trial", () => {
    const getTrialStatus = jest.mocked(apiClient.subscriptions.getTrialStatus);
    getTrialStatus.mockClear();
    useBalance({ ...balance(60), target_user_id: "owner" });
    const { result } = renderHook(() => useCreditGate(), {
      wrapper: withQueries(),
    });
    expect(result.current.isBlocked).toBe(false);
    expect(getTrialStatus).not.toHaveBeenCalled();
  });
});
