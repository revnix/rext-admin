import { createSecurityNamespace } from "@/lib/api-client/settings";
import type { ApiClient } from "@/lib/api-client/core";

describe("createSecurityNamespace login history normalization", () => {
  it("normalizes backend timestamps and status fields for the frontend", async () => {
    const client = {
      request: jest.fn().mockResolvedValue({
        message: "Login history retrieved successfully",
        user_id: "user-123",
        full_name: "Test User",
        email: "test@example.com",
        total_count: 2,
        login_history: [
          {
            timestamp: "2026-09-01T09:41:10.678022+00:00",
            ip_address: "10.0.1.2",
            user_agent: "node",
            status: "success",
            action: "auth.login",
          },
          {
            timestamp: "2026-09-01T09:19:12.203407+00:00",
            ip_address: "10.0.1.2",
            user_agent: "node",
            status: "failed",
            action: "auth.login.failed",
          },
        ],
      }),
    } as unknown as ApiClient;

    const result = await createSecurityNamespace(client).getLoginHistory();

    expect(result.history).toEqual([
      expect.objectContaining({
        created_at: "2026-09-01T09:41:10.678022+00:00",
        success: true,
        browser: "node",
      }),
      expect.objectContaining({
        created_at: "2026-09-01T09:19:12.203407+00:00",
        success: false,
        browser: "node",
      }),
    ]);
    expect(result.total_count).toBe(2);
  });
});
