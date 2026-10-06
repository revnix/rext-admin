/**
 * The drawer's Try again (D7) stays in the error state when the retry fails too, and clears it only
 * when the feed loads.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationsDrawer } from "@/components/notifications-drawer";
import {
  fetchNotifications,
  markNotificationsAsRead,
} from "@/services/notification-api";
import { useNotificationStore } from "@/stores/notification-store";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/lib/api-client", () => ({
  apiClient: {
    workspaces: { list: jest.fn().mockResolvedValue({ workspaces: [] }) },
  },
}));
jest.mock("@/services/notification-api", () => ({
  fetchNotifications: jest.fn(),
  markNotificationsAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  clearReadNotifications: jest.fn(),
}));

const fetchMock = fetchNotifications as jest.Mock;

function renderFailedDrawer() {
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    fetchError: "Failed to fetch notifications: 503",
  });
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <NotificationsDrawer open onClose={() => {}} />
    </QueryClientProvider>,
  );
}

describe("NotificationsDrawer, Try again", () => {
  beforeEach(() => jest.clearAllMocks());

  it("keeps the error when the retry fails too", async () => {
    fetchMock.mockRejectedValue(
      new Error("Failed to fetch notifications: 503"),
    );
    renderFailedDrawer();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith({
        force: true,
        throwOnError: true,
      }),
    );
    expect(
      await screen.findByText("Your notifications didn't load"),
    ).toBeInTheDocument();
  });

  it("clears the error once the feed loads", async () => {
    fetchMock.mockResolvedValue([]);
    renderFailedDrawer();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("You're all caught up")).toBeInTheDocument();
    expect(
      screen.queryByText("Your notifications didn't load"),
    ).not.toBeInTheDocument();
  });
});

describe("NotificationsDrawer, a row without a link", () => {
  it("is marked read when chosen", async () => {
    (markNotificationsAsRead as jest.Mock).mockResolvedValue(undefined);
    useNotificationStore.setState({
      notifications: [
        {
          id: "n-1",
          title: "Profile updated",
          message: "Your profile has been successfully updated.",
          type: "system",
          createdAt: new Date().toISOString(),
          read: false,
        },
      ],
      unreadCount: 1,
      isLoading: false,
      fetchError: null,
    });
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <NotificationsDrawer open onClose={() => {}} />
      </QueryClientProvider>,
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: /successfully updated.*mark as read/,
      }),
    );

    expect(markNotificationsAsRead).toHaveBeenCalledWith(["n-1"]);
  });
});
