/**
 * The admin plan routes as the API client calls them (FB2.29): a user's plan is read with GET and
 * changed with POST at one address, and a trial is extended at its own, each body the change as
 * JSON.
 */

import { createAdminPlanNamespace } from "@/lib/api-client/admin-plan";
import type { ApiClient } from "@/lib/api-client/core";

const request = jest.fn();
const adminPlan = createAdminPlanNamespace({ request } as unknown as ApiClient);

const REASON = "Asked by phone";

describe("the admin plan routes", () => {
  beforeEach(() => request.mockReset());

  it("reads a user's plan", async () => {
    request.mockResolvedValue({ user_id: "user-1" });
    await expect(adminPlan.get("user-1")).resolves.toEqual({
      user_id: "user-1",
    });
    expect(request).toHaveBeenCalledWith("/api/v1/admin/users/user-1/plan", {
      method: "GET",
    });
  });

  it("posts a plan change as JSON to the same address", async () => {
    await adminPlan.change("user-1", {
      plan_id: "plan-scale",
      billing_period: "yearly",
      billing: "charge_now",
      reason: REASON,
    });
    expect(request).toHaveBeenCalledWith("/api/v1/admin/users/user-1/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: `{"plan_id":"plan-scale","billing_period":"yearly","billing":"charge_now","reason":"${REASON}"}`,
    });
  });

  it("posts a trial's new end to the trial's address", async () => {
    await adminPlan.extendTrial("user-1", {
      ends_at: "2026-10-26T12:00:00.000Z",
      reason: REASON,
    });
    expect(request).toHaveBeenCalledWith("/api/v1/admin/users/user-1/trial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: `{"ends_at":"2026-10-26T12:00:00.000Z","reason":"${REASON}"}`,
    });
  });
});
