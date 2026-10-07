/**
 * The admin credits routes as the API client calls them (FB2.28): one address for a user's
 * credits, read with GET and changed with POST, whose body is the change as JSON: the amount a
 * whole number, and none for a reset.
 */

import { createAdminCreditsNamespace } from "@/lib/api-client/admin-credits";
import type { ApiClient } from "@/lib/api-client/core";
import { ENDPOINTS } from "@/lib/api-client/endpoints";

const request = jest.fn();
const adminCredits = createAdminCreditsNamespace({
  request,
} as unknown as ApiClient);

const REASON = "Compensation for the outage";

/** The JSON the last request carried, as text. */
const sent = () => request.mock.calls.at(-1)?.[1].body as string;

describe("the admin credits routes", () => {
  beforeEach(() => request.mockReset());

  it("reads a user's credits", async () => {
    request.mockResolvedValue({ user_id: "user-1" });
    await expect(adminCredits.get("user-1")).resolves.toEqual({
      user_id: "user-1",
    });
    expect(request).toHaveBeenCalledWith("/api/v1/admin/users/user-1/credits", {
      method: "GET",
    });
  });

  it("posts an add as JSON, with the amount a number", async () => {
    await adminCredits.adjust("user-1", {
      action: "add",
      amount: 200,
      reason: REASON,
      expires_at: "2099-12-31T23:59:59.999Z",
    });
    expect(request).toHaveBeenCalledWith("/api/v1/admin/users/user-1/credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: `{"action":"add","amount":200,"reason":"${REASON}","expires_at":"2099-12-31T23:59:59.999Z"}`,
    });
  });

  it("posts a deduct with its amount and nothing else", async () => {
    await adminCredits.adjust("user-1", {
      action: "deduct",
      amount: 50,
      reason: REASON,
    });
    expect(sent()).toBe(`{"action":"deduct","amount":50,"reason":"${REASON}"}`);
  });

  it("posts a reset with no amount", async () => {
    await adminCredits.adjust("user-1", { action: "reset", reason: REASON });
    expect(sent()).toBe(`{"action":"reset","reason":"${REASON}"}`);
    expect(JSON.parse(sent())).not.toHaveProperty("amount");
  });

  it("reads the customer's own history from its own address", () => {
    expect(ENDPOINTS.SUBSCRIPTIONS.creditHistory).toBe(
      "/api/v1/subscriptions/credits/history",
    );
  });
});
