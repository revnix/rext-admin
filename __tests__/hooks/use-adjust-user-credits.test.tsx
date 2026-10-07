/**
 * A super admin's change to a user's credits (FB2.28): the request goes to that user with the
 * action's own body, a success says what was really done and refreshes the user's credits and the
 * signed-in person's own, and a failure is left for the form to show.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { useAdjustUserCredits } from "@/hooks/mutations/use-adjust-user-credits";
import { adjustmentRequest } from "@/lib/billing/credit-adjustments";

jest.mock("@/lib/api-client", () => ({
  apiClient: { adminCredits: { adjust: jest.fn() } },
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const adjust = jest.requireMock("@/lib/api-client").apiClient.adminCredits
  .adjust as jest.Mock;
const toast = jest.requireMock("sonner").toast as {
  success: jest.Mock;
  error: jest.Mock;
};

const USER = { id: "user-1", email: "x@example.com" };
const REASON = "Compensation for the outage";

/** What the backend answers (AdminCreditAdjustmentResult). */
const answer = (fields: Record<string, unknown>) => ({
  action: "add",
  requested_amount: 200,
  amount: 200,
  balance_before: 500,
  balance_after: 700,
  monthly_credits: 500,
  admin_credits: 200,
  subscription_id: "sub-1",
  grant_id: "grant-1",
  audit_id: "audit-1",
  ...fields,
});

function setup() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const invalidate = jest.spyOn(client, "invalidateQueries");
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return { wrapper, invalidate };
}

describe("a super admin's change to a user's credits", () => {
  beforeEach(() => {
    adjust.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it("sends an add with its amount and reason, and its expiry only when one is set", async () => {
    adjust.mockResolvedValue(answer({}));
    const { wrapper } = setup();
    const { result } = renderHook(() => useAdjustUserCredits(), { wrapper });

    await act(() =>
      result.current.mutateAsync({
        user: USER,
        body: adjustmentRequest({
          action: "add",
          amount: "200",
          expires_at: "",
          reason: REASON,
        }),
      }),
    );
    expect(adjust).toHaveBeenLastCalledWith("user-1", {
      action: "add",
      amount: 200,
      reason: REASON,
    });

    await act(() =>
      result.current.mutateAsync({
        user: USER,
        body: adjustmentRequest({
          action: "add",
          amount: "200",
          expires_at: "2099-12-31",
          reason: REASON,
        }),
      }),
    );
    expect(adjust).toHaveBeenLastCalledWith("user-1", {
      action: "add",
      amount: 200,
      reason: REASON,
      expires_at: new Date(2099, 11, 31, 23, 59, 59, 999).toISOString(),
    });
  });

  it("sends a deduct with its amount and no expiry", async () => {
    adjust.mockResolvedValue(
      answer({ action: "deduct", requested_amount: 50, amount: 50 }),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useAdjustUserCredits(), { wrapper });

    await act(() =>
      result.current.mutateAsync({
        user: USER,
        body: adjustmentRequest({
          action: "deduct",
          amount: "50",
          expires_at: "2099-12-31",
          reason: REASON,
        }),
      }),
    );

    expect(adjust).toHaveBeenCalledWith("user-1", {
      action: "deduct",
      amount: 50,
      reason: REASON,
    });
  });

  it("sends a reset with no amount", async () => {
    adjust.mockResolvedValue(
      answer({ action: "reset", requested_amount: null, amount: 120 }),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useAdjustUserCredits(), { wrapper });

    await act(() =>
      result.current.mutateAsync({
        user: USER,
        body: adjustmentRequest({
          action: "reset",
          amount: "300",
          expires_at: "",
          reason: REASON,
        }),
      }),
    );

    expect(adjust).toHaveBeenCalledWith("user-1", {
      action: "reset",
      reason: REASON,
    });
  });

  it("toasts the new balance and refreshes the user's credits and the admin's own", async () => {
    adjust.mockResolvedValue(answer({}));
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(() => useAdjustUserCredits(), { wrapper });

    await act(() =>
      result.current.mutateAsync({
        user: USER,
        body: { action: "add", amount: 200, reason: REASON },
      }),
    );

    expect(toast.success).toHaveBeenCalledWith(
      "200 credits added to x@example.com",
      {
        description: "The balance is now 700 credits.",
      },
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["admin-user-credits", "user-1"],
    });
    // Every read of the signed-in person's credits, the history included.
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["subscriptions", "credits"],
    });
  });

  it("says what was really taken when a deduct took less than asked", async () => {
    adjust.mockResolvedValue(
      answer({
        action: "deduct",
        requested_amount: 50,
        amount: 30,
        balance_before: 30,
        balance_after: 0,
        grant_id: null,
      }),
    );
    const { wrapper } = setup();
    const { result } = renderHook(() => useAdjustUserCredits(), { wrapper });

    await act(() =>
      result.current.mutateAsync({
        user: USER,
        body: { action: "deduct", amount: 50, reason: REASON },
      }),
    );

    expect(toast.success).toHaveBeenCalledWith(
      "30 credits deducted from x@example.com, not the 50 asked for",
      {
        description:
          "That was all there was to take. The balance is now 0 credits.",
      },
    );
  });

  it("rejects without a toast or a refresh, so the form shows what the backend said", async () => {
    adjust.mockRejectedValue(new Error("This plan has no monthly credits"));
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(() => useAdjustUserCredits(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          user: USER,
          body: { action: "reset", reason: REASON },
        }),
      ).rejects.toThrow("This plan has no monthly credits");
    });

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();
  });
});
