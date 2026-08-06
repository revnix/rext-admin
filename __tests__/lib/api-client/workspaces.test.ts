import { ENDPOINTS } from "@/lib/api-client/endpoints";
import { createWorkspacesNamespace } from "@/lib/api-client/workspaces";

describe("workspace API namespace", () => {
  it("loads the caller's recoverable deleted workspaces from the dedicated endpoint", async () => {
    const request = jest.fn().mockResolvedValue({
      total_count: 1,
      workspaces: [
        {
          id: "workspace-1",
          user_id: "user-1",
          name: "Archived Workspace",
          slug: "archived-workspace",
          timezone: null,
          url: null,
          status: "active",
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-02T00:00:00.000Z",
          deleted_at: "2024-01-03T00:00:00.000Z",
          recovery_deadline: "2024-02-02T00:00:00.000Z",
          days_remaining: 10,
        },
      ],
    });

    const workspaces = createWorkspacesNamespace({ request } as never);

    const result = await workspaces.getDeleted();

    expect(request).toHaveBeenCalledWith(ENDPOINTS.WORKSPACES.deleted(), {
      method: "GET",
    });
    expect(result.total_count).toBe(1);
    expect(result.workspaces[0].name).toBe("Archived Workspace");
  });
});
