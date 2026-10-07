/**
 * The account's tables on /settings/security (D8): the activity log and the sign-in history are paged
 * by the backend, 25 rows a page, newest first; the sessions table puts this device first, and every
 * other device signs out from its row's menu.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { ActivityLogTable } from "@/components/security/activity-log-table";
import { LoginHistoryTable } from "@/components/security/login-history-table";
import { ActiveSessions } from "@/components/settings/active-sessions";

jest.mock("@/lib/api-client", () => ({
  apiClient: {
    auditLogs: { getMyLogs: jest.fn(), exportMyLogs: jest.fn() },
    security: { getLoginHistory: jest.fn() },
    sessions: { list: jest.fn(), revoke: jest.fn(), revokeAll: jest.fn() },
  },
}));

let signedIn: { id: string } | null = { id: "user-1" };
jest.mock("@/hooks/use-permission", () => ({
  usePermissionUser: () => signedIn,
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const api = jest.requireMock("@/lib/api-client").apiClient as {
  auditLogs: { getMyLogs: jest.Mock };
  security: { getLoginHistory: jest.Mock };
  sessions: { list: jest.Mock; revoke: jest.Mock; revokeAll: jest.Mock };
};

function renderWithQuery(node: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{node}</QueryClientProvider>,
  );
}

/**
 * The table's own rows once `text` shows in one (the phone's cards repeat them in a list beside
 * the table, so the table is read on its own).
 */
async function bodyRows(text: string) {
  const table = await screen.findByRole("table");
  await within(table).findByText(text);
  return within(table).getAllByRole("row").slice(1);
}

beforeEach(() => {
  jest.clearAllMocks();
  signedIn = { id: "user-1" };
});

describe("the activity log", () => {
  it("asks the backend for 25 rows at a time and turns the page there", async () => {
    api.auditLogs.getMyLogs.mockResolvedValue({
      logs: [
        {
          id: "1",
          action: "auth.password_change",
          resource_type: "user",
          ip_address: "203.0.113.7",
          user_agent: "Mozilla/5.0",
          status: "success",
          created_at: "2026-10-06T09:00:00Z",
        },
        {
          id: "2",
          action: "auth.login",
          resource_type: "auth",
          ip_address: "198.51.100.2",
          user_agent: null,
          status: "failed",
          created_at: "2026-10-05T22:00:00Z",
        },
      ],
      total: 60,
      has_more: true,
    });
    renderWithQuery(<ActivityLogTable />);

    const rows = await bodyRows("Password changed");
    expect(within(rows[0]).getByText("Password changed")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Signed in")).toBeInTheDocument();
    expect(within(rows[1]).getByText("Failed")).toBeInTheDocument();
    expect(api.auditLogs.getMyLogs).toHaveBeenLastCalledWith({
      action: undefined,
      limit: 25,
      offset: 0,
    });

    await userEvent.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() =>
      expect(api.auditLogs.getMyLogs).toHaveBeenLastCalledWith({
        action: undefined,
        limit: 25,
        offset: 25,
      }),
    );
  });

  it("says so when there's nothing yet", async () => {
    api.auditLogs.getMyLogs.mockResolvedValue({
      logs: [],
      total: 0,
      has_more: false,
    });
    renderWithQuery(<ActivityLogTable />);
    expect(await screen.findByText("No activity yet")).toBeInTheDocument();
  });
});

describe("whose history", () => {
  it("asks for nothing until it knows who is signed in", async () => {
    signedIn = null;
    renderWithQuery(
      <>
        <ActivityLogTable />
        <LoginHistoryTable />
      </>,
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(api.auditLogs.getMyLogs).not.toHaveBeenCalled();
    expect(api.security.getLoginHistory).not.toHaveBeenCalled();
    // Loading, not empty: nobody's history is known yet.
    expect(screen.queryByText("No activity yet")).toBe(null);
    expect(screen.queryByText("No sign-ins yet")).toBe(null);
  });
});

describe("the sign-in history", () => {
  it("shows each attempt and its result, 25 a page from the backend", async () => {
    api.security.getLoginHistory.mockResolvedValue({
      history: [
        {
          id: "a",
          created_at: "2026-10-06T08:00:00Z",
          success: true,
          ip_address: "203.0.113.7",
          location: "Lahore, PK",
          device: "Chrome on macOS",
          browser: "Chrome",
        },
        {
          id: "b",
          created_at: "2026-10-05T08:00:00Z",
          success: false,
          ip_address: "198.51.100.2",
          browser: "Unknown",
        },
      ],
      total_count: 2,
    });
    renderWithQuery(<LoginHistoryTable />);

    const rows = await bodyRows("Lahore, PK · 203.0.113.7");
    expect(within(rows[0]).getByText("Signed in")).toBeInTheDocument();
    expect(
      within(rows[0]).getByText("Lahore, PK · 203.0.113.7"),
    ).toBeInTheDocument();
    expect(within(rows[1]).getByText("Failed")).toBeInTheDocument();
    expect(api.security.getLoginHistory).toHaveBeenCalledWith({
      limit: 25,
      offset: 0,
    });
  });
});

describe("the sessions table", () => {
  const session = (
    id: string,
    name: string,
    lastActive: string,
    current = false,
  ) => ({
    id,
    device_name: name,
    device_type: "desktop",
    ip_address: "203.0.113.7",
    city: "Lahore",
    country: "PK",
    user_agent: null,
    created_at: null,
    last_activity_at: lastActive,
    is_current: current,
  });

  beforeEach(() => {
    api.sessions.list.mockResolvedValue({
      sessions: [
        session("old", "Old laptop", "2026-09-01T10:00:00Z"),
        session("here", "This Mac", "2026-10-06T10:00:00Z", true),
        session("new", "Phone", "2026-10-05T10:00:00Z"),
      ],
    });
    api.sessions.revoke.mockResolvedValue({ success: true });
  });

  it("puts this device first, then the others by their last activity", async () => {
    renderWithQuery(<ActiveSessions />);
    const rows = await bodyRows("Old laptop");
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining("This Mac"),
      expect.stringContaining("Phone"),
      expect.stringContaining("Old laptop"),
    ]);
    expect(within(rows[0]).getByText("This device")).toBeInTheDocument();
  });

  it("signs out another device from its row, and never this one", async () => {
    renderWithQuery(<ActiveSessions />);
    const rows = await bodyRows("Old laptop");
    expect(within(rows[0]).queryByRole("button", { name: /Actions for/ })).toBe(
      null,
    );

    await userEvent.click(
      within(rows[1]).getByRole("button", { name: "Actions for Phone" }),
    );
    await userEvent.click(
      await screen.findByRole("menuitem", { name: /Sign out/ }),
    );
    await waitFor(() =>
      expect(api.sessions.revoke).toHaveBeenCalledWith("new"),
    );
  });
});
