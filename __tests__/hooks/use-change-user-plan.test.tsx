/**
 * A super admin's change to a user's plan and to a trial's end (FB2.29): the request goes to that
 * user, a success says what was done and reads again everything the change touched (the user's
 * plan and credits, the rows of Admin > Users, the signed-in person's own subscription), and a
 * failure is left for the form to show, with the plan read again all the same: one refusal says
 * Lemon Squeezy has changed the plan although it couldn't be recorded.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  useChangeUserPlan,
  useExtendUserTrial,
} from "@/hooks/mutations/use-change-user-plan";

jest.mock("@/lib/api-client", () => ({
  apiClient: { adminPlan: { change: jest.fn(), extendTrial: jest.fn() } },
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const api = jest.requireMock("@/lib/api-client").apiClient.adminPlan as {
  change: jest.Mock;
  extendTrial: jest.Mock;
};
const toast = jest.requireMock("sonner").toast as {
  success: jest.Mock;
  error: jest.Mock;
};

const USER = { id: "user-1", email: "x@example.com" };
const REASON = "Asked by phone";
const CHANGE = {
  plan_id: "plan-scale",
  billing_period: "monthly" as const,
  billing: "next_renewal" as const,
  reason: REASON,
};

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

/** The query keys read again, in the order they were asked for. */
const refreshed = (invalidate: jest.SpyInstance) =>
  invalidate.mock.calls.map(([filters]) => filters?.queryKey);

const EVERYTHING_TOUCHED = [
  ["admin-user-plan", "user-1"],
  ["admin-users"],
  ["admin-user-credits", "user-1"],
  ["subscriptions"],
];

beforeEach(() => {
  api.change.mockReset();
  api.extendTrial.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

describe("a super admin's change to a user's plan", () => {
  it("sends the change to that user, says what was done and reads again what it touched", async () => {
    api.change.mockResolvedValue({
      subscription_id: "sub-1",
      old_plan: { id: "plan-growth", name: "growth", display_name: "Growth" },
      new_plan: { id: "plan-scale", name: "scale", display_name: "Scale" },
      old_billing_period: "monthly",
      new_billing_period: "monthly",
      billing: "next_renewal",
      monthly_credits_before: 320,
      monthly_credits_after: 1320,
      renews_at: "2026-11-01T12:00:00Z",
      audit_id: "audit-1",
    });
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(() => useChangeUserPlan(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ user: USER, body: CHANGE });
    });

    expect(api.change).toHaveBeenCalledWith("user-1", CHANGE);
    expect(toast.success).toHaveBeenCalledWith(
      "x@example.com moved to Scale, monthly",
      {
        description:
          "The month's credits are now 1,320 (320 before). The new price applies from Nov 1, 2026.",
      },
    );
    expect(refreshed(invalidate)).toEqual(EVERYTHING_TOUCHED);
  });

  it("leaves a refusal to the form with no toast, and reads the plan again whatever it says", async () => {
    api.change.mockRejectedValue(new Error("Nothing was changed."));
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(() => useChangeUserPlan(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ user: USER, body: CHANGE }),
      ).rejects.toThrow("Nothing was changed.");
    });

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(refreshed(invalidate)).toEqual([["admin-user-plan", "user-1"]]);
  });
});

describe("a super admin's extension of a trial", () => {
  const body = { ends_at: "2026-10-26T12:00:00.000Z", reason: REASON };

  it("sends the new end to that user, says what was done and reads again what it touched", async () => {
    api.extendTrial.mockResolvedValue({
      subscription_id: "sub-2",
      trial_ended_at_before: "2026-10-12T12:00:00Z",
      trial_ends_at: "2026-10-26T12:00:00Z",
      audit_id: "audit-2",
    });
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(() => useExtendUserTrial(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ user: USER, body });
    });

    expect(api.extendTrial).toHaveBeenCalledWith("user-1", body);
    expect(toast.success).toHaveBeenCalledWith(
      "x@example.com's trial now ends Oct 26, 2026",
      { description: "Before, its end was Oct 12, 2026." },
    );
    expect(refreshed(invalidate)).toEqual(EVERYTHING_TOUCHED);
  });

  it("leaves a refusal to the form, and reads the plan again", async () => {
    api.extendTrial.mockRejectedValue(new Error("Nothing was changed."));
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(() => useExtendUserTrial(), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({ user: USER, body }),
      ).rejects.toThrow("Nothing was changed.");
    });

    expect(toast.success).not.toHaveBeenCalled();
    expect(refreshed(invalidate)).toEqual([["admin-user-plan", "user-1"]]);
  });
});
