/**
 * The billed buttons (E13) give the backend's cost and the balance after it in their tooltip
 * (FB2.11), and the gate's popup uses the same numbers: nothing about credits is typed in the
 * dashboard.
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
import userEvent from "@testing-library/user-event";
import {
  PhoneRunCost,
  RunCostTooltip,
  StageCostTooltip,
} from "@/components/generate-content/run-cost";
import { TooltipProvider } from "@/components/ui/tooltip";
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
      getCatalog: jest.fn().mockResolvedValue({
        credits: {
          per_article: 15,
          stages: [
            { key: "title_generation", credits: 1 },
            { key: "generate_outline", credits: 1 },
          ],
        },
      }),
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

describe("RunCostTooltip (FB2.11: the cost in the tooltip, not on the label)", () => {
  it("gives the run's cost and the balance it leaves on keyboard focus", async () => {
    useBalance(balance(4540));
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <RunCostTooltip run="generate">
          <button type="button">Approve and generate</button>
        </RunCostTooltip>
      </TooltipProvider>,
    );

    const button = screen.getByRole("button", {
      name: "Approve and generate",
    });
    expect(button).not.toHaveTextContent(/credit/);
    await user.tab();
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Balance after: 4,528 credits",
    );
  });
});

describe("PhoneRunCost", () => {
  it("keeps the article's cost and the balance after visible on a phone, beneath the buttons", () => {
    useBalance(balance(4540));
    render(<PhoneRunCost run="generate" />);
    expect(screen.getByText(/12 credits/)).toHaveTextContent(
      "12 credits · balance after 4,528",
    );
  });

  it("names the cost alone on an unlimited plan", () => {
    useBalance(balance(4540, null));
    render(<PhoneRunCost run="generate" />);
    expect(screen.getByText(/credits/)).toHaveTextContent(/^12 credits$/);
  });
});

describe("StageCostTooltip", () => {
  it("gives the stage's credits from the plan catalogue, and the balance after", async () => {
    useBalance(balance(4540));
    const user = userEvent.setup();
    const Wrapper = withQueries();
    render(
      <Wrapper>
        <TooltipProvider>
          <StageCostTooltip stage="title_generation">
            <button type="button">Continue with this keyword</button>
          </StageCostTooltip>
        </TooltipProvider>
      </Wrapper>,
    );
    await waitFor(() =>
      expect(apiClient.subscriptions.getCatalog).toHaveBeenCalled(),
    );

    await user.tab();
    const tip = await screen.findByRole("tooltip");
    // The amount says what it is, even without a balance (an unlimited plan).
    expect(tip).toHaveTextContent("1 credit");
    expect(tip).toHaveTextContent("Balance after: 4,539 credits");
    expect(
      screen.getByRole("button", { name: "Continue with this keyword" }),
    ).not.toHaveTextContent(/credit/);
  });

  it("leaves the button alone for a stage the catalogue doesn't list", async () => {
    const getCatalog = jest
      .mocked(apiClient.subscriptions.getCatalog)
      .mockResolvedValueOnce({ credits: { stages: [] } } as never);
    const user = userEvent.setup();
    const Wrapper = withQueries();
    render(
      <Wrapper>
        <TooltipProvider>
          <StageCostTooltip stage="title_generation">
            <button type="button">Continue</button>
          </StageCostTooltip>
        </TooltipProvider>
      </Wrapper>,
    );
    await waitFor(() => expect(getCatalog).toHaveBeenCalled());
    await act(async () => {});
    await user.tab();
    expect(screen.queryByRole("tooltip")).toBeNull();
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
