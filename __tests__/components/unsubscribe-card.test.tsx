/**
 * The page every email's unsubscribe link opens (D20): no sign-in, nothing sent until the button is
 * pressed (mail scanners open links), and a clear answer for a link that doesn't work.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnsubscribeCard } from "@/components/auth/unsubscribe-card";

jest.mock("@/lib/api-client", () => {
  const { ApiError } = jest.requireActual("@/lib/api-client/core");
  return {
    ApiError,
    apiClient: { notifications: { unsubscribe: jest.fn() } },
  };
});

jest.mock("@/lib/logger", () => {
  const quiet = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
  return { log: quiet, logger: { forComponent: () => quiet } };
});

const { apiClient, ApiError } = jest.requireMock("@/lib/api-client") as {
  apiClient: { notifications: { unsubscribe: jest.Mock } };
  ApiError: new (status: number, message: string) => Error;
};

function renderCard(token: string | null) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <UnsubscribeCard token={token} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("the unsubscribe page", () => {
  it("sends nothing until the button is pressed, then unsubscribes with the link's token", async () => {
    apiClient.notifications.unsubscribe.mockResolvedValue({
      unsubscribed_from: "all",
    });
    renderCard("tok-123");

    expect(
      screen.getByRole("heading", { name: "Unsubscribe from Rext AI emails" }),
    ).toBeInTheDocument();
    expect(apiClient.notifications.unsubscribe).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Unsubscribe" }));

    expect(apiClient.notifications.unsubscribe).toHaveBeenCalledWith("tok-123");
    expect(
      await screen.findByRole("heading", { name: "You're unsubscribed" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Notification settings" }),
    ).toHaveAttribute("href", "/settings/notifications");
  });

  it("says the link doesn't work when it has no token", () => {
    renderCard(null);

    expect(
      screen.getByRole("heading", { name: "This link doesn't work" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Unsubscribe" }),
    ).not.toBeInTheDocument();
  });

  it("says the link doesn't work when the backend doesn't know its token", async () => {
    apiClient.notifications.unsubscribe.mockRejectedValue(
      new ApiError(404, "Invalid unsubscribe token"),
    );
    renderCard("unknown");

    await userEvent.click(screen.getByRole("button", { name: "Unsubscribe" }));

    expect(
      await screen.findByRole("heading", { name: "This link doesn't work" }),
    ).toBeInTheDocument();
  });

  it("offers another try when the request fails for another reason", async () => {
    apiClient.notifications.unsubscribe.mockRejectedValue(
      new ApiError(500, "Server error"),
    );
    renderCard("tok-123");

    await userEvent.click(screen.getByRole("button", { name: "Unsubscribe" }));

    expect(await screen.findByText("That didn't work")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unsubscribe" })).toBeEnabled();
  });
});
