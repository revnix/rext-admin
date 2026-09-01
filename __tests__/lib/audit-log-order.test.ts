import { sortAuditLogs } from "@/lib/audit-log-order";
import { AuditActions, type AuditLog } from "@/types/audit-log";

describe("sortAuditLogs", () => {
  it("keeps workspace create before workspace update for the same resource", () => {
    const logs: AuditLog[] = [
      {
        id: "update",
        action: AuditActions.WORKSPACE_UPDATE,
        resource_type: "workspace",
        resource_id: "ws-123",
        workspace_id: "ws-123",
        status: "success",
        created_at: "2026-09-01T12:10:00.000Z",
        ip_address: null,
        user_agent: null,
        user_id: "user-1",
        full_name: "Test User",
        user_email: "test@example.com",
        request_id: null,
      },
      {
        id: "create",
        action: AuditActions.WORKSPACE_CREATE,
        resource_type: "workspace",
        resource_id: "ws-123",
        workspace_id: "ws-123",
        status: "success",
        created_at: "2026-09-01T11:55:00.000Z",
        ip_address: null,
        user_agent: null,
        user_id: "user-1",
        full_name: "Test User",
        user_email: "test@example.com",
        request_id: null,
      },
    ];

    const sorted = sortAuditLogs(logs);

    expect(sorted.map((log) => log.action)).toEqual([
      AuditActions.WORKSPACE_CREATE,
      AuditActions.WORKSPACE_UPDATE,
    ]);
  });
});
